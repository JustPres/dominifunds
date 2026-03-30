import type { Prisma, Role } from "@prisma/client";

export type UserDirectoryView = "active" | "archived";

export function getUserLifecycleWhere(view: UserDirectoryView = "active"): Prisma.UserWhereInput {
  return view === "archived"
    ? { deactivatedAt: { not: null } }
    : { deactivatedAt: null };
}

export function isUserDeactivated(value?: Date | string | null) {
  return Boolean(value);
}

export function getUserLifecycleActionLabel(role: Role) {
  return role === "OFFICER" ? "Deactivate" : "Archive";
}

export function getUserRestoreActionLabel(role: Role) {
  return role === "OFFICER" ? "Reactivate" : "Restore";
}
