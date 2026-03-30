import { useState, useMemo } from "react";
import { Listing, ListingType, ListingStatus } from "./types";
import { generateMockListings } from "./mockData";
import { ListingTable } from "./ListingTable";
import { ListingSlideOver } from "./ListingSlideOver";
import { SuspendModal } from "./SuspendModal";
import { RemoveModal } from "./RemoveModal";
import {
  BookOpen, Building2, CheckCircle, XCircle, PauseCircle, Layers,
} from "lucide-react";
import { cn } from "../../../lib/utils";

/* ─────────────────────────────────────────────────────────
   Toast
───────────────────────────────────────────────────────── */
interface ToastMsg { id: number; type: "success" | "error" | "warn"; text: string }

function Toast({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white transition-all ${
          t.type === "success" ? "bg-emerald-600" : t.type === "warn" ? "bg-amber-600" : "bg-red-600"
        }`}>
          {t.type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
          {t.type === "warn"    && <PauseCircle className="w-4 h-4 shrink-0" />}
          {t.type === "error"   && <XCircle className="w-4 h-4 shrink-0" />}
          <span>{t.text}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Stat card
───────────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */
export function AdminListingsPage() {
  const [allListings, setAllListings] = useState<Listing[]>(() => generateMockListings());
  const [activeTab, setActiveTab] = useState<ListingType>("Training");

  // Slide-over
  const [slideOverListing, setSlideOverListing] = useState<Listing | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Suspend modal
  const [suspendTarget, setSuspendTarget] = useState<Listing | null>(null);

  // Remove modal
  const [removeTarget, setRemoveTarget] = useState<Listing | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  let _tc = 0;
  const addToast = (type: ToastMsg["type"], text: string) => {
    const id = Date.now() + _tc++;
    setToasts((p) => [...p, { id, type, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  };

  /* ── Filtered listings by tab ── */
  const listings = useMemo(() => allListings.filter((l) => l.type === activeTab), [allListings, activeTab]);

  /* ── Stats across all ── */
  const stats = useMemo(() => ({
    trainingTotal:  allListings.filter((l) => l.type === "Training").length,
    facilityTotal:  allListings.filter((l) => l.type === "Facility").length,
    active:    allListings.filter((l) => l.status === "Active").length,
    suspended: allListings.filter((l) => l.status === "Suspended").length,
    removed:   allListings.filter((l) => l.status === "Removed").length,
    inactive:  allListings.filter((l) => l.status === "Inactive").length,
  }), [allListings]);

  /* ── Helpers to update state ── */
  const updateListing = (updated: Listing) => {
    setAllListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    if (slideOverListing?.id === updated.id) setSlideOverListing(updated);
  };

  const appendAudit = (listing: Listing, action: any, reason?: string): Listing => ({
    ...listing,
    auditLog: [
      ...listing.auditLog,
      { id: `al-${Date.now()}`, action, adminName: "Super Admin", timestamp: new Date().toISOString(), reason },
    ],
  });

  /* ── Actions ── */
  const handleView = (l: Listing) => {
    setSlideOverListing(l);
    setIsSlideOverOpen(true);
  };

  const handleCloseSlideOver = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setSlideOverListing(null), 300);
  };

  /* BR-001 / BR-003: Suspend or unsuspend */
  const handleSuspendConfirm = (listing: Listing, reason: string) => {
    const isSuspended = listing.status === "Suspended";
    const newStatus: ListingStatus = isSuspended ? "Active" : "Suspended";
    const action = isSuspended ? "Unsuspended" : "Suspended";

    let updated: Listing = {
      ...listing,
      status: newStatus,
      suspendedReason: !isSuspended ? reason : undefined,
      suspendedAt:     !isSuspended ? new Date().toISOString() : undefined,
    };
    updated = appendAudit(updated, action, reason);
    updateListing(updated);
    setSuspendTarget(null);

    addToast(
      isSuspended ? "success" : "warn",
      isSuspended
        ? `"${listing.name}" reinstated. Provider notified.`
        : `"${listing.name}" suspended. Provider notified. ${listing.activeBookingsCount} existing booking(s) unaffected.`
    );
  };

  /* BR-002 / BR-003 / BR-004: Remove listing */
  const handleRemoveConfirm = (listing: Listing, reason: string) => {
    const totalRefund = listing.futureBookings.reduce((s, b) => s + b.amount, 0);
    const refundedBookings = listing.futureBookings.map((b) => ({ ...b, refunded: true }));

    let updated: Listing = {
      ...listing,
      status: "Removed",
      activeBookingsCount: 0,
      futureBookings: refundedBookings,
      removedReason: reason,
      removedAt: new Date().toISOString(),
    };
    updated = appendAudit(updated, "Removed", reason);
    updateListing(updated);
    setRemoveTarget(null);

    addToast(
      "error",
      listing.futureBookings.length > 0
        ? `"${listing.name}" removed. ${listing.futureBookings.length} booking(s) cancelled. $${totalRefund.toLocaleString()} refunded.`
        : `"${listing.name}" permanently removed. Provider notified.`
    );
  };

  /* ── Trigger modal from slide-over footer ── */
  const handleSuspendFromSlide = (l: Listing) => { setSuspendTarget(l); };
  const handleRemoveFromSlide  = (l: Listing) => { setRemoveTarget(l); };

  const TABS: { id: ListingType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "Training", label: "Training Listings", icon: <BookOpen className="w-4 h-4" />, count: stats.trainingTotal },
    { id: "Facility", label: "Facility Listings", icon: <Building2 className="w-4 h-4" />, count: stats.facilityTotal },
  ];

  return (
    <div className="flex flex-col h-full gap-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Listing Management</h1>
        <p className="text-gray-500 text-sm mt-1">View, suspend, and remove Training & Facility listings. Removal triggers full refunds for all future bookings.</p>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Training Listings" value={stats.trainingTotal} color="bg-violet-50" icon={<BookOpen className="w-4 h-4 text-violet-600" />} />
        <StatCard label="Facility Listings" value={stats.facilityTotal} color="bg-sky-50"    icon={<Building2 className="w-4 h-4 text-sky-600" />} />
        <StatCard label="Active"    value={stats.active}    color="bg-emerald-50" icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} />
        <StatCard label="Suspended" value={stats.suspended} color="bg-amber-50"   icon={<PauseCircle className="w-4 h-4 text-amber-600" />} />
        <StatCard label="Removed"   value={stats.removed}   color="bg-red-50"     icon={<XCircle className="w-4 h-4 text-red-600" />} />
      </div>

      {/* ── Type Tabs ── */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
              activeTab === t.id
                ? t.id === "Training"
                  ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                  : "bg-sky-600 text-white border-sky-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
            {t.icon}
            {t.label}
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold",
              activeTab === t.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600")}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 min-h-[500px]">
        <ListingTable
          listings={listings}
          onView={handleView}
          onSuspend={(l) => setSuspendTarget(l)}
          onRemove={(l) => setRemoveTarget(l)}
        />
      </div>

      {/* ── Slide-Over ── */}
      <ListingSlideOver
        listing={slideOverListing}
        isOpen={isSlideOverOpen}
        onClose={handleCloseSlideOver}
        onSuspend={handleSuspendFromSlide}
        onRemove={handleRemoveFromSlide}
      />

      {/* ── Suspend Modal ── */}
      {suspendTarget && (
        <SuspendModal
          listing={suspendTarget}
          onConfirm={handleSuspendConfirm}
          onClose={() => setSuspendTarget(null)}
        />
      )}

      {/* ── Remove Modal ── */}
      {removeTarget && (
        <RemoveModal
          listing={removeTarget}
          onConfirm={handleRemoveConfirm}
          onClose={() => setRemoveTarget(null)}
        />
      )}

      {/* ── Toasts ── */}
      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
