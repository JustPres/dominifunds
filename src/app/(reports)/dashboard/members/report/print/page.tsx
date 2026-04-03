import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMemberReport, parseMemberReportFilterStatus, parseMemberReportView } from "@/lib/member-report";
import { resolveOrganizationSettings } from "@/lib/org-settings";
import MemberReportPrintSheet from "@/components/members/MemberReportPrintSheet";
import AutoPrint from "./auto-print";

export const dynamic = "force-dynamic";

export default async function MembersReportPrintPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    status?: string;
    sectionId?: string;
    view?: string;
    autoprint?: string;
  };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "OFFICER") {
    redirect("/portal");
  }

  const report = await getMemberReport(session.user.orgId || undefined, {
    search: searchParams.search,
    status: parseMemberReportFilterStatus(searchParams.status),
    sectionId: searchParams.sectionId,
    view: parseMemberReportView(searchParams.view),
  });
  const orgSettings = await resolveOrganizationSettings(session.user.orgId);

  return (
    <>
      <AutoPrint enabled={searchParams.autoprint === "1"} />
      <MemberReportPrintSheet orgDisplayName={orgSettings.displayName} report={report} />
    </>
  );
}
