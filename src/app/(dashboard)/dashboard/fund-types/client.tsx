"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFundTypes, FundType } from "@/lib/api/fund-types";
import { Icon } from "@iconify/react";
import FundTypeGrid from "@/components/fund-types/FundTypeGrid";
import FundTypeSummaryTable from "@/components/fund-types/FundTypeSummaryTable";
import FundTypeDialog from "@/components/fund-types/FundTypeDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function FundTypesClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<FundType | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["fund-types"],
    queryFn: getFundTypes,
  });

  const handleCreate = () => {
    setEditingFund(null);
    setDialogOpen(true);
  };

  const handleEdit = (fund: FundType) => {
    setEditingFund(fund);
    setDialogOpen(true);
  };

  return (
    <div className="flex h-full flex-col font-body pb-8">
      {/* Header Area */}
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-[#343434]">Fund Configuration</h2>
        <p className="mt-1 text-sm text-[#625f5f]">
          Manage and dictate the structural definitions globally acting as the constraints behind financial inflows.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[100px] w-full rounded-2xl" />)}
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Icon icon="solar:folder-with-files-bold" className="h-6 w-6 text-blue-600" />
               </div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wide text-blue-800/70">Fund Categories</p>
                 <h3 className="font-display text-3xl font-bold text-blue-700">{data?.kpis.totalCategories}</h3>
               </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <Icon icon="solar:danger-circle-bold" className="h-6 w-6 text-red-600" />
               </div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wide text-red-800/70">Required Per Semester</p>
                 <h3 className="font-display text-3xl font-bold text-red-700">
                   ₱{data?.kpis.requiredPerSemesterTotal.toLocaleString()}
                 </h3>
               </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Icon icon="solar:calendar-date-bold" className="h-6 w-6 text-amber-600" />
               </div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wide text-amber-800/70">Installment-Enabled</p>
                 <h3 className="font-display text-3xl font-bold text-amber-700">{data?.kpis.installmentEnabledCount}</h3>
               </div>
            </div>
          </>
        )}
      </div>

      {/* Grid Flow */}
      {isLoading ? (
        <div className="space-y-6">
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
             {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[230px] w-full rounded-2xl" />)}
           </div>
           <Skeleton className="h-[150px] w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <FundTypeGrid 
             fundTypes={data?.fundTypes || []} 
             onEdit={handleEdit} 
             onCreate={handleCreate} 
          />
          <FundTypeSummaryTable fundTypes={data?.fundTypes || []} />
        </>
      )}

      {/* Shared Dialog Editor */}
      <FundTypeDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        presetData={editingFund} 
      />
    </div>
  );
}
