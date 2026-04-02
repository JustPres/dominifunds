const ORG_DISPLAY_NAME_MAP: Record<string, string> = {
  BSIT: "Dominixode",
};

export function getOrgDisplayName(orgId?: string | null, fallback = "Organization") {
  const normalizedOrgId = orgId?.trim();

  if (!normalizedOrgId) {
    return fallback;
  }

  return ORG_DISPLAY_NAME_MAP[normalizedOrgId] ?? normalizedOrgId;
}
