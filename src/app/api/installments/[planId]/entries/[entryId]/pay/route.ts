export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { planId: string; entryId: string } }
) {
  const { planId, entryId } = params;
  const session = await auth();

  if (!session?.user || session.user.role !== "OFFICER" || !session.user.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await prisma.installmentPlan.findUnique({
    where: { id: planId },
    include: { entries: true, fundType: true, member: { select: { orgId: true } } },
  });

  if (!plan || plan.member.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  await prisma.installmentEntry.update({
    where: { id: entryId },
    data: { status: "PAID" },
  });

  const entry = plan.entries.find((installmentEntry) => installmentEntry.id === entryId);

  if (entry) {
    const entryIndex = plan.entries.findIndex((installmentEntry) => installmentEntry.id === entryId) + 1;

    await prisma.transaction.create({
      data: {
        memberId: plan.memberId,
        fundTypeId: plan.fundTypeId,
        type: "INSTALLMENT_PAYMENT",
        status: "PAID",
        amount: entry.amountDue,
        dueDate: entry.dueDate,
        installmentInfo: `Installment ${entryIndex} of ${plan.entries.length}`,
      },
    });
  }

  const allEntries = await prisma.installmentEntry.findMany({
    where: { planId },
  });

  const allPaid = allEntries.every((installmentEntry) => installmentEntry.status === "PAID");

  if (allPaid) {
    await prisma.installmentPlan.update({
      where: { id: planId },
      data: { status: "COMPLETED" },
    });
  }

  return NextResponse.json({ success: true });
}
