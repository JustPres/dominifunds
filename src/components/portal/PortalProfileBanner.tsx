"use client";

import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { Session } from "next-auth";

interface KPIProps {
  totalPaid: number;
  activeInstallmentPlans: number;
  nextPaymentDueAmount: number | null;
  nextPaymentDueDate: string | null;
}

export function PortalProfileBanner({ session, kpis }: { session: Session | null; kpis: KPIProps }) {
  const profileName = session?.user?.name || "Student";
  const initials = profileName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const email = session?.user?.email || "";
  const orgName = session?.user?.orgId || "DominiFunds Organization";
  const yearLevel = session?.user?.orgRole || "Student";

  return (
    <div className="mb-8 flex flex-col gap-6">
      {/* Banner - Light Theme Redesign */}
      <div className="relative overflow-hidden rounded-[12px] bg-white border border-[#DDD8D6] p-8 shadow-sm">
         <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Avatar block */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#F9F7F6] border border-[#F0ECEC] shadow-sm">
               <span className="font-display text-3xl font-bold text-[#a12124]">{initials}</span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-[#343434]">
               <div className="flex items-center gap-3">
                 <h2 className="font-display text-2xl font-bold">{profileName}</h2>
                 <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[11px] font-bold tracking-widest text-emerald-700">GOOD STANDING</span>
               </div>
               <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#625f5f]">
                 <div className="flex items-center gap-1.5">
                   <Icon icon="solar:buildings-2-bold" className="h-4 w-4 opacity-70" />
                   <span>{orgName}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <Icon icon="solar:user-id-bold" className="h-4 w-4 opacity-70" />
                   <span>{yearLevel}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <Icon icon="solar:letter-bold" className="h-4 w-4 opacity-70" />
                   <span>{email}</span>
                 </div>
               </div>
            </div>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Paid */}
        <div className="flex flex-col gap-1 rounded-[12px] border border-[#DDD8D6] bg-white p-5 shadow-sm">
           <div className="flex items-center gap-2 text-[#625f5f]">
              <Icon icon="solar:wallet-money-bold" className="h-4 w-4 text-[#a12124]" />
              <p className="text-xs font-bold uppercase tracking-wide">Total Paid</p>
           </div>
           <h3 className="font-display text-2xl font-bold text-[#343434] mt-2">₱{kpis.totalPaid.toLocaleString()}</h3>
        </div>

        {/* Active Installments */}
        <div className="flex flex-col gap-1 rounded-[12px] border border-[#DDD8D6] bg-white p-5 shadow-sm">
           <div className="flex items-center gap-2 text-[#625f5f]">
              <Icon icon="solar:calendar-date-bold" className="h-4 w-4 text-[#a12124]" />
              <p className="text-xs font-bold uppercase tracking-wide">Active Installment Plans</p>
           </div>
           <h3 className="font-display text-2xl font-bold text-[#343434] mt-2">{kpis.activeInstallmentPlans}</h3>
        </div>

        {/* Next Payment Amount */}
        <div className="flex flex-col gap-1 rounded-[12px] border border-[#DDD8D6] bg-white p-5 shadow-sm">
           <div className="flex items-center gap-2 text-[#625f5f]">
              <Icon icon="solar:bill-cross-bold" className="h-4 w-4 text-[#a12124]" />
              <p className="text-xs font-bold uppercase tracking-wide">Next Payment Due</p>
           </div>
           <h3 className="font-display text-2xl font-bold text-[#a12124] mt-2">
             {kpis.nextPaymentDueAmount ? `₱${kpis.nextPaymentDueAmount.toLocaleString()}` : "₱0"}
           </h3>
        </div>

        {/* Next Payment Date */}
        <div className="flex flex-col gap-1 rounded-[12px] border border-[#DDD8D6] bg-white p-5 shadow-sm">
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
