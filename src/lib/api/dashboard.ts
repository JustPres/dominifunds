// Mock API to simulate fetching dashboard metrics

export interface WelcomeMetrics {
  orgName: string;
  memberCount: number;
  collectionRate: number; // percentage
}

export interface KPIMetrics {
  totalCollected: number;
  activePlans: number;
  overdueInstallments: number;
  fullyPaidMembers: number;
}

export interface ActivePlan {
  id: string;
  memberInitials: string;
  memberName: string;
  fundType: string;
  progress: string; // e.g., "1 of 2 paid"
  nextDueDate: string; // ISO string or formatted date
  status: "ONGOING" | "OVERDUE" | "COMPLETED";
}

export interface OverdueMember {
  id: string;
  name: string;
  amount: number;
}

export interface RecentPayment {
  id: string;
  memberName: string;
  date: string; // ISO string
  amount: number;
}

export interface RecentChange {
  id: string;
  action: string;
  entityType: string;
  actorName: string;
  note: string | null;
  createdAt: string;
}

export async function getWelcomeMetrics(): Promise<WelcomeMetrics> {
  try {
    const res = await fetch("/api/dashboard/welcome");
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return { orgName: "Org", memberCount: 0, collectionRate: 0 };
  }
}

export async function getKPIMetrics(): Promise<KPIMetrics> {
  try {
    const res = await fetch("/api/dashboard/kpi");
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return { totalCollected: 0, activePlans: 0, overdueInstallments: 0, fullyPaidMembers: 0 };
  }
}

export async function getActivePlans(): Promise<ActivePlan[]> {
  try {
    const res = await fetch("/api/dashboard/active-plans");
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}

export async function getOverdueMembers(): Promise<OverdueMember[]> {
  try {
    const res = await fetch("/api/dashboard/overdue");
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}

export async function getRecentPayments(): Promise<RecentPayment[]> {
  try {
    const res = await fetch("/api/dashboard/recent-payments");
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}

export async function getRecentChanges(): Promise<RecentChange[]> {
  try {
    const res = await fetch("/api/dashboard/recent-changes");
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}
