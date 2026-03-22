"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { useNotificationStore } from "@/stores/notification-store";
import NotifPanel from "./NotifPanel";

const pageMeta: Record<string, { icon: string; title: string }> = {
  "/dashboard": { icon: "solar:home-smile-bold", title: "Dashboard" },
  "/dashboard/due-calendar": { icon: "solar:calendar-mark-bold", title: "Due Calendar" },
  "/dashboard/members": { icon: "solar:users-group-two-rounded-bold", title: "Members" },
  "/dashboard/installments": { icon: "solar:calendar-date-bold", title: "Installments" },
  "/dashboard/transactions": { icon: "solar:transfer-horizontal-bold", title: "Transactions" },
  "/dashboard/fund-types": { icon: "solar:folder-with-files-bold", title: "Fund Types" },
  "/dashboard/annual-report": { icon: "solar:chart-2-bold", title: "Annual Report" },
};

export default function Topbar() {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Find the matching page meta
  const currentPage = pageMeta[pathname] ?? pageMeta["/dashboard"];
  const currentDate = format(new Date(), "MMMM yyyy");

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#F0ECEC] bg-white px-6 font-body">
      {/* Left — Page title */}
      <div className="flex items-center gap-2.5">
        <Icon
          icon={currentPage.icon}
          className="h-5 w-5 text-[#a12124]"
        />
        <h1 className="font-display text-[15px] font-bold text-[#343434]">
          {currentPage.title}
        </h1>
        <span className="text-[#625f5f]/30">|</span>
        <span className="text-xs text-[#625f5f]">SDCA BSIT</span>
      </div>

      {/* Right — Date, Bell, Avatar */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-[#625f5f]">{currentDate}</span>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#F0ECEC]"
          >
            <Icon
              icon="solar:bell-bold"
              className="h-[18px] w-[18px] text-[#625f5f]"
            />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a12124] px-1 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <NotifPanel
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
          />
        </div>

        {/* User Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a12124]/10">
          <span className="text-xs font-semibold text-[#a12124]">JD</span>
        </div>
      </div>
    </header>
  );
}
