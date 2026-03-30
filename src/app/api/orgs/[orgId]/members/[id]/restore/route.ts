export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { formatYearLevelLabel, resolveStudentOrgRole } from "@/lib/member-fields";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";

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

export async function POST(
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

  if (!existing.deactivatedAt) {
    return NextResponse.json({ message: "Member is already active." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.note ?? "").trim();

  const restored = await prisma.user.update({
    where: { id: existing.id },
    data: {
      deactivatedAt: null,
      deactivationReason: null,
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
    entityId: restored.id,
    action: "RESTORE",
    note: note || "Member restored.",
    beforeSnapshot: serializeMember(existing),
    afterSnapshot: serializeMember(restored),
  });

  return NextResponse.json({ success: true, member: serializeMember(restored) });
}
