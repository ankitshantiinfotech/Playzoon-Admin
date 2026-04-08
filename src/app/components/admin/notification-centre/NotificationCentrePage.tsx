import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  formatDistanceToNow,
} from "date-fns";
import {
  Bell,
  BellRing,
  CheckCheck,
  Filter,
  ChevronRight,
  AlertTriangle,
  Building2,
  BadgeCheck,
  Banknote,
  HelpCircle,
  Flag,
  TrendingUp,
  StarOff,
  DoorOpen,
  Radio,
  UserCog,
  Trophy,
  Info,
  Wifi,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  AdminNotification,
  AdminNotifCategory,
  NOTIF_TYPE_CONFIG,
  CATEGORY_COLORS,
  ALL_CATEGORIES,
  POLL_INTERVAL_MS,
} from "./types";
import { useNotifications } from "./NotificationContext";
import { NotifIcon, groupLabel } from "./NotificationBell";

// ─── Constants ────────────────────────────────────────────────

const PAGE_SIZE = 20;
type ReadFilter = "All" | "Unread" | "Read";

// ─── Full notification row ────────────────────────────────────

function NotifRow({
  notif,
  onRead,
}: {
  notif: AdminNotification;
  onRead: () => void;
}) {
  const catStyle = CATEGORY_COLORS[notif.category];

  return (
    <button
      onClick={onRead}
      className={cn(
        "w-full text-left flex items-start gap-4 px-5 py-4 border-b border-gray-100 hover:bg-gray-50/60 transition-colors group",
        !notif.isRead && "bg-blue-50/30",
        notif.priority === "critical" &&
          !notif.isRead &&
          "bg-red-50/30 hover:bg-red-50/50",
      )}
    >
      {/* Unread indicator */}
      <div className="w-2 flex items-start justify-center pt-2 shrink-0">
        {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
      </div>

      {/* Icon */}
      <NotifIcon type={notif.type} priority={notif.priority} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p
            className={cn(
              "text-sm leading-snug flex-1",
              notif.isRead ? "text-gray-600" : "text-gray-900 font-semibold",
            )}
          >
            {notif.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {notif.priority === "critical" && (
              <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                CRITICAL (BR-130-04)
              </span>
            )}
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                catStyle,
              )}
            >
              {notif.category}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {notif.body}
        </p>

        {notif.entityName && (
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="font-medium text-gray-600">
              {notif.entityName}
            </span>
            {notif.entityId && (
              <span className="text-gray-300"> · {notif.entityId}</span>
            )}
          </p>
        )}

        {notif.meta && Object.keys(notif.meta).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {Object.entries(notif.meta).map(([k, v]) => (
              <span
                key={k}
                className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
              >
                {k}: <strong>{v}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="text-right shrink-0 min-w-[100px]">
        <p className="text-xs text-gray-700 tabular-nums">
          {format(notif.timestamp, "dd MMM yyyy")}
        </p>
        <p className="text-[10px] text-gray-400">
          {format(notif.timestamp, "HH:mm")}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
        </p>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export function NotificationCentrePage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();

  const [catFilter, setCatFilter] = useState<AdminNotifCategory | "All">("All");
  const [readFilter, setReadFilter] = useState<ReadFilter>("All");
  const [page, setPage] = useState(1);

  // Filter + sort (newest first)
  const filtered = useMemo(
    () =>
      notifications.filter((n) => {
        if (catFilter !== "All" && n.category !== catFilter) return false;
        if (readFilter === "Unread" && n.isRead) return false;
        if (readFilter === "Read" && !n.isRead) return false;
        return true;
      }),
    [notifications, catFilter, readFilter],
  );

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Group paged items
  const grouped = useMemo(() => {
    const map = new Map<string, AdminNotification[]>();
    const order = ["Today", "Yesterday", "This Week", "Older"];
    paged.forEach((n) => {
      const g = groupLabel(n.timestamp);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(n);
    });
    return order
      .filter((g) => map.has(g))
      .map((g) => ({ group: g, items: map.get(g)! }));
  }, [paged]);

  const handleClick = (notif: AdminNotification) => {
    markAsRead(notif.id); // BR-130-02
    navigate(notif.deepLink);
  };

  const stats = useMemo(
    () => ({
      total: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      critical: notifications.filter(
        (n) => n.priority === "critical" && !n.isRead,
      ).length,
      today: notifications.filter((n) => isToday(n.timestamp)).length,
    }),
    [notifications],
  );

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
            <span>Admin Portal</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">
              Notification Centre
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            {unreadCount > 0 ? (
              <BellRing className="w-6 h-6 text-[#003B95]" />
            ) : (
              <Bell className="w-6 h-6 text-[#003B95]" />
            )}
            Notification Centre
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            All platform notifications received by your Admin account.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "bg-white border-gray-200 text-gray-700",
            icon: Bell,
          },
          {
            label: "Unread",
            value: stats.unread,
            color: "bg-blue-50 border-blue-200 text-blue-700",
            icon: BellRing,
          },
          {
            label: "Critical Unread",
            value: stats.critical,
            color:
              stats.critical > 0
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-gray-50 border-gray-200 text-gray-400",
            icon: AlertTriangle,
          },
          {
            label: "Today",
            value: stats.today,
            color: "bg-emerald-50 border-emerald-200 text-emerald-700",
            icon: CheckCheck,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "border rounded-xl p-4 flex items-center gap-3 shadow-sm",
              s.color,
            )}
          >
            <s.icon className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs opacity-70">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BR-130-05 polling notice */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-500 shadow-sm">
        <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>
          <strong>BR-130-05:</strong> Notification badge updates in real-time
          via polling every {POLL_INTERVAL_MS / 1000}s. New notifications appear
          automatically at the top.
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />

        {/* Category */}
        <select
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value as any);
            setPage(1);
          }}
          className="text-sm border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-7 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Categories</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Read status */}
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {(["All", "Unread", "Read"] as ReadFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                setReadFilter(f);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                readFilter === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {f}
              {f === "Unread" && unreadCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-400">
          Showing {filtered.length} of {notifications.length} · Retained 90 days
          (BR-130-03)
        </span>
      </div>

      {/* Notification list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Bell className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-base font-semibold text-gray-500">
              No notifications
            </p>
            <p className="text-sm text-gray-400 mt-1">
              No notifications match the selected filters.
            </p>
          </div>
        ) : (
          grouped.map(({ group, items }) => (
            <div key={group}>
              <div className="px-5 py-2.5 bg-gray-50 border-b border-t border-gray-100 sticky top-0 z-10">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {group}
                </span>
                <span className="ml-2 text-[10px] text-gray-400">
                  {items.length} notification{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              {items.map((notif) => (
                <NotifRow
                  key={notif.id}
                  notif={notif}
                  onRead={() => handleClick(notif)}
                />
              ))}
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1 border border-gray-300 rounded-md bg-white text-xs hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md bg-white text-xs hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BR notes */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-500">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
          <span>
            <strong>BR-130-01:</strong> Notifications are scoped to your Admin
            role and permissions. Sub-Admins only receive notifications within
            their assigned area.
          </span>
        </div>
        <div className="flex items-start gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>BR-130-04:</strong> System Error (Critical) notifications
            are always created in-app regardless of push/email notification
            settings.
          </span>
        </div>
      </div>
    </div>
  );
}
