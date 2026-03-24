export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // For now, derive from the first officer's org
  const officer = await prisma.user.findFirst({ where: { role: "OFFICER" } });
  const orgId = officer?.orgId || "";

  const memberCount = await prisma.user.count({
    where: { orgId, role: "STUDENT" },
  });

  const allFunds = await prisma.fundType.findMany({ where: { orgId } });
  const totalExpected = allFunds.reduce((sum, f) => sum + f.amount, 0) * memberCount;

  const totalCollected = await prisma.transaction.aggregate({
    where: { status: "PAID", member: { orgId } },
    _sum: { amount: true },
  });

  const collectionRate = totalExpected > 0
    ? Math.round(((totalCollected._sum.amount || 0) / totalExpected) * 100)
    : 0;

  return NextResponse.json({
    orgName: orgId || "Organization",
    memberCount,
    collectionRate,
  });
}
