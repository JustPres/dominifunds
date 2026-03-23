import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInstallmentPlan, getInstallmentOptions } from "@/lib/api/installments";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

const planSchema = z.object({
  memberId: z.string().min(1, "Select a member"),
  fundTypeId: z.string().min(1, "Select a fund type"),
  totalAmount: z.number().positive("Must be > 0"),
  numberOfInstallments: z.number().min(2).max(12),
  period: z.string().min(3, "Required"),
  dueDates: z.array(z.string().min(1, "Date required")).min(2),
});

type FormValues = z.infer<typeof planSchema>;

export default function AddInstallmentDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: options } = useQuery({
    queryKey: ["installment-options"],
    queryFn: getInstallmentOptions,
    enabled: open, 
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
      period: "1st Sem 2026-2027",
      dueDates: ["", ""],
    },
  });

  const numInstallments = watch("numberOfInstallments");
  const selectedFundTypeId = watch("fundTypeId");

  // Auto-fill total amount
  useEffect(() => {
    if (selectedFundTypeId && options) {
      const fund = options.funds.find(f => f.id === selectedFundTypeId);
      if (fund) setValue("totalAmount", fund.defaultAmount);
    }
  }, [selectedFundTypeId, options, setValue]);

  // Dynamically sync dueDates array size
  useEffect(() => {
    const currentDates = watch("dueDates") || [];
    const newDates = [...currentDates];
    
    if (newDates.length < numInstallments) {
      while (newDates.length < numInstallments) newDates.push("");
    } else if (newDates.length > numInstallments) {
      newDates.length = numInstallments;
    }
    
    setValue("dueDates", newDates);
  }, [numInstallments, setValue, watch]);

  const mutation = useMutation({
    mutationFn: createInstallmentPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      toast.success("Installment plan created!");
      setOpen(false);
      reset();
    },
    onError: () => toast.error("Failed to create plan."),
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  const inputClass = "flex h-10 w-full rounded-lg border border-[#F0ECEC] bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 rounded-lg bg-[#a12124] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#8a1c1e]">
        <Icon icon="solar:folder-error-bold" className="h-5 w-5" />
        Create Plan
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] font-body bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[#343434]">Create Installment Plan</DialogTitle>
          <DialogDescription className="text-[#625f5f]">
            Setup a tracking plan breaking down a specific fund requirement across multiple scheduled sub-payments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Member</label>
              <select {...register("memberId")} className={inputClass}>
                <option value="">-- Choose Member --</option>
                {options?.members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {errors.memberId && <span className="text-[10px] text-red-500">{errors.memberId.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Fund Type</label>
              <select {...register("fundTypeId")} className={inputClass}>
                <option value="">-- Choose Fund --</option>
                {options?.funds.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} (₱{f.defaultAmount})</option>
                ))}
              </select>
              {errors.fundTypeId && <span className="text-[10px] text-red-500">{errors.fundTypeId.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Total (₱)</label>
              <input type="number" {...register("totalAmount", { valueAsNumber: true })} className={inputClass} />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Installments</label>
              <select {...register("numberOfInstallments", { valueAsNumber: true })} className={inputClass}>
                {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} Payments</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Period String</label>
              <input {...register("period")} className={inputClass} />
            </div>
          </div>

          {/* Dynamic Due Dates Section */}
          <div className="rounded-xl border border-[#F0ECEC] bg-[#F9F7F6] p-4 mt-2">
             <h4 className="text-sm font-bold text-[#343434] mb-3 border-b border-[#F0ECEC] pb-2">Schedule Due Dates</h4>
             <div className="grid grid-cols-2 gap-3">
               {[...Array(numInstallments || 2)].map((_, i) => (
                 <div key={i} className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#625f5f] uppercase">Payment #{i + 1}</label>
                    <input type="date" {...register(`dueDates.${i}`)} className={inputClass} />
                    {errors.dueDates?.[i] && <span className="text-[10px] text-red-500">{errors.dueDates[i]?.message}</span>}
                 </div>
               ))}
             </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-[#F0ECEC]">
            <DialogClose className="rounded-lg border border-[#F0ECEC] px-4 py-2 text-sm font-bold text-[#625f5f] hover:bg-[#F9F7F6]">
              Cancel
            </DialogClose>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-[#a12124] px-4 py-2 text-sm font-bold text-white hover:bg-[#8a1c1e] disabled:opacity-50"
            >
              {mutation.isPending ? "Configuring..." : "Commit Plan"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
