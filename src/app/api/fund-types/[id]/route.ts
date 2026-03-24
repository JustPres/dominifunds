import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const fundType = await prisma.fundType.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.required !== undefined && { required: body.required }),
    },
  });

  return NextResponse.json({
    id: fundType.id,
    name: fundType.name,
    amount: fundType.amount,
    frequency: "PER_SEMESTER",
    description: fundType.description || "",
    required: fundType.required,
    allowInstallment: true,
    maxInstallments: null,
    transactionCount: 0,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const txCount = await prisma.transaction.count({
    where: { fundTypeId: params.id },
  });

  if (txCount > 0) {
    return NextResponse.json(
      { message: "Cannot delete fund type with existing transactions" },
      { status: 400 }
    );
  }

  await prisma.fundType.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
