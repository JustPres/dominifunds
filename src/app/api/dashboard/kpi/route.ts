export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncInstallmentStatuses } from "@/lib/member-report";

export async function GET() {
  const session = await auth();
  const orgId = session?.user?.orgId;

  if (!session?.user || session.user.role !== "OFFICER" || !orgId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await syncInstallmentStatuses(orgId);

  const totalCollectedAgg = await prisma.transaction.aggregate({
    where: { status: "PAID", deletedAt: null, member: { orgId } },
    _sum: { amount: true },
  });

  const activePlans = await prisma.installmentPlan.count({
    where: { status: "ACTIVE", deletedAt: null, member: { orgId } },
  });

  const overdueInstallments = await prisma.installmentEntry.count({
    where: { status: "OVERDUE", deletedAt: null, plan: { member: { orgId } } },
  });

  // Members with no overdue and no active installment
  const allStudents = await prisma.user.findMany({
    where: { role: "STUDENT", orgId, deactivatedAt: null },
    include: {
      transactions: { where: { status: "OVERDUE", deletedAt: null } },
      installmentPlans: { where: { status: "ACTIVE", deletedAt: null } },
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
