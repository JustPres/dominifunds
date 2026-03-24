"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
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
    // Manual validation
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

      // Fetch session to determine role-based redirect
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role === "OFFICER") {
        router.push("/dashboard");
      } else {
        router.push("/portal");
      }
    } catch {
      toast.error("Invalid email or password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F7F6]">
      <div className="w-[400px] rounded-[12px] bg-[#FFFFFF] p-8 shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center">
          {/* Logo Mark */}
          <div className="flex h-12 w-12 items-center justify-center bg-[#a12124]">
            <span className="text-xl font-bold text-white">DF</span>
          </div>

          <h1
            className="mt-4 text-2xl font-bold uppercase text-[#a12124]"
            style={{ fontFamily: "'Century Gothic', sans-serif" }}
          >
            DOMINIFUNDS
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Student Organization Fund Tracker
          </p>
          <p className="text-sm text-gray-500">
            St. Dominic College of Asia
          </p>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* Role Toggle Selector */}
        <div className="mb-6 flex h-10 w-full rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            className={`flex flex-1 items-center justify-center rounded-md text-sm font-semibold transition-all ${
              loginRole === "OFFICER"
                ? "bg-white text-[#a12124] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setLoginRole("OFFICER")}
          >
            Officer
          </button>
          <button
            type="button"
            className={`flex flex-1 items-center justify-center rounded-md text-sm font-semibold transition-all ${
              loginRole === "STUDENT"
                ? "bg-white text-[#a12124] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setLoginRole("STUDENT")}
          >
            Student
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="youremail@sdca.edu.ph"
              disabled={isLoading}
              className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]/30 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-[#a12124]">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isLoading}
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 pr-10 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]/30 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-[#a12124]">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-10 w-full items-center justify-center bg-[#a12124] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: "6px" }}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
          </button>
        </form>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Officer and Student accounts are created by your organization admin.
        </p>
      </div>
    </div>
  );
}
