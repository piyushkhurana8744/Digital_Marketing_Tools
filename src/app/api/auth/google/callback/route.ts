import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import Session from "@/lib/models/Session";
import { signAccessToken, signRefreshToken, cookieOptions } from "@/lib/auth/tokens";

// Google JWKS URL to verify id_token signatures
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("google_oauth_state")?.value;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  // CSRF state verification
  if (!state || !stateCookie || state !== stateCookie) {
    return NextResponse.json(
      { error: "Invalid state parameter. Possible Cross-Site Request Forgery (CSRF)." },
      { status: 400 }
    );
  }

  // Clear state cookie
  cookieStore.delete("google_oauth_state");

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code from Google OAuth response." },
      { status: 400 }
    );
  }

  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      console.error("Missing Google OAuth credentials in environment variables");
      return NextResponse.json(
        { error: "Google OAuth is not configured on the server." },
        { status: 500 }
      );
    }

    // Exchange auth code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google token exchange error:", tokenData);
      return NextResponse.json(
        { error: tokenData.error_description || "Failed to exchange authorization code." },
        { status: 400 }
      );
    }

    const { id_token } = tokenData;

    if (!id_token) {
      return NextResponse.json(
        { error: "Google OAuth did not return an ID token." },
        { status: 400 }
      );
    }

    // Verify ID Token (JWT) from Google using Google's public certificates
    const { payload } = await jwtVerify(id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: googleClientId,
    });

    const googleId = payload.sub; // Unique Google Identifier
    const email = payload.email as string;
    const name = payload.name as string;
    const avatarUrl = payload.picture as string | undefined;

    if (!email) {
      return NextResponse.json(
        { error: "Google OAuth did not share user email." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user by googleId, or by email to link account
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // If user exists by email but googleId is not linked, link it
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.isVerified) {
        user.isVerified = true; // Email verified by Google
        updated = true;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // Create new user for Google login
      user = await User.create({
        email: email.toLowerCase(),
        name,
        googleId,
        avatarUrl,
        isVerified: true,
        role: "user",
      });
    }

    // Generate secure session details
    const sessionId = crypto.randomUUID();
    const tokenHash = hashToken(sessionId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    // Record session logs in MongoDB
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || undefined;

    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress: ip,
    });

    // Sign JWT access and refresh tokens
    const accessToken = await signAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });
    const refreshToken = await signRefreshToken({ sessionId });

    // Set secure HTTP-only cookies and redirect to Dashboard
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    
    redirectResponse.cookies.set(
      cookieOptions.accessToken.name,
      accessToken,
      cookieOptions.accessToken.options
    );
    
    redirectResponse.cookies.set(
      cookieOptions.refreshToken.name,
      refreshToken,
      cookieOptions.refreshToken.options
    );

    return redirectResponse;
  } catch (error) {
    console.error("Google OAuth callback endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred during Google authentication." },
      { status: 500 }
    );
  }
}
