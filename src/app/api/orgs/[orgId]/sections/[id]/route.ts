export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

export async function PATCH(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await prisma.section.findFirst({
    where: {
      id: params.id,
      orgId: params.orgId,
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Section not found." }, { status: 404 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const note = String(body.note ?? "").trim();

  if (!name) {
    return NextResponse.json({ message: "Section name is required." }, { status: 400 });
  }

  const updated = await prisma.section.update({
    where: { id: existing.id },
    data: { name },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "SECTION",
    entityId: updated.id,
    action: "UPDATE",
    note: note || "Section updated.",
    beforeSnapshot: existing,
    afterSnapshot: updated,
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    memberCount: updated._count.members,
    deletedAt: updated.deletedAt?.toISOString() ?? null,
    isArchived: Boolean(updated.deletedAt),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.note ?? "").trim();

  const existing = await prisma.section.findFirst({
    where: {
      id: params.id,
      orgId: params.orgId,
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Section not found." }, { status: 404 });
  }

  if (existing.deletedAt) {
    return NextResponse.json({ message: "Section is already archived." }, { status: 400 });
  }

  const updated = await prisma.section.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "SECTION",
    entityId: updated.id,
    action: "DELETE",
    note: note || "Section archived.",
    beforeSnapshot: existing,
    afterSnapshot: updated,
  });

  return NextResponse.json({ success: true });
}
