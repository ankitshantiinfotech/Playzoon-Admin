import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Review, ReviewStatus, ReviewType } from "./types";
import {
  Search,
  Star,
  Eye,
  EyeOff,
  Flag,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  SlidersHorizontal,
  X,
  RotateCcw,
} from "lucide-react";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { ViewReviewModal, UnflagModal, HideModal, UnhideModal } from "./Modals";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewTableProps {
  reviews: Review[];
  onUpdate: (reviewId: string, updates: Partial<Review>) => void;
}

const STATUS_STYLES: Record<ReviewStatus, string> = {
  Visible: "bg-green-100 text-green-700 border-green-200",
  Flagged: "bg-amber-100 text-amber-700 border-amber-200",
  Hidden: "bg-red-100 text-red-700 border-red-200",
};

const TYPE_STYLES: Record<ReviewType, string> = {
  Facility: "bg-blue-100 text-blue-700",
  Training: "bg-purple-100 text-purple-700",
  Coach: "bg-teal-100 text-teal-700",
  Tournament: "bg-orange-100 text-orange-700",
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("w-3.5 h-3.5", i < rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200")}
        />
      ))}
    </div>
  );
}

const ALL_TYPES: ReviewType[] = ["Facility", "Training", "Coach", "Tournament"];
const ALL_STATUSES: ReviewStatus[] = ["Visible", "Flagged", "Hidden"];
const ITEMS_PER_PAGE = 10;

export function ReviewTable({ reviews, onUpdate }: ReviewTableProps) {
  const navigate = useNavigate();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReviewType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "All">("All");
  const [ratingFilter, setRatingFilter] = useState<number | "All">("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [viewReview, setViewReview] = useState<Review | null>(null);
  const [unflagReview, setUnflagReview] = useState<Review | null>(null);
  const [hideReview, setHideReview] = useState<Review | null>(null);
  const [unhideReview, setUnhideReview] = useState<Review | null>(null);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const kw = keyword.toLowerCase();
      const matchesKeyword =
        !kw ||
        r.text.toLowerCase().includes(kw) ||
        r.reviewer.name.toLowerCase().includes(kw) ||
        r.target.name.toLowerCase().includes(kw);

      const matchesType = typeFilter === "All" || r.target.type === typeFilter;
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      const matchesRating = ratingFilter === "All" || r.rating === ratingFilter;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const submitted = parseISO(r.submittedAt);
        if (dateFrom && dateTo) {
          matchesDate = isWithinInterval(submitted, {
            start: startOfDay(parseISO(dateFrom)),
            end: endOfDay(parseISO(dateTo)),
          });
        } else if (dateFrom) {
          matchesDate = submitted >= startOfDay(parseISO(dateFrom));
        } else if (dateTo) {
          matchesDate = submitted <= endOfDay(parseISO(dateTo));
        }
      }

      return matchesKeyword && matchesType && matchesStatus && matchesRating && matchesDate;
    });
  }, [reviews, keyword, typeFilter, statusFilter, ratingFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));

  const hasActiveFilters =
    typeFilter !== "All" || statusFilter !== "All" || ratingFilter !== "All" || dateFrom || dateTo;

  const clearFilters = () => {
    setTypeFilter("All");
    setStatusFilter("All");
    setRatingFilter("All");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleUnflag = async () => {
    if (!unflagReview) return;
    onUpdate(unflagReview.id, {
      status: "Visible",
      flaggedByProvider: undefined,
      flaggedReason: undefined,
    });
    toast.success("Review unflagged and returned to Visible status.");
    setUnflagReview(null);
  };

  const handleHide = async (reason?: string) => {
    if (!hideReview) return;
    onUpdate(hideReview.id, {
      status: "Hidden",
      hideAdditionalNotes: reason,
      hiddenAt: new Date().toISOString(),
      hiddenBy: "Super Admin",
    });
    toast.success("Review hidden. Rating recalculated and action logged.");
    setHideReview(null);
  };

  const handleUnhide = async () => {
    if (!unhideReview) return;
    onUpdate(unhideReview.id, {
      status: "Visible",
      hideReasonCategory: undefined,
      hideAdditionalNotes: undefined,
      hiddenAt: undefined,
      hiddenBy: undefined,
    });
    toast.success("Review restored to Visible status.");
    setUnhideReview(null);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Keyword search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by reviewer, target, or review text…"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors",
                  showFilters || hasActiveFilters
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {[typeFilter !== "All", statusFilter !== "All", ratingFilter !== "All", !!dateFrom || !!dateTo].filter(Boolean).length}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 mr-1">Status:</span>
            {(["All", "Visible", "Flagged", "Hidden"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s === "All" ? "All" : s); setCurrentPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  statusFilter === s || (s === "All" && statusFilter === "All")
                    ? s === "Flagged"
                      ? "bg-amber-100 text-amber-700 border-amber-300"
                      : s === "Hidden"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : s === "Visible"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {s === "Visible" ? "Normal (Visible)" : s}
              </button>
            ))}</div>

          {/* Expandable filter row */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 pb-0.5">
              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value as ReviewType | "All"); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="All">All Types</option>
                  {ALL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as ReviewStatus | "All"); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="All">All Statuses</option>
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rating</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => { setRatingFilter(e.target.value === "All" ? "All" : Number(e.target.value)); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="All">All Ratings</option>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
              </div>

              {/* Date range */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                    className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <span className="text-gray-400 text-xs shrink-0">–</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                    className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 font-medium">Reviewer</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Review</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-500">No reviews found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((review) => (
                  <tr
                    key={review.id}
                    onClick={() => navigate(`/reviews/${review.id}`)}
                    className={cn(
                      "hover:bg-gray-50/70 transition-colors group cursor-pointer",
                      review.status === "Flagged" && "bg-red-50/30"
                    )}
                  >
                    {/* Reviewer */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={review.reviewer.photo}
                          alt={review.reviewer.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-900 truncate max-w-[120px]">{review.reviewer.name}</span>
                            {review.status === "Flagged" && (
                              <Flag className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            )}
                            {review.status === "Hidden" && (
                              <EyeOff className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-[120px]">{review.reviewer.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Target */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-800 truncate max-w-[140px]" title={review.target.name}>
                        {review.target.name}
                      </div>
                      <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block", TYPE_STYLES[review.target.type])}>
                        {review.target.type}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <StarRow rating={review.rating} />
                        <span className="text-xs text-gray-500">{review.rating}.0 / 5</span>
                      </div>
                    </td>

                    {/* Review text */}
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <p className="text-gray-600 text-xs line-clamp-2 italic" title={review.text}>
                        &ldquo;{review.text}&rdquo;
                      </p>
                    </td>

                    {/* Submitted date */}
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        {format(new Date(review.submittedAt), "MMM d, yyyy")}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap", STATUS_STYLES[review.status])}>
                        {review.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <button
                          onClick={() => setViewReview(review)}
                          title="View full review"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Unflag — Flagged only */}
                        {review.status === "Flagged" && (
                          <button
                            onClick={() => setUnflagReview(review)}
                            title="Unflag review"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 border border-transparent hover:border-green-100 transition-all"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        )}

                        {/* Hide — Visible or Flagged */}
                        {review.status !== "Hidden" && (
                          <button
                            onClick={() => setHideReview(review)}
                            title="Hide review"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}

                        {/* Unhide — Hidden only */}
                        {review.status === "Hidden" && (
                          <button
                            onClick={() => setUnhideReview(review)}
                            title="Unhide review"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 border border-transparent hover:border-green-100 transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {filtered.length === 0 ? (
              "No results"
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of <span className="font-semibold text-gray-700">{filtered.length}</span> reviews
              </>
            )}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - currentPage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={cn(
                    "w-8 h-8 rounded-lg border text-sm font-medium transition-colors",
                    p === currentPage
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300 text-gray-600 hover:bg-white hover:text-gray-900"
                  )}
                >
                  {p}
                </button>
              ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <ViewReviewModal
        review={viewReview}
        onClose={() => setViewReview(null)}
        onUnflag={(r) => { setViewReview(null); setUnflagReview(r); }}
        onHide={(r) => { setViewReview(null); setHideReview(r); }}
      />
      <UnflagModal
        review={unflagReview}
        onClose={() => setUnflagReview(null)}
        onConfirm={handleUnflag}
      />
      <HideModal
        review={hideReview}
        onClose={() => setHideReview(null)}
        onConfirm={handleHide}
      />
      <UnhideModal
        review={unhideReview}
        onClose={() => setUnhideReview(null)}
        onConfirm={handleUnhide}
      />
    </>
  );
}
