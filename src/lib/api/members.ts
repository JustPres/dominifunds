// Mock API for Members Data

export type MemberStatus = "Good Standing" | "Has Installment Plan" | "Overdue";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "President" | "Treasurer" | "Secretary" | "Member";
  yearLevel: "1st" | "2nd" | "3rd" | "4th";
  totalPaid: number;
  activeInstallmentPlans: number;
  balanceDue: number;
  status: MemberStatus;
}

// In-memory mock database
let mockMembers: Member[] = [
  {
    id: "uuid-1",
    name: "Juan Dela Cruz",
    email: "juan@example.com",
    role: "President",
    yearLevel: "4th",
    totalPaid: 4500,
    activeInstallmentPlans: 0,
    balanceDue: 0,
    status: "Good Standing",
  },
  {
    id: "uuid-2",
    name: "Maria Reyes",
    email: "maria@example.com",
    role: "Treasurer",
    yearLevel: "3rd",
    totalPaid: 1500,
    activeInstallmentPlans: 1,
    balanceDue: 1500,
    status: "Has Installment Plan",
  },
  {
    id: "uuid-3",
    name: "Pedro Santos",
    email: "pedro@example.com",
    role: "Member",
    yearLevel: "2nd",
    totalPaid: 500,
    activeInstallmentPlans: 0,
    balanceDue: 2500,
    status: "Overdue",
  },
  {
    id: "uuid-4",
    name: "Clara Luna",
    email: "clara@example.com",
    role: "Secretary",
    yearLevel: "3rd",
    totalPaid: 2000,
    activeInstallmentPlans: 0,
    balanceDue: 0,
    status: "Good Standing",
  },
  {
    id: "uuid-5",
    name: "Ken Ocampo",
    email: "ken@example.com",
    role: "Member",
    yearLevel: "1st",
    totalPaid: 1000,
    activeInstallmentPlans: 2,
    balanceDue: 1000,
    status: "Has Installment Plan",
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getMembers(): Promise<Member[]> {
  await delay(800); // Simulate network latency
  // Return a copy so cache doesn't mutate object identically
  return [...mockMembers];
}

export async function addMember(memberData: Omit<Member, "id" | "totalPaid" | "activeInstallmentPlans" | "balanceDue" | "status">): Promise<Member> {
  await delay(1000); 

  const newMember: Member = {
    ...memberData,
    id: `uuid-${Date.now()}`,
    totalPaid: 0,
    activeInstallmentPlans: 0,
    balanceDue: 0,
    status: "Good Standing", // By default since they have no dues yet
  };

  mockMembers = [newMember, ...mockMembers];

  return newMember;
}
