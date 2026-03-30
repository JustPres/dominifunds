"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  addMember,
  type AddMemberInput,
  type Member,
  updateMember,
} from "@/lib/api/members";
import { normalizeYearLevel } from "@/lib/member-fields";
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

const MEMBER_ROLE_OPTIONS = [
  "Member",
  "Section Representative",
  "Committee Lead",
  "Volunteer",
] as const;

const YEAR_LEVEL_OPTIONS = ["1st", "2nd", "3rd", "4th"] as const;

const memberSchema = z.object({
  name: z.string().min(2, "Name is required (at least 2 characters)"),
  email: z.string().email("Invalid email address"),
  yearLevel: z.enum(YEAR_LEVEL_OPTIONS),
  role: z.enum(MEMBER_ROLE_OPTIONS),
  sectionId: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface AddMemberDialogProps {
  member?: Member | null;
  sections?: SectionOption[];
  canManage?: boolean;
  onManageSections?: () => void;
  onSaved?: () => void;
  compact?: boolean;
}

function getDefaultValues(member?: Member | null): MemberFormValues {
  const normalizedRole = MEMBER_ROLE_OPTIONS.includes((member?.role ?? "") as MemberFormValues["role"])
    ? ((member?.role ?? "Member") as MemberFormValues["role"])
    : "Member";

  return {
    name: member?.name ?? "",
    email: member?.email ?? "",
    yearLevel: normalizeYearLevel(member?.yearLevel) ?? "1st",
    role: normalizedRole,
    sectionId: member?.sectionId ?? "",
  };
}

export default function AddMemberDialog({
  member,
  sections = [],
  canManage = true,
  onManageSections,
  onSaved,
  compact = false,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const orgId = session?.user?.orgId;
  const isEditing = Boolean(member);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: getDefaultValues(member),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(member));
    }
  }, [member, open, reset]);

  const mutation = useMutation({
    mutationFn: async (data: MemberFormValues) => {
      if (!orgId) {
        throw new Error("Missing organization.");
      }

      const payload: AddMemberInput = {
        name: data.name,
        email: data.email,
        yearLevel: data.yearLevel,
        role: data.role,
        sectionId: data.sectionId || undefined,
        orgId,
      };

      return isEditing && member
        ? updateMember(orgId, member.id, payload)
        : addMember(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["member-import-drafts", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(isEditing ? "Member updated successfully." : "Member added successfully.");
      setOpen(false);
      reset(getDefaultValues(member));
      onSaved?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || `Failed to ${isEditing ? "update" : "add"} member.`);
    },
  });

  const onSubmit = (data: MemberFormValues) => {
    mutation.mutate({
      ...data,
      sectionId: data.sectionId || undefined,
    });
  };

  const inputClass =
    "flex h-10 w-full rounded-lg border border-[#F0ECEC] bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={!canManage}
        className={
          compact
            ? "flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0ECEC] bg-white text-[#343434] transition-colors hover:bg-[#F9F7F6] disabled:cursor-not-allowed disabled:opacity-50"
            : "flex items-center gap-2 rounded-lg bg-[#a12124] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#8a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
        }
        title={isEditing ? "Edit member" : "Add member"}
      >
        <Icon icon={isEditing ? "solar:pen-bold" : "solar:user-plus-bold"} className="h-5 w-5" />
        {!compact ? (isEditing ? "Edit Member" : "Add Member") : null}
      </DialogTrigger>
      <DialogContent className="max-w-[440px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[#343434]">
            {isEditing ? "Update Member" : "Add New Member"}
          </DialogTitle>
          <DialogDescription className="text-[#625f5f]">
            {isEditing
              ? "Update the member profile, section assignment, and directory information."
              : "Register a new student member for this organization."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">Full Name</label>
            <input {...register("name")} placeholder="e.g. Juan Dela Cruz" className={inputClass} />
            {errors.name ? <span className="text-[11px] font-bold text-red-500">{errors.name.message}</span> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">School Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="e.g. juan.delacruz@sdca.edu.ph"
              className={inputClass}
            />
            {errors.email ? <span className="text-[11px] font-bold text-red-500">{errors.email.message}</span> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Year Level</label>
              <select {...register("yearLevel")} className={inputClass}>
                {YEAR_LEVEL_OPTIONS.map((yearLevel) => (
                  <option key={yearLevel} value={yearLevel}>
                    {yearLevel} Year
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Directory Role</label>
              <select {...register("role")} className={inputClass}>
                {MEMBER_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
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
            <p className="text-[11px] text-[#625f5f]">
              Use the section manager if you need to create or restore a class section first.
            </p>
          </div>

          <DialogFooter className="mt-6 gap-3 border-t border-[#F0ECEC] pt-6 sm:justify-end">
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
              {mutation.isPending ? (isEditing ? "Saving..." : "Adding...") : isEditing ? "Save Changes" : "Add Member"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
