"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInstallmentPlan, getInstallmentOptions } from "@/lib/api/installments";
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

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

const planSchema = z.object({
  memberId: z.string().min(1, "Select a member"),
  fundTypeId: z.string().min(1, "Select a fund type"),
  totalAmount: z.number().positive("Must be greater than 0"),
  numberOfInstallments: z.number().min(2).max(12),
  period: z.string().min(3, "Required"),
  dueDates: z.array(z.string().min(1, "Date required")).min(2),
});

type FormValues = z.infer<typeof planSchema>;

interface AddInstallmentDialogProps {
  orgId: string;
}

export default function AddInstallmentDialog({ orgId }: AddInstallmentDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: options } = useQuery({
    queryKey: ["installment-options", orgId],
    queryFn: () => getInstallmentOptions(orgId),
    enabled: open && Boolean(orgId),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      memberId: "",
      fundTypeId: "",
      totalAmount: 0,
      numberOfInstallments: 2,
      period: "Current Semester",
      dueDates: ["", ""],
    },
  });

  const numberOfInstallments = watch("numberOfInstallments");
  const selectedFundTypeId = watch("fundTypeId");
  const selectedFundType = useMemo(
    () => options?.funds.find((fund) => fund.id === selectedFundTypeId),
    [options?.funds, selectedFundTypeId]
  );

  useEffect(() => {
    if (!selectedFundType) return;
    setValue("totalAmount", selectedFundType.defaultAmount);
  }, [selectedFundType, setValue]);

  useEffect(() => {
    const currentDates = watch("dueDates") || [];
    const nextDates = [...currentDates];

    if (nextDates.length < numberOfInstallments) {
      while (nextDates.length < numberOfInstallments) {
        nextDates.push("");
      }
    } else if (nextDates.length > numberOfInstallments) {
      nextDates.length = numberOfInstallments;
    }

    setValue("dueDates", nextDates);
  }, [numberOfInstallments, setValue, watch]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => createInstallmentPlan({ ...data, orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments", orgId] });
      toast.success("Installment plan created.");
      setOpen(false);
      reset();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create plan."),
  });

  const inputClass =
    "flex h-10 w-full rounded-lg border border-[#F0ECEC] bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={!orgId}
        className="flex items-center gap-2 rounded-lg bg-[#a12124] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#8a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon icon="solar:folder-error-bold" className="h-5 w-5" />
        Create Plan
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white font-body sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[#343434]">Create Installment Plan</DialogTitle>
          <DialogDescription className="text-[#625f5f]">
            Split an active fund into scheduled due dates for a specific student.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
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
                    {fund.name} ({currencyFormatter.format(fund.defaultAmount)})
                  </option>
                ))}
              </select>
              {errors.fundTypeId ? <span className="text-[10px] text-red-500">{errors.fundTypeId.message}</span> : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Total (PHP)</label>
              <input type="number" {...register("totalAmount", { valueAsNumber: true })} className={inputClass} />
              {errors.totalAmount ? <span className="text-[10px] text-red-500">{errors.totalAmount.message}</span> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Installments</label>
              <select {...register("numberOfInstallments", { valueAsNumber: true })} className={inputClass}>
                {[2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>
                    {value} Payments
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Period Label</label>
              <input {...register("period")} className={inputClass} />
              {errors.period ? <span className="text-[10px] text-red-500">{errors.period.message}</span> : null}
            </div>
          </div>

          <div className="rounded-xl border border-[#F0ECEC] bg-[#F9F7F6] p-4">
            <h4 className="mb-3 border-b border-[#F0ECEC] pb-2 text-sm font-bold text-[#343434]">Schedule Due Dates</h4>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(numberOfInstallments || 2)].map((_, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-[#625f5f]">Payment #{index + 1}</label>
                  <input type="date" {...register(`dueDates.${index}`)} className={inputClass} />
                  {errors.dueDates?.[index] ? (
                    <span className="text-[10px] text-red-500">{errors.dueDates[index]?.message}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4 border-t border-[#F0ECEC] pt-4">
            <DialogClose className="rounded-lg border border-[#F0ECEC] px-4 py-2 text-sm font-bold text-[#625f5f] hover:bg-[#F9F7F6]">
              Cancel
            </DialogClose>
            <button
              type="submit"
              disabled={mutation.isPending || !orgId}
              className="rounded-lg bg-[#a12124] px-4 py-2 text-sm font-bold text-white hover:bg-[#8a1c1e] disabled:opacity-50"
            >
              {mutation.isPending ? "Creating..." : "Create Plan"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
