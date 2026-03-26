import type { OfficerAccessRole } from "@prisma/client";

type SessionLike = {
  role?: string | null;
  orgRole?: string | null;
  officerAccessRole?: OfficerAccessRole | string | null;
};

export function inferOfficerAccessRole(
  officerAccessRole?: OfficerAccessRole | string | null,
  orgRole?: string | null
): OfficerAccessRole | null {
  const normalizedDirect = normalizeOfficerAccessRole(officerAccessRole);

  if (normalizedDirect) {
    return normalizedDirect;
  }

  return normalizeOfficerAccessRole(orgRole);
}

export function getSessionOfficerAccessRole(user?: SessionLike | null): OfficerAccessRole | null {
  if (!user || user.role !== "OFFICER") return null;
  return inferOfficerAccessRole(user.officerAccessRole, user.orgRole);
}

export function canViewOfficerWorkspace(user?: SessionLike | null) {
  return user?.role === "OFFICER";
}

export function canManageOrganization(user?: SessionLike | null) {
  return user?.role === "OFFICER" && getSessionOfficerAccessRole(user) === "TREASURER";
}

export function isPresident(user?: SessionLike | null) {
  return user?.role === "OFFICER" && getSessionOfficerAccessRole(user) === "PRESIDENT";
}

function normalizeOfficerAccessRole(value?: OfficerAccessRole | string | null): OfficerAccessRole | null {
  if (!value) return null;

  const normalized = String(value).trim().toUpperCase();

  if (normalized === "TREASURER") return "TREASURER";
  if (normalized === "PRESIDENT") return "PRESIDENT";

  return null;
}
