const YEAR_LEVEL_MAP = new Map<string, "1st" | "2nd" | "3rd" | "4th">([
  ["1st", "1st"],
  ["1st year", "1st"],
  ["2nd", "2nd"],
  ["2nd year", "2nd"],
  ["3rd", "3rd"],
  ["3rd year", "3rd"],
  ["4th", "4th"],
  ["4th year", "4th"],
]);

export type YearLevelValue = "1st" | "2nd" | "3rd" | "4th";

export function normalizeYearLevel(value?: string | null): YearLevelValue | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  return YEAR_LEVEL_MAP.get(normalized) ?? null;
}

export function isYearLevelLabel(value?: string | null): boolean {
  return normalizeYearLevel(value) !== null;
}

export function resolveStudentYearLevel(
  yearLevel?: string | null,
  orgRole?: string | null
): YearLevelValue | null {
  return normalizeYearLevel(yearLevel) ?? normalizeYearLevel(orgRole);
}

export function resolveStudentOrgRole(orgRole?: string | null): string {
  if (!orgRole || isYearLevelLabel(orgRole)) {
    return "Member";
  }

  return orgRole;
}

export function formatYearLevelLabel(
  yearLevel?: string | null,
  fallback = "Unspecified"
): string {
  const normalized = normalizeYearLevel(yearLevel);

  if (!normalized) {
    return fallback;
  }

  return `${normalized} Year`;
}
