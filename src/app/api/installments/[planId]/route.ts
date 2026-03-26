export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

export async function DELETE(
  request: Request,
  { params }: { params: { planId: string } }
) {
  const existing = await prisma.installmentPlan.findUnique({
    where: { id: params.planId },
    include: {
      member: true,
      fundType: true,
      entries: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Installment plan not found." }, { status: 404 });
  }

  if (!existing.member.orgId) {
    return NextResponse.json({ message: "Installment plan is missing an organization." }, { status: 400 });
  }

  const authorization = await getAuthorizedOfficerSession(existing.member.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.note ?? "").trim();
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.installmentEntry.updateMany({
      where: { planId: existing.id },
      data: { deletedAt: now },
    });

    return tx.installmentPlan.update({
      where: { id: existing.id },
      data: { deletedAt: now },
      include: {
        entries: true,
      },
    });
  });

  await createActivityLog({
    orgId: existing.member.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "INSTALLMENT_PLAN",
    entityId: updated.id,
    action: "DELETE",
    note: note || "Installment plan archived.",
    beforeSnapshot: existing,
    afterSnapshot: updated,
  });

  return NextResponse.json({ success: true });
}
