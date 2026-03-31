export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";
import { getActiveSectionWhere } from "@/lib/section-lifecycle";

export async function POST(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const body = await request.json();
  const draftIds = Array.isArray(body.draftIds) ? body.draftIds.map((value: unknown) => String(value)) : [];
  const sectionId = body.sectionId ? String(body.sectionId) : null;

  if (draftIds.length === 0) {
    return NextResponse.json({ message: "Select at least one draft row." }, { status: 400 });
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

  const drafts = await prisma.memberImportDraft.findMany({
    where: {
      id: { in: draftIds },
      orgId: params.orgId,
    },
    select: {
      id: true,
      name: true,
      sectionId: true,
    },
  });

  await prisma.memberImportDraft.updateMany({
    where: {
      id: { in: drafts.map((draft) => draft.id) },
    },
    data: {
      sectionId,
    },
  });

  await Promise.all(
    drafts.map((draft) =>
      createActivityLog({
        orgId: params.orgId,
        actorUserId: authorization.session.user.id,
        actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
        entityType: "MEMBER_IMPORT_DRAFT",
        entityId: draft.id,
        action: "UPDATE",
        note: "Import draft section updated in bulk.",
        beforeSnapshot: {
          id: draft.id,
          name: draft.name,
          sectionId: draft.sectionId,
        },
        afterSnapshot: {
          id: draft.id,
          name: draft.name,
          sectionId,
        },
      })
    )
  );

  return NextResponse.json({ success: true });
}
