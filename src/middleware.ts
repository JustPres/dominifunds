import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

export default NextAuth(authConfig).auth((/* req */) => {
  // const { pathname } = req.nextUrl;
  // const isLoggedIn = !!req.auth;

  // Protect /dashboard/* routes
  //if (pathname.startsWith("/dashboard") && !isLoggedIn) {
  //const loginUrl = new URL("/login", req.nextUrl.origin);
  //loginUrl.searchParams.set("callbackUrl", pathname);
  //return NextResponse.redirect(loginUrl);
  //}

  // Protect /portal/* routes
  //if (pathname.startsWith("/portal") && !isLoggedIn) {
  //const loginUrl = new URL("/login", req.nextUrl.origin);
  //loginUrl.searchParams.set("callbackUrl", pathname);
  //return NextResponse.redirect(loginUrl);
  //}

  return NextResponse.next();
});

export const config = {
  // matcher: ["/dashboard/:path*", "/portal/:path*"],
};
