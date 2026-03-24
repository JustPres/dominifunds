// Mock API for Calendar Dues

export interface DueItem {
  id: string;
  memberId: string;
  memberName: string;
  fundType: string;
  dueType: "INSTALLMENT" | "FULL";
  installmentInfo?: string; // e.g. "Installment 1 of 2"
  amountDue: number;
}

export interface DayDues {
  dateString: string; // ISO yyyy-MM-dd
  items: DueItem[];
}

export interface MonthSummary {
  installmentsCount: number;
  fullPaymentsCount: number;
  fullyCurrentMembers: number;
}

export interface MonthlyDuesResponse {
  duesByDate: Record<string, DayDues>;
  summary: MonthSummary;
}

export async function getMonthlyDues(orgId: string, month: number, year: number): Promise<MonthlyDuesResponse> {
  const paddedMonth = month.toString().padStart(2, "0");
  const res = await fetch(`/api/orgs/${orgId}/dues?month=${paddedMonth}&year=${year}`);
  
  if (!res.ok) {
    return {
      duesByDate: {},
      summary: {
        installmentsCount: 0,
        fullPaymentsCount: 0,
        fullyCurrentMembers: 0,
      },
    };
  }

  return await res.json();
}

export async function sendReminder(memberId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId }),
  });
  
  return res.ok ? { success: true } : { success: false };
}
