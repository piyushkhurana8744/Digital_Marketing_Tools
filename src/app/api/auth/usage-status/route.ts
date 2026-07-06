import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import AnonymousUsage from "@/lib/models/AnonymousUsage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryVisitorId = searchParams.get("visitorId");

  const session = await getSession();
  
  // 1. If user is logged in, they bypass the limits check (unlimited)
  if (session) {
    return NextResponse.json({
      loggedIn: true,
      count: 0,
      maxCount: 3,
    });
  }

  // 2. Resolve anonymous visitor
  const cookieStore = await cookies();
  const visitorId = cookieStore.get("visitor_id")?.value || queryVisitorId;

  if (!visitorId) {
    return NextResponse.json({
      loggedIn: false,
      count: 0,
      maxCount: 3,
    });
  }

  try {
    await connectToDatabase();
    const usage = await AnonymousUsage.findOne({ visitorId });
    
    return NextResponse.json({
      loggedIn: false,
      count: usage ? usage.count : 0,
      maxCount: 3,
    });
  } catch (error) {
    console.error("Error reading usage status API:", error);
    return NextResponse.json({
      loggedIn: false,
      count: 0,
      maxCount: 3,
    });
  }
}
