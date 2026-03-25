import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMemberReport } from "@/lib/member-report";
import MemberReportPrintSheet from "@/components/members/MemberReportPrintSheet";
import AutoPrint from "./auto-print";

export const dynamic = "force-dynamic";

export default async function MembersReportPrintPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    status?: string;
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
    status: searchParams.status,
  });

  return (
    <>
      <AutoPrint enabled={searchParams.autoprint === "1"} />
      <MemberReportPrintSheet orgId={session.user.orgId} report={report} />
    </>
  );
}
