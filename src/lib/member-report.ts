import prisma from "@/lib/prisma";
import {
  formatYearLevelLabel,
  resolveStudentOrgRole,
  resolveStudentYearLevel,
} from "@/lib/member-fields";

export type MemberDirectoryStatus = "Good Standing" | "Has Installment Plan" | "Overdue";
export type MemberOverallStatus = "Fully Paid" | "On Installment" | "Overdue" | "No Payment Record";
export type MemberPaymentMode = "Full Payment" | "Installment" | "Mixed" | "None";
export type MemberReportFilterStatus = "All" | MemberDirectoryStatus;
export const MEMBER_REPORT_FILTER_STATUSES: MemberReportFilterStatus[] = [
  "All",
  "Good Standing",
  "Has Installment Plan",
  "Overdue",
];

export interface MemberReportFilters {
  search?: string;
  status?: MemberReportFilterStatus | null;
}

export interface MemberReportRow {
  id: string;
  name: string;
  email: string;
  role: string;
  yearLevel: string;
  totalPaid: number;
  activeInstallmentPlans: number;
  balanceDue: number;
  status: MemberDirectoryStatus;
  overallStatus: MemberOverallStatus;
  paymentMode: MemberPaymentMode;
  recentPaymentDate: string;
  recentPaymentType: string;
  recentPaymentTypeLabel: string;
  recentPaymentAmount: number;
  recentFullPaymentDate: string;
  recentInstallmentPaymentDate: string;
  overdueEntries: number;
  overdueTransactions: number;
  overdueSummary: string;
  outstandingInstallmentAmount: number;
  outstandingTransactionAmount: number;
}

export interface MemberReportData {
  generatedAt: string;
  filters: {
    search: string;
    status: MemberReportFilterStatus;
  };
  rows: MemberReportRow[];
}

export type MemberReportColumnKey =
  | "student"
  | "name"
  | "email"
  | "role"
  | "yearLevel"
  | "status"
  | "overallStatus"
  | "paymentMode"
  | "totalPaid"
  | "balanceDue"
  | "activeInstallmentPlans"
  | "overdueEntries"
  | "overdueTransactions"
  | "outstandingInstallmentAmount"
  | "outstandingTransactionAmount"
  | "recentPaymentDate"
  | "recentPaymentTypeLabel"
  | "recentPaymentAmount"
  | "recentFullPaymentDate"
  | "recentInstallmentPaymentDate"
  | "overdueSummary";

export interface MemberReportColumn {
  key: MemberReportColumnKey;
  header: string;
  width?: number;
  kind?: "text" | "currency" | "date" | "number";
}

export function parseMemberReportFilterStatus(
  value?: string | null
): MemberReportFilterStatus | undefined {
  if (!value) return undefined;

  return MEMBER_REPORT_FILTER_STATUSES.includes(value as MemberReportFilterStatus)
    ? (value as MemberReportFilterStatus)
    : undefined;
}

export const MEMBER_REPORT_EXPORT_COLUMNS: MemberReportColumn[] = [
  { key: "name", header: "Student Name", width: 24 },
  { key: "email", header: "Email", width: 28 },
  { key: "role", header: "Role", width: 18 },
  { key: "yearLevel", header: "Year Level", width: 16 },
  { key: "overallStatus", header: "Standing", width: 18 },
  { key: "paymentMode", header: "Payment Mode", width: 16 },
  { key: "totalPaid", header: "Total Paid", width: 14, kind: "currency" },
  { key: "balanceDue", header: "Balance Due", width: 14, kind: "currency" },
  { key: "activeInstallmentPlans", header: "Active Installment Plans", width: 16, kind: "number" },
  { key: "overdueEntries", header: "Overdue Installments", width: 16, kind: "number" },
  { key: "overdueTransactions", header: "Overdue Full Payments", width: 16, kind: "number" },
  { key: "recentFullPaymentDate", header: "Recent Full Payment Date", width: 18, kind: "date" },
  { key: "recentInstallmentPaymentDate", header: "Recent Installment Payment Date", width: 20, kind: "date" },
];

export const MEMBER_REPORT_PRINT_COLUMNS: MemberReportColumn[] = [
  { key: "student", header: "Student", width: 28 },
  { key: "role", header: "Role", width: 12 },
  { key: "yearLevel", header: "Year Level", width: 12 },
  { key: "overallStatus", header: "Standing", width: 14 },
  { key: "paymentMode", header: "Payment Mode", width: 14 },
  { key: "balanceDue", header: "Balance Due", width: 12, kind: "currency" },
  { key: "recentFullPaymentDate", header: "Recent Full Payment", width: 16, kind: "date" },
  { key: "recentInstallmentPaymentDate", header: "Recent Installment Payment", width: 18, kind: "date" },
  { key: "overdueSummary", header: "Overdue", width: 16 },
];

function formatDate(date?: Date): string {
  return date ? date.toISOString().split("T")[0] : "";
}

function normalizeFilters(filters: MemberReportFilters = {}) {
  return {
    search: filters.search?.trim() ?? "",
    status: filters.status && filters.status !== "All" ? filters.status : "All",
  } as const;
}

function formatPaymentType(type?: string): string {
  if (!type) return "-";
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function matchesSearch(row: MemberReportRow, search: string) {
  if (!search) return true;

  const haystack = [row.name, row.email, row.role, row.yearLevel]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
}

function buildOverdueSummary(overdueEntries: number, overdueTransactions: number) {
  if (overdueEntries === 0 && overdueTransactions === 0) {
    return "-";
  }

  return `${overdueEntries} installments / ${overdueTransactions} records`;
}

export function getMemberReportColumnValue(
  row: MemberReportRow,
  key: MemberReportColumnKey
): string | number {
  switch (key) {
    case "student":
      return `${row.name}\n${row.email}`;
    case "name":
      return row.name;
    case "email":
      return row.email;
    case "role":
      return row.role;
    case "yearLevel":
      return row.yearLevel;
    case "status":
      return row.status;
    case "overallStatus":
      return row.overallStatus;
    case "paymentMode":
      return row.paymentMode;
    case "totalPaid":
      return row.totalPaid;
    case "balanceDue":
      return row.balanceDue;
    case "activeInstallmentPlans":
      return row.activeInstallmentPlans;
    case "overdueEntries":
      return row.overdueEntries;
    case "overdueTransactions":
      return row.overdueTransactions;
    case "outstandingInstallmentAmount":
      return row.outstandingInstallmentAmount;
    case "outstandingTransactionAmount":
      return row.outstandingTransactionAmount;
    case "recentPaymentDate":
      return row.recentPaymentDate || "-";
    case "recentPaymentTypeLabel":
      return row.recentPaymentTypeLabel;
    case "recentPaymentAmount":
      return row.recentPaymentAmount;
    case "recentFullPaymentDate":
      return row.recentFullPaymentDate || "-";
    case "recentInstallmentPaymentDate":
      return row.recentInstallmentPaymentDate || "-";
    case "overdueSummary":
      return row.overdueSummary;
    default:
      return "";
  }
}

export async function syncInstallmentStatuses(orgId?: string) {
  const now = new Date();

  const overdueTransactions = await prisma.transaction.findMany({
    where: {
      status: "PENDING",
      dueDate: { lt: now },
      ...(orgId ? { member: { orgId } } : {}),
    },
    select: { id: true },
  });

  if (overdueTransactions.length > 0) {
    await prisma.transaction.updateMany({
      where: {
        id: { in: overdueTransactions.map((transaction) => transaction.id) },
      },
      data: { status: "OVERDUE" },
    });
  }

  const overdueEntries = await prisma.installmentEntry.findMany({
    where: {
      status: "PENDING",
      dueDate: { lt: now },
      ...(orgId ? { plan: { member: { orgId } } } : {}),
    },
    select: { id: true },
  });

  if (overdueEntries.length > 0) {
    await prisma.installmentEntry.updateMany({
      where: {
        id: { in: overdueEntries.map((entry) => entry.id) },
      },
      data: { status: "OVERDUE" },
    });
  }

  const activePlans = await prisma.installmentPlan.findMany({
    where: {
      status: "ACTIVE",
      ...(orgId ? { member: { orgId } } : {}),
    },
    include: {
      entries: {
        select: { status: true },
      },
    },
  });

  const completedPlanIds = activePlans
    .filter((plan) => plan.entries.length > 0 && plan.entries.every((entry) => entry.status === "PAID"))
    .map((plan) => plan.id);

  if (completedPlanIds.length > 0) {
    await prisma.installmentPlan.updateMany({
      where: {
        id: { in: completedPlanIds },
      },
      data: { status: "COMPLETED" },
    });
  }
}

export async function getMemberReport(
  orgId?: string,
  filters: MemberReportFilters = {}
): Promise<MemberReportData> {
  await syncInstallmentStatuses(orgId);

  const normalizedFilters = normalizeFilters(filters);

  const members = await prisma.user.findMany({
    where: orgId ? { role: "STUDENT", orgId } : { role: "STUDENT" },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
      },
      installmentPlans: {
        include: {
          entries: {
            orderBy: { dueDate: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = members
    .map((member) => {
      const paidTransactions = member.transactions.filter((transaction) => transaction.status === "PAID");
      const overdueTransactions = member.transactions.filter((transaction) => transaction.status === "OVERDUE");
      const outstandingTransactions = member.transactions.filter(
        (transaction) => transaction.status === "PENDING" || transaction.status === "OVERDUE"
      );

      const fullPayments = paidTransactions.filter((transaction) => transaction.type === "FULL_PAYMENT");
      const installmentPayments = paidTransactions.filter(
        (transaction) => transaction.type === "INSTALLMENT_PAYMENT"
      );

      const activePlans = member.installmentPlans.filter((plan) => plan.status === "ACTIVE");
      const overdueEntries = member.installmentPlans.flatMap((plan) =>
        plan.entries.filter((entry) => entry.status === "OVERDUE")
      );
      const outstandingEntries = member.installmentPlans.flatMap((plan) =>
        plan.entries.filter((entry) => entry.status === "PENDING" || entry.status === "OVERDUE")
      );

      const totalPaid = paidTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const outstandingTransactionAmount = outstandingTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );
      const outstandingInstallmentAmount = outstandingEntries.reduce(
        (sum, entry) => sum + entry.amountDue,
        0
      );
      const balanceDue = outstandingTransactionAmount + outstandingInstallmentAmount;

      const hasInstallmentHistory =
        activePlans.length > 0 ||
        member.installmentPlans.some((plan) => plan.status === "COMPLETED") ||
        installmentPayments.length > 0;
      const hasFullPaymentHistory = fullPayments.length > 0;

      const paymentMode: MemberPaymentMode = hasFullPaymentHistory && hasInstallmentHistory
        ? "Mixed"
        : hasInstallmentHistory
        ? "Installment"
        : hasFullPaymentHistory
        ? "Full Payment"
        : "None";

      const overallStatus: MemberOverallStatus =
        overdueEntries.length > 0 || overdueTransactions.length > 0
          ? "Overdue"
          : activePlans.length > 0
          ? "On Installment"
          : totalPaid > 0 && balanceDue <= 0
          ? "Fully Paid"
          : "No Payment Record";

      const status: MemberDirectoryStatus =
        overdueEntries.length > 0 || overdueTransactions.length > 0
          ? "Overdue"
          : activePlans.length > 0
          ? "Has Installment Plan"
          : "Good Standing";

      const recentPayment = paidTransactions[0];
      const normalizedYearLevel = resolveStudentYearLevel(member.yearLevel, member.orgRole);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: resolveStudentOrgRole(member.orgRole),
        yearLevel: formatYearLevelLabel(normalizedYearLevel),
        totalPaid,
        activeInstallmentPlans: activePlans.length,
        balanceDue,
        status,
        overallStatus,
        paymentMode,
        recentPaymentDate: formatDate(recentPayment?.createdAt),
        recentPaymentType: recentPayment?.type || "",
        recentPaymentTypeLabel: formatPaymentType(recentPayment?.type),
        recentPaymentAmount: recentPayment?.amount || 0,
        recentFullPaymentDate: formatDate(fullPayments[0]?.createdAt),
        recentInstallmentPaymentDate: formatDate(installmentPayments[0]?.createdAt),
        overdueEntries: overdueEntries.length,
        overdueTransactions: overdueTransactions.length,
        overdueSummary: buildOverdueSummary(overdueEntries.length, overdueTransactions.length),
        outstandingInstallmentAmount,
        outstandingTransactionAmount,
      } satisfies MemberReportRow;
    })
    .filter((row) => {
      const matchesStatus =
        normalizedFilters.status === "All" ? true : row.status === normalizedFilters.status;

      return matchesStatus && matchesSearch(row, normalizedFilters.search);
    });

  return {
    generatedAt: new Date().toISOString(),
    filters: normalizedFilters,
    rows,
  };
}
