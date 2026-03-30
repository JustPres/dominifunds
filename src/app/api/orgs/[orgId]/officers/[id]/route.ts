export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { inferOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";

async function findOfficer(orgId: string, id: string) {
  return prisma.user.findFirst({
    where: {
      id,
      orgId,
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
      deactivationReason: true,
    },
  });
}

function normalizeOfficerAccessRole(value?: string | null) {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (normalized === "TREASURER") return "TREASURER" as const;
  if (normalized === "PRESIDENT") return "PRESIDENT" as const;

  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await findOfficer(params.orgId, params.id);

  if (!existing) {
    return NextResponse.json({ message: "Officer not found." }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name === undefined ? undefined : String(body.name).trim();
  const email = body.email === undefined ? undefined : String(body.email).trim().toLowerCase();
  const officerAccessRole =
    body.officerAccessRole === undefined ? undefined : normalizeOfficerAccessRole(body.officerAccessRole);
  const orgRole = officerAccessRole === undefined ? undefined : officerAccessRole === "PRESIDENT" ? "President" : "Treasurer";
  const note = String(body.note ?? "").trim();

  if (email && email !== existing.email) {
    const duplicate = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json({ message: "Another account already uses that email." }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(orgRole !== undefined ? { orgRole } : {}),
      ...(officerAccessRole !== undefined ? { officerAccessRole } : {}),
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    entityType: "USER_ACCOUNT",
    entityId: updated.id,
    action: "UPDATE",
    note: note || "Officer account updated.",
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

export async function DELETE(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  if (authorization.session.user.id === params.id) {
    return NextResponse.json({ message: "Deactivate a different officer account, not your active session." }, { status: 400 });
  }

  const existing = await findOfficer(params.orgId, params.id);

  if (!existing) {
    return NextResponse.json({ message: "Officer not found." }, { status: 404 });
  }

  if (existing.deactivatedAt) {
    return NextResponse.json({ message: "Officer account is already inactive." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.note ?? "").trim();

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      deactivatedAt: new Date(),
      deactivationReason: note || "Officer account deactivated.",
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    entityType: "USER_ACCOUNT",
    entityId: updated.id,
    action: "DELETE",
    note: note || "Officer account deactivated.",
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
