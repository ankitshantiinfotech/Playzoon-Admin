import { useState, useMemo, useEffect, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Search,
  Filter,
  Inbox,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
  Send,
  Eye,
  Download,
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
import { toast } from "sonner";

import type {
  Enquiry,
  EnquiryCategory,
  EnquiryStatus,
  StatusHistoryEntry,
} from "./enquiry-types";
import {
  CATEGORY_STYLES,
  STATUS_STYLES,
  ACCOUNT_TYPE_STYLES,
} from "./enquiry-types";
import { EnquiryDetailPanel } from "./EnquiryDetailPanel";
import { adminService } from "@/services/admin.service";

// ─── Constants ───────────────────────────────────────────────

type SortField =
  | "id"
  | "submitterName"
  | "category"
  | "status"
  | "submittedAt"
  | "lastUpdated";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;
const CURRENT_ADMIN = "Super Admin";

// ─── Helpers ─────────────────────────────────────────────────

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function withHistory(
  e: Enquiry,
  entry: Omit<StatusHistoryEntry, "id">,
): Enquiry {
  return {
    ...e,
    statusHistory: [...e.statusHistory, { ...entry, id: `sh-${Date.now()}` }],
  };
}

// ─── Stat Card ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-4 flex items-start gap-3.5">
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#6B7280]">{label}</p>
        <p className="text-xl text-[#111827] mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapEnquiry = useCallback((e: Record<string, unknown>): Enquiry => {
    const statusMap: Record<string, EnquiryStatus> = {
      open: "Open",
      in_progress: "Open",
      resolved: "Resolved",
      closed: "Resolved",
    };
    return {
      id: String(e.id || ""),
      submitterName: String(e.name || "Unknown"),
      submitterEmail: String(e.email || ""),
      submitterPhone: String(e.phone || ""),
      accountType: String(e.user_type || "Player") as Enquiry["accountType"],
      category: String(e.category || "General") as EnquiryCategory,
      subject: String(e.message_preview || "No subject"),
      message: String(e.message_preview || ""),
      status: statusMap[String(e.status || "open")] || "Open",
      submittedAt: new Date(String(e.created_at || Date.now())),
      lastUpdated: new Date(String(e.updated_at || Date.now())),
      adminNotes: "",
      statusHistory: [],
    };
  }, []);

  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.listEnquiries({ page: 1, limit: 100 });
      const list = res?.enquiries || res?.data?.enquiries || [];
      setEnquiries(Array.isArray(list) ? list.map(mapEnquiry) : []);
    } catch (err) {
      console.error("Failed to load enquiries:", err);
      toast.error("Failed to load enquiries.");
    } finally {
      setIsLoading(false);
    }
  }, [mapEnquiry]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // ── Filters ─────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // ── Sort ────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("submittedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Pagination ──────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── Detail panel ────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusReply, setFocusReply] = useState(false);

  // ── Computed stats ──────────────────────────────────────
  const stats = useMemo(() => {
    const open = enquiries.filter((e) => e.status === "Open").length;
    const resolved = enquiries.filter((e) => e.status === "Resolved").length;

    return { total: enquiries.length, open, resolved };
  }, [enquiries]);

  // ── Active filters count ─────────────────────────────────
  const activeFiltersCount = [
    catFilter !== "all",
    statusFilter !== "all",
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  // ── Filtering ────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      enquiries.filter((e) => {
        if (search) {
          const q = search.toLowerCase();
          if (
            !e.submitterName.toLowerCase().includes(q) &&
            !e.submitterEmail.toLowerCase().includes(q) &&
            !e.subject.toLowerCase().includes(q) &&
            !e.id.toLowerCase().includes(q)
          )
            return false;
        }
        if (catFilter !== "all" && e.category !== catFilter) return false;
        if (statusFilter !== "all" && e.status !== statusFilter) return false;
        if (dateFrom) {
          const d = new Date(dateFrom);
          d.setHours(0, 0, 0, 0);
          if (e.submittedAt < d) return false;
        }
        if (dateTo) {
          const d = new Date(dateTo);
          d.setHours(23, 59, 59, 999);
          if (e.submittedAt > d) return false;
        }
        return true;
      }),
    [enquiries, search, catFilter, statusFilter, dateFrom, dateTo],
  );

  // ── Sorting ──────────────────────────────────────────────
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "id":
            cmp = a.id.localeCompare(b.id);
            break;
          case "submitterName":
            cmp = a.submitterName.localeCompare(b.submitterName);
            break;
          case "category":
            cmp = a.category.localeCompare(b.category);
            break;
          case "status": {
            const ord: Record<EnquiryStatus, number> = { Open: 0, Resolved: 1 };
            cmp = ord[a.status] - ord[b.status];
            break;
          }
          case "submittedAt":
            cmp = a.submittedAt.getTime() - b.submittedAt.getTime();
            break;
          case "lastUpdated":
            cmp = a.lastUpdated.getTime() - b.lastUpdated.getTime();
            break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      }),
    [filtered, sortField, sortDir],
  );

  // ── Pagination ───────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Sort handler ─────────────────────────────────────────
  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(f);
      setSortDir(f === "submittedAt" || f === "lastUpdated" ? "desc" : "asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField !== field ? (
      <ArrowUpDown className="h-3 w-3 text-gray-300" />
    ) : sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-[#003B95]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#003B95]" />
    );

  // ── Clear filters ────────────────────────────────────────
  const clearFilters = () => {
    setSearch("");
    setCatFilter("all");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  // ── Open detail panel ────────────────────────────────────
  const openDetail = (id: string, reply = false) => {
    setFocusReply(reply);
    setSelectedId(id);
  };

  const selectedEnquiry = enquiries.find((e) => e.id === selectedId) ?? null;

  const handleUpdate = (updated: Enquiry) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e)),
    );
  };

  // ── Quick action: Mark as Resolved ───────────────────────
  const quickResolve = (e: React.MouseEvent, enq: Enquiry) => {
    e.stopPropagation();
    if (enq.status === "Resolved") return;
    const now = new Date();
    let updated: Enquiry = { ...enq, status: "Resolved", lastUpdated: now };
    updated = withHistory(updated, {
      event: "Resolved",
      actor: CURRENT_ADMIN,
      timestamp: now,
      note: "Resolved via quick action in list",
    });
    handleUpdate(updated);
    toast.success(`Enquiry ${enq.id} marked as Resolved.`);
  };

  // ── CSV Export ────────────────────────────────────────────
  const handleExport = () => {
    const rows = [
      [
        "Enquiry ID",
        "Submitter Name",
        "Email",
        "Account Type",
        "Category",
        "Subject",
        "Date Submitted",
        "Status",
        "Assigned To",
      ],
      ...sorted.map((e) => [
        e.id,
        e.submitterName,
        e.submitterEmail,
        e.accountType,
        e.category,
        `"${e.subject.replace(/"/g, '""')}"`,
        format(e.submittedAt, "dd MMM yyyy HH:mm"),
        e.status,
        e.assignedTo ?? "Unassigned",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `enquiries-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    toast.success("CSV exported");
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Contact Us Enquiries
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Centralised inbox for all player, provider and guest enquiries.
            Respond, escalate, and resolve.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          className="gap-2 shrink-0"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Enquiries"
          value={stats.total}
          icon={Inbox}
          color="bg-blue-50 text-[#003B95]"
        />
        <StatCard
          label="Open"
          value={stats.open}
          icon={AlertTriangle}
          color={
            stats.open > 0
              ? "bg-amber-50 text-amber-600"
              : "bg-gray-50 text-gray-400"
          }
          sub={stats.open > 0 ? "Awaiting response" : "None open"}
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search — BR-124 searches name, email, subject */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search by name, email, subject, or enquiry ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("gap-2 shrink-0", showFilters && "bg-gray-50")}
          >
            <Filter className="h-4 w-4" /> Filters
            {activeFiltersCount > 0 && (
              <Badge className="bg-[#003B95] text-white text-[10px] h-5 min-w-[20px]">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t">
            {/* Status filter (Open / Resolved / All) */}
            <div className="space-y-1 min-w-[150px]">
              <label className="text-[11px] text-[#6B7280] uppercase tracking-wide">
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {(["Open", "Resolved"] as EnquiryStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category filter */}
            <div className="space-y-1 min-w-[170px]">
              <label className="text-[11px] text-[#6B7280] uppercase tracking-wide">
                Category
              </label>
              <Select
                value={catFilter}
                onValueChange={(v) => {
                  setCatFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(
                    [
                      "General Inquiry",
                      "Technical Issue",
                      "Booking Issue",
                      "Payment Issue",
                      "Feedback",
                      "Other",
                    ] as EnquiryCategory[]
                  ).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-[11px] text-[#6B7280] uppercase tracking-wide">
                From
              </label>
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
                    {dateFrom ? format(dateFrom, "dd MMM yyyy") : "Start date"}
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
              <label className="text-[11px] text-[#6B7280] uppercase tracking-wide">
                To
              </label>
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
                    {dateTo ? format(dateTo, "dd MMM yyyy") : "End date"}
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

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 text-xs text-red-500 hover:text-red-700 h-10"
              >
                <X className="h-3.5 w-3.5" /> Clear all
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-[#9CA3AF]">
        Showing {sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
        {Math.min(safePage * PAGE_SIZE, sorted.length)} of{" "}
        <strong>{sorted.length}</strong> enquiries
        {activeFiltersCount > 0 && " (filtered)"}
      </p>

      {/* ── Data Table ────────────────────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="px-4 w-[150px]">
                <button
                  onClick={() => handleSort("id")}
                  className="flex items-center gap-1.5 text-xs hover:text-[#003B95]"
                >
                  Enquiry ID <SortIcon field="id" />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button
                  onClick={() => handleSort("submitterName")}
                  className="flex items-center gap-1.5 text-xs hover:text-[#003B95]"
                >
                  Submitter <SortIcon field="submitterName" />
                </button>
              </TableHead>
              <TableHead className="px-4 hidden md:table-cell">Email</TableHead>
              <TableHead className="px-4">
                <button
                  onClick={() => handleSort("category")}
                  className="flex items-center gap-1.5 text-xs hover:text-[#003B95]"
                >
                  Category <SortIcon field="category" />
                </button>
              </TableHead>
              <TableHead className="px-4 hidden lg:table-cell">
                Subject
              </TableHead>
              <TableHead className="px-4 hidden xl:table-cell">
                <button
                  onClick={() => handleSort("submittedAt")}
                  className="flex items-center gap-1.5 text-xs hover:text-[#003B95]"
                >
                  Date Submitted <SortIcon field="submittedAt" />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1.5 text-xs hover:text-[#003B95]"
                >
                  Status <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead className="px-4 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paged.length > 0 ? (
              paged.map((enq) => {
                const catStyle = CATEGORY_STYLES[enq.category];
                const sStyle = STATUS_STYLES[enq.status];
                const accStyle = ACCOUNT_TYPE_STYLES[enq.accountType];
                const isOpen = enq.status === "Open";
                const isResolved = enq.status === "Resolved";

                return (
                  <TableRow
                    key={enq.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedId === enq.id && "bg-blue-50/40",
                      isOpen && "bg-red-50/20",
                    )}
                    onClick={() => openDetail(enq.id)}
                  >
                    {/* Enquiry ID */}
                    <TableCell className="px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs text-[#6B7280]">
                          {enq.id}
                        </span>
                        {enq.isGuest && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-gray-50 text-gray-500 border-gray-200 block w-fit"
                          >
                            Guest
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Submitter Name + Account Type */}
                    <TableCell className="px-4">
                      <div className="space-y-0.5">
                        <p className="text-sm text-[#111827] truncate max-w-[130px]">
                          {enq.submitterName}
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[9px] border",
                            accStyle.bg,
                            accStyle.text,
                            accStyle.border,
                          )}
                        >
                          {enq.accountType}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="px-4 hidden md:table-cell">
                      <span className="text-xs text-[#6B7280] truncate block max-w-[180px]">
                        {enq.submitterEmail}
                      </span>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="px-4">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] border whitespace-nowrap",
                          catStyle.bg,
                          catStyle.text,
                          catStyle.border,
                        )}
                      >
                        {enq.category}
                      </Badge>
                    </TableCell>

                    {/* Subject (truncated to 60 chars per spec) */}
                    <TableCell className="px-4 hidden lg:table-cell">
                      <p
                        className="text-sm text-[#374151] max-w-[220px] truncate"
                        title={enq.subject}
                      >
                        {truncate(enq.subject, 60)}
                      </p>
                    </TableCell>

                    {/* Date Submitted — DD MMM YYYY HH:MM */}
                    <TableCell className="px-4 hidden xl:table-cell">
                      <div>
                        <p className="text-xs text-[#374151]">
                          {format(enq.submittedAt, "dd MMM yyyy")}
                        </p>
                        <p className="text-[10px] text-[#9CA3AF]">
                          {format(enq.submittedAt, "HH:mm")}
                        </p>
                      </div>
                    </TableCell>

                    {/* Status badge — Open=red, In Progress=amber, Resolved=green */}
                    <TableCell className="px-4">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] gap-1.5 whitespace-nowrap",
                          sStyle.bg,
                          sStyle.text,
                        )}
                      >
                        <span
                          className={cn("w-1.5 h-1.5 rounded-full", sStyle.dot)}
                        />
                        {enq.status}
                      </Badge>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                        {formatDistanceToNow(enq.lastUpdated, {
                          addSuffix: true,
                        })}
                      </p>
                    </TableCell>

                    {/* Quick Actions: View, Reply, Mark as Resolved */}
                    <TableCell
                      className="px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 justify-center flex-wrap">
                        {/* View */}
                        <button
                          onClick={() => openDetail(enq.id, false)}
                          title="View enquiry"
                          className="p-1.5 rounded-lg text-[#003B95] hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Reply */}
                        {!isResolved && (
                          <button
                            onClick={() => openDetail(enq.id, true)}
                            title="Reply"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Mark as Resolved */}
                        {!isResolved && (
                          <button
                            onClick={(e) => quickResolve(e, enq)}
                            title="Mark as Resolved"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-gray-200" />
                    <p className="text-sm text-[#9CA3AF]">
                      No enquiries match your criteria
                    </p>
                    <p className="text-xs text-[#D1D5DB]">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
            <p className="text-xs text-[#9CA3AF]">
              Page {safePage} of {totalPages} · {sorted.length} results
            </p>
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
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p =
                  totalPages <= 7
                    ? i + 1
                    : safePage <= 4
                      ? i + 1
                      : safePage >= totalPages - 3
                        ? totalPages - 6 + i
                        : safePage - 3 + i;
                return (
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
                );
              })}
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

      {/* ── Detail Slide-Over Panel ──────────────────────── */}
      {selectedEnquiry && (
        <EnquiryDetailPanel
          enquiry={selectedEnquiry}
          onClose={() => {
            setSelectedId(null);
            setFocusReply(false);
          }}
          onUpdate={handleUpdate}
          focusReply={focusReply}
        />
      )}
    </div>
  );
}
