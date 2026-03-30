import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { AdminNotification, POLL_INTERVAL_MS } from "./types";
import { INITIAL_NOTIFICATIONS, buildRealtimeNotification } from "./mockData";

// ─── Context shape ────────────────────────────────────────────

interface NotificationContextValue {
  notifications:  AdminNotification[];
  unreadCount:    number;
  markAsRead:     (id: string) => void;
  markAllAsRead:  () => void;
  addNotification:(n: AdminNotification) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(INITIAL_NOTIFICATIONS);
  const realtimeSeq = useRef(0);

  // BR-130-05: simulate real-time notification polling
  useEffect(() => {
    const timer = setInterval(() => {
      const n = buildRealtimeNotification(realtimeSeq.current++);
      setNotifications((prev) => [n, ...prev]);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // BR-130-02: mark individual notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  // Mark all read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const addNotification = useCallback((n: AdminNotification) => {
    setNotifications((prev) => [n, ...prev]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
