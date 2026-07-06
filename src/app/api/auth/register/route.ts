import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { rateLimit } from "@/lib/auth/rate-limit";

// Basic email regex validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Extract client IP for rate limiting
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  
  // Rate limit registration endpoint to 5 attempts per hour per IP (distributed-safe)
  const rl = await rateLimit(ip, { limit: 5, windowMs: 60 * 60 * 1000 }, "register");
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again in an hour." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, name, password } = body;

    // Validate request inputs
    if (!email || !name || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (trimmedName.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters long." }, { status: 400 });
    }

    // Password Complexity: min 8 chars, at least one letter and one number
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }
    
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one letter and one number." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Prevent duplicate registrations (case-insensitive due to forced lowercase)
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 400 });
    }

    // Securely hash password using bcrypt (12 salt rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      email: trimmedEmail,
      name: trimmedName,
      passwordHash,
      role: "user",
      isVerified: false,
    });

    return NextResponse.json({ message: "Registration successful." }, { status: 201 });
  } catch (error) {
    console.error("Registration endpoint error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
