// Mock API for Transactions

export type TransactionType = "FULL_PAYMENT" | "INSTALLMENT_PAYMENT";
export type TransactionStatus = "PAID" | "PENDING" | "OVERDUE";

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  memberInitials: string;
  fundTypeId: string;
  fundTypeName: string;
  type: TransactionType;
  installmentInfo?: string; // e.g. "Installment 2 of 3"
  amount: number;
  date: string;
  note?: string;
  status: TransactionStatus;
}

export interface FundTypeItem {
  id: string;
  name: string;
}

export interface TransactionsKPIs {
  totalCollected: number;
  installmentPaymentsCount: number;
  fullPaymentsCount: number;
}

export interface TransactionsResponse {
  kpis: TransactionsKPIs;
  fundTypes: FundTypeItem[];
  transactions: Transaction[];
}

// Generate realistic mock data
const mockTransactions: Transaction[] = [
  {
    id: "tx-100",
    memberId: "m1",
    memberName: "Juan Santos",
    memberInitials: "JS",
    fundTypeId: "f1",
    fundTypeName: "Annual IT Fund",
    type: "FULL_PAYMENT",
    amount: 1500,
    date: "2026-03-20",
    note: "Paid in cash",
    status: "PAID",
  },
  {
    id: "tx-101",
    memberId: "m2",
    memberName: "Maria Reyes",
    memberInitials: "MR",
    fundTypeId: "f2",
    fundTypeName: "Seminary Fund",
    type: "INSTALLMENT_PAYMENT",
    installmentInfo: "Installment 1 of 3",
    amount: 1000,
    date: "2026-03-19",
    status: "PAID",
  },
  {
    id: "tx-102",
    memberId: "m3",
    memberName: "Pedro Dela Cruz",
    memberInitials: "PD",
    fundTypeId: "f1",
    fundTypeName: "Annual IT Fund",
    type: "INSTALLMENT_PAYMENT",
    installmentInfo: "Installment 1 of 2",
    amount: 750,
    date: "2026-03-18",
    status: "PAID",
  },
  {
    id: "tx-103",
    memberId: "m4",
    memberName: "Ken Ocampo",
    memberInitials: "KO",
    fundTypeId: "f3",
    fundTypeName: "Field Trip",
    type: "FULL_PAYMENT",
    amount: 8500,
    date: "2026-03-15",
    note: "Bank transfer",
    status: "PAID",
  },
  {
    id: "tx-104",
    memberId: "m1",
    memberName: "Juan Santos",
    memberInitials: "JS",
    fundTypeId: "f2",
    fundTypeName: "Seminary Fund",
    type: "INSTALLMENT_PAYMENT",
    installmentInfo: "Installment 2 of 3",
    amount: 1000,
    date: "2026-03-10",
    status: "PAID",
  },
  {
    id: "tx-105",
    memberId: "m5",
    memberName: "Clara Luna",
    memberInitials: "CL",
    fundTypeId: "f1",
    fundTypeName: "Annual IT Fund",
    type: "FULL_PAYMENT",
    amount: 1500,
    date: "2026-03-05",
    status: "PENDING",
  },
  {
    id: "tx-106",
    memberId: "m6",
    memberName: "Tony Stark",
    memberInitials: "TS",
    fundTypeId: "f4",
    fundTypeName: "Org Merchandise",
    type: "FULL_PAYMENT",
    amount: 600,
    date: "2026-03-01",
    note: "T-Shirt pre-order",
    status: "PAID",
  },
  {
    id: "tx-107",
    memberId: "m7",
    memberName: "Bruce Wayne",
    memberInitials: "BW",
    fundTypeId: "f2",
    fundTypeName: "Seminary Fund",
    type: "INSTALLMENT_PAYMENT",
    installmentInfo: "Installment 1 of 3",
    amount: 1000,
    date: "2026-02-28",
    status: "OVERDUE",
  },
];

const mockFundTypes = [
  { id: "f1", name: "Annual IT Fund" },
  { id: "f2", name: "Seminary Fund" },
  { id: "f3", name: "Field Trip" },
  { id: "f4", name: "Org Merchandise" },
];

const mockMembers = [
  { id: "m1", name: "Juan Santos" },
  { id: "m2", name: "Maria Reyes" },
  { id: "m3", name: "Pedro Dela Cruz" },
  { id: "m4", name: "Ken Ocampo" },
  { id: "m5", name: "Clara Luna" },
  { id: "m6", name: "Tony Stark" },
  { id: "m7", name: "Bruce Wayne" },
];

let globalTransactions = [...mockTransactions];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getTransactions(): Promise<TransactionsResponse> {
  await delay(600);
  
  let totalCollected = 0;
  let installmentPaymentsCount = 0;
  let fullPaymentsCount = 0;

  globalTransactions.forEach(tx => {
    if (tx.status === "PAID") totalCollected += tx.amount;
    if (tx.type === "INSTALLMENT_PAYMENT") installmentPaymentsCount++;
    if (tx.type === "FULL_PAYMENT") fullPaymentsCount++;
  });

  return {
    kpis: {
      totalCollected,
      installmentPaymentsCount,
      fullPaymentsCount,
    },
    fundTypes: mockFundTypes,
    transactions: JSON.parse(JSON.stringify(globalTransactions)), // Prevent cache mutation
  };
}

export async function getRecordOptions(): Promise<{ funds: FundTypeItem[], members: {id: string, name: string}[] }> {
  await delay(300);
  return {
    funds: mockFundTypes,
    members: mockMembers,
  };
}

export async function recordFullPayment(payload: {
  memberId: string;
  fundTypeId: string;
  amount: number;
  status: TransactionStatus;
  dueDate: string;
  note?: string;
}): Promise<Transaction> {
  await delay(1000);

  const member = mockMembers.find((m) => m.id === payload.memberId);
  const fund = mockFundTypes.find((f) => f.id === payload.fundTypeId);
  if (!member || !fund) throw new Error("Invalid selection");

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    memberId: member.id,
    memberName: member.name,
    memberInitials: initials,
    fundTypeId: fund.id,
    fundTypeName: fund.name,
    type: "FULL_PAYMENT",
    amount: payload.amount,
    date: payload.dueDate, // using due date as record date for mock
    status: payload.status,
    note: payload.note,
  };

  globalTransactions = [newTx, ...globalTransactions];

  return newTx;
}
