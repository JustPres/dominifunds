"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  archiveSection,
  createSection,
  restoreSection,
  type SectionOption,
  updateSection,
} from "@/lib/api/sections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ManageSectionsDialogProps {
  orgId?: string | null;
  sections: SectionOption[];
  canManage: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ManageSectionsDialog({
  orgId,
  sections,
  canManage,
  open,
  onOpenChange,
}: ManageSectionsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const queryClient = useQueryClient();
  const isOpen = open ?? internalOpen;
  const handleOpenChange = onOpenChange ?? setInternalOpen;

  function setSectionCache(nextSections: SectionOption[]) {
    if (!orgId) return;

    queryClient.setQueryData(["sections", orgId, "all"], nextSections);
    queryClient.setQueryData(
      ["sections", orgId],
      nextSections.filter((section) => !section.isArchived)
    );
  }

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return createSection(orgId, { name });
    },
    onSuccess: (section) => {
      const nextSections = [...sections.filter((existing) => existing.id !== section.id), section].sort((left, right) =>
        left.name.localeCompare(right.name)
      );
      setSectionCache(nextSections);
      queryClient.invalidateQueries({ queryKey: ["sections", orgId] });
      setNewSectionName("");
      toast.success("Section saved.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save section.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return updateSection(orgId, id, { name });
    },
    onSuccess: (updatedSection) => {
      const nextSections = sections
        .map((section) => (section.id === updatedSection.id ? { ...section, ...updatedSection } : section))
        .sort((left, right) => left.name.localeCompare(right.name));

      setSectionCache(nextSections);
      queryClient.invalidateQueries({ queryKey: ["sections", orgId] });
      setEditingSectionId(null);
      setEditingName("");
      toast.success("Section updated.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update section.");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return archiveSection(orgId, id);
    },
    onSuccess: (_result, id) => {
      const nextSections = sections.map((section) =>
        section.id === id ? { ...section, isArchived: true } : section
      );

      setSectionCache(nextSections);
      queryClient.invalidateQueries({ queryKey: ["sections", orgId] });
      toast.success("Section archived.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to archive section.");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return restoreSection(orgId, id);
    },
    onSuccess: (_result, id) => {
      const nextSections = sections.map((section) =>
        section.id === id ? { ...section, isArchived: false } : section
      );

      setSectionCache(nextSections);
      queryClient.invalidateQueries({ queryKey: ["sections", orgId] });
      toast.success("Section restored.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to restore section.");
    },
  });

  const sortedSections = [...sections].sort((left, right) => {
    if (Boolean(left.isArchived) !== Boolean(right.isArchived)) {
      return left.isArchived ? 1 : -1;
    }

    return left.name.localeCompare(right.name);
  });

  const inputClass =
    "flex h-10 w-full rounded-lg border border-[#F0ECEC] bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        disabled={!canManage}
        className="group flex items-center gap-2 rounded-xl border border-[#F0ECEC] bg-white px-4 py-2.5 text-sm font-bold text-[#343434] shadow-sm transition-all hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon icon="solar:layers-bold" className="h-5 w-5 text-[#3D0808]" />
        Manage Sections
      </DialogTrigger>
      <DialogContent className="max-w-[680px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[#343434]">Manage Sections</DialogTitle>
          <DialogDescription className="text-[#625f5f]">
            Create, rename, archive, and restore class sections without leaving the members workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#F0ECEC] bg-[#F9F7F6] p-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#625f5f]">
              Create Section
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newSectionName}
                onChange={(event) => setNewSectionName(event.target.value)}
                placeholder="e.g. Dominixode 3A"
                className={inputClass}
              />
              <button
                type="button"
                disabled={!newSectionName.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate(newSectionName.trim())}
                className="shrink-0 rounded-lg bg-[#a12124] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#8a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createMutation.isPending ? "Saving..." : "Add Section"}
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-[#F0ECEC] bg-white">
            <div className="grid grid-cols-[1.6fr,0.5fr,0.9fr] gap-3 border-b border-[#F0ECEC] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#625f5f]">
              <span>Section</span>
              <span>Members</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-[#F0ECEC]">
              {sortedSections.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-[#625f5f]">
                  No sections yet. Create the first section above.
                </div>
              ) : null}

              {sortedSections.map((section) => {
                const isEditing = editingSectionId === section.id;

                return (
                  <div key={section.id} className="grid grid-cols-[1.6fr,0.5fr,0.9fr] items-center gap-3 px-4 py-3">
                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className={inputClass}
                          />
                          <button
                            type="button"
                            disabled={!editingName.trim() || updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: section.id, name: editingName.trim() })}
                            className="rounded-lg bg-[#a12124] px-3 py-2 text-xs font-bold text-white hover:bg-[#8a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#343434]">{section.name}</span>
                          {section.isArchived ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                              Archived
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                              Active
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-sm font-medium text-[#625f5f]">{section.memberCount ?? 0}</span>

                    <div className="flex items-center justify-end gap-2">
                      {!section.isArchived ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSectionId(section.id);
                              setEditingName(section.name);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0ECEC] bg-white text-[#343434] transition-colors hover:bg-[#F9F7F6]"
                            title="Rename section"
                          >
                            <Icon icon="solar:pen-bold" className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Archive ${section.name}? Historical members will still keep the label.`)) {
                                archiveMutation.mutate(section.id);
                              }
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                            title="Archive section"
                          >
                            <Icon icon="solar:archive-bold" className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => restoreMutation.mutate(section.id)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-lg border border-[#F0ECEC] bg-white px-4 py-2 text-sm font-bold text-[#625f5f] hover:bg-[#F9F7F6]"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
