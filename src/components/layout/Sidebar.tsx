"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { useRoleStore } from "@/stores/role-store";
import OrgSwitcher from "./OrgSwitcher";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "solar:home-smile-bold" },
  { href: "/dashboard/due-calendar", label: "Due Calendar", icon: "solar:calendar-mark-bold" },
  { href: "/dashboard/members", label: "Members", icon: "solar:users-group-two-rounded-bold" },
  { href: "/dashboard/installments", label: "Installments", icon: "solar:calendar-date-bold" },
  { href: "/dashboard/transactions", label: "Transactions", icon: "solar:transfer-horizontal-bold" },
  { href: "/dashboard/fund-types", label: "Fund Types", icon: "solar:folder-with-files-bold" },
  { href: "/dashboard/annual-report", label: "Annual Report", icon: "solar:chart-2-bold" },
];

// Mock current org
const currentOrg = {
  name: "SDCA BSIT",
  course: "BS Information Technology",
  memberCount: 45,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { viewAs, setViewAs } = useRoleStore();
  const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false);

  return (
    <>
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

        {/* Org Selector */}
        <button
          onClick={() => setOrgSwitcherOpen(true)}
          className="mx-3 mb-4 flex items-center gap-2.5 rounded-lg bg-white/[0.07] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.12]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#a12124]/80">
            <Icon icon="solar:buildings-2-bold" className="h-4 w-4 text-white/90" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {currentOrg.name}
            </p>
            <p className="truncate text-[10px] text-white/50">
              {currentOrg.course} · {currentOrg.memberCount} members
            </p>
          </div>
          <Icon icon="solar:alt-arrow-down-linear" className="h-3.5 w-3.5 shrink-0 text-white/40" />
        </button>

        {/* View As Toggle */}
        <div className="mx-3 mb-5">
          <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-white/30">
            View As
          </p>
          <div className="flex rounded-lg bg-white/[0.07] p-0.5">
            <button
              onClick={() => setViewAs("OFFICER")}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all ${
                viewAs === "OFFICER"
                  ? "bg-[#a12124] text-white shadow-sm"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Officer
            </button>
            <button
              onClick={() => setViewAs("STUDENT")}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all ${
                viewAs === "STUDENT"
                  ? "bg-[#a12124] text-white shadow-sm"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Student
            </button>
          </div>
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

        {/* User Info */}
        <div className="border-t border-white/[0.08] px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#a12124]/70">
              <span className="text-xs font-semibold text-white">JD</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white/90">
                Juan Dela Cruz
              </p>
              <p className="truncate text-[10px] text-white/40">Officer</p>
            </div>
            <Icon
              icon="solar:logout-2-bold"
              className="h-4 w-4 shrink-0 cursor-pointer text-white/30 transition-colors hover:text-white/60"
            />
          </div>
        </div>
      </aside>

      {/* OrgSwitcher Modal */}
      <OrgSwitcher
        open={orgSwitcherOpen}
        onClose={() => setOrgSwitcherOpen(false)}
      />
    </>
  );
}
