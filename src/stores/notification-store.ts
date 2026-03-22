import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Payment Received",
    message: "Juan Dela Cruz submitted ₱2,500 for March installment.",
    read: false,
    createdAt: new Date(2026, 2, 22, 14, 30),
  },
  {
    id: "2",
    title: "New Member Added",
    message: "Maria Santos joined BSIT-3A organization.",
    read: false,
    createdAt: new Date(2026, 2, 22, 10, 15),
  },
  {
    id: "3",
    title: "Installment Due Soon",
    message: "5 members have installments due on March 25.",
    read: false,
    createdAt: new Date(2026, 2, 21, 16, 0),
  },
  {
    id: "4",
    title: "Report Generated",
    message: "Annual fund report for SY 2025-2026 is ready.",
    read: true,
    createdAt: new Date(2026, 2, 20, 9, 0),
  },
  {
    id: "5",
    title: "Fund Type Created",
    message: "New fund type 'Field Trip Fund' has been created.",
    read: true,
    createdAt: new Date(2026, 2, 19, 11, 45),
  },
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,
  get unreadCount() {
    return get().notifications.filter((n) => !n.read).length;
  },
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
}));
