import { useState } from "react";
import { X, Loader2, Star, AlertTriangle, Calendar, Tag, Flag } from "lucide-react";
import { Review } from "./types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── ActionModal (generic — kept for backward-compat with other pages) ────────

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: (data?: any) => Promise<void>;
  isLoading?: boolean;
}

export function ActionModal({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  isLoading = false,
}: ActionModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 disabled:opacity-50 ${
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {children}
    </div>
  );
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(cls, i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200")}
        />
      ))}
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  Facility: "bg-blue-100 text-blue-700",
  Training: "bg-purple-100 text-purple-700",
  Coach: "bg-teal-100 text-teal-700",
  Tournament: "bg-orange-100 text-orange-700",
};

const STATUS_STYLES: Record<string, string> = {
  Visible: "bg-green-100 text-green-700 border-green-200",
  Flagged: "bg-amber-100 text-amber-700 border-amber-200",
  Hidden: "bg-red-100 text-red-700 border-red-200",
};

// ─── View Review Modal ───────────────────────────────────────────────────────

interface ViewReviewModalProps {
  review: Review | null;
  onClose: () => void;
  onHide?: (review: Review) => void;
  onUnflag?: (review: Review) => void;
}

export function ViewReviewModal({ review, onClose, onHide, onUnflag }: ViewReviewModalProps) {
  if (!review) return null;

  return (
    <ModalOverlay>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Review Detail</h3>
            <p className="text-xs text-gray-500 mt-0.5">{review.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Reviewer */}
          <div className="flex items-center gap-3">
            <img
              src={review.reviewer.photo}
              alt={review.reviewer.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
            />
            <div>
              <p className="font-semibold text-gray-900">{review.reviewer.name}</p>
              <p className="text-sm text-gray-500">{review.reviewer.email}</p>
            </div>
            <span className={cn("ml-auto text-xs font-medium px-3 py-1 rounded-full border", STATUS_STYLES[review.status])}>
              {review.status}
            </span>
          </div>

          {/* Target */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Tag className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Reviewed Target</p>
              <p className="font-semibold text-gray-900">{review.target.name}</p>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block", TYPE_COLORS[review.target.type])}>
                {review.target.type}
              </span>
            </div>
          </div>

          {/* Rating + Date */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rating</p>
              <div className="flex items-center gap-2">
                <StarRow rating={review.rating} size="md" />
                <span className="font-bold text-gray-800">{review.rating}.0</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Submitted</p>
              <p className="text-sm text-gray-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {format(new Date(review.submittedAt), "MMM d, yyyy · HH:mm")}
              </p>
            </div>
          </div>

          {/* Review text */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Review Text</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 italic">
              &ldquo;{review.text}&rdquo;
            </p>
          </div>

          {/* Flagged info */}
          {review.status === "Flagged" && review.flaggedByProvider && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
              <Flag className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-800">Flagged by {review.flaggedByProvider}</p>
                {review.flaggedReason && (
                  <p className="text-xs text-amber-600 mt-0.5">{review.flaggedReason}</p>
                )}
              </div>
            </div>
          )}

          {/* Hidden info */}
          {review.status === "Hidden" && review.hideReasonCategory && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-800">Hidden — {review.hideReasonCategory}</p>
                {review.hideAdditionalNotes && (
                  <p className="text-xs text-red-600 mt-0.5">{review.hideAdditionalNotes}</p>
                )}
                {review.hiddenBy && review.hiddenAt && (
                  <p className="text-xs text-red-400 mt-1">
                    by {review.hiddenBy} on {format(new Date(review.hiddenAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {review.status === "Flagged" && onUnflag && (
            <button
              onClick={() => { onUnflag(review); onClose(); }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Unflag
            </button>
          )}
          {review.status !== "Hidden" && onHide && (
            <button
              onClick={() => { onHide(review); onClose(); }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Hide
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Unflag Modal ─────────────────────────────────────────────────────────────

interface UnflagModalProps {
  review: Review | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function UnflagModal({ review, onClose, onConfirm }: UnflagModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  if (!review) return null;

  const handle = async () => {
    setIsLoading(true);
    try { await onConfirm(); } finally { setIsLoading(false); }
  };

  return (
    <ModalOverlay>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
          <h3 className="text-base font-semibold text-green-900">Unflag Review</h3>
          <button onClick={onClose} className="text-green-400 hover:text-green-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You're about to unflag <span className="font-semibold text-gray-800">{review.reviewer.name}'s</span> review
            for <span className="font-semibold text-gray-800">{review.target.name}</span>. The review will return to
            Visible status.
          </p>
          {review.flaggedByProvider && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-800">Originally flagged by {review.flaggedByProvider}</p>
              {review.flaggedReason && <p className="text-xs text-amber-600 mt-0.5">{review.flaggedReason}</p>}
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <StarRow rating={review.rating} />
              <span className="text-xs font-medium text-gray-600">{review.rating}.0 / 5</span>
            </div>
            <p className="text-xs text-gray-500 italic line-clamp-2">&ldquo;{review.text}&rdquo;</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handle} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Unflag Review
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Hide Modal (simplified) ──────────────────────────────────────────────────

interface HideModalProps {
  review: Review | null;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}

export function HideModal({ review, onClose, onConfirm }: HideModalProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!review) return null;

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onConfirm(reason.trim() || undefined);
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
          <div>
            <h3 className="text-base font-semibold text-red-900">Hide Review</h3>
            <p className="text-xs text-red-500 mt-0.5">This action is logged for audit purposes</p>
          </div>
          <button onClick={handleClose} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You are about to hide <span className="font-semibold text-gray-800">{review.reviewer.name}&apos;s</span> review for{" "}
            <span className="font-semibold text-gray-800">{review.target.name}</span>. The target&apos;s average rating will
            be recalculated.
          </p>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <StarRow rating={review.rating} />
              <span className="text-xs font-medium text-gray-500">{review.rating}.0</span>
            </div>
            <p className="text-xs text-gray-500 italic line-clamp-2">&ldquo;{review.text}&rdquo;</p>
          </div>

          {/* Optional reason */}
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
            <button type="button" onClick={handleClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Hide Review
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Unhide Modal ─────────────────────────────────────────────────────────────

interface UnhideModalProps {
  review: Review | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function UnhideModal({ review, onClose, onConfirm }: UnhideModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  if (!review) return null;

  const handle = async () => {
    setIsLoading(true);
    try { await onConfirm(); } finally { setIsLoading(false); }
  };

  return (
    <ModalOverlay>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
          <h3 className="text-base font-semibold text-green-900">Unhide Review</h3>
          <button onClick={onClose} className="text-green-400 hover:text-green-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to unhide <span className="font-semibold text-gray-800">{review.reviewer.name}&apos;s</span> review
            for <span className="font-semibold text-gray-800">{review.target.name}</span>? The review will be restored to Visible status.
          </p>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <StarRow rating={review.rating} />
              <span className="text-xs font-medium text-gray-500">{review.rating}.0</span>
            </div>
            <p className="text-xs text-gray-500 italic line-clamp-2">&ldquo;{review.text}&rdquo;</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handle} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Unhide Review
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
