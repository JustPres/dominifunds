import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 font-body pb-8">
      {/* Welcome Banner Skeleton */}
      <Skeleton className="h-[140px] w-full rounded-2xl" />

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-2xl" />
        ))}
      </div>

      {/* Tables/Lists Grid Skeleton */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Active Plans Skeleton */}
        <Skeleton className="h-[350px] w-full rounded-2xl" />
        
        {/* Right Side Metrics Skeleton */}
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[250px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
