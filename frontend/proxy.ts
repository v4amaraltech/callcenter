import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const session = request.auth;
  const { pathname } = request.nextUrl;

  const isLoginPage   = pathname.startsWith("/login");
  const isAuthRoute   = pathname.startsWith("/api/auth");
  const isPendingPage = pathname.startsWith("/pending");

  const user = session?.user as
    | { id?: string; email?: string; approved?: boolean }
    | undefined;

  const hasSession = Boolean(user?.email);
  const approved = user?.approved;

  // Sem sessão → login
  if (!hasSession) {
    if (!isLoginPage && !isAuthRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Sessão incompleta (cookie antigo / token sem approved) → login, não pending
  if (!user?.id || approved === undefined) {
    if (!isLoginPage && !isAuthRoute) {
      return NextResponse.redirect(
        new URL("/login?error=SessionExpired", request.url)
      );
    }
    return NextResponse.next();
  }

  // Login: só redireciona se aprovação estiver definida
  if (isLoginPage) {
    return NextResponse.redirect(
      new URL(approved ? "/" : "/pending", request.url)
    );
  }

  // Conta criada, aguardando aprovação do admin
  if (approved === false && !isPendingPage && !isAuthRoute) {
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  if (approved === true && isPendingPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
