"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalProfileBanner } from "@/components/portal/PortalProfileBanner";
import { getOrganizationSettings } from "@/lib/api/org-settings";
import {
  PortalInstallmentsSection,
  PortalObligationsPanel,
  PortalOverviewPanel,
  PortalPaymentHistorySection,
  PortalSecurityPanel,
} from "@/components/portal/PortalActivity";
import {
  buildPortalOverview,
  mapPortalInstallments,
  mapPortalObligations,
  mapPortalTransactions,
  type PortalSecuritySummary,
} from "@/lib/api/portal";
import { getOrgDisplayName } from "@/lib/org-display";

export default function PortalClient() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const orgId = session?.user?.orgId;

  const { data: installmentsResponse = [], isLoading: isLoadingInstallments } = useQuery({
    queryKey: ["portal-installments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await fetch(`/api/members/${userId}/installments`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return [];
      return res.json();
    },
  });

  const { data: historyResponse = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["portal-transactions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await fetch(`/api/members/${userId}/transactions`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return [];
      return res.json();
    },
  });

  const { data: fundsResponse = { fundTypes: [] }, isLoading: isLoadingFunds } = useQuery({
    queryKey: ["portal-funds", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${orgId}/fund-types`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return { fundTypes: [] };
      return res.json();
    },
  });

  const { data: securitySummary = null, isLoading: isLoadingSecurity } = useQuery<PortalSecuritySummary | null>({
    queryKey: ["portal-security-summary"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const res = await fetch("/api/auth/security/summary", { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return null;
      return res.json();
    },
  });
  const { data: orgSettings = null, isLoading: isLoadingOrgSettings } = useQuery({
    queryKey: ["org-settings", orgId],
    enabled: !!orgId,
    queryFn: () => getOrganizationSettings(orgId as string),
    staleTime: 60_000,
  });

  const installments = useMemo(
    () => mapPortalInstallments(Array.isArray(installmentsResponse) ? installmentsResponse : []),
    [installmentsResponse]
  );
  const history = useMemo(
    () => mapPortalTransactions(Array.isArray(historyResponse) ? historyResponse : []),
    [historyResponse]
  );
  const obligations = useMemo(
    () =>
      mapPortalObligations(
        Array.isArray(fundsResponse?.fundTypes)
          ? fundsResponse.fundTypes
          : Array.isArray(fundsResponse)
          ? fundsResponse
          : []
      ).filter((obligation) => obligation.required),
    [fundsResponse]
  );
  const overview = useMemo(
    () =>
      buildPortalOverview({
        installments,
        history,
        obligations,
      }),
    [history, installments, obligations]
  );

  const isLoading =
    status === "loading" ||
    isLoadingInstallments ||
    isLoadingHistory ||
    isLoadingFunds ||
    isLoadingSecurity ||
    isLoadingOrgSettings;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[320px] w-full rounded-[32px]" />
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Skeleton className="h-[260px] w-full rounded-[28px]" />
          <Skeleton className="h-[260px] w-full rounded-[28px]" />
        </div>
        <Skeleton className="h-[380px] w-full rounded-[28px]" />
        <Skeleton className="h-[320px] w-full rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortalProfileBanner
        session={session}
        overview={overview}
        securitySummary={securitySummary}
        orgDisplayName={orgSettings?.displayName ?? getOrgDisplayName(orgId)}
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <PortalOverviewPanel overview={overview} />
        <PortalSecurityPanel security={securitySummary} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <PortalInstallmentsSection plans={installments} />
          <PortalPaymentHistorySection history={history} />
        </div>

        <div className="space-y-6">
          <PortalObligationsPanel obligations={obligations} />
        </div>
      </div>
    </div>
  );
}
