import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role as string | undefined;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  const isProtectedDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/investments") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  const isProtectedPortalRoute = pathname.startsWith("/portal");

  // 1. any unauthenticated user visiting any route except auth routes is redirected to /login
  if (!isLoggedIn && !isAuthRoute) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle Authenticated Users
  if (isLoggedIn) {
    // Keep auth pages accessible so users can switch accounts intentionally.
    // Only redirect the root path to the matching workspace.
    if (pathname === "/") {
      if (role === "STUDENT") {
        return NextResponse.redirect(new URL("/portal", req.nextUrl.origin));
      }
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }

    // 2. Authenticated users with role OFFICER visiting /portal are redirected to /dashboard
    if (isProtectedPortalRoute && role === "OFFICER") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }

    // 3. Authenticated users with role STUDENT visiting /dashboard or any /dashboard/* route are redirected to /portal.
    if (isProtectedDashboardRoute && role === "STUDENT") {
      return NextResponse.redirect(new URL("/portal", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
