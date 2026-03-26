export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

export async function DELETE(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await prisma.transaction.findFirst({
    where: {
      id: params.id,
      member: { orgId: params.orgId },
    },
    include: {
      member: true,
      fundType: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.note ?? "").trim();

  const updated = await prisma.transaction.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "TRANSACTION",
    entityId: updated.id,
    action: "DELETE",
    note: note || "Transaction archived.",
    beforeSnapshot: existing,
    afterSnapshot: updated,
  });

  return NextResponse.json({ success: true });
}
