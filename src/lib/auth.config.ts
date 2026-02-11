import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

/**
 * Edge-compatible auth config (no Prisma, no Node.js modules).
 * Used by middleware for JWT-based route protection.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
    error: "/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    // Credentials stub for middleware JWT verification (actual logic in auth.ts)
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: () => null,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "BUYER";
        token.sellerStatus = (user as { sellerStatus?: string | null }).sellerStatus ?? null;
      }
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.role = session.role ?? token.role;
        token.sellerStatus = session.sellerStatus ?? token.sellerStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.sellerStatus = token.sellerStatus as string | null;
      }
      return session;
    },
  },
};
