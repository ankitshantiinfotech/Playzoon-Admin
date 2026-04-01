import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { format, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  CalendarIcon,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  MapPin,
  Users,
  Shield,
  Bell,
  RefreshCw,
  UserCheck,
  Minus,
  CheckCircle2,
  XCircle,
  Lock,
  Info,
  AlertTriangle,
  Plus,
  Trash2,
  UserX,
  Mail,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";

import type { PlayerRow, PlayerStatus, AppliedFilters } from "./player-data";
import { EMPTY_FILTERS } from "./player-data";
import { adminService } from "@/services/admin.service";
import { StatusPill } from "./components/StatusPill";
import { BulkActionsModal, type BulkActionResult } from "./components/BulkActionsModal";
import { ExportModal } from "./components/ExportModal";
import { PlayerAuditDrawer } from "./components/PlayerAuditDrawer";

// ─── Constants ───────────────────────────────────────────────

type SortField = "name" | "email" | "status" | "createdAt";
type SortDir = "asc" | "desc";
const PAGE_SIZES = [10, 25, 50, 100];
// totalRecords is now dynamic from API (totalRecords state)

// ─── Skeleton Row ─────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="px-3 w-10"><div className="h-4 w-4 rounded bg-gray-200 animate-pulse" /></TableCell>
      <TableCell className="px-3"><div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse shrink-0" /><div className="space-y-1.5"><div className="h-3 w-28 rounded bg-gray-200 animate-pulse" /><div className="h-2.5 w-16 rounded bg-gray-100 animate-pulse" /></div></div></TableCell>
      <TableCell className="px-3"><div className="h-3 w-36 rounded bg-gray-200 animate-pulse" /></TableCell>
      <TableCell className="px-3 hidden lg:table-cell"><div className="h-3 w-24 rounded bg-gray-200 animate-pulse" /></TableCell>
      <TableCell className="px-3 hidden lg:table-cell"><div className="h-3 w-16 rounded bg-gray-200 animate-pulse" /></TableCell>
      <TableCell className="px-3 hidden lg:table-cell"><div className="h-3 w-20 rounded bg-gray-200 animate-pulse" /></TableCell>
      <TableCell className="px-3"><div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" /></TableCell>
      <TableCell className="px-3"><div className="h-5 w-18 rounded-full bg-gray-200 animate-pulse" /></TableCell>
      <TableCell className="px-3 hidden xl:table-cell"><div className="h-3 w-20 rounded bg-gray-200 animate-pulse" /></TableCell>
      <TableCell className="px-3 w-10" />
    </TableRow>
  );
}

// ─── Alert Banner ────────────────────────────────────────────

type BannerType = "success" | "error" | "info" | "warning";

interface BannerState {
  type: BannerType;
  message: string;
  visible: boolean;
}

const BANNER_STYLES: Record<BannerType, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: CheckCircle2 },
  error:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     icon: XCircle },
  info:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    icon: Info },
  warning: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   icon: AlertTriangle },
};

// ─── Main Component ──────────────────────────────────────────

export function PlayerManagementPage() {
  const navigate = useNavigate();

  // ── Loading skeleton ────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  // ── Data ──────────────────────────────────────────────
  const [players, setPlayers] = useState<PlayerRow[]>([]);

  // Map API response to PlayerRow
  const mapApiPlayer = (p: any): PlayerRow => ({
    id: p.id,
    firstName: p.first_name || p.first_name_en || "",
    lastName: p.last_name || p.last_name_en || "",
    email: p.email || "",
    phone: p.phone || p.mobile || "",
    gender: p.gender || "",
    status: (p.status === "active" ? "Active" : p.status === "locked" ? "Locked" : "Inactive") as PlayerStatus,
    dependents: p.dependants_count || 0,
    createdAt: new Date(p.created_at),
    lastActiveAt: p.last_active_at ? new Date(p.last_active_at) : new Date(p.created_at),
    avatarUrl: p.avatar_url || undefined,
    lockedUntil: p.locked_until || undefined,
    walletBalance: parseFloat(p.wallet_balance || "0"),
    isSSOUser: !!p.is_sso_user,
    nationality: p.nationality?.name_en || "",
    defaultCity: p.default_city || "",
    defaultCountry: p.default_country || "",
    savedAddressesCount: p.addresses_count || 0,
  });

  const fetchPlayers = async (params: Record<string, unknown> = {}) => {
    setIsLoading(true);
    try {
      const res = await adminService.listPlayers(params);
      // API returns { success, data: { players, pagination }, message }
      // adminService unwraps one level (r.data), so res = { success, data: { players, pagination } }
      const payload = res?.data || res;
      const list = (payload?.players || payload || []);
      const mapped = Array.isArray(list) ? list.map(mapApiPlayer) : [];
      setPlayers(mapped);
      setTotalRecords(payload?.pagination?.total_items || payload?.pagination?.total || mapped.length);
    } catch (err: any) {
      console.error("Failed to load players:", err);
      showBanner("error", "Failed to load players. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers({ page: 1, limit: 25 });
  }, []);

  // ── Banner ────────────────────────────────────────────
  const [banner, setBanner] = useState<BannerState>({ type: "info", message: "", visible: false });
  const showBanner = (type: BannerType, message: string) => {
    setBanner({ type, message, visible: true });
    if (type === "success" || type === "info") {
      setTimeout(() => setBanner((b) => ({ ...b, visible: false })), 5000);
    }
  };

  // ── Filters ───────────────────────────────────────────
  const [filters, setFilters] = useState<AppliedFilters>({ ...EMPTY_FILTERS });
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDraft, setFilterDraft] = useState<AppliedFilters>({ ...EMPTY_FILTERS });
  const [filterErrors, setFilterErrors] = useState<Record<string, string>>({});
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Sort ──────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Pagination ────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // ── Selection ─────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllPages, setSelectAllPages] = useState(false);

  // ── Modals ────────────────────────────────────────────
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkPreselect, setBulkPreselect] = useState<"change_status" | "send_notification" | "delete">("change_status");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"current_view" | "selected">("current_view");

  // ── Simple bulk confirmations (AC-PM-019 / AC-PM-020) ─
  const [bulkDeactivateOpen, setBulkDeactivateOpen] = useState(false);
  const [bulkDeleteSimpleOpen, setBulkDeleteSimpleOpen] = useState(false);

  // ── Audit drawer ──────────────────────────────────────
  const [auditPlayer, setAuditPlayer] = useState<PlayerRow | null>(null);

  // ── Keyboard shortcut ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Apply search on Enter ─────────────────────────────
  const submitSearch = () => {
    if (searchInput.length > 200) {
      toast.error("Search query must be 200 characters or less.");
      return;
    }
    setFilters((f) => ({ ...f, search: searchInput }));
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setFilters((f) => ({ ...f, search: "" }));
    setPage(1);
  };

  // ── Filter validation ─────────────────────────────────
  const validateFilters = (): boolean => {
    const e: Record<string, string> = {};
    if (filterDraft.createdFrom && filterDraft.createdTo) {
      if (isBefore(filterDraft.createdTo, filterDraft.createdFrom)) {
        // AC-PM-028
        e.createdTo = "Start date cannot be after end date.";
      }
    }
    if (filterDraft.lastActiveFrom && filterDraft.lastActiveTo) {
      if (isBefore(filterDraft.lastActiveTo, filterDraft.lastActiveFrom)) {
        e.lastActiveTo = "Start date cannot be after end date.";
      }
    }
    setFilterErrors(e);
    return Object.keys(e).length === 0;
  };

  const applyFilters = () => {
    if (!validateFilters()) return;
    setFilters((f) => ({ ...f, ...filterDraft }));
    setPage(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilterDraft({ ...EMPTY_FILTERS });
    setFilterErrors({});
  };

  // ── Status multi-select toggle ────────────────────────
  const toggleStatusFilter = (status: PlayerStatus) => {
    setFilterDraft((d) => ({
      ...d,
      statuses: d.statuses.includes(status)
        ? d.statuses.filter((s) => s !== status)
        : [...d.statuses, status],
    }));
  };

  // ── Active chips ──────────────────────────────────────
  const chips = useMemo(() => {
    const c: { key: string; label: string; value: string }[] = [];
    if (filters.search) c.push({ key: "search", label: "Search", value: filters.search });
    if (filters.statuses.length > 0) c.push({ key: "statuses", label: "Status", value: filters.statuses.join(", ") });
    if (filters.createdFrom) c.push({ key: "createdFrom", label: "Created From", value: format(filters.createdFrom, "MMM d, yyyy") });
    if (filters.createdTo) c.push({ key: "createdTo", label: "Created To", value: format(filters.createdTo, "MMM d, yyyy") });
    if (filters.lastActiveFrom) c.push({ key: "lastActiveFrom", label: "Active From", value: format(filters.lastActiveFrom, "MMM d, yyyy") });
    if (filters.lastActiveTo) c.push({ key: "lastActiveTo", label: "Active To", value: format(filters.lastActiveTo, "MMM d, yyyy") });
    if (filters.hasDependents) c.push({ key: "hasDependents", label: "Has dependents", value: "" });
    return c;
  }, [filters]);

  const removeChip = (key: string) => {
    setFilters((f) => {
      const next = { ...f };
      if (key === "search") { next.search = ""; setSearchInput(""); }
      if (key === "statuses") next.statuses = [];
      if (key === "createdFrom") next.createdFrom = undefined;
      if (key === "createdTo") next.createdTo = undefined;
      if (key === "lastActiveFrom") next.lastActiveFrom = undefined;
      if (key === "lastActiveTo") next.lastActiveTo = undefined;
      if (key === "hasDependents") next.hasDependents = false;
      return next;
    });
    setFilterDraft((d) => {
      const next = { ...d };
      if (key === "statuses") next.statuses = [];
      if (key === "createdFrom") next.createdFrom = undefined;
      if (key === "createdTo") next.createdTo = undefined;
      if (key === "lastActiveFrom") next.lastActiveFrom = undefined;
      if (key === "lastActiveTo") next.lastActiveTo = undefined;
      if (key === "hasDependents") next.hasDependents = false;
      return next;
    });
    setPage(1);
  };

  const clearAllChips = () => {
    setFilters({ ...EMPTY_FILTERS });
    setFilterDraft({ ...EMPTY_FILTERS });
    setSearchInput("");
    setPage(1);
  };

  // ── Filtering ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        if (
          !fullName.includes(q) &&
          !p.email.toLowerCase().includes(q) &&
          !p.phone.includes(q) &&
          !p.id.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(p.status)) return false;
      if (filters.createdFrom && isBefore(p.createdAt, startOfDay(filters.createdFrom))) return false;
      if (filters.createdTo && isAfter(p.createdAt, endOfDay(filters.createdTo))) return false;
      if (filters.lastActiveFrom && isBefore(p.lastActiveAt, startOfDay(filters.lastActiveFrom))) return false;
      if (filters.lastActiveTo && isAfter(p.lastActiveAt, endOfDay(filters.lastActiveTo))) return false;
      if (filters.hasDependents && p.dependents === 0) return false;
      return true;
    });
  }, [players, filters]);

  // ── Sorting ───────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "status": {
          const order: Record<PlayerStatus, number> = { Active: 0, Inactive: 1, Locked: 2 };
          cmp = order[a.status] - order[b.status];
          break;
        }
        case "createdAt":
          cmp = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  // ── Pagination ────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = sorted.length > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safePage * pageSize, sorted.length);

  // ── Sort handler ──────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "createdAt" ? "desc" : "asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-[#003B95]" /> : <ArrowDown className="h-3 w-3 text-[#003B95]" />;
  };

  // ── Selection ─────────────────────────────────────────
  const pageIds = paged.map((p) => p.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const effectiveSelectedCount = selectAllPages ? totalRecords : selectedIds.size;

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
      setSelectAllPages(false);
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectAllPages(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectAllPages(false);
  };

  // ── Bulk action handler ───────────────────────────────
  const handleBulkConfirm = (result: BulkActionResult) => {
    if (result.type === "change_status" && result.newStatus) {
      const count = effectiveSelectedCount;
      setPlayers((prev) =>
        prev.map((p) => (selectedIds.has(p.id) ? { ...p, status: result.newStatus! } : p))
      );
      showBanner("success", `Status updated for ${count} player${count !== 1 ? "s" : ""}.`);
    } else if (result.type === "send_notification") {
      showBanner("success", `Your message was sent to ${effectiveSelectedCount} player${effectiveSelectedCount !== 1 ? "s" : ""}.`);
    } else if (result.type === "delete") {
      // AC-PM-020: Remove selected players
      const count = selectedIds.size;
      setPlayers((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      showBanner("success", `${count} player${count !== 1 ? "s" : ""} permanently deleted.`);
      toast.success(`${count} player${count !== 1 ? "s have" : " has"} been deleted.`);
    }
    clearSelection();
  };

  // AC-PM-019: Simple bulk deactivate handler
  const handleBulkDeactivateConfirm = () => {
    const count = selectedIds.size;
    setPlayers((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, status: "Inactive" as PlayerStatus } : p))
    );
    setBulkDeactivateOpen(false);
    clearSelection();
    showBanner("success", `${count} player${count !== 1 ? "s" : ""} deactivated successfully.`);
    toast.success(`${count} player${count !== 1 ? "s" : ""} deactivated.`);
  };

  // AC-PM-020: Simple bulk delete handler
  const handleBulkDeleteSimpleConfirm = () => {
    const count = selectedIds.size;
    setPlayers((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setBulkDeleteSimpleOpen(false);
    clearSelection();
    showBanner("success", `${count} player${count !== 1 ? "s" : ""} permanently deleted.`);
    toast.success(`${count} player${count !== 1 ? "s have" : " has"} been deleted.`);
  };

  // ── Pagination size/page numbers ──────────────────────
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* ── Alert Banner ──────────────────────────────────── */}
      {banner.visible && (
        <div
          role={banner.type === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border",
            BANNER_STYLES[banner.type].bg,
            BANNER_STYLES[banner.type].border,
            BANNER_STYLES[banner.type].text
          )}
        >
          {(() => { const Icon = BANNER_STYLES[banner.type].icon; return <Icon className="h-4 w-4 shrink-0" />; })()}
          <p className="text-sm flex-1">{banner.message}</p>
          <button onClick={() => setBanner((b) => ({ ...b, visible: false }))} className="p-1 rounded hover:bg-black/5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Player Accounts</h1>
          <p className="text-sm text-[#6B7280] mt-1">Search, filter, bulk-update, and export players.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/players/new")}
            className="bg-[#003B95] hover:bg-[#002a6b] gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create New Player
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0" disabled={isLoading}>
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setExportScope("current_view"); setExportModalOpen(true); }}>
                Export current view
              </DropdownMenuItem>
              {selectedIds.size > 0 && (
                <DropdownMenuItem onClick={() => { setExportScope("selected"); setExportModalOpen(true); }}>
                  Export selected ({selectedIds.size})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Search & Filter Toggle ────────────────────────── */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              ref={searchRef}
              placeholder="Search by name, email, phone, or ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
              className="pl-9 pr-8"
              aria-label="Player quick search"
              aria-describedby="search-hint"
              disabled={isLoading}
            />
            {searchInput && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100">
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
          </div>
          <span id="search-hint" className="sr-only">Press Enter to search</span>
          <Button
            variant="outline"
            onClick={() => {
              setShowFilters(!showFilters);
              if (!showFilters) setFilterDraft({ ...filters, search: filters.search });
            }}
            className={cn("gap-2 shrink-0", showFilters && "bg-gray-50")}
            aria-expanded={showFilters}
            disabled={isLoading}
          >
            <Filter className="h-4 w-4" />
            Filters
            {chips.length > 0 && (
              <Badge className="bg-[#003B95] text-white text-[10px] h-5 min-w-[20px]">
                {chips.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* ── Advanced Filters Panel ──────────────────────── */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent>
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status multi */}
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["Active", "Inactive", "Locked"] as PlayerStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleStatusFilter(s)}
                        className={cn(
                          "px-3 py-1.5 rounded-full border text-xs transition-colors",
                          filterDraft.statuses.includes(s)
                            ? s === "Active" ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                              : s === "Locked" ? "bg-red-100 border-red-300 text-red-800"
                              : "bg-gray-200 border-gray-300 text-gray-800"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400">Select one or more statuses.</p>
                </div>

                {/* Has dependents */}
                <div className="space-y-1.5 flex items-end pb-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="f-has-deps"
                      checked={filterDraft.hasDependents}
                      onCheckedChange={(c) => setFilterDraft((d) => ({ ...d, hasDependents: !!c }))}
                    />
                    <Label htmlFor="f-has-deps" className="text-sm cursor-pointer">Has Dependents</Label>
                  </div>
                </div>

                {/* Created From / To */}
                <div className="space-y-1.5">
                  <Label>Created From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start gap-2 text-sm", !filterDraft.createdFrom && "text-muted-foreground")}>
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {filterDraft.createdFrom ? format(filterDraft.createdFrom, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filterDraft.createdFrom} onSelect={(d) => setFilterDraft((f) => ({ ...f, createdFrom: d }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <p className="text-[11px] text-gray-400">Must be a valid date.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Created To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start gap-2 text-sm", !filterDraft.createdTo && "text-muted-foreground", filterErrors.createdTo && "border-red-400")}>
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {filterDraft.createdTo ? format(filterDraft.createdTo, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filterDraft.createdTo} onSelect={(d) => setFilterDraft((f) => ({ ...f, createdTo: d }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                  {filterErrors.createdTo
                    ? <p className="text-[11px] text-red-500">{filterErrors.createdTo}</p>
                    : <p className="text-[11px] text-gray-400">Must be on or after Created From.</p>
                  }
                </div>

                {/* Last Active From / To */}
                <div className="space-y-1.5">
                  <Label>Last Active From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start gap-2 text-sm", !filterDraft.lastActiveFrom && "text-muted-foreground")}>
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {filterDraft.lastActiveFrom ? format(filterDraft.lastActiveFrom, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filterDraft.lastActiveFrom} onSelect={(d) => setFilterDraft((f) => ({ ...f, lastActiveFrom: d }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <p className="text-[11px] text-gray-400">Must be a valid date.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Last Active To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start gap-2 text-sm", !filterDraft.lastActiveTo && "text-muted-foreground", filterErrors.lastActiveTo && "border-red-400")}>
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {filterDraft.lastActiveTo ? format(filterDraft.lastActiveTo, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filterDraft.lastActiveTo} onSelect={(d) => setFilterDraft((f) => ({ ...f, lastActiveTo: d }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                  {filterErrors.lastActiveTo
                    ? <p className="text-[11px] text-red-500">{filterErrors.lastActiveTo}</p>
                    : <p className="text-[11px] text-gray-400">Must be on or after Last Active From.</p>
                  }
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
                <Button size="sm" onClick={applyFilters} className="bg-[#003B95] hover:bg-[#002a6b]">Apply</Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* ── Active Filter Chips ───────────────────────────── */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => removeChip(chip.key)}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
              aria-label={`Remove filter ${chip.label}: ${chip.value || "yes"}`}
            >
              <span className="text-blue-400">{chip.label}:</span>
              <span>{chip.value || "Yes"}</span>
              <X className="h-3 w-3 text-blue-400 hover:text-blue-600" />
            </button>
          ))}
          <button onClick={clearAllChips} className="text-xs text-red-500 hover:text-red-700 hover:underline ml-1">
            Clear all
          </button>
        </div>
      )}

      {/* ── Bulk Selection Toolbar ─────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 bg-[#003B95] text-white rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-3 shadow-lg">
          <span className="text-sm">
            {selectAllPages ? `All ${totalRecords.toLocaleString()} players selected` : `${selectedIds.size} selected`}
          </span>

          {!selectAllPages && allPageSelected && (
            <button
              onClick={() => setSelectAllPages(true)}
              className="text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
            >
              Select all {totalRecords.toLocaleString()} players?
            </button>
          )}
          {selectAllPages && (
            <button
              onClick={() => setSelectAllPages(false)}
              className="text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
            >
              Undo
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs gap-1.5 bg-white/20 text-white hover:bg-white/30 border-0"
              onClick={() => { setBulkPreselect("change_status"); setBulkModalOpen(true); }}
            >
              <RefreshCw className="h-3 w-3" />
              Change Status
            </Button>
            {/* AC-PM-019: Bulk Deactivate — simple confirmation */}
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs gap-1.5 bg-amber-500/80 text-white hover:bg-amber-500 border-0"
              onClick={() => setBulkDeactivateOpen(true)}
            >
              <UserX className="h-3 w-3" />
              Deactivate
            </Button>
            {/* AC-PM-020: Bulk Delete — simple confirmation */}
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs gap-1.5 bg-red-500/80 text-white hover:bg-red-600 border-0"
              onClick={() => setBulkDeleteSimpleOpen(true)}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs gap-1.5 bg-white/20 text-white hover:bg-white/30 border-0"
              onClick={() => { setBulkPreselect("send_notification"); setBulkModalOpen(true); }}
            >
              <Bell className="h-3 w-3" />
              Notify
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs gap-1.5 bg-white/20 text-white hover:bg-white/30 border-0"
              onClick={() => { setExportScope("selected"); setExportModalOpen(true); }}
            >
              <Download className="h-3 w-3" />
              Export
            </Button>
            <button onClick={clearSelection} className="p-1 rounded hover:bg-white/20 ml-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Data Table ────────────────────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="px-3 w-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Checkbox
                          checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all rows on this page"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Select all rows on this page</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="px-3">
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1.5 text-xs hover:text-[#003B95]">
                    Player <SortIcon field="name" />
                  </button>
                </TableHead>
                <TableHead className="px-3">
                  <button onClick={() => handleSort("email")} className="flex items-center gap-1.5 text-xs hover:text-[#003B95]">
                    Email <SortIcon field="email" />
                  </button>
                </TableHead>
                <TableHead className="px-3 hidden lg:table-cell">Mobile</TableHead>
                <TableHead className="px-3 hidden lg:table-cell">Gender</TableHead>
                <TableHead className="px-3 hidden lg:table-cell">Nationality</TableHead>
                <TableHead className="px-3">
                  <button onClick={() => handleSort("status")} className="flex items-center gap-1.5 text-xs hover:text-[#003B95]">
                    Status <SortIcon field="status" />
                  </button>
                </TableHead>
                <TableHead className="px-3">Lock Status</TableHead>
                <TableHead className="px-3 hidden xl:table-cell">
                  <button onClick={() => handleSort("createdAt")} className="flex items-center gap-1.5 text-xs hover:text-[#003B95]">
                    Registration Date <SortIcon field="createdAt" />
                  </button>
                </TableHead>
                <TableHead className="px-3 w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : paged.length > 0 ? (
                paged.map((player) => {
                  const isSelected = selectedIds.has(player.id);
                  return (
                    <TableRow
                      key={player.id}
                      className={cn(
                        "transition-colors group",
                        isSelected && "bg-blue-50/40"
                      )}
                    >
                      <TableCell className="px-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(player.id)}
                          aria-label={`Select ${player.firstName} ${player.lastName}`}
                        />
                      </TableCell>
                      <TableCell className="px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-[11px] bg-[#003B95]/10 text-[#003B95]">
                              {player.firstName[0]}{player.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <button
                              onClick={() => navigate(`/players/${player.id}`)}
                              className="text-sm text-[#111827] truncate hover:text-[#003B95] hover:underline text-left"
                            >
                              {player.firstName} {player.lastName}
                            </button>
                            <p className="text-[10px] text-[#9CA3AF] font-mono">{player.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 text-sm text-[#374151] truncate max-w-[180px]">{player.email}</TableCell>
                      <TableCell className="px-3 text-xs text-[#6B7280] hidden lg:table-cell">{player.phone}</TableCell>
                      <TableCell className="px-3 text-xs text-[#6B7280] hidden lg:table-cell">{player.gender}</TableCell>
                      <TableCell className="px-3 text-xs text-[#6B7280] hidden lg:table-cell">{player.nationality}</TableCell>
                      <TableCell className="px-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div><StatusPill status={player.status} /></div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {player.status === "Locked" && player.lockedUntil
                              ? `Locked until ${player.lockedUntil}`
                              : player.status}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="px-3">
                        <Badge variant={player.status === "Locked" ? "destructive" : "outline"} className={cn(
                          "text-[11px] font-medium",
                          player.status === "Locked"
                            ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        )}>
                          {player.status === "Locked" ? "Locked" : "Unlocked"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 hidden xl:table-cell">
                        <p className="text-xs text-[#374151]">{format(player.createdAt, "MMM d, yyyy")}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{format(player.createdAt, "HH:mm")}</p>
                      </TableCell>
                      <TableCell className="px-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                              aria-label="Row actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/players/${player.id}`)}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              View Player
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/players/${player.id}`)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              Edit Player
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/players/${player.id}`)}>
                              <MapPin className="h-3.5 w-3.5 mr-2" />
                              Addresses
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/players/${player.id}`)}>
                              <Users className="h-3.5 w-3.5 mr-2" />
                              Dependents
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setAuditPlayer(player)}>
                              <Shield className="h-3.5 w-3.5 mr-2" />
                              View Audit Trail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success(`Email invite resent to ${player.email}`)}>
                              <Mail className="h-3.5 w-3.5 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      {chips.length > 0 || filters.search ? (
                        <>
                          <Search className="h-10 w-10 text-gray-200" />
                          <div>
                            {/* AC-PM-029 / AC-PM-036 */}
                            <p className="text-sm text-[#374151]">No players found.</p>
                            <p className="text-xs text-[#9CA3AF] mt-1">Try adjusting filters or clearing them.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={clearAllChips} className="mt-1">
                            Clear all filters
                          </Button>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-10 w-10 text-gray-200" />
                          <div>
                            <p className="text-sm text-[#374151]">No players yet</p>
                            <p className="text-xs text-[#9CA3AF] mt-1">Once players sign up, they will appear here.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ──────────────────────────────────── */}
        {sorted.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-gray-50/50 gap-3">
            <div className="flex items-center gap-3 text-xs text-[#6B7280]">
              <span>
                Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of {sorted.length.toLocaleString()}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#9CA3AF]">Rows:</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {getPageNumbers().map((pn, i) =>
                pn === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">…</span>
                ) : (
                  <Button
                    key={pn}
                    variant={pn === safePage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pn as number)}
                    className={cn(
                      "h-7 w-7 p-0 text-xs",
                      pn === safePage && "bg-[#003B95] hover:bg-[#002a6b]"
                    )}
                  >
                    {pn}
                  </Button>
                )
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

      {/* ── Modals & Drawers ──────────────────────────────── */}
      <BulkActionsModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        selectedCount={effectiveSelectedCount}
        preselectedAction={bulkPreselect}
        onConfirm={handleBulkConfirm}
      />

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        selectedCount={selectedIds.size}
        totalFiltered={sorted.length}
        defaultScope={exportScope as any}
      />

      {auditPlayer && (
        <PlayerAuditDrawer
          player={auditPlayer}
          open={!!auditPlayer}
          onClose={() => setAuditPlayer(null)}
        />
      )}

      {/* AC-PM-019: Simple Bulk Deactivate Confirmation */}
      <AlertDialog open={bulkDeactivateOpen} onOpenChange={setBulkDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {selectedIds.size} Selected Player{selectedIds.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedIds.size} selected player{selectedIds.size !== 1 ? "s" : ""}? They will lose access to Playzoon until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeactivateConfirm} className="bg-amber-600 hover:bg-amber-700">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AC-PM-020: Simple Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteSimpleOpen} onOpenChange={setBulkDeleteSimpleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Selected Player{selectedIds.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. Are you sure you want to delete {selectedIds.size} selected player{selectedIds.size !== 1 ? "s" : ""}? All their data — bookings, dependents, addresses, and wallet balance — will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteSimpleConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}