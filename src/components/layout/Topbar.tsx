"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
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
  "/dashboard/settings": { icon: "solar:settings-bold", title: "Settings" },
};

export default function Topbar({ orgDisplayName }: { orgDisplayName: string }) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const { data: session } = useSession();

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "OF";

  const currentPage = pageMeta[pathname] ?? pageMeta["/dashboard"];
  const currentDate = format(new Date(), "MMMM yyyy");

  return (
    <header
      className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b px-6 font-body"
      style={{
        backgroundColor: "var(--dashboard-topbar-bg)",
        borderColor: "var(--dashboard-topbar-border)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <Icon icon={currentPage.icon} className="h-5 w-5" style={{ color: "var(--dashboard-topbar-accent)" }} />
        <h1 className="font-display text-[15px] font-bold text-[#343434]">{currentPage.title}</h1>
        <span style={{ color: "var(--dashboard-topbar-muted)", opacity: 0.3 }}>|</span>
        <span className="text-xs" style={{ color: "var(--dashboard-topbar-muted)" }}>
          {orgDisplayName}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs" style={{ color: "var(--dashboard-topbar-muted)" }}>
          {currentDate}
        </span>

        <div className="relative">
          <button
            data-notif-trigger
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#F0ECEC]"
          >
            <Icon icon="solar:bell-bold" className="h-[18px] w-[18px]" style={{ color: "var(--dashboard-topbar-muted)" }} />
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                style={{ backgroundColor: "var(--dashboard-topbar-accent)" }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <NotifPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--dashboard-topbar-avatar-bg)" }}
        >
          <span className="text-xs font-semibold" style={{ color: "var(--dashboard-topbar-avatar-text)" }}>
            {initials}
          </span>
        </div>
      </div>
    </header>
  );
}
