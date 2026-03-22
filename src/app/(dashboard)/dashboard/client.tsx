"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  getWelcomeMetrics,
  getKPIMetrics,
  getActivePlans,
  getOverdueMembers,
  getRecentPayments,
} from "@/lib/api/dashboard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import KPIGrid from "@/components/dashboard/KPIGrid";
import ActivePlansTable from "@/components/dashboard/ActivePlansTable";
import RightSideMetrics from "@/components/dashboard/RightSideMetrics";

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

  return (
    <div className="flex flex-col gap-6 font-body pb-8">
      <WelcomeBanner data={welcomeData} />
      <KPIGrid data={kpiData} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <ActivePlansTable data={activePlans} />
        <RightSideMetrics overdue={overdueMembers} recent={recentPayments} />
      </div>
    </div>
  );
}
