export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(25, Number(searchParams.get("limit") ?? 10)));

  const logs = await prisma.activityLog.findMany({
    where: { orgId: params.orgId },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      orgId: log.orgId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      note: log.note,
      actorName: log.actor?.name ?? "System",
      actorEmail: log.actor?.email ?? null,
      actorOfficerRole: log.actorOfficerRole,
      createdAt: log.createdAt.toISOString(),
      beforeSnapshot: log.beforeSnapshot,
      afterSnapshot: log.afterSnapshot,
    })),
  });
}
