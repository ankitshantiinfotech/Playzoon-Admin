// ─── SCR-ADM-024: Training Detail (Admin View) ───────────────────
// Full read-only detail of a single training programme.
// Two-column layout: left (60%) config/pricing/schedule, right (40%) provider/stats/earnings.
// Reviews summary + Audit trail full-width at bottom.
// Admin can toggle Active/Inactive status.

import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Star,
  Users,
  Building2,
  MapPin,
  Dumbbell,
  Calendar,
  Clock,
  Banknote,
  ShieldCheck,
  Gift,
  TrendingUp,
  Info,
  CalendarDays,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import {
  Training,
  TrainingStatus,
  TrainingType,
  FullCourseBatch,
  PerSessionSlot,
  SubscriptionPlan,
  BatchStatus,
} from "./types";
import { MOCK_TRAININGS } from "./mockData";

// ─── Badges ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: TrainingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border",
        status === "Active"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-gray-100 text-gray-500 border-gray-200",
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          status === "Active" ? "bg-emerald-500" : "bg-gray-400",
        )}
      />
      {status}
    </span>
  );
}

function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const s: Record<BatchStatus, string> = {
    Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Full: "bg-amber-50 text-amber-700 border-amber-200",
    Completed: "bg-blue-50 text-blue-700 border-blue-200",
    Cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={cn(
        "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
        s[status],
      )}
    >
      {status}
    </span>
  );
}

// ─── Card wrapper ────────────────────────────────────────────

function Card({
  icon: Icon,
  title,
  children,
  ariaLabel,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  ariaLabel?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
      role="region"
      aria-label={ariaLabel || title}
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#003B95]/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-[#003B95]" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        </div>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Info row ────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-gray-900">
        {value || <span className="text-gray-300">--</span>}
      </span>
    </div>
  );
}

// ─── Status toggle confirm modal ─────────────────────────────

function ConfirmModal({
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
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4",
            toActive ? "bg-emerald-50" : "bg-amber-50",
          )}
        >
          {toActive ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          )}
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
            This training has {training.earnings.activeBookings} upcoming
            bookings. Existing bookings will be honored.
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
                : "bg-red-600 hover:bg-red-700",
            )}
          >
            {toActive ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Star Rating Display ─────────────────────────────────────

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200 fill-gray-200",
          )}
        />
      ))}
    </div>
  );
}

// ─── Rating Bar ──────────────────────────────────────────────

function RatingBar({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-12">
        {stars} star{stars !== 1 ? "s" : ""}
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
    </div>
  );
}

// ─── Formatting ──────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Main Component ─────────────────────────────────────────

interface Props {
  trainingId: string;
  onBack: () => void;
}

export function TrainingDetailPage({ trainingId, onBack }: Props) {
  const [training, setTraining] = useState<Training>(
    () => MOCK_TRAININGS.find((t) => t.id === trainingId) ?? MOCK_TRAININGS[0],
  );
  const [showModal, setShowModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TrainingStatus | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(
    new Set(),
  );

  const t = training;

  const handleStatusToggle = () => {
    const next: TrainingStatus = t.status === "Active" ? "Inactive" : "Active";
    setTargetStatus(next);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!targetStatus) return;
    setTraining((prev) => ({ ...prev, status: targetStatus }));
    setShowModal(false);
    const action = targetStatus === "Active" ? "activated" : "deactivated";
    setToastMsg(`Training '${t.name}' has been ${action}.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const toggleReview = (id: string) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen"
      role="main"
      aria-label="Training Detail"
    >
      {/* ── Breadcrumb ── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-gray-400"
      >
        <span className="hover:text-[#003B95] cursor-pointer">Dashboard</span>
        <ChevronRight className="w-3 h-3" />
        <button onClick={onBack} className="hover:text-[#003B95]">
          Trainings
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium">{t.name}</span>
      </nav>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="w-9 h-10 flex items-center justify-center rounded-xl border border-gray-300 bg-white hover:bg-gray-50 shrink-0 text-gray-600 shadow-sm mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{t.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {t.sport}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                  t.level === "Beginner"
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : t.level === "Intermediate"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : t.level === "Advanced"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-violet-50 text-violet-700 border-violet-200",
                )}
              >
                {t.level}
              </span>
              <StatusBadge status={t.status} />
              {t.promotionStatus === "Promoted" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200">
                  <Star className="w-3 h-3" /> Promoted
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status toggle */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm shrink-0">
          <span className="text-sm text-gray-600 font-medium">Status:</span>
          <StatusBadge status={t.status} />
          <button
            onClick={handleStatusToggle}
            role="switch"
            aria-checked={t.status === "Active"}
            aria-label={`Toggle active status for ${t.name}`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
              t.status === "Active"
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
            )}
          >
            {t.status === "Active" ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Deactivate
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-5 gap-5">
        {/* ─── LEFT COLUMN (60%) ─── */}
        <div className="col-span-3 space-y-5">
          {/* Training Details Card */}
          <Card
            icon={Dumbbell}
            title="Training Details"
            ariaLabel="Training Details"
          >
            <div className="grid grid-cols-3 gap-5">
              <InfoRow label="Sport" value={t.sport} />
              <InfoRow label="Level" value={t.level} />
              <InfoRow label="Gender" value={t.genderRestriction} />
              <InfoRow
                label="Age Range"
                value={
                  t.minAge || t.maxAge
                    ? `${t.minAge ?? "Any"} - ${t.maxAge ?? "Any"} years`
                    : "No restriction"
                }
              />
              <InfoRow
                label="Types Offered"
                value={
                  <div className="flex flex-wrap gap-1">
                    {t.types.map((tp) => (
                      <span
                        key={tp}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
                          tp === "Full Course"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : tp === "Per Session"
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : "bg-purple-50 text-purple-700 border-purple-200",
                        )}
                      >
                        {tp}
                      </span>
                    ))}
                  </div>
                }
              />
              <InfoRow
                label="Session Duration"
                value={`${t.durationMins} minutes`}
              />
              <div className="col-span-3">
                <InfoRow
                  label="Description"
                  value={
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {t.description}
                    </p>
                  }
                />
              </div>
            </div>
          </Card>

          {/* Pricing Card */}
          <Card icon={Banknote} title="Pricing" ariaLabel="Pricing Details">
            <div className="space-y-4">
              {t.fullCoursePricing && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-indigo-700 uppercase mb-3">
                    Full Course
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <InfoRow
                      label="Total Price"
                      value={`${t.fullCoursePricing.currency} ${fmt(t.fullCoursePricing.totalPrice)}`}
                    />
                    <InfoRow
                      label="Number of Sessions"
                      value={t.fullCoursePricing.numberOfSessions}
                    />
                    <InfoRow
                      label="Price Per Session"
                      value={`${t.fullCoursePricing.currency} ${fmt(t.fullCoursePricing.pricePerSession)}`}
                    />
                  </div>
                </div>
              )}
              {t.perSessionPricing && (
                <div className="bg-teal-50/50 border border-teal-100 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-teal-700 uppercase mb-3">
                    Per Session
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <InfoRow
                      label="Price Per Session"
                      value={`${t.perSessionPricing.currency} ${fmt(t.perSessionPricing.pricePerSession)}`}
                    />
                    <InfoRow
                      label="Minimum Sessions"
                      value={t.perSessionPricing.minSessions}
                    />
                    <InfoRow
                      label="Maximum Sessions"
                      value={t.perSessionPricing.maxSessions}
                    />
                  </div>
                </div>
              )}
              {t.subscriptionPricing && (
                <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-purple-700 uppercase mb-3">
                    Subscription
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <InfoRow
                      label="Monthly Price"
                      value={`${t.subscriptionPricing.currency} ${fmt(t.subscriptionPricing.monthlyPrice)}`}
                    />
                    <InfoRow
                      label="Sessions Per Month"
                      value={t.subscriptionPricing.sessionsPerMonth}
                    />
                    <InfoRow
                      label="Commitment Period"
                      value={t.subscriptionPricing.commitmentPeriod}
                    />
                  </div>
                </div>
              )}
              {!t.fullCoursePricing &&
                !t.perSessionPricing &&
                !t.subscriptionPricing && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Pricing not yet configured.
                  </p>
                )}
            </div>
          </Card>

          {/* Schedule Card */}
          <Card icon={Calendar} title="Schedule" ariaLabel="Training Schedule">
            {t.fullCourseBatches.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
                  Full Course Batches ({t.fullCourseBatches.length})
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {[
                          "Batch Name",
                          "Days",
                          "Time",
                          "Capacity",
                          "Enrolled",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {t.fullCourseBatches.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/60">
                          <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                            {b.batchName}
                          </td>
                          <td className="px-3 py-3 text-gray-600 text-xs">
                            {b.daysOfWeek.join(", ")}
                          </td>
                          <td className="px-3 py-3 text-gray-700 font-mono text-xs">
                            {b.timeSlot}
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums text-gray-700">
                            {b.maxCapacity}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={cn(
                                "tabular-nums font-semibold",
                                b.enrolled >= b.maxCapacity
                                  ? "text-red-600"
                                  : "text-gray-700",
                              )}
                            >
                              {b.enrolled}/{b.maxCapacity}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <BatchStatusBadge status={b.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {t.perSessionSlots.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
                  Per Session Slots ({t.perSessionSlots.length})
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {[
                          "Day",
                          "Time Slot",
                          "Duration",
                          "Price",
                          "Available",
                          "Recurrence",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {t.perSessionSlots.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50/60">
                          <td className="px-3 py-3 font-medium text-gray-900">
                            {s.day}
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-gray-700">
                            {s.timeSlot}
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {s.durationMins} min
                          </td>
                          <td className="px-3 py-3 font-semibold text-gray-900 tabular-nums">
                            {s.currency} {fmt(s.price)}
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums text-gray-700">
                            {s.availableSpots}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={cn(
                                "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                                s.recurrence === "Weekly"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-gray-100 text-gray-600",
                              )}
                            >
                              {s.recurrence}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {t.subscriptionPlans.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
                  Subscription Plans ({t.subscriptionPlans.length})
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {[
                          "Plan Name",
                          "Duration",
                          "Sessions/Week",
                          "Price",
                          "Auto-Renew",
                          "Subscribers",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {t.subscriptionPlans.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/60">
                          <td className="px-3 py-3 font-medium text-gray-900">
                            {p.planName}
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {p.planDuration}
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums text-gray-700 font-semibold">
                            {p.sessionsPerWeek}x/wk
                          </td>
                          <td className="px-3 py-3 font-bold text-gray-900 tabular-nums">
                            {p.currency} {fmt(p.price)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {p.autoRenew ? (
                              <span className="text-emerald-600 flex items-center justify-center gap-1 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">No</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums font-semibold text-gray-900">
                            {p.activeSubscribers}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={cn(
                                "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                                p.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-gray-100 text-gray-500",
                              )}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {t.fullCourseBatches.length === 0 &&
              t.perSessionSlots.length === 0 &&
              t.subscriptionPlans.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No batches or slots have been configured for this training.
                </p>
              )}
          </Card>

          {/* Exception Dates Card */}
          <Card
            icon={CalendarDays}
            title="Exception Dates"
            ariaLabel="Exception Dates"
            badge={
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                {t.exceptionDates.length}
              </span>
            }
          >
            {t.exceptionDates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No exception dates configured.
              </p>
            ) : (
              <div className="space-y-3">
                {t.exceptionDates.map((exc) => (
                  <div
                    key={exc.id}
                    className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        {format(new Date(exc.date), "dd MMM yyyy")}
                      </span>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {exc.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Cancellation Policy Card */}
          <Card
            icon={ShieldCheck}
            title="Cancellation Policy"
            ariaLabel="Cancellation Policy"
          >
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Cancel window:{" "}
                <strong className="text-gray-700">
                  {t.cancellationPolicy.tiers[0]?.window || "Not configured"}
                </strong>
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                        Window
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                        Refund
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {t.cancellationPolicy.tiers.map((tier, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">
                          {tier.window}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "font-bold tabular-nums",
                              tier.refundPercent === 100
                                ? "text-emerald-600"
                                : tier.refundPercent === 0
                                  ? "text-red-600"
                                  : "text-amber-600",
                            )}
                          >
                            {tier.refundPercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Discount Rules Card */}
          <Card
            icon={Gift}
            title="Discount Rules"
            ariaLabel="Discount Rules"
            badge={
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                {t.discounts.length}
              </span>
            }
          >
            {t.discounts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No discount rules configured.
              </p>
            ) : (
              <div className="space-y-3">
                {t.discounts.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-start justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {d.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {d.discountType === "Percentage"
                          ? `${d.value}% off`
                          : `SAR ${d.value} off`}{" "}
                        &middot; Applies to: {d.applicableTo}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        d.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-400",
                      )}
                    >
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ─── RIGHT COLUMN (40%) ─── */}
        <div className="col-span-2 space-y-5">
          {/* Provider Card */}
          <Card
            icon={Building2}
            title="Provider"
            ariaLabel="Provider Information"
          >
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-[#003B95] cursor-pointer hover:underline">
                  {t.provider.name}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Training Provider
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <InfoRow
                  label="Provider ID"
                  value={
                    <span className="font-mono text-xs">{t.provider.id}</span>
                  }
                />
                <InfoRow
                  label="Email"
                  value={
                    <span className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3 text-gray-400" />
                      {t.provider.email}
                    </span>
                  }
                />
                <InfoRow
                  label="Phone"
                  value={
                    <span className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {t.provider.phone}
                    </span>
                  }
                />
              </div>
            </div>
          </Card>

          {/* Coaches Card */}
          <Card
            icon={Users}
            title="Coaches"
            ariaLabel="Assigned Coaches"
            badge={
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                {t.coaches.length}
              </span>
            }
          >
            {t.coaches.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No coaches assigned to this training.
              </p>
            ) : (
              <div className="space-y-3">
                {t.coaches.map((coach) => (
                  <div
                    key={coach.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#003B95] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {coach.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#003B95] cursor-pointer hover:underline">
                          {coach.name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            coach.verification === "Verified"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700",
                          )}
                        >
                          {coach.verification === "Verified" ? (
                            <>
                              <BadgeCheck className="w-2.5 h-2.5 inline mr-0.5" />
                              Verified
                            </>
                          ) : (
                            "Unverified"
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {coach.specialisation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Facility Card */}
          <Card icon={MapPin} title="Facility" ariaLabel="Facility Information">
            {t.facility.name ? (
              <div className="space-y-2.5">
                <span className="text-sm font-semibold text-[#003B95] cursor-pointer hover:underline">
                  {t.facility.name}
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <InfoRow
                    label="Location"
                    value={`${t.facility.city}, ${t.facility.country}`}
                  />
                  <InfoRow label="Address" value={t.facility.address} />
                  <InfoRow
                    label="Court / Area"
                    value={t.facility.courtAreaName}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No facility assigned (online or provider-managed location).
              </p>
            )}
          </Card>

          {/* Stats Card */}
          <Card
            icon={TrendingUp}
            title="Statistics"
            ariaLabel="Training Statistics"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  Total Bookings
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {t.earnings.totalBookings}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  Active Bookings
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {t.earnings.activeBookings}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  Average Rating
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating rating={t.averageRating} />
                  <span className="text-sm font-bold text-gray-900">
                    {t.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  Total Reviews
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {t.totalReviews}
                </p>
              </div>
            </div>
          </Card>

          {/* Earning Preview Card */}
          <Card
            icon={Banknote}
            title="Earning Preview"
            ariaLabel="Earning Preview"
          >
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 text-gray-700">
                        Gross (per session)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        {t.earnings.currency} {fmt(t.earnings.grossPerSession)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700">
                        Commission ({t.earnings.commissionPct}%)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600 tabular-nums">
                        - {t.earnings.currency}{" "}
                        {fmt(t.earnings.commissionAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700">
                        After Commission
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        {t.earnings.currency} {fmt(t.earnings.afterCommission)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700">
                        Tax ({t.earnings.taxPct}% of post-commission)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600 tabular-nums">
                        - {t.earnings.currency} {fmt(t.earnings.taxAmount)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td className="px-4 py-3 font-bold text-gray-900">
                        Net Payout
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 tabular-nums text-base">
                        {t.earnings.currency} {fmt(t.earnings.netPayout)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-400 italic">
                Preview based on current commission and tax rates. Actual
                booking rates are locked at booking time (Rule 69).
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Reviews Summary (Full Width) ─── */}
      <Card
        icon={MessageSquare}
        title={`Reviews (${t.totalReviews})`}
        ariaLabel="Reviews Summary"
      >
        {t.totalReviews === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No reviews yet.
          </p>
        ) : (
          <div className="space-y-5">
            {/* Rating Breakdown */}
            <div className="grid grid-cols-5 gap-5 items-center">
              <div className="col-span-2 space-y-1.5">
                <RatingBar
                  stars={5}
                  count={t.ratingBreakdown.fiveStars}
                  total={t.totalReviews}
                />
                <RatingBar
                  stars={4}
                  count={t.ratingBreakdown.fourStars}
                  total={t.totalReviews}
                />
                <RatingBar
                  stars={3}
                  count={t.ratingBreakdown.threeStars}
                  total={t.totalReviews}
                />
                <RatingBar
                  stars={2}
                  count={t.ratingBreakdown.twoStars}
                  total={t.totalReviews}
                />
                <RatingBar
                  stars={1}
                  count={t.ratingBreakdown.oneStar}
                  total={t.totalReviews}
                />
              </div>
              <div className="col-span-3">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">
                    {t.averageRating.toFixed(1)}
                  </p>
                  <StarRating rating={t.averageRating} size="lg" />
                  <p className="text-xs text-gray-500 mt-1">
                    Based on {t.totalReviews} review
                    {t.totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Reviews (last 5) */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                Recent Reviews
              </h3>
              <div className="space-y-3">
                {t.reviews.slice(0, 5).map((rev) => {
                  const isExpanded = expandedReviews.has(rev.id);
                  const needsTruncate = rev.text.length > 200;
                  const displayText =
                    needsTruncate && !isExpanded
                      ? rev.text.slice(0, 200) + "..."
                      : rev.text;
                  return (
                    <div
                      key={rev.id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {rev.reviewerName}
                          </span>
                          <StarRating rating={rev.rating} />
                          <span className="text-xs font-semibold text-gray-600">
                            {rev.rating}.0
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {format(new Date(rev.date), "dd MMM yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {displayText}
                      </p>
                      {needsTruncate && (
                        <button
                          onClick={() => toggleReview(rev.id)}
                          className="text-xs text-[#003B95] hover:underline mt-1"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="text-xs text-[#003B95] hover:underline mt-3 font-medium">
                View All Reviews &rarr;
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ─── Audit Trail (Full Width) ─── */}
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        role="region"
        aria-label="Audit Trail"
      >
        <button
          onClick={() => setAuditOpen((o) => !o)}
          className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#003B95]/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[#003B95]" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Audit Trail</h2>
          </div>
          {auditOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {auditOpen && (
          <div className="p-5">
            <div className="space-y-3">
              {t.auditTrail.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <span className="text-xs text-gray-400 font-mono whitespace-nowrap w-40 shrink-0">
                    {format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm")}{" "}
                    UTC
                  </span>
                  <span className="text-gray-700 flex-1">{entry.event}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {entry.actor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Status Toggle Modal ── */}
      {showModal && targetStatus && (
        <ConfirmModal
          training={t}
          targetStatus={targetStatus}
          onConfirm={handleConfirm}
          onCancel={() => {
            setShowModal(false);
            setTargetStatus(null);
          }}
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
