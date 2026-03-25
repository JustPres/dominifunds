"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/lib/api/transactions";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import TransactionsTable from "@/components/transactions/TransactionsTable";
import RecordPaymentDialog from "@/components/transactions/RecordPaymentDialog";
import { Skeleton } from "@/components/ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export default function TransactionsClient() {
  const [activeFundId, setActiveFundId] = useState<string>("ALL");
  const { data: session } = useSession();
  const orgId = session?.user?.orgId;

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", orgId],
    queryFn: () => getTransactions(orgId as string),
    enabled: !!orgId,
  });

  const filteredTransactions = data?.transactions.filter((transaction) => {
    if (activeFundId === "ALL") return true;
    return transaction.fundTypeId === activeFundId;
  });

  return (
    <div className="flex h-full flex-col pb-8 font-body">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#343434]">Transaction Ledger</h2>
          <p className="mt-1 text-sm text-[#625f5f]">
            Complete record of recorded collections across full payments and installment activity.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <RecordPaymentDialog />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-[100px] w-full rounded-2xl" />
            ))}
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Icon icon="solar:wallet-money-bold" className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-800/70">Total Collected</p>
                <h3 className="font-display text-3xl font-bold text-emerald-700">
                  {currencyFormatter.format(data?.kpis.totalCollected || 0)}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <Icon icon="solar:round-transfer-horizontal-bold" className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-800/70">Installment Payments</p>
                <h3 className="font-display text-3xl font-bold text-blue-700">
                  {data?.kpis.installmentPaymentsCount}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                <Icon icon="solar:bag-bold" className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-purple-800/70">Full Payments</p>
                <h3 className="font-display text-3xl font-bold text-purple-700">{data?.kpis.fullPaymentsCount}</h3>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFundId("ALL")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
              activeFundId === "ALL"
                ? "bg-[#343434] text-white shadow-sm"
                : "border border-[#F0ECEC] bg-white text-[#625f5f] hover:bg-[#F9F7F6]"
            }`}
          >
            All Transactions
          </button>

          {!isLoading &&
            data?.fundTypes.map((fund) => (
              <button
                key={fund.id}
                onClick={() => setActiveFundId(fund.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
                  activeFundId === fund.id
                    ? "bg-[#343434] text-white shadow-sm"
                    : "border border-[#F0ECEC] bg-white text-[#625f5f] hover:bg-[#F9F7F6]"
                }`}
              >
                {fund.name}
              </button>
            ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-[#F0ECEC] bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : filteredTransactions?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0ECEC] bg-white py-16 text-center shadow-sm">
          <Icon icon="solar:transfer-horizontal-bold" className="mb-4 h-16 w-16 text-[#F0ECEC]" />
          <h3 className="font-display text-lg font-bold text-[#343434]">No transactions recorded yet</h3>
          <p className="mt-1 text-sm text-[#625f5f]">Use the Record Full Payment button to log a direct member payment.</p>
        </div>
      ) : (
        <TransactionsTable transactions={filteredTransactions || []} />
      )}
    </div>
  );
}
