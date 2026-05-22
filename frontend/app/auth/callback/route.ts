import { NextResponse } from "next/server";

// O callback OAuth é tratado automaticamente pelo NextAuth em /api/auth/callback/google
// Este arquivo existe apenas para compatibilidade com links antigos.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}
