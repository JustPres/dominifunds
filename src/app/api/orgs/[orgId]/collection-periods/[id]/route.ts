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

  const existing = await prisma.collectionPeriod.findFirst({
    where: {
      id: params.id,
      orgId: params.orgId,
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Collection period not found." }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name === undefined ? undefined : String(body.name).trim();
  const startDate = body.startDate === undefined ? undefined : new Date(body.startDate);
  const endDate = body.endDate === undefined ? undefined : new Date(body.endDate);
  const isActive = body.isActive === undefined ? undefined : Boolean(body.isActive);
  const note = String(body.note ?? "").trim();

  const updated = await prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.collectionPeriod.updateMany({
        where: { orgId: params.orgId, isActive: true, id: { not: params.id } },
        data: { isActive: false },
      });
    }

    return tx.collectionPeriod.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(startDate !== undefined && !Number.isNaN(startDate.getTime()) ? { startDate } : {}),
        ...(endDate !== undefined && !Number.isNaN(endDate.getTime()) ? { endDate } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "COLLECTION_PERIOD",
    entityId: updated.id,
    action: "UPDATE",
    note: note || "Collection period updated.",
    beforeSnapshot: existing,
    afterSnapshot: updated,
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    startDate: updated.startDate.toISOString().split("T")[0],
    endDate: updated.endDate.toISOString().split("T")[0],
    isActive: updated.isActive,
  });
}
