"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  downloadMembersPdf,
  exportMembersCsv,
  exportMembersExcel,
  getMembers,
  openMembersPrintReport,
  type MemberReportFilterStatus,
} from "@/lib/api/members";
import { getSections } from "@/lib/api/sections";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import MembersTable from "@/components/members/MembersTable";
import AddMemberDialog from "@/components/members/AddMemberDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function MembersClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<MemberReportFilterStatus>("All");
  const [sectionId, setSectionId] = useState("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { data: session } = useSession();
  const orgId = session?.user?.orgId;
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredSectionId = useDeferredValue(sectionId);

  const { data: sections = [] } = useQuery({
    queryKey: ["sections", orgId],
    queryFn: () => getSections(orgId as string),
    enabled: !!orgId,
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["members", orgId, deferredSearchQuery, filter, deferredSectionId],
    queryFn: () => getMembers(orgId as string, {
      search: deferredSearchQuery,
      status: filter,
      sectionId: deferredSectionId === "ALL" ? undefined : deferredSectionId,
    }),
    enabled: !!orgId,
  });

  const filterPills: MemberReportFilterStatus[] = ["All", "Good Standing", "Has Installment Plan", "Overdue"];
  const activeFilters = {
    search: deferredSearchQuery,
    status: filter,
    sectionId: deferredSectionId === "ALL" ? undefined : deferredSectionId,
  };

  const handleExport = async () => {
    if (!orgId) return;

    setIsExporting(true);
    toast.loading("Preparing member standings export...", { id: "members-export" });

    try {
      await exportMembersCsv(orgId, activeFilters);
      toast.success("Members report downloaded.", { id: "members-export" });
    } catch {
      toast.error("Unable to export the members report.", { id: "members-export" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!orgId) return;

    setIsExportingExcel(true);
    toast.loading("Building Excel workbook...", { id: "members-export-xlsx" });

    try {
      await exportMembersExcel(orgId, activeFilters);
      toast.success("Excel workbook downloaded.", { id: "members-export-xlsx" });
    } catch {
      toast.error("Unable to export the Excel workbook.", { id: "members-export-xlsx" });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    if (!orgId) return;

    setIsExportingPdf(true);
    toast.loading("Rendering PDF report...", { id: "members-export-pdf" });

    try {
      await downloadMembersPdf(orgId, activeFilters);
      toast.success("PDF report downloaded.", { id: "members-export-pdf" });
    } catch {
      toast.error("Unable to export the PDF report.", { id: "members-export-pdf" });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    openMembersPrintReport(activeFilters);
  };

  return (
    <div className="flex h-full flex-col pb-8 font-body print:pb-0">
      {/* Header Area */}
      <div className="mb-8 flex flex-col justify-between gap-4 print:hidden md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#343434]">Members Directory</h2>
          <p className="mt-1 text-sm text-[#625f5f]">
            Track students, installment standing, overdue balances, and recent payments in one place.
          </p>
        </div>
        
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6]"
          >
            <Icon icon="solar:printer-bold" className="h-5 w-5 text-[#3D0808] transition-transform group-hover:-translate-y-0.5" />
            Print report
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf || !orgId}
            className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingPdf ? (
              <Icon icon="solar:spinner-bold" className="h-5 w-5 animate-spin text-[#3D0808]" />
            ) : (
              <Icon icon="solar:file-download-bold" className="h-5 w-5 text-[#3D0808] transition-transform group-hover:-translate-y-0.5" />
            )}
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !orgId}
            className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? (
              <Icon icon="solar:spinner-bold" className="h-5 w-5 animate-spin text-[#3D0808]" />
            ) : (
              <Icon icon="solar:download-bold" className="h-5 w-5 text-[#3D0808] transition-transform group-hover:-translate-y-0.5" />
            )}
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || !orgId}
            className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingExcel ? (
              <Icon icon="solar:spinner-bold" className="h-5 w-5 animate-spin text-[#3D0808]" />
            ) : (
              <Icon icon="solar:document-text-bold" className="h-5 w-5 text-[#3D0808] transition-transform group-hover:-translate-y-0.5" />
            )}
            Export Excel
          </button>
          <AddMemberDialog />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon icon="solar:magnifer-bold" className="h-5 w-5 text-[#625f5f]/50" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-[#F0ECEC] bg-white p-2.5 pl-10 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
            placeholder="Search by name, email, role, or year level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
          <select
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            className="h-11 rounded-xl border border-[#F0ECEC] bg-white px-3 text-sm font-medium text-[#343434] outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
          >
            <option value="ALL">All Sections</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filterPills.map((pill) => (
            <button
              key={pill}
              onClick={() => setFilter(pill)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
                filter === pill
                  ? "bg-[#343434] text-white shadow-sm"
                  : "bg-white border border-[#F0ECEC] text-[#625f5f] hover:bg-[#F9F7F6]"
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      {isLoading ? (
        <div className="rounded-2xl border border-[#F0ECEC] bg-white p-6 shadow-sm print:hidden">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : (
        <MembersTable members={members || []} />
      )}
    </div>
  );
}
