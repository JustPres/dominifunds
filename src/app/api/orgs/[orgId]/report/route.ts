import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncInstallmentStatuses } from "@/lib/member-report";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const { searchParams } = new URL(request.url);
  const orgId = params.orgId;
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);

  await syncInstallmentStatuses(orgId);

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  // Monthly collections
  const transactions = await prisma.transaction.findMany({
    where: {
      status: "PAID",
      createdAt: { gte: startDate, lte: endDate },
      member: { orgId },
    },
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyCollections = monthNames.map((month, idx) => {
    const amount = transactions
      .filter((t) => t.createdAt.getMonth() === idx)
      .reduce((sum, t) => sum + t.amount, 0);
    return { month, amount };
  });

  const totalCollected = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Installment plans
  const plans = await prisma.installmentPlan.findMany({
    where: { member: { orgId } },
    include: {
      member: true,
      fundType: true,
      entries: true,
    },
  });

  const installmentPlansCreated = plans.length;
  const completedPlans = plans.filter((p) => p.status === "COMPLETED").length;
  const completionRatePercent = installmentPlansCreated > 0
    ? Math.round((completedPlans / installmentPlansCreated) * 100)
    : 0;

  // Collection rate: paid vs total expected
  const allFunds = await prisma.fundType.findMany({ where: { orgId } });
  const totalMembers = await prisma.user.count({ where: { orgId, role: "STUDENT", deactivatedAt: null } });
  const totalExpected = allFunds.reduce((sum, f) => sum + f.amount, 0) * totalMembers;
  const collectionRatePercent = totalExpected > 0
    ? Math.round((totalCollected / totalExpected) * 100)
    : 0;

  // Standings
  const allStudents = await prisma.user.findMany({
    where: { orgId, role: "STUDENT", deactivatedAt: null },
    include: {
      transactions: { where: { status: "OVERDUE" } },
      installmentPlans: { where: { status: "ACTIVE" } },
    },
  });

  let goodStanding = 0;
  let activeInstallment = 0;
  let overdue = 0;

  for (const s of allStudents) {
    if (s.transactions.length > 0) {
      overdue++;
    } else if (s.installmentPlans.length > 0) {
      activeInstallment++;
    } else {
      goodStanding++;
    }
  }

  const total = allStudents.length || 1;
  const standings = {
    goodStanding: { count: goodStanding, percent: Math.round((goodStanding / total) * 100) },
    activeInstallment: { count: activeInstallment, percent: Math.round((activeInstallment / total) * 100) },
    overdue: { count: overdue, percent: Math.round((overdue / total) * 100) },
  };

  // Fund breakdowns
  const fundBreakdowns = await Promise.all(
    allFunds.map(async (f) => {
      const fundTx = await prisma.transaction.findMany({
        where: { fundTypeId: f.id, status: "PAID", createdAt: { gte: startDate, lte: endDate } },
      });
      const fundTotal = fundTx.reduce((sum, t) => sum + t.amount, 0);
      const installmentSplit = fundTx.filter((t) => t.type === "INSTALLMENT_PAYMENT").reduce((sum, t) => sum + t.amount, 0);
      const fullPaymentSplit = fundTx.filter((t) => t.type === "FULL_PAYMENT").reduce((sum, t) => sum + t.amount, 0);
      const expectedForFund = f.amount * totalMembers;
      const completionRate = expectedForFund > 0 ? Math.round((fundTotal / expectedForFund) * 100) : 0;

      return {
        id: f.id,
        fundName: f.name,
        totalCollected: fundTotal,
        installmentSplit,
        fullPaymentSplit,
        completionRate,
      };
    })
  );

  // Active installments list
  const installments = plans
    .filter((p) => p.status === "ACTIVE")
    .map((p) => {
      const paidSegments = p.entries.filter((e) => e.status === "PAID").length;
      const remainingAmount = p.entries
        .filter((e) => e.status !== "PAID")
        .reduce((sum, e) => sum + e.amountDue, 0);

      return {
        id: p.id,
        memberName: p.member.name,
        fundName: p.fundType.name,
        paidSegments,
        totalSegments: p.entries.length,
        remainingAmount,
      };
    });

  // Officer logs (users with OFFICER role in this org)
  const officers = await prisma.user.findMany({
    where: { orgId, role: "OFFICER" },
  });

  const officerLogs = officers.map((o) => ({
    id: o.id,
    role: o.orgRole || "Officer",
    officerName: o.name,
    termStart: o.createdAt.toISOString().split("T")[0],
    termEnd: o.deactivatedAt?.toISOString().split("T")[0] ?? "",
    status: o.deactivatedAt ? "INACTIVE" : "ACTIVE",
  }));

  return NextResponse.json({
    kpis: {
      totalCollected,
      installmentPlansCreated,
      completionRatePercent,
      collectionRatePercent,
    },
    monthlyCollections,
    standings,
    fundBreakdowns,
    installments,
    officerLogs,
  });
}
