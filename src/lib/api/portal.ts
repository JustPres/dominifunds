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

export async function getPortalData(memberId?: string): Promise<PortalData> {
  try {
    const res = await fetch(`/api/portal${memberId ? `?memberId=${memberId}` : ""}`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return {
      profile: {
        id: memberId || "stu123",
        name: "Student",
        initials: "ST",
        organization: "Org",
        yearLevel: "N/A",
        email: "student@example.com",
        status: "GOOD_STANDING",
      },
      kpis: {
        totalPaid: 0,
        activeInstallmentPlans: 0,
        nextPaymentDueAmount: null,
        nextPaymentDueDate: null,
      },
      installments: [],
      history: [],
      obligations: []
    };
  }
}
