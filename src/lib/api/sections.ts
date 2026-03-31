export interface SectionOption {
  id: string;
  name: string;
  memberCount?: number;
  isArchived?: boolean;
}

export async function getSections(orgId: string, options?: { includeArchived?: boolean }): Promise<SectionOption[]> {
  const query = options?.includeArchived ? "?includeArchived=true" : "";
  const response = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/sections${query}`, {
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Failed to load sections");
  }

  return payload.sections ?? [];
}

export async function createSection(orgId: string, payload: { name: string; note?: string }) {
  const response = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/sections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to create section");
  }

  return response.json();
}

export async function updateSection(orgId: string, id: string, payload: { name: string; note?: string }) {
  const response = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/sections/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update section");
  }

  return response.json();
}

export async function archiveSection(orgId: string, id: string, payload?: { note?: string }) {
  const response = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/sections/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to archive section");
  }

  return response.json();
}

export async function restoreSection(orgId: string, id: string, payload?: { note?: string }) {
  const response = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/sections/${encodeURIComponent(id)}/restore`, {
    method: "POST",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to restore section");
  }

  return response.json();
}
