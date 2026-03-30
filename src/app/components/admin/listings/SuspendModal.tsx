import { useState } from "react";
import { Listing } from "./types";
import { PauseCircle, PlayCircle, AlertTriangle, Mail, BookOpen, Info } from "lucide-react";
import { cn } from "../../../lib/utils";

interface SuspendModalProps {
  listing: Listing;
  onConfirm: (listing: Listing, reason: string) => void;
  onClose: () => void;
}

const QUICK_REASONS_SUSPEND = [
  "Policy violation reported by users",
  "Safety certificate expired",
  "Content does not meet platform standards",
  "Under investigation",
  "Provider account suspended",
];

const QUICK_REASONS_UNSUSPEND = [
  "Issue resolved by provider",
  "Investigation concluded — no violations found",
  "Safety certificate renewed",
  "Provider compliance confirmed",
];

export function SuspendModal({ listing, onConfirm, onClose }: SuspendModalProps) {
  const [reason, setReason] = useState("");
  const isUnsuspend = listing.status === "Suspended";

  const quickReasons = isUnsuspend ? QUICK_REASONS_UNSUSPEND : QUICK_REASONS_SUSPEND;

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onConfirm(listing, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className={cn("p-2.5 rounded-full", isUnsuspend ? "bg-emerald-100" : "bg-amber-100")}>
            {isUnsuspend
              ? <PlayCircle className="w-5 h-5 text-emerald-600" />
              : <PauseCircle className="w-5 h-5 text-amber-600" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isUnsuspend ? "Unsuspend Listing" : "Suspend Listing"}
            </h3>
            <p className="text-sm text-gray-500 truncate max-w-sm">{listing.name}</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Thumbnail + info */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <img src={listing.thumbnailUrl} alt={listing.name} className="w-20 h-14 object-cover rounded-lg border border-gray-200 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{listing.name}</p>
              <p className="text-sm text-gray-500">{listing.provider.name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" /> {listing.provider.email}
              </p>
            </div>
          </div>

          {/* What happens */}
          <div className={cn("p-4 rounded-xl border space-y-2", isUnsuspend ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100")}>
            <p className={cn("text-sm font-semibold", isUnsuspend ? "text-emerald-800" : "text-amber-800")}>
              {isUnsuspend ? "What will happen:" : "What will happen (BR-001, BR-003):"}
            </p>
            {isUnsuspend ? (
              <ul className="space-y-1.5">
                {[
                  "Listing will become visible to players again",
                  "Provider will be notified of reinstatement",
                  "Existing bookings remain unaffected",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                    <PlayCircle className="w-4 h-4 mt-0.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-1.5">
                {[
                  `"${listing.name}" will be hidden from players immediately`,
                  `${listing.activeBookingsCount} existing confirmed booking${listing.activeBookingsCount !== 1 ? "s" : ""} will NOT be cancelled`,
                  `Provider (${listing.provider.name}) will be notified with the reason provided`,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick-select reasons */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick reasons:</p>
            <div className="flex flex-wrap gap-2">
              {quickReasons.map((r) => (
                <button key={r} onClick={() => setReason(r)}
                  className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors", reason === r ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-700")}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Reason input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isUnsuspend ? "Reason for reinstatement" : "Reason for suspension"} <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder={isUnsuspend ? "Explain why this listing is being reinstated…" : "Explain why this listing is being suspended (will be shared with provider)…"}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          </div>

          {/* Provider notification note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            Provider notification: <strong className="ml-1">"Your listing [{listing.name}] has been {isUnsuspend ? "reinstated" : "suspended"}. Reason: [your reason]."</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!reason.trim()}
            className={cn("flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed",
              isUnsuspend ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700")}>
            {isUnsuspend
              ? <><PlayCircle className="w-4 h-4" /> Confirm Reinstatement</>
              : <><PauseCircle className="w-4 h-4" /> Confirm Suspension</>}
          </button>
        </div>
      </div>
    </div>
  );
}
