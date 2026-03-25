import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // The real providers are added in auth.ts securely on the server
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.orgId = user.orgId;
        token.orgRole = user.orgRole;
        token.yearLevel = user.yearLevel;
        token.lastLoginAt = user.lastLoginAt;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.name = (token.name ?? "") as string;
      session.user.email = (token.email ?? "") as string;
      session.user.role = token.role as "OFFICER" | "STUDENT";
      session.user.orgId = token.orgId as string | null;
      session.user.orgRole = token.orgRole as string | null;
      session.user.yearLevel = token.yearLevel as string | null;
      session.user.lastLoginAt = token.lastLoginAt as string | null;
      return session;
    },
  },
} satisfies NextAuthConfig;
