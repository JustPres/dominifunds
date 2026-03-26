export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { formatYearLevelLabel, resolveStudentOrgRole } from "@/lib/member-fields";
import { getMemberReport, parseMemberReportFilterStatus } from "@/lib/member-report";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId") || session?.user?.orgId || undefined;
  const search = searchParams.get("search") || undefined;
  const status = parseMemberReportFilterStatus(searchParams.get("status"));
  const sectionId = searchParams.get("sectionId") || undefined;

  if (!session?.user || session.user.role !== "OFFICER" || !orgId || session.user.orgId !== orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await getMemberReport(orgId || undefined, {
    search,
    status,
    sectionId,
  });

  return NextResponse.json(
    report.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      yearLevel: row.yearLevel,
      sectionId: row.sectionId,
      sectionName: row.sectionName,
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
  const session = await auth();

  if (!session?.user || session.user.role !== "OFFICER" || !session.user.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const officerRole = getSessionOfficerAccessRole(session.user);

  if (officerRole !== "TREASURER") {
    return NextResponse.json({ error: "Treasurer access required." }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, role, yearLevel, orgId, sectionId, note } = body;

  if (!orgId || orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Invalid organization context." }, { status: 400 });
  }

  const normalizedSectionId = sectionId ? String(sectionId) : null;

  if (normalizedSectionId) {
    const section = await prisma.section.findFirst({
      where: {
        id: normalizedSectionId,
        orgId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!section) {
      return NextResponse.json({ error: "Selected section is invalid." }, { status: 400 });
    }
  }

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
      sectionId: normalizedSectionId,
    },
    include: {
      section: true,
    },
  });

  await createActivityLog({
    orgId,
    actorUserId: session.user.id,
    actorOfficerRole: officerRole,
    entityType: "MEMBER",
    entityId: user.id,
    action: "CREATE",
    note: String(note ?? "").trim() || "Member added.",
    afterSnapshot: {
      id: user.id,
      name: user.name,
      email: user.email,
      orgRole: user.orgRole,
      yearLevel: user.yearLevel,
      sectionId: user.sectionId,
      sectionName: user.section?.name ?? null,
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: resolveStudentOrgRole(user.orgRole),
    yearLevel: formatYearLevelLabel(user.yearLevel),
    sectionId: user.sectionId,
    sectionName: user.section?.name ?? "Unassigned",
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
