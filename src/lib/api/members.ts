// Mock API for Members Data
import { type UserDirectoryView } from "@/lib/user-lifecycle";

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
  sectionId?: string | null;
  sectionName?: string;
  deactivatedAt?: string | null;
  isArchived?: boolean;
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
  sectionId?: string | null;
  note?: string;
}

export interface MemberReportFilters {
  search?: string;
  status?: MemberReportFilterStatus;
  sectionId?: string;
  view?: UserDirectoryView;
}

export interface MemberImportPreviewRow {
  rowNumber: number;
  name: string;
  email: string;
  role: string;
  yearLevel: string;
  sectionName: string;
  action: "create" | "update" | "restore" | "draft" | "skip" | "error";
  issues: string[];
  normalizedRole: string;
  normalizedYearLevel: string | null;
  sectionId: string | null;
  existingMemberId: string | null;
}

export interface MemberImportDraft {
  id: string;
  name: string;
  email: string | null;
  role: string;
  yearLevel: string | null;
  sectionId: string | null;
  sectionName: string;
  sourceFileName: string | null;
  status: "INCOMPLETE" | "READY" | "ERROR";
  issueSummary: string | null;
  rawData: unknown;
  createdAt: string;
  updatedAt: string;
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

  if (filters.sectionId?.trim()) {
    params.set("sectionId", filters.sectionId.trim());
  }

  if (filters.view === "archived") {
    params.set("view", "archived");
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

  if (filters.sectionId?.trim()) {
    params.set("sectionId", filters.sectionId.trim());
  }

  if (filters.view === "archived") {
    params.set("view", "archived");
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

export async function updateMember(orgId: string, memberId: string, payload: Partial<AddMemberInput>): Promise<Member> {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(memberId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update member");
  }

  return res.json();
}

export async function archiveMember(orgId: string, memberId: string, note?: string) {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(memberId)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to archive member");
  }

  return res.json();
}

export async function restoreMember(orgId: string, memberId: string, note?: string) {
  const res = await fetch(
    `/api/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(memberId)}/restore`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to restore member");
  }

  return res.json();
}

export async function bulkAssignMembersSection(orgId: string, memberIds: string[], sectionId?: string | null) {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/bulk/assign-section`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberIds, sectionId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update member sections");
  }

  return res.json();
}

export async function bulkUpdateMembersLifecycle(
  orgId: string,
  memberIds: string[],
  action: "archive" | "restore"
) {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/bulk/lifecycle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberIds, action }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to ${action} members`);
  }

  return res.json();
}

export async function previewMembersImport(orgId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/import/preview`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to preview the import");
  }

  return res.json() as Promise<{
    rows: MemberImportPreviewRow[];
    summary: {
      created: number;
      updated: number;
      restored: number;
      drafted: number;
      skipped: number;
      failed: number;
    };
    fileName: string;
  }>;
}

export async function commitMembersImport(orgId: string, rows: MemberImportPreviewRow[], fileName?: string) {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/import/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: fileName ?? null,
      rows: rows.map((row) => ({
        rowNumber: row.rowNumber,
        name: row.name,
        email: row.email,
        role: row.role,
        yearLevel: row.yearLevel,
        sectionName: row.sectionName,
      })),
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to import members");
  }

  return res.json();
}

export async function getMemberImportDrafts(orgId: string): Promise<MemberImportDraft[]> {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/import-drafts`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load import drafts");
  }

  const payload = await res.json();
  return payload.drafts ?? [];
}

export async function updateMemberImportDraft(
  orgId: string,
  draftId: string,
  payload: Partial<Pick<MemberImportDraft, "name" | "email" | "role" | "yearLevel" | "sectionId" | "issueSummary">>
) {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/import-drafts/${encodeURIComponent(draftId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update draft");
  }

  return res.json() as Promise<MemberImportDraft>;
}

export async function discardMemberImportDraft(orgId: string, draftId: string) {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/import-drafts/${encodeURIComponent(draftId)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to discard draft");
  }

  return res.json();
}

export async function convertMemberImportDraft(orgId: string, draftId: string): Promise<Member> {
  const res = await fetch(
    `/api/orgs/${encodeURIComponent(orgId)}/members/import-drafts/${encodeURIComponent(draftId)}/convert`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to convert draft");
  }

  return res.json();
}

export async function bulkAssignDraftsSection(orgId: string, draftIds: string[], sectionId?: string | null) {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/members/import-drafts/bulk/assign-section`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draftIds, sectionId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update draft sections");
  }

  return res.json();
}

export function downloadMemberImportTemplate(orgId: string) {
  return downloadReportFile(
    `/api/orgs/${encodeURIComponent(orgId)}/members/import/template`,
    `members-import-template-${orgId}.xlsx`
  );
}
