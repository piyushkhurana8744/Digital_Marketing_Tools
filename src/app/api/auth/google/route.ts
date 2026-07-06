import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: Request) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!googleClientId) {
    console.error("Missing GOOGLE_CLIENT_ID environment variable");
    return NextResponse.json(
      { error: "Google OAuth is not configured on the server." },
      { status: 500 }
    );
  }

  // Generate secure random state to protect against CSRF
  const state = crypto.randomBytes(32).toString("hex");

  // Create redirect URL to Google's OAuth consent page
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", googleClientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // Store state in secure HTTP-only cookie for verification on callback
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes in seconds
  });

  return response;
}
