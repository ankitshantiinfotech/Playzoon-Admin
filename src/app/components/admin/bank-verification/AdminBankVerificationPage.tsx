// ─── SCR-ADM-029: Bank Account Verification List ──────────────────────────────
// Centralized view of all provider bank account submissions requiring review.
// Entry point for the bank verification workflow with filters, stat cards,
// export, and navigation to BankVerificationDetailPage (SCR-ADM-030).

import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  X,
  Download,
  Eye,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  BanknoteIcon,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  BVStatus,
  BVProviderType,
  BV_STATUS_STYLES,
  BV_PROVIDER_TYPE_STYLES,
} from "./types";
import { INITIAL_VERIFICATIONS } from "./mockData";

// ─── Types ──────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "Pending" | "Approved" | "Rejected" | "Revoked";
type ProviderTypeFilter = "all" | BVProviderType;
type SortField =
  | "providerName"
  | "providerType"
  | "bankName"
  | "submissionDate"
  | "status";
type SortDir = "asc" | "desc";

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  count,
  color,
  bgColor,
  borderColor,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="button"
      aria-label={`${label}: ${count} submissions. Click to filter.`}
      className={cn(
        "bg-white border rounded-xl p-4 flex items-start gap-3 shadow-sm transition-all cursor-pointer hover:shadow-md",
        isActive && `ring-2 ${borderColor}`,
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          bgColor,
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-xs text-[#6B7280]">{label}</p>
        <p className="text-2xl font-bold text-[#111827] mt-0.5">{count}</p>
      </div>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminBankVerificationPage() {
  const navigate = useNavigate();
  const records = INITIAL_VERIFICATIONS;

  // ── Search ──────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // ── Filters ─────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [providerTypeFilter, setProviderTypeFilter] =
    useState<ProviderTypeFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ── Sort ────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("submissionDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Pagination ──────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Selection ───────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Stats ───────────────────────────────────────────
  const stats = useMemo(() => {
    const pending = records.filter((r) => r.status === "Pending").length;
    const approved = records.filter((r) => r.status === "Approved").length;
    const rejected = records.filter((r) => r.status === "Rejected").length;
    const revoked = records.filter((r) => r.status === "Revoked").length;
    return { total: records.length, pending, approved, rejected, revoked };
  }, [records]);

  // ── Active filters check ──────────────────────────
  const hasActiveFilters =
    statusFilter !== "all" ||
    providerTypeFilter !== "all" ||
    !!dateFrom ||
    !!dateTo ||
    !!debouncedSearch;

  const clearAllFilters = () => {
    setStatusFilter("all");
    setProviderTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
  };

  // ── Filtering + Sorting ─────────────────────────────
  const filtered = useMemo(() => {
    let result = [...records];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.providerName.toLowerCase().includes(q) ||
          r.bankName.toLowerCase().includes(q) ||
          r.ibanFull.toLowerCase().includes(q) ||
          r.ibanMasked.toLowerCase().includes(q),
      );
    }

    // Status
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Provider type
    if (providerTypeFilter !== "all") {
      result = result.filter((r) => r.providerType === providerTypeFilter);
    }

    // Date range
    if (dateFrom) {
      result = result.filter((r) => r.submittedAt >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      result = result.filter((r) => r.submittedAt <= end);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "providerName":
          cmp = a.providerName.localeCompare(b.providerName);
          break;
        case "providerType":
          cmp = a.providerType.localeCompare(b.providerType);
          break;
        case "bankName":
          cmp = a.bankName.localeCompare(b.bankName);
          break;
        case "submissionDate":
          cmp = a.submittedAt.getTime() - b.submittedAt.getTime();
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    records,
    debouncedSearch,
    statusFilter,
    providerTypeFilter,
    dateFrom,
    dateTo,
    sortField,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Selection helpers ──────────────────────────────
  const allVisibleSelected =
    paged.length > 0 && paged.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paged.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paged.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Export ──────────────────────────────────────────
  const handleExport = (fmt: string) => {
    if (filtered.length === 0) {
      toast.warning("No data to export. Please adjust your filters.");
      return;
    }
    toast.success(
      `Export started. Your file will download shortly. (${fmt.toUpperCase()})`,
    );
  };

  // ── Stat card click handlers ──────────────────────
  const handleStatClick = (status: StatusFilter) => {
    if (statusFilter === status) {
      setStatusFilter("all");
    } else {
      setStatusFilter(status);
    }
    setPage(1);
  };

  // ── Sort icon ───────────────────────────────────────
  const SortIcon = ({ col }: { col: SortField }) => {
    if (sortField !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5 text-[#003B95]" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5 text-[#003B95]" />
    );
  };

  // ── Provider type badge ──────────────────────────
  const ProviderTypeBadge = ({ type }: { type: BVProviderType }) => {
    const styles = BV_PROVIDER_TYPE_STYLES[type];
    return (
      <Badge
        variant="outline"
        className={cn("text-xs border", styles.bg, styles.text, styles.border)}
      >
        {type}
      </Badge>
    );
  };

  // ── Status badge ──────────────────────────────────
  const StatusBadge = ({ status }: { status: BVStatus }) => {
    const ss = BV_STATUS_STYLES[status];
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
          ss.bg,
          ss.text,
          ss.border,
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", ss.dot)} />
        {status}
      </span>
    );
  };

  return (
    <div
      className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen"
      role="main"
      aria-label="Bank Account Verification"
    >
      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280]">
        <span
          className="hover:text-[#003B95] cursor-pointer"
          onClick={() => navigate("/")}
        >
          Admin
        </span>
        <span className="mx-2">/</span>
        <span
          className="hover:text-[#003B95] cursor-pointer"
          onClick={() => navigate("/commissions")}
        >
          Financial
        </span>
        <span className="mx-2">/</span>
        <span className="text-[#111827] font-medium">
          Bank Account Verification
        </span>
      </nav>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
          Bank Account Verification
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2"
              aria-label="Export bank account verification data"
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleExport("csv")}
              aria-label="Export as CSV"
            >
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport("xls")}
              aria-label="Export as XLS"
            >
              XLS
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div
            className="relative flex-1 min-w-[280px] max-w-[320px]"
            role="search"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search by provider name, bank name, or IBAN..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10"
              aria-label="Search bank account submissions"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="min-w-[160px]">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10" aria-label="Filter by status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Provider Type Filter */}
          <div className="min-w-[170px]">
            <Select
              value={providerTypeFilter}
              onValueChange={(v) => {
                setProviderTypeFilter(v as ProviderTypeFilter);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10"
                aria-label="Filter by provider type"
              >
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Facility Provider">
                  Facility Provider
                </SelectItem>
                <SelectItem value="Training Provider">
                  Training Provider
                </SelectItem>
                <SelectItem value="Freelancer Coach">Coach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div
            className="flex items-center gap-2"
            aria-label="Filter by submission date range"
          >
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#6B7280]">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="text-sm border border-gray-200 rounded-lg py-1.5 px-2 h-10 bg-white focus:ring-[#003B95] focus:outline-none focus:border-[#003B95]"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#6B7280]">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="text-sm border border-gray-200 rounded-lg py-1.5 px-2 h-10 bg-white focus:ring-[#003B95] focus:outline-none focus:border-[#003B95]"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="gap-1.5 text-xs text-red-500 hover:text-red-700 h-10"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Pending"
          count={stats.pending}
          color="text-amber-600"
          bgColor="bg-amber-50"
          borderColor="ring-amber-400/50"
          icon={Clock}
          isActive={statusFilter === "Pending"}
          onClick={() => handleStatClick("Pending")}
        />
        <StatCard
          label="Approved"
          count={stats.approved}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          borderColor="ring-emerald-400/50"
          icon={CheckCircle2}
          isActive={statusFilter === "Approved"}
          onClick={() => handleStatClick("Approved")}
        />
        <StatCard
          label="Rejected"
          count={stats.rejected}
          color="text-red-600"
          bgColor="bg-red-50"
          borderColor="ring-red-400/50"
          icon={XCircle}
          isActive={statusFilter === "Rejected"}
          onClick={() => handleStatClick("Rejected")}
        />
        <StatCard
          label="Total"
          count={stats.total}
          color="text-[#6B7280]"
          bgColor="bg-gray-50"
          borderColor="ring-gray-400/50"
          icon={BanknoteIcon}
          isActive={statusFilter === "all"}
          onClick={() => handleStatClick("all")}
        />
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div
          className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between"
          aria-live="polite"
        >
          <span className="text-sm text-blue-800 font-medium">
            {selectedIds.size} row{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* ── DataTable ── */}
      <div
        className="bg-white border rounded-xl overflow-hidden"
        role="table"
        aria-label="Bank account submissions table"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#6B7280] uppercase bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-3 py-3 w-[48px]">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                    aria-label="Select all rows"
                  />
                </th>
                <th
                  className="px-3 py-3 w-[180px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("providerName")}
                >
                  Provider Name <SortIcon col="providerName" />
                </th>
                <th
                  className="px-3 py-3 w-[140px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("providerType")}
                >
                  Provider Type <SortIcon col="providerType" />
                </th>
                <th
                  className="px-3 py-3 w-[160px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("bankName")}
                >
                  Bank Name <SortIcon col="bankName" />
                </th>
                <th className="px-3 py-3 w-[200px]">IBAN</th>
                <th
                  className="px-3 py-3 w-[150px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("submissionDate")}
                >
                  Submission Date <SortIcon col="submissionDate" />
                </th>
                <th
                  className="px-3 py-3 w-[120px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon col="status" />
                </th>
                <th className="px-3 py-3 w-[100px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length > 0 ? (
                paged.map((record, idx) => (
                  <tr
                    key={record.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-blue-50/40",
                      idx % 2 === 1 && "bg-gray-50/30",
                      selectedIds.has(record.id) && "bg-blue-50/60",
                    )}
                    onClick={() => navigate(`/bank-verification/${record.id}`)}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-3 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={() => toggleSelectRow(record.id)}
                        className="rounded border-gray-300"
                        aria-label={`Select submission for ${record.providerName}`}
                      />
                    </td>

                    {/* Provider Name */}
                    <td className="px-3 py-3">
                      <span
                        className="text-[#003B95] font-medium hover:underline cursor-pointer text-sm truncate block max-w-[170px]"
                        title={record.providerName}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/bank-verification/${record.id}`);
                        }}
                      >
                        {record.providerName}
                      </span>
                    </td>

                    {/* Provider Type */}
                    <td className="px-3 py-3">
                      <ProviderTypeBadge type={record.providerType} />
                    </td>

                    {/* Bank Name */}
                    <td className="px-3 py-3">
                      <span
                        className="text-sm text-[#111827] truncate block max-w-[150px]"
                        title={record.bankName}
                      >
                        {record.bankName}
                      </span>
                    </td>

                    {/* IBAN (masked) */}
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs text-[#6B7280] tracking-wide">
                        {record.ibanMasked}
                      </span>
                    </td>

                    {/* Submission Date */}
                    <td className="px-3 py-3 text-xs text-[#6B7280]">
                      {format(record.submittedAt, "dd MMM yyyy, HH:mm")} UTC
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <StatusBadge status={record.status} />
                    </td>

                    {/* Actions */}
                    <td
                      className="px-3 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-3 text-[#003B95] hover:text-[#002d73] text-xs"
                        onClick={() =>
                          navigate(`/bank-verification/${record.id}`)
                        }
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    {hasActiveFilters ? (
                      <>
                        <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-[#111827]">
                          No Bank Account Submissions
                        </p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          No bank account submissions match your current
                          filters.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <BanknoteIcon className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-[#111827]">
                          No Bank Account Submissions
                        </p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          Bank account submissions from providers will appear
                          here once submitted.
                        </p>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      <nav
        aria-label="Pagination"
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <p className="text-xs text-[#9CA3AF]">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)} of{" "}
            <strong>{filtered.length}</strong> submissions
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#9CA3AF]">Per page:</span>
            {[10, 20, 50].map((ps) => (
              <Button
                key={ps}
                variant={ps === pageSize ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setPageSize(ps);
                  setPage(1);
                }}
                className={cn(
                  "h-6 px-2 text-[10px]",
                  ps === pageSize && "bg-[#003B95] hover:bg-[#002d73]",
                )}
              >
                {ps}
              </Button>
            ))}
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0"
            >
              &lsaquo;
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p =
                totalPages <= 5
                  ? i + 1
                  : safePage <= 3
                    ? i + 1
                    : safePage >= totalPages - 2
                      ? totalPages - 4 + i
                      : safePage - 2 + i;
              return (
                <Button
                  key={p}
                  variant={p === safePage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-7 w-7 p-0 text-xs",
                    p === safePage && "bg-[#003B95] hover:bg-[#002d73]",
                  )}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 p-0"
            >
              &rsaquo;
            </Button>
          </div>
        )}
      </nav>
    </div>
  );
}
