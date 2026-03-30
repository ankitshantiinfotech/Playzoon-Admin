// ─── SCR-ADM-023: Training List (Admin View) ─────────────────────
// Sortable, filterable DataTable of all training programmes.
// Admin can toggle Active/Inactive status via confirm modal.

import { useState, useMemo } from "react";
import {
  Search, Download, ChevronDown, ChevronUp, Eye,
  ChevronLeft, ChevronRight, Star, X, ArrowUpDown,
  Dumbbell, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import {
  Training, TrainingStatus, TrainingLevel, TrainingType,
  PromotionStatus, SPORTS_LIST,
} from "./types";
import { MOCK_TRAININGS } from "./mockData";

// ─── Sort Types ──────────────────────────────────────────────

type SortField =
  | "id" | "name" | "sport" | "level" | "providerName"
  | "facilityName" | "status" | "promotionStatus" | "createdAt";
type SortDir = "asc" | "desc";

// ─── Badges ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: TrainingStatus }) {
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

function TypeBadge({ type }: { type: TrainingType }) {
  const s: Record<TrainingType, string> = {
    "Full Course":  "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Per Session":  "bg-teal-50 text-teal-700 border-teal-200",
    "Subscription": "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border", s[type]
    )}>
      {type}
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
  return (
    <span className="text-[11px] text-gray-400">Standard</span>
  );
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
      <button onClick={onRemove} className="hover:text-red-500 ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Status Toggle Confirm Modal ─────────────────────────────

function ConfirmToggleModal({
  training,
  targetStatus,
  onConfirm,
  onCancel,
}: {
  training: Training;
  targetStatus: TrainingStatus;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const toActive = targetStatus === "Active";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4",
          toActive ? "bg-emerald-50" : "bg-amber-50"
        )}>
          {toActive
            ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            : <AlertTriangle className="w-6 h-6 text-amber-600" />}
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-2">
          {toActive ? "Activate Training" : "Deactivate Training"}
        </h3>
        <p className="text-sm text-gray-600 text-center mb-1">
          <strong>{training.name}</strong>
        </p>
        <p className="text-xs text-gray-500 text-center mb-5">
          {toActive
            ? "Activating this training will make it visible to players on the platform. Continue?"
            : "Deactivating this training will hide it from player-facing listings. Existing bookings will be honored. Continue?"}
        </p>
        {!toActive && training.earnings.activeBookings > 0 && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mb-4">
            <Info className="w-3.5 h-3.5 shrink-0" />
            This training has {training.earnings.activeBookings} upcoming bookings. Existing bookings will be honored.
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white",
              toActive
                ? "bg-[#003B95] hover:bg-[#002a6b]"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {toActive ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Export Dropdown ─────────────────────────────────────────

function ExportDropdown({
  filtered,
  disabled,
}: {
  filtered: Training[];
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  const handleExport = (fmt: string) => {
    setOpen(false);
    // CSV only for mock; other formats show concept
    const header = [
      "Training ID","Name","Sport","Level","Types","Provider",
      "Facility","Coaches","Status","Promotion","Created Date",
    ].join(",");
    const rows = filtered.map(t => [
      t.id,
      `"${t.name}"`,
      t.sport,
      t.level,
      `"${t.types.join(", ")}"`,
      `"${t.provider.name}"`,
      `"${t.facility.name}"`,
      `"${t.coaches.map(c => c.name).join("; ")}"`,
      t.status,
      t.promotionStatus,
      t.createdAt.split("T")[0],
    ].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `trainings_export_${new Date().toISOString().split("T")[0]}.${fmt === "CSV" ? "csv" : fmt.toLowerCase()}`;
    a.click();
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-label="Export training data"
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

export function TrainingListPage({ onViewDetail }: Props) {
  // ── Filter state ──
  const [search, setSearch]       = useState("");
  const [sport, setSport]         = useState("All");
  const [level, setLevel]         = useState("All");
  const [type, setType]           = useState("All");
  const [status, setStatus]       = useState("All");
  const [promotion, setPromotion] = useState("All");
  const [provider, setProvider]   = useState("All");

  // ── Table state ──
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(20);
  const [sort, setSort]           = useState<{ field: SortField; dir: SortDir }>({
    field: "createdAt", dir: "desc",
  });

  // ── Toggle state ──
  const [trainings, setTrainings]         = useState(MOCK_TRAININGS);
  const [modalTraining, setModalTraining] = useState<Training | null>(null);
  const [targetStatus, setTargetStatus]   = useState<TrainingStatus | null>(null);
  const [toastMsg, setToastMsg]           = useState<string | null>(null);

  // Providers list
  const providerList = useMemo(
    () => [...new Set(trainings.map(t => t.provider.name))].sort(),
    [trainings],
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
    let r = [...trainings];

    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      r = r.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.sport.toLowerCase().includes(q) ||
        t.provider.name.toLowerCase().includes(q) ||
        t.coaches.some(c => c.name.toLowerCase().includes(q))
      );
    }
    if (sport     !== "All") r = r.filter(t => t.sport           === sport);
    if (level     !== "All") r = r.filter(t => t.level           === level);
    if (type      !== "All") r = r.filter(t => t.types.includes(type as TrainingType));
    if (status    !== "All") r = r.filter(t => t.status          === status);
    if (promotion !== "All") r = r.filter(t => t.promotionStatus === promotion);
    if (provider  !== "All") r = r.filter(t => t.provider.name   === provider);

    r.sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case "id":              cmp = a.id.localeCompare(b.id); break;
        case "name":            cmp = a.name.localeCompare(b.name); break;
        case "sport":           cmp = a.sport.localeCompare(b.sport); break;
        case "level":           cmp = a.level.localeCompare(b.level); break;
        case "providerName":    cmp = a.provider.name.localeCompare(b.provider.name); break;
        case "facilityName":    cmp = a.facility.name.localeCompare(b.facility.name); break;
        case "status":          cmp = a.status.localeCompare(b.status); break;
        case "promotionStatus": cmp = a.promotionStatus.localeCompare(b.promotionStatus); break;
        case "createdAt":       cmp = a.createdAt.localeCompare(b.createdAt); break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return r;
  }, [search, sport, level, type, status, promotion, provider, sort, trainings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Active filters
  const activeFilters = [
    sport     !== "All" && { label: `Sport: ${sport}`,         clear: () => setSport("All") },
    level     !== "All" && { label: `Level: ${level}`,         clear: () => setLevel("All") },
    type      !== "All" && { label: `Type: ${type}`,           clear: () => setType("All") },
    status    !== "All" && { label: `Status: ${status}`,       clear: () => setStatus("All") },
    promotion !== "All" && { label: `Promotion: ${promotion}`, clear: () => setPromotion("All") },
    provider  !== "All" && { label: `Provider: ${provider}`,   clear: () => setProvider("All") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => {
    setSport("All"); setLevel("All"); setType("All"); setStatus("All");
    setPromotion("All"); setProvider("All"); setSearch(""); setPage(1);
  };

  // ── Status toggle handlers ──
  const handleToggleClick = (t: Training) => {
    const next: TrainingStatus = t.status === "Active" ? "Inactive" : "Active";
    setModalTraining(t);
    setTargetStatus(next);
  };

  const handleConfirmToggle = () => {
    if (!modalTraining || !targetStatus) return;
    setTrainings(prev =>
      prev.map(t =>
        t.id === modalTraining.id ? { ...t, status: targetStatus } : t
      ),
    );
    const action = targetStatus === "Active" ? "activated" : "deactivated";
    setToastMsg(`Training '${modalTraining.name}' has been ${action}.`);
    setModalTraining(null);
    setTargetStatus(null);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCancelToggle = () => {
    setModalTraining(null);
    setTargetStatus(null);
  };

  // ── Coach display helper ──
  const coachDisplay = (coaches: Training["coaches"]) => {
    if (coaches.length === 0) return "—";
    const names = coaches.map(c => c.name);
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  };

  const coachTooltip = (coaches: Training["coaches"]) =>
    coaches.map(c => c.name).join(", ");

  // ── Stats ──
  const stats = useMemo(() => ({
    total:    trainings.length,
    active:   trainings.filter(t => t.status === "Active").length,
    inactive: trainings.filter(t => t.status === "Inactive").length,
    promoted: trainings.filter(t => t.promotionStatus === "Promoted").length,
  }), [trainings]);

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen" role="main" aria-label="Training Management">

      {/* ── Breadcrumb + Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span className="hover:text-[#003B95] cursor-pointer">Dashboard</span>
            <span>&rsaquo;</span>
            <span className="text-gray-600 font-medium">Trainings</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Dumbbell className="w-6 h-6 text-[#003B95]" />
            Training Management
          </h1>
        </div>
        <ExportDropdown filtered={filtered} disabled={filtered.length === 0} />
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-4 gap-3">
        {([
          { label: "Total Trainings", value: stats.total,    bg: "bg-white border-gray-200" },
          { label: "Active",          value: stats.active,   bg: "bg-emerald-50 border-emerald-200" },
          { label: "Inactive",        value: stats.inactive, bg: "bg-gray-50 border-gray-200" },
          { label: "Promoted",        value: stats.promoted, bg: "bg-amber-50 border-amber-200" },
        ] as const).map(s => (
          <div key={s.label} className={cn("border rounded-xl p-4 shadow-sm", s.bg)}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar: Search + Filters ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by training name, sport, provider..."
            aria-label="Search trainings by name, sport, or provider"
            className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003B95]/20 focus:border-[#003B95]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-6 gap-2">
          {([
            { label: "Sport",     value: sport,     set: setSport,     opts: ["All", ...SPORTS_LIST],                                         ariaLabel: "Filter by sport" },
            { label: "Level",     value: level,     set: setLevel,     opts: ["All", "Beginner", "Intermediate", "Advanced", "All Levels"],    ariaLabel: "Filter by level" },
            { label: "Type",      value: type,      set: setType,      opts: ["All", "Full Course", "Per Session", "Subscription"],             ariaLabel: "Filter by training type" },
            { label: "Status",    value: status,    set: setStatus,    opts: ["All", "Active", "Inactive"],                                    ariaLabel: "Filter by status" },
            { label: "Promotion", value: promotion, set: setPromotion, opts: ["All", "Promoted", "Standard"],                                  ariaLabel: "Filter by promotion status" },
            { label: "Provider",  value: provider,  set: setProvider,  opts: ["All", ...providerList],                                         ariaLabel: "Filter by provider" },
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
            &ndash;{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} trainings
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

        <div className="overflow-x-auto" role="table" aria-label="Trainings table">
          <table className="w-full min-w-[1300px]">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <SortTh label="ID"        field="id"              sort={sort} onSort={handleSort} className="w-[100px]" />
                <SortTh label="Name"      field="name"            sort={sort} onSort={handleSort} className="w-[200px]" />
                <SortTh label="Sport"     field="sport"           sort={sort} onSort={handleSort} className="w-[120px]" />
                <SortTh label="Level"     field="level"           sort={sort} onSort={handleSort} className="w-[100px]" />
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[140px]">Types</th>
                <SortTh label="Provider"  field="providerName"    sort={sort} onSort={handleSort} className="w-[160px]" />
                <SortTh label="Facility"  field="facilityName"    sort={sort} onSort={handleSort} className="w-[150px]" />
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[150px]">Coaches</th>
                <SortTh label="Status"    field="status"          sort={sort} onSort={handleSort} className="w-[100px]" />
                <SortTh label="Promotion" field="promotionStatus" sort={sort} onSort={handleSort} className="w-[110px]" />
                <SortTh label="Created"   field="createdAt"       sort={sort} onSort={handleSort} className="w-[120px]" />
                <th className="px-3 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-16 text-center">
                    <Dumbbell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">
                      {search || activeFilters.length > 0
                        ? "No Trainings Found"
                        : "No Trainings Yet"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search || activeFilters.length > 0
                        ? "No trainings match your current filters."
                        : "No training programs have been created on the platform yet."}
                    </p>
                    {activeFilters.length > 0 && (
                      <button onClick={clearAll} className="text-xs text-[#003B95] hover:underline mt-2">
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : paged.map((t, idx) => (
                <tr
                  key={t.id}
                  onClick={() => onViewDetail(t.id)}
                  className={cn(
                    "hover:bg-blue-50/40 transition-colors cursor-pointer",
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  {/* ID */}
                  <td className="px-3 py-3">
                    <span className="text-xs font-mono text-[#003B95] hover:underline">{t.id}</span>
                  </td>
                  {/* Name */}
                  <td className="px-3 py-3 max-w-[200px]">
                    <p className="text-sm font-semibold text-gray-900 leading-snug truncate" title={t.name}>
                      {t.name}
                    </p>
                  </td>
                  {/* Sport */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-700">{t.sport}</span>
                  </td>
                  {/* Level */}
                  <td className="px-3 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
                      t.level === "Beginner"     ? "bg-sky-50 text-sky-700 border-sky-200" :
                      t.level === "Intermediate"  ? "bg-amber-50 text-amber-700 border-amber-200" :
                      t.level === "Advanced"      ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-violet-50 text-violet-700 border-violet-200"
                    )}>
                      {t.level}
                    </span>
                  </td>
                  {/* Types (badges) */}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.types.map(tp => (
                        <TypeBadge key={tp} type={tp} />
                      ))}
                    </div>
                  </td>
                  {/* Provider */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-700">{t.provider.name}</span>
                  </td>
                  {/* Facility */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600">{t.facility.name || "N/A"}</span>
                  </td>
                  {/* Coaches */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600 truncate block max-w-[140px]" title={coachTooltip(t.coaches)}>
                      {coachDisplay(t.coaches)}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-3 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  {/* Promotion */}
                  <td className="px-3 py-3">
                    <PromotionBadge status={t.promotionStatus} />
                  </td>
                  {/* Created */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600">
                      {format(new Date(t.createdAt), "dd MMM yyyy")}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewDetail(t.id)}
                        aria-label={`View training ${t.name}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#003B95]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Status toggle switch */}
                      <button
                        onClick={() => handleToggleClick(t)}
                        role="switch"
                        aria-checked={t.status === "Active"}
                        aria-label={`Toggle active status for training ${t.name}`}
                        className={cn(
                          "relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#003B95]/30",
                          t.status === "Active" ? "bg-emerald-500" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                            t.status === "Active" && "translate-x-4"
                          )}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <nav aria-label="Trainings table pagination" className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-500">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
            &ndash;{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} trainings
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

      {/* ── Status Toggle Modal ── */}
      {modalTraining && targetStatus && (
        <ConfirmToggleModal
          training={modalTraining}
          targetStatus={targetStatus}
          onConfirm={handleConfirmToggle}
          onCancel={handleCancelToggle}
        />
      )}

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
          <CheckCircle2 className="w-4 h-4" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
