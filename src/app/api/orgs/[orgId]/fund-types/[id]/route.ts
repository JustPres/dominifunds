export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";
import { serializeFundType } from "@/lib/fund-type-utils";

async function findFundType(orgId: string, fundTypeId: string) {
  return prisma.fundType.findFirst({
    where: {
      id: fundTypeId,
      orgId,
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
}

export async function PATCH(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await findFundType(params.orgId, params.id);

  if (!existing) {
    return NextResponse.json({ message: "Fund not found." }, { status: 404 });
  }

  if (existing.archivedAt) {
    return NextResponse.json({ message: "Archived funds are read-only." }, { status: 400 });
  }

  const body = await request.json();
  const name = body.name === undefined ? undefined : String(body.name).trim();
  const description = body.description === undefined ? undefined : String(body.description).trim();
  const amount = body.amount === undefined ? undefined : Number(body.amount);
  const allowInstallment = body.allowInstallment === undefined ? undefined : Boolean(body.allowInstallment);
  const maxInstallments =
    allowInstallment === undefined
      ? body.maxInstallments === undefined || body.maxInstallments === null
        ? undefined
        : Number(body.maxInstallments)
      : allowInstallment
      ? body.maxInstallments
        ? Number(body.maxInstallments)
        : null
      : null;

  if (name !== undefined && !name) {
    return NextResponse.json({ message: "Fund name is required." }, { status: 400 });
  }

  if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
    return NextResponse.json({ message: "Amount must be greater than zero." }, { status: 400 });
  }

  if (allowInstallment === true && (!maxInstallments || maxInstallments < 2)) {
    return NextResponse.json({ message: "Installment-enabled funds need at least 2 installments." }, { status: 400 });
  }

  const updated = await prisma.fundType.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(amount !== undefined ? { amount } : {}),
      ...(body.frequency !== undefined ? { frequency: body.frequency } : {}),
      ...(body.required !== undefined ? { required: Boolean(body.required) } : {}),
      ...(allowInstallment !== undefined ? { allowInstallment } : {}),
      ...(maxInstallments !== undefined ? { maxInstallments } : {}),
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
    entityId: updated.id,
    action: "UPDATE",
    note: "Fund type updated.",
    beforeSnapshot: existing,
    afterSnapshot: serializeFundType(updated),
  });

  return NextResponse.json(serializeFundType(updated));
}

export async function DELETE(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await findFundType(params.orgId, params.id);

  if (!existing) {
    return NextResponse.json({ message: "Fund not found." }, { status: 404 });
  }

  const hasUsage = existing._count.transactions > 0 || existing._count.installmentPlans > 0;

  if (hasUsage) {
    const archived = await prisma.fundType.update({
      where: { id: params.id },
      data: {
        archivedAt: existing.archivedAt ?? new Date(),
      },
    });

    await createActivityLog({
      orgId: params.orgId,
      actorUserId: authorization.session.user.id,
      actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
      entityType: "FUND_TYPE",
      entityId: archived.id,
      action: "DELETE",
      note: "Fund type archived after historical usage.",
      beforeSnapshot: existing,
      afterSnapshot: archived,
    });

    return NextResponse.json({ success: true, action: "archived" });
  }

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "FUND_TYPE",
    entityId: existing.id,
    action: "DELETE",
    note: "Unused fund type deleted.",
    beforeSnapshot: existing,
  });

  await prisma.fundType.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true, action: "deleted" });
}
