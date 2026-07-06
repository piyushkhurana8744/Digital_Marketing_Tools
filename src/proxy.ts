import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, AccessTokenPayload } from "./lib/auth/tokens";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Initialize request headers cloned from request to sanitize/modify
  const requestHeaders = new Headers(request.headers);
  // Mitigate Client-Side Header Spoofing: Strip down downstream headers
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-role");

  // Check if target is a protected route
  const isProtectedRoute = pathname.startsWith("/dashboard");

  if (isProtectedRoute) {
    if (!accessToken) {
      // If access token is missing but refresh token exists, redirect to auto-renew endpoint
      if (refreshToken) {
        const refreshUrl = new URL("/api/auth/refresh", request.url);
        refreshUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(refreshUrl);
      }
      
      // No credentials found, redirect to sign-in page
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token validity
    const payload = await verifyToken<AccessTokenPayload>(accessToken);
    if (!payload) {
      // Access token expired, attempt auto-refresh if refresh token is present
      if (refreshToken) {
        const refreshUrl = new URL("/api/auth/refresh", request.url);
        refreshUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(refreshUrl);
      }
      
      // Invalidate corrupt cookies and redirect to sign-in
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    // Role-based Access Control: Enforce admin role restriction
    if (pathname.startsWith("/dashboard/admin") && payload.role !== "admin") {
      const unauthorizedUrl = new URL("/dashboard", request.url);
      unauthorizedUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Inject sanitized, validated credentials downstream
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Authentication page protection: Redirect already logged-in users to /dashboard
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isAuthPage && accessToken) {
    const payload = await verifyToken<AccessTokenPayload>(accessToken);
    if (payload) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Pass sanitized headers downstream for all other routes
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Intercept routing configs
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
