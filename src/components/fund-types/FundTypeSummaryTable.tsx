"use client";

import { FundType } from "@/lib/api/fund-types";
import { Icon } from "@iconify/react";

export default function FundTypeSummaryTable({ fundTypes }: { fundTypes: FundType[] }) {
  if (fundTypes.length === 0) return null;

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm">
      <div className="border-b border-[#F0ECEC] bg-[#F9F7F6] p-4">
        <h3 className="font-display text-sm font-bold text-[#343434] flex items-center gap-2">
          <Icon icon="solar:server-square-bold" className="h-5 w-5 text-[#625f5f]" />
          Definitions Ledger Overview 
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#F0ECEC] bg-white">
              <th className="px-6 py-3 font-semibold text-[#625f5f]">Core Definition Array</th>
              <th className="px-4 py-3 font-semibold text-[#625f5f] text-right">Bounded Max</th>
              <th className="px-4 py-3 font-semibold text-[#625f5f]">Constraints</th>
              <th className="px-6 py-3 font-semibold text-[#625f5f] text-center">Active Bindings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {fundTypes.map((ft) => (
              <tr key={ft.id} className="transition-colors hover:bg-[#F9F7F6]">
                <td className="px-6 py-3">
                  <span className="font-bold text-[#343434] block">{ft.name}</span>
                  <span className="text-[10px] text-[#625f5f] uppercase mt-0.5">{ft.id}</span>
                </td>
                
                <td className="px-4 py-3 text-right">
                  <span className="font-display font-bold text-[#a12124]">₱{ft.amount.toLocaleString()}</span>
                </td>
                
                <td className="px-4 py-3">
                   <div className="flex gap-1 flex-col items-start">
                     {ft.required && <span className="text-[10px] font-bold text-[#3D0808]">REQUIRED NODE</span>}
                     {ft.allowInstallment && <span className="text-[10px] font-bold text-emerald-600">FRAGMENTS ALLOCATED ({ft.maxInstallments})</span>}
                   </div>
                </td>

                <td className="px-6 py-3 text-center">
                   <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                     {ft.transactionCount} HITS
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
