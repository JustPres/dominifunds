export interface SectionOption {
  id: string;
  name: string;
  memberCount?: number;
  isArchived?: boolean;
}

export async function getSections(orgId: string, options?: { includeArchived?: boolean }): Promise<SectionOption[]> {
  try {
    const query = options?.includeArchived ? "?includeArchived=true" : "";
    const response = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/sections${query}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error();
    }

    const payload = await response.json();
    return payload.sections ?? [];
  } catch {
    return [];
  }
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
