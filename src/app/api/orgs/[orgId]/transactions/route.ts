export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      member: { orgId: params.orgId },
      deletedAt: null,
    },
    include: {
      member: true,
      fundType: true,
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
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
      date: (t.paidAt ?? t.createdAt).toISOString().split("T")[0],
      dueDate: t.dueDate?.toISOString().split("T")[0] ?? undefined,
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
