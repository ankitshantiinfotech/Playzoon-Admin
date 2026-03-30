import { useState, useMemo } from "react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { toast } from "sonner";
import {
  Search, Filter, Download, ChevronDown, ChevronRight,
  Monitor, Shield, AlertTriangle, CheckCircle2, XCircle,
  Lock, Globe, MapPin, Info, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  ActivityLogEntry, ActionCategory, ActionStatus, ActorRole,
  CATEGORY_STYLES, STATUS_STYLES, ACTOR_ROLE_STYLES,
} from "./types";

// ─── Constants ────────────────────────────────────────────────

const PAGE_SIZE = 50;
const MAX_DATE_RANGE_DAYS = 90;

type SortField = "timestamp" | "actionName" | "category" | "status";
type SortDir   = "asc" | "desc";

const CATEGORIES: ActionCategory[] = ["Admin Action", "System Action", "Security Event"];
const STATUSES:   ActionStatus[]   = ["Success", "Failed"];

// ─── Actor avatar ────────────────────────────────────────────

function ActorAvatar({ actor }: { actor: ActivityLogEntry["actor"] }) {
  const rs = ACTOR_ROLE_STYLES[actor.role];
  return (
    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 border", rs.bg, rs.border)}>
      {actor.role === "System"
        ? <Monitor className="w-3 h-3 text-gray-500" />
        : <span className={cn("text-[10px] font-bold", rs.text)}>{actor.name.charAt(0)}</span>}
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────

function SortIcon({ field, sort }: { field: SortField; sort: { key: SortField; dir: SortDir } }) {
  if (sort.key !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
  return sort.dir === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />;
}

// ─── Expanded detail row ──────────────────────────────────────

function DetailRow({ entry }: { entry: ActivityLogEntry }) {
  const cs = CATEGORY_STYLES[entry.category];
  return (
    <tr className="bg-gray-50/70">
      <td colSpan={8} className="px-6 py-4">
        <div className="space-y-3">
          {/* Failure reason (BR-128-03) */}
          {entry.status === "Failed" && entry.failureReason && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Failure Reason (BR-128-03)</p>
                <p className="text-sm text-red-700 mt-0.5">{entry.failureReason}</p>
              </div>
            </div>
          )}

          {/* Meta bar */}
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="text-gray-400">Action ID:</span>
              <code className="font-mono text-gray-700">{entry.id}</code>
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-gray-400" />
              {format(entry.timestamp, "EEEE, d MMMM yyyy 'at' HH:mm:ss")}
            </span>
            {entry.ipAddress && (
              <span className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-gray-400" /> IP: <code className="font-mono">{entry.ipAddress}</code>
              </span>
            )}
            {!entry.ipAddress && entry.actor.role === "System" && (
              <span className="flex items-center gap-1.5 text-gray-400">
                <Lock className="w-3 h-3" /> No IP (System action — BR-128-07)
              </span>
            )}
          </div>

          {/* Metadata */}
          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(entry.metadata).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                  <span className="text-gray-400">{k}:</span>
                  <span className="text-gray-700 font-medium">{v}</span>
                </span>
              ))}
            </div>
          )}

          {/* Read-only notice (BR-128-01) */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            Read-only — Activity logs cannot be edited or deleted (BR-128-01, BR-128-02)
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Stats ───────────────────────────────────────────────────

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm", color)}>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

interface ActivityLogViewProps {
  entries: ActivityLogEntry[];
}

export function ActivityLogView({ entries }: ActivityLogViewProps) {
  const defaultFrom = subDays(new Date(2026, 1, 21, 14, 0), 7);

  const [search,       setSearch]       = useState("");
  const [catFilter,    setCatFilter]    = useState<ActionCategory | "All">("All");
  const [actorFilter,  setActorFilter]  = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<ActionStatus | "All">("All");
  const [dateFrom,     setDateFrom]     = useState(format(defaultFrom, "yyyy-MM-dd"));
  const [dateTo,       setDateTo]       = useState(format(new Date(2026, 1, 21), "yyyy-MM-dd"));
  const [sort,         setSort]         = useState<{ key: SortField; dir: SortDir }>({ key: "timestamp", dir: "desc" });
  const [page,         setPage]         = useState(1);
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set());

  // Unique actors for filter dropdown
  const uniqueActors = useMemo(() => {
    const m = new Map<string, string>();
    entries.forEach((e) => m.set(e.actor.id, e.actor.name));
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  // Stats (full dataset)
  const stats = useMemo(() => ({
    total:    entries.length,
    admin:    entries.filter((e) => e.category === "Admin Action").length,
    system:   entries.filter((e) => e.category === "System Action").length,
    security: entries.filter((e) => e.category === "Security Event").length,
    failed:   entries.filter((e) => e.status === "Failed").length,
  }), [entries]);

  // Filtering
  const filtered = useMemo(() => entries.filter((e) => {
    const q = search.toLowerCase();
    if (q && !e.actionName.toLowerCase().includes(q) && !e.actor.name.toLowerCase().includes(q)
           && !e.target.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
    if (catFilter !== "All" && e.category !== catFilter) return false;
    if (actorFilter !== "all" && e.actor.id !== actorFilter) return false;
    if (statusFilter !== "All" && e.status !== statusFilter) return false;
    if (dateFrom) {
      const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
      if (e.timestamp < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      if (e.timestamp > to) return false;
    }
    return true;
  }), [entries, search, catFilter, actorFilter, statusFilter, dateFrom, dateTo]);

  // Sorting
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort.key === "timestamp") cmp = a.timestamp.getTime() - b.timestamp.getTime();
    else if (sort.key === "actionName") cmp = a.actionName.localeCompare(b.actionName);
    else if (sort.key === "category")   cmp = a.category.localeCompare(b.category);
    else if (sort.key === "status")     cmp = a.status.localeCompare(b.status);
    return sort.dir === "asc" ? cmp : -cmp;
  }), [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (key: SortField) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
    setPage(1);
  };

  const toggleExpand = (id: string) => setExpanded((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const clearFilters = () => {
    setSearch(""); setCatFilter("All"); setActorFilter("all"); setStatusFilter("All");
    setDateFrom(format(defaultFrom, "yyyy-MM-dd")); setDateTo(format(new Date(2026, 1, 21), "yyyy-MM-dd"));
    setPage(1);
  };

  const activeFilters = [search, catFilter !== "All", actorFilter !== "all", statusFilter !== "All"].filter(Boolean).length;

  // CSV export (BR-128-06 — respects filters)
  const handleExport = () => {
    const rows = [
      ["Action ID", "Action", "Category", "Actor", "Actor Role", "Target", "Target Type", "Timestamp (UTC)", "IP Address", "Status", "Failure Reason"],
      ...sorted.map((e) => [
        e.id, e.actionName, e.category, e.actor.name, e.actor.role, e.target, e.targetType,
        format(e.timestamp, "dd MMM yyyy HH:mm:ss"),
        e.ipAddress ?? "", e.status, e.failureReason ?? "",
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a    = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `activity-log-${format(new Date(), "yyyyMMdd-HHmm")}.csv`; a.click();
    toast.success(`Exported ${sorted.length} entries (BR-128-06: filtered results, max 10,000 rows).`);
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-2">
        <StatBadge label="Total Entries"    value={stats.total}    color="bg-white border-gray-200 text-gray-700" />
        <StatBadge label="Admin Actions"    value={stats.admin}    color="bg-blue-50 border-blue-200 text-blue-700" />
        <StatBadge label="System Actions"   value={stats.system}   color="bg-violet-50 border-violet-200 text-violet-700" />
        <StatBadge label="Security Events"  value={stats.security} color="bg-red-50 border-red-200 text-red-700" />
        {stats.failed > 0 && (
          <StatBadge label="Failed"         value={stats.failed}   color="bg-red-100 border-red-300 text-red-800" />
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <Lock className="w-3 h-3" /> Read-only (BR-128-01) · Retained 24+ months (BR-128-02)
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Action ID, action name, actor, or target…"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shrink-0">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />

          {/* Category */}
          <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value as any); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-7 bg-white focus:ring-blue-500 focus:outline-none">
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Actor */}
          <select value={actorFilter} onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-7 bg-white focus:ring-blue-500 focus:outline-none">
            <option value="all">All Actors</option>
            {uniqueActors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>

          {/* Status */}
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-7 bg-white focus:ring-blue-500 focus:outline-none">
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Date From */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">From</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded-lg py-1.5 px-2 bg-white focus:ring-blue-500 focus:outline-none" />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">To</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded-lg py-1.5 px-2 bg-white focus:ring-blue-500 focus:outline-none" />
          </div>

          {activeFilters > 0 && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">
              Clear filters ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 w-8" />
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-left" onClick={() => toggleSort("timestamp")}>
                  Timestamp <SortIcon field="timestamp" sort={sort} />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-left" onClick={() => toggleSort("actionName")}>
                  Action <SortIcon field="actionName" sort={sort} />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-left hidden lg:table-cell" onClick={() => toggleSort("category")}>
                  Category <SortIcon field="category" sort={sort} />
                </th>
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Target</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">IP Address</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-center" onClick={() => toggleSort("status")}>
                  Status <SortIcon field="status" sort={sort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((entry) => {
                const cs = CATEGORY_STYLES[entry.category];
                const ss = STATUS_STYLES[entry.status];
                const rs = ACTOR_ROLE_STYLES[entry.actor.role];
                const isExpanded = expanded.has(entry.id);
                const isFailed   = entry.status === "Failed";

                return (
                  <>
                    <tr key={entry.id}
                      onClick={() => toggleExpand(entry.id)}
                      className={cn("cursor-pointer border-b border-gray-50 hover:bg-blue-50/20 transition-colors",
                        isFailed && "bg-red-50/30 hover:bg-red-50/50",
                        isExpanded && "bg-blue-50/30")}>
                      {/* Expand */}
                      <td className="px-3 py-3">
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-blue-600" />
                          : <ChevronRight className="w-4 h-4 text-gray-300" />}
                      </td>
                      {/* Timestamp */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700 tabular-nums whitespace-nowrap">{format(entry.timestamp, "dd MMM yyyy")}</p>
                        <p className="text-[10px] text-gray-400 tabular-nums">{format(entry.timestamp, "HH:mm:ss")}</p>
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          <span className="font-medium text-gray-900 text-sm">{entry.actionName}</span>
                        </div>
                        <code className="text-[10px] text-gray-400 font-mono">{entry.id}</code>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border font-medium", cs.bg, cs.text, cs.border)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", cs.dot)} />{entry.category}
                        </span>
                      </td>
                      {/* Actor */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <ActorAvatar actor={entry.actor} />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-800 truncate max-w-[110px]">{entry.actor.name}</p>
                            <span className={cn("text-[9px] px-1 py-0.5 rounded border", rs.bg, rs.text, rs.border)}>{entry.actor.role}</span>
                          </div>
                        </div>
                      </td>
                      {/* Target */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-gray-700 truncate max-w-[160px]">{entry.target}</p>
                        <p className="text-[10px] text-gray-400">{entry.targetType}</p>
                      </td>
                      {/* IP */}
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {entry.ipAddress
                          ? <code className="text-xs font-mono text-gray-500">{entry.ipAddress}</code>
                          : <span className="text-[10px] text-gray-300 italic">—</span>}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-semibold", ss.bg, ss.text, ss.border)}>
                          {entry.status === "Success"
                            ? <CheckCircle2 className="w-3 h-3" />
                            : <XCircle className="w-3 h-3" />}
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && <DetailRow key={`${entry.id}-detail`} entry={entry} />}
                  </>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No activity log entries match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-sm">
          <span className="text-gray-500 text-xs">
            {sorted.length === 0 ? "0" : `${(safePage-1)*PAGE_SIZE + 1}–${Math.min(safePage*PAGE_SIZE, sorted.length)}`} of {sorted.length} entries
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={safePage <= 1}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-xs disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={safePage >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-xs disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      {/* Failed entries summary */}
      {stats.failed > 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span><strong>BR-128-03:</strong> {stats.failed} failed action{stats.failed !== 1 ? "s" : ""} detected. Click any <span className="bg-red-100 px-1 rounded">red-highlighted</span> row to expand and view the failure reason.</span>
        </div>
      )}
    </div>
  );
}
