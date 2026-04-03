export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { Workbook } from "exceljs";
import { auth } from "@/lib/auth";
import {
  getMemberReport,
  getMemberReportColumnValue,
  MEMBER_REPORT_EXPORT_COLUMNS,
  parseMemberReportFilterStatus,
  parseMemberReportView,
} from "@/lib/member-report";
import { resolveOrganizationSettings } from "@/lib/org-settings";

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
  const orgSettings = await resolveOrganizationSettings(params.orgId);

  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Members Report");
  const orgDisplayName = orgSettings.displayName;

  sheet.mergeCells("A1:G1");
  sheet.getCell("A1").value = "DominiFunds Members Payment Standing Report";
  sheet.getCell("A1").font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF7C1D1D" },
  };
  sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 24;

  sheet.getCell("A2").value = `Organization: ${orgDisplayName}`;
  sheet.getCell("C2").value = `Generated: ${new Date(report.generatedAt).toLocaleString("en-PH")}`;
  sheet.getCell("E2").value = `Status: ${report.filters.status}`;
  sheet.getCell("F2").value = `Search: ${report.filters.search || "None"}`;
  sheet.getCell("G2").value = `View: ${report.filters.view}`;

  const headerRow = sheet.getRow(4);
  MEMBER_REPORT_EXPORT_COLUMNS.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: "FF493735" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF7F1EA" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD9CDC3" } },
      bottom: { style: "thin", color: { argb: "FFD9CDC3" } },
    };
  });

  report.rows.forEach((row) => {
    const values = MEMBER_REPORT_EXPORT_COLUMNS.map((column) =>
      getMemberReportColumnValue(row, column.key)
    );

    const sheetRow = sheet.addRow(values);

    MEMBER_REPORT_EXPORT_COLUMNS.forEach((column, index) => {
      const cell = sheetRow.getCell(index + 1);

      if (column.kind === "currency" && typeof cell.value === "number") {
        cell.numFmt = '"PHP"#,##0.00';
      }

      if (column.kind === "date" && typeof cell.value === "string" && cell.value !== "-") {
        cell.value = cell.value;
      }
    });
  });

  sheet.columns = MEMBER_REPORT_EXPORT_COLUMNS.map((column) => ({
    key: column.key,
    width: column.width ?? 18,
  }));
  sheet.views = [{ state: "frozen", ySplit: 4 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const workbookBytes = toBodyBytes(buffer);
  const fileDate = new Date().toISOString().split("T")[0];

  return new Response(workbookBytes, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="members-report-${orgDisplayName.replace(/[^a-z0-9-]+/gi, "-")}-${fileDate}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
