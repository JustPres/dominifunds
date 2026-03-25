export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "OFFICER" || !session.user.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { memberId, fundTypeId, amount, status, note, dueDate } = body;
  const normalizedAmount = Number(amount);

  if (!memberId || !fundTypeId || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [member, fundType] = await Promise.all([
    prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, orgId: true },
    }),
    prisma.fundType.findUnique({
      where: { id: fundTypeId },
      select: { id: true, name: true, orgId: true, archivedAt: true },
    }),
  ]);

  if (!member || member.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Member not found in this organization" }, { status: 400 });
  }

  if (!fundType || fundType.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Fund type not found in this organization" }, { status: 400 });
  }

  if (fundType.archivedAt) {
    return NextResponse.json({ error: "Archived funds cannot receive new payments" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      memberId,
      fundTypeId,
      type: "FULL_PAYMENT",
      status: status || "PAID",
      amount: normalizedAmount,
      dueDate: dueDate ? new Date(dueDate) : null,
      note: note || null,
    },
    include: {
      member: true,
      fundType: true,
    },
  });

  const initials = transaction.member.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return NextResponse.json(
    {
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
    },
    { status: 201 }
  );
}
