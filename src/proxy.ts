import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const role = req.auth?.user?.role;
  const isLoggedIn = !!req.auth;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");

  if (!isLoggedIn && (isAdminRoute || isPortalRoute)) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", nextUrl.origin));
  }

  if (isPortalRoute && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/login", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
