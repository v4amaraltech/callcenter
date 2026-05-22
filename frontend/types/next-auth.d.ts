import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:       string;
      approved: boolean;
      admin:    boolean;
    } & DefaultSession["user"];
  }

  interface User {
    approved?: boolean;
    admin?:    boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?:  string;
    approved?: boolean;
    admin?:   boolean;
  }
}
