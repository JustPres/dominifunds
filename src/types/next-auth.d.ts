import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OFFICER" | "STUDENT";
      orgId: string | null;
      orgRole: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "OFFICER" | "STUDENT";
    orgId: string | null;
    orgRole: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "OFFICER" | "STUDENT";
    orgId: string | null;
    orgRole: string | null;
  }
}
