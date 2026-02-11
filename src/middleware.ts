import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Routes that require authentication
const protectedRoutes = ["/buyer", "/seller", "/admin", "/checkout"];

// Role-specific route prefixes
const roleRoutes: Record<string, string[]> = {
  BUYER: ["/buyer"],
  SELLER: ["/seller"],
  ADMIN: ["/admin", "/buyer", "/seller"],
};

// Auth pages that should redirect if already logged in
const authRoutes = ["/auth/login", "/auth/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && authRoutes.some((route) => pathname.startsWith(route))) {
    const role = session.user.role;
    const dashboardUrl = role === "ADMIN"
      ? "/admin/dashboard"
      : role === "SELLER"
      ? "/seller/dashboard"
      : "/buyer/dashboard";
    return NextResponse.redirect(new URL(dashboardUrl, req.nextUrl));
  }

  // Check if route requires authentication
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  if (isLoggedIn && isProtected) {
    const userRole = session.user.role;
    const allowedPrefixes = roleRoutes[userRole] || [];

    const hasAccess = allowedPrefixes.some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (!hasAccess) {
      const dashboardUrl = userRole === "ADMIN"
        ? "/admin/dashboard"
        : userRole === "SELLER"
        ? "/seller/dashboard"
        : "/buyer/dashboard";
      return NextResponse.redirect(new URL(dashboardUrl, req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/buyer/:path*",
    "/seller/:path*",
    "/admin/:path*",
    "/checkout/:path*",
    "/auth/:path*",
  ],
};
