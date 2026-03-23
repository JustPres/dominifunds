"use client";

import { PortalData } from "@/lib/api/portal";
import { Icon } from "@iconify/react";
import { format } from "date-fns";

export function PortalProfileBanner({ data }: { data: PortalData }) {
  const { profile, kpis } = data;

  return (
    <div className="mb-8 flex flex-col gap-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3D0808] to-[#9e1c1e] p-8 shadow-md">
         {/* Abstract background shapes */}
         <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
         <div className="absolute right-40 bottom-0 h-32 w-32 rounded-full bg-black/10 blur-xl" />

         <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Avatar block */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xl ring-4 ring-white/10">
               <span className="font-display text-3xl font-bold text-[#3D0808]">{profile.initials}</span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-white">
               <div className="flex items-center gap-3">
                 <h2 className="font-display text-2xl font-bold">{profile.name}</h2>
                 {profile.status === "GOOD_STANDING" && (
                   <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold tracking-widest text-emerald-100">GOOD STANDING</span>
                 )}
                 {profile.status === "HAS_INSTALLMENT" && (
                   <span className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold tracking-widest text-amber-100">ON INSTALLMENTS</span>
                 )}
               </div>
               <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
                 <div className="flex items-center gap-1.5">
                   <Icon icon="solar:buildings-2-bold" className="h-4 w-4 opacity-70" />
                   <span>{profile.organization}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <Icon icon="solar:user-id-bold" className="h-4 w-4 opacity-70" />
                   <span>{profile.yearLevel}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <Icon icon="solar:letter-bold" className="h-4 w-4 opacity-70" />
                   <span>{profile.email}</span>
                 </div>
               </div>
            </div>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Paid */}
        <div className="flex flex-col gap-1 rounded-2xl border border-[#F0ECEC] bg-white p-5 shadow-sm">
           <div className="flex items-center gap-2 text-[#625f5f]">
              <Icon icon="solar:wallet-money-bold" className="h-4 w-4 text-[#3D0808]" />
              <p className="text-xs font-bold uppercase tracking-wide">Total Paid</p>
           </div>
           <h3 className="font-display text-2xl font-bold text-[#343434] mt-2">₱{kpis.totalPaid.toLocaleString()}</h3>
        </div>

        {/* Active Installments */}
        <div className="flex flex-col gap-1 rounded-2xl border border-[#F0ECEC] bg-white p-5 shadow-sm">
           <div className="flex items-center gap-2 text-[#625f5f]">
              <Icon icon="solar:calendar-date-bold" className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-bold uppercase tracking-wide">Active Installment Plans</p>
           </div>
           <h3 className="font-display text-2xl font-bold text-[#343434] mt-2">{kpis.activeInstallmentPlans}</h3>
        </div>

        {/* Next Payment Amount */}
        <div className="flex flex-col gap-1 rounded-2xl border border-[#F0ECEC] bg-white p-5 shadow-sm">
           <div className="flex items-center gap-2 text-[#625f5f]">
              <Icon icon="solar:bill-cross-bold" className="h-4 w-4 text-[#a12124]" />
              <p className="text-xs font-bold uppercase tracking-wide">Next Payment Due</p>
           </div>
           <h3 className="font-display text-2xl font-bold text-[#a12124] mt-2">
             {kpis.nextPaymentDueAmount ? `₱${kpis.nextPaymentDueAmount.toLocaleString()}` : "₱0"}
           </h3>
        </div>

        {/* Next Payment Date */}
        <div className="flex flex-col gap-1 rounded-2xl border border-[#F0ECEC] bg-white p-5 shadow-sm">
           <div className="flex items-center gap-2 text-[#625f5f]">
              <Icon icon="solar:clock-circle-bold" className="h-4 w-4 text-purple-600" />
              <p className="text-xs font-bold uppercase tracking-wide">Deadline</p>
           </div>
           <h3 className="font-display text-lg font-bold text-[#343434] mt-auto">
             {kpis.nextPaymentDueDate ? format(new Date(kpis.nextPaymentDueDate), "MMM dd, yyyy") : "No Due Dates"}
           </h3>
        </div>
      </div>
    </div>
  );
}
