export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCollectionScheduleSnapshot, getDailyCollectionRoster, isoDate } from "@/lib/collection-scheduling";
import { getMemberReport } from "@/lib/member-report";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";

function enumerateMonthDays(year: number, month: number) {
  const dates: Date[] = [];
  const current = new Date(year, month - 1, 1);

  while (current.getMonth() === month - 1) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
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
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000) {
    return NextResponse.json({
      duesByDate: {},
      summary: {
        scheduledDaysCount: 0,
        installmentCount: 0,
        fullPaymentsCount: 0,
        membersScheduled: 0,
        fullyCurrentMembers: 0,
      },
      activePeriod: null,
      schedules: [],
      sectionProgress: [],
    });
  }

  const [scheduleSnapshot, report] = await Promise.all([
    getCollectionScheduleSnapshot(params.orgId),
    getMemberReport(params.orgId),
  ]);

  const monthDays = enumerateMonthDays(year, month);
  const rosters = await Promise.all(
    monthDays.map((date) =>
      getDailyCollectionRoster({
        orgId: params.orgId,
        date,
      })
    )
  );

  const duesByDate: Record<string, { dateString: string; items: Array<Record<string, unknown>> }> = {};
  let installmentCount = 0;
  let fullPaymentsCount = 0;
  const scheduledMembers = new Set<string>();

  rosters.forEach((rosterResult, index) => {
    const date = monthDays[index];
    const dateString = isoDate(date);

    if (!dateString || rosterResult.roster.length === 0) {
      return;
    }

    const items = rosterResult.roster.flatMap((row) => {
      scheduledMembers.add(row.memberId);

      return row.dueItems.map((item) => {
        if (item.kind === "INSTALLMENT") installmentCount += 1;
        if (item.kind === "FULL") fullPaymentsCount += 1;

        return {
          id: `${row.memberId}:${item.fundName}:${item.kind}:${item.installmentInfo ?? "full"}`,
          memberId: row.memberId,
          memberName: row.memberName,
          sectionName: row.sectionName,
          fundType: item.fundName,
          dueType: item.kind,
          installmentInfo: item.installmentInfo,
          amountDue: item.amount,
          paymentMode: row.paymentMode,
          latestPaymentDate: row.latestPaymentDate,
        };
      });
    });

    duesByDate[dateString] = {
      dateString,
      items,
    };
  });

  const latestSectionProgress = rosters.find((entry) => entry.sections.length > 0)?.sections ?? [];

  return NextResponse.json({
    duesByDate,
    summary: {
      scheduledDaysCount: Object.keys(duesByDate).length,
      installmentCount,
      fullPaymentsCount,
      membersScheduled: scheduledMembers.size,
      fullyCurrentMembers: report.rows.filter((row) => row.balanceDue <= 0 && row.overallStatus !== "Overdue").length,
    },
    activePeriod: scheduleSnapshot.activePeriod
      ? {
          id: scheduleSnapshot.activePeriod.id,
          name: scheduleSnapshot.activePeriod.name,
          startDate: isoDate(scheduleSnapshot.activePeriod.startDate),
          endDate: isoDate(scheduleSnapshot.activePeriod.endDate),
          isActive: scheduleSnapshot.activePeriod.isActive,
        }
      : null,
    schedules: scheduleSnapshot.schedules.map((schedule) => ({
      id: schedule.id,
      memberId: schedule.memberId,
      memberName: schedule.member?.name ?? null,
      scope: schedule.scope,
      name: schedule.name,
      weekdays: schedule.weekdays,
      note: schedule.note,
    })),
    sectionProgress: latestSectionProgress,
  });
}
