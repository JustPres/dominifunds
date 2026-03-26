export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

export async function POST(
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

  const body = await request.json().catch(() => ({}));
  const note = String(body.note ?? "").trim();

  const restored = await prisma.collectionSchedule.update({
    where: { id: existing.id },
    data: { deletedAt: null },
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
    entityId: restored.id,
    action: "RESTORE",
    note: note || "Collection schedule restored.",
    beforeSnapshot: existing,
    afterSnapshot: restored,
  });

  return NextResponse.json({ success: true });
}
