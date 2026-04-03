"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ShieldCheck } from "lucide-react";
import { getOrganizationSettings } from "@/lib/api/org-settings";
import { getOrgDisplayName } from "@/lib/org-display";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((namePart) => namePart[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";
  const roleLabel = session?.user?.role === "OFFICER" ? "Officer" : "Student";
  const orgId = session?.user?.orgId;
  const { data: orgSettings } = useQuery({
    queryKey: ["org-settings", orgId],
    enabled: !!orgId,
    queryFn: () => getOrganizationSettings(orgId as string),
    staleTime: 60_000,
  });
  const orgDisplayName = orgSettings?.displayName ?? getOrgDisplayName(orgId);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(161,33,36,0.07),_transparent_24%),linear-gradient(180deg,#f8f3ee_0%,#f4ede7_44%,#f7f3ee_100%)] text-[#241a1a]">
      <header className="sticky top-0 z-40 border-b border-[#eadfd9]/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8f1c20_0%,#c24439_100%)] text-sm font-bold tracking-[0.24em] text-white shadow-[0_12px_20px_rgba(143,28,32,0.18)]">
              DF
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#9f8d86]">DominiFunds</p>
              <h1 className="text-base font-semibold text-[#241a1a]">Student Portal</h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-full border border-[#eadfd9] bg-white/80 px-4 py-2 text-sm text-[#6f5d59] sm:flex">
            <ShieldCheck className="h-4 w-4 text-[#8f1c20]" />
            <span>{orgDisplayName}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-3 rounded-full border border-[#eadfd9] bg-white px-3 py-2 shadow-sm md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8f1c20]/10 text-xs font-semibold text-[#8f1c20]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#241a1a]">{session?.user?.name || "Student"}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-[#9f8d86]">{roleLabel} account</p>
              </div>
            </div>

            <Link
              href="/login?switch=1"
              className="hidden rounded-full border border-[#eadfd9] bg-white px-4 py-2 text-sm font-medium text-[#5f4e4b] transition-colors hover:bg-[#fffaf7] sm:inline-flex"
            >
              Switch account
            </Link>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#8f1c20_0%,#b82d2d_68%,#d35f48_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(143,28,32,0.18)] transition-all hover:-translate-y-0.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
