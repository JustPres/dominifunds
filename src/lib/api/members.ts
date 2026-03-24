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

// Mocks removed



export async function getMembers(): Promise<Member[]> {
  try {
    const res = await fetch("/api/members");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function addMember(memberData: Omit<Member, "id" | "totalPaid" | "activeInstallmentPlans" | "balanceDue" | "status">): Promise<Member> {
  const res = await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(memberData)
  });
  if (!res.ok) throw new Error("Failed to add member");
  return res.json();
}
