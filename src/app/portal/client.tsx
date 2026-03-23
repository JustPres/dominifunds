"use client";

import { useQuery } from "@tanstack/react-query";
import { getPortalData } from "@/lib/api/portal";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalProfileBanner } from "@/components/portal/PortalProfileBanner";
import { PortalInstallmentsBlock, PortalObligationsGrid, PortalPaymentHistory } from "@/components/portal/PortalActivity";

export default function PortalClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal"],
    queryFn: () => getPortalData(),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
           {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      
      {/* Banner & KPIs Layer */}
      <PortalProfileBanner data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Left Column: Heavy focus tasks (Installments) */}
         <div className="lg:col-span-7 flex flex-col gap-8">
            <section>
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold text-[#343434]">My Installment Plans</h3>
                <p className="text-sm text-[#625f5f]">Track your ongoing segmented payment schedules.</p>
              </div>
              <PortalInstallmentsBlock plans={data.installments} />
            </section>

            <section>
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold text-[#343434]">Full Payment History</h3>
                <p className="text-sm text-[#625f5f]">Log of your flattened baseline organizational clearances.</p>
              </div>
              <PortalPaymentHistory history={data.history} />
            </section>
         </div>

         {/* Right Column: References (Obligations) */}
         <div className="lg:col-span-5">
            <section className="sticky top-24">
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold text-[#343434]">Required Fund Obligations</h3>
                <p className="text-sm text-[#625f5f]">Global baseline targets expected by your hierarchy.</p>
              </div>
              <PortalObligationsGrid obligations={data.obligations} />
            </section>
         </div>
      </div>
    </div>
  );
}
