export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "OFFICER" || session.user.orgId !== params.orgId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { member: { orgId: params.orgId } },
    include: {
      member: true,
      fundType: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const fundTypes = await prisma.fundType.findMany({
    where: { orgId: params.orgId },
    select: { id: true, name: true },
  });

  const totalCollected = transactions
    .filter((t) => t.status === "PAID")
    .reduce((sum, t) => sum + t.amount, 0);
  const installmentPaymentsCount = transactions.filter((t) => t.type === "INSTALLMENT_PAYMENT").length;
  const fullPaymentsCount = transactions.filter((t) => t.type === "FULL_PAYMENT").length;

  const mapped = transactions.map((t) => {
    const initials = t.member.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return {
      id: t.id,
      memberId: t.memberId,
      memberName: t.member.name,
      memberInitials: initials,
      fundTypeId: t.fundTypeId,
      fundTypeName: t.fundType.name,
      type: t.type,
      installmentInfo: t.installmentInfo || undefined,
      amount: t.amount,
      date: t.createdAt.toISOString().split("T")[0],
      note: t.note || undefined,
      status: t.status,
    };
  });

  return NextResponse.json({
    kpis: {
      totalCollected,
      installmentPaymentsCount,
      fullPaymentsCount,
    },
    fundTypes,
    transactions: mapped,
  });
}
