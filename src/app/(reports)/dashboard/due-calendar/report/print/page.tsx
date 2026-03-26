import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AutoPrint from "@/app/(reports)/dashboard/members/report/print/auto-print";
import CollectionRosterPrintSheet from "@/components/calendar/CollectionRosterPrintSheet";
import { formatWeekdayLabel, getDailyCollectionRoster, isoDate } from "@/lib/collection-scheduling";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CollectionRosterPrintPage({
  searchParams,
}: {
  searchParams: {
    date?: string;
    sectionId?: string;
    autoprint?: string;
  };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "OFFICER" || !session.user.orgId) {
    redirect("/portal");
  }

  const targetDate = searchParams.date ? new Date(searchParams.date) : new Date();
  const sectionId = searchParams.sectionId || undefined;
  const roster = await getDailyCollectionRoster({
    orgId: session.user.orgId,
    date: targetDate,
    sectionId,
  });

  const section = sectionId
    ? await prisma.section.findFirst({
        where: {
          id: sectionId,
          orgId: session.user.orgId,
        },
      })
    : null;

  return (
    <>
      <AutoPrint enabled={searchParams.autoprint === "1"} />
      <CollectionRosterPrintSheet
        orgId={session.user.orgId}
        date={isoDate(targetDate) || ""}
        weekday={formatWeekdayLabel(targetDate.getDay())}
        activePeriodName={roster.activePeriod?.name || "No active collection period"}
        sectionFilter={section?.name || "All Sections"}
        roster={roster.roster}
        sectionProgress={roster.sections}
      />
    </>
  );
}
