export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { buildMemberImportPreview, parseMemberImportFile, summarizeMemberImportPreview } from "@/lib/member-import";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";

export async function POST(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Upload an Excel file first." }, { status: 400 });
  }

  const parsedRows = await parseMemberImportFile(await file.arrayBuffer());
  const previewRows = await buildMemberImportPreview(params.orgId, parsedRows);

  return NextResponse.json({
    rows: previewRows,
    summary: summarizeMemberImportPreview(previewRows),
    fileName: file.name,
  });
}
