"use client";

import { useQuery } from "@tanstack/react-query";
import { getInstallmentData } from "@/lib/api/installments";
import { Icon } from "@iconify/react";
import InstallmentPlanCard from "@/components/installments/InstallmentPlanCard";
import AddInstallmentDialog from "@/components/installments/AddInstallmentDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstallmentsClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["installments"],
    queryFn: getInstallmentData,
  });

  return (
    <div className="flex h-full flex-col font-body pb-8">
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#343434]">Installment Tracker</h2>
          <p className="mt-1 text-sm text-[#625f5f]">
            Monitor complex payment fragmentation spread securely over configured due dates.
          </p>
        </div>
        
        <div className="shrink-0 flex items-center justify-end">
          <AddInstallmentDialog />
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[100px] w-full rounded-2xl" />)}
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Icon icon="solar:calendar-date-bold" className="h-6 w-6 text-amber-600" />
               </div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wide text-amber-800/70">Active Plans</p>
                 <h3 className="font-display text-3xl font-bold text-amber-700">{data?.kpis.activePlans}</h3>
               </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <Icon icon="solar:danger-triangle-bold" className="h-6 w-6 text-red-600" />
               </div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wide text-red-800/70">Overdue Entries</p>
                 <h3 className="font-display text-3xl font-bold text-red-700">{data?.kpis.overdueEntries}</h3>
               </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <Icon icon="solar:check-circle-bold" className="h-6 w-6 text-emerald-600" />
               </div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wide text-emerald-800/70">Completed 1st Sem</p>
                 <h3 className="font-display text-3xl font-bold text-emerald-700">{data?.kpis.completedPlansSemester}</h3>
               </div>
            </div>
          </>
        )}
      </div>

      {/* Grid Flow */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[350px] w-full rounded-2xl" />)}
        </div>
      ) : data?.plans.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0ECEC] bg-white p-8 text-center shadow-sm">
           <Icon icon="solar:history-bold-duotone" className="mb-4 h-16 w-16 text-[#625f5f]/40" />
           <h3 className="font-display text-xl font-bold text-[#343434]">No installment plans created yet.</h3>
           <p className="mt-2 text-sm text-[#625f5f]">Start creating structured installment splits for members.</p>
           <div className="mt-6">
             <AddInstallmentDialog />
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
           {data?.plans.map(plan => (
             <InstallmentPlanCard key={plan.id} plan={plan} />
           ))}
        </div>
      )}
    </div>
  );
}
