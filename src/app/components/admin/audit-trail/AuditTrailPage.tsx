// ─── SCR-ADM-037: Audit Trail ─────────────────────────────────────────────────
// Centralised, read-only audit log of all administrative actions performed on the
// Playzoon platform.  Supports filtering, sorting, pagination, CSV export, and
// deep-linking with pre-applied entity filters.

import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { format } from "date-fns";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
  ShieldCheck,
  Download,
  ChevronDown,
  FileText,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { toast } from "sonner";

import type {
  AuditLogEntry,
  AuditAction,
  AuditEntityType,
} from "./audit-types";
import {
  MOCK_AUDIT_LOGS,
  ALL_ACTIONS,
  ALL_ENTITY_TYPES,
  ADMIN_USERS,
  getActionCategory,
  ACTION_BADGE_STYLES,
} from "./audit-types";

// ─── Constants ───────────────────────────────────────────────────────────────

type SortField =
  | "timestamp"
  | "adminUser"
  | "action"
  | "entityType"
  | "entityId"
  | "ipAddress";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [25, 50, 100] as const;

// ─── Main Component ──────────────────────────────────────────────────────────

export function AuditTrailPage() {
  const [searchParams] = useSearchParams();

  // Deep-link filter initialization
  const deepEntityType = searchParams.get("entityType") || "";
  const deepEntityId = searchParams.get("entityId") || "";

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState(deepEntityId);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [adminUserFilter, setAdminUserFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>(
    deepEntityType || "all",
  );
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // ── Expanded details rows ──────────────────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // ── Active filter chips ────────────────────────────────────────────────────
  const activeFilters: {
    key: string;
    label: string;
    value: string;
    clear: () => void;
  }[] = [];
  if (actionFilter !== "all") {
    activeFilters.push({
      key: "action",
      label: "Action Type",
      value: actionFilter,
      clear: () => {
        setActionFilter("all");
        setPage(1);
      },
    });
  }
  if (adminUserFilter !== "all") {
    activeFilters.push({
      key: "adminUser",
      label: "Admin User",
      value: adminUserFilter,
      clear: () => {
        setAdminUserFilter("all");
        setPage(1);
      },
    });
  }
  if (entityTypeFilter !== "all") {
    activeFilters.push({
      key: "entityType",
      label: "Entity Type",
      value: entityTypeFilter,
      clear: () => {
        setEntityTypeFilter("all");
        setPage(1);
      },
    });
  }
  if (dateFrom) {
    activeFilters.push({
      key: "dateFrom",
      label: "From",
      value: format(dateFrom, "MMM d, yyyy"),
      clear: () => {
        setDateFrom(undefined);
        setPage(1);
      },
    });
  }
  if (dateTo) {
    activeFilters.push({
      key: "dateTo",
      label: "To",
      value: format(dateTo, "MMM d, yyyy"),
      clear: () => {
        setDateTo(undefined);
        setPage(1);
      },
    });
  }

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter((entry) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !entry.adminUser.toLowerCase().includes(q) &&
          !entry.entityId.toLowerCase().includes(q) &&
          !entry.details.toLowerCase().includes(q) &&
          !entry.action.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (actionFilter !== "all" && entry.action !== actionFilter) return false;
      if (adminUserFilter !== "all" && entry.adminUser !== adminUserFilter)
        return false;
      if (entityTypeFilter !== "all" && entry.entityType !== entityTypeFilter)
        return false;
      if (dateFrom) {
        const d = new Date(dateFrom);
        d.setHours(0, 0, 0, 0);
        if (entry.timestamp < d) return false;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        if (entry.timestamp > d) return false;
      }
      return true;
    });
  }, [
    search,
    actionFilter,
    adminUserFilter,
    entityTypeFilter,
    dateFrom,
    dateTo,
  ]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "timestamp":
          cmp = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case "adminUser":
          cmp = a.adminUser.localeCompare(b.adminUser);
          break;
        case "action":
          cmp = a.action.localeCompare(b.action);
          break;
        case "entityType":
          cmp = a.entityType.localeCompare(b.entityType);
          break;
        case "entityId":
          cmp = a.entityId.localeCompare(b.entityId);
          break;
        case "ipAddress":
          cmp = a.ipAddress.localeCompare(b.ipAddress);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Sort handler ───────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "timestamp" ? "desc" : "asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-[#003B95]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#003B95]" />
    );
  };

  // ── Toggle detail expansion ────────────────────────────────────────────────
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Clear all filters ──────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setAdminUserFilter("all");
    setEntityTypeFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  // ── Export CSV handler ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (sorted.length === 0) return;
    if (sorted.length > 10000) {
      toast.warning("Large export in progress. This may take a moment.");
    }
    const headers = [
      "Timestamp (UTC)",
      "Admin User",
      "Admin Email",
      "Action",
      "Entity Type",
      "Entity ID",
      "Details",
      "IP Address",
    ];
    const rows = sorted.map((entry) => [
      format(entry.timestamp, "dd MMM yyyy, HH:mm:ss") + " UTC",
      entry.adminUser,
      entry.adminEmail,
      entry.action,
      entry.entityType,
      entry.entityId,
      `"${entry.details.replace(/"/g, '""')}"`,
      entry.ipAddress,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV export started. Your file will download shortly.");
  };

  // ── Truncate details helper ────────────────────────────────────────────────
  const DETAIL_TRUNCATE = 80;

  // ── Pagination page numbers ────────────────────────────────────────────────
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <nav className="text-xs text-[#6B7280] mb-1">
            <span>Admin</span>
            <span className="mx-1.5">&gt;</span>
            <span>Operations</span>
            <span className="mx-1.5">&gt;</span>
            <span className="text-[#111827] font-medium">Audit Trail</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-[#003B95]" />
            Audit Trail
          </h1>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[260px]" role="search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Search by admin name, entity ID, or action details..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                aria-label="Search audit trail"
              />
            </div>
          </div>

          {/* Action Type Filter */}
          <div className="space-y-1 min-w-[160px]">
            <label className="text-[11px] text-[#6B7280]">Action Type</label>
            <Select
              value={actionFilter}
              onValueChange={(v) => {
                setActionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10"
                aria-label="Filter by action type"
              >
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ALL_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin User Filter */}
          <div className="space-y-1 min-w-[170px]">
            <label className="text-[11px] text-[#6B7280]">Admin User</label>
            <Select
              value={adminUserFilter}
              onValueChange={(v) => {
                setAdminUserFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10" aria-label="Filter by admin user">
                <SelectValue placeholder="All Admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {ADMIN_USERS.map((u) => (
                  <SelectItem key={u.email} value={u.name}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Type Filter */}
          <div className="space-y-1 min-w-[170px]">
            <label className="text-[11px] text-[#6B7280]">Entity Type</label>
            <Select
              value={entityTypeFilter}
              onValueChange={(v) => {
                setEntityTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10"
                aria-label="Filter by entity type"
              >
                <SelectValue placeholder="All Entity Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                {ALL_ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-1">
            <label className="text-[11px] text-[#6B7280]">From</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 gap-2 text-sm min-w-[130px] justify-start",
                    !dateFrom && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateFrom ? format(dateFrom, "MMM d") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(d) => {
                    setDateFrom(d);
                    setPage(1);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="text-[11px] text-[#6B7280]">To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 gap-2 text-sm min-w-[130px] justify-start",
                    !dateTo && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateTo ? format(dateTo, "MMM d") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(d) => {
                    setDateTo(d);
                    setPage(1);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filters */}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-xs text-red-500 hover:text-red-700 h-10"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* ── Active Filter Chips ──────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="list">
          {activeFilters.map((f) => (
            <div
              key={f.key}
              role="listitem"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700"
            >
              <span className="font-medium">{f.label}:</span>
              <span>{f.value}</span>
              <button
                onClick={f.clear}
                className="ml-0.5 p-0.5 rounded-full hover:bg-blue-100 transition-colors"
                aria-label={`Remove ${f.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Export + Result Count ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          Showing{" "}
          {sorted.length > 0
            ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)}`
            : "0"}{" "}
          of {sorted.length} entries
          {activeFilters.length > 0 && " (filtered)"}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={sorted.length === 0}
              className="gap-2"
              aria-label="Export audit trail as CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </TooltipTrigger>
          {sorted.length === 0 && (
            <TooltipContent>No data to export.</TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* ── Data Table ───────────────────────────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table role="table">
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="px-4 w-[170px]">
                  <button
                    onClick={() => handleSort("timestamp")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Timestamp (UTC)
                    <SortIcon field="timestamp" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[160px]">
                  <button
                    onClick={() => handleSort("adminUser")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Admin User
                    <SortIcon field="adminUser" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[140px]">
                  <button
                    onClick={() => handleSort("action")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Action
                    <SortIcon field="action" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[140px]">
                  <button
                    onClick={() => handleSort("entityType")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Entity Type
                    <SortIcon field="entityType" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[130px]">
                  <button
                    onClick={() => handleSort("entityId")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Entity ID
                    <SortIcon field="entityId" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[280px]">Details</TableHead>
                <TableHead className="px-4 w-[130px]">
                  <button
                    onClick={() => handleSort("ipAddress")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    IP Address
                    <SortIcon field="ipAddress" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length > 0 ? (
                paged.map((entry, idx) => {
                  const actionCat = getActionCategory(entry.action);
                  const badgeStyle = ACTION_BADGE_STYLES[actionCat];
                  const isExpanded = expandedRows.has(entry.id);
                  const isLongDetail = entry.details.length > DETAIL_TRUNCATE;

                  return (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        "transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/40",
                      )}
                    >
                      {/* Timestamp */}
                      <TableCell className="px-4">
                        <div>
                          <p className="text-xs text-[#111827] tabular-nums">
                            {format(entry.timestamp, "dd MMM yyyy, HH:mm:ss")}{" "}
                            UTC
                          </p>
                        </div>
                      </TableCell>

                      {/* Admin User */}
                      <TableCell className="px-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#374151]">
                            {entry.adminUser}
                          </p>
                          <p className="text-[10px] text-[#9CA3AF] truncate">
                            {entry.adminEmail}
                          </p>
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="px-4">
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] font-medium", badgeStyle)}
                          aria-label={`Action: ${entry.action}`}
                        >
                          {entry.action}
                        </Badge>
                      </TableCell>

                      {/* Entity Type */}
                      <TableCell className="px-4">
                        <span className="text-xs text-[#374151]">
                          {entry.entityType}
                        </span>
                      </TableCell>

                      {/* Entity ID */}
                      <TableCell className="px-4">
                        {entry.entityDeleted ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="text-xs text-[#9CA3AF] cursor-default"
                                aria-label={`Entity ${entry.entityId} (deleted)`}
                              >
                                {entry.entityId}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Entity has been deleted.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span
                            className="text-xs font-medium text-[#003B95] hover:underline cursor-pointer"
                            aria-label={`View entity ${entry.entityId}`}
                          >
                            {entry.entityId}
                          </span>
                        )}
                      </TableCell>

                      {/* Details */}
                      <TableCell className="px-4">
                        <div className="text-xs text-[#6B7280]">
                          {isLongDetail && !isExpanded ? (
                            <>
                              <span>
                                {entry.details.slice(0, DETAIL_TRUNCATE)}...
                              </span>
                              <button
                                onClick={() => toggleExpand(entry.id)}
                                className="ml-1 text-[#003B95] hover:underline font-medium"
                                aria-expanded="false"
                                aria-controls={`detail-${entry.id}`}
                              >
                                Show more
                              </button>
                            </>
                          ) : isLongDetail && isExpanded ? (
                            <>
                              <span id={`detail-${entry.id}`}>
                                {entry.details}
                              </span>
                              <button
                                onClick={() => toggleExpand(entry.id)}
                                className="ml-1 text-[#003B95] hover:underline font-medium"
                                aria-expanded="true"
                                aria-controls={`detail-${entry.id}`}
                              >
                                Show less
                              </button>
                            </>
                          ) : (
                            <span>{entry.details}</span>
                          )}
                        </div>
                      </TableCell>

                      {/* IP Address */}
                      <TableCell className="px-4">
                        <code className="text-xs text-[#6B7280] font-mono">
                          {entry.ipAddress}
                        </code>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <FileText className="h-7 w-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#374151]">
                          No Audit Entries Found
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          {activeFilters.length > 0 || search
                            ? "No audit trail entries match your current filters."
                            : "No admin actions have been recorded yet."}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────── */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
            <div className="flex items-center gap-3">
              <p className="text-xs text-[#9CA3AF]">
                Page {safePage} of {totalPages} &middot; {sorted.length} total
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#9CA3AF]">Show</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1 text-xs text-[#9CA3AF]"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === safePage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-7 w-7 p-0 text-xs",
                      p === safePage && "bg-[#003B95] hover:bg-[#002a6b]",
                    )}
                  >
                    {p}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
