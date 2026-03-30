"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  Flag,
  Calendar,
  Tag,
  Mail,
  Hash,
  Eye,
  EyeOff,
  X,
  Loader2,
  FileText,
  ShieldAlert,
  Clock,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_REVIEWS } from "./mockData";
import { Review } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Visible: "bg-green-100 text-green-700",
  Flagged: "bg-amber-100 text-amber-700",
  Hidden: "bg-red-100 text-red-700",
};

const TYPE_COLORS: Record<string, string> = {
  Facility: "bg-blue-100 text-blue-700",
  Training: "bg-purple-100 text-purple-700",
  Coach: "bg-teal-100 text-teal-700",
  Tournament: "bg-orange-100 text-orange-700",
};

// ─── Star Rating Component ────────────────────────────────────────────────────

function StarRating({ rating, size = "lg" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200 fill-gray-200"
          )}
        />
      ))}
    </div>
  );
}

// ─── Hide Review Modal (simplified) ───────────────────────────────────────────

interface HideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  reviewerName: string;
  targetName: string;
}

function HideReviewModal({
  isOpen,
  onClose,
  onConfirm,
  reviewerName,
  targetName,
}: HideModalProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    onConfirm(reason.trim() || undefined);
    setIsLoading(false);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
          <div>
            <h3 className="text-base font-semibold text-red-900">
              Hide Review
            </h3>
            <p className="text-xs text-red-500 mt-0.5">
              This action is logged for audit purposes
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You are about to hide{" "}
            <span className="font-semibold text-gray-800">
              {reviewerName}&apos;s
            </span>{" "}
            review for{" "}
            <span className="font-semibold text-gray-800">{targetName}</span>.
            The target&apos;s average rating will be recalculated.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you hiding this review?"
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Hide Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find review and manage local state
  const initialReview = MOCK_REVIEWS.find((r) => r.id === id) || null;
  const [review, setReview] = useState<Review | null>(initialReview);
  const [hideModalOpen, setHideModalOpen] = useState(false);

  // ── 404 State ───────────────────────────────────────────────────────────────
  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24">
        <div className="bg-gray-50 rounded-2xl p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Review Not Found
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The review with ID{" "}
            <span className="font-mono text-gray-700">{id}</span> does not
            exist or has been permanently deleted.
          </p>
          <button
            onClick={() => navigate("/reviews")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reviews
          </button>
        </div>
      </div>
    );
  }

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleUnflag = () => {
    setReview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: "Visible",
        flaggedByProvider: undefined,
        flaggedReason: undefined,
      };
    });
    toast.success("Review has been unflagged and restored to Visible status.");
  };

  const handleHide = (reason?: string) => {
    setReview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: "Hidden",
        hideAdditionalNotes: reason,
        hiddenAt: new Date().toISOString(),
        hiddenBy: "Super Admin",
        flaggedByProvider: undefined,
        flaggedReason: undefined,
      };
    });
    toast.success("Review has been hidden successfully.");
  };

  const handleUnhide = () => {
    setReview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: "Visible",
        hideReasonCategory: undefined,
        hideAdditionalNotes: undefined,
        hiddenAt: undefined,
        hiddenBy: undefined,
      };
    });
    toast.success("Review has been restored to Visible status.");
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Back button */}
        <div>
          <button
            onClick={() => navigate("/reviews")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reviews
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Review Detail
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm font-mono">{review.id}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {review.status === "Flagged" && (
            <>
              <button
                onClick={handleUnflag}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Unflag
              </button>
              <button
                onClick={() => setHideModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                Hide Review
              </button>
            </>
          )}
          {review.status === "Visible" && (
            <button
              onClick={() => setHideModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <EyeOff className="w-4 h-4" />
              Hide Review
            </button>
          )}
          {review.status === "Hidden" && (
            <button
              onClick={handleUnhide}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Unhide
            </button>
          )}
        </div>
      </div>

      {/* ── Two-Column Layout ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6 flex-1 min-h-0">
        {/* ── Left Column (65%) ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Review Content Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Rating
              </p>
              <div className="flex items-center gap-3">
                <StarRating rating={review.rating} size="lg" />
                <span className="text-2xl font-bold text-gray-800">
                  {review.rating}.0
                </span>
                <span className="text-sm text-gray-400">/ 5</span>
              </div>
            </div>

            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Review Text
              </p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 italic">
                &ldquo;{review.text}&rdquo;
              </p>
            </div>

            <div className="px-6 py-4 flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              Submitted on{" "}
              {format(new Date(review.submittedAt), "MMM d, yyyy · HH:mm")}
            </div>
          </div>

          {/* Flag Alert Card (only if Flagged) */}
          {review.status === "Flagged" &&
            review.flaggedByProvider && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <Flag className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-amber-900 mb-1">
                      Provider Flag Alert
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">
                          Flagged By
                        </p>
                        <p className="text-sm font-medium text-amber-800">
                          {review.flaggedByProvider}
                        </p>
                      </div>
                      {review.flaggedReason && (
                        <div>
                          <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">
                            Reason
                          </p>
                          <p className="text-sm text-amber-800">
                            {review.flaggedReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Hide Info Card (only if Hidden) */}
          {review.status === "Hidden" &&
            review.hideReasonCategory && (
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-red-900 mb-1">
                      Review Hidden
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-red-500 uppercase tracking-wide font-medium">
                          Reason Category
                        </p>
                        <p className="text-sm font-medium text-red-800">
                          {review.hideReasonCategory}
                        </p>
                      </div>
                      {review.hideAdditionalNotes && (
                        <div>
                          <p className="text-xs text-red-500 uppercase tracking-wide font-medium">
                            Additional Notes
                          </p>
                          <p className="text-sm text-red-800">
                            {review.hideAdditionalNotes}
                          </p>
                        </div>
                      )}
                      {review.hiddenBy && (
                        <div>
                          <p className="text-xs text-red-500 uppercase tracking-wide font-medium">
                            Hidden By
                          </p>
                          <p className="text-sm text-red-800">
                            {review.hiddenBy}
                          </p>
                        </div>
                      )}
                      {review.hiddenAt && (
                        <div>
                          <p className="text-xs text-red-500 uppercase tracking-wide font-medium">
                            Hidden At
                          </p>
                          <p className="text-sm text-red-800">
                            {format(
                              new Date(review.hiddenAt),
                              "MMM d, yyyy · HH:mm"
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* ── Right Column (35%) ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Reviewer Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Reviewer
            </p>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={review.reviewer.photo}
                alt={review.reviewer.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
              />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {review.reviewer.name}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {review.reviewer.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{review.reviewer.email}</span>
            </div>
          </div>

          {/* Reviewed Entity Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Reviewed Entity
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                  <Tag className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {review.target.name}
                  </p>
                  <span
                    className={cn(
                      "text-xs font-medium px-2.5 py-0.5 rounded-full mt-1 inline-block",
                      TYPE_COLORS[review.target.type]
                    )}
                  >
                    {review.target.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 pl-1">
                <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-mono text-xs">{review.target.id}</span>
              </div>
            </div>
          </div>

          {/* Review Metadata Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Review Metadata
            </p>
            <div className="space-y-3">
              {/* Review ID */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Review ID</span>
                </div>
                <span className="text-sm font-mono font-medium text-gray-800">
                  {review.id}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Info className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Status</span>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-3 py-1 rounded-full",
                    STATUS_STYLES[review.status]
                  )}
                >
                  {review.status}
                </span>
              </div>

              {/* Submission Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Submitted</span>
                </div>
                <span className="text-sm text-gray-800">
                  {format(new Date(review.submittedAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hide Modal ─────────────────────────────────────────────────────── */}
      <HideReviewModal
        isOpen={hideModalOpen}
        onClose={() => setHideModalOpen(false)}
        onConfirm={handleHide}
        reviewerName={review.reviewer.name}
        targetName={review.target.name}
      />
    </div>
  );
}
