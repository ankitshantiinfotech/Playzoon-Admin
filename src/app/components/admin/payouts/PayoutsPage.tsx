// ─── SCR-ADM-034: Payout Management List ─────────────────────────────────────
// Comprehensive payout request list. Statuses: Pending, Processing,
// Partially Paid, Settled, Rejected. SAR currency. Bulk actions.
// Row-selectable with bulk Approve/Reject/Mark Settled.

import { useState, useMemo, useCallback, type ElementType } from "react";
import { useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Banknote,
  Building2,
  GraduationCap,
  Users,
  Loader2,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import type {
  PayoutRequest,
  PayoutStatus,
  PayoutProviderType,
  PayoutSummaryStat,
} from "./types";
import { PAYOUT_STATUSES, PAYOUT_PROVIDER_TYPES } from "./types";
import { MOCK_PAYOUT_REQUESTS, computePayoutStats } from "./mockData";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50];
type SortField =
  | "requestId"
  | "providerName"
  | "providerType"
  | "requestedAmount"
  | "walletBalance"
  | "status"
  | "submissionDate";
type SortDir = "asc" | "desc";

const MIN_PAYOUT_THRESHOLD = 500; // SAR

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PayoutStatus,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    cardBg: string;
    cardBorder: string;
  }
> = {
  Pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    cardBg: "bg-amber-50",
    cardBorder: "border-amber-200",
  },
  Processing: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    cardBg: "bg-blue-50",
    cardBorder: "border-blue-200",
  },
  "Partially Paid": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    cardBg: "bg-amber-50",
    cardBorder: "border-amber-200",
  },
  Settled: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    cardBg: "bg-emerald-50",
    cardBorder: "border-emerald-200",
  },
  Rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    cardBg: "bg-red-50",
    cardBorder: "border-red-200",
  },
};

const STAT_CARD_ICONS: Record<PayoutStatus, ElementType> = {
  Pending: Clock,
  Processing: Loader2,
  "Partially Paid": CreditCard,
  Settled: CheckCircle,
  Rejected: XCircle,
};

// ─── Provider Type Config ────────────────────────────────────────────────────

const PROVIDER_CONFIG: Record<
  PayoutProviderType,
  { icon: ElementType; bg: string; text: string; border: string }
> = {
  "Facility Provider": {
    icon: Building2,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  "Training Provider": {
    icon: GraduationCap,
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  Coach: {
    icon: Users,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number): string {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProviderTypeBadge({ type }: { type: PayoutProviderType }) {
  const cfg = PROVIDER_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] gap-1 border shrink-0",
        cfg.bg,
        cfg.text,
        cfg.border,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {type}
    </Badge>
  );
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] gap-1.5 border shrink-0",
        cfg.bg,
        cfg.text,
        cfg.border,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      {status}
    </Badge>
  );
}

function BankStatusBadge({ status }: { status: "Approved" | "Not Approved" }) {
  const isApproved = status === "Approved";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "text-[11px] border shrink-0",
            isApproved
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200",
          )}
          aria-label={`Bank account status: ${status}`}
        >
          {status}
        </Badge>
      </TooltipTrigger>
      {!isApproved && (
        <TooltipContent>
          This provider's bank account is not approved. Payout cannot be
          processed.
        </TooltipContent>
      )}
    </Tooltip>
  );
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
  return sortDir === "asc" ? (
    <ArrowUp className="h-3 w-3 text-[#003B95]" />
  ) : (
    <ArrowDown className="h-3 w-3 text-[#003B95]" />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PayoutsPage() {
  const navigate = useNavigate();

  // Data
  const [payouts, setPayouts] = useState<PayoutRequest[]>(MOCK_PAYOUT_REQUESTS);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProviderType, setFilterProviderType] = useState("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");

  // Sort
  const [sortField, setSortField] = useState<SortField>("submissionDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // UI state
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    "approve" | "reject" | "settle" | null
  >(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Summary stats
  const summaryStats = useMemo(() => computePayoutStats(payouts), [payouts]);

  // Has active filters
  const hasActiveFilters =
    search !== "" ||
    filterStatus !== "all" ||
    filterProviderType !== "all" ||
    filterDateStart !== "" ||
    filterDateEnd !== "";

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterStatus("all");
    setFilterProviderType("all");
    setFilterDateStart("");
    setFilterDateEnd("");
    setPage(1);
  }, []);

  // Filtered & sorted data
  const filteredPayouts = useMemo(() => {
    let data = [...payouts];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.providerName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      data = data.filter((r) => r.status === filterStatus);
    }

    // Provider type filter
    if (filterProviderType !== "all") {
      data = data.filter((r) => r.providerType === filterProviderType);
    }

    // Date range filter
    if (filterDateStart) {
      data = data.filter((r) => r.submissionDate >= filterDateStart);
    }
    if (filterDateEnd) {
      const endDate = filterDateEnd + "T23:59:59Z";
      data = data.filter((r) => r.submissionDate <= endDate);
    }

    // Sort
    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "requestId":
          cmp = a.id.localeCompare(b.id);
          break;
        case "providerName":
          cmp = a.providerName.localeCompare(b.providerName);
          break;
        case "providerType":
          cmp = a.providerType.localeCompare(b.providerType);
          break;
        case "requestedAmount":
          cmp = a.requestedAmount - b.requestedAmount;
          break;
        case "walletBalance":
          cmp = a.walletBalance - b.walletBalance;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "submissionDate":
          cmp = a.submissionDate.localeCompare(b.submissionDate);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [
    payouts,
    search,
    filterStatus,
    filterProviderType,
    filterDateStart,
    filterDateEnd,
    sortField,
    sortDir,
  ]);

  // Pagination
  const totalItems = filteredPayouts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedPayouts = filteredPayouts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  // Selection
  const allPageSelected =
    pagedPayouts.length > 0 && pagedPayouts.every((p) => selectedIds.has(p.id));

  const toggleAll = useCallback(() => {
    if (allPageSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedPayouts.map((p) => p.id)));
    }
  }, [allPageSelected, pagedPayouts]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Selected rows details
  const selectedPayouts = useMemo(
    () => payouts.filter((p) => selectedIds.has(p.id)),
    [payouts, selectedIds],
  );

  const allSelectedPending =
    selectedPayouts.length > 0 &&
    selectedPayouts.every((p) => p.status === "Pending");
  const allSelectedProcessingOrPartial =
    selectedPayouts.length > 0 &&
    selectedPayouts.every(
      (p) => p.status === "Processing" || p.status === "Partially Paid",
    );
  const allSelectedHaveApprovedBank =
    selectedPayouts.length > 0 &&
    selectedPayouts.every((p) => p.bankStatus === "Approved");
  const hasUniformStatus =
    selectedPayouts.length > 0 &&
    selectedPayouts.every((p) => p.status === selectedPayouts[0].status);

  // Bulk actions
  const handleBulkApprove = useCallback(() => {
    setBulkAction("approve");
    setBulkConfirmOpen(true);
  }, []);

  const handleBulkReject = useCallback(() => {
    setBulkAction("reject");
    setRejectReason("");
    setRejectReasonError("");
    setBulkConfirmOpen(true);
  }, []);

  const handleBulkSettle = useCallback(() => {
    setBulkAction("settle");
    setBulkConfirmOpen(true);
  }, []);

  const handleConfirmBulk = useCallback(() => {
    if (bulkAction === "reject") {
      if (rejectReason.trim().length < 10) {
        setRejectReasonError(
          "Rejection reason must be at least 10 characters.",
        );
        return;
      }
    }

    setIsBulkProcessing(true);
    setTimeout(() => {
      const ids = selectedIds;
      const count = ids.size;

      if (bulkAction === "approve") {
        setPayouts((prev) =>
          prev.map((p) =>
            ids.has(p.id) ? { ...p, status: "Processing" as PayoutStatus } : p,
          ),
        );
        toast.success(`${count} payout(s) approved successfully.`);
      } else if (bulkAction === "reject") {
        setPayouts((prev) =>
          prev.map((p) =>
            ids.has(p.id) ? { ...p, status: "Rejected" as PayoutStatus } : p,
          ),
        );
        toast.success(
          `${count} payout(s) rejected. Providers have been notified.`,
        );
      } else if (bulkAction === "settle") {
        setPayouts((prev) =>
          prev.map((p) =>
            ids.has(p.id) ? { ...p, status: "Settled" as PayoutStatus } : p,
          ),
        );
        toast.success(`${count} payout(s) marked as settled.`);
      }

      setIsBulkProcessing(false);
      setBulkConfirmOpen(false);
      setBulkAction(null);
      setSelectedIds(new Set());
      setRejectReason("");
    }, 600);
  }, [bulkAction, selectedIds, rejectReason]);

  const handleExport = useCallback((type: "csv" | "xls") => {
    setExportOpen(false);
    toast.success("Export started. Your file will download shortly.");
  }, []);

  const handleStatCardClick = useCallback((status: PayoutStatus) => {
    setFilterStatus(status);
    setPage(1);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div>
        <nav className="text-xs text-gray-500 mb-1">
          <span
            className="hover:text-[#003B95] cursor-pointer"
            onClick={() => navigate("/")}
          >
            Admin
          </span>
          <span className="mx-1.5">/</span>
          <span className="text-gray-400">Financial</span>
          <span className="mx-1.5">/</span>
          <span className="text-gray-900">Payouts</span>
        </nav>
        <h1 className="text-2xl font-bold text-[#111827]">Payout Management</h1>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-5 gap-4">
        {summaryStats.map((stat) => {
          const cfg = STATUS_CONFIG[stat.status];
          const Icon = STAT_CARD_ICONS[stat.status];
          const isActive = filterStatus === stat.status;

          return (
            <button
              key={stat.status}
              type="button"
              className={cn(
                "bg-white border rounded-xl p-4 text-left transition-all hover:shadow-md cursor-pointer",
                isActive && `border-2 ${cfg.cardBorder}`,
              )}
              onClick={() => handleStatCardClick(stat.status)}
              role="button"
              aria-label={`${stat.status}: ${stat.count} payouts totaling ${fmtCurrency(stat.totalAmount)}. Click to filter.`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    cfg.text,
                  )}
                >
                  {stat.status}
                </span>
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg",
                    cfg.bg,
                  )}
                >
                  <Icon className={cn("h-4 w-4", cfg.text)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {stat.count}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                {fmtCurrency(stat.totalAmount)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter / Search row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[260px] max-w-sm" role="search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by provider name, request ID, or bank name..."
              className="pl-9 text-sm h-10"
              aria-label="Search payout requests"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] h-10 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PAYOUT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Provider Type filter */}
          <Select
            value={filterProviderType}
            onValueChange={(v) => {
              setFilterProviderType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] h-10 text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PAYOUT_PROVIDER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <Input
            type="date"
            value={filterDateStart}
            onChange={(e) => {
              setFilterDateStart(e.target.value);
              setPage(1);
            }}
            className="w-[150px] h-10 text-sm"
            aria-label="Start date"
          />
          <span className="text-gray-400 text-sm">to</span>
          <Input
            type="date"
            value={filterDateEnd}
            onChange={(e) => {
              setFilterDateEnd(e.target.value);
              setPage(1);
            }}
            className="w-[150px] h-10 text-sm"
            aria-label="End date"
          />

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Export */}
        <div className="relative shrink-0">
          <Button
            variant="outline"
            className="gap-2"
            aria-label="Export payout data"
            onClick={() => setExportOpen(!exportOpen)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => handleExport("csv")}
              >
                CSV
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => handleExport("xls")}
              >
                XLS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3">
          <span
            className="text-sm text-gray-700 font-medium"
            aria-live="polite"
          >
            {selectedIds.size} payout(s) selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {allSelectedPending && allSelectedHaveApprovedBank && (
              <Button
                size="sm"
                className="bg-[#003B95] hover:bg-[#002d73] text-white"
                onClick={handleBulkApprove}
                aria-label={`Approve ${selectedIds.size} selected payouts`}
              >
                Approve Selected
              </Button>
            )}
            {allSelectedPending && !allSelectedHaveApprovedBank && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" disabled className="opacity-50">
                    Approve Selected
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Cannot approve payouts for providers without approved bank
                  accounts.
                </TooltipContent>
              </Tooltip>
            )}
            {allSelectedPending && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkReject}
                aria-label={`Reject ${selectedIds.size} selected payouts`}
              >
                Reject Selected
              </Button>
            )}
            {allSelectedProcessingOrPartial && (
              <Button
                size="sm"
                className="bg-[#003B95] hover:bg-[#002d73] text-white"
                onClick={handleBulkSettle}
                aria-label={`Mark ${selectedIds.size} selected payouts as settled`}
              >
                Mark Settled
              </Button>
            )}
            {!hasUniformStatus && selectedIds.size > 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-gray-400">
                    Mixed statuses — actions limited
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Selected payouts must all have the same status for this
                  action.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {totalItems === 0 ? (
          <div className="py-20 text-center">
            {hasActiveFilters ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  No payout requests match your current filters.
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Banknote className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <p className="text-base font-medium text-gray-900">
                  No Payout Requests
                </p>
                <p className="text-sm text-gray-500">
                  Payout requests from providers will appear here.
                </p>
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {/* Checkbox column */}
                <TableHead className="w-[48px]">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-[#003B95] focus:ring-[#003B95]"
                    aria-label="Select all payout requests"
                  />
                </TableHead>
                {/* Sortable columns */}
                {(
                  [
                    {
                      key: "requestId" as SortField,
                      label: "Request ID",
                      w: "w-[120px]",
                    },
                    {
                      key: "providerName" as SortField,
                      label: "Provider Name",
                      w: "w-[180px]",
                    },
                    {
                      key: "providerType" as SortField,
                      label: "Provider Type",
                      w: "w-[140px]",
                    },
                    {
                      key: "requestedAmount" as SortField,
                      label: "Requested Amount",
                      w: "w-[140px]",
                    },
                    {
                      key: "walletBalance" as SortField,
                      label: "Wallet Balance",
                      w: "w-[130px]",
                    },
                    {
                      key: "status" as SortField,
                      label: "Status",
                      w: "w-[130px]",
                    },
                    {
                      key: "submissionDate" as SortField,
                      label: "Submitted",
                      w: "w-[150px]",
                    },
                  ] as const
                ).map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider text-gray-500 cursor-pointer select-none",
                      col.w,
                    )}
                    onClick={() => handleSort(col.key)}
                    aria-sort={
                      sortField === col.key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon
                        field={col.key}
                        sortField={sortField}
                        sortDir={sortDir}
                      />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[110px]">
                  Bank Status
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[120px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedPayouts.map((payout, idx) => {
                const belowThreshold =
                  payout.requestedAmount < MIN_PAYOUT_THRESHOLD;

                return (
                  <TableRow
                    key={payout.id}
                    className={cn(
                      "hover:bg-gray-50 transition-colors cursor-pointer",
                      idx % 2 === 1 && "bg-gray-50/50",
                      selectedIds.has(payout.id) && "bg-blue-50/50",
                    )}
                    onClick={() => navigate(`/payouts/${payout.id}`)}
                  >
                    {/* Checkbox */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(payout.id)}
                        onChange={() => toggleOne(payout.id)}
                        className="h-4 w-4 rounded border-gray-300 text-[#003B95] focus:ring-[#003B95]"
                        aria-label={`Select payout request ${payout.id}`}
                      />
                    </TableCell>
                    {/* Request ID */}
                    <TableCell>
                      <button
                        className="text-sm text-[#003B95] hover:underline font-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/payouts/${payout.id}`);
                        }}
                      >
                        {payout.id}
                      </button>
                    </TableCell>
                    {/* Provider Name */}
                    <TableCell className="text-sm text-gray-900">
                      {payout.providerName}
                    </TableCell>
                    {/* Provider Type */}
                    <TableCell>
                      <ProviderTypeBadge type={payout.providerType} />
                    </TableCell>
                    {/* Requested Amount */}
                    <TableCell className="text-sm tabular-nums text-gray-900 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {belowThreshold && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>
                              This request is below the minimum payout threshold
                              of {MIN_PAYOUT_THRESHOLD} SAR.
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {fmtCurrency(payout.requestedAmount)}
                      </div>
                    </TableCell>
                    {/* Wallet Balance */}
                    <TableCell className="text-sm tabular-nums text-gray-900 text-right">
                      {fmtCurrency(payout.walletBalance)}
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={payout.status} />
                    </TableCell>
                    {/* Submitted */}
                    <TableCell className="text-sm text-gray-600">
                      {format(
                        parseISO(payout.submissionDate),
                        "dd MMM yyyy, HH:mm",
                      )}{" "}
                      UTC
                    </TableCell>
                    {/* Bank Status */}
                    <TableCell>
                      <BankStatusBadge
                        status={
                          payout.bankStatus === "Revoked"
                            ? "Not Approved"
                            : payout.bankStatus
                        }
                      />
                    </TableCell>
                    {/* Actions */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        className="text-sm text-[#003B95] hover:underline flex items-center gap-1"
                        onClick={() => navigate(`/payouts/${payout.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>
              Showing {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, totalItems)} of {totalItems}{" "}
              payouts
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[80px] h-8 text-xs">
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

          <nav className="flex items-center gap-1" aria-label="Pagination">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
              )
              .reduce<(number | "dots")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push("dots");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "dots" ? (
                  <span
                    key={`dots-${idx}`}
                    className="px-1 text-gray-400 text-sm"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === safePage ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-8 w-8 text-xs",
                      item === safePage &&
                        "bg-[#003B95] hover:bg-[#002d73] text-white",
                    )}
                    onClick={() => setPage(item as number)}
                  >
                    {item}
                  </Button>
                ),
              )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      )}

      {/* Bulk Action Confirm Modal */}
      <Dialog
        open={bulkConfirmOpen}
        onOpenChange={(v) => {
          if (!v && !isBulkProcessing) {
            setBulkConfirmOpen(false);
            setBulkAction(null);
            setRejectReason("");
            setRejectReasonError("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg",
                  bulkAction === "reject" ? "bg-red-100" : "bg-amber-100",
                )}
              >
                {bulkAction === "reject" ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : bulkAction === "approve" ? (
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                ) : (
                  <Banknote className="h-4 w-4 text-amber-600" />
                )}
              </div>
              {bulkAction === "approve" &&
                `Approve ${selectedIds.size} selected payout requests?`}
              {bulkAction === "reject" &&
                `Reject ${selectedIds.size} selected payout requests?`}
              {bulkAction === "settle" &&
                `Mark ${selectedIds.size} selected payouts as settled?`}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {bulkAction === "approve" &&
                "These payouts will be moved to Processing status."}
              {bulkAction === "reject" &&
                "Providers will be notified with the rejection reason."}
              {bulkAction === "settle" &&
                "This confirms bank transfers have been completed outside the platform."}
            </DialogDescription>
          </DialogHeader>

          {bulkAction === "reject" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setRejectReasonError("");
                }}
                placeholder="Enter the reason for rejecting these payout requests..."
                className="min-h-[80px]"
                maxLength={500}
              />
              {rejectReasonError && (
                <p className="text-xs text-red-500">{rejectReasonError}</p>
              )}
              <p className="text-xs text-gray-400 text-right">
                {rejectReason.length}/500
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBulkConfirmOpen(false);
                setBulkAction(null);
                setRejectReason("");
                setRejectReasonError("");
              }}
              disabled={isBulkProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={bulkAction === "reject" ? "destructive" : "default"}
              onClick={handleConfirmBulk}
              disabled={isBulkProcessing}
              className={cn(
                bulkAction !== "reject" &&
                  "bg-[#003B95] hover:bg-[#002d73] text-white",
              )}
            >
              {isBulkProcessing && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              {bulkAction === "approve" && "Approve"}
              {bulkAction === "reject" && "Reject"}
              {bulkAction === "settle" && "Mark Settled"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
