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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getMonthlyDues(orgId: string, month: number, year: number): Promise<MonthlyDuesResponse> {
  await delay(800); // simulate network latency

  // Generate some random fake data based on month/year
  const paddedMonth = month.toString().padStart(2, "0");
  
  // Date 1: has both
  const date1 = `${year}-${paddedMonth}-05`;
  // Date 2: has only installment
  const date2 = `${year}-${paddedMonth}-15`;
  // Date 3: has only full payment
  const date3 = `${year}-${paddedMonth}-25`;

  const duesByDate: Record<string, DayDues> = {
    [date1]: {
      dateString: date1,
      items: [
        {
          id: "d1",
          memberId: "m1",
          memberName: "Juan Santos",
          fundType: "Seminary Fund",
          dueType: "INSTALLMENT",
          installmentInfo: "Installment 1 of 3",
          amountDue: 500,
        },
        {
          id: "d2",
          memberId: "m2",
          memberName: "Maria Reyes",
          fundType: "Event Fee",
          dueType: "FULL",
          amountDue: 1500,
        },
      ],
    },
    [date2]: {
      dateString: date2,
      items: [
        {
          id: "d3",
          memberId: "m3",
          memberName: "Pedro Dela Cruz",
          fundType: "Annual IT Fund",
          dueType: "INSTALLMENT",
          installmentInfo: "Installment 2 of 2",
          amountDue: 1000,
        },
      ],
    },
    [date3]: {
      dateString: date3,
      items: [
        {
          id: "d4",
          memberId: "m4",
          memberName: "Clara Luna",
          fundType: "Field Trip",
          dueType: "FULL",
          amountDue: 3500,
        },
        {
          id: "d5",
          memberId: "m5",
          memberName: "Mark Bautista",
          fundType: "Field Trip",
          dueType: "FULL",
          amountDue: 3500,
        },
      ],
    },
  };

  return {
    duesByDate,
    summary: {
      installmentsCount: 2,
      fullPaymentsCount: 3,
      fullyCurrentMembers: 40,
    },
  };
}

export async function sendReminder(memberId: string): Promise<{ success: boolean }> {
  await delay(600);
  console.log(`Reminder sent to member ${memberId}`);
  return { success: true };
}
