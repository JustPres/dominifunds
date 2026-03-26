export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

export async function PATCH(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await prisma.collectionSchedule.findFirst({
    where: {
      id: params.id,
      orgId: params.orgId,
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Collection schedule not found." }, { status: 404 });
  }

  const body = await request.json();
  const weekdays = Array.isArray(body.weekdays)
    ? body.weekdays.map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value) && value >= 0 && value <= 6)
    : undefined;
  const note = String(body.note ?? "").trim();

  const updated = await prisma.collectionSchedule.update({
    where: { id: existing.id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name ?? "").trim() || null } : {}),
      ...(body.memberId !== undefined ? { memberId: body.memberId ? String(body.memberId) : null } : {}),
      ...(body.collectionPeriodId !== undefined ? { collectionPeriodId: String(body.collectionPeriodId) } : {}),
      ...(weekdays !== undefined ? { weekdays } : {}),
      ...(body.note !== undefined ? { note: String(body.note ?? "").trim() || null } : {}),
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "COLLECTION_SCHEDULE",
    entityId: updated.id,
    action: "UPDATE",
    note: note || "Collection schedule updated.",
    beforeSnapshot: existing,
    afterSnapshot: updated,
  });

  return NextResponse.json({
    id: updated.id,
    collectionPeriodId: updated.collectionPeriodId,
    memberId: updated.memberId,
    memberName: updated.member?.name ?? null,
    scope: updated.scope,
    name: updated.name,
    weekdays: updated.weekdays,
    note: updated.note,
    deletedAt: updated.deletedAt?.toISOString() ?? null,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.note ?? "").trim();

  const existing = await prisma.collectionSchedule.findFirst({
    where: {
      id: params.id,
      orgId: params.orgId,
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Collection schedule not found." }, { status: 404 });
  }

  const updated = await prisma.collectionSchedule.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
    include: {
      member: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "COLLECTION_SCHEDULE",
    entityId: updated.id,
    action: "DELETE",
    note: note || "Collection schedule archived.",
    beforeSnapshot: existing,
    afterSnapshot: updated,
  });

  return NextResponse.json({ success: true });
}
