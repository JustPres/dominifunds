export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import prisma from "@/lib/prisma";

function serializeDraft(draft: {
  id: string;
  name: string;
  email: string | null;
  orgRole: string | null;
  yearLevel: string | null;
  sectionId: string | null;
  sourceFileName: string | null;
  status: string;
  issueSummary: string | null;
  rawData: unknown;
  createdAt: Date;
  updatedAt: Date;
  section?: { name: string } | null;
}) {
  return {
    id: draft.id,
    name: draft.name,
    email: draft.email,
    role: draft.orgRole ?? "Member",
    yearLevel: draft.yearLevel,
    sectionId: draft.sectionId,
    sectionName: draft.section?.name ?? "Unassigned",
    sourceFileName: draft.sourceFileName,
    status: draft.status,
    issueSummary: draft.issueSummary,
    rawData: draft.rawData,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const drafts = await prisma.memberImportDraft.findMany({
    where: {
      orgId: params.orgId,
    },
    include: {
      section: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    drafts: drafts.map(serializeDraft),
  });
}
