// ─── US-102 Transaction Detail Slide-in Panel ────────────────────────────────
import { useState } from "react";
import { format } from "date-fns";
import {
  X,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  Building2,
  GraduationCap,
  Users as UsersIcon,
  Hash,
  Info,
  PlusCircle,
  AlertTriangle,
  FileText,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../ui/utils";
import {
  PaymentTransaction,
  PaymentStatus,
  RefundRecord,
  AdminNote,
} from "./types";
import { Button } from "../../ui/button";

interface PaymentDetailsProps {
  transaction: PaymentTransaction;
  onClose: () => void;
  onInitiateRefund: () => void;
  onMarkResolved: () => void;
  onAddNote: (note: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBanner({
  status,
  code,
}: {
  status: PaymentStatus;
  code: string;
}) {
  const cfg: Record<
    PaymentStatus,
    { cls: string; Icon: React.ElementType; label: string }
  > = {
    Success: {
      cls: "bg-emerald-50 border-emerald-200 text-emerald-800",
      Icon: CheckCircle,
      label: "Payment Successful",
    },
    Failed: {
      cls: "bg-red-50 border-red-200 text-red-800",
      Icon: XCircle,
      label: "Payment Failed",
    },
    Pending: {
      cls: "bg-amber-50 border-amber-200 text-amber-800",
      Icon: Clock,
      label: "Pending",
    },
    Refunded: {
      cls: "bg-violet-50 border-violet-200 text-violet-800",
      Icon: RotateCcw,
      label: "Refunded",
    },
    "Refund Initiated": {
      cls: "bg-blue-50 border-blue-200 text-blue-800",
      Icon: RotateCcw,
      label: "Refund Initiated (3–7d)",
    },
    Resolved: {
      cls: "bg-teal-50 border-teal-200 text-teal-800",
      Icon: ShieldCheck,
      label: "Resolved (No Financial Action)",
    },
  };
  const { cls, Icon, label } = cfg[status] ?? cfg.Pending;
  return (
    <div className={cn("flex items-center gap-3 p-3.5 rounded-xl border", cls)}>
      <Icon className="h-4 w-4 shrink-0" />
      <div>
        <p className="text-sm leading-none">{label}</p>
        <p className="text-[10px] opacity-80 mt-0.5 font-mono">{code}</p>
      </div>
    </div>
  );
}

function MethodIcon({ method }: { method: string }) {
  if (["Apple Pay", "Google Pay", "STC Pay"].includes(method))
    return <Smartphone className="h-4 w-4 text-gray-400" />;
  if (method === "Wallet") return <Wallet className="h-4 w-4 text-gray-400" />;
  return <CreditCard className="h-4 w-4 text-gray-400" />;
}

function RefundStatusBadge({ status }: { status: RefundRecord["status"] }) {
  const cls =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "Initiated"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : "bg-red-50 text-red-700 border-red-100";
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", cls)}>
      {status}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PaymentDetails({
  transaction: t,
  onClose,
  onInitiateRefund,
  onMarkResolved,
  onAddNote,
}: PaymentDetailsProps) {
  const [noteInput, setNoteInput] = useState("");
  const [noteError, setNoteError] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  const canRefund = t.status === "Success" && t.totalRefunded < t.amount;
  const canResolve = t.status === "Failed";
  const remainingAmt = t.amount - t.totalRefunded;

  const handleAddNote = () => {
    if (noteInput.trim().length < 5) {
      setNoteError("Note must be at least 5 characters.");
      return;
    }
    onAddNote(noteInput.trim());
    setNoteInput("");
    setNoteError("");
    setShowNoteForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-sm text-gray-900">Transaction Details</h2>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{t.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-5">
            {/* Status banner */}
            <StatusBanner status={t.status} code={t.gatewayResponseCode} />

            {/* Amount hero */}
            <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Transaction Amount
              </p>
              <p className="text-3xl text-gray-900 tabular-nums">
                {t.currency} {t.amount.toFixed(2)}
              </p>
              {t.totalRefunded > 0 && (
                <p className="text-xs text-violet-600 mt-1">
                  AED {t.totalRefunded.toFixed(2)} refunded — AED{" "}
                  {remainingAmt.toFixed(2)} net
                </p>
              )}
            </div>

            {/* Transaction info */}
            <Section title="Transaction Info" icon={Hash}>
              <InfoRow
                label="Transaction ID"
                value={<span className="font-mono text-xs">{t.id}</span>}
              />
              <InfoRow
                label="Gateway Reference"
                value={
                  <span className="font-mono text-xs">
                    {t.gatewayReference}
                  </span>
                }
              />
              <InfoRow label="Type" value={<TypeBadge type={t.type} />} />
              {t.bookingId && (
                <InfoRow
                  label="Booking ID"
                  value={
                    <span className="flex items-center gap-1 text-[#003B95] text-xs cursor-pointer hover:underline">
                      {t.bookingId} <ExternalLink className="h-3 w-3" />
                    </span>
                  }
                />
              )}
              <InfoRow
                label="Created"
                value={format(new Date(t.createdAt), "MMM d, yyyy · h:mm a")}
              />
              {t.processedAt && (
                <InfoRow
                  label="Processed"
                  value={format(
                    new Date(t.processedAt),
                    "MMM d, yyyy · h:mm a",
                  )}
                />
              )}
              {t.completedAt && (
                <InfoRow
                  label="Completed"
                  value={format(
                    new Date(t.completedAt),
                    "MMM d, yyyy · h:mm a",
                  )}
                />
              )}
            </Section>

            {/* Player info */}
            <Section title="Player" icon={UsersIcon}>
              <div className="flex items-center gap-3">
                <img
                  src={t.player.avatar}
                  alt={t.player.name}
                  className="h-10 w-9 rounded-full object-cover bg-gray-100 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {t.player.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {t.player.email}
                  </p>
                  <p className="text-xs text-gray-400">{t.player.phone}</p>
                </div>
                <span className="ml-auto text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200 shrink-0">
                  {t.player.id}
                </span>
              </div>
            </Section>

            {/* Provider */}
            {t.provider && (
              <Section title="Provider" icon={BuildingIcon(t.provider.type)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900">{t.provider.name}</p>
                    <p className="text-xs text-gray-400">
                      {t.provider.type} · {t.provider.id}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border",
                      t.provider.type === "Facility"
                        ? "bg-blue-50 text-[#003B95] border-blue-100"
                        : t.provider.type === "Training"
                          ? "bg-violet-50 text-violet-600 border-violet-100"
                          : "bg-amber-50 text-amber-600 border-amber-100",
                    )}
                  >
                    {t.provider.type}
                  </span>
                </div>
              </Section>
            )}

            {/* Payment method */}
            <Section title="Payment Method" icon={CreditCard}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MethodIcon method={t.method} />
                  <div>
                    <p className="text-sm text-gray-900">{t.method}</p>
                    {t.cardBrand && (
                      <p className="text-xs text-gray-400">{t.cardBrand}</p>
                    )}
                  </div>
                </div>
                {t.cardLast4 && (
                  <span className="font-mono text-xs text-gray-500">
                    •••• {t.cardLast4}
                  </span>
                )}
              </div>
            </Section>

            {/* Refund history — BR-003/004 */}
            <Section
              title="Refund History"
              icon={RotateCcw}
              badge={
                t.refundHistory.length > 0
                  ? t.refundHistory.length.toString()
                  : undefined
              }
            >
              {t.refundHistory.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No refunds issued for this transaction.
                </p>
              ) : (
                <div className="space-y-3">
                  {t.refundHistory.map((r) => (
                    <div
                      key={r.id}
                      className="bg-gray-50 rounded-lg p-3 space-y-1.5 border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-gray-400">
                          {r.id}
                        </span>
                        <RefundStatusBadge status={r.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Amount</span>
                        <span className="text-xs text-violet-600 tabular-nums">
                          AED {r.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Destination
                        </span>
                        <span className="text-xs text-gray-700">
                          {r.destination}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="text-xs text-gray-700">
                          {format(new Date(r.processedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400">
                          Reason:{" "}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {r.reason}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400">By: </span>
                        <span className="text-[10px] text-gray-600">
                          {r.processedBy}
                        </span>
                      </div>
                    </div>
                  ))}
                  {t.totalRefunded > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-xs text-gray-500">
                        Total Refunded
                      </span>
                      <span className="text-xs text-violet-600 tabular-nums">
                        AED {t.totalRefunded.toFixed(2)} / AED{" "}
                        {t.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Resolution — BR-005 */}
            {t.resolution && (
              <Section title="Resolution Record" icon={ShieldCheck}>
                <div className="bg-teal-50 rounded-lg p-3 border border-teal-100 space-y-1.5">
                  <div className="flex items-center gap-1 text-xs text-teal-700 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Resolved — No financial action (BR-005)
                  </div>
                  <InfoRow
                    label="Resolved by"
                    value={t.resolution.resolvedBy}
                    small
                  />
                  <InfoRow
                    label="Date"
                    value={format(
                      new Date(t.resolution.resolvedAt),
                      "MMM d, yyyy · h:mm a",
                    )}
                    small
                  />
                  <div className="pt-1 border-t border-teal-200">
                    <p className="text-[10px] text-teal-600">
                      {t.resolution.reason}
                    </p>
                  </div>
                </div>
              </Section>
            )}

            {/* Admin notes */}
            <Section
              title="Admin Notes"
              icon={FileText}
              badge={
                t.adminNotes.length > 0
                  ? t.adminNotes.length.toString()
                  : undefined
              }
              action={
                !showNoteForm ? (
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className="flex items-center gap-1 text-[11px] text-[#003B95] hover:text-blue-800"
                  >
                    <PlusCircle className="h-3 w-3" /> Add Note
                  </button>
                ) : undefined
              }
            >
              {t.adminNotes.length === 0 && !showNoteForm && (
                <p className="text-xs text-gray-400">No notes added yet.</p>
              )}
              {t.adminNotes.map((n) => (
                <div
                  key={n.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1"
                >
                  <p className="text-xs text-gray-700">{n.note}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{n.addedBy}</span>
                    <span>
                      {format(new Date(n.addedAt), "MMM d, yyyy · h:mm a")}
                    </span>
                  </div>
                </div>
              ))}

              {showNoteForm && (
                <div className="space-y-2">
                  <textarea
                    value={noteInput}
                    onChange={(e) => {
                      setNoteInput(e.target.value);
                      setNoteError("");
                    }}
                    rows={3}
                    placeholder="Internal note (visible to admins only)..."
                    className={cn(
                      "w-full px-3 py-2 text-xs border rounded-lg resize-none focus:outline-none focus:ring-1",
                      noteError
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 focus:ring-[#003B95]/30",
                    )}
                  />
                  {noteError && (
                    <p className="text-xs text-red-600">{noteError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => {
                        setShowNoteForm(false);
                        setNoteInput("");
                        setNoteError("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-7 bg-[#003B95] hover:bg-[#002d73] text-white"
                      onClick={handleAddNote}
                    >
                      Save Note
                    </Button>
                  </div>
                </div>
              )}
            </Section>

            {/* Receipt link */}
            {t.receiptUrl && (
              <a
                href={t.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Gateway Receipt
              </a>
            )}
          </div>
        </div>

        {/* Action footer — Initiate Refund + Mark as Resolved */}
        {(canRefund || canResolve) && (
          <div className="border-t border-gray-100 px-5 py-4 bg-white space-y-2">
            {canRefund && (
              <div>
                <Button
                  onClick={onInitiateRefund}
                  className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                  size="sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Initiate Refund
                  <span className="ml-auto text-violet-200 text-[10px]">
                    Up to AED {remainingAmt.toFixed(2)}
                  </span>
                </Button>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" /> BR-001/002: Wallet = immediate ·
                  Card = 3–7 business days
                </p>
              </div>
            )}
            {canResolve && (
              <div>
                <Button
                  onClick={onMarkResolved}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Mark as Resolved
                </Button>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" /> BR-005: Records resolution
                  without financial action
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Local sub-components ─────────────────────────────────────────────────────

function BuildingIcon(type: string): React.ElementType {
  if (type === "Training") return GraduationCap;
  if (type === "Coach") return UsersIcon;
  return Building2;
}

function Section({
  title,
  icon: Icon,
  badge,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {title}
          </span>
          {badge && (
            <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  small,
}: {
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={cn(
          "text-gray-400 shrink-0",
          small ? "text-[10px]" : "text-xs",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-gray-700 text-right min-w-0 truncate",
          small ? "text-[10px]" : "text-xs",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cls: Record<string, string> = {
    "Booking Payment": "bg-blue-50 text-[#003B95] border-blue-100",
    "Wallet Top-Up": "bg-emerald-50 text-emerald-700 border-emerald-100",
    Refund: "bg-violet-50 text-violet-700 border-violet-100",
    Payout: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <span
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-full border",
        cls[type] ?? "bg-gray-50 text-gray-600 border-gray-100",
      )}
    >
      {type}
    </span>
  );
}
