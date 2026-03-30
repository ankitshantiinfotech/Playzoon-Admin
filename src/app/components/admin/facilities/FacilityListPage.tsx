// ─── SCR-ADM-025: Facility List (Admin View) ─────────────────────
// Read-only list of all facilities. Sortable, filterable DataTable.
// No editing, no status toggles. Row click navigates to detail.

import { useState, useMemo } from "react";
import {
  Search, Download, ChevronDown, ChevronUp, Eye,
  ChevronLeft, ChevronRight, Star, X, ArrowUpDown,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import {
  Facility, FacilityStatus, PromotionStatus, SPORTS_LIST, CITIES_LIST,
} from "./types";
import { MOCK_FACILITIES } from "./mockData";

// ─── Sort Types ──────────────────────────────────────────────

type SortField =
  | "id" | "name" | "providerName" | "type"
  | "location" | "status" | "promotionStatus" | "createdAt";
type SortDir = "asc" | "desc";

// ─── Badges ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: FacilityStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
      status === "Active"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-gray-100 text-gray-500 border-gray-200"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5",
        status === "Active" ? "bg-emerald-500" : "bg-gray-400")} />
      {status}
    </span>
  );
}

function PromotionBadge({ status }: { status: PromotionStatus }) {
  if (status === "Promoted")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Star className="w-2.5 h-2.5" />Promoted
      </span>
    );
  return <span className="text-[11px] text-gray-400">Standard</span>;
}

// ─── Sort header cell ────────────────────────────────────────

function SortTh({
  label, field, sort, onSort, className: extraCls,
}: {
  label: string;
  field: SortField;
  sort: { field: SortField; dir: SortDir };
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const active = sort.field === field;
  return (
    <th
      className={cn("px-3 py-3 text-left cursor-pointer select-none group", extraCls)}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}
        {active
          ? sort.dir === "asc"
            ? <ChevronUp className="w-3 h-3 text-[#003B95]" />
            : <ChevronDown className="w-3 h-3 text-[#003B95]" />
          : <ArrowUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />}
      </div>
    </th>
  );
}

// ─── Filter chip ─────────────────────────────────────────────

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 text-xs bg-[#003B95]/10 text-[#003B95] px-2 py-1 rounded-lg font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
    </span>
  );
}

// ─── Export Dropdown ─────────────────────────────────────────

function ExportDropdown({ filtered, disabled }: { filtered: Facility[]; disabled: boolean }) {
  const [open, setOpen] = useState(false);

  const handleExport = (fmt: string) => {
    setOpen(false);
    const header = [
      "Facility ID", "Name", "Provider", "Type", "Sports",
      "Location", "Status", "Promotion", "Created Date",
    ].join(",");
    const rows = filtered.map(f => [
      f.id,
      `"${f.name}"`,
      `"${f.provider.name}"`,
      f.facilityType,
      `"${f.sports.map(s => s.sport).join(", ")}"`,
      f.city,
      f.status,
      f.promotionStatus,
      f.createdAt.split("T")[0],
    ].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `facilities_export_${new Date().toISOString().split("T")[0]}.${fmt === "CSV" ? "csv" : fmt.toLowerCase()}`;
    a.click();
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-label="Export facility data"
        className={cn(
          "flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium shadow-sm shrink-0",
          disabled
            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        )}
      >
        <Download className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
            {["CSV", "XLS", "PDF", "TXT", "SQL"].map(fmt => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {fmt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface Props {
  onViewDetail: (id: string) => void;
}

export function FacilityListPage({ onViewDetail }: Props) {
  // ── Filter state ──
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("All");
  const [sport, setSport]         = useState("All");
  const [location, setLocation]   = useState("All");
  const [provider, setProvider]   = useState("All");
  const [promotion, setPromotion] = useState("All");

  // ── Table state ──
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(20);
  const [sort, setSort]           = useState<{ field: SortField; dir: SortDir }>({
    field: "createdAt", dir: "desc",
  });

  // Derived filter options
  const providerList = useMemo(
    () => [...new Set(MOCK_FACILITIES.map(f => f.provider.name))].sort(),
    [],
  );
  const locationList = useMemo(
    () => [...new Set(MOCK_FACILITIES.map(f => f.city))].sort(),
    [],
  );

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  // ── Filter & sort ──
  const filtered = useMemo(() => {
    let r = [...MOCK_FACILITIES];

    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      r = r.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.provider.name.toLowerCase().includes(q) ||
        f.sports.some(s => s.sport.toLowerCase().includes(q)) ||
        f.city.toLowerCase().includes(q)
      );
    }
    if (status    !== "All") r = r.filter(f => f.status          === status);
    if (sport     !== "All") r = r.filter(f => f.sports.some(s => s.sport === sport));
    if (location  !== "All") r = r.filter(f => f.city            === location);
    if (provider  !== "All") r = r.filter(f => f.provider.name   === provider);
    if (promotion !== "All") r = r.filter(f => f.promotionStatus === promotion);

    r.sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case "id":              cmp = a.id.localeCompare(b.id); break;
        case "name":            cmp = a.name.localeCompare(b.name); break;
        case "providerName":    cmp = a.provider.name.localeCompare(b.provider.name); break;
        case "type":            cmp = a.facilityType.localeCompare(b.facilityType); break;
        case "location":        cmp = a.city.localeCompare(b.city); break;
        case "status":          cmp = a.status.localeCompare(b.status); break;
        case "promotionStatus": cmp = a.promotionStatus.localeCompare(b.promotionStatus); break;
        case "createdAt":       cmp = a.createdAt.localeCompare(b.createdAt); break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return r;
  }, [search, status, sport, location, provider, promotion, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Active filters
  const activeFilters = [
    status    !== "All" && { label: `Status: ${status}`,       clear: () => setStatus("All") },
    sport     !== "All" && { label: `Sport: ${sport}`,         clear: () => setSport("All") },
    location  !== "All" && { label: `Location: ${location}`,   clear: () => setLocation("All") },
    provider  !== "All" && { label: `Provider: ${provider}`,   clear: () => setProvider("All") },
    promotion !== "All" && { label: `Promotion: ${promotion}`, clear: () => setPromotion("All") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => {
    setStatus("All"); setSport("All"); setLocation("All");
    setProvider("All"); setPromotion("All"); setSearch(""); setPage(1);
  };

  // ── Sports display helper ──
  const sportsDisplay = (sports: Facility["sports"]) => {
    const names = sports.map(s => s.sport);
    if (names.length <= 3) return names.join(", ");
    return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
  };
  const sportsTooltip = (sports: Facility["sports"]) =>
    sports.map(s => s.sport).join(", ");

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen" role="main" aria-label="Facility Management">

      {/* ── Breadcrumb + Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span className="hover:text-[#003B95] cursor-pointer">Dashboard</span>
            <span>&rsaquo;</span>
            <span className="text-gray-600 font-medium">Facilities</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#003B95]" />
            Facility Management
          </h1>
        </div>
        <ExportDropdown filtered={filtered} disabled={filtered.length === 0} />
      </div>

      {/* ── Toolbar: Search + Filters ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by facility name, provider, sport, location..."
            aria-label="Search facilities by name, provider, sport, or location"
            className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003B95]/20 focus:border-[#003B95]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-5 gap-2">
          {([
            { label: "Status",    value: status,    set: setStatus,    opts: ["All", "Active", "Inactive"],    ariaLabel: "Filter by facility status" },
            { label: "Sport",     value: sport,     set: setSport,     opts: ["All", ...SPORTS_LIST],           ariaLabel: "Filter by sport" },
            { label: "Location",  value: location,  set: setLocation,  opts: ["All", ...locationList],          ariaLabel: "Filter by location" },
            { label: "Provider",  value: provider,  set: setProvider,  opts: ["All", ...providerList],          ariaLabel: "Filter by provider" },
            { label: "Promotion", value: promotion, set: setPromotion, opts: ["All", "Promoted", "Standard"],   ariaLabel: "Filter by promotion status" },
          ] as const).map(f => (
            <div key={f.label}>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{f.label}</label>
              <select
                value={f.value}
                onChange={e => { f.set(e.target.value); setPage(1); }}
                aria-label={f.ariaLabel}
                className="w-full text-sm border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-7 bg-white focus:outline-none focus:ring-2 focus:ring-[#003B95]/20 focus:border-[#003B95]"
              >
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {activeFilters.map(f => (
              <FilterTag key={f.label} label={f.label} onRemove={f.clear} />
            ))}
            <button
              onClick={clearAll}
              aria-label="Clear all active filters"
              className="text-xs text-red-500 hover:underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table header info */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
            &ndash;{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} facilities
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Page size:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-xs border border-gray-300 rounded-lg py-1 pl-2 pr-6 bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto" role="table" aria-label="Facilities table">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <SortTh label="ID"        field="id"              sort={sort} onSort={handleSort} className="w-[100px]" />
                <SortTh label="Name"      field="name"            sort={sort} onSort={handleSort} className="w-[200px]" />
                <SortTh label="Provider"  field="providerName"    sort={sort} onSort={handleSort} className="w-[160px]" />
                <SortTh label="Type"      field="type"            sort={sort} onSort={handleSort} className="w-[120px]" />
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[150px]">Sports</th>
                <SortTh label="Location"  field="location"        sort={sort} onSort={handleSort} className="w-[150px]" />
                <SortTh label="Status"    field="status"          sort={sort} onSort={handleSort} className="w-[100px]" />
                <SortTh label="Promotion" field="promotionStatus" sort={sort} onSort={handleSort} className="w-[110px]" />
                <SortTh label="Created"   field="createdAt"       sort={sort} onSort={handleSort} className="w-[120px]" />
                <th className="px-3 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[60px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">
                      {search || activeFilters.length > 0
                        ? "No Facilities Found"
                        : "No Facilities Yet"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search || activeFilters.length > 0
                        ? "No facilities match your current filters."
                        : "No facilities have been registered on the platform yet."}
                    </p>
                    {activeFilters.length > 0 && (
                      <button onClick={clearAll} className="text-xs text-[#003B95] hover:underline mt-2">
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : paged.map((f, idx) => (
                <tr
                  key={f.id}
                  onClick={() => onViewDetail(f.id)}
                  className={cn(
                    "hover:bg-blue-50/40 transition-colors cursor-pointer",
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  {/* ID */}
                  <td className="px-3 py-3">
                    <span className="text-xs font-mono text-[#003B95] hover:underline">{f.id}</span>
                  </td>
                  {/* Name */}
                  <td className="px-3 py-3 max-w-[200px]">
                    <p className="text-sm font-semibold text-gray-900 leading-snug truncate" title={f.name}>
                      {f.name}
                    </p>
                  </td>
                  {/* Provider */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-700">{f.provider.name}</span>
                  </td>
                  {/* Type */}
                  <td className="px-3 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
                      f.facilityType === "Indoor"  ? "bg-blue-50 text-blue-700 border-blue-200" :
                      f.facilityType === "Outdoor" ? "bg-green-50 text-green-700 border-green-200" :
                      "bg-purple-50 text-purple-700 border-purple-200"
                    )}>
                      {f.facilityType}
                    </span>
                  </td>
                  {/* Sports */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600 truncate block max-w-[140px]" title={sportsTooltip(f.sports)}>
                      {sportsDisplay(f.sports)}
                    </span>
                  </td>
                  {/* Location */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600">{f.city}</span>
                  </td>
                  {/* Status */}
                  <td className="px-3 py-3">
                    <StatusBadge status={f.status} />
                  </td>
                  {/* Promotion */}
                  <td className="px-3 py-3">
                    <PromotionBadge status={f.promotionStatus} />
                  </td>
                  {/* Created */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600">
                      {format(new Date(f.createdAt), "dd MMM yyyy")}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onViewDetail(f.id)}
                      aria-label={`View facility ${f.name}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#003B95]"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <nav aria-label="Facilities table pagination" className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-500">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
            &ndash;{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} facilities
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs hover:bg-gray-50 disabled:opacity-40 text-gray-700"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) {
                p = i + 1;
              } else if (safePage <= 3) {
                p = i + 1;
              } else if (safePage >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = safePage - 2 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-7 h-7 rounded-lg text-xs font-medium",
                    p === safePage
                      ? "bg-[#003B95] text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs hover:bg-gray-50 disabled:opacity-40 text-gray-700"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
