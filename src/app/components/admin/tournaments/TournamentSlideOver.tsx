import { useState } from "react";
import { Tournament, TournamentStatus, AdminNote, AuditEntry } from "./types";
import {
  X, Calendar, MapPin, User, Mail, Phone, DollarSign, Clock, ShieldCheck,
  Trophy, AlertTriangle, CheckCircle, RefreshCw, StickyNote, ClipboardList,
  ChevronDown, ChevronUp, Wallet, Users, Lock, XCircle, Info,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";

interface TournamentSlideOverProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  onForceCancelFromSlide: (tournament: Tournament, reason: string) => void;
  onOverrideStatus: (tournament: Tournament, newStatus: TournamentStatus, reason: string) => void;
  onAddNote: (tournament: Tournament, note: string) => void;
}

type Tab = "overview" | "attendees" | "financials" | "admin" | "audit";

const OVERRIDABLE_STATUSES: TournamentStatus[] = ["Active", "Full", "Confirmed", "Completed", "Expired", "Cancelled"];

const STATUS_STYLES: Record<TournamentStatus, string> = {
  Active: "bg-green-100 text-green-800",
  Full: "bg-blue-100 text-blue-800",
  Confirmed: "bg-indigo-100 text-indigo-800",
  Completed: "bg-gray-100 text-gray-800",
  Cancelled: "bg-red-100 text-red-800",
  Expired: "bg-orange-100 text-orange-800",
};

const PAYMENT_STYLES = {
  Paid: "bg-green-50 text-green-700 border-green-100",
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
  Refunded: "bg-purple-50 text-purple-700 border-purple-100",
};

export function TournamentSlideOver({
  tournament,
  isOpen,
  onClose,
  onForceCancelFromSlide,
  onOverrideStatus,
  onAddNote,
}: TournamentSlideOverProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Force-cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState("");

  // Override status modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<TournamentStatus>("Completed");
  const [overrideReason, setOverrideReason] = useState("");

  // Add note state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");

  if (!tournament) return null;

  const isCancellable = !["Cancelled", "Completed", "Expired"].includes(tournament.status);

  const handleForceCancelSubmit = () => {
    if (!cancelReason.trim() || cancelConfirm !== "CANCEL") return;
    onForceCancelFromSlide(tournament, cancelReason.trim());
    setShowCancelModal(false);
    setCancelReason("");
    setCancelConfirm("");
  };

  const handleOverrideSubmit = () => {
    if (!overrideReason.trim()) return;
    onOverrideStatus(tournament, overrideStatus, overrideReason.trim());
    setShowOverrideModal(false);
    setOverrideReason("");
  };

  const handleNoteSubmit = () => {
    if (!noteText.trim()) return;
    onAddNote(tournament, noteText.trim());
    setNoteText("");
    setShowNoteForm(false);
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: "attendees", label: `Attendees (${tournament.currentPlayers})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: "financials", label: "Financials", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: "admin", label: "Admin Actions", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: "audit", label: "Audit Log", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-[580px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/70 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{tournament.id}</span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[tournament.status]}`}>
                {tournament.status}
              </span>
              {tournament.status === "Cancelled" && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <Lock className="w-3 h-3" /> Force Cancelled
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-gray-900 leading-tight truncate">{tournament.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {tournament.city} · {format(new Date(tournament.date), "MMM d, yyyy")}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-200 shrink-0 bg-white overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "admin" && (
                <span className="ml-0.5 w-2 h-2 rounded-full bg-amber-400 inline-block" title="Admin actions available" />
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* ─ Overview ─ */}
          {activeTab === "overview" && (
            <div className="p-6 space-y-6">
              {/* Tournament basics */}
              <section>
                <SectionHeading icon={<Trophy className="w-4 h-4 text-gray-400" />} title="Tournament Info" />
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <InfoGrid items={[
                    { label: "Sport", value: <BadgeSport sport={tournament.sport} /> },
                    { label: "Level", value: <span className="text-sm font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 inline-block">{tournament.level}</span> },
                    { label: "Format", value: tournament.rules.format },
                    { label: "Gender", value: tournament.rules.gender },
                    { label: "Age Category", value: tournament.rules.ageCategory },
                    { label: "Equipment", value: tournament.rules.equipment },
                  ]} />
                </div>
              </section>

              {/* Host & Venue */}
              <section>
                <SectionHeading icon={<ShieldCheck className="w-4 h-4 text-gray-400" />} title="Host & Venue" />
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={tournament.host.avatar} alt={tournament.host.name} className="w-10 h-10 rounded-full border border-gray-200 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Organized by</p>
                      <p className="font-medium text-gray-900">{tournament.host.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <a href={`mailto:${tournament.host.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Mail className="w-3 h-3" />{tournament.host.email}</a>
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{tournament.host.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex items-start gap-3">
                    <div className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Venue</p>
                      <p className="font-medium text-gray-900">{tournament.facility.name} — {tournament.facility.court}</p>
                      <p className="text-sm text-gray-600">{tournament.facility.address}</p>
                      <a href={tournament.facility.mapLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">View on Map →</a>
                    </div>
                  </div>
                </div>
              </section>

              {/* Date & Players overview */}
              <section>
                <SectionHeading icon={<Calendar className="w-4 h-4 text-gray-400" />} title="Schedule & Capacity" />
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <InfoGrid items={[
                    { label: "Date", value: format(new Date(tournament.date), "MMMM d, yyyy") },
                    { label: "Time", value: format(new Date(tournament.date), "h:mm a") },
                    { label: "Players", value: `${tournament.currentPlayers} / ${tournament.maxPlayers} (min: ${tournament.minPlayers})` },
                    { label: "Facility Booking", value: <span className={`text-xs font-semibold ${tournament.facilityBookingStatus === "Confirmed" ? "text-green-600" : "text-yellow-600"}`}>{tournament.facilityBookingStatus}</span> },
                    { label: "Created", value: format(new Date(tournament.createdAt), "MMM d, yyyy") },
                  ]} />
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Fill rate</span>
                      <span>{Math.round((tournament.currentPlayers / tournament.maxPlayers) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={cn("h-2 rounded-full transition-all", tournament.currentPlayers === tournament.maxPlayers ? "bg-blue-600" : "bg-emerald-500")}
                        style={{ width: `${Math.min(100, (tournament.currentPlayers / tournament.maxPlayers) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Timeline */}
              <section>
                <SectionHeading icon={<Clock className="w-4 h-4 text-gray-400" />} title="Timeline" />
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-5 pb-1">
                  {tournament.timeline.map((event, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-blue-500" />
                      <p className="text-sm font-semibold text-gray-900">{event.status}</p>
                      <p className="text-xs text-gray-500">{format(new Date(event.timestamp), "MMM d, yyyy · h:mm a")}</p>
                      {event.note && <p className="text-xs text-gray-400 italic mt-0.5">{event.note}</p>}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ─ Attendees ─ */}
          {activeTab === "attendees" && (
            <div className="p-6">
              <SectionHeading icon={<Users className="w-4 h-4 text-gray-400" />} title={`Attendee List (${tournament.currentPlayers}/${tournament.maxPlayers})`} />
              {tournament.players.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left">Player</th>
                        <th className="px-4 py-3 text-left">Join Date</th>
                        <th className="px-4 py-3 text-center">Payment</th>
                        <th className="px-4 py-3 text-center">Booking Type</th>
                        <th className="px-4 py-3 text-right">Wallet Hold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {tournament.players.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                                {p.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {format(new Date(p.joinDate), "MMM d, yyyy")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${PAYMENT_STYLES[p.paymentStatus]}`}>
                              {p.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", p.bookingType === "Confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                              {p.bookingType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs">
                            {p.walletHold > 0 ? (
                              <span className="font-semibold text-amber-700">${p.walletHold}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <User className="w-10 h-10 text-gray-200 mb-3 mx-auto" />
                  <p className="font-medium text-gray-500">No attendees yet</p>
                </div>
              )}
            </div>
          )}

          {/* ─ Financials ─ */}
          {activeTab === "financials" && (
            <div className="p-6 space-y-5">
              <SectionHeading icon={<DollarSign className="w-4 h-4 text-gray-400" />} title="Financial Summary" />

              <div className="grid grid-cols-2 gap-3">
                <FinStat label="Entry Fee" value={`$${tournament.financials.entryFee}`} sub="per player" />
                <FinStat label="Total Collected" value={`$${tournament.financials.totalCollected.toLocaleString()}`} sub="from paid entries" color="text-emerald-600" />
                <FinStat label="Wallet Holds" value={`$${tournament.financials.totalWalletHolds.toLocaleString()}`} sub="tentative players" color="text-amber-600" icon={<Wallet className="w-4 h-4 text-amber-500" />} />
                <FinStat label="Platform Commission" value={`$${tournament.financials.platformCommission.toFixed(2)}`} sub="10% of collected" color="text-blue-600" />
              </div>

              {/* Breakdown table */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-white border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Revenue Breakdown</p>
                </div>
                <div className="divide-y divide-gray-100">
                  <FinRow label="Total Collected (Paid)" value={`+$${tournament.financials.totalCollected.toLocaleString()}`} valueClass="text-emerald-600" />
                  <FinRow label="Wallet Holds (Tentative)" value={`$${tournament.financials.totalWalletHolds.toLocaleString()}`} valueClass="text-amber-600" />
                  <FinRow label="Facility Cost" value={`-$${tournament.financials.facilityCost.toLocaleString()}`} valueClass="text-red-600" />
                  <FinRow label="Platform Commission (10%)" value={`+$${tournament.financials.platformCommission.toFixed(2)}`} valueClass="text-blue-600" />
                  <FinRow label="Net Revenue (Platform)" value={`$${(tournament.financials.platformCommission - tournament.financials.facilityCost).toFixed(2)}`} valueClass="font-bold text-gray-900" bold />
                </div>
              </div>

              {tournament.status === "Cancelled" && tournament.financials.refundedAmount > 0 && (
                <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                  <RefreshCw className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800">Refunds Processed</p>
                    <p className="text-sm text-purple-700 mt-0.5">
                      All attendees refunded. Total: <strong>${tournament.financials.refundedAmount.toLocaleString()}</strong>
                    </p>
                    <p className="text-xs text-purple-500 mt-1">Wallet holds released · Confirmed payments returned to wallet</p>
                  </div>
                </div>
              )}

              {/* Players payment breakdown */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Payment Status Breakdown</p>
                <div className="flex flex-col gap-2">
                  {(["Paid", "Pending", "Refunded"] as const).map((status) => {
                    const count = tournament.players.filter((p) => p.paymentStatus === status).length;
                    return count > 0 ? (
                      <div key={status} className="flex items-center gap-3">
                        <span className={`w-24 text-xs font-medium px-2 py-0.5 rounded-full border text-center ${PAYMENT_STYLES[status]}`}>{status}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={cn("h-2 rounded-full", status === "Paid" ? "bg-emerald-500" : status === "Refunded" ? "bg-purple-500" : "bg-yellow-400")}
                            style={{ width: `${tournament.currentPlayers ? (count / tournament.currentPlayers) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium w-6 text-right">{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─ Admin Actions ─ */}
          {activeTab === "admin" && (
            <div className="p-6 space-y-5">
              <SectionHeading icon={<ShieldCheck className="w-4 h-4 text-gray-400" />} title="Admin Actions" />

              {/* Force Cancel */}
              <div className={cn("border rounded-xl overflow-hidden", isCancellable ? "border-red-200" : "border-gray-200")}>
                <div className={cn("px-4 py-3 flex items-center justify-between", isCancellable ? "bg-red-50" : "bg-gray-50")}>
                  <div className="flex items-center gap-2">
                    <XCircle className={cn("w-5 h-5", isCancellable ? "text-red-600" : "text-gray-400")} />
                    <p className={cn("text-sm font-semibold", isCancellable ? "text-red-800" : "text-gray-500")}>Force-Cancel Tournament</p>
                  </div>
                  {!isCancellable && (
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Not applicable</span>
                  )}
                </div>
                <div className="px-4 py-3 bg-white">
                  <p className="text-sm text-gray-600 mb-3">
                    {isCancellable
                      ? "Force-cancelling will immediately cancel this tournament, trigger full refunds to all attendees (wallet holds released, confirmed payments returned to wallet), and notify all participants."
                      : `This tournament is already ${tournament.status} and cannot be force-cancelled.`}
                  </p>
                  {isCancellable && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Force-Cancel Now
                    </button>
                  )}
                </div>
              </div>

              {/* Override Status */}
              <div className="border border-amber-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-amber-50 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">Override Tournament Status</p>
                </div>
                <div className="px-4 py-3 bg-white">
                  <p className="text-sm text-gray-600 mb-3">Manually change the tournament status for operational reasons. A mandatory reason must be logged (BR-002).</p>
                  <div className="flex gap-2">
                    <select
                      className="text-sm border border-gray-300 rounded-lg py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
                      value={overrideStatus}
                      onChange={(e) => setOverrideStatus(e.target.value as TournamentStatus)}
                    >
                      {OVERRIDABLE_STATUSES.filter((s) => s !== tournament.status).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowOverrideModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Override
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Note */}
              <div className="border border-blue-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-800">Admin Notes ({tournament.adminNotes.length})</p>
                  </div>
                  <button
                    onClick={() => setShowNoteForm((v) => !v)}
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                  >
                    {showNoteForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showNoteForm ? "Cancel" : "Add Note"}
                  </button>
                </div>
                <div className="bg-white">
                  {showNoteForm && (
                    <div className="px-4 py-3 border-b border-blue-100">
                      <textarea
                        rows={3}
                        className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Add an internal admin note…"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <button
                        onClick={handleNoteSubmit}
                        disabled={!noteText.trim()}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Save Note
                      </button>
                    </div>
                  )}
                  {tournament.adminNotes.length > 0 ? (
                    <ul className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                      {[...tournament.adminNotes].reverse().map((note) => (
                        <li key={note.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700">{note.adminName}</span>
                            <span className="text-xs text-gray-400">{format(new Date(note.timestamp), "MMM d, yyyy")}</span>
                          </div>
                          <p className="text-sm text-gray-600">{note.note}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    !showNoteForm && <p className="text-sm text-gray-400 px-4 py-4 text-center">No admin notes yet.</p>
                  )}
                </div>
              </div>

              {/* BR-003 note */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500">All admin actions on this tournament are logged in the Audit Log tab and in the platform-wide Audit Trail (BR-003).</p>
              </div>
            </div>
          )}

          {/* ─ Audit Log ─ */}
          {activeTab === "audit" && (
            <div className="p-6">
              <SectionHeading icon={<ClipboardList className="w-4 h-4 text-gray-400" />} title="Audit Trail" />
              {tournament.auditLog.length > 0 ? (
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-5 pb-1">
                  {[...tournament.auditLog].reverse().map((entry) => (
                    <AuditItem key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <ClipboardList className="w-10 h-10 text-gray-200 mb-3 mx-auto" />
                  <p className="text-sm">No audit entries yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          Force-Cancel Confirm Modal
      ═══════════════════════════════════════════════════ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Force-Cancel Tournament?</h3>
                <p className="text-xs text-gray-500">{tournament.name}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Consequences */}
              <div className="space-y-2">
                {[
                  `All ${tournament.currentPlayers} attendees will receive full refunds`,
                  "Wallet holds will be released immediately",
                  "Confirmed payments will be returned to player wallets",
                  "All attendees will receive a cancellation notification",
                  "This action will be logged in the audit trail",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>

              {/* Financial summary */}
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm">
                <p className="font-semibold text-red-800 mb-1">Refund Estimate</p>
                <div className="flex justify-between text-red-700">
                  <span>Confirmed payments:</span>
                  <strong>${tournament.financials.totalCollected.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>Wallet holds to release:</span>
                  <strong>${tournament.financials.totalWalletHolds.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-red-800 font-bold border-t border-red-200 pt-1 mt-1">
                  <span>Total refunded:</span>
                  <span>${(tournament.financials.totalCollected + tournament.financials.totalWalletHolds).toLocaleString()}</span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for cancellation <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="e.g. Fraudulent tournament detected; host violated platform terms"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              {/* Confirmation input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <strong className="font-mono text-red-700">CANCEL</strong> to confirm
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="CANCEL"
                  value={cancelConfirm}
                  onChange={(e) => setCancelConfirm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); setCancelConfirm(""); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={handleForceCancelSubmit}
                disabled={!cancelReason.trim() || cancelConfirm !== "CANCEL"}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Confirm Force-Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          Override Status Modal
      ═══════════════════════════════════════════════════ */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowOverrideModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-amber-100 rounded-full">
                <RefreshCw className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Override Tournament Status</h3>
                <p className="text-xs text-gray-500">{tournament.name}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[tournament.status]}`}>{tournament.status}</span>
                <span className="text-gray-400">→</span>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[overrideStatus]}`}>{overrideStatus}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Override reason <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  placeholder="Provide a mandatory reason for this status override (BR-002)"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                This action and reason will be logged in the audit trail per BR-002.
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button
                onClick={() => { setShowOverrideModal(false); setOverrideReason(""); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={!overrideReason.trim()}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Helper sub-components ─── */

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
      {icon} {title}
    </h3>
  );
}

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <span className="text-xs text-gray-400 uppercase tracking-wide block mb-0.5">{item.label}</span>
          <span className="text-sm text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function FinStat({ label, value, sub, color = "text-gray-900", icon }: { label: string; value: string; sub?: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">{icon}{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FinRow({ label, value, valueClass = "text-gray-700", bold = false }: { label: string; value: string; valueClass?: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between px-4 py-2.5 text-sm", bold && "bg-gray-50")}>
      <span className={bold ? "font-semibold text-gray-700" : "text-gray-600"}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function BadgeSport({ sport }: { sport: string }) {
  const SPORT_STYLES: Record<string, string> = {
    Tennis: "bg-orange-50 text-orange-700 border-orange-100",
    Padel: "bg-blue-50 text-blue-700 border-blue-100",
    Badminton: "bg-green-50 text-green-700 border-green-100",
    Pickleball: "bg-purple-50 text-purple-700 border-purple-100",
    Squash: "bg-yellow-50 text-yellow-700 border-yellow-100",
  };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded border ${SPORT_STYLES[sport] ?? "bg-gray-100 text-gray-700 border-gray-200"} inline-block`}>{sport}</span>;
}

function AuditItem({ entry }: { entry: AuditEntry }) {
  const COLORS: Record<string, string> = {
    "Force Cancelled": "bg-red-500",
    "Status Overridden": "bg-amber-500",
    "Note Added": "bg-blue-500",
    Viewed: "bg-gray-400",
    Created: "bg-green-500",
  };

  const COLOR_TEXT: Record<string, string> = {
    "Force Cancelled": "text-red-700 bg-red-50 border-red-100",
    "Status Overridden": "text-amber-700 bg-amber-50 border-amber-100",
    "Note Added": "text-blue-700 bg-blue-50 border-blue-100",
    Viewed: "text-gray-600 bg-gray-50 border-gray-100",
    Created: "text-green-700 bg-green-50 border-green-100",
  };

  return (
    <div className="relative pl-7">
      <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white ${COLORS[entry.action] ?? "bg-gray-400"}`} />
      <div className="flex items-start justify-between gap-2">
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${COLOR_TEXT[entry.action]}`}>{entry.action}</span>
        <span className="text-xs text-gray-400 shrink-0">{format(new Date(entry.timestamp), "MMM d, yyyy · h:mm a")}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">By <strong className="text-gray-700">{entry.adminName}</strong></p>
      {entry.fromStatus && entry.toStatus && (
        <p className="text-xs text-gray-500 mt-0.5">{entry.fromStatus} → {entry.toStatus}</p>
      )}
      {entry.reason && <p className="text-xs text-gray-500 italic mt-0.5">Reason: {entry.reason}</p>}
      {entry.note && <p className="text-xs text-gray-500 italic mt-0.5">Note: {entry.note}</p>}
    </div>
  );
}
