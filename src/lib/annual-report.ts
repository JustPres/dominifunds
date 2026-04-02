import prisma from "@/lib/prisma";
import { syncInstallmentStatuses } from "@/lib/member-report";
import { getActiveFundWhere } from "@/lib/fund-lifecycle";
import { getActiveUserWhere } from "@/lib/user-lifecycle";

export interface ReportKPIs {
  totalCollected: number;
  installmentPlansCreated: number;
  completionRatePercent: number;
  collectionRatePercent: number;
}

export interface MonthlyCollection {
  month: string;
  amount: number;
}

export interface MemberStanding {
  goodStanding: { count: number; percent: number };
  activeInstallment: { count: number; percent: number };
  overdue: { count: number; percent: number };
}

export interface FundBreakdown {
  id: string;
  fundName: string;
  totalCollected: number;
  installmentSplit: number;
  fullPaymentSplit: number;
  completionRate: number;
}

export interface ActiveInstallmentPlan {
  id: string;
  memberName: string;
  fundName: string;
  paidSegments: number;
  totalSegments: number;
  remainingAmount: number;
}

export interface OfficerLog {
  id: string;
  role: string;
  officerName: string;
  termStart: string;
  termEnd: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ReportData {
  kpis: ReportKPIs;
  monthlyCollections: MonthlyCollection[];
  standings: MemberStanding;
  fundBreakdowns: FundBreakdown[];
  installments: ActiveInstallmentPlan[];
  officerLogs: OfficerLog[];
}

export async function getAnnualReportData(orgId: string, year: number): Promise<ReportData> {
  await syncInstallmentStatuses(orgId);

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "PAID",
      createdAt: { gte: startDate, lte: endDate },
      member: { orgId },
    },
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyCollections = monthNames.map((month, index) => {
    const amount = transactions
      .filter((transaction) => transaction.createdAt.getMonth() === index)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return { month, amount };
  });

  const totalCollected = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  const plans = await prisma.installmentPlan.findMany({
    where: { member: { orgId } },
    include: {
      member: true,
      fundType: true,
      entries: true,
    },
  });

  const installmentPlansCreated = plans.length;
  const completedPlans = plans.filter((plan) => plan.status === "COMPLETED").length;
  const completionRatePercent = installmentPlansCreated > 0
    ? Math.round((completedPlans / installmentPlansCreated) * 100)
    : 0;

  const allFunds = await prisma.fundType.findMany({
    where: { orgId, ...getActiveFundWhere() },
  });

  const totalMembers = await prisma.user.count({
    where: { orgId, role: "STUDENT", ...getActiveUserWhere() },
  });

  const totalExpected = allFunds.reduce((sum, fund) => sum + fund.amount, 0) * totalMembers;
  const collectionRatePercent = totalExpected > 0
    ? Math.round((totalCollected / totalExpected) * 100)
    : 0;

  const allStudents = await prisma.user.findMany({
    where: { orgId, role: "STUDENT", ...getActiveUserWhere() },
    include: {
      transactions: { where: { status: "OVERDUE" } },
      installmentPlans: { where: { status: "ACTIVE" } },
    },
  });

  let goodStanding = 0;
  let activeInstallment = 0;
  let overdue = 0;

  for (const student of allStudents) {
    if (student.transactions.length > 0) {
      overdue += 1;
    } else if (student.installmentPlans.length > 0) {
      activeInstallment += 1;
    } else {
      goodStanding += 1;
    }
  }

  const totalStudents = allStudents.length || 1;
  const standings: MemberStanding = {
    goodStanding: { count: goodStanding, percent: Math.round((goodStanding / totalStudents) * 100) },
    activeInstallment: { count: activeInstallment, percent: Math.round((activeInstallment / totalStudents) * 100) },
    overdue: { count: overdue, percent: Math.round((overdue / totalStudents) * 100) },
  };

  const fundBreakdowns = await Promise.all(
    allFunds.map(async (fund) => {
      const fundTransactions = await prisma.transaction.findMany({
        where: {
          fundTypeId: fund.id,
          status: "PAID",
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const fundTotal = fundTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const installmentSplit = fundTransactions
        .filter((transaction) => transaction.type === "INSTALLMENT_PAYMENT")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const fullPaymentSplit = fundTransactions
        .filter((transaction) => transaction.type === "FULL_PAYMENT")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const expectedForFund = fund.amount * totalMembers;
      const completionRate = expectedForFund > 0 ? Math.round((fundTotal / expectedForFund) * 100) : 0;

      return {
        id: fund.id,
        fundName: fund.name,
        totalCollected: fundTotal,
        installmentSplit,
        fullPaymentSplit,
        completionRate,
      };
    })
  );

  const installments = plans
    .filter((plan) => plan.status === "ACTIVE")
    .map((plan) => {
      const paidSegments = plan.entries.filter((entry) => entry.status === "PAID").length;
      const remainingAmount = plan.entries
        .filter((entry) => entry.status !== "PAID")
        .reduce((sum, entry) => sum + entry.amountDue, 0);

      return {
        id: plan.id,
        memberName: plan.member.name,
        fundName: plan.fundType.name,
        paidSegments,
        totalSegments: plan.entries.length,
        remainingAmount,
      };
    });

  const officers = await prisma.user.findMany({
    where: { orgId, role: "OFFICER" },
  });

  const officerLogs = officers.map((officer) => ({
    id: officer.id,
    role: officer.orgRole || "Officer",
    officerName: officer.name,
    termStart: officer.createdAt.toISOString().split("T")[0],
    termEnd: officer.deactivatedAt?.toISOString().split("T")[0] ?? "",
    status: officer.deactivatedAt ? ("INACTIVE" as const) : ("ACTIVE" as const),
  }));

  return {
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
  };
}
