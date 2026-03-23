export interface PortalProfile {
  id: string;
  name: string;
  initials: string;
  organization: string;
  yearLevel: string;
  email: string;
  status: "GOOD_STANDING" | "HAS_INSTALLMENT" | "OVERDUE";
}

export interface PortalKPIs {
  totalPaid: number;
  activeInstallmentPlans: number;
  nextPaymentDueAmount: number | null;
  nextPaymentDueDate: string | null;
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
  period: string;
  totalAmount: number;
  paidSegments: number;
  totalSegments: number;
  entries: PortalInstallmentEntry[];
}

export interface PortalTransaction {
  id: string;
  fundName: string;
  date: string;
  amount: number;
  note?: string;
  status: "PAID" | "PENDING";
}

export interface PortalObligation {
  id: string;
  fundName: string;
  amount: number;
  frequency: string;
  allowInstallment: boolean;
}

export interface PortalData {
  profile: PortalProfile;
  kpis: PortalKPIs;
  installments: PortalInstallmentPlan[];
  history: PortalTransaction[];
  obligations: PortalObligation[];
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getPortalData(memberId?: string): Promise<PortalData> {
  await delay(800);
  // Simulating an active student profile fetch
  return {
    profile: {
      id: memberId || "stu123",
      name: "Juan Dela Cruz",
      initials: "JD",
      organization: "SDCA DominiFunds IT",
      yearLevel: "3rd Year",
      email: "juan.delacruz@sdca.edu.ph",
      status: "HAS_INSTALLMENT",
    },
    kpis: {
      totalPaid: 4500,
      activeInstallmentPlans: 1,
      nextPaymentDueAmount: 1500,
      nextPaymentDueDate: "2026-04-15",
    },
    installments: [
      {
        id: "plan-1",
        fundName: "Seminary Fund",
        period: "2nd Semester 2025-2026",
        totalAmount: 3000,
        paidSegments: 1,
        totalSegments: 2,
        entries: [
          { id: "e1", installmentNumber: 1, amount: 1500, dueDate: "2026-02-15", status: "PAID" },
          { id: "e2", installmentNumber: 2, amount: 1500, dueDate: "2026-04-15", status: "PENDING" },
        ],
      }
    ],
    history: [
      { id: "tx1", fundName: "Annual IT Fund", date: "2025-08-15", amount: 1500, note: "Cleared via online transfer matching PR-221", status: "PAID" },
      { id: "tx2", fundName: "Org Merchandise", date: "2025-09-02", amount: 600, note: "Cash receipt", status: "PAID" },
      { id: "tx3", fundName: "Field Trip", date: "2025-11-20", amount: 2400, note: "", status: "PAID" }
    ],
    obligations: [
      { id: "ob1", fundName: "Annual IT Fund", amount: 1500, frequency: "ANNUAL", allowInstallment: true },
      { id: "ob2", fundName: "Monthly Dues", amount: 50, frequency: "MONTHLY", allowInstallment: false },
      { id: "ob3", fundName: "Seminary Fund", amount: 3000, frequency: "PER_SEMESTER", allowInstallment: true }
    ]
  };
}
