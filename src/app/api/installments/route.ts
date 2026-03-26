export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { FundFrequency } from "@prisma/client";
import { createActivityLog } from "@/lib/activity-log";
import { getActiveCollectionPeriod } from "@/lib/collection-scheduling";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";
import { syncInstallmentStatuses } from "@/lib/member-report";
import { formatYearLevelLabel, resolveStudentYearLevel } from "@/lib/member-fields";
import { formatFundFrequency } from "@/lib/fund-type-utils";

function buildInstallmentAmounts(totalAmount: number, numberOfInstallments: number) {
  const totalCents = Math.round(totalAmount * 100);
  const baseAmount = Math.floor(totalCents / numberOfInstallments);
  const remainder = totalCents % numberOfInstallments;

  return Array.from({ length: numberOfInstallments }, (_, index) => {
    const cents = baseAmount + (index < remainder ? 1 : 0);
    return cents / 100;
  });
}

function formatPlanPeriod(period?: string | null, fallbackFrequency?: FundFrequency) {
  if (period?.trim()) {
    return period.trim();
  }

  return fallbackFrequency ? formatFundFrequency(fallbackFrequency) : "Installment Plan";
}

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

  await syncInstallmentStatuses(orgId);

  const plans = await prisma.installmentPlan.findMany({
    where: {
      member: { orgId },
      deletedAt: null,
    },
    include: {
      member: true,
      fundType: true,
      entries: {
        where: { deletedAt: null },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activePlans = plans.filter((plan) => plan.status === "ACTIVE").length;
  const overdueEntries = plans.flatMap((plan) => plan.entries).filter((entry) => entry.status === "OVERDUE").length;
  const completedPlansSemester = plans.filter((plan) => plan.status === "COMPLETED").length;

  const mapped = plans.map((plan) => {
    const initials = plan.member.name
      .split(" ")
      .map((namePart) => namePart[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const paidEntries = plan.entries.filter((entry) => entry.status === "PAID").length;
    const totalAmount = plan.entries.reduce((sum, entry) => sum + entry.amountDue, 0);
    const amountPerInstallment = plan.entries.length > 0 ? totalAmount / plan.entries.length : 0;

    return {
      id: plan.id,
      memberId: plan.memberId,
      memberName: plan.member.name,
      memberInitials: initials,
      yearLevel: formatYearLevelLabel(resolveStudentYearLevel(plan.member.yearLevel, plan.member.orgRole)),
      fundTypeId: plan.fundTypeId,
      fundTypeName: plan.fundType.name,
      period: formatPlanPeriod(plan.periodLabel, plan.fundType.frequency),
      totalAmount,
      amountPerInstallment,
      totalInstallments: plan.entries.length,
      installmentsPaid: paidEntries,
      entries: plan.entries.map((entry, index) => ({
        id: entry.id,
        installmentNo: index + 1,
        amountDue: entry.amountDue,
        dueDate: entry.dueDate.toISOString().split("T")[0],
        paidAt: entry.paidAt?.toISOString().split("T")[0] ?? null,
        status: entry.status,
      })),
    };
  });

  return NextResponse.json({
    kpis: { activePlans, overdueEntries, completedPlansSemester },
    plans: mapped,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const orgId = body.orgId ? String(body.orgId) : "";
  const authorization = await getAuthorizedOfficerSession(orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.message }, { status: authorization.status });
  }

  const session = authorization.session;
  const {
    memberId,
    fundTypeId,
    totalAmount,
    numberOfInstallments,
    period,
    dueDates,
    note,
  } = body;

  if (orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Invalid organization context." }, { status: 400 });
  }

  const normalizedTotalAmount = Number(totalAmount);
  const normalizedInstallmentCount = Number(numberOfInstallments);

  if (
    !memberId ||
    !fundTypeId ||
    !Array.isArray(dueDates) ||
    !Number.isFinite(normalizedTotalAmount) ||
    normalizedTotalAmount <= 0 ||
    !Number.isInteger(normalizedInstallmentCount) ||
    normalizedInstallmentCount < 2 ||
    dueDates.length !== normalizedInstallmentCount
  ) {
    return NextResponse.json({ error: "Invalid installment plan payload." }, { status: 400 });
  }

  const [member, fundType] = await Promise.all([
    prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, orgId: true, orgRole: true, yearLevel: true },
    }),
    prisma.fundType.findUnique({
      where: { id: fundTypeId },
      select: {
        id: true,
        name: true,
        orgId: true,
        frequency: true,
        allowInstallment: true,
        maxInstallments: true,
        archivedAt: true,
      },
    }),
  ]);

  if (!member || member.orgId !== orgId) {
    return NextResponse.json({ error: "Member not found in this organization." }, { status: 400 });
  }

  if (!fundType || fundType.orgId !== orgId) {
    return NextResponse.json({ error: "Fund type not found in this organization." }, { status: 400 });
  }

  if (fundType.archivedAt) {
    return NextResponse.json({ error: "Archived funds cannot be used for new installment plans." }, { status: 400 });
  }

  if (!fundType.allowInstallment) {
    return NextResponse.json({ error: "This fund does not allow installments." }, { status: 400 });
  }

  if (fundType.maxInstallments && normalizedInstallmentCount > fundType.maxInstallments) {
    return NextResponse.json(
      { error: `This fund only allows up to ${fundType.maxInstallments} installments.` },
      { status: 400 }
    );
  }

  const installmentAmounts = buildInstallmentAmounts(normalizedTotalAmount, normalizedInstallmentCount);
  const activePeriod = await getActiveCollectionPeriod(orgId);

  const plan = await prisma.installmentPlan.create({
    data: {
      memberId,
      fundTypeId,
      collectionPeriodId: activePeriod?.id ?? null,
      periodLabel: period?.trim() ? period.trim() : null,
      status: "ACTIVE",
      entries: {
        create: dueDates.map((dueDate: string, index: number) => ({
          amountDue: installmentAmounts[index],
          dueDate: new Date(dueDate),
          status: "PENDING",
          title: `Installment ${index + 1}`,
        })),
      },
    },
    include: {
      member: true,
      fundType: true,
      entries: { orderBy: { dueDate: "asc" } },
    },
  });

  const initials = plan.member.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  await createActivityLog({
    orgId,
    actorUserId: session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(session.user),
    entityType: "INSTALLMENT_PLAN",
    entityId: plan.id,
    action: "CREATE",
    note: String(note ?? "").trim() || "Installment plan created.",
    afterSnapshot: {
      id: plan.id,
      memberId: plan.memberId,
      memberName: plan.member.name,
      fundTypeId: plan.fundTypeId,
      fundTypeName: plan.fundType.name,
      collectionPeriodId: plan.collectionPeriodId,
      totalAmount: plan.entries.reduce((sum, entry) => sum + entry.amountDue, 0),
      entries: plan.entries.map((entry, index) => ({
        id: entry.id,
        installmentNo: index + 1,
        amountDue: entry.amountDue,
        dueDate: entry.dueDate.toISOString(),
        status: entry.status,
      })),
    },
  });

  return NextResponse.json(
    {
      id: plan.id,
      memberId: plan.memberId,
      memberName: plan.member.name,
      memberInitials: initials,
      yearLevel: formatYearLevelLabel(resolveStudentYearLevel(plan.member.yearLevel, plan.member.orgRole)),
      fundTypeId: plan.fundTypeId,
      fundTypeName: plan.fundType.name,
      period: formatPlanPeriod(period, plan.fundType.frequency),
      totalAmount: plan.entries.reduce((sum, entry) => sum + entry.amountDue, 0),
      amountPerInstallment: plan.entries.length > 0 ? plan.entries[0].amountDue : 0,
      totalInstallments: plan.entries.length,
      installmentsPaid: 0,
      entries: plan.entries.map((entry, index) => ({
        id: entry.id,
        installmentNo: index + 1,
        amountDue: entry.amountDue,
        dueDate: entry.dueDate.toISOString().split("T")[0],
        paidAt: entry.paidAt?.toISOString().split("T")[0] ?? null,
        status: entry.status,
      })),
    },
    { status: 201 }
  );
}
