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
  transactionCount: number;
  installmentPlanCount: number;
  archivedAt: string | null;
  isArchived: boolean;
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

type FundTypeMutationInput = Omit<
  FundType,
  "id" | "transactionCount" | "installmentPlanCount" | "archivedAt" | "isArchived"
>;

export async function getFundTypes(orgId: string, includeArchived = true): Promise<FundTypesResponse> {
  try {
    const params = new URLSearchParams();

    if (includeArchived) {
      params.set("includeArchived", "true");
    }

    const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/fund-types?${params.toString()}`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return {
      kpis: { totalCategories: 0, requiredPerSemesterTotal: 0, installmentEnabledCount: 0 },
      fundTypes: [],
    };
  }
}

export async function createFundType(orgId: string, payload: FundTypeMutationInput): Promise<FundType> {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/fund-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create fund type");
  return res.json();
}

export async function updateFundType(
  orgId: string,
  id: string,
  payload: Partial<FundTypeMutationInput>
): Promise<FundType> {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/fund-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update fund type");
  return res.json();
}

export async function deleteFundType(
  orgId: string,
  id: string
): Promise<{ success: boolean; action: "deleted" | "archived" }> {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/fund-types/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete fund type");
  }
  return res.json();
}
