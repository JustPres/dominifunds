export async function createCollectionPeriod(
  orgId: string,
  payload: { name: string; startDate: string; endDate: string; isActive?: boolean; note?: string }
) {
  const response = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/collection-periods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to create collection period.");
  }

  return response.json();
}

export async function createCollectionSchedule(
  orgId: string,
  payload: {
    collectionPeriodId: string;
    weekdays: number[];
    name?: string;
    note?: string;
    memberId?: string | null;
  }
) {
  const response = await fetch(`/api/orgs/${encodeURIComponent(orgId)}/collection-schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to save collection schedule.");
  }

  return response.json();
}
