import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import Session from "@/lib/models/Session";
import { signAccessToken, signRefreshToken, cookieOptions } from "@/lib/auth/tokens";
import { rateLimit } from "@/lib/auth/rate-limit";

// SHA-256 hash function to protect stored session identifiers
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || undefined;

  // Rate Limit: Limit to 10 login attempts per 15 minutes
  const rl = await rateLimit(ip, { limit: 10, windowMs: 15 * 60 * 1000 }, "login");
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    await connectToDatabase();

    // Retrieve user and check validity
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      // Return generic error to prevent account discovery audits
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Generate secure session details
    const sessionId = crypto.randomUUID();
    const tokenHash = hashToken(sessionId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress: ip,
    });

    // Sign JWT auth credentials
    const accessToken = await signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = await signRefreshToken({ sessionId });

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set secure HTTP-only cookie headers
    response.cookies.set(
      cookieOptions.accessToken.name,
      accessToken,
      cookieOptions.accessToken.options
    );
    
    response.cookies.set(
      cookieOptions.refreshToken.name,
      refreshToken,
      cookieOptions.refreshToken.options
    );

    return response;
  } catch (error) {
    console.error("Login endpoint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
