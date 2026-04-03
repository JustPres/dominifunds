export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getAnnualReportData } from "@/lib/annual-report";
import { AnnualReportPdfDocument } from "@/lib/annual-report-pdf";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { resolveOrganizationSettings } from "@/lib/org-settings";

function toBodyBytes(value: ArrayBuffer | Uint8Array) {
  return value instanceof ArrayBuffer ? new Uint8Array(value) : Uint8Array.from(value);
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
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
  const report = await getAnnualReportData(params.orgId, year);
  const generatedAt = new Date().toISOString();
  const orgSettings = await resolveOrganizationSettings(params.orgId);

  const buffer = await renderToBuffer(
    AnnualReportPdfDocument({
      orgDisplayName: orgSettings.displayName,
      year,
      generatedAt,
      report,
    })
  );
  const pdfBytes = toBodyBytes(buffer);
  const fileDate = generatedAt.split("T")[0];
  const filenameOrg = orgSettings.displayName.replace(/[^a-z0-9-]+/gi, "-");

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="annual-report-${filenameOrg}-${year}-${fileDate}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
