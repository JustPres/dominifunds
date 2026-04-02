"use client";

import { ReportKPIs } from "@/lib/api/report";
import { Icon } from "@iconify/react";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export default function ReportKPIsGrid({ kpis }: { kpis: ReportKPIs }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <Icon icon="solar:wallet-money-bold" className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800/70">Total Collected</p>
          <h3 className="font-display text-2xl font-bold text-emerald-700">
            {currencyFormatter.format(kpis.totalCollected)}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <Icon icon="solar:calendar-date-bold" className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800/70">Installment Plans</p>
          <h3 className="font-display text-2xl font-bold text-amber-700">
            {kpis.installmentPlansCreated.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <Icon icon="solar:chart-pie-bold" className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-800/70">Completion Rate</p>
          <h3 className="font-display text-2xl font-bold text-blue-700">{kpis.completionRatePercent}%</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100">
          <Icon icon="solar:users-group-rounded-bold" className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-purple-800/70">Collection Rate</p>
          <h3 className="font-display text-2xl font-bold text-purple-700">{kpis.collectionRatePercent}%</h3>
        </div>
      </div>
    </div>
  );
}
