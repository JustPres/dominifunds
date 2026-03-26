export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

function serializePeriod(period: {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: period.id,
    name: period.name,
    startDate: period.startDate.toISOString().split("T")[0],
    endDate: period.endDate.toISOString().split("T")[0],
    isActive: period.isActive,
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
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

  const periods = await prisma.collectionPeriod.findMany({
    where: { orgId: params.orgId },
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
  });

  return NextResponse.json({
    activePeriod: periods.find((period) => period.isActive) ? serializePeriod(periods.find((period) => period.isActive)!) : null,
    periods: periods.map(serializePeriod),
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
  const startDate = body.startDate ? new Date(body.startDate) : null;
  const endDate = body.endDate ? new Date(body.endDate) : null;
  const isActive = body.isActive !== false;
  const note = String(body.note ?? "").trim();

  if (!name || !startDate || Number.isNaN(startDate.getTime()) || !endDate || Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ message: "Valid name, start date, and end date are required." }, { status: 400 });
  }

  if (startDate.getTime() > endDate.getTime()) {
    return NextResponse.json({ message: "Start date must be before end date." }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.collectionPeriod.updateMany({
        where: { orgId: params.orgId, isActive: true },
        data: { isActive: false },
      });
    }

    return tx.collectionPeriod.create({
      data: {
        orgId: params.orgId,
        name,
        startDate,
        endDate,
        isActive,
      },
    });
  });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "COLLECTION_PERIOD",
    entityId: created.id,
    action: "CREATE",
    note: note || "Collection period created.",
    afterSnapshot: serializePeriod(created),
  });

  return NextResponse.json(serializePeriod(created), { status: 201 });
}
