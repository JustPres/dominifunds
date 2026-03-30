export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getActiveCollectionPeriod } from "@/lib/collection-scheduling";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

export async function POST(request: Request) {
  const authSession = await auth();

  if (!authSession?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const authorization = await getAuthorizedOfficerSession(authSession.user.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.message }, { status: authorization.status });
  }

  const { memberId, fundTypeId, amount, status, note, dueDate, paidAt } = body;
  const normalizedAmount = Number(amount);
  const normalizedPaidAt = paidAt ? new Date(paidAt) : null;
  const normalizedDueDate = dueDate ? new Date(dueDate) : null;

  if (
    !memberId ||
    !fundTypeId ||
    !Number.isFinite(normalizedAmount) ||
    normalizedAmount <= 0 ||
    !normalizedPaidAt ||
    Number.isNaN(normalizedPaidAt.getTime())
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const session = authorization.session;
  const [member, fundType] = await Promise.all([
    prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, orgId: true, deactivatedAt: true },
    }),
    prisma.fundType.findUnique({
      where: { id: fundTypeId },
      select: { id: true, name: true, orgId: true, archivedAt: true },
    }),
  ]);

  if (!member || member.orgId !== session.user.orgId || member.deactivatedAt) {
    return NextResponse.json({ error: "Member not found in this organization" }, { status: 400 });
  }

  if (!fundType || fundType.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Fund type not found in this organization" }, { status: 400 });
  }

  if (fundType.archivedAt) {
    return NextResponse.json({ error: "Archived funds cannot receive new payments" }, { status: 400 });
  }

  const activePeriod = await getActiveCollectionPeriod(session.user.orgId);

  const transaction = await prisma.transaction.create({
    data: {
      memberId,
      fundTypeId,
      collectionPeriodId: activePeriod?.id ?? null,
      type: "FULL_PAYMENT",
      status: status || "PAID",
      amount: normalizedAmount,
      paidAt: normalizedPaidAt,
      dueDate: normalizedDueDate && !Number.isNaN(normalizedDueDate.getTime()) ? normalizedDueDate : null,
      note: note || null,
    },
    include: {
      member: true,
      fundType: true,
    },
  });

  const initials = transaction.member.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  await createActivityLog({
    orgId: session.user.orgId,
    actorUserId: session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(session.user),
    entityType: "TRANSACTION",
    entityId: transaction.id,
    action: "PAYMENT_RECORD",
    note: note || "Full payment recorded.",
    afterSnapshot: {
      id: transaction.id,
      memberId: transaction.memberId,
      memberName: transaction.member.name,
      fundTypeId: transaction.fundTypeId,
      fundTypeName: transaction.fundType.name,
      amount: transaction.amount,
      status: transaction.status,
      paidAt: transaction.paidAt?.toISOString() ?? null,
      dueDate: transaction.dueDate?.toISOString() ?? null,
    },
  });

  return NextResponse.json(
    {
      id: transaction.id,
      memberId: transaction.memberId,
      memberName: transaction.member.name,
      memberInitials: initials,
      fundTypeId: transaction.fundTypeId,
      fundTypeName: transaction.fundType.name,
      type: transaction.type,
      amount: transaction.amount,
      date: (transaction.paidAt ?? transaction.createdAt).toISOString().split("T")[0],
      dueDate: transaction.dueDate?.toISOString().split("T")[0] ?? undefined,
      note: transaction.note || undefined,
      status: transaction.status,
    },
    { status: 201 }
  );
}
