import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const memberId = params.id;

  const plans = await prisma.installmentPlan.findMany({
    where: { memberId },
    include: {
      fundType: true,
      entries: { orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = plans.map((p) => ({
    id: p.id,
    fundTypeName: p.fundType.name,
    totalAmount: p.entries.reduce((sum, e) => sum + e.amountDue, 0),
    status: p.status,
    entries: p.entries.map((e, idx) => ({
      id: e.id,
      installmentNo: idx + 1,
      amountDue: e.amountDue,
      dueDate: e.dueDate.toISOString().split("T")[0],
      status: e.status,
      amount: e.amountDue,
    })),
  }));

  return NextResponse.json(result);
}
