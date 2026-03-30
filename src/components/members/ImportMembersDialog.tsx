"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  commitMembersImport,
  downloadMemberImportTemplate,
  previewMembersImport,
  type MemberImportPreviewRow,
} from "@/lib/api/members";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImportMembersDialogProps {
  orgId?: string | null;
  canManage: boolean;
}

function getActionClasses(action: MemberImportPreviewRow["action"]) {
  switch (action) {
    case "create":
      return "bg-emerald-50 text-emerald-700";
    case "update":
      return "bg-blue-50 text-blue-700";
    case "restore":
      return "bg-amber-50 text-amber-700";
    case "draft":
      return "bg-orange-50 text-orange-700";
    case "skip":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-red-50 text-red-700";
  }
}

export default function ImportMembersDialog({ orgId, canManage }: ImportMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    rows: MemberImportPreviewRow[];
    summary: {
      created: number;
      updated: number;
      restored: number;
      drafted: number;
      skipped: number;
      failed: number;
    };
    fileName: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return previewMembersImport(orgId, file);
    },
    onSuccess: (result) => {
      setPreview(result);
      toast.success("Import preview is ready.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to preview the spreadsheet.");
    },
  });

  const commitMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !preview) {
        throw new Error("There is no import preview to commit.");
      }

      return commitMembersImport(orgId, preview.rows, preview.fileName);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["member-import-drafts", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setSelectedFile(null);
      setPreview(null);
      toast.success(
        `Import complete. ${result.summary.created} created, ${result.summary.updated} updated, ${result.summary.drafted} drafts.`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to import the spreadsheet.");
    },
  });

  const summaryCards = preview
    ? [
        { label: "Create", value: preview.summary.created, tone: "text-emerald-700" },
        { label: "Update", value: preview.summary.updated, tone: "text-blue-700" },
        { label: "Restore", value: preview.summary.restored, tone: "text-amber-700" },
        { label: "Draft", value: preview.summary.drafted, tone: "text-orange-700" },
        { label: "Issues", value: preview.summary.failed, tone: "text-red-700" },
      ]
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setSelectedFile(null);
          setPreview(null);
        }
      }}
    >
      <DialogTrigger
        disabled={!canManage}
        className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon icon="solar:upload-bold" className="h-5 w-5 text-[#3D0808]" />
        Import Excel
      </DialogTrigger>
      <DialogContent className="max-w-[960px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[#343434]">Import Members from Excel</DialogTitle>
          <DialogDescription className="text-[#625f5f]">
            Upload a spreadsheet, review what will be created or drafted, then commit the batch when it looks right.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#F0ECEC] bg-[#F9F7F6] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#343434]">Accepted columns</p>
                <p className="text-xs text-[#625f5f]">
                  Name and email create active members. Name-only rows go to the import review queue as drafts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!orgId) return;
                  downloadMemberImportTemplate(orgId).catch(() => {
                    toast.error("Unable to download the template.");
                  });
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5D7D2] bg-white px-4 py-2 text-sm font-bold text-[#7C2426] transition-colors hover:bg-[#FFF6F4]"
              >
                <Icon icon="solar:file-download-bold" className="h-4 w-4" />
                Download Template
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
              <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#D9C9C0] bg-white px-4 py-3 text-sm text-[#625f5f] transition-colors hover:border-[#C99697]">
                <Icon icon="solar:file-bold" className="h-5 w-5 text-[#7C2426]" />
                <span className="truncate">
                  {selectedFile?.name || "Choose an Excel file (.xlsx or .xls)"}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    setPreview(null);
                  }}
                />
              </label>

              <button
                type="button"
                disabled={!selectedFile || previewMutation.isPending}
                onClick={() => {
                  if (!selectedFile) return;
                  previewMutation.mutate(selectedFile);
                }}
                className="rounded-lg bg-[#a12124] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#8a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {previewMutation.isPending ? "Analyzing..." : "Preview Import"}
              </button>
            </div>
          </div>

          {preview ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {summaryCards.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#F0ECEC] bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#625f5f]">{item.label}</p>
                    <p className={`mt-2 font-display text-2xl font-bold ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#F0ECEC] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#F0ECEC] px-4 py-3">
                  <div>
                    <p className="font-semibold text-[#343434]">Preview Rows</p>
                    <p className="text-xs text-[#625f5f]">{preview.fileName}</p>
                  </div>
                  <p className="text-xs text-[#625f5f]">{preview.rows.length} rows analyzed</p>
                </div>

                <div className="max-h-[360px] overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[#F9F7F6]">
                      <tr className="border-b border-[#F0ECEC] text-[11px] font-bold uppercase tracking-[0.16em] text-[#625f5f]">
                        <th className="px-4 py-3">Row</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Section</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECEC]">
                      {preview.rows.map((row) => (
                        <tr key={row.rowNumber}>
                          <td className="px-4 py-3 font-medium text-[#625f5f]">{row.rowNumber}</td>
                          <td className="px-4 py-3 text-[#343434]">
                            <div className="font-medium">{row.name || "-"}</div>
                            <div className="text-xs text-[#625f5f]">
                              {row.normalizedRole} • {row.normalizedYearLevel ? `${row.normalizedYearLevel} Year` : "No year"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#625f5f]">{row.email || "-"}</td>
                          <td className="px-4 py-3 text-[#625f5f]">{row.sectionName || "Unassigned"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${getActionClasses(
                                row.action
                              )}`}
                            >
                              {row.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#625f5f]">
                            {row.issues.length > 0 ? row.issues.join(" ") : "Ready"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-[#F0ECEC] bg-white px-4 py-2 text-sm font-bold text-[#625f5f] hover:bg-[#F9F7F6]"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!preview || commitMutation.isPending}
            onClick={() => commitMutation.mutate()}
            className="rounded-lg bg-[#a12124] px-4 py-2 text-sm font-bold text-white hover:bg-[#8a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {commitMutation.isPending ? "Importing..." : "Commit Import"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
