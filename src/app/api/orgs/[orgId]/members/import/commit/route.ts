export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { commitMemberImport, type MemberImportRowInput } from "@/lib/member-import";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";

export async function POST(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const body = await request.json();
  const rows = Array.isArray(body.rows) ? (body.rows as MemberImportRowInput[]) : [];
  const fileName = body.fileName ? String(body.fileName) : null;

  if (rows.length === 0) {
    return NextResponse.json({ message: "There are no rows to import." }, { status: 400 });
  }

  const result = await commitMemberImport(params.orgId, rows, authorization.session.user.id, fileName);

  return NextResponse.json(result);
}
