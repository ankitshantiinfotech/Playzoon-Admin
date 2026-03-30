// ─── Banner Management Page ───────────────────────────────────
// Full CRUD with listing, add/edit modal, delete confirmation,
// status toggling, sort-order display, and audit trail.

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, Search, RefreshCw, RotateCcw,
  ImageIcon, ExternalLink, ChevronDown, ChevronUp,
  ArrowUpDown, AlertCircle, AlertTriangle, Info,
  History, CheckCircle2, XCircle, Eye, EyeOff, Hash,
  GripVertical, Filter,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import {
  Banner,
  BannerFormData,
  BannerAuditEntry,
  MOCK_BANNERS,
  MOCK_BANNER_AUDIT,
} from "./types";
import { BannerForm } from "./BannerForm";

// ─── Skeleton ─────────────────────────────────────────────────

function BannerCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse flex items-center gap-4">
      <div className="w-36 h-20 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-3 w-32 bg-gray-100 rounded" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
      </div>
      <div className="w-16 h-6 bg-gray-100 rounded-full" />
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-100 rounded-lg" />
        <div className="w-8 h-8 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

function AuditTableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 bg-gray-50 rounded-lg">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
          <div className="h-3 w-32 bg-gray-100 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: Banner["status"] }) {
  return status === "Active" ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-gray-100 text-gray-500 border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Inactive
    </span>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────

function DeleteModal({
  bannerText,
  onConfirm,
  onCancel,
}: {
  bannerText: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-red-50">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-2">
          Delete Banner?
        </h3>
        <p className="text-sm text-gray-600 text-center mb-1 font-semibold line-clamp-2">
          {bannerText || "Untitled Banner"}
        </p>
        <p className="text-xs text-gray-500 text-center mb-5">
          Are you sure you want to delete this banner? This action cannot be undone.
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
          <Info className="w-3.5 h-3.5 shrink-0 text-blue-400" />
          This action will be logged in the Audit Trail.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Toggle Confirmation Modal ─────────────────────────

function StatusToggleModal({
  banner,
  onConfirm,
  onCancel,
}: {
  banner: Banner;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const toActive = banner.status === "Inactive";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4",
            toActive ? "bg-emerald-50" : "bg-amber-50"
          )}
        >
          {toActive ? (
            <Eye className="w-6 h-6 text-emerald-600" />
          ) : (
            <EyeOff className="w-6 h-6 text-amber-600" />
          )}
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-2">
          {toActive ? "Activate Banner?" : "Deactivate Banner?"}
        </h3>
        <p className="text-sm text-gray-600 text-center mb-1 font-semibold line-clamp-2">
          {banner.bannerText || "Untitled Banner"}
        </p>
        <p className="text-xs text-gray-500 text-center mb-5">
          {toActive
            ? "This banner will be shown on the homepage."
            : "This banner will be hidden from the homepage but will remain in the admin list."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors",
              toActive
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {toActive ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Banner List Item ─────────────────────────────────────────

function BannerListItem({
  banner,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  banner: Banner;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:shadow-md group",
        banner.status === "Inactive" && "opacity-80 bg-gray-50/80"
      )}
    >
      {/* Sort Order Indicator */}
      <div className="flex flex-col items-center gap-0.5 w-8 shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase">Order</span>
        <span className="text-sm font-bold text-gray-700 tabular-nums bg-gray-100 rounded-md w-7 h-7 flex items-center justify-center">
          {banner.sortOrder}
        </span>
      </div>

      {/* Thumbnail */}
      <div className="relative w-36 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
        <img
          src={banner.imageUrl}
          alt={banner.bannerText || "Banner"}
          className="w-full h-full object-cover"
        />
        {banner.status === "Inactive" && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-600 bg-white/80 px-2 py-0.5 rounded-full shadow-sm">
              INACTIVE
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {banner.bannerText || <span className="text-gray-400 italic">No banner text</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {banner.buttonLabel && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
              {banner.buttonLabel}
            </span>
          )}
          {banner.redirectUrl && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-500 truncate max-w-[220px]">
              <ExternalLink className="w-3 h-3 shrink-0 text-gray-400" />
              {banner.redirectUrl}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400">
          ID: {banner.id} &middot; Updated{" "}
          {format(new Date(banner.updatedAt), "dd MMM yyyy, HH:mm")}
        </p>
      </div>

      {/* Status */}
      <div className="shrink-0">
        <button
          onClick={onToggleStatus}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          title={`Click to ${banner.status === "Active" ? "deactivate" : "activate"}`}
        >
          <StatusBadge status={banner.status} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-[#003B95] transition-colors"
          title="Edit banner"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
          title="Delete banner"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Audit Trail Section ──────────────────────────────────────

type AuditSortField = "field" | "changedAt" | "changedBy";
type AuditSortDir = "asc" | "desc";

function AuditTrailSection({ entries }: { entries: BannerAuditEntry[] }) {
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<AuditSortField>("changedAt");
  const [sortDir, setSortDir] = useState<AuditSortDir>("desc");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const toggleSort = (field: AuditSortField) => {
    if (sortField === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "changedAt" ? "desc" : "asc");
    }
  };

  const sorted = [...entries].sort((a, b) => {
    let cmp = 0;
    if (sortField === "changedAt")
      cmp = new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime();
    else if (sortField === "field") cmp = a.field.localeCompare(b.field);
    else cmp = a.changedBy.localeCompare(b.changedBy);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const visible = expanded ? sorted : sorted.slice(0, 5);

  const SortIcon = ({ field }: { field: AuditSortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-[#003B95]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#003B95]" />
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#003B95]/10 flex items-center justify-center shrink-0">
            <History className="w-4 h-4 text-[#003B95]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Audit Trail</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Change log for all banner modifications.
            </p>
          </div>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
          {entries.length} entr{entries.length !== 1 ? "ies" : "y"}
        </span>
      </div>
      <div className="p-5">
        {loading ? (
          <AuditTableSkeleton />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
            <History className="w-10 h-10 text-gray-200" />
            <p className="text-sm">No audit history available.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      Banner
                    </th>
                    <th
                      className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => toggleSort("field")}
                    >
                      <span className="flex items-center gap-1">
                        Field Changed <SortIcon field="field" />
                      </span>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      Old Value
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      New Value
                    </th>
                    <th
                      className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => toggleSort("changedAt")}
                    >
                      <span className="flex items-center gap-1">
                        Date &amp; Time <SortIcon field="changedAt" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => toggleSort("changedBy")}
                    >
                      <span className="flex items-center gap-1">
                        Changed By <SortIcon field="changedBy" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map(entry => (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 font-medium truncate max-w-[140px] block">
                          {entry.bannerText}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {entry.bannerId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <Edit2 className="w-3 h-3 text-[#003B95] shrink-0" />
                          <span className="font-semibold text-gray-800">
                            {entry.field}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md line-through inline-block max-w-[140px] truncate">
                          {entry.oldValue || "\u2014"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold inline-block max-w-[140px] truncate">
                          {entry.newValue}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 tabular-nums whitespace-nowrap">
                        {format(new Date(entry.changedAt), "dd MMM yyyy, HH:mm")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-[#003B95]">
                          {entry.changedBy}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sorted.length > 5 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="w-full py-2 mt-2 text-xs text-[#003B95] hover:underline font-medium"
              >
                {expanded
                  ? "Show less"
                  : `Show ${sorted.length - 5} more entries`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export function BannerManagementPage() {
  // ── State ──────────────────────────────────────────────
  const [banners, setBanners] = useState<Banner[]>([]);
  const [auditTrail, setAuditTrail] = useState<BannerAuditEntry[]>(MOCK_BANNER_AUDIT);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Form / modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>(undefined);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [togglingBanner, setTogglingBanner] = useState<Banner | null>(null);

  // ── Load data ──────────────────────────────────────────
  const loadBanners = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => {
      setBanners(MOCK_BANNERS);
      setIsLoading(false);
    }, 1200);
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  // ── Audit helper ───────────────────────────────────────
  const addAudit = useCallback(
    (
      bannerId: string,
      bannerText: string,
      field: string,
      oldValue: string,
      newValue: string
    ) => {
      const entry: BannerAuditEntry = {
        id: `BAUD-${Date.now()}`,
        bannerId,
        bannerText,
        field,
        oldValue,
        newValue,
        changedBy: "Super Admin",
        changedAt: new Date().toISOString(),
      };
      setAuditTrail(prev => [entry, ...prev]);
    },
    []
  );

  // ── Filtered & sorted list ─────────────────────────────
  const filtered = banners
    .filter(b => {
      if (statusFilter !== "All" && b.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          b.bannerText.toLowerCase().includes(q) ||
          b.buttonLabel.toLowerCase().includes(q) ||
          b.redirectUrl.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // ── Handlers ───────────────────────────────────────────

  const handleCreateOrUpdate = (data: BannerFormData) => {
    if (editingBanner) {
      // Track changes
      const fields: [keyof BannerFormData, string][] = [
        ["bannerText", "Banner Text"],
        ["buttonLabel", "Button Label"],
        ["redirectUrl", "Redirect URL"],
        ["status", "Status"],
        ["sortOrder", "Sort Order"],
        ["imageUrl", "Banner Image"],
      ];
      fields.forEach(([key, label]) => {
        const oldVal = String(editingBanner[key]);
        const newVal = String(data[key]);
        if (oldVal !== newVal) {
          addAudit(
            editingBanner.id,
            data.bannerText || editingBanner.bannerText,
            label,
            key === "imageUrl" ? "(image changed)" : oldVal,
            key === "imageUrl" ? "(new image)" : newVal
          );
        }
      });

      setBanners(prev =>
        prev.map(b =>
          b.id === editingBanner.id
            ? { ...b, ...data, updatedAt: new Date().toISOString() }
            : b
        )
      );
      toast.success("Banner updated successfully.");
    } else {
      const newBanner: Banner = {
        ...data,
        id: `BNR-${String(banners.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBanners(prev => [...prev, newBanner]);
      addAudit(newBanner.id, data.bannerText, "Banner Created", "\u2014", "New banner created");
      toast.success("Banner created successfully.");
    }
    setIsFormOpen(false);
    setEditingBanner(undefined);
  };

  const handleDelete = () => {
    if (!deletingBanner) return;
    addAudit(
      deletingBanner.id,
      deletingBanner.bannerText,
      "Banner Deleted",
      "Existed",
      "Deleted"
    );
    setBanners(prev => prev.filter(b => b.id !== deletingBanner.id));
    setDeletingBanner(null);
    toast.success("Banner deleted successfully.");
  };

  const handleToggleStatus = () => {
    if (!togglingBanner) return;
    const newStatus: Banner["status"] =
      togglingBanner.status === "Active" ? "Inactive" : "Active";
    addAudit(
      togglingBanner.id,
      togglingBanner.bannerText,
      "Status",
      togglingBanner.status,
      newStatus
    );
    setBanners(prev =>
      prev.map(b =>
        b.id === togglingBanner.id
          ? { ...b, status: newStatus, updatedAt: new Date().toISOString() }
          : b
      )
    );
    setTogglingBanner(null);
    toast.success(`Banner ${newStatus === "Active" ? "activated" : "deactivated"}.`);
  };

  // ── Stats ──────────────────────────────────────────────
  const totalActive = banners.filter(b => b.status === "Active").length;
  const totalInactive = banners.filter(b => b.status === "Inactive").length;

  // ── Render: Error ──────────────────────────────────────
  if (hasError) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Unable to Load Banners
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Please try again. If the problem persists, contact support.
          </p>
          <button
            onClick={loadBanners}
            className="flex items-center gap-2 px-4 py-2 bg-[#003B95] text-white rounded-xl text-sm font-semibold hover:bg-[#002d75] transition-colors mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Loading ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
        </div>
        {/* Stat pills skeleton */}
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <BannerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Render: Main ───────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, edit, and manage homepage promotional banners.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBanner(undefined);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003B95] text-white rounded-xl text-sm font-semibold hover:bg-[#002d75] transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {/* Stats + Filters Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Stat pills */}
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            Total: {banners.length}
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            Active: {totalActive}
          </span>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
            Inactive: {totalInactive}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as "All" | "Active" | "Inactive")
              }
              className="text-sm border border-gray-300 rounded-lg h-9 px-2 outline-none focus:border-[#003B95] bg-white"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Banner Listing */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map(banner => (
            <BannerListItem
              key={banner.id}
              banner={banner}
              onEdit={() => {
                setEditingBanner(banner);
                setIsFormOpen(true);
              }}
              onDelete={() => setDeletingBanner(banner)}
              onToggleStatus={() => setTogglingBanner(banner)}
            />
          ))
        ) : banners.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              No banners found
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Click "Add Banner" to create your first homepage banner.
            </p>
            <button
              onClick={() => {
                setEditingBanner(undefined);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#003B95] text-white rounded-xl text-sm font-semibold hover:bg-[#002d75] transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Banner
            </button>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No banners match your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="text-xs text-[#003B95] hover:underline mt-2 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <AuditTrailSection entries={auditTrail} />

      {/* Note */}
      <div className="flex items-start gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-500">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
        <span>
          All banner changes (create, edit, delete, status toggle) are logged in
          the Audit Trail above. Inactive banners remain in the admin list but
          are hidden from the homepage.
        </span>
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}

      {/* Add / Edit Form */}
      {isFormOpen && (
        <BannerForm
          initialData={editingBanner}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingBanner(undefined);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingBanner && (
        <DeleteModal
          bannerText={deletingBanner.bannerText}
          onConfirm={handleDelete}
          onCancel={() => setDeletingBanner(null)}
        />
      )}

      {/* Status Toggle Confirmation */}
      {togglingBanner && (
        <StatusToggleModal
          banner={togglingBanner}
          onConfirm={handleToggleStatus}
          onCancel={() => setTogglingBanner(null)}
        />
      )}
    </div>
  );
}
