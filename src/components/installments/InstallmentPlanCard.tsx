import { useState } from "react";
import { InstallmentPlan } from "@/lib/api/installments";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payInstallment } from "@/lib/api/installments";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export default function InstallmentPlanCard({ plan }: { plan: InstallmentPlan }) {
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState<{ id: string; amount: number; date: string; no: number } | null>(null);

  const payMutation = useMutation({
    mutationFn: (entryId: string) => payInstallment(plan.id, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      toast.success("Installment marked as paid!");
      setSelectedEntry(null);
    },
    onError: () => toast.error("Failed to process payment."),
  });

  const progressPercent = Math.round((plan.installmentsPaid / plan.totalInstallments) * 100);

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm transition-all hover:shadow-md">
        {/* Header Segment */}
        <div className="border-b border-[#F0ECEC] bg-[#F9F7F6]/50 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3D0808]/10">
              <span className="font-display font-bold text-[#3D0808]">{plan.memberInitials}</span>
            </div>
            <div>
              <p className="font-display text-base font-bold text-[#343434]">{plan.memberName}</p>
              <p className="text-[11px] font-medium text-[#625f5f]">{plan.yearLevel} Year</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#625f5f]/70">{plan.fundTypeName}</p>
              <p className="text-[13px] font-medium text-[#343434]">{plan.period}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold text-[#a12124]">
                ₱{plan.totalAmount.toLocaleString()}
              </p>
              <p className="text-[10px] uppercase font-bold text-[#625f5f]/50">Total</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#343434]">{plan.installmentsPaid} of {plan.totalInstallments} paid</span>
              <span className="text-emerald-600">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0ECEC]">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Entries List */}
        <div className="flex flex-col p-2">
          {plan.entries.map((entry) => (
            <div key={entry.id} className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-[#F9F7F6]">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F0ECEC] text-[10px] font-bold text-[#625f5f]">
                  #{entry.installmentNo}
                </span>
                <div>
                  <p className="text-[13px] font-bold text-[#343434]">₱{entry.amountDue.toLocaleString()}</p>
                  <p className="text-[10px] text-[#625f5f]">Due {format(new Date(entry.dueDate), "MMM d, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  entry.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                  entry.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {entry.status}
                </span>

                {entry.status !== "PAID" && (
                  <button 
                    onClick={() => setSelectedEntry({ id: entry.id, amount: entry.amountDue, date: entry.dueDate, no: entry.installmentNo })}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#a12124]/10 text-[#a12124] opacity-0 transition-all hover:bg-[#a12124]/20 group-hover:opacity-100"
                    title="Mark as Paid"
                  >
                    <Icon icon="solar:check-square-bold" className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-[400px] font-body bg-white border border-[#F0ECEC]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-[#343434]">Confirm Payment</DialogTitle>
            <DialogDescription className="text-[#625f5f] pt-2">
              Are you sure you want to mark Installment #{selectedEntry?.no} for {plan.memberName} as Paid?
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="rounded-xl bg-[#F9F7F6] p-4 my-2 border border-[#F0ECEC]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-[#625f5f]">Amount Collected</span>
                <span className="font-display font-bold text-lg text-emerald-600">₱{selectedEntry.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#625f5f]">Original Due Date</span>
                <span className="text-xs font-bold text-[#343434]">{format(new Date(selectedEntry.date), "MMMM d, yyyy")}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
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
