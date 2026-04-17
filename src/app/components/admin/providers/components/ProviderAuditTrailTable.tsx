// ─── US-5.4.1 — Provider Audit Trail Table ───────────────────
// Chronological, field-level audit trail with filter controls.
// Reusable: embed in provider detail (pass providerId) or
// render standalone for all providers (omit providerId).

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import {
  Search, X, Filter, CalendarIcon, RotateCcw,
  ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown,
  ClipboardList, Clock, FileEdit, ArrowRightLeft,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Badge } from "../../../ui/badge";
import { Calendar } from "../../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";

import {
  type ProviderAuditEntry,
  type AuditActionType,
  ACTION_TYPE_STYLES,
  ALL_ACTION_TYPES,
} from "./provider-audit-data";
import { adminService } from "@/services/admin.service";

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════

interface ProviderAuditTrailTableProps {
  /** Filter entries to a single entity (provider or player). Omit for global view. */
  providerId?: string;
  /** Backend entity_type — defaults to "provider". Pass "player" for player audit. */
  entityType?: string;
  /** Optional heading override */
  title?: string;
  /** Hide the stats row (useful in embedded contexts) */
  compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const PAGE_SIZES = [10, 20, 50];

type SortDir = "asc" | "desc";

// ═══════════════════════════════════════════════════════════════
// Action Type Badge
// ═══════════════════════════════════════════════════════════════

function ActionBadge({ type }: { type: AuditActionType }) {
  const s = ACTION_TYPE_STYLES[type];
  return (
    <Badge variant="outline" className={cn("text-[10px] border whitespace-nowrap", s.bg, s.text, s.border)}>
      {type}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════
// Value cell — truncated with tooltip
// ═══════════════════════════════════════════════════════════════

function ValueCell({ value, isNA }: { value: string; isNA?: boolean }) {
  const truncated = value.length > 40;
  const display = truncated ? value.slice(0, 37) + "…" : value;

  const content = (
    <span className={cn(
      "text-xs break-all",
      isNA ? "text-gray-300 italic" : "text-[#374151]",
    )}>
      {display}
    </span>
  );

  if (truncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">{content}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs whitespace-pre-wrap">
          {value}
        </TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ProviderAuditTrailTable({
  providerId,
  entityType = "provider",
  title,
  compact = false,
}: ProviderAuditTrailTableProps) {
  // ── Base data from API ────────────────────────────
  const [baseEntries, setBaseEntries] = useState<ProviderAuditEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  const mapActionType = (action: string): AuditActionType => {
    const a = action.toLowerCase();
    if (a.includes('approve') || a.includes('approval')) return 'Approval';
    if (a.includes('reject')) return 'Rejection';
    if (a.includes('create') || a.includes('onboard')) return 'Create';
    if (a.includes('delete') || a.includes('remove')) return 'Delete';
    if (a.includes('status') || a.includes('lock') || a.includes('unlock') || a.includes('activate') || a.includes('deactivate')) return 'Status Change';
    return 'Update';
  };

  useEffect(() => {
    let cancelled = false;
    const fetchAudit = async () => {
      setIsLoadingEntries(true);
      try {
        const params: Record<string, unknown> = {
          entity_type: entityType,
          page: 1,
          limit: 100,
          sort_order: 'desc',
        };
        if (providerId) params.entity_id = providerId;
        const res = await adminService.getAuditTrail(params);
        const data = res?.data || res;
        const rawEntries = data?.entries || [];
        const entries: ProviderAuditEntry[] = rawEntries.map((e: Record<string, unknown>) => {
          let changes = e.changes as Record<string, unknown> | null;
          if (typeof changes === 'string') {
            try { changes = JSON.parse(changes); } catch { changes = null; }
          }
          return {
            id: String(e.id),
            providerId: String(e.entity_id || ''),
            providerName: '',
            editedBy: String(e.actor_name || 'System'),
            fieldName: changes?.field ? String(changes.field) : String(e.description || e.action || ''),
            oldValue: changes?.oldValue != null ? String(changes.oldValue) : 'N/A',
            newValue: changes?.newValue != null ? String(changes.newValue) : String(e.description || ''),
            dateTime: new Date(String(e.created_at)),
            actionType: mapActionType(String(e.action || '')),
          };
        });
        if (!cancelled) setBaseEntries(entries);
      } catch (err) {
        console.error('Failed to fetch audit trail:', err);
        if (!cancelled) setBaseEntries([]);
      } finally {
        if (!cancelled) setIsLoadingEntries(false);
      }
    };
    fetchAudit();
    return () => { cancelled = true; };
  }, [providerId, entityType]);

  // ── Filter values ─────────────────────────────────
  const uniqueEditors = useMemo(() => [...new Set(baseEntries.map(e => e.editedBy))].sort(), [baseEntries]);
  const uniqueFields = useMemo(() => [...new Set(baseEntries.map(e => e.fieldName))].sort(), [baseEntries]);

  // ── Filter state ──────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.length >= 2 ? searchInput : "");
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  // ── Sort ──────────────────────────────────────────
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = useCallback(() => {
    setSortDir(d => d === "asc" ? "desc" : "asc");
    setPage(1);
  }, []);

  // ── Pagination ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Active filters count ──────────────────────────
  const activeCount = [
    userFilter !== "all",
    fieldFilter !== "all",
    actionFilter !== "all",
    !!dateFrom,
    !!dateTo,
    !!debouncedSearch,
  ].filter(Boolean).length;

  // ── Filter + sort ─────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...baseEntries];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(e =>
        e.editedBy.toLowerCase().includes(q) ||
        e.fieldName.toLowerCase().includes(q) ||
        e.oldValue.toLowerCase().includes(q) ||
        e.newValue.toLowerCase().includes(q) ||
        e.providerName.toLowerCase().includes(q) ||
        e.providerId.toLowerCase().includes(q)
      );
    }

    // User filter
    if (userFilter !== "all") {
      result = result.filter(e => e.editedBy === userFilter);
    }

    // Field filter
    if (fieldFilter !== "all") {
      result = result.filter(e => e.fieldName === fieldFilter);
    }

    // Action type filter
    if (actionFilter !== "all") {
      result = result.filter(e => e.actionType === actionFilter);
    }

    // Date from
    if (dateFrom) {
      const d = new Date(dateFrom);
      d.setHours(0, 0, 0, 0);
      result = result.filter(e => e.dateTime >= d);
    }

    // Date to
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      result = result.filter(e => e.dateTime <= d);
    }

    // Sort by date
    result.sort((a, b) => {
      const cmp = a.dateTime.getTime() - b.dateTime.getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [baseEntries, debouncedSearch, userFilter, fieldFilter, actionFilter, dateFrom, dateTo, sortDir]);

  // ── Pagination ────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    ALL_ACTION_TYPES.forEach(t => { byType[t] = 0; });
    baseEntries.forEach(e => { byType[e.actionType] = (byType[e.actionType] || 0) + 1; });
    return { total: baseEntries.length, byType };
  }, [baseEntries]);

  // ── Clear all filters ─────────────────────────────
  const clearAll = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setUserFilter("all");
    setFieldFilter("all");
    setActionFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  // ═══════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* ── Header (optional) ─────────────────────── */}
      {!compact && (
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="h-5 w-5 text-[#003B95]" />
          <h2 className="text-base text-[#111827]">
            {title || (providerId ? "Change History" : "Provider Audit Trail")}
          </h2>
          <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 ml-1">
            {stats.total} entries
          </Badge>
        </div>
      )}

      {/* ── Stats chips ───────────────────────────── */}
      {!compact && (
        <div className="flex flex-wrap gap-2">
          {ALL_ACTION_TYPES.map(t => {
            const count = stats.byType[t] || 0;
            if (count === 0) return null;
            const s = ACTION_TYPE_STYLES[t];
            return (
              <button
                key={t}
                onClick={() => {
                  setActionFilter(actionFilter === t ? "all" : t);
                  setShowFilters(true);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] transition-all",
                  actionFilter === t
                    ? `${s.bg} ${s.text} ${s.border} ring-1 ring-offset-1`
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300",
                )}
              >
                {t}
                <span className={cn(
                  "text-[10px] tabular-nums px-1 rounded-full",
                  actionFilter === t ? `${s.bg} ${s.text}` : "bg-gray-100 text-gray-500",
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Table card ────────────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* ── Entry count bar ─────────────────────── */}
        <div className="px-4 py-3 border-b bg-gray-50/50">
          <span className="text-xs text-gray-500">
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {/* ── Desktop Data Table ──────────────────── */}
        <div className="overflow-x-auto hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/30">
                <TableHead className="px-4 w-[44px]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">#</span>
                </TableHead>
                <TableHead className="px-4 min-w-[140px]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Edited By</span>
                </TableHead>
                {!providerId && (
                  <TableHead className="px-4 min-w-[140px]">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">Provider</span>
                  </TableHead>
                )}
                <TableHead className="px-4 min-w-[120px]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Field Name</span>
                </TableHead>
                <TableHead className="px-4 min-w-[130px]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Old Value</span>
                </TableHead>
                <TableHead className="px-4 min-w-[130px]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">New Value</span>
                </TableHead>
                <TableHead className="px-4 min-w-[140px]">
                  <button
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500 hover:text-[#003B95] transition-colors"
                    onClick={toggleSort}
                  >
                    Date & Time
                    {sortDir === "desc"
                      ? <ArrowDown className="h-3 w-3 text-[#003B95]" />
                      : <ArrowUp className="h-3 w-3 text-[#003B95]" />}
                  </button>
                </TableHead>
                <TableHead className="px-4 min-w-[110px]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Action Type</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={providerId ? 7 : 8} className="text-center py-14">
                    <ClipboardList className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No audit entries found.</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {activeCount > 0
                        ? "Adjust your filters or search query."
                        : "No changes have been recorded yet."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((entry, idx) => (
                  <TableRow
                    key={entry.id}
                    className={cn(
                      "group hover:bg-gray-50/50 transition-colors",
                      entry.actionType === "Delete" && "bg-red-50/10",
                      entry.actionType === "Create" && "bg-emerald-50/10",
                    )}
                  >
                    {/* # */}
                    <TableCell className="px-4 text-xs text-gray-400 tabular-nums">
                      {(safePage - 1) * pageSize + idx + 1}
                    </TableCell>

                    {/* Edited By */}
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0",
                          entry.editedBy === "System"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-[#003B95]/10 text-[#003B95]",
                        )}>
                          {entry.editedBy === "System" ? "S" : entry.editedBy.charAt(0)}
                        </div>
                        <span className="text-xs text-[#374151] truncate max-w-[100px]">
                          {entry.editedBy}
                        </span>
                      </div>
                    </TableCell>

                    {/* Provider (global view only) */}
                    {!providerId && (
                      <TableCell className="px-4">
                        <div>
                          <p className="text-xs text-[#374151] truncate max-w-[130px]">
                            {entry.providerName}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">{entry.providerId}</p>
                        </div>
                      </TableCell>
                    )}

                    {/* Field Name */}
                    <TableCell className="px-4">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-[#374151]">
                        {entry.fieldName}
                      </code>
                    </TableCell>

                    {/* Old Value */}
                    <TableCell className="px-4">
                      <ValueCell value={entry.oldValue} isNA={entry.oldValue === "N/A"} />
                    </TableCell>

                    {/* New Value */}
                    <TableCell className="px-4">
                      <ValueCell value={entry.newValue} />
                    </TableCell>

                    {/* Date & Time */}
                    <TableCell className="px-4">
                      <div>
                        <p className="text-xs text-[#111827] tabular-nums">
                          {format(entry.dateTime, "dd/MM/yyyy")}
                        </p>
                        <p className="text-[10px] text-gray-400 tabular-nums">
                          {format(entry.dateTime, "HH:mm:ss")}
                        </p>
                      </div>
                    </TableCell>

                    {/* Action Type */}
                    <TableCell className="px-4">
                      <ActionBadge type={entry.actionType} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Mobile card view ────────────────────── */}
        <div className="sm:hidden divide-y divide-gray-100">
          {paginated.length === 0 ? (
            <div className="text-center py-14 px-4">
              <ClipboardList className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No audit entries found.</p>
            </div>
          ) : (
            paginated.map(entry => (
              <div key={`m-${entry.id}`} className="px-4 py-3 space-y-2">
                {/* Row 1: user + action + date */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0",
                      entry.editedBy === "System"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-[#003B95]/10 text-[#003B95]",
                    )}>
                      {entry.editedBy === "System" ? "S" : entry.editedBy.charAt(0)}
                    </div>
                    <span className="text-xs text-[#374151] truncate">{entry.editedBy}</span>
                  </div>
                  <ActionBadge type={entry.actionType} />
                </div>

                {/* Provider (global view) */}
                {!providerId && (
                  <p className="text-[10px] text-gray-400">
                    {entry.providerName} <span className="font-mono">({entry.providerId})</span>
                  </p>
                )}

                {/* Row 2: field + values */}
                <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileEdit className="h-3 w-3 text-gray-400 shrink-0" />
                    <code className="text-[11px] text-[#374151]">{entry.fieldName}</code>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={cn("flex-1 truncate", entry.oldValue === "N/A" ? "text-gray-300 italic" : "text-gray-500")}>
                      {entry.oldValue}
                    </span>
                    <ArrowRightLeft className="h-3 w-3 text-gray-300 shrink-0" />
                    <span className="flex-1 truncate text-[#111827]">
                      {entry.newValue}
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <Clock className="h-3 w-3" />
                  {format(entry.dateTime, "dd/MM/yyyy HH:mm:ss")}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Pagination ──────────────────────────── */}
        <div className="px-4 py-3 border-t bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rows</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(s => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-gray-400 ml-1">
              {Math.min((safePage - 1) * pageSize + 1, filtered.length)}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (safePage <= 3) {
                pageNum = i + 1;
              } else if (safePage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = safePage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={safePage === pageNum ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 w-7 p-0 text-xs",
                    safePage === pageNum && "bg-[#003B95] text-white hover:bg-[#002d73]",
                  )}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}