"use client";

import { FundType, deleteFundType } from "@/lib/api/fund-types";
import { Icon } from "@iconify/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FundTypeGridProps {
  orgId: string;
  fundTypes: FundType[];
  onEdit: (fund: FundType) => void;
  onCreate: () => void;
}

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export default function FundTypeGrid({ orgId, fundTypes, onEdit, onCreate }: FundTypeGridProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (fundTypeId: string) => deleteFundType(orgId, fundTypeId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["fund-types", orgId] });
      toast.success(
        result.action === "archived"
          ? "Fund archived. Historical records will keep this name."
          : "Fund configuration deleted permanently."
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to retire the fund.");
    },
  });

  const getIcon = (frequency: string) => {
    switch (frequency) {
      case "MONTHLY":
        return "solar:calendar-minimalistic-bold";
      case "PER_SEMESTER":
        return "solar:notebook-bold";
      case "ANNUAL":
        return "solar:star-bold";
      case "PER_EVENT":
        return "solar:ticket-bold";
      default:
        return "solar:box-bold";
    }
  };

  if (fundTypes.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0ECEC] bg-white p-8 text-center shadow-sm">
        <Icon icon="solar:folder-with-files-bold-duotone" className="mb-4 h-16 w-16 text-[#625f5f]/40" />
        <h3 className="font-display text-xl font-bold text-[#343434]">No fund types defined yet.</h3>
        <p className="mt-2 text-sm text-[#625f5f]">Set up the active collection rules for this organization here.</p>
        <div className="mt-6">
          <button
            onClick={onCreate}
            className="flex items-center gap-2 rounded-lg bg-[#a12124] px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-[#8a1c1e]"
          >
            <Icon icon="solar:add-circle-bold" className="h-[18px] w-[18px]" />
            Add Fund Type
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {fundTypes.map((fundType) => {
        const deleteAction =
          fundType.transactionCount > 0 || fundType.installmentPlanCount > 0 ? "archive" : "delete";

        return (
          <div
            key={fundType.id}
            className={`group relative flex flex-col rounded-2xl border p-5 shadow-sm transition-all ${
              fundType.isArchived
                ? "border-[#e8d7cd] bg-[#faf6f2] opacity-80"
                : "border-[#F0ECEC] bg-white hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 transition-colors group-hover:bg-[#3D0808]/10 group-hover:text-[#3D0808]">
                  <Icon icon={getIcon(fundType.frequency)} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#343434]">{fundType.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#F9F7F6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#625f5f]">
                      {fundType.frequency.replace("_", " ")}
                    </span>
                    {fundType.required ? (
                      <span className="inline-flex items-center rounded-full bg-[#3D0808]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3D0808]">
                        REQUIRED
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        OPTIONAL
                      </span>
                    )}
                    {fundType.isArchived ? (
                      <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        ARCHIVED
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="font-display text-2xl font-bold text-[#a12124]">
                  {currencyFormatter.format(fundType.amount)}
                </p>
              </div>
            </div>

            <div className="my-5 h-px w-full bg-[#F0ECEC]" />

            <p className="mb-4 flex-1 text-[13px] leading-relaxed text-[#625f5f]">
              {fundType.description}
            </p>

            {fundType.isArchived ? (
              <div className="mb-4 rounded-xl border border-[#e8d7cd] bg-white/70 p-3 text-[12px] text-[#625f5f]">
                Archived funds stay available for historical transactions and installment reports, but cannot be used for new collections.
              </div>
            ) : null}

            <div className="mt-auto flex items-center gap-4 rounded-xl bg-[#F9F7F6]/60 p-3">
              <div className="flex items-center gap-2">
                {fundType.allowInstallment ? (
                  <>
                    <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#343434]">Installments Active</span>
                      <span className="text-[10px] text-[#625f5f]">
                        Max splits: {fundType.maxInstallments ?? "Open"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:close-circle-bold" className="h-5 w-5 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#343434]">No Installments</span>
                    </div>
                  </>
                )}
              </div>

              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => onEdit(fundType)}
                  disabled={fundType.isArchived}
                  className="flex h-8 w-8 items-center justify-center rounded border border-[#F0ECEC] bg-white text-[#343434] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title={fundType.isArchived ? "Archived funds are read-only" : "Edit fund"}
                >
                  <Icon icon="solar:pen-bold" className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to ${deleteAction} this fund?`)) {
                      deleteMutation.mutate(fundType.id);
                    }
                  }}
                  disabled={deleteMutation.isPending || fundType.isArchived}
                  className="flex h-8 w-8 items-center justify-center rounded border border-red-100 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  title={fundType.isArchived ? "This fund is already archived" : "Retire fund"}
                >
                  <Icon icon="solar:trash-bin-trash-bold" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <button
        onClick={onCreate}
        className="group flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#F0ECEC] bg-[#F9F7F6]/50 p-6 text-center transition-all hover:border-[#3D0808]/30 hover:bg-[#3D0808]/5"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110">
          <Icon icon="solar:add-circle-bold-duotone" className="h-8 w-8 text-[#3D0808]" />
        </div>
        <h3 className="font-display text-lg font-bold text-[#343434]">Add Configuration</h3>
        <p className="mt-1 text-sm text-[#625f5f]">Define a new fund for current and future organization collections.</p>
      </button>
    </div>
  );
}
