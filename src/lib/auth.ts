import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { consumeVerifiedLoginToken } from "@/lib/auth-login";
import { Role } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        role: { label: "Role", type: "text" },
        verificationToken: { label: "Verification Token", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const selectedRole = credentials?.role as string | undefined;
        const verificationToken = credentials?.verificationToken as string | undefined;

        if (!email || !selectedRole || !verificationToken) {
          throw new Error("Missing verified login credentials.");
        }

        const user = await consumeVerifiedLoginToken(
          email,
          selectedRole as Role,
          verificationToken
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
          orgRole: user.orgRole,
          yearLevel: user.yearLevel,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        };
      },
    }),
  ],
});
