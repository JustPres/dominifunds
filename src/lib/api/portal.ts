export type PortalStanding = "GOOD_STANDING" | "INSTALLMENT_ACTIVE" | "OVERDUE";

export interface PortalOverview {
  standing: PortalStanding;
  totalRequired: number;
  totalPaid: number;
  balanceDue: number;
  activeInstallmentPlans: number;
  nextDueAmount: number | null;
  nextDueDate: string | null;
  latestPayment: PortalTransaction | null;
  overdueCount: number;
}

export interface PortalInstallmentEntry {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE";
}

export interface PortalInstallmentPlan {
  id: string;
  fundName: string;
  totalAmount: number;
  remainingAmount: number;
  paidSegments: number;
  totalSegments: number;
  nextDueDate: string | null;
  nextDueAmount: number | null;
  status: "ACTIVE" | "COMPLETED" | "DEFAULTED";
  entries: PortalInstallmentEntry[];
}

export interface PortalTransaction {
  id: string;
  fundName: string;
  type: "FULL_PAYMENT" | "INSTALLMENT_PAYMENT";
  date: string;
  amount: number;
  status: "PAID" | "PENDING" | "OVERDUE";
  note?: string;
}

export interface PortalObligation {
  id: string;
  fundName: string;
  amount: number;
  frequency: string;
  required: boolean;
  allowInstallment: boolean;
  description?: string;
}

export interface PortalSecuritySummary {
  lastLoginAt: string | null;
  currentDevice: {
    label: string;
    trusted: boolean;
    lastSeenAt: string | null;
    expiresAt: string | null;
  };
  recentActivity: Array<{
    id: string;
    status: string;
    detail: string | null;
    deviceLabel: string | null;
    createdAt: string;
  }>;
}

export function mapPortalInstallments(data: Array<Record<string, unknown>> = []): PortalInstallmentPlan[] {
  return data.map((plan) => {
    const entries = Array.isArray(plan.entries)
      ? plan.entries.map((entry, index) => ({
          id: String(entry.id),
          installmentNumber: Number(entry.installmentNo ?? entry.installmentNumber ?? index + 1),
          amount: Number(entry.amount ?? entry.amountDue ?? 0),
          dueDate: String(entry.dueDate),
          status: String(entry.status) as PortalInstallmentEntry["status"],
        }))
      : [];
    const paidSegments = entries.filter((entry) => entry.status === "PAID").length;
    const nextDueEntry =
      entries.find((entry) => entry.status === "OVERDUE") ??
      entries.find((entry) => entry.status === "PENDING") ??
      null;

    return {
      id: String(plan.id),
      fundName: String(plan.fundTypeName ?? plan.fundName ?? "Fund"),
      totalAmount: Number(plan.totalAmount ?? entries.reduce((sum, entry) => sum + entry.amount, 0)),
      remainingAmount: entries
        .filter((entry) => entry.status !== "PAID")
        .reduce((sum, entry) => sum + entry.amount, 0),
      paidSegments,
      totalSegments: entries.length,
      nextDueDate: nextDueEntry?.dueDate ?? null,
      nextDueAmount: nextDueEntry?.amount ?? null,
      status: String(plan.status ?? "ACTIVE") as PortalInstallmentPlan["status"],
      entries,
    };
  });
}

export function mapPortalTransactions(data: Array<Record<string, unknown>> = []): PortalTransaction[] {
  return data.map((transaction) => ({
    id: String(transaction.id),
    fundName: String(transaction.fundTypeName ?? transaction.fundName ?? "Fund"),
    type: String(transaction.type ?? "FULL_PAYMENT") as PortalTransaction["type"],
    date: String(transaction.date),
    amount: Number(transaction.amount ?? 0),
    status: String(transaction.status ?? "PAID") as PortalTransaction["status"],
    note: transaction.note ? String(transaction.note) : undefined,
  }));
}

export function mapPortalObligations(data: Array<Record<string, unknown>> = []): PortalObligation[] {
  return data
    .filter((obligation) => !obligation.isArchived)
    .map((obligation) => ({
      id: String(obligation.id),
      fundName: String(obligation.name ?? obligation.fundName ?? "Fund"),
      amount: Number(obligation.amount ?? 0),
      frequency: String(obligation.frequency ?? "PER_SEMESTER"),
      required: Boolean(obligation.required ?? true),
      allowInstallment: Boolean(obligation.allowInstallment),
      description: obligation.description ? String(obligation.description) : undefined,
    }));
}

export function buildPortalOverview(input: {
  installments: PortalInstallmentPlan[];
  history: PortalTransaction[];
  obligations: PortalObligation[];
}): PortalOverview {
  const requiredObligations = input.obligations.filter((obligation) => obligation.required);
  const totalRequired = requiredObligations.reduce((sum, obligation) => sum + obligation.amount, 0);
  const totalPaid = input.history
    .filter((transaction) => transaction.status === "PAID")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const activeInstallmentPlans = input.installments.filter((plan) => plan.status === "ACTIVE").length;
  const overdueCount = input.installments.reduce(
    (sum, plan) => sum + plan.entries.filter((entry) => entry.status === "OVERDUE").length,
    0
  );
  const nextDueEntry = input.installments
    .flatMap((plan) =>
      plan.entries
        .filter((entry) => entry.status === "OVERDUE" || entry.status === "PENDING")
        .map((entry) => ({
          amount: entry.amount,
          dueDate: entry.dueDate,
          status: entry.status,
        }))
    )
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0] ?? null;
  const latestPayment = input.history
    .slice()
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0] ?? null;
  const balanceDue = Math.max(
    totalRequired - totalPaid,
    input.installments.reduce((sum, plan) => sum + plan.remainingAmount, 0)
  );
  const standing: PortalStanding =
    overdueCount > 0
      ? "OVERDUE"
      : activeInstallmentPlans > 0
      ? "INSTALLMENT_ACTIVE"
      : "GOOD_STANDING";

  return {
    standing,
    totalRequired,
    totalPaid,
    balanceDue,
    activeInstallmentPlans,
    nextDueAmount: nextDueEntry?.amount ?? null,
    nextDueDate: nextDueEntry?.dueDate ?? null,
    latestPayment,
    overdueCount,
  };
}
