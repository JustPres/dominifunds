export interface ReportKPIs {
  totalCollected: number;
  installmentPlansCreated: number;
  completionRatePercent: number; // completed plans / total plans
  collectionRatePercent: number; // members with no overdue
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
  completionRate: number; // percentage
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
  status: "ACTIVE" | "COMPLETED" | "RESIGNED";
}

export interface ReportData {
  kpis: ReportKPIs;
  monthlyCollections: MonthlyCollection[];
  standings: MemberStanding;
  fundBreakdowns: FundBreakdown[];
  installments: ActiveInstallmentPlan[];
  officerLogs: OfficerLog[];
}

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

export async function exportReportPdf(): Promise<{ success: boolean; fakeUrl: string }> {
  const res = await fetch(`/api/reports/export`, { method: "POST" });
  if (!res.ok) {
    throw new Error("PDF generation failed");
  }
  const data = await res.json();
  return {
    success: true,
    fakeUrl: data.url || "blob:http://localhost:3000/mock-report-uuid-pdf",
  };
}
