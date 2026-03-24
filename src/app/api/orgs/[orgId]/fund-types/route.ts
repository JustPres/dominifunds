import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const orgId = params.orgId;

  const fundTypes = await prisma.fundType.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ fundTypes });
}

export async function POST(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const orgId = params.orgId;
  const body = await request.json();

  const fundType = await prisma.fundType.create({
    data: {
      name: body.name,
      description: body.description || null,
      amount: parseFloat(body.amount),
      required: body.required || false,
      orgId,
    },
  });

  return NextResponse.json(fundType, { status: 201 });
}
