"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecordOptions, recordFullPayment } from "@/lib/api/transactions";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";

const paymentSchema = z.object({
  memberId: z.string().min(1, "Select a member"),
  fundTypeId: z.string().min(1, "Select a fund type"),
  amount: z.number().positive("Must be greater than 0"),
  paidAt: z.string().min(1, "Payment date required"),
  dueDate: z.string().optional(),
  status: z.enum(["PAID", "PENDING"]),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof paymentSchema>;

export default function RecordPaymentDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const orgId = session?.user?.orgId;
  const canManage = session?.user?.role === "OFFICER" && session.user.officerAccessRole !== "PRESIDENT";

  const { data: options } = useQuery({
    queryKey: ["record-options", orgId],
    queryFn: () => getRecordOptions(orgId as string),
    enabled: open && !!orgId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      memberId: "",
      fundTypeId: "",
      amount: 0,
      paidAt: new Date().toISOString().split("T")[0],
      dueDate: "",
      status: "PAID",
      note: "",
    },
  });

  const mutation = useMutation({
    mutationFn: recordFullPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", orgId] });
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Full payment recorded.");
      setOpen(false);
      reset();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to record payment."),
  });

  const inputClass =
    "flex h-10 w-full rounded-lg border border-[#F0ECEC] bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={!orgId || !canManage}
        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon icon="solar:cash-out-bold" className="h-5 w-5" />
        Record Full Payment
      </DialogTrigger>

      <DialogContent className="border border-[#F0ECEC] bg-white font-body sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[#343434]">Record Full Payment</DialogTitle>
          <DialogDescription className="text-[#625f5f]">
            Record a direct fund payment for a student in your organization ledger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">Member</label>
            <select {...register("memberId")} className={inputClass}>
              <option value="">-- Choose Member --</option>
              {options?.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            {errors.memberId ? <span className="text-[10px] text-red-500">{errors.memberId.message}</span> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">Fund Type</label>
            <select {...register("fundTypeId")} className={inputClass}>
              <option value="">-- Choose Fund --</option>
              {options?.funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name}
                </option>
              ))}
            </select>
            {errors.fundTypeId ? <span className="text-[10px] text-red-500">{errors.fundTypeId.message}</span> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Exact Amount (PHP)</label>
              <input type="number" {...register("amount", { valueAsNumber: true })} className={inputClass} />
              {errors.amount ? <span className="text-[10px] text-red-500">{errors.amount.message}</span> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Payment Date</label>
              <input type="date" {...register("paidAt")} className={inputClass} />
              {errors.paidAt ? <span className="text-[10px] text-red-500">{errors.paidAt.message}</span> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Initial Status</label>
              <select {...register("status")} className={inputClass}>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Scheduled Due Date</label>
              <input type="date" {...register("dueDate")} className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">Note (Optional)</label>
            <input {...register("note")} className={inputClass} placeholder="e.g. Collected during Saturday run" />
          </div>

          <DialogFooter className="mt-6 gap-3 border-t border-[#F0ECEC] pt-6 sm:justify-end">
            <DialogClose className="rounded-lg border border-[#F0ECEC] bg-white px-4 py-2 text-sm font-bold text-[#625f5f] hover:bg-[#F9F7F6]">
              Cancel
            </DialogClose>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
              {mutation.isPending ? "Recording..." : "Record Payment"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
