"use client";

import { ActiveInstallmentPlan, FundBreakdown, MemberStanding, OfficerLog } from "@/lib/api/report";
import { Icon } from "@iconify/react";

export function MemberStandingSection({ data }: { data: MemberStanding }) {
  return (
    <div className="rounded-2xl border border-[#F0ECEC] bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h3 className="font-display text-lg font-bold text-[#343434]">Macro Member Standing</h3>
           <p className="text-xs text-[#625f5f]">Current organizational health distribution</p>
         </div>
      </div>
      
      <div className="space-y-6">
        {/* Good Standing */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-[#343434]">Good Standing</span>
            <span className="text-emerald-700 font-bold">{data.goodStanding.count} Members ({data.goodStanding.percent}%)</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${data.goodStanding.percent}%` }} />
          </div>
        </div>

        {/* Active Plan */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-[#343434]">Active Installment Plans</span>
            <span className="text-amber-700 font-bold">{data.activeInstallment.count} Members ({data.activeInstallment.percent}%)</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${data.activeInstallment.percent}%` }} />
          </div>
        </div>

        {/* Overdue */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-[#343434]">Critically Overdue</span>
            <span className="text-crimson-700 text-[#a12124] font-bold">{data.overdue.count} Members ({data.overdue.percent}%)</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#a12124] transition-all duration-500" style={{ width: `${data.overdue.percent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FundBreakdownTable({ data }: { data: FundBreakdown[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm">
      <div className="border-b border-[#F0ECEC] bg-[#F9F7F6] p-4 flex gap-2 items-center">
         <Icon icon="solar:pie-chart-2-bold" className="text-[#625f5f] h-5 w-5" />
         <h3 className="font-display text-sm font-bold text-[#343434]">Fund Allocation Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-white border-b border-[#F0ECEC]">
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Fund Name</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f] text-right">Total Actualized</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f] text-right">Through Full Pmt</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f] text-right">Through Installments</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f] text-center">Collection Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {data.map((fund) => (
              <tr key={fund.id} className="hover:bg-[#F9F7F6] transition-colors">
                 <td className="px-6 py-4 font-bold text-[#343434]">{fund.fundName}</td>
                 <td className="px-6 py-4 text-right font-display font-bold text-emerald-700">₱{fund.totalCollected.toLocaleString()}</td>
                 <td className="px-6 py-4 text-right text-[#625f5f]">₱{fund.fullPaymentSplit.toLocaleString()}</td>
                 <td className="px-6 py-4 text-right text-[#625f5f]">₱{fund.installmentSplit.toLocaleString()}</td>
                 <td className="px-6 py-4 text-center">
                   <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                     {fund.completionRate}% Done
                   </span>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActiveInstallmentsTable({ data }: { data: ActiveInstallmentPlan[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm">
      <div className="border-b border-[#F0ECEC] bg-[#F9F7F6] p-4 flex gap-2 items-center">
         <Icon icon="solar:calendar-date-bold" className="text-[#625f5f] h-5 w-5" />
         <h3 className="font-display text-sm font-bold text-[#343434]">Active Progress Pipelines</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-white border-b border-[#F0ECEC]">
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Member</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Fund Type</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Progress</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f] text-right">Remaining Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {data.map((plan) => (
              <tr key={plan.id} className="hover:bg-[#F9F7F6] transition-colors">
                 <td className="px-6 py-4 font-bold text-[#343434]">{plan.memberName}</td>
                 <td className="px-6 py-4 text-[#625f5f]">{plan.fundName}</td>
                 <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                      {plan.paidSegments} of {plan.totalSegments} Segments Paid
                    </span>
                 </td>
                 <td className="px-6 py-4 text-right font-display font-bold text-[#a12124]">
                   ₱{plan.remainingAmount.toLocaleString()}
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OfficerLogTable({ data }: { data: OfficerLog[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm">
      <div className="border-b border-[#F0ECEC] bg-[#F9F7F6] p-4 flex gap-2 items-center">
         <Icon icon="solar:history-bold" className="text-[#625f5f] h-5 w-5" />
         <h3 className="font-display text-sm font-bold text-[#343434]">Officer Transition Logs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-white border-b border-[#F0ECEC]">
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Role</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Officer</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Term Window</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f] text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {data.map((log) => (
              <tr key={log.id} className="hover:bg-[#F9F7F6] transition-colors">
                 <td className="px-6 py-4 font-bold text-[#343434]">{log.role}</td>
                 <td className="px-6 py-4 text-[#625f5f]">{log.officerName}</td>
                 <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {log.termStart} → {log.termEnd}
                 </td>
                 <td className="px-6 py-4 text-right">
                    {log.status === "ACTIVE" ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-700">ACTIVE</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-widest text-slate-500">{log.status}</span>
                    )}
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
