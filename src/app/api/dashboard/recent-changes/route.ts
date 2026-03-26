export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = session?.user?.orgId;

  if (!session?.user || session.user.role !== "OFFICER" || !orgId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.activityLog.findMany({
    where: { orgId },
    include: {
      actor: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return NextResponse.json(
    logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      actorName: log.actor?.name ?? "System",
      note: log.note,
      createdAt: log.createdAt.toISOString(),
    }))
  );
}
