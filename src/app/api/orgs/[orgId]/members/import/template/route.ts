export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { Buffer } from "node:buffer";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";

export async function GET(
  _request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Members");

  worksheet.columns = [
    { header: "Full Name", key: "name", width: 28 },
    { header: "School Email", key: "email", width: 30 },
    { header: "Year Level", key: "yearLevel", width: 14 },
    { header: "Org Role", key: "role", width: 24 },
    { header: "Section", key: "section", width: 18 },
  ];

  worksheet.addRows([
    {
      name: "Juan Dela Cruz",
      email: "juan.delacruz@sdca.edu.ph",
      yearLevel: "3rd",
      role: "Member",
      section: "BSIT 3A",
    },
    {
      name: "Maria Santos",
      email: "",
      yearLevel: "2nd",
      role: "Member",
      section: "BSIT 2B",
    },
  ]);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF6E6E6" },
  };

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="members-import-template-${params.orgId}.xlsx"`,
    },
  });
}
