export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { THEME_PRESET_VALUES } from "@/lib/org-branding";
import {
  getAuthorizedOfficerSession,
  getAuthorizedOrganizationSession,
} from "@/lib/organization-auth";
import {
  resolveOrganizationSettings,
  saveOrganizationSettings,
} from "@/lib/org-settings";

const updateOrganizationSettingsSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters."),
  themePreset: z.enum(THEME_PRESET_VALUES),
});

export async function GET(
  _request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOrganizationSession(params.orgId);

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  return NextResponse.json(await resolveOrganizationSettings(params.orgId));
}

export async function PATCH(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateOrganizationSettingsSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];

    return NextResponse.json(
      {
        message: firstIssue?.message || "Invalid organization settings payload.",
      },
      { status: 400 }
    );
  }

  await saveOrganizationSettings(params.orgId, parsed.data);

  return NextResponse.json(await resolveOrganizationSettings(params.orgId));
}
