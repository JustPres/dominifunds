import { NextResponse } from "next/server";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { getAnnualReportData } from "@/lib/annual-report";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
  const report = await getAnnualReportData(params.orgId, year);

  return NextResponse.json(report);
}
