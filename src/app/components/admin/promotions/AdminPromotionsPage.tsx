// ─── SCR-ADM-041: Promotion Management List ──────────────────────────────────
// Read-only monitoring view of all provider promotion purchases.
// Promotions cannot be paused, cancelled, or resumed (US-133 AC#6).
// Navigation to Pricing Configuration (SCR-ADM-042) via "Manage Pricing" button.

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Megaphone,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  MinusCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText,
  FileDown,
  Database,
  CalendarRange,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import {
  PromotionRecord,
  PromotionStatus,
  ProviderType,
  PlacementType,
  PaymentStatus,
  PROMOTION_STATUSES,
  PROVIDER_TYPES,
  PLACEMENT_TYPES,
  computeStats,
  fmtSAR,
} from "./types";
import { MOCK_PROMOTIONS } from "./mockData";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

// ─── Status Config ───────────────────────────────────────────────────────────

const PROMOTION_STATUS_CONFIG: Record<PromotionStatus, { bg: string; text: string; border: string; dot: string }> = {
  Live:     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  Upcoming: { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500" },
  Ended:    { bg: "bg-gray-100",   text: "text-gray-500",    border: "border-gray-200",    dot: "bg-gray-400" },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
  Success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Pending: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  Failed:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return format(parseISO(iso), "dd MMM yyyy");
}

function fmtDateShort(iso: string) {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm");
}

// ─── Sortable column type ────────────────────────────────────────────────────

type SortField =
  | "entityName"
  | "providerName"
  | "providerType"
  | "placement"
  | "duration"
  | "startDate"
  | "endDate"
  | "amount"
  | "paymentMethod"
  | "transactionId"
  | "paymentStatus"
  | "promotionStatus";

type SortDir = "asc" | "desc";

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, colorClass }: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4"
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", colorClass.split(" ")[1])}>
        <Icon className={cn("h-5 w-5", colorClass.split(" ")[0])} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Export Dropdown ─────────────────────────────────────────────────────────

function ExportDropdown() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const formats = [
    { label: "Excel (XLS)", icon: FileSpreadsheet, ext: "xls" },
    { label: "CSV", icon: FileText, ext: "csv" },
    { label: "PDF", icon: FileDown, ext: "pdf" },
    { label: "Text (TXT)", icon: FileText, ext: "txt" },
    { label: "SQL", icon: Database, ext: "sql" },
  ];

  const handleExport = (ext: string) => {
    setOpen(false);
    setExporting(true);
    toast.info("Export file is being generated. Download will start shortly.");
    setTimeout(() => {
      setExporting(false);
      toast.success(`Promotions data exported as .${ext}`);
    }, 1500);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={exporting}
          className="gap-2 text-gray-600"
          aria-label="Export promotion data"
        >
          {exporting ? (
            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1" role="menu">
        {formats.map(({ label, icon: FmtIcon, ext }) => (
          <button
            key={ext}
            role="menuitem"
            onClick={() => handleExport(ext)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
          >
            <FmtIcon className="h-3.5 w-3.5 text-gray-400" />
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ─── Sort Header ─────────────────────────────────────────────────────────────

function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentSort === field;
  return (
    <TableHead className={cn("cursor-pointer select-none hover:bg-gray-100/50 transition-colors", className)}>
      <button
        className="flex items-center gap-1 w-full"
        onClick={() => onSort(field)}
        aria-sort={isActive ? (currentDir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-[#003B95]" />
          ) : (
            <ArrowDown className="h-3 w-3 text-[#003B95]" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-gray-300" />
        )}
      </button>
    </TableHead>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminPromotionsPage() {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | "All">("All");
  const [providerTypeFilter, setProviderTypeFilter] = useState<ProviderType | "All">("All");
  const [placementFilter, setPlacementFilter] = useState<PlacementType | "All">("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => computeStats(MOCK_PROMOTIONS), []);

  // ── Filters Active? ──────────────────────────────────────────────────────
  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "All" ||
    providerTypeFilter !== "All" ||
    placementFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setProviderTypeFilter("All");
    setPlacementFilter("All");
    setPage(1);
  };

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return MOCK_PROMOTIONS.filter((p) => {
      if (statusFilter !== "All" && p.promotionStatus !== statusFilter) return false;
      if (providerTypeFilter !== "All" && p.providerType !== providerTypeFilter) return false;
      if (placementFilter !== "All" && p.placement !== placementFilter) return false;
      if (q) {
        const match =
          p.entityName.toLowerCase().includes(q) ||
          p.providerName.toLowerCase().includes(q) ||
          p.transactionId.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [search, statusFilter, providerTypeFilter, placementFilter]);

  // ── Sorting ──────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === "string" && typeof vb === "string") {
        cmp = va.localeCompare(vb);
      } else if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#003B95]/10">
            <Megaphone className="h-5 w-5 text-[#003B95]" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Promotion Management</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/promotions/pricing")}
        >
          <Settings className="h-4 w-4" />
          Manage Pricing
        </Button>
      </div>

      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Promotions" value={stats.total} icon={Megaphone} colorClass="text-gray-600 bg-gray-100" />
        <StatCard label="Live" value={stats.live} icon={TrendingUp} colorClass="text-emerald-600 bg-emerald-50" />
        <StatCard label="Upcoming" value={stats.upcoming} icon={Clock} colorClass="text-blue-600 bg-blue-50" />
        <StatCard label="Ended" value={stats.ended} icon={MinusCircle} colorClass="text-gray-500 bg-gray-100" />
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[260px] max-w-md" role="search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by entity, provider, or transaction ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 h-9 text-sm"
              aria-label="Search promotions"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v as PromotionStatus | "All"); setPage(1); }}
          >
            <SelectTrigger className="w-[140px] h-9 text-sm" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              {PROMOTION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Provider Type Filter */}
          <Select
            value={providerTypeFilter}
            onValueChange={(v) => { setProviderTypeFilter(v as ProviderType | "All"); setPage(1); }}
          >
            <SelectTrigger className="w-[180px] h-9 text-sm" aria-label="Filter by provider type">
              <SelectValue placeholder="Provider Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Providers</SelectItem>
              {PROVIDER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Placement Filter */}
          <Select
            value={placementFilter}
            onValueChange={(v) => { setPlacementFilter(v as PlacementType | "All"); setPage(1); }}
          >
            <SelectTrigger className="w-[160px] h-9 text-sm" aria-label="Filter by placement">
              <SelectValue placeholder="Placement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Placements</SelectItem>
              {PLACEMENT_TYPES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 gap-1.5"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}

          {/* Export */}
          <div className="ml-auto">
            <ExportDropdown />
          </div>
        </div>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table role="table">
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <SortableHeader label="Entity Name" field="entityName" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Provider" field="providerName" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Provider Type" field="providerType" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Placement" field="placement" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Duration" field="duration" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Start Date" field="startDate" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="End Date" field="endDate" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Amount" field="amount" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="text-right" />
                <SortableHeader label="Payment Method" field="paymentMethod" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Transaction ID" field="transactionId" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Payment Status" field="paymentStatus" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Promotion Status" field="promotionStatus" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Megaphone className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {hasActiveFilters ? "No Promotions Found" : "No Promotions Yet"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {hasActiveFilters
                            ? "No promotions match your current filters."
                            : "No promotions have been purchased yet."}
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" className="text-[#003B95] gap-1" onClick={clearFilters}>
                          <X className="h-3.5 w-3.5" /> Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((promo, idx) => (
                  <PromotionRow key={promo.id} promo={promo} isEven={idx % 2 === 1} />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              {sorted.length === 0
                ? "No results"
                : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sorted.length)} of ${sorted.length}`}
            </p>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
            >
              <SelectTrigger className="w-[80px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <nav role="navigation" aria-label="Pagination" className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc: (number | "...")[], p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      "h-8 min-w-[32px] rounded-lg text-xs transition-colors",
                      page === p
                        ? "bg-[#003B95] text-white"
                        : "text-gray-500 hover:bg-gray-100 border border-gray-200",
                    )}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

// ─── Promotion Row ───────────────────────────────────────────────────────────

function PromotionRow({ promo, isEven }: { promo: PromotionRecord; isEven: boolean }) {
  const promoStatusCfg = PROMOTION_STATUS_CONFIG[promo.promotionStatus];
  const payStatusCfg = PAYMENT_STATUS_CONFIG[promo.paymentStatus];

  return (
    <TooltipProvider>
      <TableRow className={cn("hover:bg-gray-50 transition-colors", isEven && "bg-gray-50/30")}>
        {/* Entity Name */}
        <TableCell className="max-w-[180px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-xs text-[#003B95] hover:underline text-left truncate block max-w-full">
                {promo.entityName}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{promo.entityName}</p>
            </TooltipContent>
          </Tooltip>
        </TableCell>

        {/* Provider Name */}
        <TableCell className="max-w-[160px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-xs text-[#003B95] hover:underline text-left truncate block max-w-full">
                {promo.providerName}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{promo.providerName}</p>
            </TooltipContent>
          </Tooltip>
        </TableCell>

        {/* Provider Type */}
        <TableCell>
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
            promo.providerType === "Facility Provider"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-purple-50 text-purple-700 border-purple-200",
          )}>
            {promo.providerType}
          </span>
        </TableCell>

        {/* Placement */}
        <TableCell>
          <span className="text-xs text-gray-700">{promo.placement}</span>
        </TableCell>

        {/* Duration */}
        <TableCell>
          <span className="text-xs text-gray-700">{promo.duration}</span>
        </TableCell>

        {/* Start Date */}
        <TableCell>
          <span className="text-xs text-gray-700 whitespace-nowrap">{fmtDate(promo.startDate)}</span>
        </TableCell>

        {/* End Date */}
        <TableCell>
          <span className="text-xs text-gray-700 whitespace-nowrap">{fmtDate(promo.endDate)}</span>
        </TableCell>

        {/* Amount */}
        <TableCell className="text-right">
          <span className="text-xs font-medium text-gray-900 whitespace-nowrap tabular-nums">{fmtSAR(promo.amount)}</span>
        </TableCell>

        {/* Payment Method */}
        <TableCell>
          <span className="text-xs text-gray-700">{promo.paymentMethod}</span>
        </TableCell>

        {/* Transaction ID */}
        <TableCell>
          <span className="text-[11px] font-mono text-gray-600">{promo.transactionId}</span>
        </TableCell>

        {/* Payment Status */}
        <TableCell>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
              payStatusCfg.bg, payStatusCfg.text, payStatusCfg.border,
            )}
            aria-label={`Payment status: ${promo.paymentStatus}`}
          >
            {promo.paymentStatus}
          </span>
        </TableCell>

        {/* Promotion Status */}
        <TableCell>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full border",
              promoStatusCfg.bg, promoStatusCfg.text, promoStatusCfg.border,
            )}
            aria-label={`Promotion status: ${promo.promotionStatus}`}
          >
            <span className={cn(
              "w-1.5 h-1.5 rounded-full flex-shrink-0",
              promoStatusCfg.dot,
              promo.promotionStatus === "Live" && "animate-pulse",
            )} />
            {promo.promotionStatus}
          </span>
        </TableCell>
      </TableRow>
    </TooltipProvider>
  );
}
