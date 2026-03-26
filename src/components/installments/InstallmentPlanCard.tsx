"use client";

import { useState } from "react";
import { InstallmentPlan, payInstallment } from "@/lib/api/installments";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export default function InstallmentPlanCard({ plan }: { plan: InstallmentPlan }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const canManage = session?.user?.role === "OFFICER" && session.user.officerAccessRole !== "PRESIDENT";
  const [selectedEntry, setSelectedEntry] = useState<{
    id: string;
    amount: number;
    date: string;
    no: number;
  } | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  const payMutation = useMutation({
    mutationFn: (entryId: string) => payInstallment(plan.id, entryId, { paidAt: paymentDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Installment marked as paid.");
      setSelectedEntry(null);
      setPaymentDate(new Date().toISOString().split("T")[0]);
    },
    onError: () => toast.error("Failed to process payment."),
  });

  const progressPercent = Math.round((plan.installmentsPaid / plan.totalInstallments) * 100);

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm transition-all hover:shadow-md">
        <div className="border-b border-[#F0ECEC] bg-[#F9F7F6]/50 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3D0808]/10">
              <span className="font-display font-bold text-[#3D0808]">{plan.memberInitials}</span>
            </div>
            <div>
              <p className="font-display text-base font-bold text-[#343434]">{plan.memberName}</p>
              <p className="text-[11px] font-medium text-[#625f5f]">{plan.yearLevel}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#625f5f]/70">{plan.fundTypeName}</p>
              <p className="text-[13px] font-medium text-[#343434]">{plan.period}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold text-[#a12124]">
                {currencyFormatter.format(plan.totalAmount)}
              </p>
              <p className="text-[10px] font-bold uppercase text-[#625f5f]/50">Total</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#343434]">
                {plan.installmentsPaid} of {plan.totalInstallments} paid
              </span>
              <span className="text-emerald-600">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0ECEC]">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col p-2">
          {plan.entries.map((entry) => (
            <div key={entry.id} className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-[#F9F7F6]">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F0ECEC] text-[10px] font-bold text-[#625f5f]">
                  #{entry.installmentNo}
                </span>
                <div>
                  <p className="text-[13px] font-bold text-[#343434]">{currencyFormatter.format(entry.amountDue)}</p>
                  <p className="text-[10px] text-[#625f5f]">Due {format(new Date(entry.dueDate), "MMM d, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    entry.status === "PAID"
                      ? "bg-emerald-100 text-emerald-700"
                      : entry.status === "OVERDUE"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {entry.status}
                </span>

                {entry.status !== "PAID" && canManage ? (
                  <button
                    onClick={() =>
                      setSelectedEntry({
                        id: entry.id,
                        amount: entry.amountDue,
                        date: entry.dueDate,
                        no: entry.installmentNo,
                      })
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#a12124]/10 text-[#a12124] opacity-0 transition-all hover:bg-[#a12124]/20 group-hover:opacity-100"
                    title="Mark as paid"
                  >
                    <Icon icon="solar:check-square-bold" className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="border border-[#F0ECEC] bg-white font-body sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-[#343434]">Confirm Payment</DialogTitle>
            <DialogDescription className="pt-2 text-[#625f5f]">
              Are you sure you want to mark Installment #{selectedEntry?.no} for {plan.memberName} as paid?
            </DialogDescription>
          </DialogHeader>

          {selectedEntry ? (
            <div className="my-2 rounded-xl border border-[#F0ECEC] bg-[#F9F7F6] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#625f5f]">Amount Collected</span>
                <span className="font-display text-lg font-bold text-emerald-600">
                  {currencyFormatter.format(selectedEntry.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#625f5f]">Original Due Date</span>
                <span className="text-xs font-bold text-[#343434]">
                  {format(new Date(selectedEntry.date), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#625f5f]">Actual Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="flex h-10 w-full rounded-lg border border-[#F0ECEC] bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <DialogClose className="rounded-lg border border-[#F0ECEC] px-4 py-2 text-sm font-bold text-[#625f5f] transition-colors hover:bg-[#F9F7F6]">
              Cancel
            </DialogClose>
            <button
              onClick={() => selectedEntry && payMutation.mutate(selectedEntry.id)}
              disabled={payMutation.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {payMutation.isPending ? "Processing..." : "Confirm Collection"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
