// ─── SCR-ADM-047: Wallet Management (Admin View) ────────────────────────────
// Comprehensive view of all user wallets. Search, filter, view detail panel,
// transaction history, and manual adjustments with re-authentication.

import {
  useState,
  useMemo,
  useRef,
  useEffect,
  type ElementType,
} from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Wallet,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  AlertTriangle,
  Loader2,
  Filter,
  Users,
  TrendingDown,
  CircleDollarSign,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  Lock,
  Eye,
  Download,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";
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
import type {
  WalletEntry,
  WalletTransaction,
  WalletStatus,
  UserType,
  AdjustmentType,
} from "./types";
import { isProviderType, userTypeShort } from "./types";
import { MOCK_WALLETS, getWalletTransactions } from "./mockData";

// ─── Constants ──────────────────────────────────────────────────────────────

const CURRENCY = "SAR";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  const prefix = amount < 0 ? "-" : "";
  return `${prefix}${CURRENCY} ${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

// ─── Config maps ────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<UserType, { bg: string; text: string; border: string }> = {
  Player:              { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  "Facility Provider": { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  "Training Provider": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Coach:               { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
};

const STATUS_BADGE: Record<WalletStatus, { bg: string; text: string; border: string }> = {
  Active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Frozen: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
};

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  accent,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  accent?: "error";
}) {
  return (
    <div className={cn(
      "bg-white border rounded-xl p-4 flex items-start gap-4",
      accent === "error" && "border-red-200 bg-red-50/30",
    )}>
      <div className={cn("flex items-center justify-center h-10 w-10 rounded-xl shrink-0", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={cn(
          "text-xl font-semibold mt-0.5 tabular-nums",
          accent === "error" ? "text-red-600" : "text-gray-900"
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

function UserAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-xs";
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cn("rounded-full flex items-center justify-center shrink-0 font-medium", sz, color)}>
      {initials(name)}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function AdminWalletPage() {
  const [wallets, setWallets] = useState<WalletEntry[]>(MOCK_WALLETS);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<UserType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<WalletStatus | "All">("All");
  const [minBalance, setMinBalance] = useState("");
  const [maxBalance, setMaxBalance] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination & sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof WalletEntry | "userName">("lastTransactionDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Detail panel
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  // Adjustment form
  const [adjType, setAdjType] = useState<AdjustmentType>("Credit");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjErrors, setAdjErrors] = useState<Record<string, string>>({});

  // Re-auth modal
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [reAuthError, setReAuthError] = useState("");
  const [reAuthAttempts, setReAuthAttempts] = useState(0);

  // Confirm modal
  const [confirmAdjustOpen, setConfirmAdjustOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Debounced search ─────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.toLowerCase());
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // ─── Filtering & Sorting ──────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...wallets];
    if (typeFilter !== "All") r = r.filter((w) => w.userType === typeFilter);
    if (statusFilter !== "All") r = r.filter((w) => w.status === statusFilter);
    if (debouncedSearch) {
      r = r.filter(
        (w) =>
          w.user.name.toLowerCase().includes(debouncedSearch) ||
          w.user.email.toLowerCase().includes(debouncedSearch) ||
          w.id.toLowerCase().includes(debouncedSearch)
      );
    }
    const minBal = parseFloat(minBalance);
    const maxBal = parseFloat(maxBalance);
    if (!isNaN(minBal)) r = r.filter((w) => w.availableBalance >= minBal);
    if (!isNaN(maxBal)) r = r.filter((w) => w.availableBalance <= maxBal);

    // Sort
    r.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortField === "userName") {
        aVal = a.user.name;
        bVal = b.user.name;
      } else {
        aVal = a[sortField] as string | number;
        bVal = b[sortField] as string | number;
      }
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(String(bVal)) : String(bVal).localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return r;
  }, [wallets, typeFilter, statusFilter, debouncedSearch, minBalance, maxBalance, sortField, sortDir]);

  // ─── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalWallets = wallets.length;
    const totalPlayerBalance = wallets
      .filter((w) => w.userType === "Player")
      .reduce((sum, w) => sum + w.availableBalance, 0);
    const totalProviderBalance = wallets
      .filter((w) => isProviderType(w.userType))
      .reduce((sum, w) => sum + w.availableBalance, 0);
    const negativeCount = wallets.filter((w) => w.availableBalance < 0).length;
    return { totalWallets, totalPlayerBalance, totalProviderBalance, negativeCount };
  }, [wallets]);

  // ─── Pagination ───────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const hasFilters = typeFilter !== "All" || statusFilter !== "All" || search || minBalance || maxBalance;

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setTypeFilter("All");
    setStatusFilter("All");
    setMinBalance("");
    setMaxBalance("");
    setPage(1);
  }

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  // ─── Detail panel ─────────────────────────────────────────
  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) ?? null;

  function openDetail(walletId: string) {
    setSelectedWalletId(walletId);
    setTransactions(getWalletTransactions(walletId));
    setAdjustmentOpen(false);
    resetAdjustmentForm();
  }

  function closeDetail() {
    setSelectedWalletId(null);
    setTransactions([]);
    setAdjustmentOpen(false);
    resetAdjustmentForm();
  }

  function resetAdjustmentForm() {
    setAdjType("Credit");
    setAdjAmount("");
    setAdjReason("");
    setAdjErrors({});
    setReAuthPassword("");
    setReAuthError("");
    setReAuthAttempts(0);
  }

  // ─── Adjustment Flow ──────────────────────────────────────

  function validateAdjustment(): boolean {
    const errs: Record<string, string> = {};
    const parsed = parseFloat(adjAmount);

    if (!adjAmount || isNaN(parsed)) errs.amount = "Amount is required.";
    else if (parsed < 0.01) errs.amount = "Minimum adjustment amount is 0.01 SAR.";
    else if (parsed > 999999.99) errs.amount = "Maximum adjustment amount is 999,999.99 SAR.";

    if (!adjReason.trim()) errs.reason = "Reason is required for manual adjustments.";
    else if (adjReason.trim().length < 10) errs.reason = "Reason must be at least 10 characters.";
    else if (adjReason.trim().length > 500) errs.reason = "Reason must not exceed 500 characters.";

    if (adjType === "Debit" && selectedWallet) {
      if (!isProviderType(selectedWallet.userType) && parsed > selectedWallet.availableBalance) {
        errs.amount = `Insufficient balance. Available: ${fmt(selectedWallet.availableBalance)}. Cannot debit ${fmt(parsed)}.`;
      }
    }

    setAdjErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleApplyAdjustment() {
    if (!validateAdjustment()) return;
    if (selectedWallet?.status === "Frozen") {
      toast.error("This wallet is frozen. Adjustments cannot be made to a frozen wallet.");
      return;
    }
    // Open re-authentication modal
    setReAuthOpen(true);
    setReAuthPassword("");
    setReAuthError("");
  }

  function handleReAuth() {
    if (!reAuthPassword) {
      setReAuthError("Password is required.");
      return;
    }
    // Simulate password check (accept "admin123" for demo)
    if (reAuthPassword !== "admin123") {
      const newAttempts = reAuthAttempts + 1;
      setReAuthAttempts(newAttempts);
      if (newAttempts >= 3) {
        setReAuthError("Too many failed attempts. Please try again in 5 minutes.");
      } else {
        setReAuthError("Invalid password. Please try again.");
      }
      setReAuthPassword("");
      return;
    }
    toast.success("Identity verified.");
    setReAuthOpen(false);
    // Open confirmation dialog
    setConfirmAdjustOpen(true);
  }

  function handleConfirmAdjustment() {
    if (!selectedWallet) return;
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      const amount = parseFloat(adjAmount);
      const delta = adjType === "Credit" ? amount : -amount;
      setWallets((prev) =>
        prev.map((w) =>
          w.id === selectedWallet.id
            ? { ...w, availableBalance: w.availableBalance + delta }
            : w
        )
      );
      // Add transaction
      const newTx: WalletTransaction = {
        id: `TX-ADJ-${Date.now()}`,
        walletId: selectedWallet.id,
        type: "Admin Manual Adjustment",
        description: adjReason.trim(),
        amount: delta,
        balanceAfter: selectedWallet.availableBalance + delta,
        date: new Date().toISOString(),
        isCredit: adjType === "Credit",
      };
      setTransactions((prev) => [newTx, ...prev]);

      const verb = adjType === "Credit" ? "credited to" : "debited from";
      toast.success(`Wallet adjusted. ${fmt(amount)} ${verb} ${selectedWallet.user.name}'s wallet.`);
      setIsSaving(false);
      setConfirmAdjustOpen(false);
      resetAdjustmentForm();
      setAdjustmentOpen(false);
    }, 800);
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Wallet Management</h1>
          <p className="text-sm text-[#6B7280] mt-1">View and manage all user and provider wallets.</p>
        </div>
        <Button variant="ghost" className="gap-2 text-gray-600">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Wallets"
          value={stats.totalWallets}
          icon={Users}
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
        />
        <StatCard
          label="Total Player Balance"
          value={fmt(stats.totalPlayerBalance)}
          icon={Wallet}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Total Provider Balance"
          value={fmt(stats.totalProviderBalance)}
          icon={CircleDollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Negative Balances"
          value={stats.negativeCount}
          icon={TrendingDown}
          iconBg={stats.negativeCount > 0 ? "bg-red-100" : "bg-gray-100"}
          iconColor={stats.negativeCount > 0 ? "text-red-600" : "text-gray-400"}
          accent={stats.negativeCount > 0 ? "error" : undefined}
        />
      </div>

      {/* Filter/Search bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user name, email, or ID..."
                className="pl-9 h-9 text-sm"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setDebouncedSearch(""); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="w-[180px]">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as UserType | "All"); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Player">Player</SelectItem>
                <SelectItem value="Facility Provider">Facility Provider</SelectItem>
                <SelectItem value="Training Provider">Training Provider</SelectItem>
                <SelectItem value="Coach">Coach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={minBalance}
              onChange={(e) => { setMinBalance(e.target.value); setPage(1); }}
              placeholder="Min Balance"
              className="h-9 w-[120px] text-xs"
              aria-label="Minimum balance filter"
            />
            <span className="text-xs text-gray-400">-</span>
            <Input
              type="number"
              value={maxBalance}
              onChange={(e) => { setMaxBalance(e.target.value); setPage(1); }}
              placeholder="Max Balance"
              className="h-9 w-[120px] text-xs"
              aria-label="Maximum balance filter"
            />
          </div>

          <div className="w-[140px]">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as WalletStatus | "All"); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Wallet Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-gray-500 gap-1">
              <X className="h-3 w-3" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Wallets DataTable */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No Wallets Found</p>
            <p className="text-xs text-gray-500 mt-1">No wallets match your search criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("userName")}>
                      <div className="flex items-center gap-1">User / Provider <ArrowUpDown className="h-3 w-3 text-gray-400" /></div>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("availableBalance")}>
                      <div className="flex items-center justify-end gap-1">Available Balance <ArrowUpDown className="h-3 w-3 text-gray-400" /></div>
                    </TableHead>
                    <TableHead className="text-right">Locked / Reserved</TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("lifetimeAmount")}>
                      <div className="flex items-center justify-end gap-1">Lifetime <ArrowUpDown className="h-3 w-3 text-gray-400" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("lastTransactionDate")}>
                      <div className="flex items-center justify-end gap-1">Last Txn <ArrowUpDown className="h-3 w-3 text-gray-400" /></div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((w) => (
                    <TableRow
                      key={w.id}
                      className={cn(
                        "cursor-pointer hover:bg-gray-50/50 transition-colors",
                        selectedWalletId === w.id && "bg-blue-50/30",
                        w.availableBalance < 0 && "border-l-2 border-l-red-400",
                      )}
                      onClick={() => openDetail(w.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={w.user.name} size="sm" />
                          <span className="text-sm font-medium text-[#003B95] hover:underline">{w.user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{w.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", TYPE_BADGE[w.userType].bg, TYPE_BADGE[w.userType].text, TYPE_BADGE[w.userType].border)}>
                          {userTypeShort(w.userType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", STATUS_BADGE[w.status].bg, STATUS_BADGE[w.status].text, STATUS_BADGE[w.status].border)}>
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right tabular-nums text-sm font-medium", w.availableBalance < 0 ? "text-red-600" : "text-gray-900")}>
                        {fmt(w.availableBalance)}
                      </TableCell>
                      <TableCell className={cn("text-right tabular-nums text-sm", w.lockedBalance > 0 ? "text-amber-600" : "text-gray-400")}>
                        {fmt(w.lockedBalance)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-gray-700">
                        {fmt(w.lifetimeAmount)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {format(parseISO(w.lastTransactionDate), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Rows per page:</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-500">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="icon"
                      className={cn("h-8 w-8 text-xs", pageNum === page && "bg-[#003B95] hover:bg-[#002a6b]")}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Wallet Detail Panel (Sheet) ──────────────────────── */}
      <Sheet open={!!selectedWallet} onOpenChange={(v) => { if (!v) closeDetail(); }}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto p-0">
          {selectedWallet && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selectedWallet.user.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-base">{selectedWallet.user.name}</SheetTitle>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedWallet.user.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className={cn("text-[10px]", TYPE_BADGE[selectedWallet.userType].bg, TYPE_BADGE[selectedWallet.userType].text, TYPE_BADGE[selectedWallet.userType].border)}>
                        {selectedWallet.userType}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px]", STATUS_BADGE[selectedWallet.status].bg, STATUS_BADGE[selectedWallet.status].text, STATUS_BADGE[selectedWallet.status].border)}>
                        {selectedWallet.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Balance breakdown */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Balance Breakdown</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Available</p>
                    <p className={cn("text-base font-semibold mt-0.5 tabular-nums", selectedWallet.availableBalance < 0 ? "text-red-600" : selectedWallet.availableBalance > 0 ? "text-emerald-600" : "text-gray-600")}>
                      {fmt(selectedWallet.availableBalance)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase">{isProviderType(selectedWallet.userType) ? "Blocked" : "Reserved"}</p>
                    <p className={cn("text-base font-semibold mt-0.5 tabular-nums", selectedWallet.lockedBalance > 0 ? "text-amber-600" : "text-gray-400")}>
                      {fmt(selectedWallet.lockedBalance)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase">{isProviderType(selectedWallet.userType) ? "Lifetime Earnings" : "Lifetime Spends"}</p>
                    <p className="text-base font-semibold mt-0.5 tabular-nums text-gray-700">
                      {fmt(selectedWallet.lifetimeAmount)}
                    </p>
                  </div>
                </div>
                {selectedWallet.availableBalance < 0 && (
                  <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Negative balance from cancellation penalties. Will be recovered from future earnings.
                  </div>
                )}
              </div>

              {/* Transaction history */}
              <div className="px-6 py-4 flex-1 overflow-y-auto border-b border-gray-200">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Transaction History</h3>
                {transactions.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-400">No transactions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div key={tx.id} className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        tx.type === "Admin Manual Adjustment" ? "bg-purple-50/30 border-purple-200" : "bg-white border-gray-100"
                      )}>
                        <div className={cn(
                          "flex items-center justify-center h-7 w-7 rounded-full shrink-0 mt-0.5",
                          tx.isCredit ? "bg-emerald-100" : "bg-red-100"
                        )}>
                          {tx.isCredit
                            ? <Plus className="h-3.5 w-3.5 text-emerald-600" />
                            : <Minus className="h-3.5 w-3.5 text-red-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "text-xs font-medium",
                              tx.type === "Admin Manual Adjustment" ? "text-purple-700 font-bold" : "text-gray-700"
                            )}>
                              {tx.type}
                            </span>
                            <span className={cn(
                              "text-sm font-semibold tabular-nums shrink-0",
                              tx.isCredit ? "text-emerald-600" : "text-red-600"
                            )}>
                              {tx.isCredit ? "+" : ""}{fmt(tx.amount)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{tx.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400">{format(parseISO(tx.date), "MMM d, yyyy HH:mm")}</span>
                            <span className="text-[10px] text-gray-400 tabular-nums">Bal: {fmt(tx.balanceAfter)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Adjustment Section */}
              <div className="px-6 py-4">
                <button
                  onClick={() => setAdjustmentOpen(!adjustmentOpen)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Manual Adjustment</h3>
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", adjustmentOpen && "rotate-180")} />
                </button>

                {!adjustmentOpen && (
                  <p className="text-[11px] text-amber-600 mt-1">This is an exceptional operation. Re-authentication required.</p>
                )}

                {adjustmentOpen && (
                  <div className="space-y-4 mt-3">
                    {/* Adjustment type radio group */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-700">Adjustment Type <span className="text-red-500">*</span></Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setAdjType("Credit"); setAdjErrors({}); }}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-lg border-2 py-2 text-xs transition-all",
                            adjType === "Credit"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 text-gray-500 hover:border-gray-300",
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" /> Credit (Add)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAdjType("Debit"); setAdjErrors({}); }}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-lg border-2 py-2 text-xs transition-all",
                            adjType === "Debit"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : "border-gray-200 text-gray-500 hover:border-gray-300",
                          )}
                        >
                          <Minus className="h-3.5 w-3.5" /> Debit (Subtract)
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-700">Amount (SAR) <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">SAR</span>
                        <Input
                          type="number"
                          min={0.01}
                          step={0.01}
                          max={999999.99}
                          value={adjAmount}
                          onChange={(e) => { setAdjAmount(e.target.value); setAdjErrors((p) => ({ ...p, amount: "" })); }}
                          placeholder="Enter amount"
                          className={cn("pl-12 h-9 text-sm tabular-nums", adjErrors.amount && "border-red-400")}
                        />
                      </div>
                      {adjErrors.amount && <p className="text-xs text-red-500">{adjErrors.amount}</p>}
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-700">Reason <span className="text-red-500">*</span></Label>
                        <span className="text-[10px] text-gray-400 tabular-nums">{adjReason.trim().length}/500</span>
                      </div>
                      <Textarea
                        value={adjReason}
                        onChange={(e) => { setAdjReason(e.target.value); setAdjErrors((p) => ({ ...p, reason: "" })); }}
                        placeholder="Enter reason for this adjustment"
                        className={cn("resize-none h-20 text-sm", adjErrors.reason && "border-red-400")}
                        maxLength={500}
                      />
                      {adjErrors.reason && <p className="text-xs text-red-500">{adjErrors.reason}</p>}
                    </div>

                    {/* Apply button */}
                    <Button
                      onClick={handleApplyAdjustment}
                      className="w-full bg-red-600 hover:bg-red-700 text-white gap-1.5"
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      Apply Adjustment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Re-authentication Modal ─────────────────────────── */}
      <Dialog open={reAuthOpen} onOpenChange={(v) => { if (!v) setReAuthOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-amber-600" />
              Re-authentication Required
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter your admin password to confirm this wallet adjustment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reauth-pw" className="text-xs">Admin Password</Label>
              <Input
                id="reauth-pw"
                type="password"
                value={reAuthPassword}
                onChange={(e) => { setReAuthPassword(e.target.value); setReAuthError(""); }}
                placeholder="Enter your password"
                className={reAuthError ? "border-red-400" : ""}
                disabled={reAuthAttempts >= 3}
              />
              {reAuthError && <p className="text-xs text-red-500">{reAuthError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReAuthOpen(false)}>Cancel</Button>
            <Button onClick={handleReAuth} disabled={reAuthAttempts >= 3} className="bg-[#003B95] hover:bg-[#002a6b]">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Adjustment Modal ────────────────────────── */}
      <AlertDialog open={confirmAdjustOpen} onOpenChange={(v) => { if (!v && !isSaving) setConfirmAdjustOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Wallet Adjustment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  You are about to <strong>{adjType === "Credit" ? "credit" : "debit"}</strong>{" "}
                  <strong>{fmt(parseFloat(adjAmount) || 0)}</strong>{" "}
                  {adjType === "Credit" ? "to" : "from"}{" "}
                  <strong>{selectedWallet?.user.name}</strong>&apos;s wallet.
                </p>
                <p><strong>Reason:</strong> {adjReason.trim()}</p>
                <p className="text-xs text-amber-600">This action is logged and cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAdjustment}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 gap-1.5"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
