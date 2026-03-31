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
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.map((value: unknown) => String(value)) : [];
  const sectionId = body.sectionId ? String(body.sectionId) : null;
  const note = String(body.note ?? "").trim();

  if (memberIds.length === 0) {
    return NextResponse.json({ message: "Select at least one member." }, { status: 400 });
  }

  if (sectionId) {
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        orgId: params.orgId,
        ...getActiveSectionWhere(),
      },
      select: { id: true, name: true },
    });

    if (!section) {
      return NextResponse.json({ message: "Selected section is invalid." }, { status: 400 });
    }
  }

  const members = await prisma.user.findMany({
    where: {
      id: { in: memberIds },
      orgId: params.orgId,
      role: "STUDENT",
    },
    select: {
      id: true,
      name: true,
      sectionId: true,
    },
  });

  if (members.length === 0) {
    return NextResponse.json({ message: "No matching members found." }, { status: 404 });
  }

  await prisma.user.updateMany({
    where: {
      id: { in: members.map((member) => member.id) },
    },
    data: {
      sectionId,
    },
  });

  await Promise.all(
    members.map((member) =>
      createActivityLog({
        orgId: params.orgId,
        actorUserId: authorization.session.user.id,
        actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
        entityType: "MEMBER",
        entityId: member.id,
        action: "UPDATE",
        note: note || "Member section updated in bulk.",
        beforeSnapshot: {
          id: member.id,
          name: member.name,
          sectionId: member.sectionId,
        },
        afterSnapshot: {
          id: member.id,
          name: member.name,
          sectionId,
        },
      })
    )
  );

  return NextResponse.json({ success: true });
}
