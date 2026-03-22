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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getWelcomeMetrics(): Promise<WelcomeMetrics> {
  await delay(800);
  return {
    orgName: "SDCA BSIT",
    memberCount: 45,
    collectionRate: 82.5,
  };
}

export async function getKPIMetrics(): Promise<KPIMetrics> {
  await delay(1200);
  return {
    totalCollected: 125400,
    activePlans: 18,
    overdueInstallments: 5,
    fullyPaidMembers: 22,
  };
}

export async function getActivePlans(): Promise<ActivePlan[]> {
  await delay(1500);
  return [
    {
      id: "1",
      memberInitials: "JS",
      memberName: "Juan Santos",
      fundType: "Annual IT Fund",
      progress: "1 of 2 paid",
      nextDueDate: "2026-04-15",
      status: "ONGOING",
    },
    {
      id: "2",
      memberInitials: "MR",
      memberName: "Maria Reyes",
      fundType: "Seminary Fund",
      progress: "0 of 3 paid",
      nextDueDate: "2026-03-25",
      status: "OVERDUE",
    },
    {
      id: "3",
      memberInitials: "PD",
      memberName: "Pedro Dela Cruz",
      fundType: "Annual IT Fund",
      progress: "2 of 2 paid",
      nextDueDate: "-",
      status: "COMPLETED",
    },
    {
      id: "4",
      memberInitials: "CL",
      memberName: "Clara Luna",
      fundType: "Seminary Fund",
      progress: "1 of 3 paid",
      nextDueDate: "2026-04-20",
      status: "ONGOING",
    },
  ];
}

export async function getOverdueMembers(): Promise<OverdueMember[]> {
  await delay(1000);
  return [
    { id: "1", name: "Maria Reyes", amount: 1500 },
    { id: "2", name: "Jose Bautista", amount: 2000 },
    { id: "3", name: "Ana Castro", amount: 750 },
  ];
}

export async function getRecentPayments(): Promise<RecentPayment[]> {
  await delay(1000);
  return [
    { id: "p1", memberName: "Leo Torres", date: "2026-03-22T10:30:00Z", amount: 2500 },
    { id: "p2", memberName: "Diana Lim", date: "2026-03-21T14:15:00Z", amount: 2500 },
    { id: "p3", memberName: "Ken Go", date: "2026-03-20T09:45:00Z", amount: 2500 },
  ];
}
