import { useState } from "react";
import { Listing } from "./types";
import { Trash2, AlertTriangle, CheckCircle, Mail, Lock, Info } from "lucide-react";

interface RemoveModalProps {
  listing: Listing;
  onConfirm: (listing: Listing, reason: string) => void;
  onClose: () => void;
}

const QUICK_REASONS = [
  "Provider verified as fraudulent",
  "Repeated safety violations",
  "Illegal content or services offered",
  "Severe policy breach — permanent ban required",
  "Provider requested permanent removal",
];

export function RemoveModal({ listing, onConfirm, onClose }: RemoveModalProps) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const totalRefund = listing.futureBookings.reduce((sum, b) => sum + b.amount, 0);
  const isReady = reason.trim() && confirmText === "REMOVE";

  const handleSubmit = () => {
    if (!isReady) return;
    onConfirm(listing, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="p-2.5 rounded-full bg-red-100">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Permanently Remove Listing</h3>
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

          {/* Consequences — BR-002, BR-003, BR-004 */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Irreversible Consequences (BR-002, BR-003, BR-004)
            </p>
            <ul className="space-y-1.5">
              {[
                `All ${listing.activeBookingsCount} future booking${listing.activeBookingsCount !== 1 ? "s" : ""} will be immediately cancelled`,
                `All affected players will receive full refunds (total: $${totalRefund.toLocaleString()})`,
                `All affected players will receive cancellation notifications`,
                `Provider (${listing.provider.name}) will be notified with the removal reason`,
                "This listing cannot be reinstated — provider must create a new listing",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Future bookings summary */}
          {listing.futureBookings.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Future Bookings to Refund ({listing.futureBookings.length})</p>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-gray-100">
                {listing.futureBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="text-gray-700">{b.playerName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">{new Date(b.date).toLocaleDateString()}</span>
                      <span className="font-semibold text-emerald-700">${b.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-4 py-2.5 bg-red-50 border-t border-red-100">
                <span className="text-sm font-semibold text-red-800">Total refunds</span>
                <span className="text-sm font-bold text-red-800">${totalRefund.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Provider notification note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            Provider notification: <strong className="ml-1">"Your listing [{listing.name}] has been permanently removed. Reason: [your reason]."</strong>
          </div>

          {/* Quick reasons */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick reasons:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${reason === r ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-300 hover:border-red-400 hover:text-red-700"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for removal <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this listing is being permanently removed (will be shared with provider)…"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
          </div>

          {/* Typed confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <strong className="font-mono text-red-700">REMOVE</strong> to confirm permanent removal
            </label>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
              placeholder="REMOVE"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>

          {/* BR-004 warning */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            Per BR-004: Removed listings cannot be reinstated. The provider must create a new listing to return to the platform.
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6 sticky bottom-0 bg-white pt-2 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!isReady}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Permanently Remove
          </button>
        </div>
      </div>
    </div>
  );
}
