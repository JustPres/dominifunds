"use client";

import { ActiveInstallmentPlan, FundBreakdown, MemberStanding, OfficerLog } from "@/lib/api/report";
import { Icon } from "@iconify/react";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

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
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-[#343434]">Good Standing</span>
            <span className="font-bold text-emerald-700">
              {data.goodStanding.count} Members ({data.goodStanding.percent}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${data.goodStanding.percent}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-[#343434]">Active Installment Plans</span>
            <span className="font-bold text-amber-700">
              {data.activeInstallment.count} Members ({data.activeInstallment.percent}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${data.activeInstallment.percent}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-[#343434]">Critically Overdue</span>
            <span className="font-bold text-[#a12124]">
              {data.overdue.count} Members ({data.overdue.percent}%)
            </span>
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
      <div className="flex items-center gap-2 border-b border-[#F0ECEC] bg-[#F9F7F6] p-4">
        <Icon icon="solar:pie-chart-2-bold" className="h-5 w-5 text-[#625f5f]" />
        <h3 className="font-display text-sm font-bold text-[#343434]">Fund Allocation Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left font-body text-sm">
          <thead>
            <tr className="border-b border-[#F0ECEC] bg-white">
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Fund Name</th>
              <th className="px-6 py-4 text-right font-semibold text-[#625f5f]">Total Actualized</th>
              <th className="px-6 py-4 text-right font-semibold text-[#625f5f]">Through Full Pmt</th>
              <th className="px-6 py-4 text-right font-semibold text-[#625f5f]">Through Installments</th>
              <th className="px-6 py-4 text-center font-semibold text-[#625f5f]">Collection Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {data.map((fund) => (
              <tr key={fund.id} className="transition-colors hover:bg-[#F9F7F6]">
                <td className="px-6 py-4 font-bold text-[#343434]">{fund.fundName}</td>
                <td className="px-6 py-4 text-right font-display font-bold text-emerald-700">
                  {currencyFormatter.format(fund.totalCollected)}
                </td>
                <td className="px-6 py-4 text-right text-[#625f5f]">
                  {currencyFormatter.format(fund.fullPaymentSplit)}
                </td>
                <td className="px-6 py-4 text-right text-[#625f5f]">
                  {currencyFormatter.format(fund.installmentSplit)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
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
      <div className="flex items-center gap-2 border-b border-[#F0ECEC] bg-[#F9F7F6] p-4">
        <Icon icon="solar:calendar-date-bold" className="h-5 w-5 text-[#625f5f]" />
        <h3 className="font-display text-sm font-bold text-[#343434]">Active Progress Pipelines</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left font-body text-sm">
          <thead>
            <tr className="border-b border-[#F0ECEC] bg-white">
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Member</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Fund Type</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Progress</th>
              <th className="px-6 py-4 text-right font-semibold text-[#625f5f]">Remaining Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {data.map((plan) => (
              <tr key={plan.id} className="transition-colors hover:bg-[#F9F7F6]">
                <td className="px-6 py-4 font-bold text-[#343434]">{plan.memberName}</td>
                <td className="px-6 py-4 text-[#625f5f]">{plan.fundName}</td>
                <td className="px-6 py-4">
                  <span className="rounded bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                    {plan.paidSegments} of {plan.totalSegments} Segments Paid
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-display font-bold text-[#a12124]">
                  {currencyFormatter.format(plan.remainingAmount)}
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
      <div className="flex items-center gap-2 border-b border-[#F0ECEC] bg-[#F9F7F6] p-4">
        <Icon icon="solar:history-bold" className="h-5 w-5 text-[#625f5f]" />
        <h3 className="font-display text-sm font-bold text-[#343434]">Officer Transition Logs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left font-body text-sm">
          <thead>
            <tr className="border-b border-[#F0ECEC] bg-white">
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Role</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Officer</th>
              <th className="px-6 py-4 font-semibold text-[#625f5f]">Term Window</th>
              <th className="px-6 py-4 text-right font-semibold text-[#625f5f]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {data.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-[#F9F7F6]">
                <td className="px-6 py-4 font-bold text-[#343434]">{log.role}</td>
                <td className="px-6 py-4 text-[#625f5f]">{log.officerName}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                  {log.termStart} to {log.termEnd || "Present"}
                </td>
                <td className="px-6 py-4 text-right">
                  {log.status === "ACTIVE" ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-700">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-widest text-slate-500">
                      {log.status}
                    </span>
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
