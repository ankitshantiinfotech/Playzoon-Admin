import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Activity,
  Users,
  TrendingUp,
  Clock,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
  X,
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

// ─── Types ──────────────────────────────────────────────────

interface RefreshEntry {
  id: string;
  providerId: string;
  providerName: string;
  providerType: "Facility" | "Training" | "Freelance Coach";
  entityName: string;
  entityType: "Facility" | "Training Program" | "Coach Profile";
  listingType: "promoted" | "standard";
  dailyRefreshCount: number;
  lastRefreshed: Date;
  date: Date;
}

type SortField =
  | "providerName"
  | "entityName"
  | "listingType"
  | "dailyRefreshCount"
  | "lastRefreshed";
type SortDir = "asc" | "desc";

// ─── Abuse Threshold ────────────────────────────────────────

const ABUSE_THRESHOLD = 15;

// ─── Mock Data ──────────────────────────────────────────────

const today = new Date(2026, 1, 18); // Feb 18, 2026

function hoursAgo(h: number) {
  return new Date(today.getTime() - h * 60 * 60 * 1000);
}

const MOCK_DATA: RefreshEntry[] = [
  {
    id: "r01",
    providerId: "p1",
    providerName: "Champions Sports Club",
    providerType: "Facility",
    entityName: "Indoor Basketball Court A",
    entityType: "Facility",
    listingType: "promoted",
    dailyRefreshCount: 22,
    lastRefreshed: hoursAgo(0.5),
    date: today,
  },
  {
    id: "r02",
    providerId: "p1",
    providerName: "Champions Sports Club",
    providerType: "Facility",
    entityName: "Indoor Basketball Court B",
    entityType: "Facility",
    listingType: "promoted",
    dailyRefreshCount: 18,
    lastRefreshed: hoursAgo(1),
    date: today,
  },
  {
    id: "r03",
    providerId: "p1",
    providerName: "Champions Sports Club",
    providerType: "Facility",
    entityName: "Outdoor Football Pitch",
    entityType: "Facility",
    listingType: "standard",
    dailyRefreshCount: 4,
    lastRefreshed: hoursAgo(3),
    date: today,
  },
  {
    id: "r04",
    providerId: "p1",
    providerName: "Champions Sports Club",
    providerType: "Facility",
    entityName: "Swimming Pool",
    entityType: "Facility",
    listingType: "standard",
    dailyRefreshCount: 2,
    lastRefreshed: hoursAgo(5),
    date: today,
  },
  {
    id: "r05",
    providerId: "p2",
    providerName: "FitZone Academy",
    providerType: "Training",
    entityName: "CrossFit Fundamentals",
    entityType: "Training Program",
    listingType: "promoted",
    dailyRefreshCount: 12,
    lastRefreshed: hoursAgo(0.3),
    date: today,
  },
  {
    id: "r06",
    providerId: "p2",
    providerName: "FitZone Academy",
    providerType: "Training",
    entityName: "Yoga for Beginners",
    entityType: "Training Program",
    listingType: "standard",
    dailyRefreshCount: 3,
    lastRefreshed: hoursAgo(4),
    date: today,
  },
  {
    id: "r07",
    providerId: "p2",
    providerName: "FitZone Academy",
    providerType: "Training",
    entityName: "HIIT Bootcamp",
    entityType: "Training Program",
    listingType: "promoted",
    dailyRefreshCount: 8,
    lastRefreshed: hoursAgo(1.5),
    date: today,
  },
  {
    id: "r08",
    providerId: "p3",
    providerName: "Gulf Tennis Center",
    providerType: "Facility",
    entityName: "Clay Court 1",
    entityType: "Facility",
    listingType: "promoted",
    dailyRefreshCount: 25,
    lastRefreshed: hoursAgo(0.1),
    date: today,
  },
  {
    id: "r09",
    providerId: "p3",
    providerName: "Gulf Tennis Center",
    providerType: "Facility",
    entityName: "Clay Court 2",
    entityType: "Facility",
    listingType: "standard",
    dailyRefreshCount: 19,
    lastRefreshed: hoursAgo(0.2),
    date: today,
  },
  {
    id: "r10",
    providerId: "p3",
    providerName: "Gulf Tennis Center",
    providerType: "Facility",
    entityName: "Hard Court 1",
    entityType: "Facility",
    listingType: "standard",
    dailyRefreshCount: 16,
    lastRefreshed: hoursAgo(0.4),
    date: today,
  },
  {
    id: "r11",
    providerId: "p4",
    providerName: "Coach Ahmed Al-Farsi",
    providerType: "Freelance Coach",
    entityName: "Personal Training — Football",
    entityType: "Coach Profile",
    listingType: "standard",
    dailyRefreshCount: 6,
    lastRefreshed: hoursAgo(2),
    date: today,
  },
  {
    id: "r12",
    providerId: "p4",
    providerName: "Coach Ahmed Al-Farsi",
    providerType: "Freelance Coach",
    entityName: "Group Training — Fitness",
    entityType: "Coach Profile",
    listingType: "promoted",
    dailyRefreshCount: 9,
    lastRefreshed: hoursAgo(1),
    date: today,
  },
  {
    id: "r13",
    providerId: "p5",
    providerName: "AquaSplash Waterpark",
    providerType: "Facility",
    entityName: "Main Pool — Adult",
    entityType: "Facility",
    listingType: "promoted",
    dailyRefreshCount: 5,
    lastRefreshed: hoursAgo(2.5),
    date: today,
  },
  {
    id: "r14",
    providerId: "p5",
    providerName: "AquaSplash Waterpark",
    providerType: "Facility",
    entityName: "Kids Pool Zone",
    entityType: "Facility",
    listingType: "standard",
    dailyRefreshCount: 3,
    lastRefreshed: hoursAgo(6),
    date: today,
  },
  {
    id: "r15",
    providerId: "p5",
    providerName: "AquaSplash Waterpark",
    providerType: "Facility",
    entityName: "Wave Pool",
    entityType: "Facility",
    listingType: "promoted",
    dailyRefreshCount: 7,
    lastRefreshed: hoursAgo(1.2),
    date: today,
  },
  {
    id: "r16",
    providerId: "p6",
    providerName: "Pro Kick Football Academy",
    providerType: "Training",
    entityName: "Junior Development Program",
    entityType: "Training Program",
    listingType: "standard",
    dailyRefreshCount: 2,
    lastRefreshed: hoursAgo(8),
    date: today,
  },
  {
    id: "r17",
    providerId: "p6",
    providerName: "Pro Kick Football Academy",
    providerType: "Training",
    entityName: "Elite Striker Camp",
    entityType: "Training Program",
    listingType: "promoted",
    dailyRefreshCount: 11,
    lastRefreshed: hoursAgo(0.8),
    date: today,
  },
  {
    id: "r18",
    providerId: "p6",
    providerName: "Pro Kick Football Academy",
    providerType: "Training",
    entityName: "Goalkeeper Masterclass",
    entityType: "Training Program",
    listingType: "standard",
    dailyRefreshCount: 1,
    lastRefreshed: hoursAgo(12),
    date: today,
  },
  {
    id: "r19",
    providerId: "p7",
    providerName: "Coach Sara Khalil",
    providerType: "Freelance Coach",
    entityName: "Swimming Coaching — Advanced",
    entityType: "Coach Profile",
    listingType: "promoted",
    dailyRefreshCount: 14,
    lastRefreshed: hoursAgo(0.6),
    date: today,
  },
  {
    id: "r20",
    providerId: "p7",
    providerName: "Coach Sara Khalil",
    providerType: "Freelance Coach",
    entityName: "Swimming Coaching — Kids",
    entityType: "Coach Profile",
    listingType: "standard",
    dailyRefreshCount: 4,
    lastRefreshed: hoursAgo(3.5),
    date: today,
  },
  {
    id: "r21",
    providerId: "p8",
    providerName: "Desert Padel Club",
    providerType: "Facility",
    entityName: "Padel Court 1",
    entityType: "Facility",
    listingType: "promoted",
    dailyRefreshCount: 10,
    lastRefreshed: hoursAgo(0.9),
    date: today,
  },
  {
    id: "r22",
    providerId: "p8",
    providerName: "Desert Padel Club",
    providerType: "Facility",
    entityName: "Padel Court 2",
    entityType: "Facility",
    listingType: "standard",
    dailyRefreshCount: 7,
    lastRefreshed: hoursAgo(2),
    date: today,
  },
  {
    id: "r23",
    providerId: "p8",
    providerName: "Desert Padel Club",
    providerType: "Facility",
    entityName: "VIP Padel Suite",
    entityType: "Facility",
    listingType: "promoted",
    dailyRefreshCount: 21,
    lastRefreshed: hoursAgo(0.15),
    date: today,
  },
];

// ─── Stat Card ──────────────────────────────────────────────

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

// ─── Main Component ─────────────────────────────────────────

export function RefreshLogPage() {
  // ─── Filter state ──────────────────────────────────────
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [listingFilter, setListingFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Sort state ────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("dailyRefreshCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ─── Group state ───────────────────────────────────────
  const [groupByProvider, setGroupByProvider] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  // ─── Derived: unique providers ─────────────────────────
  const uniqueProviders = useMemo(() => {
    const map = new Map<string, string>();
    MOCK_DATA.forEach((e) => map.set(e.providerId, e.providerName));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, []);

  // ─── Filtering ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return MOCK_DATA.filter((entry) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !entry.providerName.toLowerCase().includes(q) &&
          !entry.entityName.toLowerCase().includes(q)
        )
          return false;
      }
      if (providerFilter !== "all" && entry.providerId !== providerFilter)
        return false;
      if (typeFilter !== "all" && entry.entityType !== typeFilter) return false;
      if (listingFilter !== "all" && entry.listingType !== listingFilter)
        return false;
      if (dateFilter) {
        const entryDate = format(entry.date, "yyyy-MM-dd");
        const filterDate = format(dateFilter, "yyyy-MM-dd");
        if (entryDate !== filterDate) return false;
      }
      return true;
    });
  }, [search, providerFilter, typeFilter, listingFilter, dateFilter]);

  // ─── Sorting ───────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "providerName":
          cmp = a.providerName.localeCompare(b.providerName);
          break;
        case "entityName":
          cmp = a.entityName.localeCompare(b.entityName);
          break;
        case "listingType":
          cmp = a.listingType.localeCompare(b.listingType);
          break;
        case "dailyRefreshCount":
          cmp = a.dailyRefreshCount - b.dailyRefreshCount;
          break;
        case "lastRefreshed":
          cmp = a.lastRefreshed.getTime() - b.lastRefreshed.getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  // ─── Grouping ──────────────────────────────────────────
  const grouped = useMemo(() => {
    if (!groupByProvider) return null;
    const map = new Map<
      string,
      { providerName: string; providerType: string; entries: RefreshEntry[] }
    >();
    sorted.forEach((e) => {
      if (!map.has(e.providerId)) {
        map.set(e.providerId, {
          providerName: e.providerName,
          providerType: e.providerType,
          entries: [],
        });
      }
      map.get(e.providerId)!.entries.push(e);
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[1].providerName.localeCompare(b[1].providerName),
    );
  }, [sorted, groupByProvider]);

  // ─── Stats ─────────────────────────────────────────────
  const totalRefreshesToday = MOCK_DATA.reduce(
    (s, e) => s + e.dailyRefreshCount,
    0,
  );
  const activeProviders = new Set(MOCK_DATA.map((e) => e.providerId)).size;
  const flaggedEntries = MOCK_DATA.filter(
    (e) => e.dailyRefreshCount >= ABUSE_THRESHOLD,
  ).length;
  const avgRefreshes =
    MOCK_DATA.length > 0
      ? Math.round(totalRefreshesToday / MOCK_DATA.length)
      : 0;

  const activeFiltersCount = [
    providerFilter !== "all",
    typeFilter !== "all",
    listingFilter !== "all",
    !!dateFilter,
  ].filter(Boolean).length;

  // ─── Sort handler ──────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "dailyRefreshCount" ? "desc" : "asc");
    }
  };

  const toggleGroup = (providerId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setProviderFilter("all");
    setTypeFilter("all");
    setListingFilter("all");
    setDateFilter(undefined);
  };

  // ─── Sort icon ─────────────────────────────────────────
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-[#003B95]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#003B95]" />
    );
  };

  // ─── Render a table row ────────────────────────────────
  const renderRow = (entry: RefreshEntry, showProvider = true) => {
    const isAbuse = entry.dailyRefreshCount >= ABUSE_THRESHOLD;
    return (
      <TableRow key={entry.id} className={cn(isAbuse && "bg-red-50/50")}>
        {showProvider && (
          <TableCell className="px-4">
            <div>
              <p className="text-sm text-[#111827]">{entry.providerName}</p>
              <p className="text-[11px] text-[#9CA3AF]">{entry.providerType}</p>
            </div>
          </TableCell>
        )}
        <TableCell className="px-4">
          <p className="text-sm text-[#374151]">{entry.entityName}</p>
          <p className="text-[11px] text-[#9CA3AF]">{entry.entityType}</p>
        </TableCell>
        <TableCell className="px-4">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] capitalize",
              entry.listingType === "promoted"
                ? "bg-blue-50 text-[#003B95] border-blue-200"
                : "bg-gray-100 text-[#6B7280] border-gray-200",
            )}
          >
            {entry.listingType === "promoted" && (
              <TrendingUp className="h-3 w-3" />
            )}
            {entry.listingType}
          </Badge>
        </TableCell>
        <TableCell className="px-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm tabular-nums",
                isAbuse ? "text-red-600" : "text-[#111827]",
              )}
            >
              {entry.dailyRefreshCount}
            </span>
            {isAbuse && (
              <span className="flex items-center gap-1 text-[10px] text-red-500 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">
                <AlertTriangle className="h-3 w-3" />
                High
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="px-4">
          <div>
            <p className="text-sm text-[#374151]">
              {format(entry.lastRefreshed, "hh:mm a")}
            </p>
            <p className="text-[11px] text-[#9CA3AF]">
              {formatDistanceToNow(entry.lastRefreshed, { addSuffix: true })}
            </p>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Refresh Log
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Monitor entity refresh activity across all providers. Read-only.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          <Clock className="h-3.5 w-3.5" />
          Data as of {format(today, "MMM d, yyyy — hh:mm a")}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Refreshes Today"
          value={totalRefreshesToday.toLocaleString()}
          sub={`Across ${MOCK_DATA.length} entities`}
          icon={RefreshCw}
          color="bg-blue-50 text-[#003B95]"
        />
        <StatCard
          label="Active Providers"
          value={activeProviders}
          sub="With refresh activity"
          icon={Users}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Avg Refreshes / Entity"
          value={avgRefreshes}
          sub="Today's average"
          icon={Activity}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Flagged (High Activity)"
          value={flaggedEntries}
          sub={`Threshold: ${ABUSE_THRESHOLD}+ refreshes`}
          icon={AlertTriangle}
          color={
            flaggedEntries > 0
              ? "bg-red-50 text-red-500"
              : "bg-gray-50 text-gray-400"
          }
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search provider or entity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Toggle filters */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("gap-2 shrink-0", showFilters && "bg-gray-50")}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="bg-[#003B95] text-white text-[10px] h-5 min-w-[20px]">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Group toggle */}
          <Button
            variant={groupByProvider ? "default" : "outline"}
            onClick={() => {
              setGroupByProvider(!groupByProvider);
              setCollapsedGroups(new Set());
            }}
            className={cn(
              "gap-2 shrink-0",
              groupByProvider && "bg-[#003B95] hover:bg-[#002a6b]",
            )}
          >
            {groupByProvider ? (
              <LayoutGrid className="h-4 w-4" />
            ) : (
              <LayoutList className="h-4 w-4" />
            )}
            Group by Provider
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t">
            {/* Provider */}
            <div className="space-y-1 min-w-[180px]">
              <label className="text-[11px] text-[#6B7280]">Provider</label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {uniqueProviders.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity Type */}
            <div className="space-y-1 min-w-[160px]">
              <label className="text-[11px] text-[#6B7280]">Entity Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Facility">Facility</SelectItem>
                  <SelectItem value="Training Program">
                    Training Program
                  </SelectItem>
                  <SelectItem value="Coach Profile">Coach Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listing Type */}
            <div className="space-y-1 min-w-[140px]">
              <label className="text-[11px] text-[#6B7280]">Listing</label>
              <Select value={listingFilter} onValueChange={setListingFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All listings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Listings</SelectItem>
                  <SelectItem value="promoted">Promoted</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-[11px] text-[#6B7280]">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 gap-2 text-sm min-w-[140px] justify-start",
                      !dateFilter && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFilter
                      ? format(dateFilter, "MMM d, yyyy")
                      : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 text-xs text-red-500 hover:text-red-700 h-10"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          Showing {sorted.length} of {MOCK_DATA.length} entries
          {activeFiltersCount > 0 && " (filtered)"}
        </p>
        {flaggedEntries > 0 && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {flaggedEntries} entities flagged for high activity (
            {ABUSE_THRESHOLD}+ refreshes)
          </p>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              {!groupByProvider && (
                <TableHead className="px-4">
                  <button
                    onClick={() => handleSort("providerName")}
                    className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                  >
                    Provider
                    <SortIcon field="providerName" />
                  </button>
                </TableHead>
              )}
              <TableHead className="px-4">
                <button
                  onClick={() => handleSort("entityName")}
                  className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                >
                  Entity
                  <SortIcon field="entityName" />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button
                  onClick={() => handleSort("listingType")}
                  className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                >
                  Type
                  <SortIcon field="listingType" />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button
                  onClick={() => handleSort("dailyRefreshCount")}
                  className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                >
                  Daily Refreshes
                  <SortIcon field="dailyRefreshCount" />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button
                  onClick={() => handleSort("lastRefreshed")}
                  className="flex items-center gap-1.5 text-xs hover:text-[#003B95] transition-colors"
                >
                  Last Refreshed
                  <SortIcon field="lastRefreshed" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* ─── Grouped View ──────────────────────────── */}
            {groupByProvider && grouped ? (
              grouped.length > 0 ? (
                grouped.map(([providerId, group]) => {
                  const isCollapsed = collapsedGroups.has(providerId);
                  const groupTotal = group.entries.reduce(
                    (s, e) => s + e.dailyRefreshCount,
                    0,
                  );
                  const groupFlagged = group.entries.filter(
                    (e) => e.dailyRefreshCount >= ABUSE_THRESHOLD,
                  ).length;

                  return (
                    <GroupBlock key={providerId}>
                      {/* Group header row */}
                      <TableRow
                        className="bg-gray-50/60 hover:bg-gray-100/60 cursor-pointer"
                        onClick={() => toggleGroup(providerId)}
                      >
                        <TableCell colSpan={4} className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                            <div className="w-8 h-8 rounded-lg bg-[#003B95]/10 flex items-center justify-center text-[#003B95] text-xs shrink-0">
                              {group.providerName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm text-[#111827]">
                                {group.providerName}
                              </p>
                              <p className="text-[11px] text-[#9CA3AF]">
                                {group.providerType} &middot;{" "}
                                {group.entries.length} entities &middot;{" "}
                                {groupTotal} total refreshes
                              </p>
                            </div>
                            {groupFlagged > 0 && (
                              <Badge className="bg-red-50 text-red-500 border-red-200 text-[10px] ml-2">
                                <AlertTriangle className="h-3 w-3" />
                                {groupFlagged} flagged
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span className="text-xs text-[#9CA3AF]">
                            {group.entries.length} entities
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* Group entries */}
                      {!isCollapsed &&
                        group.entries.map((entry) => renderRow(entry, false))}
                    </GroupBlock>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <NoResults />
                  </TableCell>
                </TableRow>
              )
            ) : sorted.length > 0 ? (
              /* ─── Flat View ──────────────────────────────── */
              sorted.map((entry) => renderRow(entry, true))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <NoResults />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#9CA3AF] px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200" />
          High activity ({ABUSE_THRESHOLD}+ daily refreshes)
        </span>
        <span className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="text-[9px] bg-blue-50 text-[#003B95] border-blue-200 h-4 px-1"
          >
            promoted
          </Badge>
          Promoted listing
        </span>
        <span className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="text-[9px] bg-gray-100 text-[#6B7280] border-gray-200 h-4 px-1"
          >
            standard
          </Badge>
          Standard listing
        </span>
      </div>
    </div>
  );
}

// ─── Tiny helpers ───────────────────────────────────────────

function GroupBlock({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function NoResults() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Search className="h-8 w-8 text-gray-200" />
      <p className="text-sm text-[#9CA3AF]">No matching refresh entries</p>
      <p className="text-xs text-[#D1D5DB]">Try adjusting your filters</p>
    </div>
  );
}
