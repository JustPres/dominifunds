export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncInstallmentStatuses } from "@/lib/member-report";

export async function GET() {
  const session = await auth();
  const orgId = session?.user?.orgId;

  if (!session?.user || session.user.role !== "OFFICER" || !orgId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await syncInstallmentStatuses(orgId);

  const plans = await prisma.installmentPlan.findMany({
    where: { status: "ACTIVE", deletedAt: null, member: { orgId } },
    include: {
      member: true,
      fundType: true,
      entries: { where: { deletedAt: null }, orderBy: { dueDate: "asc" } },
    },
    take: 10,
  });

  const result = plans.map((p) => {
    const initials = p.member.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const paidCount = p.entries.filter((e) => e.status === "PAID").length;
    const nextDue = p.entries.find((e) => e.status !== "PAID");
    const hasOverdue = p.entries.some((e) => e.status === "OVERDUE");

    return {
      id: p.id,
      memberInitials: initials,
      memberName: p.member.name,
      fundType: p.fundType.name,
      progress: `${paidCount} of ${p.entries.length} paid`,
      nextDueDate: nextDue ? nextDue.dueDate.toISOString().split("T")[0] : "",
      status: hasOverdue ? "OVERDUE" : "ONGOING",
    };
  });

  return NextResponse.json(result);
}
