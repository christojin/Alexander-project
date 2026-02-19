import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

/**
 * Full auth configuration with Prisma adapter.
 * Only used in server-side code (NOT middleware/edge).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // Keep non-credentials providers from config
    ...authConfig.providers.filter(
      (p) => (p as { id?: string }).id !== "credentials"
    ),
    // Override credentials with real authorize logic
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { sellerProfile: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("ACCOUNT_DISABLED");
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role,
          sellerStatus: user.sellerProfile?.status ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id as string;

        // For OAuth users (Google, etc.), fetch role from database
        if (account?.provider !== "credentials") {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id as string },
            include: { sellerProfile: true },
          });
          token.role = dbUser?.role ?? "BUYER";
          token.sellerStatus = dbUser?.sellerProfile?.status ?? null;
        } else {
          token.role = (user as { role?: string }).role ?? "BUYER";
          token.sellerStatus = (user as { sellerStatus?: string | null }).sellerStatus ?? null;
        }
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
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (existingUser && !existingUser.isActive) {
          return false;
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      console.log(`[Auth] New user created via OAuth: ${user.email}`);
    },
  },
});
