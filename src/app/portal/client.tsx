"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalProfileBanner } from "@/components/portal/PortalProfileBanner";
import { PortalInstallmentsBlock, PortalObligationsGrid, PortalPaymentHistory } from "@/components/portal/PortalActivity";
import { Icon } from "@iconify/react";
import { useSession, signOut } from "next-auth/react";

export default function PortalClient() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const orgId = session?.user?.orgId;

  const { data: installmentsData, isLoading: loadingInstallments } = useQuery({
    queryKey: ["portal-installments", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/members/${userId}/installments`).catch(() => null);
      if (!res?.ok) return [];
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["portal-transactions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/members/${userId}/transactions`).catch(() => null);
      if (!res?.ok) return [];
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: fundsData, isLoading: loadingFunds } = useQuery({
    queryKey: ["portal-funds", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await fetch(`/api/orgs/${orgId}/fund-types`).catch(() => null);
      if (!res?.ok) return [];
      const data = await res.json();
      const arr = data.fundTypes || data;
      return Array.isArray(arr) ? arr.filter((f: Record<string, unknown>) => f.required || f.isRequired) : [];
    },
    enabled: !!orgId,
  });

  const totalPaid = Array.isArray(historyData) ? historyData.reduce((acc: number, tx: Record<string, unknown>) => acc + (typeof tx.amount === "number" ? tx.amount : 0), 0) : 0;
  const activePlans = Array.isArray(installmentsData) ? installmentsData.length : 0;
  
  let nextDueAmt = null;
  let nextDueDate = null;

  if (Array.isArray(installmentsData)) {
     for (const plan of installmentsData) {
        const nextEntry = plan.entries?.find((e: Record<string, unknown>) => e.status === "PENDING" || e.status === "OVERDUE");
        if (nextEntry) {
           if (!nextDueDate || new Date(nextEntry.dueDate as string) < new Date(nextDueDate)) {
              nextDueDate = nextEntry.dueDate as string;
              nextDueAmt = (nextEntry.amount || nextEntry.amountDue) as number;
           }
        }
     }
  }

  const kpis = {
    totalPaid,
    activeInstallmentPlans: activePlans,
    nextPaymentDueAmount: nextDueAmt,
    nextPaymentDueDate: nextDueDate,
  };

  const isLoading = status === "loading" || loadingInstallments || loadingHistory || loadingFunds;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-[12px]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
           {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] w-full rounded-[12px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      
      {/* Banner & KPIs Layer */}
      <div className="relative">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="absolute right-4 top-4 z-10 flex min-h-[36px] items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/30"
        >
          <Icon icon="solar:logout-2-bold" className="h-4 w-4" />
          Sign Out
        </button>
        <PortalProfileBanner session={session} kpis={kpis} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Left Column: Heavy focus tasks (Installments) */}
         <div className="lg:col-span-7 flex flex-col gap-8">
            <section>
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold text-[#343434]">My Installment Plans</h3>
                <p className="text-sm text-[#625f5f]">Track your ongoing segmented payment schedules.</p>
              </div>
              {(!installmentsData || installmentsData.length === 0) ? (
                 <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#DDD8D6] bg-white p-8 text-center shadow-sm">
                   <Icon icon="solar:calendar-date-bold" className="mb-4 h-16 w-16 text-[#625f5f]/40" />
                   <h3 className="font-display text-xl font-bold text-[#343434]">You have no active installment plans. Contact your org treasurer for more information.</h3>
                 </div>
              ) : (
                <PortalInstallmentsBlock plans={installmentsData} />
              )}
            </section>

            <section>
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold text-[#343434]">Full Payment History</h3>
                <p className="text-sm text-[#625f5f]">Log of your flattened baseline organizational clearances.</p>
              </div>
              {(!historyData || historyData.length === 0) ? (
                 <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#DDD8D6] bg-white p-8 text-center shadow-sm">
                   <Icon icon="solar:transfer-horizontal-bold-duotone" className="mb-4 h-16 w-16 text-[#625f5f]/40" />
                   <h3 className="font-display text-xl font-bold text-[#343434]">No history found.</h3>
                 </div>
              ) : (
                <PortalPaymentHistory history={historyData} />
              )}
            </section>
         </div>

         {/* Right Column: References (Obligations) */}
         <div className="lg:col-span-5">
            <section className="sticky top-24">
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold text-[#343434]">Required Fund Obligations</h3>
                <p className="text-sm text-[#625f5f]">Global baseline targets expected by your hierarchy.</p>
              </div>
              <PortalObligationsGrid obligations={fundsData || []} />
            </section>
         </div>
      </div>
    </div>
  );
}
