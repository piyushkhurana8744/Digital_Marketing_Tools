import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { verifyToken, AccessTokenPayload } from "@/lib/auth/tokens";
import { connectToDatabase } from "@/lib/db";
import User, { IUser } from "@/lib/models/User";

/**
 * Retrieves the session payload from the access_token cookie without throwing.
 * Useful for optionally authenticated pages or layouts.
 */
export const getSession = cache(async (): Promise<AccessTokenPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  
  if (!token) {
    return null;
  }
  
  const payload = await verifyToken<AccessTokenPayload>(token);
  return payload;
});

/**
 * Retrieves the session payload, redirecting to login if missing or invalid.
 * Useful for protected routes and actions.
 */
export const verifySession = cache(async (): Promise<AccessTokenPayload> => {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  return session;
});

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | "editor";
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
}

/**
 * Retrieves the authenticated user record from MongoDB (DTO mapping).
 * Memoized per request using React cache.
 */
export const getCurrentUser = cache(async (): Promise<UserDTO | null> => {
  const session = await getSession();
  if (!session) return null;
  
  try {
    await connectToDatabase();
    const user = await User.findById(session.userId).lean() as IUser | null;
    
    if (!user) return null;
    
    // Data Transfer Object: select only public fields, omit passwordHash
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching current user in DAL:", error);
    return null;
  }
});
