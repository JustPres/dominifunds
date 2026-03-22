"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Fetch session to determine role-based redirect
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role === "OFFICER") {
        router.push("/dashboard");
      } else {
        router.push("/portal");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F7F6] px-4 font-body">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-[#F0ECEC] bg-white px-8 py-10 shadow-lg">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#a12124] shadow-md">
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                DF
              </span>
            </div>
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-[#343434]">
                DominiFunds
              </h1>
              <p className="mt-1 text-sm text-[#625f5f]">
                Sign in to your account
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#343434]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading}
                className="h-10 rounded-lg border-[#F0ECEC] bg-white px-3 text-[#343434] placeholder:text-[#625f5f]/50 focus-visible:border-[#a12124] focus-visible:ring-[#a12124]/20"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-[#a12124]">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#343434]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className="h-10 rounded-lg border-[#F0ECEC] bg-white px-3 text-[#343434] placeholder:text-[#625f5f]/50 focus-visible:border-[#a12124] focus-visible:ring-[#a12124]/20"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-[#a12124]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-[#a12124] font-display text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#8a1c1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a12124]/50 focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#625f5f]">
          &copy; {new Date().getFullYear()} SDCA DominiFunds. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
