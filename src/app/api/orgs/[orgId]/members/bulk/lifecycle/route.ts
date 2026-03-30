export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";

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
  const action = body.action === "restore" ? "restore" : "archive";
  const note = String(body.note ?? "").trim();

  if (memberIds.length === 0) {
    return NextResponse.json({ message: "Select at least one member." }, { status: 400 });
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
      email: true,
      deactivatedAt: true,
    },
  });

  if (members.length === 0) {
    return NextResponse.json({ message: "No matching members found." }, { status: 404 });
  }

  const targetMembers = members.filter((member) => (action === "archive" ? !member.deactivatedAt : Boolean(member.deactivatedAt)));

  if (targetMembers.length === 0) {
    return NextResponse.json({ message: `No members can be ${action}d.` }, { status: 400 });
  }

  await prisma.user.updateMany({
    where: {
      id: { in: targetMembers.map((member) => member.id) },
    },
    data:
      action === "archive"
        ? {
            deactivatedAt: new Date(),
            deactivationReason: note || "Member archived in bulk.",
          }
        : {
            deactivatedAt: null,
            deactivationReason: null,
          },
  });

  await Promise.all(
    targetMembers.map((member) =>
      createActivityLog({
        orgId: params.orgId,
        actorUserId: authorization.session.user.id,
        actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
        entityType: "MEMBER",
        entityId: member.id,
        action: action === "archive" ? "DELETE" : "RESTORE",
        note: note || (action === "archive" ? "Member archived in bulk." : "Member restored in bulk."),
        beforeSnapshot: {
          id: member.id,
          name: member.name,
          email: member.email,
          deactivatedAt: member.deactivatedAt?.toISOString() ?? null,
        },
        afterSnapshot: {
          id: member.id,
          name: member.name,
          email: member.email,
          deactivatedAt: action === "archive" ? new Date().toISOString() : null,
        },
      })
    )
  );

  return NextResponse.json({ success: true, count: targetMembers.length });
}
