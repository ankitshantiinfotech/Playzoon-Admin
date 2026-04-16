import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Building2,
  GraduationCap,
  ShieldX,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
  Check,
  Ban,
  Plus,
  Filter,
  Download,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Skeleton } from "../../ui/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import {
  PROVIDER_TABS,
  PAGE_SIZE_OPTIONS,
  getTabCounts,
  getPendingCount,
  type ServiceProvider,
  type ProviderType,
  type OnboardingProviderType,
  type SortField,
  type SortDir,
  type FacilitySortField,
  type ProviderTabKey,
} from "./provider-data";
import { adminService } from "@/services/admin.service";
import {
  ApproveConfirmModal,
  RejectReasonModal,
} from "./components/ApproveRejectModals";
import { FacilityProviderTable } from "./components/FacilityProviderTable";
import { useChatContext } from "../communication/ChatContext";
import {
  BulkActionBar,
  type BulkActionType,
  type BulkActionResult,
} from "./components/BulkActionBar";
import { Checkbox } from "../../ui/checkbox";
import { SimpleExportModal } from "../common/SimpleExportModal";
import { exportTable, type ExportFormat } from "@/lib/exportDownload";

// ─── Banner ──────────────────────────────────────────────────
type BannerType = "success" | "error" | "info" | "warning";
interface BannerState {
  type: BannerType;
  message: string;
  visible: boolean;
}
const BANNER_STYLES: Record<
  BannerType,
  { bg: string; border: string; text: string; icon: React.ElementType }
> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: XCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: Info,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: AlertTriangle,
  },
};

// ─── Tab icon helper ─────────────────────────────────────────
const TAB_ICONS: Record<string, React.ElementType> = {
  "Facility Provider": Building2,
  "Training Provider": GraduationCap,
  Onboarding: AlertTriangle,
};

// ─── Status filter types & config (US-5.5.1) ────────────────
type StatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "verified"
  | "unverified"
  | "locked";

interface StatusFilterOption {
  key: StatusFilter;
  label: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  dot: string;
}

const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  {
    key: "all",
    label: "All",
    activeBg: "bg-[#003B95]",
    activeText: "text-white",
    activeBorder: "border-[#003B95]",
    dot: "",
  },
  {
    key: "active",
    label: "Active",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    activeBorder: "border-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    key: "inactive",
    label: "Inactive",
    activeBg: "bg-gray-100",
    activeText: "text-gray-700",
    activeBorder: "border-gray-300",
    dot: "bg-gray-400",
  },
  {
    key: "verified",
    label: "Verified",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    activeBorder: "border-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    key: "unverified",
    label: "Unverified",
    activeBg: "bg-amber-50",
    activeText: "text-amber-700",
    activeBorder: "border-amber-300",
    dot: "bg-amber-500",
  },
  {
    key: "locked",
    label: "Locked",
    activeBg: "bg-red-50",
    activeText: "text-red-700",
    activeBorder: "border-red-300",
    dot: "bg-red-500",
  },
];

/** Apply status filter predicate to a provider-like object */
function matchesStatusFilter<
  T extends {
    platformStatus: string;
    verificationStatus: string;
    accountStatus: string;
  },
>(item: T, filter: StatusFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "active":
      return item.platformStatus === "Active";
    case "inactive":
      return item.platformStatus === "Inactive";
    case "verified":
      return item.verificationStatus === "Approved";
    case "unverified":
      return item.verificationStatus === "Pending";
    case "locked":
      return item.accountStatus === "Locked";
  }
}

// ─── Verification badge colors ───────────────────────────────
function VerificationBadge({
  status,
}: {
  status: ServiceProvider["verificationStatus"];
}) {
  const styles = {
    Pending: "bg-amber-100 text-amber-800 border-amber-200",
    Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <Badge variant="outline" className={cn("text-[11px]", styles[status])}>
      {status}
    </Badge>
  );
}

// ─── Account status badge ────────────────────────────────────
function AccountStatusBadge({
  status,
}: {
  status: ServiceProvider["accountStatus"];
}) {
  if (status === "Locked") {
    return (
      <Badge
        variant="outline"
        className="bg-red-100 text-red-800 border-red-200 text-[11px] gap-1"
      >
        <Lock className="h-2.5 w-2.5" /> Locked
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1"
    >
      <Unlock className="h-2.5 w-2.5" /> Unlocked
    </Badge>
  );
}

// ─── Platform status badge ───────────────────────────────────
function PlatformStatusBadge({
  status,
}: {
  status: ServiceProvider["platformStatus"];
}) {
  if (status === "Active") {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]"
      >
        Active
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-gray-100 text-gray-600 border-gray-200 text-[11px]"
    >
      Inactive
    </Badge>
  );
}

// ─── Provider type badge (onboarding) ────────────────────────
function ProviderTypeBadge({ type }: { type: OnboardingProviderType }) {
  const styles: Record<OnboardingProviderType, string> = {
    "Facility Provider": "bg-blue-50 text-blue-700 border-blue-200",
    "Training Provider": "bg-purple-50 text-purple-700 border-purple-200",
    "Freelance Coach": "bg-teal-50 text-teal-700 border-teal-200",
  };
  return (
    <Badge variant="outline" className={cn("text-[11px]", styles[type])}>
      {type}
    </Badge>
  );
}

// ─── Truncated text with tooltip ─────────────────────────────
function TruncatedCell({
  text,
  maxLength,
  className,
}: {
  text: string;
  maxLength: number;
  className?: string;
}) {
  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? text.slice(0, maxLength) + "..." : text;

  if (!isTruncated) {
    return <span className={className}>{text}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("cursor-default", className)}>{displayText}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function ServiceProvidersPage() {
  const navigate = useNavigate();

  // ── Mock admin role check ─────────────────────────────
  const isAdmin = true; // Mock: set to false to see Access Denied

  // ── Data state ────────────────────────────────────────
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [banner, setBanner] = useState<BannerState>({
    type: "info",
    message: "",
    visible: false,
  });

  const showBanner = useCallback((type: BannerType, message: string) => {
    setBanner({ type, message, visible: true });
    if (type !== "error")
      setTimeout(() => setBanner((b) => ({ ...b, visible: false })), 5000);
  }, []);

  // ── Map backend provider to frontend type ────────────
  const mapProvider = useCallback(
    (p: Record<string, unknown>): ServiceProvider => {
      const providerType = (() => {
        const pt = String(p.provider_type || "");
        if (pt === "facility_provider") return "Facility Provider" as const;
        return "Training Provider" as const; // training_provider + freelance_coach both show under Training
      })();
      const verificationStatus = (() => {
        const ps = String(p.profile_status || "pending");
        if (ps === "approved") return "Approved" as const;
        if (ps === "rejected") return "Rejected" as const;
        return "Pending" as const;
      })();
      return {
        id: String(p.id),
        name: String(
          p.business_name ||
            `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
            "Unknown",
        ),
        email: String(p.email || ""),
        mobile: p.country_code
          ? `${p.country_code}${p.mobile || ""}`
          : String(p.mobile || ""),
        providerType,
        verificationStatus,
        accountStatus: p.is_locked ? "Locked" : "Unlocked",
        platformStatus: String(p.status) === "active" ? "Active" : "Inactive",
        createdAt: new Date(String(p.created_at || Date.now())),
        incorporationDate: p.date_of_incorporation
          ? new Date(String(p.date_of_incorporation))
          : undefined,
        onboardingType:
          verificationStatus === "Pending"
            ? String(p.provider_type || "").includes("coach")
              ? "Freelance Coach"
              : providerType
            : undefined,
      };
    },
    [],
  );

  // ── Fetch providers from API (paginate: backend max limit is 100) ─────────────────────────
  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const pageSize = 100;
      let page = 1;
      const all: Record<string, unknown>[] = [];
      let totalItems = 0;
      for (;;) {
        const envelope = await adminService.listProviders({ page, limit: pageSize });
        const payload =
          (
            envelope as {
              data?: { providers?: unknown[]; pagination?: { total_items?: number } };
            }
          )?.data ??
          (envelope as {
            providers?: unknown[];
            pagination?: { total_items?: number };
          });
        const list = payload?.providers ?? [];
        if (typeof payload?.pagination?.total_items === "number") {
          totalItems = payload.pagination.total_items;
        }
        if (Array.isArray(list) && list.length > 0) {
          all.push(...(list as Record<string, unknown>[]));
        }
        if (!Array.isArray(list) || list.length < pageSize) break;
        if (totalItems > 0 && all.length >= totalItems) break;
        page += 1;
        if (page > 500) break;
      }
      const filtered = all.filter((p: Record<string, unknown>) => {
        const approval = String(
          p.admin_approval_status || p.profile_status || "",
        ).toLowerCase();
        const profileCompleted = p.profile_completed === true;
        if (approval === "approved") return true;
        if (approval === "pending") return profileCompleted;
        return false;
      });
      setProviders(filtered.map(mapProvider));
    } catch (err) {
      console.error("Failed to load providers:", err);
      showBanner("error", "Failed to load providers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [mapProvider, showBanner]);

  // ── Tab state ─────────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProviderTabKey>(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "facility") return "Facility Provider";
    if (tabParam === "training") return "Training Provider";
    if (tabParam === "onboarding") return "Onboarding";
    return "Facility Provider";
  });
  const [subTab, setSubTab] = useState<"all" | "onboarding">("all");

  // ── Status filter state (US-5.5.1) ────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Clear tab search param after initial read
  useEffect(() => {
    if (searchParams.has("tab")) {
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search state (with debounce) ──────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.length >= 2 ? searchInput : "");
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const clearSearch = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
  };

  // ── Sort state ────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Facility-specific sort state ──────────────────────
  const [facilitySortField, setFacilitySortField] =
    useState<FacilitySortField>("name");
  const [facilitySortDir, setFacilitySortDir] = useState<SortDir>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleFacilitySort = (field: FacilitySortField) => {
    if (facilitySortField === field) {
      setFacilitySortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setFacilitySortField(field);
      setFacilitySortDir("asc");
    }
  };

  // ── Pagination state ──────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Loading state ──────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // ── Global chat toggle (mock) ─────────────────────────
  const {
    chatEnabled: globalChatEnabled,
    openChat,
    unreadCounts,
  } = useChatContext();

  // ── Delete modal state ────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<ServiceProvider | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Approve / Reject modal state ──────────────────────
  const [approveTarget, setApproveTarget] = useState<ServiceProvider | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<ServiceProvider | null>(
    null,
  );
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  // Track which row is currently processing (spinner on inline button)
  const [processingRowId, setProcessingRowId] = useState<string | null>(null);

  const [trainingExportOpen, setTrainingExportOpen] = useState(false);

  // ── Selection state (US-5.5.2) ────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Clear selection on tab/sub-tab/filter/page change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, subTab, statusFilter, page]);

  // ── Tab counts ────────────────────────────────────────
  const tabCounts = useMemo(() => {
    return getTabCounts(providers);
  }, [providers]);
  const pendingCount = useMemo(() => {
    if (activeTab === "Onboarding")
      return providers.filter((p) => p.verificationStatus === "Pending").length;
    return getPendingCount(providers, activeTab as ProviderType);
  }, [providers, activeTab]);

  // ── Tab change handler (resets everything) ────────────
  const handleTabChange = (tab: ProviderTabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSubTab("all");
    setStatusFilter("all");
    setSearchInput("");
    setDebouncedSearch("");
    setSortField("createdAt");
    setSortDir("desc");
    setPage(1);
    // Brief loading state for tab switch
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 200);
  };

  // ── Sub-tab change handler ────────────────────────────
  const handleSubTabChange = (sub: "all" | "onboarding") => {
    setSubTab(sub);
    setStatusFilter("all");
    setPage(1);
  };

  // ── Status filter change handler (US-5.5.1) ───────────
  const handleStatusFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setPage(1);
  };

  // ── Status filter counts (US-5.5.1) ───────────────────
  // Counts are based on current tab's data (after sub-tab but before search/status filter)
  const statusFilterCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: 0,
      active: 0,
      inactive: 0,
      verified: 0,
      unverified: 0,
      locked: 0,
    };

    let base =
      activeTab === "Onboarding"
        ? providers.filter((p) => p.verificationStatus === "Pending")
        : providers.filter((p) => p.providerType === activeTab);
    if (activeTab !== "Onboarding" && subTab === "onboarding")
      base = base.filter((p) => p.verificationStatus === "Pending");
    counts.all = base.length;
    base.forEach((p) => {
      if (p.platformStatus === "Active") counts.active++;
      if (p.platformStatus === "Inactive") counts.inactive++;
      if (p.verificationStatus === "Approved") counts.verified++;
      if (p.verificationStatus === "Pending") counts.unverified++;
      if (p.accountStatus === "Locked") counts.locked++;
    });

    return counts;
  }, [providers, activeTab, subTab]);

  // ── Filter, sort, paginate ────────────────────────────
  const filtered = useMemo(() => {
    let result =
      activeTab === "Onboarding"
        ? providers.filter((p) => p.verificationStatus === "Pending")
        : providers.filter((p) => p.providerType === activeTab);

    if (activeTab !== "Onboarding" && subTab === "onboarding") {
      result = result.filter((p) => p.verificationStatus === "Pending");
    }

    // Status filter (US-5.5.1)
    if (statusFilter !== "all") {
      result = result.filter((p) => matchesStatusFilter(p, statusFilter));
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.mobile.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
          (p.personInCharge && p.personInCharge.toLowerCase().includes(q)),
      );
    }

    // Use facility-specific sort for Facility Provider tab
    if (activeTab === "Facility Provider") {
      result.sort((a, b) => {
        let cmp = 0;
        switch (facilitySortField) {
          case "name":
            cmp = a.name.localeCompare(b.name);
            break;
          case "incorporationDate":
            cmp =
              (a.incorporationDate?.getTime() ?? 0) -
              (b.incorporationDate?.getTime() ?? 0);
            break;
          case "email":
            cmp = a.email.localeCompare(b.email);
            break;
          case "personInCharge":
            cmp = (a.personInCharge ?? "").localeCompare(
              b.personInCharge ?? "",
            );
            break;
          case "verificationStatus": {
            const order = { Pending: 0, Approved: 1, Rejected: 2 };
            cmp = order[a.verificationStatus] - order[b.verificationStatus];
            break;
          }
        }
        return facilitySortDir === "asc" ? cmp : -cmp;
      });
    } else {
      result.sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "name":
            cmp = a.name.localeCompare(b.name);
            break;
          case "email":
            cmp = a.email.localeCompare(b.email);
            break;
          case "verificationStatus": {
            const order = { Pending: 0, Approved: 1, Rejected: 2 };
            cmp = order[a.verificationStatus] - order[b.verificationStatus];
            break;
          }
          case "createdAt":
            cmp = a.createdAt.getTime() - b.createdAt.getTime();
            break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [
    providers,
    activeTab,
    subTab,
    debouncedSearch,
    sortField,
    sortDir,
    facilitySortField,
    facilitySortDir,
    statusFilter,
  ]);

  const handleTrainingExportDownload = useCallback(
    async (fmt: ExportFormat) => {
      if (activeTab !== "Training Provider") {
        toast.error("Open the Training Provider tab to export.");
        throw new Error("wrong-tab");
      }
      const rows = filtered.filter((p) => p.providerType === "Training Provider");
      if (rows.length === 0) {
        toast.error("No rows to export.");
        throw new Error("empty");
      }
      const headers = [
        "ID",
        "Name",
        "Email",
        "Mobile",
        "Verification",
        "Account",
        "Platform",
        "Created",
      ];
      const data = rows.map((p) => [
        p.id,
        p.name,
        p.email,
        p.mobile,
        p.verificationStatus,
        p.accountStatus,
        p.platformStatus,
        format(p.createdAt, "yyyy-MM-dd HH:mm"),
      ]);
      await exportTable({
        format: fmt,
        filenamePrefix: "training-providers",
        sqlTableName: "training_providers",
        pdfTitle: "Training providers export",
        headers,
        rows: data,
      });
    },
    [activeTab, filtered],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedProviders = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Unified counts for pagination
  const activeFiltered = filtered;
  const activeTotalPages = Math.max(
    1,
    Math.ceil(activeFiltered.length / pageSize),
  );

  // ── Toggle select all on page (US-5.5.2) ───────────────
  const toggleSelectAllOnPage = useCallback(() => {
    const pageIds = pagedProviders.map((p) => p.id);
    setSelectedIds((prev) => {
      const allSelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [pagedProviders]);

  // ── Unified items for BulkActionBar (US-5.5.2) ────────
  const bulkAllItems = useMemo(() => {
    return filtered.map((p) => ({
      id: p.id,
      name: p.name,
      verificationStatus: p.verificationStatus,
      accountStatus: p.accountStatus,
      platformStatus: p.platformStatus,
    }));
  }, [filtered]);

  // ── Bulk action handler (US-5.5.2) ────────────────────
  const handleBulkAction = useCallback(
    async (
      action: BulkActionType,
      ids: string[],
      rejectionReason?: string,
      onProgress?: (processed: number, total: number) => void,
    ): Promise<BulkActionResult> => {
      setBulkProcessing(true);
      let processed = 0,
        skipped = 0,
        skipReason = "";
      const isLarge = ids.length > 50;
      const delay = isLarge ? 80 : 400;

      try {
        await adminService.bulkProviderAction({
          action,
          provider_ids: ids,
          rejection_reason: rejectionReason,
        });
      } catch (err) {
        console.error("Bulk action failed, applying optimistic update:", err);
      }

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        let shouldSkip = false;

        const p = providers.find((x) => x.id === id);
        if (p) {
          if (action === "approve" && p.verificationStatus === "Approved") {
            shouldSkip = true;
            skipReason = "already approved";
          }
          if (action === "reject" && p.verificationStatus === "Rejected") {
            shouldSkip = true;
            skipReason = "already rejected";
          }
          if (action === "lock" && p.accountStatus === "Locked") {
            shouldSkip = true;
            skipReason = "already locked";
          }
          if (action === "unlock" && p.accountStatus === "Unlocked") {
            shouldSkip = true;
            skipReason = "already unlocked";
          }
          if (action === "activate" && p.platformStatus === "Active") {
            shouldSkip = true;
            skipReason = "already active";
          }
          if (action === "deactivate" && p.platformStatus === "Inactive") {
            shouldSkip = true;
            skipReason = "already inactive";
          }
        }

        if (shouldSkip) {
          skipped++;
        } else {
          setProviders((prev) =>
            prev.map((p) => {
              if (p.id !== id) return p;
              switch (action) {
                case "approve":
                  return {
                    ...p,
                    verificationStatus: "Approved" as const,
                    platformStatus: "Active" as const,
                  };
                case "reject":
                  return {
                    ...p,
                    verificationStatus: "Rejected" as const,
                    rejectionReason,
                  };
                case "lock":
                  return { ...p, accountStatus: "Locked" as const };
                case "unlock":
                  return { ...p, accountStatus: "Unlocked" as const };
                case "activate":
                  return { ...p, platformStatus: "Active" as const };
                case "deactivate":
                  return { ...p, platformStatus: "Inactive" as const };
                default:
                  return p;
              }
            }),
          );
          processed++;
        }

        if (onProgress && (i % 5 === 0 || i === ids.length - 1))
          onProgress(i + 1, ids.length);
      }

      setBulkProcessing(false);
      return { processed, skipped, total: ids.length, skipReason };
    },
    [providers],
  );

  // Reset page when data changes
  useEffect(() => {
    if (page > activeTotalPages) setPage(1);
  }, [activeFiltered.length, pageSize, page, activeTotalPages]);

  // ── Delete handler ────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminService.updateProvider(deleteTarget.id, {
        status: "inactive",
      });
      setProviders((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showBanner(
        "success",
        `Provider "${deleteTarget.name}" has been removed.`,
      );
      toast.success("Provider removed successfully.");
    } catch {
      toast.error("Failed to remove provider.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Approve handler ───────────────────────────────────
  const handleApproveConfirm = useCallback(async () => {
    if (!approveTarget) return;
    setIsApproving(true);
    setProcessingRowId(approveTarget.id);
    try {
      await adminService.approveProvider(approveTarget.id, {
        action: "approve",
      });
      setProviders((prev) =>
        prev.map((p) =>
          p.id === approveTarget.id
            ? {
                ...p,
                verificationStatus: "Approved" as const,
                platformStatus: "Active" as const,
              }
            : p,
        ),
      );
      toast.success("Provider approved successfully.", { duration: 5000 });
      setApproveTarget(null);
    } catch {
      toast.error(
        "Failed to approve provider. It may have been processed by another admin.",
        { duration: 8000 },
      );
      setApproveTarget(null);
    } finally {
      setIsApproving(false);
      setProcessingRowId(null);
    }
  }, [approveTarget]);

  // ── Reject handler ────────────────────────────────────
  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!rejectTarget) return;
      setIsRejecting(true);
      setProcessingRowId(rejectTarget.id);
      try {
        await adminService.approveProvider(rejectTarget.id, {
          action: "reject",
          rejection_reason: reason,
        });
        setProviders((prev) =>
          prev.map((p) =>
            p.id === rejectTarget.id
              ? {
                  ...p,
                  verificationStatus: "Rejected" as const,
                  rejectionReason: reason,
                }
              : p,
          ),
        );
        toast.success("Provider rejected successfully.", { duration: 5000 });
        setRejectTarget(null);
      } catch {
        toast.error("Provider already processed by another admin.", {
          duration: 8000,
        });
        setRejectTarget(null);
      } finally {
        setIsRejecting(false);
        setProcessingRowId(null);
      }
    },
    [rejectTarget],
  );

  // ── Sort header component ─────────────────────────────
  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={cn(
        "px-4 cursor-pointer select-none hover:bg-gray-100/50 transition-colors",
        className,
      )}
    >
      <button
        onClick={() => handleSort(field)}
        className="inline-flex items-center gap-1 w-full"
        aria-label={`Sort by ${field}`}
      >
        {children}
        {sortField === field ? (
          sortDir === "asc" ? (
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

  // ── Pagination range for button rendering ─────────────
  const getPageNumbers = (): number[] => {
    if (activeTotalPages <= 7)
      return Array.from({ length: activeTotalPages }, (_, i) => i + 1);
    const pages: number[] = [];
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push(-1); // ellipsis
      pages.push(activeTotalPages);
    } else if (page >= activeTotalPages - 3) {
      pages.push(1);
      pages.push(-1);
      for (let i = activeTotalPages - 4; i <= activeTotalPages; i++)
        pages.push(i);
    } else {
      pages.push(1);
      pages.push(-1);
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push(-2);
      pages.push(activeTotalPages);
    }
    return pages;
  };

  // ── Access Denied screen ──────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl text-[#111827]">Access Denied</h1>
          <p className="text-sm text-[#6B7280]">
            You do not have permission to access the Provider Management page.
            Only administrators can view this content.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* ── Banner ──────────────────────────────────────── */}
      {banner.visible && (
        <div
          role={banner.type === "error" ? "alert" : "status"}
          aria-live={banner.type === "error" ? "assertive" : "polite"}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border",
            BANNER_STYLES[banner.type].bg,
            BANNER_STYLES[banner.type].border,
            BANNER_STYLES[banner.type].text,
          )}
        >
          {(() => {
            const Icon = BANNER_STYLES[banner.type].icon;
            return <Icon className="h-4 w-4 shrink-0" />;
          })()}
          <p className="text-sm flex-1">{banner.message}</p>
          <button
            onClick={() => setBanner((b) => ({ ...b, visible: false }))}
            className="p-1 rounded hover:bg-black/5"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Provider Management
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            View and manage all registered service providers, approve onboarding
            requests, and monitor account statuses.
          </p>
        </div>
        {activeTab === "Training Provider" && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              className="h-10 gap-2"
              disabled={isLoading}
              onClick={() => setTrainingExportOpen(true)}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              className="bg-[#003B95] hover:bg-[#002d73] text-white text-sm h-10"
              onClick={() => navigate("/providers/new")}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Training Provider
            </Button>
          </div>
        )}
        {activeTab === "Facility Provider" && (
          <Button
            className="bg-[#003B95] hover:bg-[#002d73] text-white text-sm h-10 shrink-0"
            onClick={() => navigate("/providers/facility/new")}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Facility Provider
          </Button>
        )}
      </div>

      {/* ── Main Tabs ───────────────────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div
          className="border-b"
          role="tablist"
          aria-label="Provider type tabs"
        >
          <div className="flex overflow-x-auto">
            {PROVIDER_TABS.map((tab) => {
              const Icon = TAB_ICONS[tab.key];
              const isActive = activeTab === tab.key;
              const count = tabCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.key}`}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3.5 text-sm whitespace-nowrap border-b-2 transition-colors shrink-0",
                    isActive
                      ? "border-[#003B95] text-[#003B95]"
                      : "border-transparent text-[#6B7280] hover:text-[#374151] hover:border-gray-200",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 min-w-[20px] justify-center",
                      isActive
                        ? "bg-[#003B95]/10 text-[#003B95] border-[#003B95]/20"
                        : "bg-gray-100 text-gray-500 border-gray-200",
                    )}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-tabs + Search row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3 border-b bg-gray-50/50">
          {/* Sub-tabs */}
          <div
            className="flex items-center gap-1"
            role="tablist"
            aria-label="Provider sub-tabs"
          >
            <button
              role="tab"
              aria-selected={subTab === "all"}
              onClick={() => handleSubTabChange("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs transition-colors border",
                subTab === "all"
                  ? "bg-white border-gray-200 text-[#111827] shadow-sm"
                  : "bg-transparent border-transparent text-[#6B7280] hover:text-[#374151] hover:bg-white/60",
              )}
            >
              All
            </button>
            <button
              role="tab"
              aria-selected={subTab === "onboarding"}
              onClick={() => handleSubTabChange("onboarding")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs transition-colors border flex items-center gap-1.5",
                subTab === "onboarding"
                  ? "bg-white border-gray-200 text-[#111827] shadow-sm"
                  : "bg-transparent border-transparent text-[#6B7280] hover:text-[#374151] hover:bg-white/60",
              )}
            >
              Onboarding Requests
              {pendingCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 min-w-[16px] justify-center bg-amber-100 text-amber-700 border-amber-200"
                >
                  {pendingCount}
                </Badge>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or mobile"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-8 h-10 text-sm"
              aria-label="Search providers"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* ── Status Filter Chips (US-5.5.1) ─────────────── */}
        <div className="flex items-center gap-1.5 px-5 py-2 border-b bg-white overflow-x-auto">
          <Filter className="h-3 w-3 text-gray-400 shrink-0" />
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.key;
            const count = statusFilterCounts[opt.key];
            return (
              <button
                key={opt.key}
                onClick={() => handleStatusFilterChange(opt.key)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all whitespace-nowrap shrink-0",
                  isActive
                    ? cn(opt.activeBg, opt.activeText, opt.activeBorder)
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700",
                )}
                aria-pressed={isActive}
              >
                {opt.dot && (
                  <span
                    className={cn(
                      "w-1 h-1 rounded-full shrink-0",
                      isActive ? opt.dot : "bg-gray-300",
                    )}
                  />
                )}
                {opt.label}
                <span
                  className={cn(
                    "text-[9px] tabular-nums px-0.5 rounded-full min-w-[14px] text-center",
                    isActive
                      ? opt.key === "all"
                        ? "bg-white/20 text-white"
                        : cn(opt.activeBg, opt.activeText)
                      : "bg-gray-100 text-gray-400",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Bulk Action Bar (US-5.5.2) ─────────────────── */}
        {selectedIds.size > 0 && !isLoading && (
          <BulkActionBar
            selectedIds={selectedIds}
            allItems={bulkAllItems}
            onBulkAction={handleBulkAction}
            onClearSelection={clearSelection}
            disabled={bulkProcessing}
          />
        )}

        {/* ── Table or skeleton or empty state ───────────── */}
        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-label={`${activeTab} providers list`}
        >
          {isLoading ? (
            /* ── Skeleton Loader ──────────────────────── */
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-32 hidden md:block" />
                  <Skeleton className="h-4 w-28 hidden lg:block" />
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-16 rounded hidden md:block" />
                  <Skeleton className="h-5 w-14 rounded hidden lg:block" />
                  <Skeleton className="h-4 w-28 hidden xl:block" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : activeFiltered.length === 0 ? (
            /* ── Empty State ──────────────────────────── */
            <div className="text-center py-20 space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                {statusFilter !== "all" ? (
                  <Filter className="h-8 w-8 text-gray-300" />
                ) : subTab === "onboarding" ? (
                  <CheckCircle2 className="h-8 w-8 text-gray-300" />
                ) : debouncedSearch ? (
                  <Search className="h-8 w-8 text-gray-300" />
                ) : (
                  (() => {
                    const Icon = TAB_ICONS[activeTab];
                    return <Icon className="h-8 w-8 text-gray-300" />;
                  })()
                )}
              </div>
              <p className="text-sm text-[#374151]">
                {statusFilter !== "all"
                  ? "No providers match this filter."
                  : subTab === "onboarding"
                    ? "No pending onboarding requests"
                    : debouncedSearch
                      ? `No results found for "${debouncedSearch}"`
                      : `No ${activeTab.toLowerCase()}s registered yet`}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {statusFilter !== "all"
                  ? "Try selecting a different status filter or clear all filters."
                  : subTab === "onboarding"
                    ? "All onboarding requests have been processed."
                    : debouncedSearch
                      ? "Try adjusting your search terms."
                      : "Providers will appear here once they register."}
              </p>
              {(debouncedSearch || statusFilter !== "all") && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  {debouncedSearch && (
                    <Button variant="outline" size="sm" onClick={clearSearch}>
                      Clear Search
                    </Button>
                  )}
                  {statusFilter !== "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusFilterChange("all")}
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── Data Table ───────────────────────────── */
            <>
              {/* ── Facility Provider Tab: dedicated table ── */}
              {activeTab === "Facility Provider" ? (
                <FacilityProviderTable
                  providers={pagedProviders}
                  sortField={facilitySortField}
                  sortDir={facilitySortDir}
                  onSort={handleFacilitySort}
                  processingRowId={processingRowId}
                  isApproving={isApproving}
                  isRejecting={isRejecting}
                  onApprove={setApproveTarget}
                  onReject={setRejectTarget}
                  onDelete={setDeleteTarget}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAll={toggleSelectAllOnPage}
                  bulkProcessing={bulkProcessing}
                />
              ) : (
                /* ── Generic table for Training Provider / Onboarding ── */
                <div className="overflow-x-auto">
                  <Table>
                    <caption className="sr-only">
                      {activeTab} providers list
                    </caption>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        {/* Checkbox header (US-5.5.2) */}
                        <TableHead className="px-3 w-10">
                          <Checkbox
                            checked={
                              pagedProviders.length > 0 &&
                              pagedProviders.every((p) => selectedIds.has(p.id))
                                ? true
                                : pagedProviders.some((p) =>
                                      selectedIds.has(p.id),
                                    )
                                  ? "indeterminate"
                                  : false
                            }
                            onCheckedChange={() => toggleSelectAllOnPage()}
                            disabled={bulkProcessing}
                            aria-label="Select all on this page"
                            className="data-[state=indeterminate]:bg-[#003B95] data-[state=indeterminate]:border-[#003B95]"
                          />
                        </TableHead>
                        <SortableHeader field="name">
                          Provider Name
                        </SortableHeader>
                        {activeTab === "Onboarding" && (
                          <TableHead className="px-4">Provider Type</TableHead>
                        )}
                        <SortableHeader
                          field="email"
                          className="hidden md:table-cell"
                        >
                          Email ID
                        </SortableHeader>
                        <TableHead className="px-4 hidden lg:table-cell">
                          Mobile Number
                        </TableHead>
                        {activeTab !== "Onboarding" && (
                          <SortableHeader field="verificationStatus">
                            Verification
                          </SortableHeader>
                        )}
                        <TableHead className="px-4 hidden md:table-cell">
                          Account
                        </TableHead>
                        <TableHead className="px-4 hidden lg:table-cell">
                          Platform
                        </TableHead>
                        <SortableHeader
                          field="createdAt"
                          className="hidden xl:table-cell"
                        >
                          Created Date
                        </SortableHeader>
                        <TableHead className="px-4 w-[140px]">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedProviders.map((provider) => (
                        <TableRow
                          key={provider.id}
                          className={cn(
                            "group hover:bg-gray-50/50 transition-colors",
                            selectedIds.has(provider.id) && "bg-blue-50/40",
                          )}
                        >
                          {/* Row checkbox (US-5.5.2) */}
                          <TableCell className="px-3 w-10">
                            <Checkbox
                              checked={selectedIds.has(provider.id)}
                              onCheckedChange={() => toggleSelect(provider.id)}
                              disabled={bulkProcessing}
                              aria-label={`Select ${provider.name}`}
                            />
                          </TableCell>
                          {/* Provider Name */}
                          <TableCell className="px-4">
                            <TruncatedCell
                              text={provider.name}
                              maxLength={30}
                              className="text-sm text-[#111827]"
                            />
                          </TableCell>

                          {/* Provider Type (Onboarding tab only) */}
                          {activeTab === "Onboarding" && (
                            <TableCell className="px-4">
                              <ProviderTypeBadge
                                type={
                                  provider.onboardingType ??
                                  provider.providerType
                                }
                              />
                            </TableCell>
                          )}

                          {/* Email */}
                          <TableCell className="px-4 hidden md:table-cell">
                            <div className="max-w-[180px] truncate">
                              <TruncatedCell
                                text={provider.email}
                                maxLength={25}
                                className="text-sm text-[#6B7280]"
                              />
                            </div>
                          </TableCell>

                          {/* Mobile */}
                          <TableCell className="px-4 hidden lg:table-cell">
                            <span className="text-sm text-[#6B7280] max-w-[180px] truncate block">
                              {provider.mobile}
                            </span>
                          </TableCell>

                          {/* Verification Status (hidden on Onboarding tab) */}
                          {activeTab !== "Onboarding" && (
                            <TableCell className="px-4">
                              <VerificationBadge
                                status={provider.verificationStatus}
                              />
                            </TableCell>
                          )}

                          {/* Account Status */}
                          <TableCell className="px-4 hidden md:table-cell">
                            <AccountStatusBadge
                              status={provider.accountStatus}
                            />
                          </TableCell>

                          {/* Platform Status */}
                          <TableCell className="px-4 hidden lg:table-cell">
                            <PlatformStatusBadge
                              status={provider.platformStatus}
                            />
                          </TableCell>

                          {/* Created Date */}
                          <TableCell className="px-4 hidden xl:table-cell">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-[#6B7280] cursor-default">
                                  {format(
                                    provider.createdAt,
                                    "dd/MM/yyyy HH:mm",
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {formatDistanceToNow(provider.createdAt, {
                                  addSuffix: true,
                                })}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="px-4">
                            <div className="flex items-center gap-1">
                              {/* ── Approve / Reject buttons (Pending only) ── */}
                              {provider.verificationStatus === "Pending" && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                        disabled={
                                          processingRowId === provider.id
                                        }
                                        onClick={() =>
                                          setApproveTarget(provider)
                                        }
                                        aria-label={`Approve ${provider.name}`}
                                      >
                                        {processingRowId === provider.id &&
                                        isApproving ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Check className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Approve</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        disabled={
                                          processingRowId === provider.id
                                        }
                                        onClick={() =>
                                          setRejectTarget(provider)
                                        }
                                        aria-label={`Reject ${provider.name}`}
                                      >
                                        {processingRowId === provider.id &&
                                        isRejecting ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Ban className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reject</TooltipContent>
                                  </Tooltip>
                                  <div className="w-px h-4 bg-gray-200 mx-0.5" />
                                </>
                              )}

                              {/* Open Chat */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-7 w-7 relative",
                                      !globalChatEnabled &&
                                        "opacity-40 cursor-not-allowed",
                                    )}
                                    disabled={!globalChatEnabled}
                                    onClick={() => {
                                      if (globalChatEnabled) {
                                        openChat(provider.id, provider.name);
                                      }
                                    }}
                                    aria-label={
                                      globalChatEnabled
                                        ? `Open chat with ${provider.name}`
                                        : "Chat is disabled"
                                    }
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    {/* Unread badge */}
                                    {globalChatEnabled &&
                                      (unreadCounts[provider.id] || 0) > 0 && (
                                        <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] leading-none">
                                          {unreadCounts[provider.id]}
                                        </span>
                                      )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {globalChatEnabled
                                    ? "Open Chat"
                                    : "Chat is disabled"}
                                </TooltipContent>
                              </Tooltip>

                              {/* Edit */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      if (
                                        provider.providerType ===
                                        "Training Provider"
                                      ) {
                                        navigate(
                                          `/providers/${provider.id}/edit`,
                                        );
                                      } else {
                                        toast.info(
                                          `Navigating to edit form for ${provider.name}...`,
                                        );
                                      }
                                    }}
                                    aria-label={`Edit ${provider.name}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>

                              {/* Delete */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setDeleteTarget(provider)}
                                    aria-label={`Delete ${provider.name}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* ── Pagination ──────────────────────────── */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t bg-gray-50/50 gap-3">
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <span>Rows per page:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger
                      className="h-7 w-[68px] text-xs"
                      aria-label="Rows per page"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="ml-2">
                    Showing{" "}
                    {Math.min((page - 1) * pageSize + 1, activeFiltered.length)}
                    –{Math.min(page * pageSize, activeFiltered.length)} of{" "}
                    {activeFiltered.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-7 w-7 p-0"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  {getPageNumbers().map((p, i) => {
                    if (p < 0) {
                      return (
                        <span
                          key={`ellipsis-${i}`}
                          className="px-1 text-xs text-gray-400"
                        >
                          ...
                        </span>
                      );
                    }
                    return (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className={cn(
                          "h-7 w-7 p-0 text-xs",
                          p === page && "bg-[#003B95] hover:bg-[#002a6b]",
                        )}
                      >
                        {p}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= activeTotalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-7 w-7 p-0"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════
          Delete Confirmation Modal
          ══════════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="text-[#111827]">{deleteTarget?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 gap-1.5"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════════════════════════════════════════════
          Approve Confirmation Modal
          ══════════════════════════════════════════════════════ */}
      <ApproveConfirmModal
        provider={approveTarget}
        open={!!approveTarget}
        isProcessing={isApproving}
        onConfirm={handleApproveConfirm}
        onCancel={() => {
          if (!isApproving) setApproveTarget(null);
        }}
      />

      {/* ══════════════════════════════════════════════════════
          Reject Modal with Rejection Reason
          ══════════════════════════════════════════════════════ */}
      <RejectReasonModal
        provider={rejectTarget}
        open={!!rejectTarget}
        isProcessing={isRejecting}
        onConfirm={handleRejectConfirm}
        onCancel={() => {
          if (!isRejecting) setRejectTarget(null);
        }}
      />

      <SimpleExportModal
        open={trainingExportOpen}
        onOpenChange={setTrainingExportOpen}
        title="Export training providers"
        description="Uses the current list: search, status filters, and sub-tabs (All / Onboarding) all apply."
        onDownload={handleTrainingExportDownload}
      />
    </div>
  );
}
