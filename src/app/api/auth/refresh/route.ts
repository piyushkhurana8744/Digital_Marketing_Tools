import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import Session from "@/lib/models/Session";
import User from "@/lib/models/User";
import { signAccessToken, signRefreshToken, verifyToken, RefreshTokenPayload, cookieOptions } from "@/lib/auth/tokens";

// Hash token helper
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  const unauthorizedResponse = () => {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", redirectPath);
    
    const res = NextResponse.redirect(loginUrl);
    // Explicitly delete cookies
    res.cookies.set(cookieOptions.accessToken.name, "", { ...cookieOptions.accessToken.options, maxAge: 0 });
    res.cookies.set(cookieOptions.refreshToken.name, "", { ...cookieOptions.refreshToken.options, maxAge: 0 });
    return res;
  };

  if (!refreshToken) {
    return unauthorizedResponse();
  }

  try {
    const payload = await verifyToken<RefreshTokenPayload>(refreshToken);
    if (!payload) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const tokenHash = hashToken(payload.sessionId);

    // Look up current session record
    const session = await Session.findOne({ tokenHash });
    if (!session) {
      return unauthorizedResponse();
    }

    // Token Reuse / Replay Detection
    if (session.isRevoked) {
      // Security warning: Invalidate ALL active sessions for this user immediately
      await Session.updateMany({ userId: session.userId }, { isRevoked: true });
      return unauthorizedResponse();
    }

    // Confirm active user
    const user = await User.findById(session.userId);
    if (!user) {
      return unauthorizedResponse();
    }

    // Generate rotated session details
    const newSessionId = crypto.randomUUID();
    const newTokenHash = hashToken(newSessionId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    // Revoke old session and record lineage
    session.isRevoked = true;
    session.replacedByTokenHash = newTokenHash;
    await session.save();

    // Create newly rotated active session
    await Session.create({
      userId: user._id,
      tokenHash: newTokenHash,
      expiresAt,
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    // Sign rotated JWT access and refresh payloads
    const newAccessToken = await signAccessToken({ userId: user._id.toString(), role: user.role });
    const newRefreshToken = await signRefreshToken({ sessionId: newSessionId });

    // Set updated secure cookies and redirect user back
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.cookies.set(
      cookieOptions.accessToken.name,
      newAccessToken,
      cookieOptions.accessToken.options
    );
    response.cookies.set(
      cookieOptions.refreshToken.name,
      newRefreshToken,
      cookieOptions.refreshToken.options
    );

    return response;
  } catch (error) {
    console.error("Token refresh route error:", error);
    return unauthorizedResponse();
  }
}
