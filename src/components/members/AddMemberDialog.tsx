import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMember } from "@/lib/api/members";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

const addMemberSchema = z.object({
  name: z.string().min(2, "Name is required (at least 2 characters)"),
  email: z.string().email("Invalid email address"),
  yearLevel: z.enum(["1st", "2nd", "3rd", "4th"]),
  role: z.enum(["President", "Treasurer", "Secretary", "Member"]),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export default function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      yearLevel: "1st",
      role: "Member",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AddMemberFormValues) => addMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member added successfully!");
      setOpen(false);
      reset();
    },
    onError: () => {
      toast.error("Failed to add member.");
    },
  });

  const onSubmit = (data: AddMemberFormValues) => {
    mutation.mutate(data);
  };

  const inputClass = "flex h-10 w-full rounded-lg border border-[#F0ECEC] bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 rounded-lg bg-[#a12124] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#8a1c1e]">
        <Icon icon="solar:user-plus-bold" className="h-5 w-5" />
        Add Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[#343434]">Add New Member</DialogTitle>
          <DialogDescription className="text-[#625f5f]">
            Register a new student to your organization. They will be added with good standing status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">Full Name</label>
            <input
              {...register("name")}
              placeholder="e.g. Juan Dela Cruz"
              className={inputClass}
            />
            {errors.name && <span className="text-[11px] font-bold text-red-500">{errors.name.message}</span>}
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#343434]">Email Address</label>
            <input
              {...register("email")}
              type="email"
              placeholder="e.g. juan@example.com"
              className={inputClass}
            />
            {errors.email && <span className="text-[11px] font-bold text-red-500">{errors.email.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Year Level Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Year Level</label>
              <select {...register("yearLevel")} className={inputClass}>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
              {errors.yearLevel && <span className="text-[11px] font-bold text-red-500">{errors.yearLevel.message}</span>}
            </div>

            {/* Role Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#343434]">Org Role</label>
              <select {...register("role")} className={inputClass}>
                <option value="Member">Member</option>
                <option value="President">President</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Secretary">Secretary</option>
              </select>
              {errors.role && <span className="text-[11px] font-bold text-red-500">{errors.role.message}</span>}
            </div>
          </div>

          <DialogFooter className="mt-6 border-t border-[#F0ECEC] pt-6 sm:justify-end gap-3">
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
              className="rounded-lg bg-[#a12124] px-4 py-2 text-sm font-bold text-white hover:bg-[#8a1c1e] disabled:opacity-50"
            >
              {mutation.isPending ? "Adding..." : "Add Member"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
