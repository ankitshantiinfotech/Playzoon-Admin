// ─── SCR-ADM-031: Commission Configuration List ─────────────────────────────
// Multi-dimensional commission and tax configuration matrix.
// Provider Type × Service Type × Provider × Country → Commission/Tax/Payout rules.
// Changes apply to future bookings only (Rule 69 / GAP-018).

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  History,
  Info,
  Download,
  Building2,
  GraduationCap,
  Users,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";
import { cn } from "../../ui/utils";
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
  CommissionRule,
  ChangeHistoryRecord,
  ProviderType,
  ServiceType,
  CommissionStatus,
} from "./types";
import { PROVIDER_TYPES, SERVICE_TYPES } from "./types";
import { MOCK_COMMISSION_RULES, MOCK_CHANGE_HISTORY } from "./mockData";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50];
type SortField =
  | "providerType"
  | "serviceType"
  | "providerName"
  | "country"
  | "commissionRate"
  | "taxRate"
  | "payoutDuration"
  | "status";
type SortDir = "asc" | "desc";

// ─── Provider Type Config ────────────────────────────────────────────────────

const PROVIDER_TYPE_CONFIG: Record<
  ProviderType,
  { icon: typeof Building2; bg: string; text: string; border: string }
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProviderTypeBadge({ type }: { type: ProviderType }) {
  const cfg = PROVIDER_TYPE_CONFIG[type];
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

function StatusBadge({ status }: { status: CommissionStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] gap-1.5 border shrink-0",
        status === "Active"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-gray-100 text-gray-500 border-gray-200",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          status === "Active" ? "bg-emerald-500" : "bg-gray-400",
        )}
      />
      {status}
    </Badge>
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

// ─── Change History Modal ────────────────────────────────────────────────────

function ChangeHistoryModal({
  open,
  onClose,
  records,
}: {
  open: boolean;
  onClose: () => void;
  records: ChangeHistoryRecord[];
}) {
  const sorted = useMemo(
    () => [...records].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [records],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#003B95]/10">
              <History className="h-4 w-4 text-[#003B95]" />
            </div>
            Commission Change History
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Version history of all commission rate changes.
          </DialogDescription>
        </DialogHeader>

        {sorted.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No change history available.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[100px]">
                    Rule ID
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[120px]">
                    Previous Rate
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[100px]">
                    New Rate
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[150px]">
                    Effective From
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[140px]">
                    Modified By
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[150px]">
                    Timestamp
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((rec) => (
                  <TableRow key={rec.id} className="text-sm">
                    <TableCell className="font-mono text-xs text-gray-600">
                      {rec.ruleId}
                    </TableCell>
                    <TableCell className="tabular-nums text-gray-600">
                      {rec.previousRate !== null
                        ? `${rec.previousRate.toFixed(2)}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-gray-900 font-medium">
                      {rec.newRate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-gray-600 text-xs">
                      {format(
                        parseISO(rec.effectiveFrom),
                        "dd MMM yyyy, HH:mm",
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700 text-xs">
                      {rec.modifiedBy}
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      {format(parseISO(rec.timestamp), "dd MMM yyyy, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirm Modal (Activate / Deactivate) ──────────────────────────────────

function ConfirmStatusModal({
  open,
  onClose,
  onConfirm,
  rule,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rule: CommissionRule | null;
  isSaving: boolean;
}) {
  if (!rule) return null;
  const isDeactivating = rule.status === "Active";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isSaving) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-lg",
                isDeactivating ? "bg-red-100" : "bg-amber-100",
              )}
            >
              {isDeactivating ? (
                <PowerOff className="h-4 w-4 text-red-600" />
              ) : (
                <Power className="h-4 w-4 text-amber-600" />
              )}
            </div>
            {isDeactivating
              ? "Deactivate Commission Rule?"
              : "Activate Commission Rule?"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {isDeactivating
              ? "This rule will no longer apply to new bookings. Existing bookings retain their locked rates. Confirm?"
              : "This rule will apply to all future bookings matching its criteria. Confirm?"}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 border rounded-lg p-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Provider Type</span>
            <span className="text-gray-900">{rule.providerType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Service Type</span>
            <span className="text-gray-900">{rule.serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Provider</span>
            <span
              className={cn(
                "text-gray-900",
                !rule.providerId && "italic text-gray-500",
              )}
            >
              {rule.providerName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Country</span>
            <span
              className={cn(
                "text-gray-900",
                !rule.countryCode && "italic text-gray-500",
              )}
            >
              {rule.country}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Commission</span>
            <span className="text-gray-900 tabular-nums">
              {rule.commissionRate.toFixed(2)}%
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant={isDeactivating ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isSaving}
            className={cn(
              !isDeactivating && "bg-[#003B95] hover:bg-[#002d73] text-white",
            )}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isDeactivating ? "Deactivate" : "Activate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function CommissionsPage() {
  const navigate = useNavigate();

  // Data
  const [rules, setRules] = useState<CommissionRule[]>(MOCK_COMMISSION_RULES);

  // Filters
  const [search, setSearch] = useState("");
  const [filterProviderType, setFilterProviderType] = useState("all");
  const [filterServiceType, setFilterServiceType] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Sort
  const [sortField, setSortField] = useState<SortField>("providerType");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // UI state
  const [infoBannerVisible, setInfoBannerVisible] = useState(true);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [confirmRule, setConfirmRule] = useState<CommissionRule | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Derive unique providers and countries for filter dropdowns
  const uniqueProviders = useMemo(() => {
    const names = new Set<string>();
    rules.forEach((r) => {
      if (r.providerId) names.add(r.providerName);
    });
    return Array.from(names).sort();
  }, [rules]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    rules.forEach((r) => {
      if (r.countryCode) countries.add(r.country);
    });
    return Array.from(countries).sort();
  }, [rules]);

  // Check if any filter active
  const hasActiveFilters =
    search !== "" ||
    filterProviderType !== "all" ||
    filterServiceType !== "all" ||
    filterProvider !== "all" ||
    filterCountry !== "all" ||
    filterStatus !== "all";

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterProviderType("all");
    setFilterServiceType("all");
    setFilterProvider("all");
    setFilterCountry("all");
    setFilterStatus("all");
    setPage(1);
  }, []);

  // Filtered & sorted data
  const filteredRules = useMemo(() => {
    let data = [...rules];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.providerName.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q),
      );
    }

    // Dropdown filters
    if (filterProviderType !== "all") {
      data = data.filter((r) => r.providerType === filterProviderType);
    }
    if (filterServiceType !== "all") {
      data = data.filter((r) => r.serviceType === filterServiceType);
    }
    if (filterProvider !== "all") {
      data = data.filter((r) => r.providerName === filterProvider);
    }
    if (filterCountry !== "all") {
      data = data.filter((r) => r.country === filterCountry);
    }
    if (filterStatus !== "all") {
      data = data.filter((r) => r.status === filterStatus);
    }

    // Sort
    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "providerType":
          cmp = a.providerType.localeCompare(b.providerType);
          break;
        case "serviceType":
          cmp = a.serviceType.localeCompare(b.serviceType);
          break;
        case "providerName":
          cmp = a.providerName.localeCompare(b.providerName);
          break;
        case "country":
          cmp = a.country.localeCompare(b.country);
          break;
        case "commissionRate":
          cmp = a.commissionRate - b.commissionRate;
          break;
        case "taxRate":
          cmp = a.taxRate - b.taxRate;
          break;
        case "payoutDuration":
          cmp = a.payoutDuration - b.payoutDuration;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [
    rules,
    search,
    filterProviderType,
    filterServiceType,
    filterProvider,
    filterCountry,
    filterStatus,
    sortField,
    sortDir,
  ]);

  // Pagination
  const totalItems = filteredRules.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRules = filteredRules.slice(
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

  // Toggle status
  const handleToggleStatus = useCallback((rule: CommissionRule) => {
    setConfirmRule(rule);
    setConfirmModalOpen(true);
  }, []);

  const handleConfirmToggle = useCallback(() => {
    if (!confirmRule) return;
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      const newStatus: CommissionStatus =
        confirmRule.status === "Active" ? "Inactive" : "Active";
      setRules((prev) =>
        prev.map((r) =>
          r.id === confirmRule.id ? { ...r, status: newStatus } : r,
        ),
      );
      toast.success(
        newStatus === "Active"
          ? "Commission rule activated. It will apply to future bookings."
          : "Commission rule deactivated. Existing bookings retain their locked rates.",
      );
      setIsSaving(false);
      setConfirmModalOpen(false);
      setConfirmRule(null);
    }, 600);
  }, [confirmRule]);

  const handleExport = useCallback((type: "csv" | "xls") => {
    setExportOpen(false);
    toast.success("Export started. Your file will download shortly.");
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

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
          <span className="text-gray-400">Configuration</span>
          <span className="mx-1.5">/</span>
          <span className="text-gray-900">Commission</span>
        </nav>
        <h1 className="text-2xl font-bold text-[#111827]">
          Commission Configuration
        </h1>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between gap-4">
        <Button
          className="bg-[#003B95] hover:bg-[#002d73] text-white gap-2"
          aria-label="Add new commission rule"
          onClick={() => navigate("/commissions/new")}
        >
          <Plus className="h-4 w-4" />
          Add Commission Rule
        </Button>

        <div className="relative">
          <Button
            variant="outline"
            className="gap-2"
            aria-label="Export commission configuration data"
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

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-xs" role="search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by provider name or country..."
            className="pl-9 text-sm h-10"
            aria-label="Search commission rules"
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

        <Select
          value={filterProviderType}
          onValueChange={(v) => {
            setFilterProviderType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] h-10 text-sm">
            <SelectValue placeholder="All Provider Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provider Types</SelectItem>
            {PROVIDER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterServiceType}
          onValueChange={(v) => {
            setFilterServiceType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] h-10 text-sm">
            <SelectValue placeholder="All Service Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Service Types</SelectItem>
            {SERVICE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterProvider}
          onValueChange={(v) => {
            setFilterProvider(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] h-10 text-sm">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {uniqueProviders.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterCountry}
          onValueChange={(v) => {
            setFilterCountry(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] h-10 text-sm">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {uniqueCountries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterStatus}
          onValueChange={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] h-10 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

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

      {/* Info banner */}
      {infoBannerVisible && (
        <div
          className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800"
          role="status"
          aria-live="polite"
        >
          <Info className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
          <div className="flex-1">
            Commission and tax rates are locked at booking creation time.
            Changes here apply to future bookings only (Rule 69).
          </div>
          <button
            onClick={() => setInfoBannerVisible(false)}
            className="text-blue-400 hover:text-blue-600 shrink-0"
            aria-label="Dismiss information banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {totalItems === 0 ? (
          <div className="py-20 text-center">
            {hasActiveFilters ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  No commission rules match your current filters.
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <p className="text-base font-medium text-gray-900">
                  No Commission Rules Configured
                </p>
                <p className="text-sm text-gray-500">
                  Add commission rules to define rates for providers.
                </p>
                <Button
                  className="bg-[#003B95] hover:bg-[#002d73] text-white gap-2 mt-2"
                  onClick={() => navigate("/commissions/new")}
                >
                  <Plus className="h-4 w-4" />
                  Add Commission Rule
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {(
                  [
                    {
                      key: "providerType" as SortField,
                      label: "Provider Type",
                      w: "w-[140px]",
                    },
                    {
                      key: "serviceType" as SortField,
                      label: "Service Type",
                      w: "w-[130px]",
                    },
                    {
                      key: "providerName" as SortField,
                      label: "Provider Name",
                      w: "w-[180px]",
                    },
                    {
                      key: "country" as SortField,
                      label: "Country",
                      w: "w-[130px]",
                    },
                    {
                      key: "commissionRate" as SortField,
                      label: "Commission %",
                      w: "w-[110px]",
                    },
                    {
                      key: "taxRate" as SortField,
                      label: "Tax %",
                      w: "w-[100px]",
                    },
                    {
                      key: "payoutDuration" as SortField,
                      label: "Payout Duration",
                      w: "w-[130px]",
                    },
                    {
                      key: "status" as SortField,
                      label: "Status",
                      w: "w-[100px]",
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
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[140px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRules.map((rule, idx) => (
                <TableRow
                  key={rule.id}
                  className={cn(
                    "cursor-pointer hover:bg-gray-50 transition-colors",
                    idx % 2 === 1 && "bg-gray-50/50",
                  )}
                >
                  <TableCell>
                    <ProviderTypeBadge type={rule.providerType} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {rule.serviceType}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "text-sm truncate block max-w-[160px]",
                            !rule.providerId
                              ? "italic text-gray-500"
                              : "text-gray-900",
                          )}
                        >
                          {rule.providerName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{rule.providerName}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-sm",
                        !rule.countryCode
                          ? "italic text-gray-500"
                          : "text-gray-900",
                      )}
                    >
                      {rule.country}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-gray-900">
                    {rule.commissionRate.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-gray-900">
                    {rule.taxRate.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {rule.payoutDuration} {rule.durationType}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={rule.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm text-[#003B95] hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commissions/${rule.id}/edit`);
                        }}
                        aria-label={`Edit commission rule for ${rule.providerType} - ${rule.serviceType}`}
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        className={cn(
                          "text-sm cursor-pointer hover:underline",
                          rule.status === "Active"
                            ? "text-red-600"
                            : "text-emerald-600",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(rule);
                        }}
                        aria-label={`${rule.status === "Active" ? "Deactivate" : "Activate"} commission rule for ${rule.providerType} - ${rule.serviceType}`}
                      >
                        {rule.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
              {Math.min(safePage * pageSize, totalItems)} of {totalItems} rules
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

      {/* Change History Link */}
      <div>
        <button
          className="text-sm text-[#003B95] hover:underline flex items-center gap-1.5"
          onClick={() => setHistoryModalOpen(true)}
        >
          <History className="h-4 w-4" />
          View Commission Change History
        </button>
      </div>

      {/* Modals */}
      <ChangeHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        records={MOCK_CHANGE_HISTORY}
      />

      <ConfirmStatusModal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setConfirmRule(null);
        }}
        onConfirm={handleConfirmToggle}
        rule={confirmRule}
        isSaving={isSaving}
      />
    </div>
  );
}
