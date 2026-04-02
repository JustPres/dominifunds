export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getActiveFundWhere } from "@/lib/fund-lifecycle";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";
import { serializeFundType, sortSerializedFundTypes } from "@/lib/fund-type-utils";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const fundTypes = await prisma.fundType.findMany({
    where: {
      orgId: params.orgId,
      ...(includeArchived ? {} : getActiveFundWhere()),
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
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
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

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "FUND_TYPE",
    entityId: fundType.id,
    action: "CREATE",
    note: "Fund type created.",
    afterSnapshot: serializeFundType(fundType),
  });

  return NextResponse.json(serializeFundType(fundType), { status: 201 });
}
