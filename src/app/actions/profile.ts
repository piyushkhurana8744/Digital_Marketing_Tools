"use server";

import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { verifySession } from "@/lib/auth/dal";
import { signAccessToken, cookieOptions } from "@/lib/auth/tokens";

/**
 * Server Action to update the user's display name.
 */
export async function updateProfile(name: string) {
  const session = await verifySession();
  
  if (!name || name.trim().length < 2) {
    return { error: "Name must be at least 2 characters long." };
  }

  try {
    await connectToDatabase();
    
    await User.findByIdAndUpdate(session.userId, {
      name: name.trim(),
    });

    // Revalidate dashboard routes to reflect name changes
    // Next.js uses next/cache for revalidatePath
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");

    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
    console.error("Error updating profile Server Action:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}

/**
 * Server Action to change the user's role on-the-fly.
 * Dynamically re-signs the access token to update the role in real-time.
 */
export async function updateUserRole(role: "user" | "admin" | "editor") {
  const session = await verifySession();

  if (!["user", "admin", "editor"].includes(role)) {
    return { error: "Invalid role selection." };
  }

  try {
    await connectToDatabase();

    // 1. Update user role in database
    await User.findByIdAndUpdate(session.userId, { role });

    // 2. Generate a new Access Token with the updated role
    const newAccessToken = await signAccessToken({
      userId: session.userId,
      role,
    });

    // 3. Set the updated token cookie
    const cookieStore = await cookies();
    cookieStore.set(
      cookieOptions.accessToken.name,
      newAccessToken,
      cookieOptions.accessToken.options
    );

    // 4. Revalidate layouts to update navigation controls
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/admin");

    return { success: true, message: `Role changed to ${role} successfully. Access token rotated.` };
  } catch (error) {
    console.error("Error updating user role Server Action:", error);
    return { error: "Failed to update user role." };
  }
}
