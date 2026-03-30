export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { inferOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await prisma.user.findFirst({
    where: {
      id: params.id,
      orgId: params.orgId,
      role: "OFFICER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      orgRole: true,
      officerAccessRole: true,
      deactivatedAt: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Officer not found." }, { status: 404 });
  }

  if (!existing.deactivatedAt) {
    return NextResponse.json({ message: "Officer account is already active." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.note ?? "").trim();

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      deactivatedAt: null,
      deactivationReason: null,
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    entityType: "USER_ACCOUNT",
    entityId: updated.id,
    action: "RESTORE",
    note: note || "Officer account reactivated.",
    beforeSnapshot: existing,
    afterSnapshot: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      orgRole: updated.orgRole,
      officerAccessRole: inferOfficerAccessRole(updated.officerAccessRole, updated.orgRole),
      deactivatedAt: updated.deactivatedAt?.toISOString() ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
