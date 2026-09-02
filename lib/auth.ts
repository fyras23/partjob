import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import type { Role } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id:        user.id,
          email:     user.email,
          name:      user.name,
          role:      user.role,
          avatarUrl: user.avatarUrl ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id        = user.id;
        token.role      = (user as { role: Role }).role;
        token.avatarUrl = (user as { avatarUrl?: string | null }).avatarUrl ?? null;
      }
      // Allow refreshing the token so avatarUrl updates are picked up
      if (trigger === "update") {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { avatarUrl: true },
        });
        token.avatarUrl = fresh?.avatarUrl ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id as string;
        session.user.role      = token.role as Role;
        session.user.avatarUrl = (token.avatarUrl ?? null) as string | null;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});

// ── Type augmentation ─────────────────────────────────────────────────────────

declare module "next-auth" {
  interface User {
    role: Role;
    avatarUrl?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      avatarUrl: string | null;
    };
  }
}
