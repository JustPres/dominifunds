import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.installmentPlan.findMany({
    include: {
      member: true,
      fundType: true,
      entries: { orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activePlans = plans.filter((p) => p.status === "ACTIVE").length;
  const overdueEntries = plans
    .flatMap((p) => p.entries)
    .filter((e) => e.status === "OVERDUE").length;
  const completedPlansSemester = plans.filter((p) => p.status === "COMPLETED").length;

  const mapped = plans.map((p) => {
    const initials = p.member.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const paidEntries = p.entries.filter((e) => e.status === "PAID").length;
    const totalAmount = p.entries.reduce((sum, e) => sum + e.amountDue, 0);
    const amountPerInstallment = p.entries.length > 0 ? totalAmount / p.entries.length : 0;

    return {
      id: p.id,
      memberId: p.memberId,
      memberName: p.member.name,
      memberInitials: initials,
      yearLevel: "1st",
      fundTypeId: p.fundTypeId,
      fundTypeName: p.fundType.name,
      period: "1st Semester",
      totalAmount,
      amountPerInstallment,
      totalInstallments: p.entries.length,
      installmentsPaid: paidEntries,
      entries: p.entries.map((e, idx) => ({
        id: e.id,
        installmentNo: idx + 1,
        amountDue: e.amountDue,
        dueDate: e.dueDate.toISOString().split("T")[0],
        status: e.status,
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
  const { memberId, fundTypeId, totalAmount, numberOfInstallments, period, dueDates } = body;

  const amountPerInstallment = totalAmount / numberOfInstallments;

  const plan = await prisma.installmentPlan.create({
    data: {
      memberId,
      fundTypeId,
      status: "ACTIVE",
      entries: {
        create: dueDates.map((date: string, idx: number) => ({
          amountDue: amountPerInstallment,
          dueDate: new Date(date),
          status: "PENDING",
          title: `Installment ${idx + 1}`,
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
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return NextResponse.json({
    id: plan.id,
    memberId: plan.memberId,
    memberName: plan.member.name,
    memberInitials: initials,
    yearLevel: "1st",
    fundTypeId: plan.fundTypeId,
    fundTypeName: plan.fundType.name,
    period: period || "1st Semester",
    totalAmount,
    amountPerInstallment,
    totalInstallments: plan.entries.length,
    installmentsPaid: 0,
    entries: plan.entries.map((e, idx) => ({
      id: e.id,
      installmentNo: idx + 1,
      amountDue: e.amountDue,
      dueDate: e.dueDate.toISOString().split("T")[0],
      status: e.status,
    })),
  }, { status: 201 });
}
