"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFundType, updateFundType, type FundType } from "@/lib/api/fund-types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

const fundSchema = z.object({
  name: z.string().min(2, "Name required"),
  amount: z.number().positive("Must be > 0"),
  frequency: z.enum(["MONTHLY", "PER_SEMESTER", "ANNUAL", "PER_EVENT"]),
  description: z.string().min(5, "Description is too short"),
  required: z.boolean(),
  allowInstallment: z.boolean(),
  maxInstallments: z.number().nullable().optional(),
}).refine((data) => {
  if (data.allowInstallment) return data.maxInstallments !== null && data.maxInstallments > 1;
  return true;
}, {
  message: "Required if installments are allowed",
  path: ["maxInstallments"],
});

type FormValues = z.infer<typeof fundSchema>;

interface FundTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  presetData?: FundType | null;
}

export default function FundTypeDialog({
  open,
  onOpenChange,
  orgId,
  presetData,
}: FundTypeDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(presetData);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      name: "",
      amount: 0,
      frequency: "PER_SEMESTER",
      description: "",
      required: true,
      allowInstallment: false,
      maxInstallments: null,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (presetData) {
      reset({
        name: presetData.name,
        amount: presetData.amount,
        frequency: presetData.frequency,
        description: presetData.description,
        required: presetData.required,
        allowInstallment: presetData.allowInstallment,
        maxInstallments: presetData.maxInstallments || null,
      });
      return;
    }

    reset({
      name: "",
      amount: 0,
      frequency: "PER_SEMESTER",
      description: "",
      required: true,
      allowInstallment: false,
      maxInstallments: null,
    });
  }, [open, presetData, reset]);

  const allowsInstallment = watch("allowInstallment");

  useEffect(() => {
    if (!allowsInstallment) {
      setValue("maxInstallments", null);
      return;
    }

    if (!watch("maxInstallments")) {
      setValue("maxInstallments", 2);
    }
  }, [allowsInstallment, setValue, watch]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      isEditing ? updateFundType(orgId, presetData!.id, data) : createFundType(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-types", orgId] });
      toast.success(isEditing ? "Fund configuration updated." : "Fund policy created.");
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to commit changes."),
  });

  const inputClass = "flex w-full rounded-lg border border-[#F0ECEC] bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[#3D0808] focus:ring-1 focus:ring-[#3D0808]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border border-[#F0ECEC] bg-white font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[#343434]">
            {isEditing ? "Edit Fund Definition" : "Create Fund Policy"}
          </DialogTitle>
          <DialogDescription className="text-[#625f5f]">
            Define the amount, frequency, and installment rules officers can use for this organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">Fund Name</label>
            <input {...register("name")} className={inputClass} placeholder="e.g. Annual IT Fund" />
            {errors.name ? <span className="text-[10px] text-red-500">{errors.name.message}</span> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Base Amount (PHP)</label>
              <input type="number" {...register("amount", { valueAsNumber: true })} className={inputClass} />
              {errors.amount ? <span className="text-[10px] text-red-500">{errors.amount.message}</span> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Billing Frequency</label>
              <select {...register("frequency")} className={inputClass}>
                <option value="MONTHLY">Monthly Segment</option>
                <option value="PER_SEMESTER">Per Semester</option>
                <option value="ANNUAL">Annual Flat</option>
                <option value="PER_EVENT">Per Defined Event</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">Policy Description</label>
            <textarea
              {...register("description")}
              className={`${inputClass} min-h-[80px]`}
              placeholder="Describe what this fund covers and who it applies to."
            />
            {errors.description ? <span className="text-[10px] text-red-500">{errors.description.message}</span> : null}
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-[#F0ECEC] bg-[#F9F7F6] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-[#343434]">Universally Required</h4>
                <p className="text-[10px] text-[#625f5f]">Should all active members be expected to pay this fund?</p>
              </div>
              <input type="checkbox" {...register("required")} className="h-5 w-5 rounded border-[#F0ECEC] accent-[#3D0808]" />
            </div>

            <div className="h-px w-full bg-[#F0ECEC]" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-[#343434]">Allow Installments</h4>
                <p className="text-[10px] text-[#625f5f]">Allow officers to split this fund into scheduled installment plans.</p>
              </div>
              <input type="checkbox" {...register("allowInstallment")} className="h-5 w-5 rounded border-[#F0ECEC] accent-[#3D0808]" />
            </div>

            {allowsInstallment ? (
              <div className="mt-1 flex items-center justify-between border-t border-dashed border-[#F0ECEC] pt-2">
                <h4 className="text-[13px] font-bold text-[#343434]">Max Installment Segments</h4>
                <div className="flex items-center gap-2">
                  <select
                    {...register("maxInstallments", { valueAsNumber: true })}
                    className="w-32 rounded-lg border border-[#F0ECEC] bg-white px-3 py-1.5 text-xs font-bold text-[#343434] outline-none"
                  >
                    <option value={2}>2 Payments</option>
                    <option value={3}>3 Payments</option>
                    <option value={4}>4 Payments</option>
                  </select>
                  {errors.maxInstallments ? (
                    <span className="text-[10px] text-red-500">{errors.maxInstallments.message}</span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <DialogClose className="rounded-lg border border-[#F0ECEC] bg-white px-4 py-2 text-sm font-bold text-[#625f5f] hover:bg-[#F9F7F6]">
              Cancel
            </DialogClose>
            <button
              type="submit"
              disabled={mutation.isPending || !orgId}
              className="flex items-center gap-2 rounded-lg bg-[#3D0808] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon icon="solar:diskette-bold" className="h-4 w-4" />
              {mutation.isPending ? "Saving..." : isEditing ? "Save Configuration" : "Create Fund"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
