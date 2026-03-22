"use client";

import { useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  useNotificationStore,
  type Notification,
} from "@/stores/notification-store";

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface NotifPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotifPanel({ open, onClose }: NotifPanelProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const NotifItem = ({ notif }: { notif: Notification }) => (
    <button
      onClick={() => markAsRead(notif.id)}
      className="flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#F9F7F6]"
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          notif.read ? "bg-[#F0ECEC]" : "bg-[#a12124]/10"
        }`}
      >
        <Icon
          icon="solar:bell-bold"
          className={`h-4 w-4 ${
            notif.read ? "text-[#625f5f]/50" : "text-[#a12124]"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-xs ${
            notif.read
              ? "font-medium text-[#625f5f]"
              : "font-semibold text-[#343434]"
          }`}
        >
          {notif.title}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[#625f5f]/70">
          {notif.message}
        </p>
        <p className="mt-1 text-[10px] text-[#625f5f]/40">
          {timeAgo(notif.createdAt)}
        </p>
      </div>
      {!notif.read && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#a12124]" />
      )}
    </button>
  );

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[340px] rounded-xl border border-[#F0ECEC] bg-white font-body shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F0ECEC] px-4 py-3">
        <h3 className="font-display text-sm font-bold text-[#343434]">
          Notifications
        </h3>
        {unread.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[11px] font-medium text-[#a12124] transition-colors hover:text-[#8a1c1e]"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {unread.length > 0 && (
          <div className="px-3 pt-3">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#625f5f]/50">
              Unread
            </p>
            {unread.map((n) => (
              <NotifItem key={n.id} notif={n} />
            ))}
          </div>
        )}

        {read.length > 0 && (
          <div className="px-3 pb-2 pt-2">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#625f5f]/50">
              Read
            </p>
            {read.map((n) => (
              <NotifItem key={n.id} notif={n} />
            ))}
          </div>
        )}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center py-8 text-[#625f5f]/50">
            <Icon icon="solar:bell-off-bold" className="mb-2 h-8 w-8" />
            <p className="text-xs">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
