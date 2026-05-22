import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const session = request.auth;
  const { pathname } = request.nextUrl;

  const isLoginPage    = pathname.startsWith("/login");
  const isAuthRoute    = pathname.startsWith("/api/auth");
  const isPendingPage  = pathname.startsWith("/pending");

  if (!session && !isLoginPage && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session && !isLoginPage && !isAuthRoute) {
    const approved = (session.user as { approved?: boolean })?.approved;

    if (!approved && !isPendingPage) {
      return NextResponse.redirect(new URL("/pending", request.url));
    }

    if (approved && isPendingPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
