// Mock API for Members Data

export type MemberStatus = "Good Standing" | "Has Installment Plan" | "Overdue";
export type MemberOverallStatus = "Fully Paid" | "On Installment" | "Overdue" | "No Payment Record";
export type MemberPaymentMode = "Full Payment" | "Installment" | "Mixed" | "None";
export type MemberReportFilterStatus = "All" | MemberStatus;

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  yearLevel: string;
  totalPaid: number;
  activeInstallmentPlans: number;
  balanceDue: number;
  status: MemberStatus;
  overallStatus: MemberOverallStatus;
  paymentMode: MemberPaymentMode;
  recentPaymentDate: string;
  recentPaymentType: string;
  recentPaymentAmount: number;
  recentFullPaymentDate: string;
  recentInstallmentPaymentDate: string;
  overdueEntries: number;
  overdueTransactions: number;
  outstandingInstallmentAmount: number;
  outstandingTransactionAmount: number;
}

export interface AddMemberInput extends Pick<Member, "name" | "email" | "role" | "yearLevel"> {
  orgId?: string;
}

export interface MemberReportFilters {
  search?: string;
  status?: MemberReportFilterStatus;
}

// Mocks removed



function buildMemberReportQuery(filters: MemberReportFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status && filters.status !== "All") {
    params.set("status", filters.status);
  }

  return params.toString();
}

async function downloadReportFile(url: string, fallbackFilename: string) {
  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to download members report");
  }

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] ?? fallbackFilename;
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 1000);
}

export function getMemberReportQuery(filters: MemberReportFilters = {}) {
  const query = buildMemberReportQuery(filters);
  return query ? `?${query}` : "";
}

export async function getMembers(orgId: string, filters: MemberReportFilters = {}): Promise<Member[]> {
  try {
    const query = getMemberReportQuery(filters);
    const separator = query ? "&" : "?";
    const res = await fetch(`/api/members${query}${separator}orgId=${encodeURIComponent(orgId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function exportMembersCsv(orgId: string, filters: MemberReportFilters = {}): Promise<void> {
  await downloadReportFile(
    `/api/orgs/${encodeURIComponent(orgId)}/members/export${getMemberReportQuery(filters)}`,
    `members-report-${orgId}.csv`
  );
}

export async function exportMembersExcel(orgId: string, filters: MemberReportFilters = {}): Promise<void> {
  await downloadReportFile(
    `/api/orgs/${encodeURIComponent(orgId)}/members/export/xlsx${getMemberReportQuery(filters)}`,
    `members-report-${orgId}.xlsx`
  );
}

export async function downloadMembersPdf(orgId: string, filters: MemberReportFilters = {}): Promise<void> {
  await downloadReportFile(
    `/api/orgs/${encodeURIComponent(orgId)}/members/export/pdf${getMemberReportQuery(filters)}`,
    `members-report-${orgId}.pdf`
  );
}

export function openMembersPrintReport(filters: MemberReportFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status && filters.status !== "All") {
    params.set("status", filters.status);
  }

  params.set("autoprint", "1");

  window.open(`/dashboard/members/report/print?${params.toString()}`, "_blank", "noopener,noreferrer");
}

export async function addMember(
  memberData: AddMemberInput
): Promise<Member> {
  const res = await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(memberData)
  });
  if (!res.ok) throw new Error("Failed to add member");
  return res.json();
}
