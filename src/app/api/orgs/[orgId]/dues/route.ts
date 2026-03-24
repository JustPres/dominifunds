import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const orgId = params.orgId;

  if (!month || !year) {
    return NextResponse.json({ duesByDate: {}, summary: { installmentsCount: 0, fullPaymentsCount: 0, fullyCurrentMembers: 0 } });
  }

  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

  // Get installment entries due this month for members in this org
  const installmentEntries = await prisma.installmentEntry.findMany({
    where: {
      dueDate: { gte: startDate, lte: endDate },
      plan: {
        member: { orgId },
      },
    },
    include: {
      plan: {
        include: {
          member: true,
          fundType: true,
          entries: true,
        },
      },
    },
  });

  // Get full payment transactions due this month
  const fullPayments = await prisma.transaction.findMany({
    where: {
      type: "FULL_PAYMENT",
      createdAt: { gte: startDate, lte: endDate },
      member: { orgId },
    },
    include: {
      member: true,
      fundType: true,
    },
  });

  const duesByDate: Record<string, { dateString: string; items: unknown[] }> = {};

  // Map installment entries
  for (const entry of installmentEntries) {
    const dateStr = entry.dueDate.toISOString().split("T")[0];
    if (!duesByDate[dateStr]) {
      duesByDate[dateStr] = { dateString: dateStr, items: [] };
    }
    const entryIndex = entry.plan.entries.findIndex((e) => e.id === entry.id) + 1;
    const totalEntries = entry.plan.entries.length;

    duesByDate[dateStr].items.push({
      id: entry.id,
      memberId: entry.plan.memberId,
      memberName: entry.plan.member.name,
      fundType: entry.plan.fundType.name,
      dueType: "INSTALLMENT",
      installmentInfo: `Installment ${entryIndex} of ${totalEntries}`,
      amountDue: entry.amountDue,
    });
  }

  // Map full payments
  for (const tx of fullPayments) {
    const dateStr = tx.createdAt.toISOString().split("T")[0];
    if (!duesByDate[dateStr]) {
      duesByDate[dateStr] = { dateString: dateStr, items: [] };
    }
    duesByDate[dateStr].items.push({
      id: tx.id,
      memberId: tx.memberId,
      memberName: tx.member.name,
      fundType: tx.fundType.name,
      dueType: "FULL",
      amountDue: tx.amount,
    });
  }

  // Count members in good standing
  const totalMembers = await prisma.user.count({
    where: { orgId, role: "STUDENT" },
  });

  const summary = {
    installmentsCount: installmentEntries.length,
    fullPaymentsCount: fullPayments.length,
    fullyCurrentMembers: totalMembers,
  };

  return NextResponse.json({ duesByDate, summary });
}
