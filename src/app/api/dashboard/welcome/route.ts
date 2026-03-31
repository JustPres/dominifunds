export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getActiveUserWhere } from "@/lib/user-lifecycle";

export async function GET() {
  const session = await auth();
  const orgId = session?.user?.orgId || "";

  if (!session?.user || session.user.role !== "OFFICER" || !orgId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const memberCount = await prisma.user.count({
    where: { orgId, role: "STUDENT", ...getActiveUserWhere() },
  });

  const allFunds = await prisma.fundType.findMany({ where: { orgId, archivedAt: null } });
  const totalExpected = allFunds.reduce((sum, f) => sum + f.amount, 0) * memberCount;

  const totalCollected = await prisma.transaction.aggregate({
    where: { status: "PAID", deletedAt: null, member: { orgId } },
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
