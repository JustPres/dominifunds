import prisma from "@/lib/prisma";
import {
  DEFAULT_THEME_PRESET,
  type ThemePresetValue,
} from "@/lib/org-branding";
import { normalizeOrgDisplayName } from "@/lib/org-display";

export interface ResolvedOrganizationSettings {
  orgId: string | null;
  displayName: string;
  themePreset: ThemePresetValue;
  isFallback: boolean;
}

export function getFallbackOrganizationSettings(orgId?: string | null): ResolvedOrganizationSettings {
  const normalizedOrgId = orgId?.trim() || null;

  return {
    orgId: normalizedOrgId,
    displayName: normalizeOrgDisplayName(normalizedOrgId, normalizedOrgId || "Organization"),
    themePreset: DEFAULT_THEME_PRESET,
    isFallback: true,
  };
}

export async function getOrganizationSettingsRecord(orgId: string) {
  return prisma.organizationSettings.findUnique({
    where: { orgId },
  });
}

export async function resolveOrganizationSettings(orgId?: string | null): Promise<ResolvedOrganizationSettings> {
  const normalizedOrgId = orgId?.trim();

  if (!normalizedOrgId) {
    return getFallbackOrganizationSettings(null);
  }

  const record = await getOrganizationSettingsRecord(normalizedOrgId);

  return {
    orgId: normalizedOrgId,
    displayName: normalizeOrgDisplayName(record?.displayName, normalizedOrgId),
    themePreset: record?.themePreset ?? DEFAULT_THEME_PRESET,
    isFallback: !record,
  };
}

export async function saveOrganizationSettings(
  orgId: string,
  input: {
    displayName: string;
    themePreset: ThemePresetValue;
  }
) {
  const normalizedOrgId = orgId.trim();
  const displayName = normalizeOrgDisplayName(input.displayName, normalizedOrgId);

  return prisma.organizationSettings.upsert({
    where: { orgId: normalizedOrgId },
    update: {
      displayName,
      themePreset: input.themePreset,
    },
    create: {
      orgId: normalizedOrgId,
      displayName,
      themePreset: input.themePreset,
    },
  });
}
