export interface InstallmentEntry {
  id: string;
  installmentNo: number;
  amountDue: number;
  dueDate: string;
  status: "PENDING" | "OVERDUE" | "PAID";
}

export interface InstallmentPlan {
  id: string;
  memberId: string;
  memberName: string;
  memberInitials: string;
  yearLevel: string;
  fundTypeId: string;
  fundTypeName: string;
  period: string;
  totalAmount: number;
  amountPerInstallment: number;
  totalInstallments: number;
  installmentsPaid: number;
  entries: InstallmentEntry[];
}

export interface InstallmentKPIs {
  activePlans: number;
  overdueEntries: number;
  completedPlansSemester: number;
}

export interface InstallmentsResponse {
  kpis: InstallmentKPIs;
  plans: InstallmentPlan[];
}

export interface FundTypeOption {
  id: string;
  name: string;
  defaultAmount: number;
}

export interface MemberOption {
  id: string;
  name: string;
}

export async function getInstallmentData(orgId: string): Promise<InstallmentsResponse> {
  try {
    const res = await fetch(`/api/installments?orgId=${encodeURIComponent(orgId)}`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return {
      kpis: { activePlans: 0, overdueEntries: 0, completedPlansSemester: 0 },
      plans: [],
    };
  }
}

export async function getInstallmentOptions(
  orgId: string
): Promise<{ funds: FundTypeOption[]; members: MemberOption[] }> {
  try {
    const res = await fetch(`/api/installments/options?orgId=${encodeURIComponent(orgId)}`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return { funds: [], members: [] };
  }
}

export async function payInstallment(planId: string, entryId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/installments/${planId}/entries/${entryId}/pay`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to secure payment");
  return res.json();
}

export async function createInstallmentPlan(payload: {
  orgId: string;
  memberId: string;
  fundTypeId: string;
  totalAmount: number;
  numberOfInstallments: number;
  period: string;
  dueDates: string[];
}): Promise<InstallmentPlan> {
  const res = await fetch("/api/installments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create plan");
  }
  return res.json();
}
