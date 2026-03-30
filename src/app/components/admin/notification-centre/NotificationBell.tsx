import { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { format, isToday, isYesterday, formatDistanceToNow, isThisWeek } from "date-fns";
import {
  Bell, BellRing, Building2, BadgeCheck, Banknote, HelpCircle,
  Flag, TrendingUp, StarOff, DoorOpen, AlertTriangle, Radio,
  UserCog, Trophy, CheckCheck, ExternalLink, X,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { AdminNotification, NOTIF_TYPE_CONFIG } from "./types";
import { useNotifications } from "./NotificationContext";

// ─── Icon map ─────────────────────────────────────────────────

const ICONS: Record<string, React.ElementType> = {
  Building2, BadgeCheck, Banknote, HelpCircle, Flag, TrendingUp,
  StarOff, DoorOpen, AlertTriangle, Radio, UserCog, Trophy,
};

function NotifIcon({ type, priority }: { type: AdminNotification["type"]; priority: AdminNotification["priority"] }) {
  const cfg  = NOTIF_TYPE_CONFIG[type];
  const Icon = ICONS[cfg.icon] ?? Bell;
  return (
    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative", cfg.color)}>
      <Icon className="w-4 h-4" />
      {priority === "critical" && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
}

// ─── Group label ──────────────────────────────────────────────

function groupLabel(ts: Date): "Today" | "Yesterday" | "This Week" | "Older" {
  if (isToday(ts))      return "Today";
  if (isYesterday(ts))  return "Yesterday";
  if (isThisWeek(ts, { weekStartsOn: 1 })) return "This Week";
  return "Older";
}

// ─── Single notification item ─────────────────────────────────

function NotifItem({ notif, onRead, compact = false }: { notif: AdminNotification; onRead: () => void; compact?: boolean }) {
  return (
    <button onClick={onRead}
      className={cn(
        "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group",
        !notif.isRead && "bg-blue-50/40",
        notif.priority === "critical" && !notif.isRead && "bg-red-50/40 hover:bg-red-50/60"
      )}>
      <NotifIcon type={notif.type} priority={notif.priority} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-snug", notif.isRead ? "text-gray-600" : "text-gray-900 font-semibold")}>
            {notif.title}
          </p>
          {!notif.isRead && (
            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-gray-400">{formatDistanceToNow(notif.timestamp, { addSuffix: true })}</span>
          {notif.priority === "critical" && (
            <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full font-semibold">Critical</span>
          )}
          {notif.entityName && !compact && (
            <span className="text-[10px] text-gray-400 truncate">· {notif.entityName}</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main Bell + Dropdown ─────────────────────────────────────

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef  = useRef<HTMLDivElement>(null);
  const bellRef   = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node) && !bellRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Panel shows max 20 — sorted newest first
  const panelNotifs = useMemo(() => [...notifications].slice(0, 20), [notifications]);

  // Grouped
  const grouped = useMemo(() => {
    const map = new Map<string, AdminNotification[]>();
    const order = ["Today", "Yesterday", "This Week", "Older"];
    panelNotifs.forEach((n) => {
      const g = groupLabel(n.timestamp);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(n);
    });
    return order.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [panelNotifs]);

  const handleNotifClick = (notif: AdminNotification) => {
    markAsRead(notif.id); // BR-130-02
    setOpen(false);
    navigate(notif.deepLink);
  };

  const badgeCount = Math.min(unreadCount, 99);
  const showPlus   = unreadCount > 99;

  return (
    <div className="relative">
      {/* Bell button */}
      <button ref={bellRef} onClick={() => setOpen(!open)}
        className={cn(
          "relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors",
          open ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        )}>
        {unreadCount > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}

        {/* Badge */}
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1",
            "bg-red-500 shadow-sm"
          )}>
            {showPlus ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-bold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Bell className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-500">You're all caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No notifications to show.</p>
              </div>
            ) : grouped.map(({ group, items }) => (
              <div key={group}>
                <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{group}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((notif) => (
                    <NotifItem key={notif.id} notif={notif} onRead={() => handleNotifClick(notif)} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-100 px-4 py-2.5 bg-gray-50/50">
            <button onClick={() => { setOpen(false); navigate("/notification-centre"); }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium py-1 rounded-lg hover:bg-blue-50 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Also export the detail item for reuse in the full page ──

export { NotifItem, NotifIcon, groupLabel };
