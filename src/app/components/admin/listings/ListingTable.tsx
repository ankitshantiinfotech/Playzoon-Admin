import { useState, useMemo } from "react";
import { Listing, ListingType, ListingStatus, SportType } from "./types";
import { format } from "date-fns";
import {
  Search, Filter, Download, ChevronUp, ChevronDown,
  Eye, PauseCircle, Trash2, Star, MapPin, Calendar, BookOpen, Building2,
} from "lucide-react";
import { cn } from "../../../lib/utils";

interface ListingTableProps {
  listings: Listing[];
  onView: (l: Listing) => void;
  onSuspend: (l: Listing) => void;
  onRemove: (l: Listing) => void;
}

type SortKey = "name" | "provider" | "sport" | "city" | "status" | "rating" | "activeBookingsCount" | "createdAt";
type SortDir = "asc" | "desc";

export const STATUS_STYLES: Record<ListingStatus, string> = {
  Active:    "bg-emerald-100 text-emerald-800",
  Inactive:  "bg-gray-100 text-gray-600",
  Suspended: "bg-amber-100 text-amber-800",
  Removed:   "bg-red-100 text-red-700",
};

const SPORT_COLORS: Record<string, string> = {
  Tennis:     "bg-orange-50 text-orange-700 border-orange-100",
  Padel:      "bg-blue-50 text-blue-700 border-blue-100",
  Badminton:  "bg-green-50 text-green-700 border-green-100",
  Pickleball: "bg-purple-50 text-purple-700 border-purple-100",
  Squash:     "bg-yellow-50 text-yellow-700 border-yellow-100",
  Football:   "bg-lime-50 text-lime-700 border-lime-100",
  Basketball: "bg-amber-50 text-amber-700 border-amber-100",
  Swimming:   "bg-sky-50 text-sky-700 border-sky-100",
  Yoga:       "bg-pink-50 text-pink-700 border-pink-100",
  Cricket:    "bg-teal-50 text-teal-700 border-teal-100",
  Boxing:     "bg-rose-50 text-rose-700 border-rose-100",
};

export function ListingTable({ listings, onView, onSuspend, onRemove }: ListingTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "All">("All");
  const [sportFilter, setSportFilter] = useState<SportType | "All">("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "createdAt", dir: "desc" });

  const cities = useMemo(() => ["All", ...Array.from(new Set(listings.map((l) => l.city))).sort()], [listings]);
  const sports = useMemo(() => ["All", ...Array.from(new Set(listings.map((l) => l.sport))).sort()], [listings]);

  const filtered = useMemo(() => listings.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.name.toLowerCase().includes(q) || l.provider.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)) &&
      (statusFilter === "All" || l.status === statusFilter) &&
      (sportFilter === "All" || l.sport === sportFilter) &&
      (cityFilter === "All" || l.city === cityFilter)
    );
  }), [listings, search, statusFilter, sportFilter, cityFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av: any, bv: any;
    switch (sort.key) {
      case "provider": av = a.provider.name; bv = b.provider.name; break;
      default: av = (a as any)[sort.key]; bv = (b as any)[sort.key];
    }
    if (av < bv) return sort.dir === "asc" ? -1 : 1;
    if (av > bv) return sort.dir === "asc" ? 1 : -1;
    return 0;
  }), [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (key: SortKey) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sort.key !== col ? null : sort.dir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 inline ml-1 text-blue-500" />
      : <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-blue-500" />;

  const canSuspend = (l: Listing) => l.status === "Active" || l.status === "Inactive";
  const canUnsuspend = (l: Listing) => l.status === "Suspended";
  const canRemove = (l: Listing) => l.status !== "Removed";

  const handleExport = () => {
    const rows = [
      ["ID", "Type", "Name", "Provider", "Sport", "City", "Status", "Active Bookings", "Rating", "Created"],
      ...sorted.map((l) => [l.id, l.type, l.name, l.provider.name, l.sport, l.city, l.status, l.activeBookingsCount, l.rating, format(new Date(l.createdAt), "yyyy-MM-dd")]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "listings.csv";
    a.click();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden h-full">
      {/* ── Toolbar ── */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/60 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search name, provider, city, ID…"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 ml-auto whitespace-nowrap">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {[
            { label: "Status",  value: statusFilter, onChange: (v: string) => { setStatusFilter(v as any); setPage(1); }, options: ["All", "Active", "Inactive", "Suspended", "Removed"] },
            { label: "Sport",   value: sportFilter,  onChange: (v: string) => { setSportFilter(v as any); setPage(1); },  options: sports },
            { label: "City",    value: cityFilter,   onChange: (v: string) => { setCityFilter(v); setPage(1); },          options: cities },
          ].map(({ label, value, onChange, options }) => (
            <select key={label} value={value} onChange={(e) => onChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-md py-1.5 pl-2 pr-7 bg-white focus:ring-blue-500 focus:border-blue-500">
              {options.map((o) => <option key={o} value={o}>{o === "All" ? `All ${label}s` : o}</option>)}
            </select>
          ))}
          {(search || statusFilter !== "All" || sportFilter !== "All" || cityFilter !== "All") && (
            <button className="text-xs text-blue-600 hover:underline"
              onClick={() => { setSearch(""); setStatusFilter("All"); setSportFilter("All"); setCityFilter("All"); setPage(1); }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("provider")}>Provider <SortIcon col="provider" /></th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("sport")}>Sport <SortIcon col="sport" /></th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("city")}>City <SortIcon col="city" /></th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 select-none text-center" onClick={() => handleSort("status")}>Status <SortIcon col="status" /></th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 select-none text-center" onClick={() => handleSort("activeBookingsCount")}>Bookings <SortIcon col="activeBookingsCount" /></th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("rating")}>Rating <SortIcon col="rating" /></th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.length > 0 ? paginated.map((l) => (
              <tr key={l.id} className={cn("transition-colors", l.status === "Removed" ? "bg-red-50/30 opacity-75" : "hover:bg-blue-50/30")}>
                {/* Listing cell with thumbnail */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                      <img src={l.thumbnailUrl} alt={l.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate max-w-[180px]">{l.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide", l.type === "Training" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700")}>
                          {l.type === "Training" ? <span className="flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" />{l.type}</span> : <span className="flex items-center gap-1"><Building2 className="w-2.5 h-2.5" />{l.type}</span>}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">{l.id}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Provider */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img src={l.provider.avatar} alt={l.provider.name} className="w-6 h-6 rounded-full border border-gray-200 shrink-0" />
                    <span className="text-sm text-gray-800 truncate max-w-[130px]">{l.provider.name}</span>
                  </div>
                </td>

                {/* Sport */}
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 text-xs font-medium rounded border inline-block", SPORT_COLORS[l.sport] ?? "bg-gray-100 text-gray-700 border-gray-200")}>
                    {l.sport}
                  </span>
                  {l.level && <div className="text-xs text-gray-400 mt-0.5">{l.level}</div>}
                  {l.facilityType && <div className="text-xs text-gray-400 mt-0.5">{l.facilityType}</div>}
                </td>

                {/* City */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm">{l.city}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", STATUS_STYLES[l.status])}>
                    {l.status}
                  </span>
                </td>

                {/* Active bookings */}
                <td className="px-4 py-3 text-center">
                  {l.activeBookingsCount > 0 ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {l.activeBookingsCount}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>

                {/* Rating */}
                <td className="px-4 py-3">
                  {l.rating > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">{l.rating}</span>
                      <span className="text-xs text-gray-400">({l.reviewCount})</span>
                    </div>
                  ) : <span className="text-gray-400 text-xs">No reviews</span>}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button onClick={() => onView(l)}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>

                    {(canSuspend(l) || canUnsuspend(l)) && (
                      <button onClick={() => onSuspend(l)}
                        className={cn("flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap",
                          canUnsuspend(l) ? "text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100" : "text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100")}>
                        <PauseCircle className="w-3.5 h-3.5" />
                        {canUnsuspend(l) ? "Unsuspend" : "Suspend"}
                      </button>
                    )}

                    {canRemove(l) && (
                      <button onClick={() => onRemove(l)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md border border-red-100 hover:bg-red-100 transition-colors whitespace-nowrap">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center text-gray-400">
                    <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="font-medium text-gray-500">No listings found</p>
                    <p className="text-sm mt-1">Try adjusting your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 shrink-0 text-sm text-gray-600">
        <span>
          Showing <strong>{sorted.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}</strong>–<strong>{Math.min(page * PER_PAGE, sorted.length)}</strong> of <strong>{sorted.length}</strong>
        </span>
        <div className="flex gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
      </div>
    </div>
  );
}
