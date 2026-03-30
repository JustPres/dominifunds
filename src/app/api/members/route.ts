export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { formatYearLevelLabel, resolveStudentOrgRole } from "@/lib/member-fields";
import { getMemberReport, parseMemberReportFilterStatus, parseMemberReportView } from "@/lib/member-report";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId") || session?.user?.orgId || undefined;
  const search = searchParams.get("search") || undefined;
  const status = parseMemberReportFilterStatus(searchParams.get("status"));
  const sectionId = searchParams.get("sectionId") || undefined;
  const view = parseMemberReportView(searchParams.get("view")) ?? "active";

  if (!session?.user || session.user.role !== "OFFICER" || !orgId || session.user.orgId !== orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await getMemberReport(orgId || undefined, {
    search,
    status,
    sectionId,
    view,
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
      deactivatedAt: row.deactivatedAt,
      isArchived: row.isArchived,
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
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "Member").trim() || "Member";
  const yearLevel = body.yearLevel ? String(body.yearLevel).trim() : null;
  const orgId = String(body.orgId ?? "").trim();
  const sectionId = body.sectionId;
  const note = body.note;
  const temporaryPassword = typeof body.temporaryPassword === "string" ? body.temporaryPassword : "";

  if (!orgId || orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Invalid organization context." }, { status: 400 });
  }

  if (!name || !email) {
    return NextResponse.json({ error: "Name and school email are required." }, { status: 400 });
  }

  if (temporaryPassword.length < 8) {
    return NextResponse.json(
      { error: "Temporary password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const normalizedSectionId = sectionId ? String(sectionId) : null;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      orgId: true,
      role: true,
      deactivatedAt: true,
    },
  });

  if (existingUser) {
    const message =
      existingUser.orgId === orgId && existingUser.role === "STUDENT" && existingUser.deactivatedAt
        ? "A matching archived member already exists. Restore that record instead of creating a new one."
        : "An account with that email already exists.";

    return NextResponse.json({ error: message }, { status: 409 });
  }

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

  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

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
      mustChangePassword: true,
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
    deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
    isArchived: Boolean(user.deactivatedAt),
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
