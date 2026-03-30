// ─── SCR-ADM-020: Booking Detail (Admin View) ──────────────────────────────
// Read-only comprehensive detail of a single booking. Shows player, provider,
// entity (type-specific), payment breakdown, status timeline, cancellation
// details, refund info, flagged state, and audit trail.

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Flag,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Hash,
  Building2,
  GraduationCap,
  Trophy,
  Calendar,
  Clock,
  CreditCard,
  Smartphone,
  Wallet,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  MapPin,
  Users,
  Info,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import { Separator } from "../../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import type { Booking, BookingType, BookingStatus, PaymentStatus } from "./types";
import { MOCK_BOOKINGS } from "./mockData";

// ─── Badge Styles ────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<BookingType, string> = {
  Facility:   "bg-blue-100 text-blue-700 border-blue-200",
  Training:   "bg-sky-100 text-sky-700 border-sky-200",
  Coach:      "bg-amber-100 text-amber-700 border-amber-200",
  Tournament: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_BADGE: Record<BookingStatus, string> = {
  Created:              "bg-gray-100 text-gray-600 border-gray-200",
  Upcoming:             "bg-sky-100 text-sky-700 border-sky-200",
  Ongoing:              "bg-amber-100 text-amber-700 border-amber-200",
  Completed:            "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled:            "bg-red-100 text-red-700 border-red-200",
  "Partially Cancelled":"bg-red-50 text-red-600 border-red-200",
  Expired:              "bg-gray-100 text-gray-500 border-gray-200",
};

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  Paid:           "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending:        "bg-amber-100 text-amber-700 border-amber-200",
  Refunded:       "bg-sky-100 text-sky-700 border-sky-200",
  "Partial Refund":"bg-sky-50 text-sky-600 border-sky-200",
  Failed:         "bg-red-100 text-red-700 border-red-200",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) { return format(parseISO(iso), "dd MMM yyyy"); }
function fmtDateTime(iso: string) { return format(parseISO(iso), "dd MMM yyyy, HH:mm"); }
function fmtCurrency(amount: number) {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const sourceBooking = MOCK_BOOKINGS.find((b) => b.id === id) ?? null;
  const [booking, setBooking] = useState<Booking | null>(sourceBooking);

  // ── Flag modal ──
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  // ── Unflag modal ──
  const [unflagModalOpen, setUnflagModalOpen] = useState(false);

  // ── Audit trail collapse ──
  const [auditExpanded, setAuditExpanded] = useState(true);

  // ── 404 State ──
  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">Booking Not Found</h1>
          <p className="text-sm text-[#6B7280] max-w-sm">
            The booking ID {id} does not exist or has been removed.
          </p>
          <Button variant="outline" onClick={() => navigate("/bookings")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  // ── Flag handlers ──
  const handleFlag = async () => {
    if (flagReason.length < 10) return;
    setFlagSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    setBooking({
      ...booking,
      flagged: true,
      flagInfo: { flaggedBy: "Super Admin", flaggedAt: new Date().toISOString(), reason: flagReason },
    });
    setFlagSubmitting(false);
    setFlagModalOpen(false);
    toast.success(`Booking ${booking.id} has been flagged as suspicious.`);
  };

  const handleUnflag = () => {
    setBooking({ ...booking, flagged: false, flagInfo: undefined });
    setUnflagModalOpen(false);
    toast.success(`Suspicious flag removed from booking ${booking.id}.`);
  };

  const isFree = booking.financials.grossAmount === 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]" role="main" aria-label="Booking Detail">
      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280]">
        <span className="hover:text-[#003B95] cursor-pointer" onClick={() => navigate("/")}>Dashboard</span>
        <span className="mx-2">/</span>
        <span className="hover:text-[#003B95] cursor-pointer" onClick={() => navigate("/bookings")}>Bookings</span>
        <span className="mx-2">/</span>
        <span className="text-[#111827] font-medium">Booking #{booking.id}</span>
      </nav>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#111827]">Booking #{booking.id}</h1>
          <Badge variant="outline" className={cn("border text-xs font-medium", TYPE_BADGE[booking.type])}>
            {booking.type}
          </Badge>
          <Badge variant="outline" className={cn("border text-xs font-medium", STATUS_BADGE[booking.status])}>
            {booking.status}
          </Badge>
          <Badge variant="outline" className={cn("border text-xs font-medium", PAYMENT_BADGE[booking.paymentStatus])}>
            {booking.paymentStatus}
          </Badge>
        </div>
        {!booking.flagged && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[#6B7280] hover:text-amber-600 hover:border-amber-300"
            onClick={() => { setFlagReason(""); setFlagModalOpen(true); }}
            aria-label={`Flag booking ${booking.id} as suspicious`}
          >
            <Flag className="w-4 h-4" />
            Flag as Suspicious
          </Button>
        )}
      </div>

      {/* ── Flagged Warning Banner ── */}
      {booking.flagged && booking.flagInfo && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl" role="alert" aria-live="polite">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              This booking has been flagged as suspicious by {booking.flagInfo.flaggedBy} on {fmtDateTime(booking.flagInfo.flaggedAt)}.
            </p>
            <p className="text-sm text-amber-700 mt-1">Reason: {booking.flagInfo.reason}</p>
            <button
              className="text-xs text-amber-700 underline hover:text-amber-900 mt-2 font-medium"
              onClick={() => setUnflagModalOpen(true)}
            >
              Remove Flag (Super Admin)
            </button>
          </div>
        </div>
      )}

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-5 gap-6">
        {/* ── Left Column (60%) ── */}
        <div className="col-span-3 space-y-6">
          {/* Player Information Card */}
          <Card title="Player Information" icon={<User className="w-4 h-4" />} ariaLabel="Player Information">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#003B95]/10 text-[#003B95] font-bold text-sm flex items-center justify-center shrink-0">
                {booking.player.avatar ? (
                  <img src={booking.player.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  initials(booking.player.name)
                )}
              </div>
              <div className="space-y-2 flex-1">
                <div>
                  <p className="text-sm font-semibold text-[#003B95] hover:underline cursor-pointer">{booking.player.name}</p>
                  <p className="text-xs text-[#6B7280]">ID: {booking.player.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-[#6B7280]">
                    <Mail className="w-3.5 h-3.5" /> {booking.player.email}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#6B7280]">
                    <Phone className="w-3.5 h-3.5" /> {booking.player.phone}
                  </div>
                </div>
              </div>
            </div>
            {booking.dependants.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Dependants / Players</p>
                <div className="space-y-2">
                  {booking.dependants.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between text-sm">
                      <span className={cn(dep.status === "Cancelled" && "line-through text-gray-400")}>
                        {dep.name}
                        {dep.age && <span className="text-[#6B7280] ml-1">({dep.age}y, {dep.gender})</span>}
                        {dep.relation && <span className="text-[#6B7280] ml-1">— {dep.relation}</span>}
                      </span>
                      {dep.status === "Cancelled" && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">Cancelled</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Provider Information Card */}
          <Card title="Provider Information" icon={<Building2 className="w-4 h-4" />} ariaLabel="Provider Information">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-[#003B95] hover:underline cursor-pointer">{booking.provider.name}</p>
                <p className="text-xs text-[#6B7280]">
                  {booking.provider.type === "Facility" ? "Facility Provider" :
                   booking.provider.type === "Training" ? "Training Provider" :
                   booking.provider.type === "Coach" ? "Freelance Coach" : "Tournament Host"}
                  {" "}| ID: {booking.provider.id}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-[#6B7280]">
                  <Mail className="w-3.5 h-3.5" /> {booking.provider.email}
                </div>
                <div className="flex items-center gap-1.5 text-[#6B7280]">
                  <Phone className="w-3.5 h-3.5" /> {booking.provider.phone}
                </div>
              </div>
              {booking.provider.businessName && (
                <p className="text-sm text-[#6B7280]">Business: {booking.provider.businessName}</p>
              )}
            </div>
          </Card>

          {/* Entity Details Card (Type-specific) */}
          <Card
            title={
              booking.type === "Facility" ? "Facility Details" :
              booking.type === "Training" ? "Training Details" :
              booking.type === "Coach" ? "Coach Session Details" : "Tournament Details"
            }
            icon={
              booking.type === "Facility" ? <Building2 className="w-4 h-4" /> :
              booking.type === "Training" ? <GraduationCap className="w-4 h-4" /> :
              booking.type === "Coach" ? <User className="w-4 h-4" /> : <Trophy className="w-4 h-4" />
            }
            ariaLabel="Entity Details"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label={booking.type === "Tournament" ? "Tournament Name" : `${booking.type} Name`}>
                <span className="text-[#003B95] font-medium hover:underline cursor-pointer">{booking.entity.name}</span>
              </InfoField>
              {booking.entity.sport && (
                <InfoField label="Sport">{booking.entity.sport}</InfoField>
              )}
              <InfoField label="Location">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                  {booking.entity.location}
                </span>
              </InfoField>
              <InfoField label="Details">{booking.entity.detail}</InfoField>
              {booking.type === "Tournament" && (
                <>
                  <InfoField label="Entry Fee Type">{booking.financials.grossAmount === 0 ? "Free" : "Paid"}</InfoField>
                </>
              )}
            </div>
          </Card>

          {/* Booking Configuration Card */}
          <Card title="Booking Configuration" icon={<Calendar className="w-4 h-4" />} ariaLabel="Booking Configuration">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="Booking Date & Time">{fmtDateTime(booking.bookingDate)} UTC</InfoField>
              <InfoField label="Duration / Period">{booking.period} ({booking.duration} min)</InfoField>
              <InfoField label="Number of Players">{booking.playersCount}</InfoField>
              <InfoField label="Booking Source">
                <Badge variant="outline" className="text-xs">{booking.bookingSource}</Badge>
              </InfoField>
              <InfoField label="Created At">{fmtDateTime(booking.createdAt)}</InfoField>
            </div>
          </Card>

          {/* Status Timeline */}
          <Card title="Status Timeline" icon={<Clock className="w-4 h-4" />} ariaLabel="Booking Status Timeline">
            <div className="flex items-start gap-0 overflow-x-auto pb-2">
              {booking.timeline.map((event, idx) => {
                const isLast = idx === booking.timeline.length - 1;
                return (
                  <div key={idx} className="flex items-start min-w-[140px]">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                          isLast
                            ? "bg-[#003B95] border-[#003B95] text-white"
                            : "bg-emerald-500 border-emerald-500 text-white",
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-semibold text-[#111827]">{event.label}</p>
                        <p className="text-[10px] text-[#6B7280]">{fmtDateTime(event.timestamp)}</p>
                        <p className="text-[10px] text-[#6B7280]">{event.actor}</p>
                      </div>
                    </div>
                    {!isLast && (
                      <div className="h-[2px] bg-emerald-300 flex-1 mt-4 min-w-[20px]" />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Cancellation Details (conditional) */}
          {booking.cancellation && (
            <Card title="Cancellation Details" icon={<AlertTriangle className="w-4 h-4 text-red-500" />} ariaLabel="Cancellation Details">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoField label="Cancelled By">
                  {booking.cancellation.cancelledBy}
                  {booking.cancellation.actorName && ` (${booking.cancellation.actorName})`}
                </InfoField>
                <InfoField label="Cancellation Date">{fmtDateTime(booking.cancellation.cancelledAt)}</InfoField>
                <InfoField label="Reason" className="col-span-2">{booking.cancellation.reason}</InfoField>
                <InfoField label="Cancellation Charge">
                  {booking.cancellation.cancellationCharge > 0
                    ? fmtCurrency(booking.cancellation.cancellationCharge)
                    : "No charge"}
                </InfoField>
                {booking.cancellation.cancellationPolicy && (
                  <InfoField label="Cancellation Policy">{booking.cancellation.cancellationPolicy}</InfoField>
                )}
                {booking.cancellation.adminNotes && (
                  <InfoField label="Admin Notes" className="col-span-2">
                    <span className="text-[#6B7280] italic">{booking.cancellation.adminNotes}</span>
                  </InfoField>
                )}
              </div>
            </Card>
          )}

          {/* Audit Trail */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setAuditExpanded((v) => !v)}
              aria-label="Audit Trail"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6B7280]" />
                <span className="text-sm font-semibold text-[#111827]">Audit Trail</span>
                <Badge variant="secondary" className="text-xs">{booking.auditTrail.length}</Badge>
              </div>
              {auditExpanded ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
            </button>
            {auditExpanded && (
              <div className="px-5 pb-4 space-y-3">
                {[...booking.auditTrail].reverse().map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#003B95] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-[#111827]">{entry.event}</p>
                        <span className="text-xs text-[#6B7280] whitespace-nowrap">{fmtDateTime(entry.timestamp)}</span>
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        By: {entry.actor}
                        {entry.details && ` — ${entry.details}`}
                      </p>
                      {entry.oldValue && entry.newValue && (
                        <p className="text-xs text-[#6B7280]">{entry.oldValue} → {entry.newValue}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column (40%) ── */}
        <div className="col-span-2 space-y-6">
          {/* Payment Breakdown Panel */}
          <Card title="Payment Breakdown" icon={<CreditCard className="w-4 h-4" />} ariaLabel="Payment Breakdown">
            {isFree ? (
              <div className="text-center py-6 text-[#6B7280]">
                <p className="text-sm font-medium">Free Booking — No Payment Required</p>
              </div>
            ) : (
              <div className="space-y-0">
                <FinancialRow label="Gross Amount" amount={fmtCurrency(booking.financials.grossAmount)} />
                {booking.financials.discount > 0 && (
                  <FinancialRow
                    label={`Discount${booking.financials.discountCode ? ` (${booking.financials.discountCode})` : ""}`}
                    amount={`- ${fmtCurrency(booking.financials.discount)}`}
                    className="text-red-600"
                  />
                )}
                <FinancialRow
                  label="Subtotal (after discount)"
                  amount={fmtCurrency(booking.financials.subtotal)}
                  bold
                />
                <Separator className="my-2" />
                <FinancialRow
                  label={`Commission (${booking.financials.commissionPct}%)`}
                  amount={`- ${fmtCurrency(booking.financials.commissionAmount)}`}
                  className="text-red-600"
                />
                <FinancialRow
                  label={`Tax (${booking.financials.taxPct}% ${booking.financials.taxLabel})`}
                  amount={`- ${fmtCurrency(booking.financials.taxAmount)}`}
                  className="text-red-600"
                />
                <Separator className="my-2" />
                <FinancialRow
                  label="Net Payout"
                  amount={fmtCurrency(booking.financials.netPayout)}
                  bold
                  highlight
                />
                <p className="text-[10px] text-[#6B7280] mt-3 italic">Rates locked at booking time (Rule 69)</p>
              </div>
            )}
          </Card>

          {/* Payment Information Panel */}
          <Card title="Payment Information" icon={<CreditCard className="w-4 h-4" />} ariaLabel="Payment Information">
            {isFree ? (
              <p className="text-sm text-[#6B7280]">Free Booking — No Payment Required</p>
            ) : (
              <div className="space-y-3 text-sm">
                <InfoField label="Payment Method">
                  <span className="flex items-center gap-1.5">
                    <PaymentMethodIcon method={booking.financials.paymentMethod} />
                    {booking.financials.paymentMethod}
                  </span>
                </InfoField>
                <InfoField label="Transaction ID">
                  <span className="font-mono text-xs text-[#003B95]">{booking.financials.transactionId}</span>
                </InfoField>
                <InfoField label="Payment Date">{fmtDateTime(booking.financials.paidAt)} UTC</InfoField>
                <InfoField label="Gateway Reference">
                  <span className="font-mono text-xs text-[#6B7280]">{booking.financials.gatewayRef}</span>
                </InfoField>
                <InfoField label="Payment Status">
                  <Badge variant="outline" className={cn("border text-xs font-medium", PAYMENT_BADGE[booking.paymentStatus])}>
                    {booking.paymentStatus}
                  </Badge>
                </InfoField>
              </div>
            )}
          </Card>

          {/* Refund Information Panel (conditional) */}
          {booking.financials.refundHistory.length > 0 && (
            <Card title="Refund Information" icon={<Wallet className="w-4 h-4" />} ariaLabel="Refund Information">
              <div className="space-y-4">
                {booking.financials.refundHistory.map((refund) => (
                  <div key={refund.id} className="space-y-2 text-sm">
                    <InfoField label="Refund Amount">
                      <span className="font-semibold text-emerald-700">{fmtCurrency(refund.amount)}</span>
                      {refund.pct > 0 && <span className="text-xs text-[#6B7280] ml-1">({refund.pct}%)</span>}
                    </InfoField>
                    <InfoField label="Refund Date">{fmtDateTime(refund.processedAt)} UTC</InfoField>
                    <InfoField label="Refund Reason">{refund.reason}</InfoField>
                    {refund.status && (
                      <InfoField label="Refund Status">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs border",
                            refund.status === "Processed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            refund.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-red-50 text-red-700 border-red-200",
                          )}
                        >
                          {refund.status}
                        </Badge>
                      </InfoField>
                    )}
                    {refund.method && (
                      <InfoField label="Refund Method">{refund.method}</InfoField>
                    )}
                    <InfoField label="Processed By">{refund.processedBy}</InfoField>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Flag as Suspicious Modal ── */}
      <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Flag Booking as Suspicious
            </DialogTitle>
            <DialogDescription>
              You are about to flag booking <strong>{booking.id}</strong> as suspicious. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Describe why this booking is suspicious..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>{flagReason.length > 0 && flagReason.length < 10 ? "Flag reason must be at least 10 characters." : ""}</span>
              <span>{flagReason.length}/500</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFlagModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={flagReason.length < 10 || flagSubmitting}
              onClick={handleFlag}
              className="gap-1.5"
            >
              {flagSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Flag Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Suspicious Flag Modal ── */}
      <Dialog open={unflagModalOpen} onOpenChange={setUnflagModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-700 flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Remove Suspicious Flag
            </DialogTitle>
            <DialogDescription>
              Remove the suspicious flag from booking <strong>{booking.id}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUnflagModalOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={handleUnflag} className="bg-amber-600 hover:bg-amber-700 gap-1.5">
              Remove Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helper Sub-components ───────────────────────────────────────────────────

function Card({
  title,
  icon,
  children,
  ariaLabel,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl" role="region" aria-label={ariaLabel}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <span className="text-[#6B7280]">{icon}</span>
        <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-xs text-[#6B7280] uppercase tracking-wide block mb-0.5">{label}</span>
      <span className="text-sm text-[#111827]">{children}</span>
    </div>
  );
}

function FinancialRow({
  label,
  amount,
  bold,
  highlight,
  className,
}: {
  label: string;
  amount: string;
  bold?: boolean;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 text-sm",
        highlight && "bg-emerald-50/50 rounded px-2 -mx-2",
      )}
    >
      <span className={cn(bold ? "font-semibold text-[#111827]" : "text-[#6B7280]")}>{label}</span>
      <span className={cn(bold ? "font-bold text-[#111827]" : "text-[#111827]", className)}>{amount}</span>
    </div>
  );
}

function PaymentMethodIcon({ method }: { method: string }) {
  switch (method) {
    case "Apple Pay":
    case "Google Pay":
      return <Smartphone className="w-3.5 h-3.5 text-[#6B7280]" />;
    case "Wallet":
      return <Wallet className="w-3.5 h-3.5 text-[#6B7280]" />;
    default:
      return <CreditCard className="w-3.5 h-3.5 text-[#6B7280]" />;
  }
}
