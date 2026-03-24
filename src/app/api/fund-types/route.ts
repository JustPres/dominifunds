export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const fundTypes = await prisma.fundType.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { transactions: true } },
    },
  });

  const mapped = fundTypes.map((f) => ({
    id: f.id,
    name: f.name,
    amount: f.amount,
    frequency: "PER_SEMESTER",
    description: f.description || "",
    required: f.required,
    allowInstallment: true,
    maxInstallments: null,
    transactionCount: f._count.transactions,
  }));

  const totalCategories = mapped.length;
  const requiredPerSemesterTotal = mapped
    .filter((f) => f.required)
    .reduce((sum, f) => sum + f.amount, 0);
  const installmentEnabledCount = mapped.filter((f) => f.allowInstallment).length;

  return NextResponse.json({
    kpis: { totalCategories, requiredPerSemesterTotal, installmentEnabledCount },
    fundTypes: mapped,
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const fundType = await prisma.fundType.create({
    data: {
      name: body.name,
      description: body.description || null,
      amount: parseFloat(body.amount),
      required: body.required || false,
      orgId: body.orgId || "",
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
  }, { status: 201 });
}
