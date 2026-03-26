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

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "PAID",
      deletedAt: null,
      member: { orgId },
    },
    include: { member: true },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  const result = transactions.map((t) => ({
    id: t.id,
    memberName: t.member.name,
    date: (t.paidAt ?? t.createdAt).toISOString().split("T")[0],
    amount: t.amount,
  }));

  return NextResponse.json(result);
}
