import { auth } from "@/lib/auth";
import { canManageOrganization } from "@/lib/officer-access";

export async function getAuthorizedOfficerSession(orgId: string, options?: { requireManager?: boolean }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "OFFICER" || session.user.orgId !== orgId) {
    return {
      ok: false as const,
      status: 401,
      message: "Unauthorized",
      session: null,
    };
  }

  if (options?.requireManager && !canManageOrganization(session.user)) {
    return {
      ok: false as const,
      status: 403,
      message: "Treasurer access required.",
      session,
    };
  }

  return {
    ok: true as const,
    status: 200,
    message: "",
    session,
  };
}
