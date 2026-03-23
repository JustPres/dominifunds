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

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getReportData(): Promise<ReportData> {
  await delay(800);
  return {
    kpis: {
      totalCollected: 142500,
      installmentPlansCreated: 18,
      completionRatePercent: 65,
      collectionRatePercent: 88,
    },
    monthlyCollections: [
      { month: "Aug", amount: 15000 },
      { month: "Sep", amount: 22000 },
      { month: "Oct", amount: 11000 },
      { month: "Nov", amount: 18000 },
      { month: "Dec", amount: 9500 },
      { month: "Jan", amount: 32000 },
      { month: "Feb", amount: 24000 },
      { month: "Mar", amount: 11000 },
    ],
    standings: {
      goodStanding: { count: 85, percent: 70 },
      activeInstallment: { count: 24, percent: 20 },
      overdue: { count: 12, percent: 10 },
    },
    fundBreakdowns: [
      { id: "f1", fundName: "Annual IT Fund", totalCollected: 45000, installmentSplit: 15000, fullPaymentSplit: 30000, completionRate: 92 },
      { id: "f2", fundName: "Seminary Fund", totalCollected: 82000, installmentSplit: 50000, fullPaymentSplit: 32000, completionRate: 75 },
      { id: "f3", fundName: "Field Trip", totalCollected: 15500, installmentSplit: 2500, fullPaymentSplit: 13000, completionRate: 98 },
    ],
    installments: [
      { id: "i1", memberName: "Juan Santos", fundName: "Annual IT Fund", paidSegments: 1, totalSegments: 2, remainingAmount: 750 },
      { id: "i2", memberName: "Maria Reyes", fundName: "Seminary Fund", paidSegments: 2, totalSegments: 3, remainingAmount: 1000 },
      { id: "i3", memberName: "Bruce Wayne", fundName: "Seminary Fund", paidSegments: 1, totalSegments: 3, remainingAmount: 2000 },
    ],
    officerLogs: [
      { id: "o1", role: "Treasurer", officerName: "Althea Cruz", termStart: "2025-08-01", termEnd: "2026-05-30", status: "ACTIVE" },
      { id: "o2", role: "President", officerName: "Marco Silva", termStart: "2025-08-01", termEnd: "2026-05-30", status: "ACTIVE" },
      { id: "o3", role: "Secretary", officerName: "Jenna Lee", termStart: "2024-08-01", termEnd: "2025-05-30", status: "COMPLETED" },
    ],
  };
}

export async function exportReportPdf(): Promise<{ success: boolean; fakeUrl: string }> {
  await delay(1200);
  return {
    success: true,
    fakeUrl: "blob:http://localhost:3000/mock-report-uuid-pdf",
  };
}
