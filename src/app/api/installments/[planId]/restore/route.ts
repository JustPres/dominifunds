export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

export async function POST(
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

  const restored = await prisma.$transaction(async (tx) => {
    await tx.installmentEntry.updateMany({
      where: { planId: existing.id },
      data: { deletedAt: null },
    });

    return tx.installmentPlan.update({
      where: { id: existing.id },
      data: { deletedAt: null },
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
    entityId: restored.id,
    action: "RESTORE",
    note: note || "Installment plan restored.",
    beforeSnapshot: existing,
    afterSnapshot: restored,
  });

  return NextResponse.json({ success: true });
}
