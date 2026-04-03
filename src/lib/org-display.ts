export function getOrgDisplayName(orgId?: string | null, fallback = "Organization") {
  const normalizedOrgId = orgId?.trim();

  if (!normalizedOrgId) {
    return fallback;
  }

  return normalizedOrgId;
}

export function normalizeOrgDisplayName(displayName?: string | null, fallback = "Organization") {
  const normalizedDisplayName = displayName?.trim();

  if (!normalizedDisplayName) {
    return fallback;
  }

  return normalizedDisplayName;
}
