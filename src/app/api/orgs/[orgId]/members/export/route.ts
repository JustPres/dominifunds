export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import {
  getMemberReport,
  getMemberReportColumnValue,
  MEMBER_REPORT_EXPORT_COLUMNS,
  parseMemberReportFilterStatus,
  parseMemberReportView,
} from "@/lib/member-report";
import { resolveOrganizationSettings } from "@/lib/org-settings";

function escapeCsv(value: string | number) {
  const normalized = String(value ?? "");
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
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
  const orgSettings = await resolveOrganizationSettings(params.orgId);

  const csv = [
    MEMBER_REPORT_EXPORT_COLUMNS.map((column) => escapeCsv(column.header)).join(","),
    ...report.rows.map((row) =>
      MEMBER_REPORT_EXPORT_COLUMNS.map((column) => {
        const value = getMemberReportColumnValue(row, column.key);

        if (typeof value === "number" && column.kind === "currency") {
          return escapeCsv(value.toFixed(2));
        }

        return escapeCsv(value);
      }).join(",")
    ),
  ].join("\r\n");

  const fileDate = new Date().toISOString().split("T")[0];

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members-report-${orgSettings.displayName.replace(/[^a-z0-9-]+/gi, "-")}-${fileDate}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
