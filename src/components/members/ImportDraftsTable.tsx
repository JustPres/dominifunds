"use client";

import { Icon } from "@iconify/react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  convertMemberImportDraft,
  discardMemberImportDraft,
  type MemberImportDraft,
} from "@/lib/api/members";
import type { SectionOption } from "@/lib/api/sections";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ImportDraftEditDialog from "./ImportDraftEditDialog";

interface ImportDraftsTableProps {
  orgId?: string | null;
  drafts: MemberImportDraft[];
  sections: SectionOption[];
  canManage: boolean;
  selectedIds: string[];
  onToggleDraft: (draftId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onManageSections?: () => void;
}

function getStatusClasses(status: MemberImportDraft["status"]) {
  switch (status) {
    case "READY":
      return "bg-emerald-50 text-emerald-700";
    case "INCOMPLETE":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-red-50 text-red-700";
  }
}

export default function ImportDraftsTable({
  orgId,
  drafts,
  sections,
  canManage,
  selectedIds,
  onToggleDraft,
  onToggleAll,
  onManageSections,
}: ImportDraftsTableProps) {
  const queryClient = useQueryClient();
  const allSelected = selectedIds.length > 0 && selectedIds.length === drafts.length;

  const discardMutation = useMutation({
    mutationFn: async (draftId: string) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return discardMemberImportDraft(orgId, draftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-import-drafts", orgId] });
      toast.success("Draft discarded.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to discard the draft.");
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (draftId: string) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return convertMemberImportDraft(orgId, draftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-import-drafts", orgId] });
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Draft converted to an active member.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to convert the draft.");
    },
  });

  if (drafts.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0ECEC] bg-white p-8 text-center shadow-sm">
        <Icon icon="solar:file-check-bold-duotone" className="mb-4 h-16 w-16 text-[#625f5f]/40" />
        <h3 className="font-display text-xl font-bold text-[#343434]">Import review queue is empty.</h3>
        <p className="mt-2 max-w-md text-sm text-[#625f5f]">
          Draft rows from Excel imports will appear here when a spreadsheet has missing or incomplete member details.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#F0ECEC] bg-[#F9F7F6]/60">
              {canManage ? (
                <th className="w-12 py-4 pl-6 pr-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
                    aria-label="Select all drafts"
                  />
                </th>
              ) : null}
              <th className="py-4 pr-4 font-semibold text-[#625f5f]">Draft Row</th>
              <th className="px-4 py-4 font-semibold text-[#625f5f]">Email</th>
              <th className="px-4 py-4 font-semibold text-[#625f5f]">Section</th>
              <th className="px-4 py-4 font-semibold text-[#625f5f]">Status</th>
              <th className="px-4 py-4 font-semibold text-[#625f5f]">Issues</th>
              <th className="py-4 pl-4 pr-6 text-right font-semibold text-[#625f5f]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {drafts.map((draft) => {
              const isSelected = selectedIds.includes(draft.id);

              return (
                <tr key={draft.id} className="transition-colors hover:bg-[#F9F7F6]">
                  {canManage ? (
                    <td className="py-4 pl-6 pr-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onToggleDraft(draft.id, Boolean(checked))}
                        aria-label={`Select ${draft.name}`}
                      />
                    </td>
                  ) : null}

                  <td className={`py-4 pr-4 ${canManage ? "" : "pl-6"}`}>
                    <div>
                      <p className="font-medium text-[#343434]">{draft.name}</p>
                      <p className="text-[11px] text-[#625f5f]">
                        {draft.role} • {draft.yearLevel ? `${draft.yearLevel} Year` : "No year level"}
                      </p>
                      <p className="text-[11px] text-[#625f5f]/80">
                        Added {new Date(draft.createdAt).toLocaleDateString("en-PH")}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-[#625f5f]">{draft.email || "Missing email"}</td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-[#F9F7F6] px-2.5 py-1 text-[11px] font-semibold text-[#625f5f]">
                      {draft.sectionName || "Unassigned"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${getStatusClasses(
                        draft.status
                      )}`}
                    >
                      {draft.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs text-[#625f5f]">
                    {draft.issueSummary || "Ready for manual review."}
                  </td>

                  <td className="py-4 pl-4 pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <ImportDraftEditDialog
                        orgId={orgId}
                        draft={draft}
                        sections={sections}
                        canManage={canManage}
                        onManageSections={onManageSections}
                      />
                      <button
                        type="button"
                        disabled={!canManage || !draft.email || convertMutation.isPending}
                        onClick={() => convertMutation.mutate(draft.id)}
                        className="flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon icon="solar:user-check-bold" className="h-4 w-4" />
                        Convert
                      </button>
                      <button
                        type="button"
                        disabled={!canManage || discardMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Discard the draft for ${draft.name}?`)) {
                            discardMutation.mutate(draft.id);
                          }
                        }}
                        className="flex h-8 items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" className="h-4 w-4" />
                        Discard
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
