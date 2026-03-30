import { useState } from "react";
import { Listing } from "./types";
import {
  X, MapPin, Mail, Phone, Star, Calendar, BookOpen, Building2,
  Users, DollarSign, ClipboardList, ShieldOff, PauseCircle, Trash2, Info,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import { STATUS_STYLES } from "./ListingTable";

interface ListingSlideOverProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onSuspend: (l: Listing) => void;
  onRemove: (l: Listing) => void;
}

type Tab = "overview" | "bookings" | "audit";

const AUDIT_COLORS: Record<string, string> = {
  Created:     "bg-green-500",
  Suspended:   "bg-amber-500",
  Unsuspended: "bg-blue-500",
  Removed:     "bg-red-500",
  Viewed:      "bg-gray-400",
};

const AUDIT_BADGE: Record<string, string> = {
  Created:     "bg-green-50 text-green-700 border-green-100",
  Suspended:   "bg-amber-50 text-amber-700 border-amber-100",
  Unsuspended: "bg-blue-50 text-blue-700 border-blue-100",
  Removed:     "bg-red-50 text-red-700 border-red-100",
  Viewed:      "bg-gray-50 text-gray-600 border-gray-100",
};

export function ListingSlideOver({ listing, isOpen, onClose, onSuspend, onRemove }: ListingSlideOverProps) {
  const [tab, setTab] = useState<Tab>("overview");

  if (!listing) return null;

  const isSuspended = listing.status === "Suspended";
  const isRemoved = listing.status === "Removed";
  const canSuspend = listing.status === "Active" || listing.status === "Inactive";
  const canRemove = !isRemoved;
  const totalRefund = listing.futureBookings.reduce((s, b) => s + b.amount, 0);

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "bookings", label: `Bookings (${listing.activeBookingsCount})` },
    { id: "audit",    label: `Audit Log (${listing.auditLog.length})` },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className={cn("fixed inset-0 bg-black/40 z-40 transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={onClose} />

      {/* Panel */}
      <div className={cn("fixed inset-y-0 right-0 z-50 w-full max-w-[560px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out", isOpen ? "translate-x-0" : "translate-x-full")}>

        {/* ── Header ── */}
        <div className="shrink-0 border-b border-gray-200 bg-gray-50/70">
          {/* Thumbnail banner */}
          <div className="relative h-32 overflow-hidden">
            <img src={listing.thumbnailUrl} alt={listing.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4 right-12 flex items-end gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={cn("px-2 py-0.5 text-xs font-bold rounded-full", STATUS_STYLES[listing.status])}>{listing.status}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide", listing.type === "Training" ? "bg-violet-500/80 text-white" : "bg-sky-500/80 text-white")}>
                    {listing.type}
                  </span>
                </div>
                <h2 className="text-white font-bold text-base leading-tight drop-shadow">{listing.name}</h2>
                <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{listing.city}</p>
              </div>
            </div>
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="px-5 py-2 flex items-center gap-2">
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{listing.id}</span>
            {listing.rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <strong>{listing.rating}</strong> <span className="text-gray-400">({listing.reviewCount} reviews)</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-200 shrink-0 bg-white">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex-1 py-3 text-xs font-medium border-b-2 transition-colors", tab === t.id ? "border-blue-600 text-blue-700 bg-blue-50/40" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50")}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ─ Overview ─ */}
          {tab === "overview" && (
            <div className="p-5 space-y-5">
              {/* Suspension / Removal notice */}
              {(isSuspended || isRemoved) && (
                <div className={cn("flex items-start gap-3 p-4 rounded-xl border", isRemoved ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
                  {isRemoved ? <Trash2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /> : <PauseCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className={cn("text-sm font-semibold", isRemoved ? "text-red-800" : "text-amber-800")}>
                      {isRemoved ? "Permanently Removed" : "Suspended by Admin"}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">{isRemoved ? listing.removedReason : listing.suspendedReason}</p>
                    {(listing.suspendedAt || listing.removedAt) && (
                      <p className="text-xs text-gray-400 mt-1">{format(new Date((listing.removedAt || listing.suspendedAt)!), "MMM d, yyyy · h:mm a")}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <section>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{listing.description}</p>
              </section>

              {/* Provider */}
              <section>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Provider</p>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <img src={listing.provider.avatar} alt={listing.provider.name} className="w-10 h-10 rounded-full border border-gray-200 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{listing.provider.name}</p>
                    <a href={`mailto:${listing.provider.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{listing.provider.email}</a>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3.5 h-3.5" />{listing.provider.phone}</p>
                  </div>
                </div>
              </section>

              {/* Details grid */}
              <section>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Listing Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Sport", value: listing.sport },
                    { label: "City", value: listing.city },
                    { label: "Type", value: listing.type },
                    { label: "Status", value: listing.status },
                    ...(listing.level ? [{ label: "Level", value: listing.level }] : []),
                    ...(listing.enrolledCount !== undefined ? [{ label: "Enrolled", value: String(listing.enrolledCount) }] : []),
                    ...(listing.batchCount !== undefined ? [{ label: "Batches", value: String(listing.batchCount) }] : []),
                    ...(listing.facilityType ? [{ label: "Facility Type", value: listing.facilityType }] : []),
                    ...(listing.courtsCount !== undefined ? [{ label: "Courts", value: String(listing.courtsCount) }] : []),
                    { label: "Created", value: format(new Date(listing.createdAt), "MMM d, yyyy") },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Financial snapshot */}
              <section>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Financial Snapshot</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-500 uppercase tracking-wide mb-1 flex items-center gap-1"><BookOpen className="w-3 h-3" />Active Bookings</p>
                    <p className="text-2xl font-bold text-blue-700">{listing.activeBookingsCount}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <p className="text-xs text-emerald-500 uppercase tracking-wide mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" />Est. Refund if Removed</p>
                    <p className="text-2xl font-bold text-emerald-700">${totalRefund.toLocaleString()}</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ─ Bookings ─ */}
          {tab === "bookings" && (
            <div className="p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Future Bookings ({listing.futureBookings.length})</p>
              {listing.futureBookings.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Player</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {listing.futureBookings.map((b) => (
                        <tr key={b.id} className={cn("hover:bg-gray-50", b.refunded && "bg-purple-50/40")}>
                          <td className="px-4 py-3 font-medium text-gray-900">{b.playerName}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(b.date), "MMM d, yyyy")}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">${b.amount}</td>
                          <td className="px-4 py-3 text-center">
                            {b.refunded ? (
                              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">Refunded</span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalRefund > 0 && !isRemoved && (
                    <div className="flex justify-between px-4 py-3 bg-amber-50 border-t border-amber-100 text-sm">
                      <span className="font-semibold text-amber-800">Total (if removed)</span>
                      <span className="font-bold text-amber-800">${totalRefund.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="w-10 h-10 text-gray-200 mb-3 mx-auto" />
                  <p className="font-medium text-gray-500">No active bookings</p>
                </div>
              )}
            </div>
          )}

          {/* ─ Audit Log ─ */}
          {tab === "audit" && (
            <div className="p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Audit Trail</p>
              {listing.auditLog.length > 0 ? (
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-5 pb-1">
                  {[...listing.auditLog].reverse().map((entry) => (
                    <div key={entry.id} className="relative pl-7">
                      <div className={cn("absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white", AUDIT_COLORS[entry.action] ?? "bg-gray-400")} />
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <span className={cn("px-2 py-0.5 text-xs font-semibold rounded-full border", AUDIT_BADGE[entry.action])}>{entry.action}</span>
                        <span className="text-xs text-gray-400">{format(new Date(entry.timestamp), "MMM d, yyyy · h:mm a")}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">By <strong className="text-gray-700">{entry.adminName}</strong></p>
                      {entry.reason && <p className="text-xs text-gray-500 italic mt-0.5">Reason: {entry.reason}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <ClipboardList className="w-10 h-10 text-gray-200 mb-3 mx-auto" />
                  <p className="text-sm">No audit entries.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="shrink-0 border-t border-gray-200 px-5 py-4 bg-gray-50 flex items-center gap-2 flex-wrap">
          {(canSuspend || isSuspended) && (
            <button onClick={() => onSuspend(listing)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isSuspended ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200")}>
              <PauseCircle className="w-4 h-4" />
              {isSuspended ? "Unsuspend Listing" : "Suspend Listing"}
            </button>
          )}
          {canRemove && (
            <button onClick={() => onRemove(listing)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              <Trash2 className="w-4 h-4" /> Remove Listing
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </>
  );
}
