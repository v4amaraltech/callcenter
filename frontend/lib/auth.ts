import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(pool),

  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: "v4company.com",
          prompt: "select_account",
        },
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user }) {
      if (!user.email?.endsWith("@v4company.com")) return false;

      // Garantir registro em user_approvals (substitui o trigger do Supabase)
      await pool.query(
        `INSERT INTO user_approvals (user_id, email)
         SELECT id, email FROM users WHERE email = $1
         ON CONFLICT (user_id) DO NOTHING`,
        [user.email]
      );

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      // Sempre re-checar aprovação do banco para refletir mudanças do admin
      if (token.userId) {
        const res = await pool.query(
          "SELECT approved, admin FROM user_approvals WHERE user_id = $1",
          [token.userId]
        );
        token.approved = res.rows[0]?.approved ?? false;
        token.admin    = res.rows[0]?.admin    ?? false;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id       = token.userId as string;
      session.user.approved = token.approved as boolean;
      session.user.admin    = token.admin    as boolean;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },
});
