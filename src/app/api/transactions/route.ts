import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { memberId, fundTypeId, amount, status, dueDate, note } = body;

  if (!memberId || !fundTypeId || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      memberId,
      fundTypeId,
      type: "FULL_PAYMENT",
      status: status || "PAID",
      amount: parseFloat(amount),
      note: note || null,
    },
    include: {
      member: true,
      fundType: true,
    },
  });

  const initials = transaction.member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return NextResponse.json({
    id: transaction.id,
    memberId: transaction.memberId,
    memberName: transaction.member.name,
    memberInitials: initials,
    fundTypeId: transaction.fundTypeId,
    fundTypeName: transaction.fundType.name,
    type: transaction.type,
    amount: transaction.amount,
    date: transaction.createdAt.toISOString().split("T")[0],
    note: transaction.note || undefined,
    status: transaction.status,
  }, { status: 201 });
}
