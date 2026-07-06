import { connectToDatabase } from "@/lib/db";
import RateLimit from "@/lib/models/RateLimit";

interface RateLimitRule {
  limit: number;
  windowMs: number;
}

// In-memory cache fallback to store rate limit hits if DB is down
const inMemoryCache = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  ip: string,
  rule: RateLimitRule,
  context: string = "default"
): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> {
  const key = `rl:${ip}:${context}`;
  const now = Date.now();

  try {
    await connectToDatabase();
    
    let record = await RateLimit.findOne({ key });
    
    // If no record exists or the current time is past the window reset time, initialize new bucket
    if (!record || now > record.expiresAt.getTime()) {
      const expiresAt = new Date(now + rule.windowMs);
      
      if (record) {
        record.count = 1;
        record.expiresAt = expiresAt;
        await record.save();
      } else {
        try {
          record = await RateLimit.create({
            key,
            count: 1,
            expiresAt,
          });
        } catch (err) {
          // Handle duplicate key write races
          record = await RateLimit.findOne({ key });
          if (record) {
            record.count += 1;
            await record.save();
          }
        }
      }
      
      const count = record ? record.count : 1;
      const resetTime = record ? record.expiresAt.getTime() : now + rule.windowMs;
      
      return {
        success: count <= rule.limit,
        limit: rule.limit,
        remaining: Math.max(0, rule.limit - count),
        resetTime,
      };
    }
    
    // If count is equal to or greater than limit, block requests in this window
    if (record.count >= rule.limit) {
      return {
        success: false,
        limit: rule.limit,
        remaining: 0,
        resetTime: record.expiresAt.getTime(),
      };
    }
    
    record.count++;
    await record.save();
    
    return {
      success: true,
      limit: rule.limit,
      remaining: rule.limit - record.count,
      resetTime: record.expiresAt.getTime(),
    };
  } catch (error) {
    console.warn("MongoDB Rate Limiter error, falling back to in-memory: ", error);
    
    const record = inMemoryCache.get(key);
    
    if (!record || now > record.resetTime) {
      const resetTime = now + rule.windowMs;
      inMemoryCache.set(key, { count: 1, resetTime });
      return {
        success: true,
        limit: rule.limit,
        remaining: rule.limit - 1,
        resetTime,
      };
    }
    
    if (record.count >= rule.limit) {
      return {
        success: false,
        limit: rule.limit,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }
    
    record.count++;
    return {
      success: true,
      limit: rule.limit,
      remaining: rule.limit - record.count,
      resetTime: record.resetTime,
    };
  }
}
