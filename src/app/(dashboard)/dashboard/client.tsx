"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  getWelcomeMetrics,
  getKPIMetrics,
  getActivePlans,
  getOverdueMembers,
  getRecentChanges,
  getRecentPayments,
} from "@/lib/api/dashboard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import KPIGrid from "@/components/dashboard/KPIGrid";
import ActivePlansTable from "@/components/dashboard/ActivePlansTable";
import RightSideMetrics from "@/components/dashboard/RightSideMetrics";
import { Icon } from "@iconify/react";

export default function DashboardClient() {
  const { data: welcomeData } = useSuspenseQuery({
    queryKey: ["dashboard", "welcome"],
    queryFn: getWelcomeMetrics,
  });

  const { data: kpiData } = useSuspenseQuery({
    queryKey: ["dashboard", "kpi"],
    queryFn: getKPIMetrics,
  });

  const { data: activePlans } = useSuspenseQuery({
    queryKey: ["dashboard", "active-plans"],
    queryFn: getActivePlans,
  });

  const { data: overdueMembers } = useSuspenseQuery({
    queryKey: ["dashboard", "overdue"],
    queryFn: getOverdueMembers,
  });

  const { data: recentPayments } = useSuspenseQuery({
    queryKey: ["dashboard", "recent-payments"],
    queryFn: getRecentPayments,
  });

  const { data: recentChanges } = useSuspenseQuery({
    queryKey: ["dashboard", "recent-changes"],
    queryFn: getRecentChanges,
  });

  if (welcomeData?.memberCount === 0 && kpiData?.totalCollected === 0 && activePlans?.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0ECEC] bg-white text-center shadow-sm">
        <Icon icon="solar:chart-square-bold-duotone" className="mb-4 h-16 w-16 text-[#625f5f]/40" />
        <h3 className="font-display text-xl font-bold text-[#343434]">No data yet. Start by adding members and fund types.</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-body pb-8">
      <WelcomeBanner data={welcomeData} />
      <KPIGrid data={kpiData} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <ActivePlansTable data={activePlans} />
        <RightSideMetrics overdue={overdueMembers} recent={recentPayments} changes={recentChanges} />
      </div>
    </div>
  );
}
