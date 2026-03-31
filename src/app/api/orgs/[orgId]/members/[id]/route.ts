export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { formatYearLevelLabel, resolveStudentOrgRole } from "@/lib/member-fields";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";
import { getActiveSectionWhere } from "@/lib/section-lifecycle";

async function findMember(orgId: string, id: string) {
  return prisma.user.findFirst({
    where: {
      id,
      orgId,
      role: "STUDENT",
    },
    include: {
      section: true,
    },
  });
}

function serializeMember(member: Awaited<ReturnType<typeof findMember>>) {
  if (!member) return null;

  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: resolveStudentOrgRole(member.orgRole),
    yearLevel: formatYearLevelLabel(member.yearLevel),
    sectionId: member.sectionId,
    sectionName: member.section?.name ?? "Unassigned",
    deactivatedAt: member.deactivatedAt?.toISOString() ?? null,
    isArchived: Boolean(member.deactivatedAt),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await findMember(params.orgId, params.id);

  if (!existing) {
    return NextResponse.json({ message: "Member not found." }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name === undefined ? undefined : String(body.name).trim();
  const email = body.email === undefined ? undefined : String(body.email).trim().toLowerCase();
  const role = body.role === undefined ? undefined : String(body.role).trim();
  const yearLevel = body.yearLevel === undefined ? undefined : String(body.yearLevel).trim();
  const sectionId = body.sectionId === undefined ? undefined : body.sectionId ? String(body.sectionId) : null;
  const note = String(body.note ?? "").trim();

  if (name !== undefined && !name) {
    return NextResponse.json({ message: "Member name is required." }, { status: 400 });
  }

  if (email !== undefined && !email) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  if (email && email !== existing.email) {
    const duplicate = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json({ message: "Another account already uses that email." }, { status: 409 });
    }
  }

  if (sectionId) {
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        orgId: params.orgId,
        ...getActiveSectionWhere(),
      },
      select: { id: true },
    });

    if (!section) {
      return NextResponse.json({ message: "Selected section is invalid." }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(role !== undefined ? { orgRole: role || "Member" } : {}),
      ...(yearLevel !== undefined ? { yearLevel: yearLevel || null } : {}),
      ...(sectionId !== undefined ? { sectionId } : {}),
    },
    include: {
      section: true,
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "MEMBER",
    entityId: updated.id,
    action: "UPDATE",
    note: note || "Member updated.",
    beforeSnapshot: serializeMember(existing),
    afterSnapshot: serializeMember(updated),
  });

  return NextResponse.json(serializeMember(updated));
}

export async function DELETE(
  request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await findMember(params.orgId, params.id);

  if (!existing) {
    return NextResponse.json({ message: "Member not found." }, { status: 404 });
  }

  if (existing.deactivatedAt) {
    return NextResponse.json({ message: "Member is already archived." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.note ?? "").trim();

  const archived = await prisma.user.update({
    where: { id: existing.id },
    data: {
      deactivatedAt: new Date(),
      deactivationReason: note || "Member archived.",
    },
    include: {
      section: true,
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "MEMBER",
    entityId: archived.id,
    action: "DELETE",
    note: note || "Member archived.",
    beforeSnapshot: serializeMember(existing),
    afterSnapshot: serializeMember(archived),
  });

  return NextResponse.json({ success: true, member: serializeMember(archived) });
}
