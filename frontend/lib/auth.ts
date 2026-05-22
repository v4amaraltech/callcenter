import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.AUTH_DEBUG === "true",

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
      // Verificar domínio — adapter ainda não criou o usuário aqui
      if (!user.email?.endsWith("@v4company.com")) return false;
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // Primeiro login: adapter acabou de criar o usuário no DB
        token.userId = user.id;

        // Criar registro em user_approvals (não aprovado por padrão)
        try {
          await pool.query(
            `INSERT INTO user_approvals (user_id, email)
             VALUES ($1, $2)
             ON CONFLICT (user_id) DO NOTHING`,
            [user.id, user.email]
          );
        } catch { /* ignora conflito */ }

        // Bootstrap: primeiro admin (migração)
        const bootstrapAdmins = [
          "kaique.nascimento@v4company.com",
        ];
        if (user.email && bootstrapAdmins.includes(user.email)) {
          await pool.query(
            `UPDATE user_approvals
             SET approved = true, admin = true, approved_at = NOW()
             WHERE user_id = $1`,
            [user.id]
          );
        }

        // Buscar status de aprovação
        try {
          const res = await pool.query(
            "SELECT approved, admin FROM user_approvals WHERE user_id = $1",
            [user.id]
          );
          token.approved = res.rows[0]?.approved ?? false;
          token.admin    = res.rows[0]?.admin    ?? false;
        } catch {
          token.approved = false;
          token.admin    = false;
        }
      }

      // Sem user (requests subsequentes / middleware Edge): retorna token como está
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (typeof token.approved === "boolean") {
        session.user.approved = token.approved;
      }
      if (typeof token.admin === "boolean") {
        session.user.admin = token.admin;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },
});
