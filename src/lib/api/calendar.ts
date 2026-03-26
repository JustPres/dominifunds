export interface DueItem {
  id: string;
  memberId: string;
  memberName: string;
  sectionName: string;
  fundType: string;
  dueType: "INSTALLMENT" | "FULL";
  installmentInfo?: string;
  amountDue: number;
  paymentMode: "Full" | "Installment" | "Mixed";
  latestPaymentDate?: string | null;
}

export interface DayDues {
  dateString: string;
  items: DueItem[];
}

export interface MonthSummary {
  scheduledDaysCount: number;
  installmentCount: number;
  fullPaymentsCount: number;
  membersScheduled: number;
  fullyCurrentMembers: number;
}

export interface CollectionScheduleItem {
  id: string;
  memberId: string | null;
  memberName: string | null;
  scope: "ORG_DEFAULT" | "MEMBER_OVERRIDE";
  name: string | null;
  weekdays: number[];
  note: string | null;
}

export interface SectionProgress {
  sectionId: string | null;
  sectionName: string;
  totalMembers: number;
  fullyPaidMembers: number;
  completionRate: number;
  outstandingAmount: number;
}

export interface CollectionRosterRow {
  memberId: string;
  memberName: string;
  sectionName: string;
  paymentMode: "Full" | "Installment" | "Mixed";
  amountDue: number;
  latestPaymentDate: string | null;
  dueItems: Array<{
    kind: "FULL" | "INSTALLMENT";
    fundName: string;
    amount: number;
    dueDate: string | null;
    installmentInfo?: string;
  }>;
}

export interface CollectionRosterResponse {
  date: string;
  weekday: string;
  activePeriod: {
    id: string;
    name: string;
    startDate: string | null;
    endDate: string | null;
    isActive: boolean;
  } | null;
  roster: CollectionRosterRow[];
  sectionProgress: SectionProgress[];
  sections: Array<{ id: string; name: string }>;
}

export interface MonthlyDuesResponse {
  duesByDate: Record<string, DayDues>;
  summary: MonthSummary;
  activePeriod: {
    id: string;
    name: string;
    startDate: string | null;
    endDate: string | null;
    isActive: boolean;
  } | null;
  schedules: CollectionScheduleItem[];
  sectionProgress: SectionProgress[];
}

export async function getMonthlyDues(orgId: string, month: number, year: number): Promise<MonthlyDuesResponse> {
  const paddedMonth = month.toString().padStart(2, "0");
  const res = await fetch(`/api/orgs/${orgId}/dues?month=${paddedMonth}&year=${year}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      duesByDate: {},
      summary: {
        scheduledDaysCount: 0,
        installmentCount: 0,
        fullPaymentsCount: 0,
        membersScheduled: 0,
        fullyCurrentMembers: 0,
      },
      activePeriod: null,
      schedules: [],
      sectionProgress: [],
    };
  }

  return await res.json();
}

export async function getCollectionRoster(
  orgId: string,
  date: string,
  sectionId?: string
): Promise<CollectionRosterResponse> {
  const params = new URLSearchParams({ date });

  if (sectionId && sectionId !== "ALL") {
    params.set("sectionId", sectionId);
  }

  const res = await fetch(`/api/orgs/${orgId}/collection-roster?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      date,
      weekday: "",
      activePeriod: null,
      roster: [],
      sectionProgress: [],
      sections: [],
    };
  }

  return await res.json();
}

export function openCollectionRosterPrint(orgId: string, date: string, sectionId?: string) {
  const params = new URLSearchParams({
    date,
    autoprint: "1",
  });

  if (sectionId && sectionId !== "ALL") {
    params.set("sectionId", sectionId);
  }

  window.open(
    `/dashboard/due-calendar/report/print?orgId=${encodeURIComponent(orgId)}&${params.toString()}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export async function sendReminder(memberId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId }),
  });

  return res.ok ? { success: true } : { success: false };
}
