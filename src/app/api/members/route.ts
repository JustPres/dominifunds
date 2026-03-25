export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");

  const where = orgId ? { role: "STUDENT" as const, orgId } : { role: "STUDENT" as const };

  const members = await prisma.user.findMany({
    where,
    include: {
      transactions: true,
      installmentPlans: {
        where: { status: "ACTIVE" },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = members.map((m) => {
    const totalPaid = m.transactions
      .filter((t) => t.status === "PAID")
      .reduce((sum, t) => sum + t.amount, 0);
    const activePlans = m.installmentPlans.length;
    const balanceDue = m.transactions
      .filter((t) => t.status === "PENDING" || t.status === "OVERDUE")
      .reduce((sum, t) => sum + t.amount, 0);

    let status: "Good Standing" | "Has Installment Plan" | "Overdue" = "Good Standing";
    if (m.transactions.some((t) => t.status === "OVERDUE")) {
      status = "Overdue";
    } else if (activePlans > 0) {
      status = "Has Installment Plan";
    }

    return {
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.orgRole || "Member",
      yearLevel: "1st",
      totalPaid,
      activeInstallmentPlans: activePlans,
      balanceDue,
      status,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, role, yearLevel, orgId } = body;

  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
      orgId: orgId || null,
      orgRole: role || "Member",
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.orgRole || "Member",
    yearLevel: yearLevel || "1st",
    totalPaid: 0,
    activeInstallmentPlans: 0,
    balanceDue: 0,
    status: "Good Standing",
  }, { status: 201 });
}
