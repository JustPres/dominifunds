export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

function serializeSection(section: {
  id: string;
  name: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { members: number };
}) {
  return {
    id: section.id,
    name: section.name,
    memberCount: section._count?.members ?? 0,
    deletedAt: section.deletedAt?.toISOString() ?? null,
    isArchived: Boolean(section.deletedAt),
    createdAt: section.createdAt.toISOString(),
    updatedAt: section.updatedAt.toISOString(),
  };
}

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const sections = await prisma.section.findMany({
    where: {
      orgId: params.orgId,
      ...(includeArchived ? {} : { deletedAt: null }),
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    sections: sections.map(serializeSection),
  });
}

export async function POST(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const note = String(body.note ?? "").trim();

  if (!name) {
    return NextResponse.json({ message: "Section name is required." }, { status: 400 });
  }

  const existingSections = await prisma.section.findMany({
    where: {
      orgId: params.orgId,
    },
  });
  const existing = existingSections.find(
    (section) => section.name.trim().toLowerCase() === name.toLowerCase()
  );

  if (existing && !existing.deletedAt) {
    return NextResponse.json({ message: "That section already exists." }, { status: 409 });
  }

  const section = existing
    ? await prisma.section.update({
        where: { id: existing.id },
        data: {
          name,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      })
    : await prisma.section.create({
        data: {
          orgId: params.orgId,
          name,
        },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "SECTION",
    entityId: section.id,
    action: existing ? "RESTORE" : "CREATE",
    note: note || (existing ? "Section restored." : "Section created."),
    afterSnapshot: serializeSection(section),
  });

  return NextResponse.json(serializeSection(section), { status: existing ? 200 : 201 });
}
