"use client";

import { FundType } from "@/lib/api/fund-types";
import { formatFundFrequency } from "@/lib/fund-type-utils";
import { Icon } from "@iconify/react";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export default function FundTypeSummaryTable({ fundTypes }: { fundTypes: FundType[] }) {
  if (fundTypes.length === 0) return null;

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm">
      <div className="border-b border-[#F0ECEC] bg-[#F9F7F6] p-4">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#343434]">
          <Icon icon="solar:server-square-bold" className="h-5 w-5 text-[#625f5f]" />
          Fund Policy Overview
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left font-body text-sm">
          <thead>
            <tr className="border-b border-[#F0ECEC] bg-white">
              <th className="px-6 py-3 font-semibold text-[#625f5f]">Fund</th>
              <th className="px-4 py-3 font-semibold text-[#625f5f]">Frequency</th>
              <th className="px-4 py-3 text-right font-semibold text-[#625f5f]">Amount</th>
              <th className="px-4 py-3 font-semibold text-[#625f5f]">Rules</th>
              <th className="px-4 py-3 text-center font-semibold text-[#625f5f]">Usage</th>
              <th className="px-6 py-3 text-center font-semibold text-[#625f5f]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {fundTypes.map((fundType) => (
              <tr key={fundType.id} className="transition-colors hover:bg-[#F9F7F6]">
                <td className="px-6 py-3">
                  <span className="block font-bold text-[#343434]">{fundType.name}</span>
                  <span className="mt-0.5 block text-[10px] uppercase text-[#625f5f]">
                    {fundType.description || "No description provided"}
                  </span>
                </td>

                <td className="px-4 py-3 text-[#343434]">{formatFundFrequency(fundType.frequency)}</td>

                <td className="px-4 py-3 text-right">
                  <span className="font-display font-bold text-[#a12124]">
                    {currencyFormatter.format(fundType.amount)}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        fundType.required ? "text-[#3D0808]" : "text-slate-500"
                      }`}
                    >
                      {fundType.required ? "Required for members" : "Optional fund"}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        fundType.allowInstallment ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {fundType.allowInstallment
                        ? `Installments up to ${fundType.maxInstallments ?? "custom"}`
                        : "No installments"}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                      {fundType.transactionCount} transactions
                    </span>
                    <span className="text-[10px] font-medium text-[#625f5f]">
                      {fundType.installmentPlanCount} plans
                    </span>
                  </div>
                </td>

                <td className="px-6 py-3 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      fundType.isArchived ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {fundType.isArchived ? "Archived" : "Active"}
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
