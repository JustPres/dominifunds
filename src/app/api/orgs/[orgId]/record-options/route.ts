import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const orgId = params.orgId;

  const funds = await prisma.fundType.findMany({
    where: { orgId },
    select: { id: true, name: true },
  });

  const members = await prisma.user.findMany({
    where: { orgId, role: "STUDENT" },
    select: { id: true, name: true },
  });

  return NextResponse.json({ funds, members });
}
