import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const funds = await prisma.fundType.findMany({
    select: { id: true, name: true, amount: true },
  });

  const members = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true },
  });

  return NextResponse.json({
    funds: funds.map((f) => ({
      id: f.id,
      name: f.name,
      defaultAmount: f.amount,
    })),
    members,
  });
}
