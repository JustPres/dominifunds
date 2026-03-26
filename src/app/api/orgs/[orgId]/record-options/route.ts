export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const [funds, members] = await Promise.all([
    prisma.fundType.findMany({
      where: {
        orgId: params.orgId,
        archivedAt: null,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { orgId: params.orgId, role: "STUDENT" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ funds, members });
}
