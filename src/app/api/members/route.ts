export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { formatYearLevelLabel, resolveStudentOrgRole } from "@/lib/member-fields";
import { getMemberReport, parseMemberReportFilterStatus } from "@/lib/member-report";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const search = searchParams.get("search") || undefined;
  const status = parseMemberReportFilterStatus(searchParams.get("status"));
  const report = await getMemberReport(orgId || undefined, {
    search,
    status,
  });

  return NextResponse.json(
    report.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      yearLevel: row.yearLevel,
      totalPaid: row.totalPaid,
      activeInstallmentPlans: row.activeInstallmentPlans,
      balanceDue: row.balanceDue,
      status: row.status,
      overallStatus: row.overallStatus,
      paymentMode: row.paymentMode,
      recentPaymentDate: row.recentPaymentDate,
      recentPaymentType: row.recentPaymentType,
      recentPaymentAmount: row.recentPaymentAmount,
      recentFullPaymentDate: row.recentFullPaymentDate,
      recentInstallmentPaymentDate: row.recentInstallmentPaymentDate,
      overdueEntries: row.overdueEntries,
      overdueTransactions: row.overdueTransactions,
      outstandingInstallmentAmount: row.outstandingInstallmentAmount,
      outstandingTransactionAmount: row.outstandingTransactionAmount,
    }))
  );
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
      yearLevel: yearLevel || null,
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: resolveStudentOrgRole(user.orgRole),
    yearLevel: formatYearLevelLabel(user.yearLevel),
    totalPaid: 0,
    activeInstallmentPlans: 0,
    balanceDue: 0,
    status: "Good Standing",
    overallStatus: "No Payment Record",
    paymentMode: "None",
    recentPaymentDate: "",
    recentPaymentType: "",
    recentPaymentAmount: 0,
    recentFullPaymentDate: "",
    recentInstallmentPaymentDate: "",
    overdueEntries: 0,
    overdueTransactions: 0,
    outstandingInstallmentAmount: 0,
    outstandingTransactionAmount: 0,
  }, { status: 201 });
}
