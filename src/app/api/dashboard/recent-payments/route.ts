export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    where: { status: "PAID" },
    include: { member: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const result = transactions.map((t) => ({
    id: t.id,
    memberName: t.member.name,
    date: t.createdAt.toISOString().split("T")[0],
    amount: t.amount,
  }));

  return NextResponse.json(result);
}
