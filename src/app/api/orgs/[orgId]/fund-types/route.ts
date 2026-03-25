export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serializeFundType, sortSerializedFundTypes } from "@/lib/fund-type-utils";

function isAuthorized(role?: string, sessionOrgId?: string | null, requestedOrgId?: string) {
  return role === "OFFICER" && sessionOrgId === requestedOrgId;
}

function canReadOrgFunds(sessionOrgId?: string | null, requestedOrgId?: string) {
  return sessionOrgId === requestedOrgId;
}

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const session = await auth();

  if (!canReadOrgFunds(session?.user?.orgId, params.orgId)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const fundTypes = await prisma.fundType.findMany({
    where: {
      orgId: params.orgId,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    include: {
      _count: {
        select: {
          transactions: true,
          installmentPlans: true,
        },
      },
    },
  });

  const serialized = sortSerializedFundTypes(fundTypes.map((fundType) => serializeFundType(fundType)));
  const activeFundTypes = serialized.filter((fundType) => !fundType.isArchived);

  return NextResponse.json({
    kpis: {
      totalCategories: activeFundTypes.length,
      requiredPerSemesterTotal: activeFundTypes
        .filter((fundType) => fundType.required)
        .reduce((sum, fundType) => sum + fundType.amount, 0),
      installmentEnabledCount: activeFundTypes.filter((fundType) => fundType.allowInstallment).length,
    },
    fundTypes: serialized,
  });
}

export async function POST(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const session = await auth();

  if (!isAuthorized(session?.user?.role, session?.user?.orgId, params.orgId)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const amount = Number(body.amount);
  const allowInstallment = Boolean(body.allowInstallment);
  const maxInstallments = allowInstallment && body.maxInstallments ? Number(body.maxInstallments) : null;

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: "Invalid fund name or amount." }, { status: 400 });
  }

  if (allowInstallment && (!maxInstallments || maxInstallments < 2)) {
    return NextResponse.json({ message: "Installment-enabled funds need at least 2 installments." }, { status: 400 });
  }

  const fundType = await prisma.fundType.create({
    data: {
      name,
      description: description || null,
      amount,
      frequency: body.frequency || "PER_SEMESTER",
      required: Boolean(body.required),
      allowInstallment,
      maxInstallments,
      orgId: params.orgId,
    },
    include: {
      _count: {
        select: {
          transactions: true,
          installmentPlans: true,
        },
      },
    },
  });

  return NextResponse.json(serializeFundType(fundType), { status: 201 });
}
