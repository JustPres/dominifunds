"use client";

import { PortalInstallmentPlan, PortalObligation, PortalTransaction } from "@/lib/api/portal";
import { Icon } from "@iconify/react";
import { format } from "date-fns";

export function PortalInstallmentsBlock({ plans }: { plans: PortalInstallmentPlan[] }) {
  if (plans.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-[12px] border border-[#DDD8D6] bg-white p-6 shadow-sm">
        <Icon icon="solar:check-circle-bold" className="h-12 w-12 text-emerald-500 mb-3" />
        <h3 className="font-display text-lg font-bold text-[#343434]">No Pending Installments</h3>
        <p className="text-sm text-[#625f5f]">Your schedules are fully cleared.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {plans.map((plan) => (
          <div key={plan.id} className="overflow-hidden rounded-[12px] border border-[#DDD8D6] bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-[#DDD8D6] bg-white p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#343434]">{plan.fundName}</h3>
                <p className="text-xs text-[#625f5f] mt-0.5">{plan.period}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#625f5f] mb-1">Total Obligation</p>
                <p className="font-display text-xl font-bold text-[#a12124]">₱{plan.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#343434]">Progress</span>
                <span className="font-bold text-[#625f5f]">{plan.paidSegments} of {plan.totalSegments} segments paid</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div 
                  className="h-full rounded-full bg-[#a12124] transition-all duration-500" 
                  style={{ width: `${(plan.paidSegments / plan.totalSegments) * 100}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Entries */}
          <div className="divide-y divide-[#DDD8D6]">
            {plan.entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 sm:px-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-display text-sm font-bold text-[#625f5f]">#{entry.installmentNumber}</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#343434]">₱{entry.amount.toLocaleString()}</p>
                    <p className="text-xs text-[#625f5f]">Due {format(new Date(entry.dueDate), "MMM dd, yyyy")}</p>
                  </div>
                </div>
                
                {entry.status === "PAID" && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">PAID</span>
                )}
                {entry.status === "PENDING" && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">PENDING</span>
                )}
                {entry.status === "OVERDUE" && (
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">OVERDUE</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PortalPaymentHistory({ history }: { history: PortalTransaction[] }) {
  if (history.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-[12px] border border-[#DDD8D6] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#625f5f]">No history recorded.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#DDD8D6] bg-white shadow-sm">
      <div className="border-b border-[#DDD8D6] bg-[#F9F7F6] p-4 flex gap-2 items-center">
         <Icon icon="solar:history-bold" className="text-[#625f5f] h-5 w-5" />
         <h3 className="font-display text-sm font-bold text-[#343434]">Full Payment History</h3>
      </div>
      <div className="divide-y divide-[#DDD8D6]">
        {history.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 pl-0 ml-4 border-l-4 border-emerald-500 transition-colors hover:bg-slate-50">
             <div className="pl-4 flex flex-col gap-1">
               <h4 className="font-bold text-[#343434]">{tx.fundName}</h4>
               <p className="text-xs text-[#625f5f]">{format(new Date(tx.date), "MMM dd, yyyy")} • FULL PAYMENT</p>
               {tx.note && <p className="text-[11px] italic text-[#625f5f] mt-0.5">{tx.note}</p>}
             </div>
             
             <div className="flex flex-col items-end gap-1 pr-4">
               <span className="font-display text-lg font-bold text-emerald-700">₱{tx.amount.toLocaleString()}</span>
               <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">CLEARED</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PortalObligationsGrid({ obligations }: { obligations: PortalObligation[] }) {
  const getIcon = (freq: string) => {
    switch(freq) {
      case "MONTHLY": return "solar:calendar-minimalistic-bold";
      case "PER_SEMESTER": return "solar:notebook-bold";
      case "ANNUAL": return "solar:star-bold";
      case "PER_EVENT": return "solar:ticket-bold";
      default: return "solar:box-bold";
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {obligations.map((ob) => (
        <div key={ob.id} className="flex items-center justify-between rounded-[12px] border border-[#DDD8D6] bg-white p-4 shadow-sm transition-all hover:border-[#a12124]/30 hover:shadow-md">
           <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Icon icon={getIcon(ob.frequency)} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-[#343434] text-sm">{ob.fundName}</h4>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[10px] text-[#625f5f]">{ob.frequency.replace("_", " ")}</span>
                  {ob.allowInstallment && (
                    <span className="inline-block rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600">INSTALLMENT OK</span>
                  )}
                </div>
              </div>
           </div>
           
           <span className="font-display font-bold text-[#a12124]">₱{ob.amount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
