import { useState } from "react";
import { format } from "date-fns";
import {
  ClipboardList, RefreshCw, Activity, ChevronRight,
  ShieldCheck, Clock,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { ActivityLogEntry, RefreshActivity } from "./types";
import { INITIAL_ACTIVITY_LOGS, INITIAL_REFRESH_ACTIVITIES } from "./mockData";
import { ActivityLogView } from "./ActivityLogView";
import { SystemRefreshView } from "./SystemRefreshView";

// ─── Tab ─────────────────────────────────────────────────────

type Tab = "activity" | "refresh";

// ─── Main Page ────────────────────────────────────────────────

export function TrackActivitiesPage() {
  const [activeTab, setActiveTab]   = useState<Tab>("activity");
  const [activityLogs]              = useState<ActivityLogEntry[]>(INITIAL_ACTIVITY_LOGS);
  const [refreshActivities, setRefreshActivities] = useState<RefreshActivity[]>(INITIAL_REFRESH_ACTIVITIES);

  const handleActivityAdded = (a: RefreshActivity) => {
    setRefreshActivities((prev) => [a, ...prev]);
  };

  const handleActivityUpdated = (id: string, updates: Partial<RefreshActivity>) => {
    setRefreshActivities((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const pendingCount    = refreshActivities.filter((r) => r.status === "In Progress").length;
  const failedRefresh   = refreshActivities.filter((r) => r.status === "Failed").length;
  const failedActivity  = activityLogs.filter((e) => e.status === "Failed").length;
  const securityEvents  = activityLogs.filter((e) => e.category === "Security Event").length;

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    {
      id:    "activity",
      label: "Activity Log",
      icon:  ClipboardList,
      badge: failedActivity > 0 ? failedActivity : undefined,
      badgeColor: "bg-red-500",
    },
    {
      id:    "refresh",
      label: "System Refresh Activities",
      icon:  RefreshCw,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: "bg-blue-500",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
            <span>Admin Portal</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">Track / Refresh Activities</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-[#003B95]" />
            Track / Refresh Activities
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive audit log of platform activity, system events, and refresh operations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
          <Clock className="w-3.5 w-3.5" />
          Data as of {format(new Date(2026, 1, 21, 14, 0, 0), "d MMM yyyy · HH:mm")} UTC
        </div>
      </div>

      {/* ── Alert banners ── */}
      <div className="flex flex-wrap gap-3">
        {securityEvents > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
            <span><strong>{securityEvents}</strong> security event{securityEvents !== 1 ? "s" : ""} in the activity log — review recommended.</span>
          </div>
        )}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />
            <span><strong>{pendingCount}</strong> refresh operation{pendingCount !== 1 ? "s" : ""} currently in progress.</span>
          </div>
        )}
        {failedRefresh > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>{failedRefresh}</strong> refresh operation{failedRefresh !== 1 ? "s" : ""} failed — expand rows for details.</span>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0.5 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-[#003B95] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge !== undefined && (
              <span className={cn("text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 font-bold text-white", tab.badgeColor)}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {activeTab === "activity" && (
        <ActivityLogView entries={activityLogs} />
      )}
      {activeTab === "refresh" && (
        <SystemRefreshView
          activities={refreshActivities}
          onActivityAdded={handleActivityAdded}
          onActivityUpdated={handleActivityUpdated}
        />
      )}
    </div>
  );
}
