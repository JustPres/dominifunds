import { auth } from "@/lib/auth";
import { canManageOrganization } from "@/lib/officer-access";
import prisma from "@/lib/prisma";

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

  const activeUser = await prisma.user.findFirst({
    where: {
      role: "OFFICER",
      orgId,
      OR: [
        {
          id: session.user.id,
        },
        ...(session.user.email
          ? [
              {
                email: session.user.email,
              },
            ]
          : []),
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      orgId: true,
      orgRole: true,
      yearLevel: true,
      officerAccessRole: true,
      sectionId: true,
      lastLoginAt: true,
      mustChangePassword: true,
      deactivatedAt: true,
    },
  });

  if (!activeUser || activeUser.deactivatedAt) {
    return {
      ok: false as const,
      status: 401,
      message: "Account is inactive.",
      session: null,
    };
  }

  const resolvedSession = {
    ...session,
    user: {
      ...session.user,
      id: activeUser.id,
      name: activeUser.name,
      email: activeUser.email,
      orgId: activeUser.orgId,
      orgRole: activeUser.orgRole,
      yearLevel: activeUser.yearLevel,
      officerAccessRole: activeUser.officerAccessRole,
      sectionId: activeUser.sectionId,
      lastLoginAt: activeUser.lastLoginAt?.toISOString() ?? null,
      mustChangePassword: Boolean(activeUser.mustChangePassword),
    },
  };

  if (options?.requireManager && !canManageOrganization(resolvedSession.user)) {
    return {
      ok: false as const,
      status: 403,
      message: "Treasurer access required.",
      session: resolvedSession,
    };
  }

  return {
    ok: true as const,
    status: 200,
    message: "",
    session: resolvedSession,
  };
}
