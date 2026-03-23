"use client";

import { FundType, deleteFundType } from "@/lib/api/fund-types";
import { Icon } from "@iconify/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FundTypeGridProps {
  fundTypes: FundType[];
  onEdit: (fund: FundType) => void;
  onCreate: () => void;
}

export default function FundTypeGrid({ fundTypes, onEdit, onCreate }: FundTypeGridProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteFundType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-types"] });
      toast.success("Fund configuration deleted permanently.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to locate safe deletion lock.");
    }
  });

  const getIcon = (freq: string) => {
    switch(freq) {
      case "MONTHLY": return "solar:calendar-minimalistic-bold";
      case "PER_SEMESTER": return "solar:notebook-bold";
      case "ANNUAL": return "solar:star-bold";
      case "PER_EVENT": return "solar:ticket-bold";
      default: return "solar:box-bold";
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {fundTypes.map((ft) => (
        <div key={ft.id} className="group relative flex flex-col rounded-2xl border border-[#F0ECEC] bg-white p-5 shadow-sm transition-all hover:shadow-md">
          {/* Top Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 transition-colors group-hover:bg-[#3D0808]/10 group-hover:text-[#3D0808]">
                 <Icon icon={getIcon(ft.frequency)} className="h-6 w-6" />
               </div>
               <div>
                 <h3 className="font-display text-lg font-bold text-[#343434]">{ft.name}</h3>
                 <div className="mt-1 flex flex-wrap gap-2">
                   <span className="inline-flex items-center rounded-full bg-[#F9F7F6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#625f5f]">
                     {ft.frequency.replace("_", " ")}
                   </span>
                   {ft.required ? (
                     <span className="inline-flex items-center rounded-full bg-[#3D0808]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3D0808]">
                       REQUIRED
                     </span>
                   ) : (
                     <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                       OPTIONAL
                     </span>
                   )}
                 </div>
               </div>
            </div>
            
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-[#a12124]">
                ₱{ft.amount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="my-5 h-px w-full bg-[#F0ECEC]" />

          <p className="flex-1 text-[13px] leading-relaxed text-[#625f5f] mb-4">
            {ft.description}
          </p>

          {/* Configuration Footer */}
          <div className="flex items-center gap-4 rounded-xl bg-[#F9F7F6]/60 p-3 pt-3 mt-auto">
             <div className="flex items-center gap-2">
               {ft.allowInstallment ? (
                 <>
                   <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-emerald-500" />
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold uppercase text-[#343434]">Installments Active</span>
                     <span className="text-[10px] text-[#625f5f]">Max splits: {ft.maxInstallments}</span>
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
                 onClick={() => onEdit(ft)}
                 className="flex h-8 w-8 items-center justify-center rounded border border-[#F0ECEC] bg-white text-[#343434] transition-colors hover:bg-slate-50"
                 title="Edit Settings"
               >
                 <Icon icon="solar:pen-bold" className="h-4 w-4" />
               </button>
               <button 
                 onClick={() => {
                   if (window.confirm("Are you sure you want to attempt removing this baseline config? Any tied transaction bindings will hard-reject this call.")) {
                     deleteMutation.mutate(ft.id);
                   }
                 }}
                 disabled={deleteMutation.isPending}
                 className="flex h-8 w-8 items-center justify-center rounded border border-red-100 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                 title="Attempt Removal"
               >
                 <Icon icon="solar:trash-bin-trash-bold" className="h-4 w-4" />
               </button>
             </div>
          </div>
        </div>
      ))}

      {/* Add New Interactive Card */}
      <button 
        onClick={onCreate}
        className="group flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#F0ECEC] bg-[#F9F7F6]/50 p-6 text-center transition-all hover:border-[#3D0808]/30 hover:bg-[#3D0808]/5"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110">
          <Icon icon="solar:add-circle-bold-duotone" className="h-8 w-8 text-[#3D0808]" />
        </div>
        <h3 className="font-display text-lg font-bold text-[#343434]">Add Configuration</h3>
        <p className="mt-1 text-sm text-[#625f5f]">Define new structural constraints tracking dynamic incoming funds globally.</p>
      </button>
    </div>
  );
}
