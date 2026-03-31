"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  archiveMember,
  bulkAssignDraftsSection,
  bulkAssignMembersSection,
  bulkUpdateMembersLifecycle,
  downloadMembersPdf,
  exportMembersCsv,
  exportMembersExcel,
  getMemberImportDrafts,
  getMembers,
  openMembersPrintReport,
  restoreMember,
  type Member,
  type MemberReportFilterStatus,
} from "@/lib/api/members";
import { getSections } from "@/lib/api/sections";
import type { UserDirectoryView } from "@/lib/user-lifecycle";
import MembersTable from "@/components/members/MembersTable";
import AddMemberDialog from "@/components/members/AddMemberDialog";
import ImportMembersDialog from "@/components/members/ImportMembersDialog";
import ImportDraftsTable from "@/components/members/ImportDraftsTable";
import ManageSectionsDialog from "@/components/members/ManageSectionsDialog";
import { Skeleton } from "@/components/ui/skeleton";

type MembersWorkspaceView = UserDirectoryView | "drafts";

const FILTER_PILLS: MemberReportFilterStatus[] = ["All", "Good Standing", "Has Installment Plan", "Overdue"];

export default function MembersClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<MemberReportFilterStatus>("All");
  const [sectionId, setSectionId] = useState("ALL");
  const [view, setView] = useState<MembersWorkspaceView>("active");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [bulkSectionId, setBulkSectionId] = useState("UNCHANGED");
  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);
  const [hasHandledAuthFailure, setHasHandledAuthFailure] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const orgId = session?.user?.orgId;
  const canManage = session?.user?.role === "OFFICER" && session.user.officerAccessRole !== "PRESIDENT";
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredSectionId = useDeferredValue(sectionId);

  useEffect(() => {
    setSelectedMemberIds([]);
    setSelectedDraftIds([]);
    setBulkSectionId("UNCHANGED");
  }, [view, deferredSearchQuery, deferredSectionId, filter]);

  const { data: allSections = [], error: sectionsError } = useQuery<Awaited<ReturnType<typeof getSections>>, Error>({
    queryKey: ["sections", orgId, "all"],
    queryFn: () => getSections(orgId as string, { includeArchived: true }),
    enabled: !!orgId,
  });

  const activeSections = allSections.filter((section) => !section.isArchived);
  const activeFilters = {
    search: deferredSearchQuery,
    status: filter,
    sectionId: deferredSectionId === "ALL" ? undefined : deferredSectionId,
    view: view === "drafts" ? undefined : (view as UserDirectoryView),
  };

  const { data: members = [], isLoading: isMembersLoading, error: membersError } = useQuery<
    Awaited<ReturnType<typeof getMembers>>,
    Error
  >({
    queryKey: ["members", orgId, deferredSearchQuery, filter, deferredSectionId, view],
    queryFn: () =>
      getMembers(orgId as string, {
        search: deferredSearchQuery,
        status: filter,
        sectionId: deferredSectionId === "ALL" ? undefined : deferredSectionId,
        view: view === "drafts" ? undefined : (view as UserDirectoryView),
      }),
    enabled: !!orgId && view !== "drafts",
  });

  const { data: importDrafts = [], isLoading: isDraftsLoading, error: draftsError } = useQuery<
    Awaited<ReturnType<typeof getMemberImportDrafts>>,
    Error
  >({
    queryKey: ["member-import-drafts", orgId],
    queryFn: () => getMemberImportDrafts(orgId as string),
    enabled: !!orgId,
  });

  useEffect(() => {
    if (hasHandledAuthFailure) {
      return;
    }

    const authError = [sectionsError, membersError, draftsError].find((error) => {
      const message = error?.message ?? "";
      return (
        message.includes("Unauthorized") ||
        message.includes("Account is inactive") ||
        message.includes("Treasurer access required")
      );
    });

    if (!authError) {
      return;
    }

    setHasHandledAuthFailure(true);
    toast.error(`${authError.message}. Sign in again.`);
    void signOut({ callbackUrl: "/login?switch=1" });
  }, [draftsError, hasHandledAuthFailure, membersError, sectionsError]);

  const filteredDrafts = importDrafts.filter((draft) => {
    const matchesSearch = deferredSearchQuery
      ? [draft.name, draft.email ?? "", draft.role, draft.yearLevel ?? "", draft.sectionName]
          .join(" ")
          .toLowerCase()
          .includes(deferredSearchQuery.toLowerCase())
      : true;
    const matchesSection =
      deferredSectionId === "ALL" ? true : draft.sectionId === deferredSectionId;

    return matchesSearch && matchesSection;
  });

  const archiveMutation = useMutation({
    mutationFn: async (member: Member) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return archiveMember(orgId, member.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Member archived. Payment history stays intact.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to archive the member.");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return restoreMember(orgId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Member restored to the active directory.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to restore the member.");
    },
  });

  const bulkLifecycleMutation = useMutation({
    mutationFn: async (payload: { memberIds: string[]; action: "archive" | "restore" }) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return bulkUpdateMembersLifecycle(orgId, payload.memberIds, payload.action);
    },
    onSuccess: (_result, payload) => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedMemberIds([]);
      toast.success(
        payload.action === "archive"
          ? "Selected members archived."
          : "Selected members restored."
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to update the selected members.");
    },
  });

  const bulkSectionMutation = useMutation({
    mutationFn: async (payload: { memberIds: string[]; sectionId: string | null }) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return bulkAssignMembersSection(orgId, payload.memberIds, payload.sectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      setSelectedMemberIds([]);
      setBulkSectionId("UNCHANGED");
      toast.success("Member sections updated.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to update member sections.");
    },
  });

  const bulkDraftSectionMutation = useMutation({
    mutationFn: async (payload: { draftIds: string[]; sectionId: string | null }) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return bulkAssignDraftsSection(orgId, payload.draftIds, payload.sectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-import-drafts", orgId] });
      setSelectedDraftIds([]);
      setBulkSectionId("UNCHANGED");
      toast.success("Draft sections updated.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to update draft sections.");
    },
  });

  const handleExport = async () => {
    if (!orgId || view === "drafts") return;

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
    if (!orgId || view === "drafts") return;

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
    if (!orgId || view === "drafts") return;

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
    if (view === "drafts") return;
    openMembersPrintReport(activeFilters);
  };

  const selectedCount = view === "drafts" ? selectedDraftIds.length : selectedMemberIds.length;
  const isLoading = view === "drafts" ? isDraftsLoading : isMembersLoading;

  return (
    <div className="flex h-full flex-col pb-8 font-body print:pb-0">
      <div className="mb-8 flex flex-col justify-between gap-4 print:hidden xl:flex-row xl:items-center">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#343434]">Members Workspace</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#625f5f]">
            Manage active members, archived records, import drafts, section assignments, and payment standing from one place.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <ImportMembersDialog orgId={orgId} canManage={canManage} />
          <ManageSectionsDialog
            orgId={orgId}
            sections={allSections}
            canManage={canManage}
            open={isManageSectionsOpen}
            onOpenChange={setIsManageSectionsOpen}
          />
          <button
            type="button"
            onClick={handlePrint}
            disabled={view === "drafts"}
            className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon icon="solar:printer-bold" className="h-5 w-5 text-[#3D0808]" />
            Print report
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf || !orgId || view === "drafts"}
            className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingPdf ? (
              <Icon icon="solar:spinner-bold" className="h-5 w-5 animate-spin text-[#3D0808]" />
            ) : (
              <Icon icon="solar:file-download-bold" className="h-5 w-5 text-[#3D0808]" />
            )}
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !orgId || view === "drafts"}
            className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? (
              <Icon icon="solar:spinner-bold" className="h-5 w-5 animate-spin text-[#3D0808]" />
            ) : (
              <Icon icon="solar:download-bold" className="h-5 w-5 text-[#3D0808]" />
            )}
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || !orgId || view === "drafts"}
            className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingExcel ? (
              <Icon icon="solar:spinner-bold" className="h-5 w-5 animate-spin text-[#3D0808]" />
            ) : (
              <Icon icon="solar:document-text-bold" className="h-5 w-5 text-[#3D0808]" />
            )}
            Export Excel
          </button>
          <AddMemberDialog
            sections={activeSections}
            canManage={canManage}
            onManageSections={() => setIsManageSectionsOpen(true)}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        {[
          { id: "active" as const, label: "Active Members", count: members.length, icon: "solar:users-group-two-rounded-bold" },
          { id: "archived" as const, label: "Archived Members", count: 0, icon: "solar:archive-bold" },
          { id: "drafts" as const, label: "Import Review", count: filteredDrafts.length, icon: "solar:file-check-bold" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              view === tab.id
                ? "bg-[#343434] text-white shadow-sm"
                : "border border-[#F0ECEC] bg-white text-[#625f5f] hover:bg-[#F9F7F6]"
            }`}
          >
            <Icon icon={tab.icon} className="h-4 w-4" />
            {tab.label}
            {tab.id === "drafts" ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                {filteredDrafts.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-4 print:hidden">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full max-w-xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Icon icon="solar:magnifer-bold" className="h-5 w-5 text-[#625f5f]/50" />
              </div>
              <input
                type="text"
                className="block w-full rounded-xl border border-[#F0ECEC] bg-white p-2.5 pl-10 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
                placeholder={
                  view === "drafts"
                    ? "Search draft rows by name, email, section, or year level..."
                    : "Search by name, email, role, or year level..."
                }
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <select
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              className="h-11 rounded-xl border border-[#F0ECEC] bg-white px-3 text-sm font-medium text-[#343434] outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
            >
              <option value="ALL">All Sections</option>
              {activeSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          {view !== "drafts" ? (
            <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1">
              {FILTER_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setFilter(pill)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
                    filter === pill
                      ? "bg-[#343434] text-white shadow-sm"
                      : "border border-[#F0ECEC] bg-white text-[#625f5f] hover:bg-[#F9F7F6]"
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedCount > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#F0ECEC] bg-[#F9F7F6] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-[#343434]">
                {selectedCount} {view === "drafts" ? "draft" : "member"}
                {selectedCount > 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-[#625f5f]">
                {view === "drafts"
                  ? "Use bulk section assignment to prepare draft rows before manual conversion."
                  : view === "archived"
                  ? "Restore archived members when they should appear in the active directory again."
                  : "Assign a section to several members at once or archive them together."}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {(view === "active" || view === "drafts") ? (
                <>
                  <select
                    value={bulkSectionId}
                    onChange={(event) => setBulkSectionId(event.target.value)}
                    className="h-10 min-w-[180px] rounded-lg border border-[#F0ECEC] bg-white px-3 text-sm font-medium text-[#343434] outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
                  >
                    <option value="UNCHANGED">Choose section</option>
                    <option value="UNASSIGNED">Unassigned</option>
                    {activeSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={
                      !canManage ||
                      bulkSectionId === "UNCHANGED" ||
                      bulkSectionMutation.isPending ||
                      bulkDraftSectionMutation.isPending
                    }
                    onClick={() => {
                      const sectionValue = bulkSectionId === "UNASSIGNED" ? null : bulkSectionId;

                      if (view === "drafts") {
                        bulkDraftSectionMutation.mutate({
                          draftIds: selectedDraftIds,
                          sectionId: sectionValue,
                        });
                        return;
                      }

                      bulkSectionMutation.mutate({
                        memberIds: selectedMemberIds,
                        sectionId: sectionValue,
                      });
                    }}
                    className="rounded-lg border border-[#E5D7D2] bg-white px-4 py-2 text-sm font-bold text-[#7C2426] hover:bg-[#FFF6F4] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Apply Section
                  </button>
                </>
              ) : null}

              {view === "active" ? (
                <button
                  type="button"
                  disabled={!canManage || bulkLifecycleMutation.isPending}
                  onClick={() =>
                    bulkLifecycleMutation.mutate({
                      memberIds: selectedMemberIds,
                      action: "archive",
                    })
                  }
                  className="rounded-lg bg-[#a12124] px-4 py-2 text-sm font-bold text-white hover:bg-[#8a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Archive Selected
                </button>
              ) : null}

              {view === "archived" ? (
                <button
                  type="button"
                  disabled={!canManage || bulkLifecycleMutation.isPending}
                  onClick={() =>
                    bulkLifecycleMutation.mutate({
                      memberIds: selectedMemberIds,
                      action: "restore",
                    })
                  }
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Restore Selected
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-[#F0ECEC] bg-white p-6 shadow-sm print:hidden">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : view === "drafts" ? (
        <ImportDraftsTable
          orgId={orgId}
          drafts={filteredDrafts}
          sections={activeSections}
          canManage={canManage}
          selectedIds={selectedDraftIds}
          onToggleDraft={(draftId, checked) => {
            setSelectedDraftIds((current) =>
              checked ? [...current, draftId] : current.filter((id) => id !== draftId)
            );
          }}
          onToggleAll={(checked) => {
            setSelectedDraftIds(checked ? filteredDrafts.map((draft) => draft.id) : []);
          }}
          onManageSections={() => {
            setIsManageSectionsOpen(true);
          }}
        />
      ) : (
        <MembersTable
          members={members}
          view={view as UserDirectoryView}
          sections={activeSections}
          canManage={canManage}
          selectedIds={selectedMemberIds}
          onToggleMember={(memberId, checked) => {
            setSelectedMemberIds((current) =>
              checked ? [...current, memberId] : current.filter((id) => id !== memberId)
            );
          }}
          onToggleAll={(checked) => {
            setSelectedMemberIds(checked ? members.map((member) => member.id) : []);
          }}
          onManageSections={() => {
            setIsManageSectionsOpen(true);
          }}
          onArchiveMember={(member) => {
            if (window.confirm(`Archive ${member.name}? Their payment history will stay in the organization records.`)) {
              archiveMutation.mutate(member);
            }
          }}
          onRestoreMember={(member) => {
            restoreMutation.mutate(member.id);
          }}
        />
      )}
    </div>
  );
}
