export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getCollectionScheduleSnapshot } from "@/lib/collection-scheduling";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getSessionOfficerAccessRole } from "@/lib/officer-access";

function serializeSchedule(schedule: {
  id: string;
  orgId: string;
  collectionPeriodId: string;
  memberId: string | null;
  scope: "ORG_DEFAULT" | "MEMBER_OVERRIDE";
  name: string | null;
  weekdays: number[];
  note: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  member?: { id: string; name: string } | null;
}) {
  return {
    id: schedule.id,
    orgId: schedule.orgId,
    collectionPeriodId: schedule.collectionPeriodId,
    memberId: schedule.memberId,
    memberName: schedule.member?.name ?? null,
    scope: schedule.scope,
    name: schedule.name,
    weekdays: schedule.weekdays,
    note: schedule.note,
    deletedAt: schedule.deletedAt?.toISOString() ?? null,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
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

  const snapshot = await getCollectionScheduleSnapshot(params.orgId);

  return NextResponse.json({
    activePeriod: snapshot.activePeriod
      ? {
          id: snapshot.activePeriod.id,
          name: snapshot.activePeriod.name,
          startDate: snapshot.activePeriod.startDate.toISOString().split("T")[0],
          endDate: snapshot.activePeriod.endDate.toISOString().split("T")[0],
          isActive: snapshot.activePeriod.isActive,
        }
      : null,
    schedules: snapshot.schedules.map((schedule) => serializeSchedule(schedule)),
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
  const collectionPeriodId = String(body.collectionPeriodId ?? "").trim();
  const memberId = body.memberId ? String(body.memberId).trim() : null;
  const weekdays = Array.isArray(body.weekdays)
    ? body.weekdays.map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value) && value >= 0 && value <= 6)
    : [];
  const name = body.name ? String(body.name).trim() : null;
  const note = body.note ? String(body.note).trim() : null;

  if (!collectionPeriodId) {
    return NextResponse.json({ message: "Collection period is required." }, { status: 400 });
  }

  if (weekdays.length === 0) {
    return NextResponse.json({ message: "Select at least one weekday." }, { status: 400 });
  }

  const [period, member] = await Promise.all([
    prisma.collectionPeriod.findFirst({
      where: {
        id: collectionPeriodId,
        orgId: params.orgId,
      },
      select: { id: true },
    }),
    memberId
      ? prisma.user.findFirst({
          where: {
            id: memberId,
            orgId: params.orgId,
            role: "STUDENT",
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (!period) {
    return NextResponse.json({ message: "Collection period not found for this organization." }, { status: 404 });
  }

  if (memberId && !member) {
    return NextResponse.json({ message: "Member override target is invalid." }, { status: 404 });
  }

  const existingDefault =
    memberId === null
      ? await prisma.collectionSchedule.findFirst({
          where: {
            orgId: params.orgId,
            collectionPeriodId,
            memberId: null,
            scope: "ORG_DEFAULT",
            deletedAt: null,
          },
          include: {
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : null;

  const schedule = existingDefault
    ? await prisma.collectionSchedule.update({
        where: { id: existingDefault.id },
        data: {
          weekdays,
          name,
          note,
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    : await prisma.collectionSchedule.create({
        data: {
          orgId: params.orgId,
          collectionPeriodId,
          memberId,
          scope: memberId ? "MEMBER_OVERRIDE" : "ORG_DEFAULT",
          name,
          weekdays,
          note,
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    actorOfficerRole: getSessionOfficerAccessRole(authorization.session.user),
    entityType: "COLLECTION_SCHEDULE",
    entityId: schedule.id,
    action: existingDefault ? "UPDATE" : "CREATE",
    note: note || (existingDefault ? "Default collection schedule updated." : "Collection schedule created."),
    beforeSnapshot: existingDefault,
    afterSnapshot: serializeSchedule(schedule),
  });

  return NextResponse.json(serializeSchedule(schedule), { status: existingDefault ? 200 : 201 });
}
