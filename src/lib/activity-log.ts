import type {
  ActivityAction,
  ActivityEntityType,
  OfficerAccessRole,
  Prisma,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { inferOfficerAccessRole } from "@/lib/officer-access";

interface ActivityLogInput {
  orgId: string;
  actorUserId?: string | null;
  actorOfficerRole?: OfficerAccessRole | null;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  note?: string | null;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
}

export async function createActivityLog(input: ActivityLogInput) {
  try {
    const actor =
      input.actorUserId
        ? await prisma.user.findUnique({
            where: { id: input.actorUserId },
            select: {
              name: true,
              email: true,
              officerAccessRole: true,
              orgRole: true,
            },
          })
        : null;

    return await prisma.activityLog.create({
      data: {
        orgId: input.orgId,
        actorUserId: input.actorUserId ?? null,
        actorOfficerRole: input.actorOfficerRole ?? null,
        actorNameSnapshot: actor?.name ?? null,
        actorEmailSnapshot: actor?.email ?? null,
        actorOfficerRoleSnapshot:
          input.actorOfficerRole ?? inferOfficerAccessRole(actor?.officerAccessRole, actor?.orgRole) ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        note: input.note ?? null,
        beforeSnapshot: sanitizeSnapshot(input.beforeSnapshot),
        afterSnapshot: sanitizeSnapshot(input.afterSnapshot),
      },
    });
  } catch (error) {
    console.error("[activity-log] Failed to persist activity log", {
      orgId: input.orgId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      error,
    });
    return null;
  }
}

export function sanitizeSnapshot<T>(value: T): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) return null;

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
