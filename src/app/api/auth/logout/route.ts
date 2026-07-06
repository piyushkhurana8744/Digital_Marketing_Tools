import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import Session from "@/lib/models/Session";
import { verifyToken, RefreshTokenPayload, cookieOptions } from "@/lib/auth/tokens";

// Hashing utility to resolve token references
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  try {
    if (refreshToken) {
      const payload = await verifyToken<RefreshTokenPayload>(refreshToken);
      if (payload) {
        await connectToDatabase();
        const tokenHash = hashToken(payload.sessionId);
        
        // Revoke active session logs
        await Session.updateOne({ tokenHash }, { isRevoked: true });
      }
    }
  } catch (error) {
    console.error("Logout session revocation error:", error);
  }

  const response = NextResponse.json({ message: "Logout successful" });
  
  // Explicitly clear cookies from clients
  response.cookies.set(cookieOptions.accessToken.name, "", { ...cookieOptions.accessToken.options, maxAge: 0 });
  response.cookies.set(cookieOptions.refreshToken.name, "", { ...cookieOptions.refreshToken.options, maxAge: 0 });

  return response;
}
