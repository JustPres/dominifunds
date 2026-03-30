"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  updateMemberImportDraft,
  type MemberImportDraft,
} from "@/lib/api/members";
import type { SectionOption } from "@/lib/api/sections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const draftSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z
    .string()
    .trim()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Use a valid email address or leave it blank.",
    }),
  role: z.enum(["Member", "Section Representative", "Committee Lead", "Volunteer"]),
  yearLevel: z.enum(["", "1st", "2nd", "3rd", "4th"]),
  sectionId: z.string().optional(),
});

type DraftFormValues = z.infer<typeof draftSchema>;

interface ImportDraftEditDialogProps {
  orgId?: string | null;
  draft: MemberImportDraft;
  sections: SectionOption[];
  canManage: boolean;
  onManageSections?: () => void;
}

function getDefaultValues(draft: MemberImportDraft): DraftFormValues {
  return {
    name: draft.name,
    email: draft.email ?? "",
    role: draft.role as DraftFormValues["role"],
    yearLevel: (draft.yearLevel ?? "") as DraftFormValues["yearLevel"],
    sectionId: draft.sectionId ?? "",
  };
}

export default function ImportDraftEditDialog({
  orgId,
  draft,
  sections,
  canManage,
  onManageSections,
}: ImportDraftEditDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: getDefaultValues(draft),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(draft));
    }
  }, [draft, open, reset]);

  const mutation = useMutation({
    mutationFn: async (values: DraftFormValues) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      return updateMemberImportDraft(orgId, draft.id, {
        name: values.name,
        email: values.email || null,
        role: values.role,
        yearLevel: values.yearLevel || null,
        sectionId: values.sectionId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-import-drafts", orgId] });
      toast.success("Import draft updated.");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to update the import draft.");
    },
  });

  const inputClass =
    "flex h-10 w-full rounded-lg border border-[#F0ECEC] bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={!canManage}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0ECEC] bg-white text-[#343434] transition-colors hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-50"
        title="Edit draft"
      >
        <Icon icon="solar:pen-bold" className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-[420px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[#343434]">Edit Import Draft</DialogTitle>
          <DialogDescription className="text-[#625f5f]">
            Complete the missing details so this draft can become an active member account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="mt-4 flex flex-col gap-4">
          <div className="rounded-xl border border-[#F0ECEC] bg-[#F9F7F6] p-3 text-xs text-[#625f5f]">
            {draft.issueSummary || "No issues recorded. This row is ready to convert."}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">Full Name</label>
            <input {...register("name")} className={inputClass} />
            {errors.name ? <span className="text-[11px] font-bold text-red-500">{errors.name.message}</span> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">School Email</label>
            <input {...register("email")} className={inputClass} placeholder="Required before conversion" />
            {errors.email ? <span className="text-[11px] font-bold text-red-500">{errors.email.message}</span> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Role</label>
              <select {...register("role")} className={inputClass}>
                <option value="Member">Member</option>
                <option value="Section Representative">Section Representative</option>
                <option value="Committee Lead">Committee Lead</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Year Level</label>
              <select {...register("yearLevel")} className={inputClass}>
                <option value="">Unspecified</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#343434]">Section</label>
              {onManageSections ? (
                <button
                  type="button"
                  onClick={onManageSections}
                  className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a12124] transition-colors hover:text-[#7f1518]"
                >
                  Manage Sections
                </button>
              ) : null}
            </div>
            <select {...register("sectionId")} className={inputClass}>
              <option value="">Unassigned</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-[#F0ECEC] bg-white px-4 py-2 text-sm font-bold text-[#625f5f] hover:bg-[#F9F7F6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-[#a12124] px-4 py-2 text-sm font-bold text-white hover:bg-[#8a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Saving..." : "Save Draft"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
