"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";

function resolveDestination(role?: "OFFICER" | "STUDENT") {
  return role === "OFFICER" ? "/dashboard" : "/portal";
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = useMemo(
    () => resolveDestination(session?.user?.role),
    [session?.user?.role]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload.message || "Unable to update password.");
        return;
      }

      await update({ mustChangePassword: false });
      toast.success("Password updated.");
      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error("[account/change-password]", error);
      toast.error("Unable to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "h-14 w-full rounded-2xl border border-[#e7dbd6] bg-white pl-11 pr-12 text-sm text-[#211919] outline-none transition-all placeholder:text-[#a39089] focus:border-[#8f1c20] focus:ring-4 focus:ring-[#8f1c20]/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(161,33,36,0.10),_transparent_24%),linear-gradient(135deg,#f8f3ee_0%,#f3ebe4_48%,#f7f2ec_100%)] px-4 py-10 text-[#201919] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(46,25,26,0.14)] backdrop-blur-xl sm:p-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#a12124]/10 bg-[#a12124]/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#8f1c20]">
              <span className="h-2 w-2 rounded-full bg-[#c45a42]" />
              First sign-in
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#241a1a]">Set a new password</h1>
              <p className="mt-2 text-sm leading-6 text-[#6f5d59]">
                Finish account setup before entering {session?.user?.role === "OFFICER" ? "the dashboard" : "the student portal"}.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium text-[#38292a]">
                New Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7b76]" />
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a new password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={isSubmitting || status === "loading"}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d7b76] transition-colors hover:text-[#5d3031]"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-[#38292a]">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7b76]" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter the new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isSubmitting || status === "loading"}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d7b76] transition-colors hover:text-[#5d3031]"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#eadfd9] bg-[#fffdfa] p-4 text-sm leading-6 text-[#74625d]">
              Use at least 8 characters. This replaces the temporary password created by your organization officer.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || status === "loading"}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8f1c20_0%,#b82d2d_68%,#d35f48_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(143,28,32,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(143,28,32,0.28)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving password..." : "Save password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
