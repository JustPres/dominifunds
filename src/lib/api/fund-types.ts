// Mock API for Fund Types

export type FundFrequency = "MONTHLY" | "PER_SEMESTER" | "ANNUAL" | "PER_EVENT";

export interface FundType {
  id: string;
  name: string;
  amount: number;
  frequency: FundFrequency;
  description: string;
  required: boolean;
  allowInstallment: boolean;
  maxInstallments?: number | null;
  transactionCount: number; // Used to block deletion
}

export interface FundTypeKPIs {
  totalCategories: number;
  requiredPerSemesterTotal: number;
  installmentEnabledCount: number;
}

export interface FundTypesResponse {
  kpis: FundTypeKPIs;
  fundTypes: FundType[];
}

export async function getFundTypes(): Promise<FundTypesResponse> {
  try {
    const res = await fetch("/api/fund-types");
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return {
      kpis: { totalCategories: 0, requiredPerSemesterTotal: 0, installmentEnabledCount: 0 },
      fundTypes: [],
    };
  }
}

export async function createFundType(payload: Omit<FundType, "id" | "transactionCount">): Promise<FundType> {
  const res = await fetch("/api/fund-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create fund type");
  return res.json();
}

export async function updateFundType(id: string, payload: Partial<Omit<FundType, "id" | "transactionCount">>): Promise<FundType> {
  const res = await fetch(`/api/fund-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update fund type");
  return res.json();
}

export async function deleteFundType(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/fund-types/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete fund type");
  }
  return { success: true };
}
