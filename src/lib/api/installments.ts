// Mock API for Installments Page

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

// In-Memory Mocks
let mockPlans: InstallmentPlan[] = [
  {
    id: "plan-1",
    memberId: "m1",
    memberName: "Juan Santos",
    memberInitials: "JS",
    yearLevel: "4th",
    fundTypeId: "f1",
    fundTypeName: "Annual IT Fund",
    period: "2nd Sem 2025-2026",
    totalAmount: 1500,
    amountPerInstallment: 750,
    totalInstallments: 2,
    installmentsPaid: 1,
    entries: [
      { id: "e1-1", installmentNo: 1, amountDue: 750, dueDate: "2026-03-05", status: "PAID" },
      { id: "e1-2", installmentNo: 2, amountDue: 750, dueDate: "2026-04-15", status: "PENDING" },
    ],
  },
  {
    id: "plan-2",
    memberId: "m2",
    memberName: "Maria Reyes",
    memberInitials: "MR",
    yearLevel: "3rd",
    fundTypeId: "f2",
    fundTypeName: "Seminary Fund",
    period: "1st Sem 2026-2027",
    totalAmount: 3000,
    amountPerInstallment: 1000,
    totalInstallments: 3,
    installmentsPaid: 0,
    entries: [
      { id: "e2-1", installmentNo: 1, amountDue: 1000, dueDate: "2026-02-28", status: "OVERDUE" },
      { id: "e2-2", installmentNo: 2, amountDue: 1000, dueDate: "2026-03-30", status: "PENDING" },
      { id: "e2-3", installmentNo: 3, amountDue: 1000, dueDate: "2026-04-30", status: "PENDING" },
    ],
  },
];

const mockFundTypes: FundTypeOption[] = [
  { id: "f1", name: "Annual IT Fund", defaultAmount: 1500 },
  { id: "f2", name: "Seminary Fund", defaultAmount: 3000 },
  { id: "f3", name: "Field Trip", defaultAmount: 8500 },
];

const mockMembers: MemberOption[] = [
  { id: "m1", name: "Juan Santos" },
  { id: "m2", name: "Maria Reyes" },
  { id: "m3", name: "Pedro Dela Cruz" },
  { id: "m4", name: "Ken Ocampo" },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getInstallmentData(): Promise<InstallmentsResponse> {
  await delay(800);
  
  let overdueCount = 0;
  mockPlans.forEach(plan => {
    overdueCount += plan.entries.filter(e => e.status === "OVERDUE").length;
  });

  return {
    kpis: {
      activePlans: mockPlans.length,
      overdueEntries: overdueCount,
      completedPlansSemester: 15,
    },
    plans: JSON.parse(JSON.stringify(mockPlans)), // Prevent deep caching mutation conflicts
  };
}

export async function getInstallmentOptions(): Promise<{ funds: FundTypeOption[], members: MemberOption[] }> {
  await delay(400);
  return {
    funds: mockFundTypes,
    members: mockMembers,
  };
}

export async function payInstallment(planId: string, entryId: string): Promise<{ success: boolean }> {
  await delay(800);
  const plan = mockPlans.find((p) => p.id === planId);
  if (!plan) throw new Error("Plan not found");

  const entry = plan.entries.find((e) => e.id === entryId);
  if (!entry) throw new Error("Entry not found");

  entry.status = "PAID";
  // Recalculate paid count
  plan.installmentsPaid = plan.entries.filter((e) => e.status === "PAID").length;

  return { success: true };
}

export async function createInstallmentPlan(payload: {
  memberId: string;
  fundTypeId: string;
  totalAmount: number;
  numberOfInstallments: number;
  period: string;
  dueDates: string[]; // ISO strings
}): Promise<InstallmentPlan> {
  await delay(1200);

  const member = mockMembers.find((m) => m.id === payload.memberId);
  const fund = mockFundTypes.find((f) => f.id === payload.fundTypeId);
  if (!member || !fund) throw new Error("Invalid member or fund");

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const amtPer = Math.floor(payload.totalAmount / payload.numberOfInstallments);

  const newPlan: InstallmentPlan = {
    id: `plan-${Date.now()}`,
    memberId: member.id,
    memberName: member.name,
    memberInitials: initials,
    yearLevel: "1st", // Defaulting for mock
    fundTypeId: fund.id,
    fundTypeName: fund.name,
    period: payload.period,
    totalAmount: payload.totalAmount,
    amountPerInstallment: amtPer,
    totalInstallments: payload.numberOfInstallments,
    installmentsPaid: 0,
    entries: payload.dueDates.map((dateStr, idx) => ({
      id: `e-${Date.now()}-${idx}`,
      installmentNo: idx + 1,
      amountDue: amtPer,
      dueDate: dateStr,
      status: "PENDING",
    })),
  };

  mockPlans = [newPlan, ...mockPlans];
  return newPlan;
}
