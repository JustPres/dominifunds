import type { ReportData } from "@/lib/annual-report";
import { getOrgDisplayName } from "@/lib/org-display";

export type {
  ActiveInstallmentPlan,
  FundBreakdown,
  MemberStanding,
  MonthlyCollection,
  OfficerLog,
  ReportData,
  ReportKPIs,
} from "@/lib/annual-report";

export async function getReportData(orgId: string, year: number): Promise<ReportData> {
  const res = await fetch(`/api/orgs/${orgId}/report?year=${year}`);

  if (!res.ok) {
    return {
      kpis: {
        totalCollected: 0,
        installmentPlansCreated: 0,
        completionRatePercent: 0,
        collectionRatePercent: 0,
      },
      monthlyCollections: [],
      standings: {
        goodStanding: { count: 0, percent: 0 },
        activeInstallment: { count: 0, percent: 0 },
        overdue: { count: 0, percent: 0 },
      },
      fundBreakdowns: [],
      installments: [],
      officerLogs: [],
    };
  }

  return await res.json();
}

export async function exportReportPdf(orgId: string, year: number): Promise<void> {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/report/export/pdf?year=${year}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to generate the annual report PDF");
  }

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/);
  const filename =
    filenameMatch?.[1] ??
    `annual-report-${getOrgDisplayName(orgId, orgId).toLowerCase()}-${year}.pdf`;

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
