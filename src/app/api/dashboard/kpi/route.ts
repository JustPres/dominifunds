export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const totalCollectedAgg = await prisma.transaction.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  const activePlans = await prisma.installmentPlan.count({
    where: { status: "ACTIVE" },
  });

  const overdueInstallments = await prisma.installmentEntry.count({
    where: { status: "OVERDUE" },
  });

  // Members with no overdue and no active installment
  const allStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      transactions: { where: { status: "OVERDUE" } },
      installmentPlans: { where: { status: "ACTIVE" } },
    },
  });
  const fullyPaidMembers = allStudents.filter(
    (s) => s.transactions.length === 0 && s.installmentPlans.length === 0
  ).length;

  return NextResponse.json({
    totalCollected: totalCollectedAgg._sum.amount || 0,
    activePlans,
    overdueInstallments,
    fullyPaidMembers,
  });
}
