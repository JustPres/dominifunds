import type { ThemePresetValue } from "@/lib/org-branding";

export interface OrganizationSettingsResponse {
  orgId: string | null;
  displayName: string;
  themePreset: ThemePresetValue;
  isFallback: boolean;
}

export async function getOrganizationSettings(orgId: string): Promise<OrganizationSettingsResponse> {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/settings`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load organization settings");
  }

  return res.json();
}

export async function updateOrganizationSettings(
  orgId: string,
  payload: {
    displayName: string;
    themePreset: ThemePresetValue;
  }
): Promise<OrganizationSettingsResponse> {
  const res = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to save organization settings");
  }

  return res.json();
}
