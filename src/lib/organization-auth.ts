import { auth } from "@/lib/auth";
import { canManageOrganization } from "@/lib/officer-access";
import prisma from "@/lib/prisma";

async function resolveActiveOrgUser(orgId: string) {
  const session = await auth();

  if (!session?.user || session.user.orgId !== orgId) {
    return {
      ok: false as const,
      status: 401,
      message: "Unauthorized",
      session: null,
    };
  }

  const activeUser = await prisma.user.findFirst({
    where: {
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
      role: true,
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

  return {
    ok: true as const,
    status: 200,
    message: "",
    session: {
      ...session,
      user: {
        ...session.user,
        id: activeUser.id,
        name: activeUser.name,
        email: activeUser.email,
        role: activeUser.role,
        orgId: activeUser.orgId,
        orgRole: activeUser.orgRole,
        yearLevel: activeUser.yearLevel,
        officerAccessRole: activeUser.officerAccessRole,
        sectionId: activeUser.sectionId,
        lastLoginAt: activeUser.lastLoginAt?.toISOString() ?? null,
        mustChangePassword: Boolean(activeUser.mustChangePassword),
      },
    },
  };
}

export async function getAuthorizedOrganizationSession(orgId: string) {
  return resolveActiveOrgUser(orgId);
}

export async function getAuthorizedOfficerSession(orgId: string, options?: { requireManager?: boolean }) {
  const authorization = await resolveActiveOrgUser(orgId);

  if (!authorization.ok) {
    return authorization;
  }

  if (authorization.session.user.role !== "OFFICER") {
    return {
      ok: false as const,
      status: 401,
      message: "Unauthorized",
      session: null,
    };
  }

  if (options?.requireManager && !canManageOrganization(authorization.session.user)) {
    return {
      ok: false as const,
      status: 403,
      message: "Treasurer access required.",
      session: authorization.session,
    };
  }

  return authorization;
}
