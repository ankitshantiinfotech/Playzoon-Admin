// ─── SCR-ADM-027: Coach Listing (Admin Operations View) ─────────────────────
// Centralized view of all freelance coaches. Read-only listing with filters,
// search, export, and navigation to Coach Detail (SCR-ADM-028).

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
  Star,
  ShieldCheck,
  ShieldX,
  Clock,
  CheckCircle2,
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
import { COACH_SPECIALIZATIONS } from "../providers/components/freelancer-coach-data";
import { adminService } from "@/services/admin.service";

// ─── Ops-specific extended mock data (adds fields SCR-ADM-027 needs) ────────

interface CoachOpsRow {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  sports: string[];
  specialities: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  status: "Active" | "Inactive" | "Locked";
  verificationStatus: "Verified" | "Unverified" | "Pending";
  registeredDate: Date;
}

function mapApiToOpsRow(p: Record<string, unknown>): CoachOpsRow {
  const status = String(p.status || "inactive");
  const verStatus = String(
    p.verification_status || p.provider_approval_status || "pending",
  );
  const verMap: Record<string, "Verified" | "Unverified" | "Pending"> = {
    approved: "Verified",
    pending: "Pending",
    rejected: "Unverified",
  };
  return {
    id: String(p.id || ""),
    firstName: String(p.first_name || p.first_name_en || ""),
    lastName: String(p.last_name || p.last_name_en || ""),
    avatar: p.profile_photo_url ? String(p.profile_photo_url) : undefined,
    sports: [],
    specialities: [],
    experience: 0,
    rating: 0,
    reviewCount: 0,
    status: p.is_locked
      ? "Locked"
      : status === "active"
        ? "Active"
        : "Inactive",
    verificationStatus: verMap[verStatus.toLowerCase()] ?? "Unverified",
    registeredDate: p.created_at ? new Date(String(p.created_at)) : new Date(),
  };
}

// ─── Types ──────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "inactive" | "locked";
type VerificationFilter = "all" | "verified" | "unverified" | "pending";
type RatingFilter = "all" | "4+" | "3+" | "2+" | "1+" | "unrated";
type SortField =
  | "id"
  | "name"
  | "experience"
  | "rating"
  | "status"
  | "verificationStatus"
  | "registeredDate";
type SortDir = "asc" | "desc";

// ─── Badge helpers ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Inactive: "bg-gray-100 text-gray-600 border-gray-200",
  Locked: "bg-red-100 text-red-800 border-red-200",
};

const VERIFICATION_STYLES: Record<
  string,
  { cls: string; icon: React.ElementType | null }
> = {
  Verified: {
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: ShieldCheck,
  },
  Unverified: {
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    icon: ShieldX,
  },
  Pending: { cls: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
};

// ─── Rating Stars ───────────────────────────────────────────────────────────

function RatingStars({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  if (reviewCount === 0) {
    return <span className="text-xs text-[#9CA3AF]">N/A (0)</span>;
  }
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  const stars: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />,
      );
    } else if (i === full && half) {
      stars.push(
        <span key={i} className="relative inline-block w-3.5 h-3.5">
          <Star className="w-3.5 h-3.5 text-gray-300 absolute inset-0" />
          <span className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </span>
        </span>,
      );
    } else {
      stars.push(<Star key={i} className="w-3.5 h-3.5 text-gray-300" />);
    }
  }
  return (
    <span
      className="flex items-center gap-1"
      role="img"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      <span className="flex">{stars}</span>
      <span className="text-xs text-[#111827] font-medium">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

// ─── Initials avatar ────────────────────────────────────────────────────────

function AvatarInitials({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) {
  const name = `${firstName} ${lastName}`;
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  const bg = colors[hash % colors.length];
  return (
    <div
      className={cn(
        "w-9 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
        bg,
      )}
      aria-hidden="true"
    >
      {firstName[0]}
      {lastName[0]}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function FreelanceCoachListPage() {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState<CoachOpsRow[]>([]);
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(true);

  // Fetch coaches from real API
  useEffect(() => {
    setIsLoadingCoaches(true);
    let cancelled = false;
    adminService
      .listProviders({ provider_type: "freelance_coach", page: 1, limit: 100 })
      .then((res: any) => {
        if (cancelled) return;
        // Response shape: { success, data: { providers, pagination } } after .then(r => r.data)
        const providers = res?.data?.providers || res?.providers || [];
        setCoaches(
          Array.isArray(providers)
            ? providers.map((p: Record<string, unknown>) => mapApiToOpsRow(p))
            : [],
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          (err as any)?.response?.data?.message || "Failed to load coaches";
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCoaches(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");

  // ── Sort ────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("registeredDate");
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

  // ── Active filters ──────────────────────────────────
  const activeFilters: { label: string; onClear: () => void }[] = [];
  if (sportFilter !== "all")
    activeFilters.push({
      label: `Sport: ${sportFilter}`,
      onClear: () => {
        setSportFilter("all");
        setPage(1);
      },
    });
  if (statusFilter !== "all")
    activeFilters.push({
      label: `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`,
      onClear: () => {
        setStatusFilter("all");
        setPage(1);
      },
    });
  if (verificationFilter !== "all")
    activeFilters.push({
      label: `Verification: ${verificationFilter.charAt(0).toUpperCase() + verificationFilter.slice(1)}`,
      onClear: () => {
        setVerificationFilter("all");
        setPage(1);
      },
    });
  if (ratingFilter !== "all")
    activeFilters.push({
      label: `Rating: ${ratingFilter === "unrated" ? "Unrated" : ratingFilter + " Stars"}`,
      onClear: () => {
        setRatingFilter("all");
        setPage(1);
      },
    });

  const clearAllFilters = () => {
    setSportFilter("all");
    setStatusFilter("all");
    setVerificationFilter("all");
    setRatingFilter("all");
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
  };

  // ── Filtering + Sorting ─────────────────────────────
  const filtered = useMemo(() => {
    let result = [...coaches];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.sports.some((s) => s.toLowerCase().includes(q)) ||
          c.specialities.some((s) => s.toLowerCase().includes(q)),
      );
    }

    // Sport filter
    if (sportFilter !== "all") {
      result = result.filter((c) => c.sports.some((s) => s === sportFilter));
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status.toLowerCase() === statusFilter);
    }

    // Verification filter
    if (verificationFilter !== "all") {
      result = result.filter(
        (c) => c.verificationStatus.toLowerCase() === verificationFilter,
      );
    }

    // Rating filter
    if (ratingFilter !== "all") {
      if (ratingFilter === "unrated") {
        result = result.filter((c) => c.reviewCount === 0);
      } else {
        const min = parseInt(ratingFilter);
        result = result.filter((c) => c.rating >= min);
      }
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "id":
          cmp = a.id.localeCompare(b.id);
          break;
        case "name":
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
          );
          break;
        case "experience":
          cmp = a.experience - b.experience;
          break;
        case "rating": {
          const aR = a.reviewCount === 0 ? -1 : a.rating;
          const bR = b.reviewCount === 0 ? -1 : b.rating;
          cmp = aR - bR;
          break;
        }
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "verificationStatus":
          cmp = a.verificationStatus.localeCompare(b.verificationStatus);
          break;
        case "registeredDate":
          cmp = a.registeredDate.getTime() - b.registeredDate.getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    coaches,
    debouncedSearch,
    sportFilter,
    statusFilter,
    verificationFilter,
    ratingFilter,
    sortField,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Export ──────────────────────────────────────────
  const handleExport = (fmt: string) => {
    if (filtered.length === 0) {
      toast.warning("No data to export. Please adjust your filters.");
      return;
    }
    // Generate CSV from current filtered data
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Status",
      "Verification",
      "Registered Date",
    ];
    const rows = filtered.map((c) => [
      c.id,
      c.firstName,
      c.lastName,
      c.status,
      c.verificationStatus,
      c.registeredDate.toISOString(),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coaches-export.${fmt === "csv" ? "csv" : fmt}`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(
      `Exported ${filtered.length} coaches as ${fmt.toUpperCase()}.`,
    );
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

  return (
    <div
      className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen"
      role="main"
      aria-label="Coach Management"
    >
      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280]">
        <span
          className="hover:text-[#003B95] cursor-pointer"
          onClick={() => navigate("/")}
        >
          Dashboard
        </span>
        <span className="mx-2">/</span>
        <span className="text-[#111827] font-medium">Coaches</span>
      </nav>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
          Coach Management
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2"
              aria-label="Export coach data"
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("xls")}>
              XLS
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("txt")}>
              TXT
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("sql")}>
              SQL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search by coach name, sport, speciality..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10"
              aria-label="Search coaches by name, sport, or speciality"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sport Filter */}
          <div className="space-y-1 min-w-[160px]">
            <Select
              value={sportFilter}
              onValueChange={(v) => {
                setSportFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10" aria-label="Filter by sport">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {COACH_SPECIALIZATIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1 min-w-[140px]">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10"
                aria-label="Filter by coach status"
              >
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Verification Filter */}
          <div className="space-y-1 min-w-[160px]">
            <Select
              value={verificationFilter}
              onValueChange={(v) => {
                setVerificationFilter(v as VerificationFilter);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10"
                aria-label="Filter by verification status"
              >
                <SelectValue placeholder="All Verifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verifications</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="pending">Pending Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating Filter */}
          <div className="space-y-1 min-w-[130px]">
            <Select
              value={ratingFilter}
              onValueChange={(v) => {
                setRatingFilter(v as RatingFilter);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10"
                aria-label="Filter by minimum rating"
              >
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4+">4+ Stars</SelectItem>
                <SelectItem value="3+">3+ Stars</SelectItem>
                <SelectItem value="2+">2+ Stars</SelectItem>
                <SelectItem value="1+">1+ Stars</SelectItem>
                <SelectItem value="unrated">Unrated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="gap-1.5 text-xs text-red-500 hover:text-red-700 h-10"
              aria-label="Clear all active filters"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Bar */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
            {activeFilters.map((f, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="gap-1.5 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200"
              >
                {f.label}
                <button
                  onClick={f.onClear}
                  className="ml-1 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-700 hover:underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ── DataTable ── */}
      <div
        className="bg-white border rounded-xl overflow-hidden"
        role="table"
        aria-label="Coaches table"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#6B7280] uppercase bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th
                  className="px-3 py-3 w-[100px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("id")}
                >
                  ID <SortIcon col="id" />
                </th>
                <th className="px-2 py-3 w-[50px]">Avatar</th>
                <th
                  className="px-3 py-3 w-[180px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  Name <SortIcon col="name" />
                </th>
                <th className="px-3 py-3 w-[150px]">Sports</th>
                <th className="px-3 py-3 w-[150px]">Specialities</th>
                <th
                  className="px-3 py-3 w-[100px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("experience")}
                >
                  Experience <SortIcon col="experience" />
                </th>
                <th
                  className="px-3 py-3 w-[100px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("rating")}
                >
                  Rating <SortIcon col="rating" />
                </th>
                <th
                  className="px-3 py-3 w-[100px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon col="status" />
                </th>
                <th
                  className="px-3 py-3 w-[120px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("verificationStatus")}
                >
                  Verification <SortIcon col="verificationStatus" />
                </th>
                <th
                  className="px-3 py-3 w-[120px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("registeredDate")}
                >
                  Registered <SortIcon col="registeredDate" />
                </th>
                <th className="px-3 py-3 w-[60px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length > 0 ? (
                paged.map((coach, idx) => (
                  <tr
                    key={coach.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-blue-50/40",
                      idx % 2 === 1 && "bg-gray-50/30",
                    )}
                    onClick={() => navigate(`/coaches/${coach.id}`)}
                  >
                    {/* ID */}
                    <td className="px-3 py-3">
                      <span
                        className="text-[#003B95] font-medium hover:underline cursor-pointer text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/coaches/${coach.id}`);
                        }}
                      >
                        {coach.id}
                      </span>
                    </td>

                    {/* Avatar */}
                    <td className="px-2 py-3">
                      <AvatarInitials
                        firstName={coach.firstName}
                        lastName={coach.lastName}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-3 py-3">
                      <span
                        className="text-sm font-medium text-[#111827] truncate block max-w-[170px]"
                        title={`${coach.firstName} ${coach.lastName}`}
                      >
                        {coach.firstName} {coach.lastName}
                      </span>
                    </td>

                    {/* Sports */}
                    <td className="px-3 py-3">
                      <ChipList items={coach.sports} max={3} />
                    </td>

                    {/* Specialities */}
                    <td className="px-3 py-3">
                      <ChipList items={coach.specialities} max={3} />
                    </td>

                    {/* Experience */}
                    <td className="px-3 py-3 text-sm text-[#111827]">
                      {coach.experience} years
                    </td>

                    {/* Rating */}
                    <td className="px-3 py-3">
                      <RatingStars
                        rating={coach.rating}
                        reviewCount={coach.reviewCount}
                      />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs border",
                          STATUS_STYLES[coach.status],
                        )}
                      >
                        {coach.status}
                      </Badge>
                    </td>

                    {/* Verification */}
                    <td className="px-3 py-3">
                      {(() => {
                        const v = VERIFICATION_STYLES[coach.verificationStatus];
                        const Icon = v.icon;
                        return (
                          <Badge
                            variant="outline"
                            className={cn("text-xs border gap-1", v.cls)}
                          >
                            {Icon && <Icon className="w-3 h-3" />}
                            {coach.verificationStatus}
                          </Badge>
                        );
                      })()}
                    </td>

                    {/* Registered */}
                    <td className="px-3 py-3 text-xs text-[#6B7280]">
                      {format(coach.registeredDate, "dd MMM yyyy")}
                    </td>

                    {/* Actions */}
                    <td
                      className="px-3 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-[#6B7280] hover:text-[#003B95]"
                        onClick={() => navigate(`/coaches/${coach.id}`)}
                        aria-label={`View coach ${coach.firstName} ${coach.lastName}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-16">
                    {debouncedSearch || activeFilters.length > 0 ? (
                      <>
                        <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-[#111827]">
                          No Coaches Found
                        </p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          No coaches match your current filters.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-[#111827]">
                          No Coaches Yet
                        </p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          No freelance coaches have been registered on the
                          platform yet.
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
        aria-label="Coaches table pagination"
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <p className="text-xs text-[#9CA3AF]">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)} of{" "}
            <strong>{filtered.length}</strong> coaches
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

// ─── Chip list with "+ N more" tooltip ──────────────────────────────────────

function ChipList({ items, max }: { items: string[]; max: number }) {
  const shown = items.slice(0, max);
  const remaining = items.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((item) => (
        <span
          key={item}
          className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded border border-gray-200"
        >
          {item}
        </span>
      ))}
      {remaining > 0 && (
        <span
          className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded border border-blue-200 cursor-help"
          title={items.slice(max).join(", ")}
        >
          +{remaining} more
        </span>
      )}
    </div>
  );
}
