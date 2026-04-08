// ─── SCR-ADM-019: Booking Management List View ──────────────────────────────
// Read-only booking oversight: all types (Facility, Training, Coach, Tournament)
// Filters · Search · Sortable DataTable · Flag suspicious · Export · Pagination

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Flag,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  GraduationCap,
  User,
  Trophy,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "../../../lib/utils";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import type {
  Booking,
  BookingType,
  BookingStatus,
  PaymentStatus,
} from "./types";
import { BOOKING_TYPES, BOOKING_STATUSES, PAYMENT_STATUSES } from "./types";
import { MOCK_BOOKINGS } from "./mockData";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

// ─── Badge Style Maps ─────────────────────────────────────────────────────────

const TYPE_BADGE: Record<BookingType, { cls: string; label: string }> = {
  Facility: {
    cls: "bg-blue-100 text-blue-700 border-blue-200",
    label: "Facility",
  },
  Training: {
    cls: "bg-sky-100 text-sky-700 border-sky-200",
    label: "Training",
  },
  Coach: {
    cls: "bg-amber-100 text-amber-700 border-amber-200",
    label: "Coach",
  },
  Tournament: {
    cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: "Tournament",
  },
};

const STATUS_BADGE: Record<BookingStatus, string> = {
  Created: "bg-gray-100 text-gray-600 border-gray-200",
  Upcoming: "bg-sky-100 text-sky-700 border-sky-200",
  Ongoing: "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
  "Partially Cancelled": "bg-red-50 text-red-600 border-red-200",
  Expired: "bg-gray-100 text-gray-500 border-gray-200",
};

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Refunded: "bg-sky-100 text-sky-700 border-sky-200",
  "Partial Refund": "bg-sky-50 text-sky-600 border-sky-200",
  Failed: "bg-red-100 text-red-700 border-red-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm");
}
function fmtCurrency(amount: number) {
  return `SAR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function exportCSV(bookings: Booking[]) {
  const headers = [
    "Booking ID",
    "Type",
    "Player",
    "Provider",
    "Entity",
    "Date",
    "Period",
    "Players",
    "Gross Amount",
    "Commission",
    "Tax",
    "Net",
    "Payment Status",
    "Booking Status",
    "Flagged",
  ];
  const rows = bookings.map((b) => [
    b.id,
    b.type,
    b.player.name,
    b.provider.name,
    b.entity.name,
    fmtDateTime(b.bookingDate),
    b.period,
    b.playersCount,
    b.financials.grossAmount.toFixed(2),
    b.financials.commissionAmount.toFixed(2),
    b.financials.taxAmount.toFixed(2),
    b.financials.netPayout.toFixed(2),
    b.paymentStatus,
    b.status,
    b.flagged ? "Yes" : "No",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sort Config ──────────────────────────────────────────────────────────────

type SortKey =
  | "bookingId"
  | "bookingType"
  | "playerName"
  | "providerName"
  | "entityName"
  | "bookingDate"
  | "playersCount"
  | "grossAmount"
  | "commissionAmount"
  | "taxAmount"
  | "netAmount"
  | "paymentStatus"
  | "bookingStatus"
  | "flagged";

type SortDir = "asc" | "desc";

function getSortValue(b: Booking, key: SortKey): string | number | boolean {
  switch (key) {
    case "bookingId":
      return b.id;
    case "bookingType":
      return b.type;
    case "playerName":
      return b.player.name;
    case "providerName":
      return b.provider.name;
    case "entityName":
      return b.entity.name;
    case "bookingDate":
      return b.bookingDate;
    case "playersCount":
      return b.playersCount;
    case "grossAmount":
      return b.financials.grossAmount;
    case "commissionAmount":
      return b.financials.commissionAmount;
    case "taxAmount":
      return b.financials.taxAmount;
    case "netAmount":
      return b.financials.netPayout;
    case "paymentStatus":
      return b.paymentStatus;
    case "bookingStatus":
      return b.status;
    case "flagged":
      return b.flagged ? 1 : 0;
    default:
      return "";
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminBookingPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [playerFilter, setPlayerFilter] = useState<string>("all");

  // ── Sort ──
  const [sortKey, setSortKey] = useState<SortKey>("bookingDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Pagination ──
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Flag Modal ──
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagTarget, setFlagTarget] = useState<Booking | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  // ── Unflag Modal ──
  const [unflagModalOpen, setUnflagModalOpen] = useState(false);
  const [unflagTarget, setUnflagTarget] = useState<Booking | null>(null);

  // ── Derived data ──
  const providers = useMemo(() => {
    const set = new Set(bookings.map((b) => b.provider.name));
    return Array.from(set).sort();
  }, [bookings]);

  const players = useMemo(() => {
    const set = new Set(bookings.map((b) => b.player.name));
    return Array.from(set).sort();
  }, [bookings]);

  const hasFilters =
    search ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    dateFrom ||
    dateTo ||
    providerFilter !== "all" ||
    playerFilter !== "all";

  const clearFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFrom("");
    setDateTo("");
    setProviderFilter("all");
    setPlayerFilter("all");
    setCurrentPage(1);
  }, []);

  // ── Active filter chips ──
  const activeFilters: { label: string; value: string; clear: () => void }[] =
    [];
  if (typeFilter !== "all")
    activeFilters.push({
      label: "Type",
      value: typeFilter,
      clear: () => setTypeFilter("all"),
    });
  if (statusFilter !== "all")
    activeFilters.push({
      label: "Status",
      value: statusFilter,
      clear: () => setStatusFilter("all"),
    });
  if (paymentFilter !== "all")
    activeFilters.push({
      label: "Payment",
      value: paymentFilter,
      clear: () => setPaymentFilter("all"),
    });
  if (dateFrom)
    activeFilters.push({
      label: "From",
      value: dateFrom,
      clear: () => setDateFrom(""),
    });
  if (dateTo)
    activeFilters.push({
      label: "To",
      value: dateTo,
      clear: () => setDateTo(""),
    });
  if (providerFilter !== "all")
    activeFilters.push({
      label: "Provider",
      value: providerFilter,
      clear: () => setProviderFilter("all"),
    });
  if (playerFilter !== "all")
    activeFilters.push({
      label: "Player",
      value: playerFilter,
      clear: () => setPlayerFilter("all"),
    });

  // ── Filtering ──
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          b.id.toLowerCase().includes(q) ||
          b.player.name.toLowerCase().includes(q) ||
          b.provider.name.toLowerCase().includes(q) ||
          b.entity.name.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (typeFilter !== "all" && b.type !== typeFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (paymentFilter !== "all" && b.paymentStatus !== paymentFilter)
        return false;
      if (providerFilter !== "all" && b.provider.name !== providerFilter)
        return false;
      if (playerFilter !== "all" && b.player.name !== playerFilter)
        return false;
      if (dateFrom) {
        const bDate = new Date(b.bookingDate);
        if (bDate < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const bDate = new Date(b.bookingDate);
        if (bDate > new Date(dateTo + "T23:59:59")) return false;
      }
      return true;
    });
  }, [
    bookings,
    search,
    typeFilter,
    statusFilter,
    paymentFilter,
    dateFrom,
    dateTo,
    providerFilter,
    playerFilter,
  ]);

  // ── Sorting ──
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const showingFrom =
    sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, sorted.length);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  // ── Navigation ──
  const openDetail = (id: string) => navigate(`/bookings/${id}`);

  // ── Flag / Unflag handlers ──
  const handleOpenFlagModal = (booking: Booking) => {
    setFlagTarget(booking);
    setFlagReason("");
    setFlagModalOpen(true);
  };

  const handleFlag = async () => {
    if (!flagTarget || flagReason.length < 10) return;
    setFlagSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    setBookings((prev) =>
      prev.map((b) =>
        b.id === flagTarget.id
          ? {
              ...b,
              flagged: true,
              flagInfo: {
                flaggedBy: "Super Admin",
                flaggedAt: new Date().toISOString(),
                reason: flagReason,
              },
            }
          : b,
      ),
    );
    setFlagSubmitting(false);
    setFlagModalOpen(false);
    toast.success(`Booking ${flagTarget.id} has been flagged as suspicious.`);
  };

  const handleOpenUnflagModal = (booking: Booking) => {
    setUnflagTarget(booking);
    setUnflagModalOpen(true);
  };

  const handleUnflag = () => {
    if (!unflagTarget) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === unflagTarget.id
          ? { ...b, flagged: false, flagInfo: undefined }
          : b,
      ),
    );
    setUnflagModalOpen(false);
    toast.success(`Suspicious flag removed from booking ${unflagTarget.id}.`);
  };

  const handleExport = () => {
    if (sorted.length === 0) {
      toast.warning("No data to export. Please adjust your filters.");
      return;
    }
    exportCSV(sorted);
    toast.success("Export file downloaded successfully.");
  };

  // ── Sort icon helper ──
  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400 inline" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-[#003B95] inline" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-[#003B95] inline" />
    );
  }

  return (
    <TooltipProvider>
      <div
        className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen"
        role="main"
        aria-label="Booking Management"
      >
        {/* ── Page Header ── */}
        <div>
          <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280] mb-1">
            <span
              className="hover:text-[#003B95] cursor-pointer"
              onClick={() => navigate("/")}
            >
              Dashboard
            </span>
            <span className="mx-2">/</span>
            <span className="text-[#111827] font-medium">Bookings</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#111827]">
            Booking Management
          </h1>
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 space-y-3">
            {/* Row 1: Search + Export */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[280px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by Booking ID, Player, Provider, Entity..."
                  aria-label="Search bookings by ID, player, provider, or entity name"
                  className="pl-10 pr-8"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {search && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    aria-label="Clear all active filters"
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={sorted.length === 0}
                  aria-label="Export booking data"
                  className="gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Row 2: Filter dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  className="w-[140px] h-10 text-sm"
                  aria-label="Filter by booking type"
                >
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {BOOKING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  className="w-[170px] h-10 text-sm"
                  aria-label="Filter by booking status"
                >
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {BOOKING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={paymentFilter}
                onValueChange={(v) => {
                  setPaymentFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  className="w-[160px] h-10 text-sm"
                  aria-label="Filter by payment status"
                >
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  {PAYMENT_STATUSES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                className="flex items-center gap-1.5 text-sm"
                aria-label="Filter by booking date range"
              >
                <Input
                  type="date"
                  className="h-10 w-[140px] text-sm"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="From"
                />
                <span className="text-gray-400">—</span>
                <Input
                  type="date"
                  className="h-10 w-[140px] text-sm"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="To"
                />
              </div>

              <Select
                value={providerFilter}
                onValueChange={(v) => {
                  setProviderFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  className="w-[180px] h-10 text-sm"
                  aria-label="Filter by provider"
                >
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={playerFilter}
                onValueChange={(v) => {
                  setPlayerFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  className="w-[170px] h-10 text-sm"
                  aria-label="Filter by player"
                >
                  <SelectValue placeholder="All Players" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  {players.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Active Filters Bar ── */}
          {activeFilters.length > 0 && (
            <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
              {activeFilters.map((f) => (
                <Badge
                  key={f.label}
                  variant="secondary"
                  className="gap-1.5 text-xs font-medium"
                >
                  {f.label}: {f.value}
                  <button
                    onClick={() => {
                      f.clear();
                      setCurrentPage(1);
                    }}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <button
                className="text-xs text-[#003B95] hover:underline font-medium"
                onClick={clearFilters}
              >
                Clear All
              </button>
            </div>
          )}

          {/* ── DataTable ── */}
          <div
            className="overflow-x-auto"
            role="table"
            aria-label="Bookings table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <SortableHead
                    col="bookingId"
                    label="Booking ID"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[120px] sticky left-0 bg-gray-50 z-10"
                  />
                  <SortableHead
                    col="bookingType"
                    label="Type"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[100px]"
                  />
                  <SortableHead
                    col="playerName"
                    label="Player"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[150px]"
                  />
                  <SortableHead
                    col="providerName"
                    label="Provider / Host"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[160px]"
                  />
                  <SortableHead
                    col="entityName"
                    label="Entity"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[180px]"
                  />
                  <SortableHead
                    col="bookingDate"
                    label="Date"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[120px]"
                  />
                  <TableHead className="text-xs font-semibold text-gray-500 min-w-[100px]">
                    Period
                  </TableHead>
                  <SortableHead
                    col="playersCount"
                    label="Players"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[80px] text-center"
                  />
                  <SortableHead
                    col="grossAmount"
                    label="Gross Amount"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[120px] text-right"
                  />
                  <SortableHead
                    col="commissionAmount"
                    label="Commission"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[110px] text-right"
                  />
                  <SortableHead
                    col="taxAmount"
                    label="Tax"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[100px] text-right"
                  />
                  <SortableHead
                    col="netAmount"
                    label="Net"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[110px] text-right"
                  />
                  <SortableHead
                    col="paymentStatus"
                    label="Payment Status"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[120px]"
                  />
                  <SortableHead
                    col="bookingStatus"
                    label="Booking Status"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[130px]"
                  />
                  <SortableHead
                    col="flagged"
                    label="Flagged"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[60px] text-center"
                  />
                  <TableHead className="text-xs font-semibold text-gray-500 min-w-[80px] text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 py-12">
                        <FileText className="w-12 h-12 text-gray-200" />
                        <p className="text-base font-medium text-gray-500">
                          {hasFilters ? "No Bookings Found" : "No Bookings Yet"}
                        </p>
                        <p className="text-sm text-[#6B7280] max-w-md">
                          {hasFilters
                            ? "There are no bookings matching your current filters. Try adjusting your search or filter criteria."
                            : "No bookings have been made on the platform yet. Bookings will appear here as players make reservations."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((b, idx) => (
                    <TableRow
                      key={b.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-blue-50/40",
                        idx % 2 === 1 && "bg-gray-50/40",
                        b.flagged && "bg-amber-50/30",
                      )}
                      onClick={() => openDetail(b.id)}
                    >
                      {/* Booking ID */}
                      <TableCell className="font-mono text-xs font-semibold text-[#003B95] sticky left-0 bg-inherit z-10">
                        {b.id}
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium border",
                            TYPE_BADGE[b.type].cls,
                          )}
                        >
                          {TYPE_BADGE[b.type].label}
                        </Badge>
                      </TableCell>

                      {/* Player */}
                      <TableCell className="text-sm text-[#111827]">
                        <span
                          className={cn(
                            b.player.name === "Deleted User" &&
                              "text-gray-400 italic",
                          )}
                        >
                          {b.player.name}
                        </span>
                      </TableCell>

                      {/* Provider */}
                      <TableCell className="text-sm text-[#111827] max-w-[160px] truncate">
                        {b.provider.name}
                      </TableCell>

                      {/* Entity */}
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm text-[#111827] max-w-[180px] truncate block">
                              {b.entity.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{b.entity.name}</p>
                            <p className="text-xs text-gray-400">
                              {b.entity.detail}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-[#111827] whitespace-nowrap">
                        {fmtDateTime(b.bookingDate)}
                      </TableCell>

                      {/* Period */}
                      <TableCell className="text-sm text-[#6B7280]">
                        {b.period}
                      </TableCell>

                      {/* Players */}
                      <TableCell className="text-sm text-[#111827] text-center">
                        {b.playersCount}
                      </TableCell>

                      {/* Gross Amount */}
                      <TableCell className="text-sm text-[#111827] text-right font-medium whitespace-nowrap">
                        {fmtCurrency(b.financials.grossAmount)}
                      </TableCell>

                      {/* Commission */}
                      <TableCell className="text-sm text-[#6B7280] text-right whitespace-nowrap">
                        {fmtCurrency(b.financials.commissionAmount)}
                      </TableCell>

                      {/* Tax */}
                      <TableCell className="text-sm text-[#6B7280] text-right whitespace-nowrap">
                        {fmtCurrency(b.financials.taxAmount)}
                      </TableCell>

                      {/* Net */}
                      <TableCell className="text-sm text-[#111827] text-right font-semibold whitespace-nowrap">
                        {fmtCurrency(b.financials.netPayout)}
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium border",
                            PAYMENT_BADGE[b.paymentStatus],
                          )}
                        >
                          {b.paymentStatus}
                        </Badge>
                      </TableCell>

                      {/* Booking Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium border",
                            STATUS_BADGE[b.status],
                          )}
                        >
                          {b.status}
                        </Badge>
                      </TableCell>

                      {/* Flagged */}
                      <TableCell className="text-center">
                        {b.flagged && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-semibold text-amber-700">
                                Flagged as suspicious
                              </p>
                              {b.flagInfo && (
                                <>
                                  <p className="text-xs mt-1">
                                    By: {b.flagInfo.flaggedBy}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {b.flagInfo.reason}
                                  </p>
                                </>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openDetail(b.id)}
                                aria-label={`View details for booking ${b.id}`}
                              >
                                <Eye className="w-4 h-4 text-gray-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>

                          {b.flagged ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleOpenUnflagModal(b)}
                                  aria-label={`Remove suspicious flag from booking ${b.id}`}
                                >
                                  <Flag className="w-4 h-4 text-amber-500 fill-amber-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Remove Flag (Super Admin)
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleOpenFlagModal(b)}
                                  aria-label={`Flag booking ${b.id} as suspicious`}
                                >
                                  <Flag className="w-4 h-4 text-gray-400 hover:text-amber-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Flag as Suspicious
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/60 text-sm text-[#6B7280]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] text-sm">
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
                <span>per page</span>
              </div>
              <span>
                Showing <strong>{showingFrom}</strong>–
                <strong>{showingTo}</strong> of{" "}
                <strong>{sorted.length.toLocaleString()}</strong> bookings
              </span>
            </div>
            <nav
              aria-label="Bookings table pagination"
              className="flex items-center gap-1"
            >
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-8 w-8 text-xs",
                      page === currentPage && "bg-[#003B95]",
                    )}
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === currentPage ? "page" : undefined}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </nav>
          </div>
        </div>

        {/* ── Flag as Suspicious Modal ── */}
        <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Flag Booking as Suspicious
              </DialogTitle>
              <DialogDescription>
                You are about to flag booking <strong>{flagTarget?.id}</strong>{" "}
                as suspicious. Please provide a reason.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                placeholder="Describe why this booking is suspicious..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-[#6B7280]">
                <span>
                  {flagReason.length < 10 && flagReason.length > 0
                    ? "Flag reason must be at least 10 characters."
                    : ""}
                </span>
                <span>{flagReason.length}/500</span>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setFlagModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={flagReason.length < 10 || flagSubmitting}
                onClick={handleFlag}
                className="gap-1.5"
              >
                {flagSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Flag Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Remove Suspicious Flag Modal ── */}
        <Dialog open={unflagModalOpen} onOpenChange={setUnflagModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-amber-700 flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Remove Suspicious Flag
              </DialogTitle>
              <DialogDescription>
                Remove the suspicious flag from booking{" "}
                <strong>{unflagTarget?.id}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setUnflagModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleUnflag}
                className="bg-amber-600 hover:bg-amber-700 gap-1.5"
              >
                Remove Flag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ─── Sortable Table Head Component ───────────────────────────────────────────

function SortableHead({
  col,
  label,
  onSort,
  sortKey,
  sortDir,
  className,
}: {
  col: SortKey;
  label: string;
  onSort: (k: SortKey) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  className?: string;
}) {
  const isActive = sortKey === col;
  return (
    <TableHead
      className={cn(
        "text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap",
        className,
      )}
      onClick={() => onSort(col)}
      aria-sort={
        isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      {label}
      {isActive ? (
        sortDir === "asc" ? (
          <ArrowUp className="w-3 h-3 ml-1 text-[#003B95] inline" />
        ) : (
          <ArrowDown className="w-3 h-3 ml-1 text-[#003B95] inline" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400 inline" />
      )}
    </TableHead>
  );
}
