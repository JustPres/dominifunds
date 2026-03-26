import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import {
  getWelcomeMetrics,
  getKPIMetrics,
  getActivePlans,
  getOverdueMembers,
  getRecentChanges,
  getRecentPayments,
} from "@/lib/api/dashboard";
import DashboardClient from "./client";

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  // Prefetch all required queries sequentially or in parallel
  // Next.js will suspend and render loading.tsx until these resolve on the server
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["dashboard", "welcome"],
      queryFn: getWelcomeMetrics,
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard", "kpi"],
      queryFn: getKPIMetrics,
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard", "active-plans"],
      queryFn: getActivePlans,
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard", "overdue"],
      queryFn: getOverdueMembers,
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard", "recent-payments"],
      queryFn: getRecentPayments,
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard", "recent-changes"],
      queryFn: getRecentChanges,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}
