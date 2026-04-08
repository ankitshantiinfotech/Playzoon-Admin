// ─── SCR-ADM-038: Reconciliation Mismatches ──────────────────────────────────
// Displays payment mismatches detected by the hourly reconciliation cron job.
// Admins can Acknowledge or Resolve mismatches. All monetary values in SAR.

import { useState, useMemo } from "react";
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
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Loader2,
  Eye,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { toast } from "sonner";

import type {
  ReconciliationMismatch,
  MismatchStatus,
  MismatchType,
  ResolutionCategory,
} from "./types";
import {
  MOCK_MISMATCHES,
  ALL_MISMATCH_TYPES,
  ALL_RESOLUTION_CATEGORIES,
  MISMATCH_TYPE_STYLES,
  MISMATCH_STATUS_STYLES,
  LAST_CRON_RUN,
} from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSAR(value: number): string {
  return `SAR ${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Constants ───────────────────────────────────────────────────────────────

type SortField =
  | "bookingId"
  | "expectedAmount"
  | "actualAmount"
  | "difference"
  | "gatewayReference"
  | "mismatchType"
  | "detectedAt"
  | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [10, 20, 50] as const;

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  count,
  colorClass,
  active,
  onClick,
}: {
  label: string;
  count: number;
  colorClass: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="button"
      aria-label={`${label}: ${count} mismatches. Click to filter.`}
      className={cn(
        "bg-white border rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-md cursor-pointer text-left w-full",
        active && "ring-2 ring-[#003B95] ring-offset-1",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          colorClass,
        )}
      >
        <span className="text-base font-bold">{count}</span>
      </div>
      <span className="text-sm font-medium text-[#374151]">{label}</span>
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ReconciliationPage() {
  // ── State (mutable mock data) ──────────────────────────────────────────────
  const [mismatches, setMismatches] =
    useState<ReconciliationMismatch[]>(MOCK_MISMATCHES);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Unresolved");
  const [mismatchTypeFilter, setMismatchTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("detectedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // ── Resolve Modal ──────────────────────────────────────────────────────────
  const [resolveTarget, setResolveTarget] =
    useState<ReconciliationMismatch | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveCategory, setResolveCategory] = useState<string>("");
  const [isResolving, setIsResolving] = useState(false);

  // ── View Resolution Popover ────────────────────────────────────────────────
  const [viewResolutionId, setViewResolutionId] = useState<string | null>(null);

  // ── Acknowledge loading state ──────────────────────────────────────────────
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // ── Alert banner dismiss ───────────────────────────────────────────────────
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // ── Summary counts ─────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const total = mismatches.length;
    const unresolved = mismatches.filter(
      (m) => m.status === "Unresolved",
    ).length;
    const acknowledged = mismatches.filter(
      (m) => m.status === "Acknowledged",
    ).length;
    const resolved = mismatches.filter((m) => m.status === "Resolved").length;
    return { total, unresolved, acknowledged, resolved };
  }, [mismatches]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return mismatches.filter((entry) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !entry.bookingId.toLowerCase().includes(q) &&
          !entry.gatewayReference.toLowerCase().includes(q) &&
          !String(entry.expectedAmount).includes(q) &&
          !String(entry.actualAmount).includes(q)
        ) {
          return false;
        }
      }
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (
        mismatchTypeFilter !== "all" &&
        entry.mismatchType !== mismatchTypeFilter
      )
        return false;
      if (dateFrom) {
        const d = new Date(dateFrom);
        d.setHours(0, 0, 0, 0);
        if (entry.detectedAt < d) return false;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        if (entry.detectedAt > d) return false;
      }
      return true;
    });
  }, [mismatches, search, statusFilter, mismatchTypeFilter, dateFrom, dateTo]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "bookingId":
          cmp = a.bookingId.localeCompare(b.bookingId);
          break;
        case "expectedAmount":
          cmp = a.expectedAmount - b.expectedAmount;
          break;
        case "actualAmount":
          cmp = a.actualAmount - b.actualAmount;
          break;
        case "difference":
          cmp = a.difference - b.difference;
          break;
        case "gatewayReference":
          cmp = a.gatewayReference.localeCompare(b.gatewayReference);
          break;
        case "mismatchType":
          cmp = a.mismatchType.localeCompare(b.mismatchType);
          break;
        case "detectedAt":
          cmp = a.detectedAt.getTime() - b.detectedAt.getTime();
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
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
      setSortDir(field === "detectedAt" ? "desc" : "asc");
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

  // ── Clear filters ──────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMismatchTypeFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "all" ||
    mismatchTypeFilter !== "all" ||
    !!dateFrom ||
    !!dateTo;

  // ── Acknowledge handler ────────────────────────────────────────────────────
  const handleAcknowledge = (entry: ReconciliationMismatch) => {
    setAcknowledgingId(entry.id);
    // Simulate API call
    setTimeout(() => {
      setMismatches((prev) =>
        prev.map((m) =>
          m.id === entry.id
            ? {
                ...m,
                status: "Acknowledged" as MismatchStatus,
                acknowledgedBy: "Current Admin",
                acknowledgedAt: new Date(),
              }
            : m,
        ),
      );
      setAcknowledgingId(null);
      toast.success(
        "Mismatch acknowledged. It remains in the list for resolution.",
      );
    }, 600);
  };

  // ── Resolve handler ────────────────────────────────────────────────────────
  const handleResolve = () => {
    if (
      !resolveTarget ||
      !resolveNotes ||
      resolveNotes.length < 10 ||
      !resolveCategory
    )
      return;
    setIsResolving(true);
    // Simulate API call
    setTimeout(() => {
      setMismatches((prev) =>
        prev.map((m) =>
          m.id === resolveTarget.id
            ? {
                ...m,
                status: "Resolved" as MismatchStatus,
                resolutionCategory: resolveCategory as ResolutionCategory,
                resolutionNotes: resolveNotes,
                resolvedBy: "Current Admin",
                resolvedAt: new Date(),
              }
            : m,
        ),
      );
      setIsResolving(false);
      setResolveTarget(null);
      setResolveNotes("");
      setResolveCategory("");
      toast.success("Mismatch resolved and recorded in the audit trail.");
    }, 800);
  };

  // ── Export CSV handler ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (sorted.length === 0) return;
    const headers = [
      "Booking ID",
      "Expected Amount (SAR)",
      "Actual Amount (SAR)",
      "Difference (SAR)",
      "Gateway Reference",
      "Mismatch Type",
      "Detected At (UTC)",
      "Status",
      "Resolution Category",
      "Resolution Notes",
      "Resolved By",
      "Resolved At (UTC)",
    ];
    const rows = sorted.map((entry) => [
      entry.bookingId,
      entry.expectedAmount.toFixed(2),
      entry.actualAmount.toFixed(2),
      entry.difference.toFixed(2),
      entry.gatewayReference,
      entry.mismatchType,
      format(entry.detectedAt, "dd MMM yyyy, HH:mm") + " UTC",
      entry.status,
      entry.resolutionCategory || "",
      entry.resolutionNotes
        ? `"${entry.resolutionNotes.replace(/"/g, '""')}"`
        : "",
      entry.resolvedBy || "",
      entry.resolvedAt
        ? format(entry.resolvedAt, "dd MMM yyyy, HH:mm") + " UTC"
        : "",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation-mismatches-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV export started. Your file will download shortly.");
  };

  // ── Page numbers ───────────────────────────────────────────────────────────
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
      <div>
        <nav className="text-xs text-[#6B7280] mb-1">
          <span>Admin</span>
          <span className="mx-1.5">&gt;</span>
          <span>Financial</span>
          <span className="mx-1.5">&gt;</span>
          <span className="text-[#111827] font-medium">Reconciliation</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] flex items-center gap-2.5">
          <ShieldAlert className="h-6 w-6 text-[#003B95]" />
          Reconciliation Mismatches
        </h1>
      </div>

      {/* ── Alert Summary Banner ─────────────────────────────────── */}
      {counts.unresolved > 0 ? (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            "rounded-xl border p-4 flex items-center gap-3",
            counts.unresolved > 10
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200",
          )}
        >
          <AlertTriangle
            className={cn(
              "h-5 w-5 shrink-0",
              counts.unresolved > 10 ? "text-red-500" : "text-amber-500",
            )}
          />
          <div className="flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                counts.unresolved > 10 ? "text-red-700" : "text-amber-700",
              )}
            >
              {counts.unresolved} unresolved mismatch
              {counts.unresolved !== 1 ? "es" : ""} require attention.
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Last reconciliation run:{" "}
              {format(LAST_CRON_RUN, "dd MMM yyyy, HH:mm")} UTC
            </p>
          </div>
        </div>
      ) : (
        !bannerDismissed && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-700">
                All mismatches have been resolved.
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Last reconciliation run:{" "}
                {format(LAST_CRON_RUN, "dd MMM yyyy, HH:mm")} UTC
              </p>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 rounded hover:bg-emerald-100 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4 text-emerald-400" />
            </button>
          </div>
        )
      )}

      {/* ── Summary Stat Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total"
          count={counts.total}
          colorClass="bg-gray-100 text-gray-700"
          active={statusFilter === "all"}
          onClick={() => {
            setStatusFilter("all");
            setPage(1);
          }}
        />
        <StatCard
          label="Unresolved"
          count={counts.unresolved}
          colorClass="bg-red-50 text-red-600"
          active={statusFilter === "Unresolved"}
          onClick={() => {
            setStatusFilter("Unresolved");
            setPage(1);
          }}
        />
        <StatCard
          label="Acknowledged"
          count={counts.acknowledged}
          colorClass="bg-amber-50 text-amber-700"
          active={statusFilter === "Acknowledged"}
          onClick={() => {
            setStatusFilter("Acknowledged");
            setPage(1);
          }}
        />
        <StatCard
          label="Resolved"
          count={counts.resolved}
          colorClass="bg-emerald-50 text-emerald-700"
          active={statusFilter === "Resolved"}
          onClick={() => {
            setStatusFilter("Resolved");
            setPage(1);
          }}
        />
      </div>

      {/* ── Filter / Search Bar ───────────────────────────────────── */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[260px]" role="search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Search by booking ID, gateway reference, or amount..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                aria-label="Search reconciliation mismatches"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1 min-w-[150px]">
            <label className="text-[11px] text-[#6B7280]">Status</label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10" aria-label="Filter by status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Unresolved">Unresolved</SelectItem>
                <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mismatch Type Filter */}
          <div className="space-y-1 min-w-[180px]">
            <label className="text-[11px] text-[#6B7280]">Mismatch Type</label>
            <Select
              value={mismatchTypeFilter}
              onValueChange={(v) => {
                setMismatchTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10"
                aria-label="Filter by mismatch type"
              >
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ALL_MISMATCH_TYPES.map((t) => (
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
          {hasActiveFilters && (
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

      {/* ── Export + Count ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          Showing{" "}
          {sorted.length > 0
            ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)}`
            : "0"}{" "}
          of {sorted.length} mismatches
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={sorted.length === 0}
              className="gap-2"
              aria-label="Export reconciliation mismatches as CSV"
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
                <TableHead className="px-4 w-[130px]">
                  <button
                    onClick={() => handleSort("bookingId")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Booking ID <SortIcon field="bookingId" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[130px]">
                  <button
                    onClick={() => handleSort("expectedAmount")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Expected Amount <SortIcon field="expectedAmount" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[130px]">
                  <button
                    onClick={() => handleSort("actualAmount")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Actual Amount <SortIcon field="actualAmount" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[120px]">
                  <button
                    onClick={() => handleSort("difference")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Difference <SortIcon field="difference" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[150px]">
                  <button
                    onClick={() => handleSort("gatewayReference")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Gateway Ref <SortIcon field="gatewayReference" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[150px]">
                  <button
                    onClick={() => handleSort("mismatchType")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Mismatch Type <SortIcon field="mismatchType" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[150px]">
                  <button
                    onClick={() => handleSort("detectedAt")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Detected <SortIcon field="detectedAt" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[120px]">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Status <SortIcon field="status" />
                  </button>
                </TableHead>
                <TableHead className="px-4 w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length > 0 ? (
                paged.map((entry, idx) => {
                  const isUnresolved = entry.status === "Unresolved";
                  const diffLabel =
                    entry.difference < 0
                      ? `Underpayment of ${formatSAR(entry.difference)}`
                      : entry.difference > 0
                        ? `Overpayment of ${formatSAR(entry.difference)}`
                        : "No amount difference";

                  return (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        "transition-colors",
                        isUnresolved && "border-l-2 border-l-red-400",
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/40",
                      )}
                    >
                      {/* Booking ID */}
                      <TableCell className="px-4">
                        <span
                          className="text-xs font-medium text-[#003B95] hover:underline cursor-pointer"
                          aria-label={`View booking ${entry.bookingId}`}
                        >
                          {entry.bookingId}
                        </span>
                      </TableCell>

                      {/* Expected Amount */}
                      <TableCell className="px-4">
                        <span className="text-xs text-[#111827] tabular-nums">
                          {formatSAR(entry.expectedAmount)}
                        </span>
                      </TableCell>

                      {/* Actual Amount */}
                      <TableCell className="px-4">
                        <span className="text-xs text-[#111827] tabular-nums">
                          {formatSAR(entry.actualAmount)}
                        </span>
                      </TableCell>

                      {/* Difference */}
                      <TableCell className="px-4">
                        <span
                          className={cn(
                            "text-xs tabular-nums font-medium",
                            entry.difference !== 0
                              ? "text-red-600"
                              : "text-[#6B7280]",
                          )}
                          aria-label={diffLabel}
                        >
                          {entry.difference > 0 ? "+" : ""}
                          {formatSAR(entry.difference)}
                          {entry.difference < 0 && (
                            <span className="text-[10px] ml-0.5">
                              ({entry.difference > 0 ? "+" : "-"})
                            </span>
                          )}
                        </span>
                      </TableCell>

                      {/* Gateway Reference */}
                      <TableCell className="px-4">
                        <span
                          className="text-xs font-medium text-[#003B95] hover:underline cursor-pointer"
                          aria-label={`View payment transaction ${entry.gatewayReference}`}
                        >
                          {entry.gatewayReference}
                        </span>
                      </TableCell>

                      {/* Mismatch Type */}
                      <TableCell className="px-4">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-medium",
                            MISMATCH_TYPE_STYLES[entry.mismatchType],
                          )}
                          aria-label={`Mismatch type: ${entry.mismatchType}`}
                        >
                          {entry.mismatchType}
                        </Badge>
                      </TableCell>

                      {/* Detected */}
                      <TableCell className="px-4">
                        <span className="text-xs text-[#6B7280] tabular-nums">
                          {format(entry.detectedAt, "dd MMM yyyy, HH:mm")} UTC
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-4">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-medium",
                            MISMATCH_STATUS_STYLES[entry.status],
                          )}
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-4">
                        <div className="flex items-center gap-2">
                          {entry.status === "Unresolved" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-[#6B7280] hover:text-[#374151]"
                                disabled={acknowledgingId === entry.id}
                                onClick={() => handleAcknowledge(entry)}
                                aria-label={`Acknowledge mismatch for booking ${entry.bookingId}`}
                              >
                                {acknowledgingId === entry.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : null}
                                Acknowledge
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-[#003B95] hover:bg-[#002a6b]"
                                onClick={() => {
                                  setResolveTarget(entry);
                                  setResolveNotes("");
                                  setResolveCategory("");
                                }}
                                aria-label={`Resolve mismatch for booking ${entry.bookingId}`}
                              >
                                Resolve
                              </Button>
                            </>
                          )}
                          {entry.status === "Acknowledged" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-[#003B95] hover:bg-[#002a6b]"
                              onClick={() => {
                                setResolveTarget(entry);
                                setResolveNotes("");
                                setResolveCategory("");
                              }}
                              aria-label={`Resolve mismatch for booking ${entry.bookingId}`}
                            >
                              Resolve
                            </Button>
                          )}
                          {entry.status === "Resolved" && (
                            <Popover
                              open={viewResolutionId === entry.id}
                              onOpenChange={(open) =>
                                setViewResolutionId(open ? entry.id : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-[#003B95] hover:text-[#002a6b]"
                                  aria-label={`View resolution details for booking ${entry.bookingId}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Resolution
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-4" align="end">
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-[#111827]">
                                    Resolution Details
                                  </h4>
                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <span className="text-[#6B7280]">
                                        Category:
                                      </span>
                                      <span className="ml-2 font-medium text-[#374151]">
                                        {entry.resolutionCategory}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[#6B7280]">
                                        Notes:
                                      </span>
                                      <p className="mt-1 text-[#374151] leading-relaxed">
                                        {entry.resolutionNotes}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[#6B7280]">
                                        Resolved By:
                                      </span>
                                      <span className="ml-2 font-medium text-[#374151]">
                                        {entry.resolvedBy}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[#6B7280]">
                                        Resolved At:
                                      </span>
                                      <span className="ml-2 text-[#374151]">
                                        {entry.resolvedAt
                                          ? format(
                                              entry.resolvedAt,
                                              "dd MMM yyyy, HH:mm",
                                            ) + " UTC"
                                          : "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <FileWarning className="h-7 w-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#374151]">
                          No Reconciliation Mismatches
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          {hasActiveFilters
                            ? "No mismatches match your current filters."
                            : "The reconciliation system has not detected any payment discrepancies."}
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

      {/* ── Resolve Modal ─────────────────────────────────────────── */}
      <Dialog
        open={!!resolveTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null);
            setResolveNotes("");
            setResolveCategory("");
          }
        }}
      >
        <DialogContent
          className="max-w-lg"
          aria-label="Resolve reconciliation mismatch"
        >
          <DialogHeader>
            <DialogTitle>Resolve Reconciliation Mismatch</DialogTitle>
            <DialogDescription>
              Review the mismatch details and provide resolution information.
            </DialogDescription>
          </DialogHeader>

          {resolveTarget && (
            <div className="space-y-5">
              {/* Mismatch Summary */}
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Booking ID:</span>
                  <span className="font-medium text-[#111827]">
                    {resolveTarget.bookingId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Expected Amount:</span>
                  <span className="font-medium text-[#111827]">
                    {formatSAR(resolveTarget.expectedAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Actual Amount:</span>
                  <span className="font-medium text-[#111827]">
                    {formatSAR(resolveTarget.actualAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Difference:</span>
                  <span
                    className={cn(
                      "font-medium",
                      resolveTarget.difference !== 0
                        ? "text-red-600"
                        : "text-[#111827]",
                    )}
                  >
                    {resolveTarget.difference > 0 ? "+" : ""}
                    {formatSAR(resolveTarget.difference)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Mismatch Type:</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      MISMATCH_TYPE_STYLES[resolveTarget.mismatchType],
                    )}
                  >
                    {resolveTarget.mismatchType}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Detected:</span>
                  <span className="text-[#111827]">
                    {format(resolveTarget.detectedAt, "dd MMM yyyy, HH:mm")} UTC
                  </span>
                </div>
              </div>

              {/* Resolution Category */}
              <div className="space-y-2">
                <label
                  htmlFor="resolution-category"
                  className="text-sm font-medium text-[#374151]"
                >
                  Resolution Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={resolveCategory}
                  onValueChange={setResolveCategory}
                >
                  <SelectTrigger
                    id="resolution-category"
                    className="w-full"
                    aria-required="true"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_RESOLUTION_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {resolveCategory === "" && resolveNotes.length > 0 && (
                  <p className="text-xs text-red-500">
                    Please select a resolution category.
                  </p>
                )}
              </div>

              {/* Resolution Notes */}
              <div className="space-y-2">
                <label
                  htmlFor="resolution-notes"
                  className="text-sm font-medium text-[#374151]"
                >
                  Resolution Notes <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="resolution-notes"
                  placeholder="Describe how this mismatch was resolved..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="resize-none"
                  aria-required="true"
                  aria-describedby="notes-hint"
                />
                <div className="flex items-center justify-between">
                  <div id="notes-hint">
                    {resolveNotes.length > 0 && resolveNotes.length < 10 && (
                      <p className="text-xs text-red-500">
                        Resolution notes must be at least 10 characters.
                      </p>
                    )}
                    {resolveNotes.length === 0 && (
                      <p className="text-xs text-[#9CA3AF]">
                        At least 10 characters required.
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {resolveNotes.length}/1000
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveTarget(null);
                setResolveNotes("");
                setResolveCategory("");
              }}
              disabled={isResolving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={
                isResolving || !resolveCategory || resolveNotes.length < 10
              }
              className="bg-[#003B95] hover:bg-[#002a6b]"
            >
              {isResolving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
