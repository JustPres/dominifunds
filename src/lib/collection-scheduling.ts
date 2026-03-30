import type { Transaction, TransactionStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface DailyRosterFilters {
  date: Date;
  orgId: string;
  sectionId?: string | null;
}

export interface DailyRosterRow {
  memberId: string;
  memberName: string;
  sectionName: string;
  paymentMode: "Full" | "Installment" | "Mixed";
  amountDue: number;
  latestPaymentDate: string | null;
  dueItems: Array<{
    kind: "FULL" | "INSTALLMENT";
    fundName: string;
    amount: number;
    dueDate: string | null;
    installmentInfo?: string;
  }>;
}

export interface SectionProgressRow {
  sectionId: string | null;
  sectionName: string;
  totalMembers: number;
  fullyPaidMembers: number;
  completionRate: number;
  outstandingAmount: number;
}

type StudentWithSection = {
  id: string;
  sectionId: string | null;
  section: {
    name: string;
  } | null;
};

type RequiredFund = {
  id: string;
  amount: number;
};

type InstallmentPlanProgress = {
  memberId: string;
  fundTypeId: string;
  entries: Array<{
    amountDue: number;
    status: TransactionStatus;
    deletedAt: Date | null;
  }>;
};

export function isoDate(value?: Date | string | null) {
  if (!value) return null;

  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().split("T")[0];
}

export function getWeekdayIndex(date: Date) {
  return date.getDay();
}

export function formatWeekdayLabel(weekday: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday] ?? "Unknown";
}

export async function getActiveCollectionPeriod(orgId: string) {
  return prisma.collectionPeriod.findFirst({
    where: {
      orgId,
      isActive: true,
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getCollectionScheduleSnapshot(orgId: string) {
  const activePeriod = await getActiveCollectionPeriod(orgId);

  if (!activePeriod) {
    return {
      activePeriod: null,
      schedules: [],
    };
  }

  const schedules = await prisma.collectionSchedule.findMany({
    where: {
      orgId,
      collectionPeriodId: activePeriod.id,
      deletedAt: null,
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ scope: "asc" }, { name: "asc" }],
  });

  return {
    activePeriod,
    schedules,
  };
}

export async function getDailyCollectionRoster(filters: DailyRosterFilters) {
  const activePeriod = await getActiveCollectionPeriod(filters.orgId);

  if (!activePeriod) {
    return {
      activePeriod: null,
      roster: [] as DailyRosterRow[],
      sections: [] as SectionProgressRow[],
    };
  }

  if (
    filters.date.getTime() < activePeriod.startDate.getTime() ||
    filters.date.getTime() > activePeriod.endDate.getTime()
  ) {
    return {
      activePeriod,
      roster: [] as DailyRosterRow[],
      sections: [] as SectionProgressRow[],
    };
  }

  const weekday = getWeekdayIndex(filters.date);
  const [students, requiredFunds, paidTransactions, installmentPlans, schedules] = await Promise.all([
    prisma.user.findMany({
      where: {
        orgId: filters.orgId,
        role: "STUDENT",
        deactivatedAt: null,
        ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
      },
      include: {
        section: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.fundType.findMany({
      where: {
        orgId: filters.orgId,
        required: true,
        archivedAt: null,
      },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        member: { orgId: filters.orgId },
        collectionPeriodId: activePeriod.id,
        deletedAt: null,
        status: "PAID",
      },
      include: {
        fundType: true,
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.installmentPlan.findMany({
      where: {
        member: { orgId: filters.orgId },
        collectionPeriodId: activePeriod.id,
        deletedAt: null,
      },
      include: {
        member: {
          include: {
            section: true,
          },
        },
        fundType: true,
        entries: {
          where: { deletedAt: null },
          orderBy: { dueDate: "asc" },
        },
      },
    }),
    prisma.collectionSchedule.findMany({
      where: {
        orgId: filters.orgId,
        collectionPeriodId: activePeriod.id,
        deletedAt: null,
      },
    }),
  ]);

  const orgDefaultSchedules = schedules.filter((schedule) => schedule.scope === "ORG_DEFAULT");
  const memberOverrideSchedules = new Map(
    schedules
      .filter((schedule) => schedule.scope === "MEMBER_OVERRIDE" && schedule.memberId)
      .map((schedule) => [schedule.memberId as string, schedule])
  );

  const studentsScheduledToday = students.filter((student) => {
    const override = memberOverrideSchedules.get(student.id);

    if (override) {
      return override.weekdays.includes(weekday);
    }

    return orgDefaultSchedules.some((schedule) => schedule.weekdays.includes(weekday));
  });

  const paidTransactionByMemberFund = new Map<string, Transaction>();
  for (const transaction of paidTransactions) {
    const key = `${transaction.memberId}:${transaction.fundTypeId}`;
    if (!paidTransactionByMemberFund.has(key)) {
      paidTransactionByMemberFund.set(key, transaction);
    }
  }

  const planByMemberFund = new Map<string, (typeof installmentPlans)[number]>();
  for (const plan of installmentPlans) {
    planByMemberFund.set(`${plan.memberId}:${plan.fundTypeId}`, plan);
  }

  const roster = studentsScheduledToday
    .map((student) => {
      const dueItems: DailyRosterRow["dueItems"] = [];

      for (const fund of requiredFunds) {
        const plan = planByMemberFund.get(`${student.id}:${fund.id}`);
        const paidTransaction = paidTransactionByMemberFund.get(`${student.id}:${fund.id}`);

        if (plan) {
          const pendingEntries = plan.entries.filter(
            (entry) =>
              !entry.deletedAt &&
              (entry.status === "PENDING" || entry.status === "OVERDUE") &&
              entry.dueDate.getTime() <= filters.date.getTime()
          );

          for (const entry of pendingEntries) {
            const entryIndex = plan.entries.findIndex((current) => current.id === entry.id) + 1;
            dueItems.push({
              kind: "INSTALLMENT",
              fundName: plan.fundType.name,
              amount: entry.amountDue,
              dueDate: isoDate(entry.dueDate),
              installmentInfo: `Installment ${entryIndex} of ${plan.entries.length}`,
            });
          }

          continue;
        }

        if (!paidTransaction) {
          dueItems.push({
            kind: "FULL",
            fundName: fund.name,
            amount: fund.amount,
            dueDate: isoDate(activePeriod.endDate),
          });
        }
      }

      if (dueItems.length === 0) {
        return null;
      }

      const latestPayment = paidTransactions.find((transaction) => transaction.memberId === student.id) ?? null;
      const hasInstallment = dueItems.some((item) => item.kind === "INSTALLMENT");
      const hasFull = dueItems.some((item) => item.kind === "FULL");

      return {
        memberId: student.id,
        memberName: student.name,
        sectionName: student.section?.name ?? "Unassigned",
        paymentMode: hasInstallment && hasFull ? "Mixed" : hasInstallment ? "Installment" : "Full",
        amountDue: dueItems.reduce((sum, item) => sum + item.amount, 0),
        latestPaymentDate: latestPayment ? isoDate(latestPayment.paidAt ?? latestPayment.createdAt) : null,
        dueItems,
      } satisfies DailyRosterRow;
    })
    .filter((row): row is DailyRosterRow => Boolean(row));

  const sectionProgress = buildSectionProgress({
    students,
    requiredFunds,
    paidTransactions,
    installmentPlans,
  });

  return {
    activePeriod,
    roster,
    sections: sectionProgress,
  };
}

function buildSectionProgress(input: {
  students: StudentWithSection[];
  requiredFunds: RequiredFund[];
  paidTransactions: Transaction[];
  installmentPlans: InstallmentPlanProgress[];
}) {
  const rows = new Map<string, SectionProgressRow>();

  for (const student of input.students) {
    const key = student.sectionId ?? "unassigned";
    const current = rows.get(key) ?? {
      sectionId: student.sectionId ?? null,
      sectionName: student.section?.name ?? "Unassigned",
      totalMembers: 0,
      fullyPaidMembers: 0,
      completionRate: 0,
      outstandingAmount: 0,
    };

    current.totalMembers += 1;

    const paidFundIds = new Set(
      input.paidTransactions
        .filter((transaction) => transaction.memberId === student.id && transaction.type === "FULL_PAYMENT")
        .map((transaction) => transaction.fundTypeId)
    );

    const plans = input.installmentPlans.filter((plan) => plan.memberId === student.id);
    const planFundIds = new Set(plans.map((plan) => plan.fundTypeId));

    const outstandingInstallments = plans.reduce(
      (sum, plan) =>
        sum +
        plan.entries
          .filter((entry) => !entry.deletedAt && entry.status !== "PAID")
          .reduce((entrySum, entry) => entrySum + entry.amountDue, 0),
      0
    );

    const outstandingFull = input.requiredFunds
      .filter((fund) => !paidFundIds.has(fund.id) && !planFundIds.has(fund.id))
      .reduce((sum, fund) => sum + fund.amount, 0);

    const outstandingAmount = outstandingInstallments + outstandingFull;
    current.outstandingAmount += outstandingAmount;

    if (outstandingAmount <= 0) {
      current.fullyPaidMembers += 1;
    }

    rows.set(key, current);
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      completionRate: row.totalMembers > 0 ? Math.round((row.fullyPaidMembers / row.totalMembers) * 100) : 0,
    }))
    .sort((left, right) => right.completionRate - left.completionRate || left.sectionName.localeCompare(right.sectionName));
}
