import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  Globe,
  Star,
  CreditCard,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  CalendarClock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  RefreshActivity,
  RefreshType,
  RefreshStatus,
  REFRESH_STATUS_STYLES,
  REFRESH_TYPE_CONFIG,
  RATE_LIMIT_MS,
} from "./types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Button } from "../../ui/button";

// ─── Helpers ─────────────────────────────────────────────────

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60),
    s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const TYPE_ICONS: Record<RefreshType, React.ElementType> = {
  "Search Index Re-index": Search,
  "CDN Cache Purge": Globe,
  "Featured Content Refresh": Star,
  "Payment Reconciliation": CreditCard,
  "DB Backup": Database,
};

function TypeIcon({ type }: { type: RefreshType }) {
  const Icon = TYPE_ICONS[type];
  return <Icon className="w-4 h-4" />;
}

// ─── Trigger card ─────────────────────────────────────────────

const MANUALLY_TRIGGERABLE: RefreshType[] = [
  "Search Index Re-index",
  "CDN Cache Purge",
  "Featured Content Refresh",
];

interface TriggerCardProps {
  type: RefreshType;
  lastTriggered?: Date;
  onTrigger: (type: RefreshType) => void;
  isRunning: boolean;
}

function TriggerCard({
  type,
  lastTriggered,
  onTrigger,
  isRunning,
}: TriggerCardProps) {
  const cfg = REFRESH_TYPE_CONFIG[type];
  const Icon = TYPE_ICONS[type];
  const now = new Date(2026, 1, 21, 14, 0, 0);

  // BR-128-05: rate limiting
  const rateLimited =
    lastTriggered != null &&
    now.getTime() - lastTriggered.getTime() < RATE_LIMIT_MS;
  const secSinceLast = lastTriggered
    ? Math.floor((now.getTime() - lastTriggered.getTime()) / 1000)
    : null;
  const secsUntilFree =
    rateLimited && lastTriggered
      ? Math.ceil(
          (RATE_LIMIT_MS - (now.getTime() - lastTriggered.getTime())) / 1000,
        )
      : 0;

  const disabled = isRunning || rateLimited;

  return (
    <div
      className={cn(
        "bg-white border rounded-2xl shadow-sm p-5 flex flex-col gap-4 transition-all",
        isRunning
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-gray-200 hover:border-gray-300",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-9 h-10 rounded-xl flex items-center justify-center shrink-0",
            cfg.color,
          )}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{type}</p>
          <p className="text-xs text-gray-500 mt-0.5">{cfg.description}</p>
        </div>
        {isRunning && (
          <span className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full animate-pulse">
            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Running
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Est. ~
          {formatDuration(cfg.estimatedSeconds)}
        </span>
        {lastTriggered && (
          <span className="flex items-center gap-1">
            <CalendarClock className="w-3 h-3" /> Last:{" "}
            {formatDistanceToNow(lastTriggered, { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Rate limit notice (BR-128-05) */}
      {rateLimited && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Rate limited (BR-128-05): This refresh type can only be triggered once
          every 5 minutes. Available in ~{Math.ceil(secsUntilFree / 60)}m{" "}
          {secsUntilFree % 60}s.
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => !disabled && onTrigger(type)}
        disabled={disabled}
        title={
          rateLimited
            ? `Search re-index can only be triggered once every 5 minutes`
            : undefined
        }
        className={cn(
          "mt-auto w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all",
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-[#003B95] hover:bg-[#002a6b] text-white shadow-sm",
        )}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Running…
          </>
        ) : rateLimited ? (
          <>
            <Clock className="w-4 h-4" /> Rate Limited
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" /> Trigger Now
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────

interface SystemRefreshViewProps {
  activities: RefreshActivity[];
  onActivityAdded: (a: RefreshActivity) => void;
  onActivityUpdated: (id: string, updates: Partial<RefreshActivity>) => void;
}

export function SystemRefreshView({
  activities,
  onActivityAdded,
  onActivityUpdated,
}: SystemRefreshViewProps) {
  const [confirmType, setConfirmType] = useState<RefreshType | null>(null);
  const [runningTypes, setRunningTypes] = useState<Set<RefreshType>>(new Set());
  const [lastTriggered, setLastTriggered] = useState<
    Partial<Record<RefreshType, Date>>
  >({});
  const [filterStatus, setFilterStatus] = useState<RefreshStatus | "All">(
    "All",
  );
  const [filterType, setFilterType] = useState<RefreshType | "All">("All");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  // Sort latest first
  const allSorted = useMemo(
    () =>
      [...activities].sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime(),
      ),
    [activities],
  );

  const filtered = useMemo(
    () =>
      allSorted.filter((r) => {
        if (filterStatus !== "All" && r.status !== filterStatus) return false;
        if (filterType !== "All" && r.refreshType !== filterType) return false;
        return true;
      }),
    [allSorted, filterStatus, filterType],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // Stats
  const stats = useMemo(
    () => ({
      total: activities.length,
      inProgress: activities.filter((r) => r.status === "In Progress").length,
      completed: activities.filter((r) => r.status === "Completed").length,
      failed: activities.filter((r) => r.status === "Failed").length,
    }),
    [activities],
  );

  // Confirm trigger (BR-128-04)
  const handleConfirmTrigger = () => {
    if (!confirmType) return;
    const now = new Date(2026, 1, 21, 14, 0, 0);
    const refId = `REF-20260221-${String(activities.length + 1).padStart(3, "0")}`;
    const cfg = REFRESH_TYPE_CONFIG[confirmType];

    // Add In Progress record immediately (BR-128-04)
    const newRecord: RefreshActivity = {
      id: refId,
      refreshType: confirmType,
      triggeredBy: "Manual",
      triggeredByUser: "Super Admin",
      startTime: now,
      status: "In Progress",
    };
    onActivityAdded(newRecord);
    setRunningTypes((prev) => new Set([...prev, confirmType]));
    setLastTriggered((prev) => ({ ...prev, [confirmType]: now }));
    setConfirmType(null);
    toast.info(
      `${confirmType} triggered — logged as "In Progress" (BR-128-04). Estimated duration: ~${formatDuration(cfg.estimatedSeconds)}.`,
    );

    // Simulate completion
    setTimeout(() => {
      onActivityUpdated(refId, {
        status: "Completed",
        endTime: new Date(now.getTime() + cfg.estimatedSeconds * 1000),
        durationSeconds: cfg.estimatedSeconds,
        affectedRecords:
          confirmType === "Search Index Re-index" ? 28_450 : undefined,
      });
      setRunningTypes((prev) => {
        const n = new Set(prev);
        n.delete(confirmType!);
        return n;
      });
      toast.success(
        `${confirmType} completed successfully in ${formatDuration(cfg.estimatedSeconds)}.`,
      );
    }, cfg.estimatedSeconds * 200); // Accelerated for demo (real: seconds)
  };

  const REFRESH_TYPES_ALL: RefreshType[] = [
    "Search Index Re-index",
    "CDN Cache Purge",
    "Featured Content Refresh",
    "Payment Reconciliation",
    "DB Backup",
  ];
  const REFRESH_STATUSES: RefreshStatus[] = [
    "In Progress",
    "Completed",
    "Failed",
  ];

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Refresh Ops",
            value: stats.total,
            color: "bg-white border-gray-200 text-gray-700",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            color: "bg-blue-50 border-blue-200 text-blue-700",
          },
          {
            label: "Completed",
            value: stats.completed,
            color: "bg-emerald-50 border-emerald-200 text-emerald-700",
          },
          {
            label: "Failed",
            value: stats.failed,
            color: "bg-red-50 border-red-200 text-red-700",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-xl border p-3 flex items-center gap-3",
              s.color,
            )}
          >
            <span className="text-2xl font-bold">{s.value}</span>
            <span className="text-xs opacity-80">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Manual Trigger Panel */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-800">
            Manual Refresh Triggers
          </h3>
          <span className="text-xs text-gray-400 ml-1">
            (BR-128-04: confirmation required · BR-128-05: rate limited to 1 per
            5 min per type)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MANUALLY_TRIGGERABLE.map((type) => (
            <TriggerCard
              key={type}
              type={type}
              lastTriggered={lastTriggered[type]}
              onTrigger={(t) => setConfirmType(t)}
              isRunning={runningTypes.has(type)}
            />
          ))}
        </div>
      </div>

      {/* Refresh Log Table */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-500" /> Refresh Activities
            Log
          </h3>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setPage(1);
              }}
              className="text-xs border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-6 bg-white focus:outline-none focus:ring-blue-500"
            >
              <option value="All">All Types</option>
              {REFRESH_TYPES_ALL.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setPage(1);
              }}
              className="text-xs border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-6 bg-white focus:outline-none focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              {REFRESH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 w-8" />
                  <th className="px-4 py-3 text-left">Refresh ID</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">
                    Triggered By
                  </th>
                  <th className="px-4 py-3 text-left">Start Time</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">
                    End Time
                  </th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map((r) => {
                    const ss = REFRESH_STATUS_STYLES[r.status];
                    const cfg = REFRESH_TYPE_CONFIG[r.refreshType];
                    const isExpanded = expandedRow === r.id;
                    const isFailed = r.status === "Failed";

                    return (
                      <>
                        <tr
                          key={r.id}
                          onClick={() =>
                            setExpandedRow(isExpanded ? null : r.id)
                          }
                          className={cn(
                            "cursor-pointer border-b border-gray-50 hover:bg-gray-50/40 transition-colors",
                            isFailed && "bg-red-50/20",
                            r.status === "In Progress" &&
                              "bg-blue-50/20 animate-pulse-slow",
                            isExpanded && "bg-gray-50/60",
                          )}
                        >
                          <td className="px-3 py-3">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs font-mono text-gray-600">
                              {r.id}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                  cfg.color,
                                )}
                              >
                                <TypeIcon type={r.refreshType} />
                              </div>
                              <span className="text-xs font-medium text-gray-800 max-w-[130px] truncate">
                                {r.refreshType}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                              {r.triggeredBy === "Manual" ? (
                                <>
                                  <User className="w-3 h-3 text-blue-500" />
                                  <span className="text-xs text-gray-700">
                                    {r.triggeredByUser ?? "Manual"}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <CalendarClock className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    Scheduled
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-700 whitespace-nowrap">
                              {format(r.startTime, "dd MMM yyyy")}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {format(r.startTime, "HH:mm:ss")}
                            </p>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {r.endTime ? (
                              <>
                                <p className="text-xs text-gray-700">
                                  {format(r.endTime, "dd MMM yyyy")}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {format(r.endTime, "HH:mm:ss")}
                                </p>
                              </>
                            ) : (
                              <span className="text-xs text-gray-300 italic">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {r.durationSeconds !== undefined ? (
                              <span className="text-xs font-mono text-gray-700">
                                {formatDuration(r.durationSeconds)}
                              </span>
                            ) : r.status === "In Progress" ? (
                              <span className="flex items-center gap-1 text-xs text-blue-600">
                                <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                running
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
                                ss.bg,
                                ss.text,
                                ss.border,
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  ss.dot,
                                  r.status === "In Progress" && "animate-pulse",
                                )}
                              />
                              {r.status}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <tr key={`${r.id}-detail`} className="bg-gray-50/70">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="space-y-2.5 text-xs text-gray-600">
                                {r.affectedRecords !== undefined && (
                                  <p className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    Records affected:{" "}
                                    <strong className="text-gray-800">
                                      {r.affectedRecords.toLocaleString()}
                                    </strong>
                                  </p>
                                )}
                                {r.errorMessage && (
                                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-semibold text-red-800 text-sm">
                                        Failure details (BR-128-03)
                                      </p>
                                      <p className="text-red-700 mt-0.5">
                                        {r.errorMessage}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <p className="text-gray-400">
                                  Triggered by:{" "}
                                  <strong className="text-gray-700">
                                    {r.triggeredBy}
                                  </strong>
                                  {r.triggeredByUser && (
                                    <> · {r.triggeredByUser}</>
                                  )}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <RefreshCw className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No refresh activities match the filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-sm">
            <span className="text-gray-500 text-xs">
              {filtered.length === 0
                ? "0"
                : `${(safePage - 1) * PER_PAGE + 1}–${Math.min(safePage * PER_PAGE, filtered.length)}`}{" "}
              of {filtered.length} records
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BR-128-05 info */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>BR-128-05:</strong> Manually triggerable refresh operations
          (Search Re-index, CDN Purge, Featured Content) are rate-limited to
          once per 5 minutes per type to prevent system overload. Sub-Admin
          users cannot trigger manual refreshes (BR-128-08).
        </span>
      </div>

      {/* Confirm Modal (BR-128-04) */}
      <AlertDialog
        open={!!confirmType}
        onOpenChange={() => setConfirmType(null)}
      >
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmType && <TypeIcon type={confirmType} />}
              Confirm: {confirmType}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-gray-600 mt-1">
                <p>
                  {confirmType && REFRESH_TYPE_CONFIG[confirmType].description}
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1.5 text-xs text-amber-800">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> BR-128-04 — Manual
                    Trigger Confirmation
                  </p>
                  <ul className="space-y-0.5 pl-4 list-disc">
                    <li>
                      This operation will be logged immediately with status{" "}
                      <strong>"In Progress"</strong>
                    </li>
                    <li>
                      Estimated duration:{" "}
                      <strong>
                        ~
                        {confirmType &&
                          formatDuration(
                            REFRESH_TYPE_CONFIG[confirmType].estimatedSeconds,
                          )}
                      </strong>
                    </li>
                    <li>Cannot be cancelled once started</li>
                    <li>
                      Rate-limited: you won't be able to trigger this type again
                      for <strong>5 minutes</strong> (BR-128-05)
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTrigger}
              className="bg-[#003B95] hover:bg-[#002a6b]"
            >
              <Zap className="w-4 h-4 mr-1.5" /> Confirm & Trigger
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
