export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";
import { getActiveSectionWhere } from "@/lib/section-lifecycle";
import {
  getStudentEmailValidationMessage,
  isValidStudentEmail,
  normalizeStudentEmail,
} from "@/lib/student-email";

async function findDraft(orgId: string, id: string) {
  return prisma.memberImportDraft.findFirst({
    where: {
      id,
      orgId,
    },
    include: {
      section: {
        select: {
          name: true,
        },
      },
    },
  });
}

function serializeDraft(draft: Awaited<ReturnType<typeof findDraft>>) {
  if (!draft) return null;

  return {
    id: draft.id,
    name: draft.name,
    email: draft.email,
    role: draft.orgRole ?? "Member",
    yearLevel: draft.yearLevel,
    sectionId: draft.sectionId,
    sectionName: draft.section?.name ?? "Unassigned",
    sourceFileName: draft.sourceFileName,
    status: draft.status,
    issueSummary: draft.issueSummary,
    rawData: draft.rawData,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
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

  const existing = await findDraft(params.orgId, params.id);

  if (!existing) {
    return NextResponse.json({ message: "Draft not found." }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name === undefined ? undefined : String(body.name).trim();
  const email = body.email === undefined ? undefined : normalizeStudentEmail(String(body.email));
  const role = body.role === undefined ? undefined : String(body.role).trim();
  const yearLevel = body.yearLevel === undefined ? undefined : String(body.yearLevel).trim();
  const sectionId = body.sectionId === undefined ? undefined : body.sectionId ? String(body.sectionId) : null;
  const issueSummary = body.issueSummary === undefined ? undefined : String(body.issueSummary).trim();

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

  const issues: string[] = [];

  if (!name?.trim() && name !== undefined) {
    issues.push("Missing student name.");
  }

  if (!email) {
    issues.push("Missing email address.");
  } else {
    const emailValidationMessage = getStudentEmailValidationMessage(email);

    if (emailValidationMessage) {
      issues.push(emailValidationMessage);
    }
  }

  const nextStatus = email && isValidStudentEmail(email) && issues.length === 0 ? "READY" : "INCOMPLETE";
  const nextIssueSummary = issues.length > 0 ? issues.join(" ") : null;

  const updated = await prisma.memberImportDraft.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(role !== undefined ? { orgRole: role || "Member" } : {}),
      ...(yearLevel !== undefined ? { yearLevel: yearLevel || null } : {}),
      ...(sectionId !== undefined ? { sectionId } : {}),
      ...(issueSummary !== undefined ? { issueSummary: issueSummary || null } : { issueSummary: nextIssueSummary }),
      status: nextStatus,
    },
    include: {
      section: {
        select: {
          name: true,
        },
      },
    },
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "MEMBER_IMPORT_DRAFT",
    entityId: updated.id,
    action: "UPDATE",
    note: "Import draft updated.",
    beforeSnapshot: serializeDraft(existing),
    afterSnapshot: serializeDraft(updated),
  });

  return NextResponse.json(serializeDraft(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: { orgId: string; id: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const existing = await findDraft(params.orgId, params.id);

  if (!existing) {
    return NextResponse.json({ message: "Draft not found." }, { status: 404 });
  }

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "MEMBER_IMPORT_DRAFT",
    entityId: existing.id,
    action: "DELETE",
    note: "Import draft discarded.",
    beforeSnapshot: serializeDraft(existing),
  });

  await prisma.memberImportDraft.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ success: true });
}
