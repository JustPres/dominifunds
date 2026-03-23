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

// Initial Mock State
let mockFundTypes: FundType[] = [
  {
    id: "f1",
    name: "Annual IT Fund",
    amount: 1500,
    frequency: "ANNUAL",
    description: "Standard organizational tech collection covering cloud and server fees for the academic year.",
    required: true,
    allowInstallment: true,
    maxInstallments: 2,
    transactionCount: 24, 
  },
  {
    id: "f2",
    name: "Seminary Fund",
    amount: 3000,
    frequency: "PER_SEMESTER",
    description: "Contribution mandated by the college department.",
    required: true,
    allowInstallment: true,
    maxInstallments: 3,
    transactionCount: 15,
  },
  {
    id: "f3",
    name: "Field Trip",
    amount: 8500,
    frequency: "PER_EVENT",
    description: "External educational exposure trip covering bus logistics and entrance fees.",
    required: false,
    allowInstallment: true,
    maxInstallments: 4,
    transactionCount: 4,
  },
  {
    id: "f4",
    name: "Org Merchandise",
    amount: 600,
    frequency: "PER_SEMESTER",
    description: "Custom printed T-shirts and lanyards.",
    required: false,
    allowInstallment: false,
    transactionCount: 42,
  },
  {
    id: "f5",
    name: "Monthly Dues",
    amount: 50,
    frequency: "MONTHLY",
    description: "Standard operational club runway.",
    required: true,
    allowInstallment: false,
    transactionCount: 0, // Safe to delete
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getFundTypes(): Promise<FundTypesResponse> {
  await delay(600);
  
  let requiredSemTotal = 0;
  let installCount = 0;

  mockFundTypes.forEach(ft => {
    if (ft.frequency === "PER_SEMESTER" && ft.required) {
      requiredSemTotal += ft.amount;
    }
    if (ft.allowInstallment) {
      installCount++;
    }
  });

  return {
    kpis: {
      totalCategories: mockFundTypes.length,
      requiredPerSemesterTotal: requiredSemTotal,
      installmentEnabledCount: installCount,
    },
    fundTypes: JSON.parse(JSON.stringify(mockFundTypes)),
  };
}

export async function createFundType(payload: Omit<FundType, "id" | "transactionCount">): Promise<FundType> {
  await delay(800);
  const newFund: FundType = {
    ...payload,
    id: `f${Date.now()}`,
    transactionCount: 0,
  };
  mockFundTypes = [...mockFundTypes, newFund];
  return newFund;
}

export async function updateFundType(id: string, payload: Partial<Omit<FundType, "id" | "transactionCount">>): Promise<FundType> {
  await delay(800);
  const index = mockFundTypes.findIndex(f => f.id === id);
  if (index === -1) throw new Error("Not found");

  mockFundTypes[index] = { ...mockFundTypes[index], ...payload };
  return mockFundTypes[index];
}

export async function deleteFundType(id: string): Promise<{ success: boolean }> {
  await delay(800);
  const fund = mockFundTypes.find(f => f.id === id);
  if (!fund) throw new Error("Not found");
  
  if (fund.transactionCount > 0) {
    throw new Error(`Cannot delete: ${fund.transactionCount} transactions depend on this fund type.`);
  }

  mockFundTypes = mockFundTypes.filter(f => f.id !== id);
  return { success: true };
}
