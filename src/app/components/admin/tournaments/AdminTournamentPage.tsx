// ─── SCR-ADM-021: Tournament Management List View ───────────────────────────
// Read-only tournament oversight with search, filters, sortable DataTable,
// export, and pagination. Admin cannot edit or cancel from this screen.

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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trophy,
  FileText,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
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
import type { Tournament, TournamentStatus, SportType } from "./types";
import { TOURNAMENT_STATUSES, SPORT_TYPES } from "./types";
import { generateMockTournaments } from "./mockData";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

// ─── Badge Styles ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<TournamentStatus, string> = {
  Tentative: "bg-sky-100 text-sky-700 border-sky-200",
  Confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Full: "bg-amber-100 text-amber-700 border-amber-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
  Completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Expired: "bg-gray-100 text-gray-500 border-gray-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm");
}
function fmtCurrency(amount: number) {
  return `SAR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function exportCSV(tournaments: Tournament[]) {
  const headers = [
    "ID",
    "Name",
    "Sport",
    "Location",
    "Date/Time",
    "Fee",
    "Status",
    "Facility",
    "Host",
    "Registered",
  ];
  const rows = tournaments.map((t) => [
    t.id,
    t.name,
    t.sport,
    t.facility.location,
    fmtDateTime(t.date),
    t.financials.feeType === "Free"
      ? "Free"
      : `SAR ${t.financials.entryFee.toFixed(2)}`,
    t.status,
    t.facility.name,
    t.host.name,
    `${t.registrationCount}/${t.maxPlayers}`,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tournaments_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sort Config ──────────────────────────────────────────────────────────────

type SortKey =
  | "tournamentId"
  | "name"
  | "sport"
  | "location"
  | "dateTime"
  | "fee"
  | "status"
  | "facilityName"
  | "hostName"
  | "registrationCount";

type SortDir = "asc" | "desc";

function getSortValue(t: Tournament, key: SortKey): string | number {
  switch (key) {
    case "tournamentId":
      return t.id;
    case "name":
      return t.name;
    case "sport":
      return t.sport;
    case "location":
      return t.facility.location;
    case "dateTime":
      return t.date;
    case "fee":
      return t.financials.entryFee;
    case "status":
      return t.status;
    case "facilityName":
      return t.facility.name;
    case "hostName":
      return t.host.name;
    case "registrationCount":
      return t.registrationCount;
    default:
      return "";
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminTournamentPage() {
  const navigate = useNavigate();
  const [tournaments] = useState<Tournament[]>(() =>
    generateMockTournaments(50),
  );

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hostFilter, setHostFilter] = useState<string>("all");

  // ── Sort ──
  const [sortKey, setSortKey] = useState<SortKey>("dateTime");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Pagination ──
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Derived data ──
  const hosts = useMemo(() => {
    const set = new Set(tournaments.map((t) => t.host.name));
    return Array.from(set).sort();
  }, [tournaments]);

  const hasFilters =
    search ||
    statusFilter !== "all" ||
    sportFilter !== "all" ||
    dateFrom ||
    dateTo ||
    hostFilter !== "all";

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setSportFilter("all");
    setDateFrom("");
    setDateTo("");
    setHostFilter("all");
    setCurrentPage(1);
  }, []);

  // ── Active filter chips ──
  const activeFilters: { label: string; value: string; clear: () => void }[] =
    [];
  if (statusFilter !== "all")
    activeFilters.push({
      label: "Status",
      value: statusFilter,
      clear: () => setStatusFilter("all"),
    });
  if (sportFilter !== "all")
    activeFilters.push({
      label: "Sport",
      value: sportFilter,
      clear: () => setSportFilter("all"),
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
  if (hostFilter !== "all")
    activeFilters.push({
      label: "Host",
      value: hostFilter,
      clear: () => setHostFilter("all"),
    });

  // ── Filtering ──
  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          t.name.toLowerCase().includes(q) ||
          t.sport.toLowerCase().includes(q) ||
          t.host.name.toLowerCase().includes(q) ||
          t.facility.location.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (sportFilter !== "all" && t.sport !== sportFilter) return false;
      if (hostFilter !== "all" && t.host.name !== hostFilter) return false;
      if (dateFrom) {
        const tDate = new Date(t.date);
        if (tDate < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const tDate = new Date(t.date);
        if (tDate > new Date(dateTo + "T23:59:59")) return false;
      }
      return true;
    });
  }, [
    tournaments,
    search,
    statusFilter,
    sportFilter,
    dateFrom,
    dateTo,
    hostFilter,
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

  const openDetail = (id: string) => navigate(`/tournaments/${id}`);

  const handleExport = () => {
    if (sorted.length === 0) {
      toast.warning("No data to export. Please adjust your filters.");
      return;
    }
    exportCSV(sorted);
    toast.success("Export file downloaded successfully.");
  };

  return (
    <TooltipProvider>
      <div
        className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen"
        role="main"
        aria-label="Tournament Management"
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
            <span className="text-[#111827] font-medium">Tournaments</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#111827]">
            Tournament Management
          </h1>
        </div>

        {/* ── Toolbar + Table Card ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 space-y-3">
            {/* Row 1: Search + Export */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[280px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by tournament name, sport, host, location..."
                  aria-label="Search tournaments by name, sport, host, or location"
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
                  aria-label="Export tournament data"
                  className="gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Row 2: Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  className="w-[150px] h-10 text-sm"
                  aria-label="Filter by tournament status"
                >
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {TOURNAMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sportFilter}
                onValueChange={(v) => {
                  setSportFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  className="w-[150px] h-10 text-sm"
                  aria-label="Filter by sport"
                >
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {SPORT_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                className="flex items-center gap-1.5 text-sm"
                aria-label="Filter by tournament date range"
              >
                <Input
                  type="date"
                  className="h-10 w-[140px] text-sm"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
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
                />
              </div>

              <Select
                value={hostFilter}
                onValueChange={(v) => {
                  setHostFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  className="w-[180px] h-10 text-sm"
                  aria-label="Filter by tournament host"
                >
                  <SelectValue placeholder="All Hosts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hosts</SelectItem>
                  {hosts.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
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
            aria-label="Tournaments table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <SortableHead
                    col="tournamentId"
                    label="ID"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[100px]"
                  />
                  <TableHead className="text-xs font-semibold text-gray-500 min-w-[60px]">
                    Image
                  </TableHead>
                  <SortableHead
                    col="name"
                    label="Name"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[200px]"
                  />
                  <SortableHead
                    col="sport"
                    label="Sport"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[120px]"
                  />
                  <SortableHead
                    col="location"
                    label="Location"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[160px]"
                  />
                  <SortableHead
                    col="dateTime"
                    label="Date/Time"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[150px]"
                  />
                  <SortableHead
                    col="fee"
                    label="Fee"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[120px]"
                  />
                  <SortableHead
                    col="status"
                    label="Status"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[130px]"
                  />
                  <SortableHead
                    col="facilityName"
                    label="Facility"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[160px]"
                  />
                  <SortableHead
                    col="hostName"
                    label="Host"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[150px]"
                  />
                  <SortableHead
                    col="registrationCount"
                    label="Registered"
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    className="min-w-[100px] text-center"
                  />
                  <TableHead className="text-xs font-semibold text-gray-500 min-w-[60px] text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 py-12">
                        <Trophy className="w-12 h-12 text-gray-200" />
                        <p className="text-base font-medium text-gray-500">
                          {hasFilters
                            ? "No Tournaments Found"
                            : "No Tournaments Yet"}
                        </p>
                        <p className="text-sm text-[#6B7280] max-w-md">
                          {hasFilters
                            ? "No tournaments match your current filters. Try adjusting your search or filter criteria."
                            : "No tournaments have been created on the platform yet."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((t, idx) => (
                    <TableRow
                      key={t.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-blue-50/40",
                        idx % 2 === 1 && "bg-gray-50/40",
                      )}
                      onClick={() => openDetail(t.id)}
                    >
                      {/* ID */}
                      <TableCell className="font-mono text-xs font-semibold text-[#003B95]">
                        {t.id}
                      </TableCell>

                      {/* Image */}
                      <TableCell>
                        <div
                          className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0"
                          aria-hidden="true"
                        >
                          {t.image ? (
                            <img
                              src={t.image}
                              alt=""
                              className="w-10 h-10 object-cover"
                            />
                          ) : (
                            <Trophy className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium text-[#111827] max-w-[200px] truncate block">
                              {t.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{t.name}</TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Sport */}
                      <TableCell className="text-sm text-[#111827]">
                        {t.sport}
                      </TableCell>

                      {/* Location */}
                      <TableCell className="text-sm text-[#6B7280] max-w-[160px] truncate">
                        {t.facility.location}
                      </TableCell>

                      {/* Date/Time */}
                      <TableCell className="text-sm text-[#111827] whitespace-nowrap">
                        {fmtDateTime(t.date)}
                      </TableCell>

                      {/* Fee */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {t.financials.feeType === "Free" ? (
                          <span className="text-[#6B7280]">Free</span>
                        ) : (
                          <span className="font-medium text-[#111827]">
                            {fmtCurrency(t.financials.entryFee)}
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium border",
                            STATUS_BADGE[t.status],
                          )}
                        >
                          {t.status}
                        </Badge>
                      </TableCell>

                      {/* Facility */}
                      <TableCell className="text-sm text-[#6B7280] max-w-[160px] truncate">
                        {t.facility.name}
                      </TableCell>

                      {/* Host */}
                      <TableCell className="text-sm text-[#111827]">
                        {t.host.name}
                      </TableCell>

                      {/* Registered */}
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-[#111827]">
                          {t.registrationCount} / {t.maxPlayers}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openDetail(t.id)}
                              aria-label={`View tournament ${t.name}`}
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
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
                <strong>{sorted.length.toLocaleString()}</strong> tournaments
              </span>
            </div>
            <nav
              aria-label="Tournaments table pagination"
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
