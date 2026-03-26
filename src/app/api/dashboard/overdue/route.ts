export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = session?.user?.orgId;

  if (!session?.user || session.user.role !== "OFFICER" || !orgId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const overdueEntries = await prisma.installmentEntry.findMany({
    where: {
      status: "OVERDUE",
      deletedAt: null,
      plan: { member: { orgId } },
    },
    include: {
      plan: { include: { member: true } },
    },
  });

  // Group by member and sum overdue amounts
  const memberMap = new Map<string, { id: string; name: string; amount: number }>();
  for (const entry of overdueEntries) {
    const memberId = entry.plan.memberId;
    const existing = memberMap.get(memberId);
    if (existing) {
      existing.amount += entry.amountDue;
    } else {
      memberMap.set(memberId, {
        id: memberId,
        name: entry.plan.member.name,
        amount: entry.amountDue,
      });
    }
  }

  return NextResponse.json(Array.from(memberMap.values()));
}
