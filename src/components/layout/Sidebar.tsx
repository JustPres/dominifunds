"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { signOut } from "next-auth/react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "solar:home-smile-bold" },
  { href: "/dashboard/due-calendar", label: "Due Calendar", icon: "solar:calendar-mark-bold" },
  { href: "/dashboard/members", label: "Members", icon: "solar:users-group-two-rounded-bold" },
  { href: "/dashboard/installments", label: "Installments", icon: "solar:calendar-date-bold" },
  { href: "/dashboard/transactions", label: "Transactions", icon: "solar:transfer-horizontal-bold" },
  { href: "/dashboard/fund-types", label: "Fund Types", icon: "solar:folder-with-files-bold" },
  { href: "/dashboard/annual-report", label: "Annual Report", icon: "solar:chart-2-bold" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[220px] flex-col bg-[#3D0808] font-body">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#a12124]">
          <span className="font-display text-sm font-bold tracking-tight text-white">
            DF
          </span>
        </div>
        <span className="font-display text-[13px] font-bold tracking-wide text-white/90">
          DOMINIFUNDS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-2.5 rounded-r-lg py-2 pl-3 pr-2 text-[13px] transition-all ${
                isActive
                  ? "border-l-[3px] border-[#a12124] bg-white/[0.08] font-semibold text-white"
                  : "border-l-[3px] border-transparent text-white/50 hover:bg-white/[0.05] hover:text-white/70"
              }`}
            >
              <Icon
                icon={link.icon}
                className={`h-[18px] w-[18px] shrink-0 ${
                  isActive ? "text-[#a12124]" : "text-white/40 group-hover:text-white/60"
                }`}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="border-t border-white/[0.08] p-4 text-center">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/90"
        >
          <Icon icon="solar:logout-2-bold" className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
