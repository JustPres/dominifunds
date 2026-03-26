export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { formatWeekdayLabel, getDailyCollectionRoster, isoDate } from "@/lib/collection-scheduling";
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
  const dateValue = searchParams.get("date");
  const sectionId = searchParams.get("sectionId");

  if (!dateValue) {
    return NextResponse.json({ message: "Date is required." }, { status: 400 });
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ message: "Invalid date." }, { status: 400 });
  }

  const [roster, sections] = await Promise.all([
    getDailyCollectionRoster({
      orgId: params.orgId,
      date,
      sectionId,
    }),
    prisma.section.findMany({
      where: {
        orgId: params.orgId,
        deletedAt: null,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    date: isoDate(date),
    weekday: formatWeekdayLabel(date.getDay()),
    activePeriod: roster.activePeriod
      ? {
          id: roster.activePeriod.id,
          name: roster.activePeriod.name,
          startDate: isoDate(roster.activePeriod.startDate),
          endDate: isoDate(roster.activePeriod.endDate),
          isActive: roster.activePeriod.isActive,
        }
      : null,
    roster: roster.roster,
    sectionProgress: roster.sections,
    sections: sections.map((section) => ({
      id: section.id,
      name: section.name,
    })),
  });
}
