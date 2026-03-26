import type {
  ActivityAction,
  ActivityEntityType,
  OfficerAccessRole,
  Prisma,
} from "@prisma/client";
import prisma from "@/lib/prisma";

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
  return prisma.activityLog.create({
    data: {
      orgId: input.orgId,
      actorUserId: input.actorUserId ?? null,
      actorOfficerRole: input.actorOfficerRole ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      note: input.note ?? null,
      beforeSnapshot: sanitizeSnapshot(input.beforeSnapshot),
      afterSnapshot: sanitizeSnapshot(input.afterSnapshot),
    },
  });
}

export function sanitizeSnapshot<T>(value: T): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) return null;

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
