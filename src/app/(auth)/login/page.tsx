"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginRole, setLoginRole] = useState<"OFFICER" | "STUDENT">("OFFICER");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    let hasError = false;

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError("email", { message: "Enter a valid email address" });
      hasError = true;
    }

    if (!data.password || data.password.length < 1) {
      setError("password", { message: "Password is required" });
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        role: loginRole,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password.");
        setIsLoading(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const nextSession = await sessionRes.json();

      if (nextSession?.user?.role === "OFFICER") {
        router.push("/dashboard");
      } else {
        router.push("/portal");
      }
    } catch {
      toast.error("Invalid email or password.");
      setIsLoading(false);
    }
  };

  const isOfficer = loginRole === "OFFICER";
  const isAuthenticated = status === "authenticated";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(161,33,36,0.10),_transparent_24%),linear-gradient(135deg,#f8f3ee_0%,#f3ebe4_48%,#f7f2ec_100%)] text-[#201919]">
      <div className="absolute inset-0">
        <div className="absolute left-[-8%] top-[-4%] h-72 w-72 rounded-full bg-[#a12124]/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-3%] h-96 w-96 rounded-full bg-[#d28d56]/14 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(46,25,26,0.14)] backdrop-blur-xl lg:grid-cols-[0.88fr_1.12fr]">
          <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_28%),linear-gradient(160deg,#8f1c20_0%,#b8302e_60%,#d78649_100%)] px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute right-[-8%] top-14 h-36 w-36 rounded-full border border-white/15" />
              <div className="absolute bottom-10 left-8 h-24 w-24 rounded-full border border-white/15" />
            </div>

            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="space-y-8">
                <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d1515] shadow-sm">
                    <span className="text-sm font-bold tracking-[0.24em]">DF</span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">DominiFunds</p>
                    <p className="text-sm text-white/90">Student organization fund tracker</p>
                  </div>
                </div>

                <div className="max-w-md space-y-4">
                  <p className="text-xs uppercase tracking-[0.34em] text-white/70 sm:text-sm">
                    Simple Access
                  </p>
                  <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                    Sign in to manage dues and balances.
                  </h1>
                  <p className="text-sm leading-7 text-white/82 sm:text-base">
                    A cleaner login for officers and students at St. Dominic College of Asia.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/65">One Workspace</p>
                  <p className="mt-3 text-base font-semibold">Choose your role and continue.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/82">
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                    St. Dominic College of Asia
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                    Officer and student portal
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,251,247,0.94)_100%)] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
            <div className="mx-auto w-full max-w-md space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#a12124]/10 bg-[#a12124]/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#8f1c20]">
                  <span className="h-2 w-2 rounded-full bg-[#c45a42]" />
                  Secure Access
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#241a1a]">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#6f5d59]">
                    Sign in with your school account.
                  </p>
                </div>
              </div>

              {isAuthenticated && (
                <div className="rounded-[22px] border border-[#eadfd9] bg-[#fffaf7] p-4 text-sm text-[#5f4e4b]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#2b1f1f]">Signed in already</p>
                      <p className="mt-1 leading-6">
                        {session?.user?.email} is active. Sign out if you want to switch accounts.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="shrink-0 rounded-full border border-[#d7c8c2] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1c20] transition-colors hover:bg-[#a12124]/5"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#38292a]">Role</label>
                  <span className="text-[11px] uppercase tracking-[0.22em] text-[#9f8d86]">
                    {isOfficer ? "Officer access" : "Student access"}
                  </span>
                </div>
                <div className="grid grid-cols-2 rounded-2xl border border-[#e8dcd6] bg-[#fcf7f4] p-1.5">
                  <button
                    type="button"
                    onClick={() => setLoginRole("OFFICER")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isOfficer
                        ? "bg-[linear-gradient(135deg,#8f1c20_0%,#b82d2d_100%)] text-white shadow-[0_10px_20px_rgba(143,28,32,0.18)]"
                        : "text-[#6d5a56] hover:text-[#2a1f1f]"
                    }`}
                    aria-pressed={isOfficer}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginRole("STUDENT")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      !isOfficer
                        ? "bg-[linear-gradient(135deg,#8f1c20_0%,#b82d2d_100%)] text-white shadow-[0_10px_20px_rgba(143,28,32,0.18)]"
                        : "text-[#6d5a56] hover:text-[#2a1f1f]"
                    }`}
                    aria-pressed={!isOfficer}
                  >
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-[#38292a]">
                    School Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7b76]" />
                    <input
                      id="email"
                      type="email"
                      placeholder={isOfficer ? "officer@sdca.edu.ph" : "student@sdca.edu.ph"}
                      autoComplete="username"
                      disabled={isLoading}
                      className="h-14 w-full rounded-2xl border border-[#e7dbd6] bg-white pl-11 pr-4 text-sm text-[#211919] outline-none transition-all placeholder:text-[#a39089] focus:border-[#8f1c20] focus:ring-4 focus:ring-[#8f1c20]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs font-medium text-[#a12124]">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-[#38292a]">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7b76]" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="h-14 w-full rounded-2xl border border-[#e7dbd6] bg-white pl-11 pr-12 text-sm text-[#211919] outline-none transition-all placeholder:text-[#a39089] focus:border-[#8f1c20] focus:ring-4 focus:ring-[#8f1c20]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d7b76] transition-colors hover:text-[#5d3031]"
                      onClick={() => setShowPassword((value) => !value)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs font-medium text-[#a12124]">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#8f1c20_0%,#b82d2d_68%,#d35f48_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(143,28,32,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(143,28,32,0.28)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in as {isOfficer ? "Officer" : "Student"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-start gap-3 rounded-[22px] border border-[#eadfd9] bg-[#fffdfa] p-4 text-sm leading-6 text-[#74625d]">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#8f1c20]/8 text-[#8f1c20]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p>Accounts are provided by your organization administrator.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
