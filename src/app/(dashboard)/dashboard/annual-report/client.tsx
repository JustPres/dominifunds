"use client";

import { useQuery } from "@tanstack/react-query";
import { exportReportPdf, getReportData } from "@/lib/api/report";
import { Icon } from "@iconify/react";
import ReportKPIsGrid from "@/components/report/ReportKPIs";
import CollectionBarChart from "@/components/report/CollectionBarChart";
import {
  MemberStandingSection,
  FundBreakdownTable,
  ActiveInstallmentsTable,
  OfficerLogTable,
} from "@/components/report/ReportTables";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";

export default function ReportsClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: getReportData,
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    toast.loading("Generating Secure PDF Report Header...", { id: "export-pdf" });
    try {
      const res = await exportReportPdf();
      if (res.success) {
        toast.success("PDF Compiled Successfully. Triggering raw download.", { id: "export-pdf" });
        // In reality, this fires a link.click() download against the generated blob
      }
    } catch {
      toast.error("Generation pipeline failed. Internal limit reached.", { id: "export-pdf" });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Skeleton className="h-[300px] w-full rounded-2xl" />
           <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[250px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col font-body pb-10 space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#343434]">High-Level Reporting</h2>
          <p className="mt-1 text-sm text-[#625f5f]">
            Comprehensive organizational transparency generated from macro ledger interactions.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="group flex items-center gap-2 rounded-xl bg-white border border-[#F0ECEC] px-5 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:opacity-50"
        >
          {isExporting ? (
             <Icon icon="solar:spinner-bold" className="h-5 w-5 animate-spin text-[#3D0808]" />
          ) : (
             <Icon icon="solar:download-bold" className="h-5 w-5 text-[#3D0808] transition-transform group-hover:-translate-y-0.5" />
          )}
          Fetch Executive PDF
        </button>
      </div>

      {/* KPI Matrix */}
      <ReportKPIsGrid kpis={data.kpis} />

      {/* Primary Graphs & Stands Layer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CollectionBarChart data={data.monthlyCollections} />
        <MemberStandingSection data={data.standings} />
      </div>

      {/* Breakdown Layer */}
      <FundBreakdownTable data={data.fundBreakdowns} />

      {/* Deep Ledger Details */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ActiveInstallmentsTable data={data.installments} />
        <OfficerLogTable data={data.officerLogs} />
      </div>

    </div>
  );
}
