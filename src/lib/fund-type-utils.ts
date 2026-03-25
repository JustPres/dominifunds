import type { FundFrequency, FundType as PrismaFundType } from "@prisma/client";

export interface SerializedFundType {
  id: string;
  name: string;
  amount: number;
  frequency: FundFrequency;
  description: string;
  required: boolean;
  allowInstallment: boolean;
  maxInstallments: number | null;
  transactionCount: number;
  installmentPlanCount: number;
  archivedAt: string | null;
  isArchived: boolean;
}

export function serializeFundType(
  fundType: PrismaFundType & {
    _count?: {
      transactions?: number;
      installmentPlans?: number;
    };
  }
): SerializedFundType {
  return {
    id: fundType.id,
    name: fundType.name,
    amount: fundType.amount,
    frequency: fundType.frequency,
    description: fundType.description || "",
    required: fundType.required,
    allowInstallment: fundType.allowInstallment,
    maxInstallments: fundType.maxInstallments ?? null,
    transactionCount: fundType._count?.transactions ?? 0,
    installmentPlanCount: fundType._count?.installmentPlans ?? 0,
    archivedAt: fundType.archivedAt?.toISOString() ?? null,
    isArchived: Boolean(fundType.archivedAt),
  };
}

export function sortSerializedFundTypes(fundTypes: SerializedFundType[]) {
  return [...fundTypes].sort((left, right) => {
    if (left.isArchived !== right.isArchived) {
      return left.isArchived ? 1 : -1;
    }

    return left.name.localeCompare(right.name);
  });
}

export function formatFundFrequency(frequency: FundFrequency): string {
  switch (frequency) {
    case "MONTHLY":
      return "Monthly";
    case "PER_SEMESTER":
      return "Per Semester";
    case "ANNUAL":
      return "Annual";
    case "PER_EVENT":
      return "Per Event";
    default:
      return frequency.replace(/_/g, " ");
  }
}
