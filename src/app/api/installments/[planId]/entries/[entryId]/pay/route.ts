export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { planId: string; entryId: string } }
) {
  const { planId, entryId } = params;

  const plan = await prisma.installmentPlan.findUnique({
    where: { id: planId },
    include: {
      entries: {
        where: { deletedAt: null },
        orderBy: { dueDate: "asc" },
      },
      fundType: true,
      member: { select: { orgId: true, name: true } },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (!plan.member.orgId) {
    return NextResponse.json({ error: "Plan is missing an organization." }, { status: 400 });
  }

  const authorization = await getAuthorizedOfficerSession(plan.member.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.message }, { status: authorization.status });
  }

  const body = await request.json().catch(() => ({}));
  const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
  const note = String(body.note ?? "").trim();

  if (Number.isNaN(paidAt.getTime())) {
    return NextResponse.json({ error: "Invalid payment date." }, { status: 400 });
  }

  const entry = plan.entries.find((installmentEntry) => installmentEntry.id === entryId);

  if (!entry) {
    return NextResponse.json({ error: "Installment entry not found." }, { status: 404 });
  }

  await prisma.installmentEntry.update({
    where: { id: entryId },
    data: {
      status: "PAID",
      paidAt,
    },
  });

  const entryIndex = plan.entries.findIndex((installmentEntry) => installmentEntry.id === entryId) + 1;

  const transaction = await prisma.transaction.create({
    data: {
      memberId: plan.memberId,
      fundTypeId: plan.fundTypeId,
      collectionPeriodId: plan.collectionPeriodId ?? null,
      type: "INSTALLMENT_PAYMENT",
      status: "PAID",
      amount: entry.amountDue,
      paidAt,
      dueDate: entry.dueDate,
      note: note || null,
      installmentInfo: `Installment ${entryIndex} of ${plan.entries.length}`,
    },
  });

  const allEntries = await prisma.installmentEntry.findMany({
    where: { planId, deletedAt: null },
  });

  const allPaid = allEntries.every((installmentEntry) => installmentEntry.status === "PAID");

  if (allPaid) {
    await prisma.installmentPlan.update({
      where: { id: planId },
      data: { status: "COMPLETED" },
    });
  }

  await createActivityLog({
    orgId: authorization.session.user.orgId ?? plan.member.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "INSTALLMENT_ENTRY",
    entityId: entryId,
    action: "INSTALLMENT_RECORD",
    note: note || "Installment payment recorded.",
    afterSnapshot: {
      id: entry.id,
      planId: plan.id,
      memberId: plan.memberId,
      memberName: plan.member.name,
      fundTypeId: plan.fundTypeId,
      fundTypeName: plan.fundType.name,
      amountDue: entry.amountDue,
      dueDate: entry.dueDate.toISOString(),
      paidAt: paidAt.toISOString(),
      transactionId: transaction.id,
      installmentInfo: `Installment ${entryIndex} of ${plan.entries.length}`,
    },
  });

  return NextResponse.json({ success: true });
}
