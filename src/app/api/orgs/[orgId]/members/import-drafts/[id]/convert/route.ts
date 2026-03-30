export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { formatYearLevelLabel, resolveStudentOrgRole } from "@/lib/member-fields";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";

async function findDraft(orgId: string, id: string) {
  return prisma.memberImportDraft.findFirst({
    where: {
      id,
      orgId,
    },
    include: {
      section: true,
    },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const draft = await findDraft(params.orgId, params.id);

  if (!draft) {
    return NextResponse.json({ message: "Draft not found." }, { status: 404 });
  }

  if (!draft.name.trim() || !draft.email?.trim()) {
    return NextResponse.json({ message: "Draft still needs a name and email before conversion." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: draft.email.trim().toLowerCase() },
    select: {
      id: true,
      orgId: true,
      role: true,
      deactivatedAt: true,
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  let member;

  if (existing && existing.orgId === params.orgId && existing.role === "STUDENT" && existing.deactivatedAt) {
    member = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: draft.name.trim(),
        orgRole: draft.orgRole ?? "Member",
        yearLevel: draft.yearLevel ?? null,
        sectionId: draft.sectionId,
        deactivatedAt: null,
        deactivationReason: null,
      },
      include: {
        section: true,
      },
    });
  } else if (existing) {
    return NextResponse.json({ message: "Another account already uses that email." }, { status: 409 });
  } else {
    member = await prisma.user.create({
      data: {
        name: draft.name.trim(),
        email: draft.email.trim().toLowerCase(),
        password: passwordHash,
        role: "STUDENT",
        orgId: params.orgId,
        orgRole: draft.orgRole ?? "Member",
        yearLevel: draft.yearLevel ?? null,
        sectionId: draft.sectionId,
      },
      include: {
        section: true,
      },
    });
  }

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "MEMBER_IMPORT_DRAFT",
    entityId: draft.id,
    action: "RESTORE",
    note: "Import draft converted to member.",
    beforeSnapshot: {
      id: draft.id,
      name: draft.name,
      email: draft.email,
      role: draft.orgRole,
      yearLevel: draft.yearLevel,
      sectionId: draft.sectionId,
    },
    afterSnapshot: {
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
    },
  });

  await prisma.memberImportDraft.delete({
    where: { id: draft.id },
  });

  return NextResponse.json({
    id: member.id,
    name: member.name,
    email: member.email,
    role: resolveStudentOrgRole(member.orgRole),
    yearLevel: formatYearLevelLabel(member.yearLevel),
    sectionId: member.sectionId,
    sectionName: member.section?.name ?? "Unassigned",
    deactivatedAt: member.deactivatedAt?.toISOString() ?? null,
    isArchived: Boolean(member.deactivatedAt),
  });
}
