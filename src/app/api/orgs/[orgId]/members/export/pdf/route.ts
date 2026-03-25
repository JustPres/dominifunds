export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getMemberReport } from "@/lib/member-report";
import { MemberReportPdfDocument } from "@/lib/member-report-pdf";

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "OFFICER" || session.user.orgId !== params.orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const report = await getMemberReport(params.orgId, {
    search: searchParams.get("search") || undefined,
    status: searchParams.get("status") || undefined,
  });

  const buffer = await renderToBuffer(
    React.createElement(MemberReportPdfDocument, {
      orgId: params.orgId,
      report,
    })
  );
  const fileDate = new Date().toISOString().split("T")[0];

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="members-report-${params.orgId}-${fileDate}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
