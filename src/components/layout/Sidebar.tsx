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
  { href: "/dashboard/settings", label: "Settings", icon: "solar:settings-bold" },
];

export default function Sidebar({ orgDisplayName }: { orgDisplayName: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[220px] flex-col bg-[var(--dashboard-sidebar-bg)] font-body">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--dashboard-logo-bg)]">
          <span className="font-display text-sm font-bold tracking-tight text-[var(--dashboard-logo-text)]">
            DF
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-[12px] font-bold tracking-[0.18em] text-[var(--dashboard-sidebar-text)]">
            DominiFunds
          </p>
          <p className="truncate text-[11px] text-[var(--dashboard-sidebar-muted)]">{orgDisplayName}</p>
        </div>
      </div>

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
                  ? "border-l-[3px] border-[var(--dashboard-sidebar-active-border)] bg-[var(--dashboard-sidebar-active-bg)] font-semibold text-[var(--dashboard-sidebar-text)]"
                  : "border-l-[3px] border-transparent text-[var(--dashboard-sidebar-muted)] hover:bg-[var(--dashboard-sidebar-hover-bg)] hover:text-[var(--dashboard-sidebar-text)]"
              }`}
            >
              <Icon
                icon={link.icon}
                className={`h-[18px] w-[18px] shrink-0 ${
                  isActive
                    ? "text-[var(--dashboard-sidebar-active-icon)]"
                    : "text-[var(--dashboard-sidebar-muted)] group-hover:text-[var(--dashboard-sidebar-text)]"
                }`}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 text-center">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-[var(--dashboard-sidebar-muted)] transition-colors hover:bg-[var(--dashboard-sidebar-hover-bg)] hover:text-[var(--dashboard-sidebar-text)]"
        >
          <Icon icon="solar:logout-2-bold" className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
