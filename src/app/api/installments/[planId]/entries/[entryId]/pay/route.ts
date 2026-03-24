import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { planId: string; entryId: string } }
) {
  const { planId, entryId } = params;

  // Mark the entry as PAID
  await prisma.installmentEntry.update({
    where: { id: entryId },
    data: { status: "PAID" },
  });

  // Also create a corresponding transaction record
  const plan = await prisma.installmentPlan.findUnique({
    where: { id: planId },
    include: { entries: true, fundType: true },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const entry = plan.entries.find((e) => e.id === entryId);
  if (entry) {
    const entryIndex = plan.entries.findIndex((e) => e.id === entryId) + 1;
    await prisma.transaction.create({
      data: {
        memberId: plan.memberId,
        fundTypeId: plan.fundTypeId,
        type: "INSTALLMENT_PAYMENT",
        status: "PAID",
        amount: entry.amountDue,
        installmentInfo: `Installment ${entryIndex} of ${plan.entries.length}`,
      },
    });
  }

  // Check if all entries are paid → mark plan as COMPLETED
  const allEntries = await prisma.installmentEntry.findMany({
    where: { planId },
  });

  const allPaid = allEntries.every((e) => e.status === "PAID");
  if (allPaid) {
    await prisma.installmentPlan.update({
      where: { id: planId },
      data: { status: "COMPLETED" },
    });
  }

  return NextResponse.json({ success: true });
}
