export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getMemberReport, parseMemberReportFilterStatus, parseMemberReportView } from "@/lib/member-report";
import { MemberReportPdfDocument } from "@/lib/member-report-pdf";

function toBodyBytes(value: ArrayBuffer | Uint8Array) {
  return value instanceof ArrayBuffer ? new Uint8Array(value) : Uint8Array.from(value);
}

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
    status: parseMemberReportFilterStatus(searchParams.get("status")),
    sectionId: searchParams.get("sectionId") || undefined,
    view: parseMemberReportView(searchParams.get("view")),
  });

  const buffer = await renderToBuffer(
    MemberReportPdfDocument({
      orgId: params.orgId,
      report,
    })
  );
  const pdfBytes = toBodyBytes(buffer);
  const fileDate = new Date().toISOString().split("T")[0];

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="members-report-${params.orgId}-${fileDate}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
