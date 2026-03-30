import { useState, useMemo } from "react";
import { Tournament, TournamentStatus, SportType, LevelType } from "./types";
import { format } from "date-fns";
import {
  ChevronDown, ChevronUp, Search, Filter, Download, Eye, XCircle, Trophy, MapPin, User, Calendar,
} from "lucide-react";

interface TournamentTableProps {
  tournaments: Tournament[];
  onView: (tournament: Tournament) => void;
  onCancel: (tournament: Tournament) => void;
}

type SortKey = "name" | "sport" | "date" | "status" | "entryFee" | "totalCollected" | "city";
type SortDirection = "asc" | "desc";

const STATUS_STYLES: Record<TournamentStatus, string> = {
  Active: "bg-green-100 text-green-800",
  Full: "bg-blue-100 text-blue-800",
  Confirmed: "bg-indigo-100 text-indigo-800",
  Completed: "bg-gray-100 text-gray-800",
  Cancelled: "bg-red-100 text-red-800",
  Expired: "bg-orange-100 text-orange-800",
};

const SPORT_STYLES: Record<SportType, string> = {
  Tennis: "bg-orange-50 text-orange-700 border-orange-100",
  Padel: "bg-blue-50 text-blue-700 border-blue-100",
  Badminton: "bg-green-50 text-green-700 border-green-100",
  Pickleball: "bg-purple-50 text-purple-700 border-purple-100",
  Squash: "bg-yellow-50 text-yellow-700 border-yellow-100",
};

export function TournamentTable({ tournaments, onView, onCancel }: TournamentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<SportType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | "All">("All");
  const [levelFilter, setLevelFilter] = useState<LevelType | "All">("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "date",
    direction: "desc",
  });

  const cities = useMemo(() => {
    const set = new Set(tournaments.map((t) => t.city));
    return ["All", ...Array.from(set).sort()];
  }, [tournaments]);

  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        t.name.toLowerCase().includes(q) ||
        t.host.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.facility.name.toLowerCase().includes(q);
      const matchSport = sportFilter === "All" || t.sport === sportFilter;
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const matchLevel = levelFilter === "All" || t.level === levelFilter;
      const matchCity = cityFilter === "All" || t.city === cityFilter;
      const tDate = new Date(t.date);
      const matchFrom = !fromDate || tDate >= new Date(fromDate);
      const matchTo = !toDate || tDate <= new Date(toDate + "T23:59:59");
      return matchSearch && matchSport && matchStatus && matchLevel && matchCity && matchFrom && matchTo;
    });
  }, [tournaments, searchTerm, sportFilter, statusFilter, levelFilter, cityFilter, fromDate, toDate]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      switch (sortConfig.key) {
        case "entryFee": av = a.financials.entryFee; bv = b.financials.entryFee; break;
        case "totalCollected": av = a.financials.totalCollected; bv = b.financials.totalCollected; break;
        case "city": av = a.city; bv = b.city; break;
        default: av = (a as any)[sortConfig.key]; bv = (b as any)[sortConfig.key];
      }
      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (key: SortKey) => {
    setSortConfig((c) => ({ key, direction: c.key === key && c.direction === "asc" ? "desc" : "asc" }));
    setCurrentPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortConfig.key !== col ? null : sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 inline-block ml-1 text-blue-500" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline-block ml-1 text-blue-500" />
    );

  const canCancel = (t: Tournament) => !["Cancelled", "Completed", "Expired"].includes(t.status);

  const handleExport = () => {
    const rows = [
      ["ID", "Name", "Sport", "Level", "Host", "City", "Date", "Players", "Status", "Entry Fee", "Total Collected"],
      ...sorted.map((t) => [
        t.id, t.name, t.sport, t.level, t.host.name, t.city,
        format(new Date(t.date), "yyyy-MM-dd"),
        `${t.currentPlayers}/${t.maxPlayers}`,
        t.status, t.financials.entryFee, t.financials.totalCollected,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "tournaments.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden h-full">
      {/* ── Toolbar ── */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/60 space-y-3">
        {/* Row 1 */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search name, host, city, ID…"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 ml-auto whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        {/* Row 2 — filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {[
            { label: "Sport", value: sportFilter, onChange: (v: string) => { setSportFilter(v as any); setCurrentPage(1); }, options: ["All", "Tennis", "Padel", "Badminton", "Pickleball", "Squash"] },
            { label: "Level", value: levelFilter, onChange: (v: string) => { setLevelFilter(v as any); setCurrentPage(1); }, options: ["All", "Beginner", "Intermediate", "Advanced", "Pro", "Open"] },
            { label: "Status", value: statusFilter, onChange: (v: string) => { setStatusFilter(v as any); setCurrentPage(1); }, options: ["All", "Active", "Full", "Confirmed", "Completed", "Cancelled", "Expired"] },
            { label: "City", value: cityFilter, onChange: (v: string) => { setCityFilter(v); setCurrentPage(1); }, options: cities },
          ].map(({ label, value, onChange, options }) => (
            <select
              key={label}
              className="text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-2 pr-7 bg-white"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            >
              {options.map((o) => <option key={o} value={o}>{o === "All" ? `All ${label}s` : o}</option>)}
            </select>
          ))}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="text-xs">From</span>
            <input type="date" className="border border-gray-300 rounded-md py-1.5 px-2 text-sm focus:ring-blue-500 focus:border-blue-500" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }} />
            <span className="text-xs">To</span>
            <input type="date" className="border border-gray-300 rounded-md py-1.5 px-2 text-sm focus:ring-blue-500 focus:border-blue-500" value={toDate} onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }} />
          </div>
          {(searchTerm || sportFilter !== "All" || statusFilter !== "All" || levelFilter !== "All" || cityFilter !== "All" || fromDate || toDate) && (
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => { setSearchTerm(""); setSportFilter("All"); setStatusFilter("All"); setLevelFilter("All"); setCityFilter("All"); setFromDate(""); setToDate(""); setCurrentPage(1); }}
            >
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
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("name")}>
                Tournament <SortIcon col="name" />
              </th>
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("sport")}>
                Sport / Level <SortIcon col="sport" />
              </th>
              <th className="px-5 py-3">Host</th>
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("city")}>
                City <SortIcon col="city" />
              </th>
              <th className="px-5 py-3 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("date")}>
                Date <SortIcon col="date" />
              </th>
              <th className="px-5 py-3 text-center">Players</th>
              <th className="px-5 py-3 text-center cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("status")}>
                Status <SortIcon col="status" />
              </th>
              <th className="px-5 py-3 text-right cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("totalCollected")}>
                Collected <SortIcon col="totalCollected" />
              </th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.length > 0 ? paginated.map((t) => (
              <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-gray-900 max-w-[200px] truncate">{t.name}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{t.id}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${SPORT_STYLES[t.sport]} inline-block mb-1`}>{t.sport}</span>
                  <span className="block text-xs text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 w-fit">{t.level}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <img src={t.host.avatar} alt={t.host.name} className="w-6 h-6 rounded-full border border-gray-200 shrink-0" />
                    <span className="text-sm text-gray-900 truncate max-w-[130px]">{t.host.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm">{t.city}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-gray-800">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm">{format(new Date(t.date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="text-xs text-gray-400 pl-5">{format(new Date(t.date), "h:mm a")}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1 text-xs font-medium text-gray-700 mb-1">
                    <User className="w-3 h-3 text-gray-400" />
                    {t.currentPlayers}/{t.maxPlayers}
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-1.5 mx-auto">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (t.currentPlayers / t.maxPlayers) * 100)}%` }}
                    />
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[t.status]}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-emerald-700">
                  ${t.financials.totalCollected.toLocaleString()}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onView(t)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md border border-blue-100 hover:bg-blue-100 transition-colors"
                      title="View tournament details"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {canCancel(t) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onCancel(t); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md border border-red-100 hover:bg-red-100 transition-colors"
                        title="Force-cancel this tournament"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-gray-400">
                  <Trophy className="w-10 h-10 text-gray-200 mb-3 mx-auto" />
                  <p className="font-medium text-gray-500">No tournaments found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 shrink-0 text-sm text-gray-600">
        <span>
          Showing <strong>{sorted.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>–<strong>{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)}</strong> of <strong>{sorted.length}</strong>
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >Previous</button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
