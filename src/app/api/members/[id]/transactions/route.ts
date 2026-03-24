import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const memberId = params.id;

  const transactions = await prisma.transaction.findMany({
    where: { memberId },
    include: { fundType: true },
    orderBy: { createdAt: "desc" },
  });

  const result = transactions.map((t) => ({
    id: t.id,
    fundTypeName: t.fundType.name,
    type: t.type,
    amount: t.amount,
    status: t.status,
    date: t.createdAt.toISOString().split("T")[0],
    note: t.note || undefined,
    installmentInfo: t.installmentInfo || undefined,
  }));

  return NextResponse.json(result);
}
