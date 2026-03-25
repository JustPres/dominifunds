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

export async function getTransactions(orgId: string): Promise<TransactionsResponse> {
  const res = await fetch(`/api/orgs/${orgId}/transactions`);
  if (!res.ok) {
    return {
      kpis: {
        totalCollected: 0,
        installmentPaymentsCount: 0,
        fullPaymentsCount: 0,
      },
      fundTypes: [],
      transactions: [],
    };
  }
  return await res.json();
}

export async function getRecordOptions(orgId: string): Promise<{ funds: FundTypeItem[], members: {id: string, name: string}[] }> {
  const res = await fetch(`/api/orgs/${orgId}/record-options`);
  if (!res.ok) {
    return { funds: [], members: [] };
  }
  return await res.json();
}

export async function recordFullPayment(payload: {
  memberId: string;
  fundTypeId: string;
  amount: number;
  status: TransactionStatus;
  dueDate: string;
  note?: string;
}): Promise<Transaction> {
  const res = await fetch(`/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to record transaction");
  }

  return await res.json();
}
