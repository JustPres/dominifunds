export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ message: "Organization is required." }, { status: 400 });
  }

  const authorization = await getAuthorizedOfficerSession(orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const [funds, members] = await Promise.all([
    prisma.fundType.findMany({
      where: {
        orgId,
        archivedAt: null,
        allowInstallment: true,
      },
      select: { id: true, name: true, amount: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { orgId, role: "STUDENT" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    funds: funds.map((fund) => ({
      id: fund.id,
      name: fund.name,
      defaultAmount: fund.amount,
    })),
    members,
  });
}
