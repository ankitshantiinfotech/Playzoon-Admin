// ─── SCR-ADM-035: Payout Process/Detail ──────────────────────────────────────
// Full detail view and action interface for a single payout request.
// Actions: Approve, Reject, Mark Partially Paid, Mark Settled.
// Bank not approved → Approve disabled. Re-auth for approvals.

import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Users,
  CreditCard,
  Wallet,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Eye,
  Banknote,
  History,
  FileText,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import type {
  PayoutDetail,
  PayoutStatus,
  PayoutProviderType,
  BankAccountStatus,
  PartialPayment,
  StatusTimelineEntry,
} from "./types";
import { getPayoutDetail } from "./mockData";

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_PAYOUT_THRESHOLD = 500; // SAR

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PayoutStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  Pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  Processing: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  "Partially Paid": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  Settled: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

const TIMELINE_ICONS: Record<
  string,
  { icon: typeof CheckCircle; color: string }
> = {
  Pending: { icon: Clock, color: "text-amber-500" },
  Processing: { icon: Loader2, color: "text-blue-500" },
  "Partially Paid": { icon: CreditCard, color: "text-amber-500" },
  Settled: { icon: CheckCircle, color: "text-emerald-500" },
  Rejected: { icon: XCircle, color: "text-red-500" },
};

// ─── Provider Type Config ────────────────────────────────────────────────────

const PROVIDER_CONFIG: Record<
  PayoutProviderType,
  { icon: typeof Building2; bg: string; text: string; border: string }
> = {
  "Facility Provider": {
    icon: Building2,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  "Training Provider": {
    icon: GraduationCap,
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  Coach: {
    icon: Users,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number): string {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}

function fmtDateTime(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm") + " UTC";
}

function fmtDate(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy");
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PayoutStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] gap-1.5 border", cfg.bg, cfg.text, cfg.border)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {status}
    </Badge>
  );
}

function ProviderTypeBadge({ type }: { type: PayoutProviderType }) {
  const cfg = PROVIDER_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] gap-1 border", cfg.bg, cfg.text, cfg.border)}
    >
      <Icon className="h-2.5 w-2.5" />
      {type}
    </Badge>
  );
}

function BankStatusBadge({ status }: { status: BankAccountStatus }) {
  const colors: Record<BankAccountStatus, string> = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Not Approved": "bg-red-50 text-red-700 border-red-200",
    Revoked: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] border", colors[status])}
    >
      {status}
    </Badge>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{children}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PayoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Load detail
  const initialDetail = useMemo(() => (id ? getPayoutDetail(id) : null), [id]);
  const [detail, setDetail] = useState<PayoutDetail | null>(initialDetail);

  // Action states
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [showPartialForm, setShowPartialForm] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialNotes, setPartialNotes] = useState("");
  const [partialError, setPartialError] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Modal states
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [reAuthError, setReAuthError] = useState("");
  const [reAuthAttempts, setReAuthAttempts] = useState(0);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 404
  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Payout request not found.
        </h2>
        <Button variant="outline" onClick={() => navigate("/payouts")}>
          Back to List
        </Button>
      </div>
    );
  }

  const bankApproved = detail.bankAccount.status === "Approved";
  const belowThreshold = detail.requestedAmount < MIN_PAYOUT_THRESHOLD;
  const remainingAmount =
    detail.requestedAmount -
    detail.partialPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleApproveClick = () => {
    if (reAuthAttempts >= 3) {
      toast.error("Too many failed attempts. Please try again later.");
      return;
    }
    setShowReAuthModal(true);
    setReAuthPassword("");
    setReAuthError("");
  };

  const handleReAuth = () => {
    // Mock: password "admin123" is correct
    if (reAuthPassword === "admin123") {
      setShowReAuthModal(false);
      setReAuthPassword("");
      setShowApproveConfirm(true);
    } else {
      setReAuthAttempts((prev) => prev + 1);
      if (reAuthAttempts + 1 >= 3) {
        setReAuthError("Too many failed attempts. Please try again later.");
        setTimeout(() => setShowReAuthModal(false), 2000);
      } else {
        setReAuthError("Incorrect password. Please try again.");
      }
    }
  };

  const handleApproveConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: "Processing" as PayoutStatus,
              timeline: [
                {
                  id: `tl-approve-${Date.now()}`,
                  status: "Processing",
                  timestamp: new Date().toISOString(),
                  actor: "Admin",
                  notes: internalNotes || "Approved and moved to processing.",
                },
                ...prev.timeline,
              ],
            }
          : prev,
      );
      toast.success(
        "Payout approved and moved to Processing. Provider has been notified.",
      );
      setIsProcessing(false);
      setShowApproveConfirm(false);
      setInternalNotes("");
    }, 600);
  };

  const handleRejectSubmit = () => {
    if (rejectReason.trim().length < 10) {
      setRejectReasonError("Rejection reason must be at least 10 characters.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: "Rejected" as PayoutStatus,
              rejectionReason: rejectReason,
              timeline: [
                {
                  id: `tl-reject-${Date.now()}`,
                  status: "Rejected",
                  timestamp: new Date().toISOString(),
                  actor: "Admin",
                  notes: `Rejected: ${rejectReason}`,
                },
                ...prev.timeline,
              ],
            }
          : prev,
      );
      toast.success(
        "Payout rejected. Provider has been notified with the rejection reason.",
      );
      setIsProcessing(false);
      setShowRejectForm(false);
      setRejectReason("");
    }, 600);
  };

  const handlePartialPaymentSubmit = () => {
    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0) {
      setPartialError("Amount must be greater than zero.");
      return;
    }
    if (amount > remainingAmount) {
      setPartialError(
        `Amount cannot exceed remaining balance of ${fmtCurrency(remainingAmount)}.`,
      );
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newRemaining = remainingAmount - amount;
      const newStatus: PayoutStatus =
        newRemaining <= 0 ? "Settled" : "Partially Paid";
      const newPayment: PartialPayment = {
        id: `pp-${Date.now()}`,
        date: new Date().toISOString(),
        amountPaid: amount,
        remainingAfter: Math.max(0, newRemaining),
        adminUser: "Admin",
        notes: partialNotes || undefined,
      };

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              partialPayments: [...prev.partialPayments, newPayment],
              timeline: [
                {
                  id: `tl-partial-${Date.now()}`,
                  status: newStatus,
                  timestamp: new Date().toISOString(),
                  actor: "Admin",
                  notes: `Partial payment of ${fmtCurrency(amount)} recorded.${newRemaining <= 0 ? " Payout fully settled." : ""}`,
                },
                ...prev.timeline,
              ],
            }
          : prev,
      );

      if (newRemaining <= 0) {
        toast.success("Payout marked as settled. Locked balance released.");
      } else {
        toast.success(
          `Partial payment of ${fmtCurrency(amount)} recorded. Remaining: ${fmtCurrency(newRemaining)}.`,
        );
      }
      setIsProcessing(false);
      setShowPartialForm(false);
      setPartialAmount("");
      setPartialNotes("");
    }, 600);
  };

  const handleSettleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: "Settled" as PayoutStatus,
              timeline: [
                {
                  id: `tl-settle-${Date.now()}`,
                  status: "Settled",
                  timestamp: new Date().toISOString(),
                  actor: "Admin",
                  notes:
                    internalNotes ||
                    "Payout marked as settled. Bank transfer confirmed.",
                },
                ...prev.timeline,
              ],
            }
          : prev,
      );
      toast.success("Payout marked as settled. Locked balance released.");
      setIsProcessing(false);
      setShowSettleConfirm(false);
      setInternalNotes("");
    }, 600);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Breadcrumb + Header */}
      <div>
        <nav className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
          <button
            onClick={() => navigate("/")}
            className="hover:text-[#003B95] cursor-pointer"
          >
            Admin
          </button>
          <span>/</span>
          <span className="text-gray-400">Financial</span>
          <span>/</span>
          <button
            onClick={() => navigate("/payouts")}
            className="hover:text-[#003B95] cursor-pointer"
          >
            Payouts
          </button>
          <span>/</span>
          <span className="text-gray-900">{detail.id}</span>
        </nav>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => navigate("/payouts")}
              aria-label="Back to Payout Management list"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-[#111827]">
              Payout Request {detail.id}
            </h1>
          </div>
          <StatusBadge status={detail.status} />
        </div>
      </div>

      {/* Alert Banners */}
      {!bankApproved && detail.status === "Pending" && (
        <div
          className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            This provider's bank account is not approved. Payout cannot be
            approved until bank verification is complete.
            <button
              onClick={() => navigate("/bank-verification")}
              className="ml-2 text-red-700 underline hover:text-red-900"
            >
              Go to Bank Verification
            </button>
          </div>
        </div>
      )}

      {belowThreshold && (
        <div
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
          <div className="flex-1">
            This payout request ({fmtCurrency(detail.requestedAmount)}) is below
            the minimum payout threshold ({MIN_PAYOUT_THRESHOLD} SAR).
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-[55fr_45fr] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Provider Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                Provider Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-900">
                  {detail.provider.name}
                </span>
                <ProviderTypeBadge type={detail.provider.type} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {detail.provider.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {detail.provider.phone}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px] border",
                    detail.provider.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-500 border-gray-200",
                  )}
                >
                  {detail.provider.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                Bank Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Account Holder">
                {detail.bankAccount.holderName}
              </InfoRow>
              <InfoRow label="Bank Name">{detail.bankAccount.bankName}</InfoRow>
              <InfoRow label="IBAN (Masked)">
                <span
                  aria-label={`IBAN ending in ${detail.bankAccount.ibanMasked.slice(-4)}`}
                >
                  {detail.bankAccount.ibanMasked}
                </span>
              </InfoRow>
              <InfoRow label="Bank Status">
                <BankStatusBadge status={detail.bankAccount.status} />
              </InfoRow>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#003B95] text-xs p-0 h-auto"
                onClick={() => navigate("/bank-verification")}
              >
                View Bank Details
              </Button>
            </CardContent>
          </Card>

          {/* Wallet Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-gray-500" />
                Wallet Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Available Balance">
                <span className="tabular-nums font-medium">
                  {fmtCurrency(detail.wallet.availableBalance)}
                </span>
              </InfoRow>
              <InfoRow label="Locked Balance">
                <span className="tabular-nums font-medium text-amber-700">
                  {fmtCurrency(detail.wallet.lockedBalance)}
                </span>
              </InfoRow>
              <InfoRow label="Lifetime Earnings">
                <span className="tabular-nums">
                  {fmtCurrency(detail.wallet.lifetimeEarnings)}
                </span>
              </InfoRow>
            </CardContent>
          </Card>

          {/* Payout Cycle Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                Payout Cycle Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Cycle Duration">
                {detail.cycle.cycleDuration}
              </InfoRow>
              <InfoRow label="Current Cycle">
                {fmtDate(detail.cycle.currentCycleStart)} -{" "}
                {fmtDate(detail.cycle.currentCycleEnd)}
              </InfoRow>
              <InfoRow label="Next Payout Date">
                {fmtDate(detail.cycle.nextPayoutDate)}
              </InfoRow>
              <InfoRow label="Amount Paid (this cycle)">
                <span className="tabular-nums">
                  {fmtCurrency(detail.cycle.amountPaidThisCycle)}
                </span>
              </InfoRow>
              <InfoRow label="Amount Remaining (this cycle)">
                <span className="tabular-nums font-medium">
                  {fmtCurrency(detail.cycle.amountRemainingThisCycle)}
                </span>
              </InfoRow>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Payout Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-gray-500" />
                Payout Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Request ID">
                <span className="font-mono text-xs">{detail.id}</span>
              </InfoRow>
              <div className="bg-[#003B95]/5 border border-[#003B95]/20 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-[#003B95]">Requested Amount</span>
                <span className="text-lg font-bold text-[#003B95] tabular-nums">
                  {fmtCurrency(detail.requestedAmount)}
                </span>
              </div>
              <InfoRow label="Request Date">
                {fmtDateTime(detail.requestDate)}
              </InfoRow>
              <InfoRow label="Current Status">
                <StatusBadge status={detail.status} />
              </InfoRow>
              {detail.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                  <span className="text-xs font-medium text-red-700">
                    Rejection Reason
                  </span>
                  <p className="text-sm text-red-800">
                    {detail.rejectionReason}
                  </p>
                </div>
              )}
              {detail.adminNotes && (
                <div className="bg-gray-50 border rounded-lg p-3 space-y-1">
                  <span className="text-xs font-medium text-gray-500">
                    Admin Notes
                  </span>
                  <p className="text-sm text-gray-700">{detail.adminNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Partial Payment History Card */}
          {detail.partialPayments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  Partial Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Date
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Amount Paid
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Remaining
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Admin
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Notes
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.partialPayments.map((pp) => (
                        <TableRow key={pp.id} className="text-xs">
                          <TableCell className="text-gray-600">
                            {fmtDateTime(pp.date)}
                          </TableCell>
                          <TableCell className="tabular-nums text-gray-900 font-medium">
                            {fmtCurrency(pp.amountPaid)}
                          </TableCell>
                          <TableCell className="tabular-nums text-gray-600">
                            {fmtCurrency(pp.remainingAfter)}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {pp.adminUser}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {pp.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pending actions */}
              {detail.status === "Pending" && (
                <>
                  {!showRejectForm ? (
                    <div className="flex items-center gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              className="bg-[#003B95] hover:bg-[#002d73] text-white gap-2"
                              onClick={handleApproveClick}
                              disabled={!bankApproved || isProcessing}
                              aria-label={`Approve payout for ${detail.provider.name}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve Payout
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!bankApproved && (
                          <TooltipContent>
                            Cannot approve -- provider's bank account is not
                            verified.
                          </TooltipContent>
                        )}
                      </Tooltip>
                      <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={() => setShowRejectForm(true)}
                        disabled={isProcessing}
                        aria-label={`Reject payout for ${detail.provider.name}`}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Payout
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 border rounded-lg p-4 bg-red-50/50">
                      <Label className="text-sm font-medium">
                        Rejection Reason <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => {
                          setRejectReason(e.target.value);
                          setRejectReasonError("");
                        }}
                        placeholder="Enter the reason for rejection..."
                        className="min-h-[80px]"
                        maxLength={500}
                        aria-required="true"
                      />
                      {rejectReasonError && (
                        <p className="text-xs text-red-500">
                          {rejectReasonError}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 text-right">
                        {rejectReason.length}/500
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRejectSubmit}
                          disabled={isProcessing}
                        >
                          {isProcessing && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          )}
                          Confirm Rejection
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectReason("");
                            setRejectReasonError("");
                          }}
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Internal notes for approve */}
                  {!showRejectForm && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">
                        Internal Notes (optional)
                      </Label>
                      <Textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Add internal notes (optional)..."
                        className="min-h-[60px] text-sm"
                        maxLength={500}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Processing actions */}
              {detail.status === "Processing" && (
                <>
                  {!showPartialForm ? (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowPartialForm(true)}
                        disabled={isProcessing}
                      >
                        <CreditCard className="h-4 w-4" />
                        Mark Partially Paid
                      </Button>
                      <Button
                        className="bg-[#003B95] hover:bg-[#002d73] text-white gap-2"
                        onClick={() => setShowSettleConfirm(true)}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Settled
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 border rounded-lg p-4 bg-blue-50/50">
                      <Label className="text-sm font-medium">
                        Amount Paid <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={partialAmount}
                          onChange={(e) => {
                            setPartialAmount(e.target.value);
                            setPartialError("");
                          }}
                          placeholder="0.00"
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          SAR
                        </span>
                      </div>
                      {partialError && (
                        <p className="text-xs text-red-500">{partialError}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Maximum: {fmtCurrency(remainingAmount)}
                      </p>
                      <Label className="text-xs text-gray-500">
                        Payment Notes (optional)
                      </Label>
                      <Textarea
                        value={partialNotes}
                        onChange={(e) => setPartialNotes(e.target.value)}
                        placeholder="Internal notes about this payment..."
                        className="min-h-[60px] text-sm"
                        maxLength={500}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#003B95] hover:bg-[#002d73] text-white"
                          onClick={handlePartialPaymentSubmit}
                          disabled={isProcessing}
                        >
                          {isProcessing && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          )}
                          Confirm Partial Payment
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPartialForm(false);
                            setPartialAmount("");
                            setPartialNotes("");
                            setPartialError("");
                          }}
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Partially Paid actions */}
              {detail.status === "Partially Paid" && (
                <>
                  {!showPartialForm ? (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowPartialForm(true)}
                        disabled={isProcessing}
                      >
                        <CreditCard className="h-4 w-4" />
                        Add Another Payment
                      </Button>
                      <Button
                        className="bg-[#003B95] hover:bg-[#002d73] text-white gap-2"
                        onClick={() => setShowSettleConfirm(true)}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Settled
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 border rounded-lg p-4 bg-blue-50/50">
                      <Label className="text-sm font-medium">
                        Amount Paid <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={partialAmount}
                          onChange={(e) => {
                            setPartialAmount(e.target.value);
                            setPartialError("");
                          }}
                          placeholder="0.00"
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          SAR
                        </span>
                      </div>
                      {partialError && (
                        <p className="text-xs text-red-500">{partialError}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Maximum: {fmtCurrency(remainingAmount)}
                      </p>
                      <Label className="text-xs text-gray-500">
                        Payment Notes (optional)
                      </Label>
                      <Textarea
                        value={partialNotes}
                        onChange={(e) => setPartialNotes(e.target.value)}
                        placeholder="Internal notes about this payment..."
                        className="min-h-[60px] text-sm"
                        maxLength={500}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#003B95] hover:bg-[#002d73] text-white"
                          onClick={handlePartialPaymentSubmit}
                          disabled={isProcessing}
                        >
                          {isProcessing && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          )}
                          Confirm Partial Payment
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPartialForm(false);
                            setPartialAmount("");
                            setPartialNotes("");
                            setPartialError("");
                          }}
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Settled / Rejected — no actions */}
              {(detail.status === "Settled" ||
                detail.status === "Rejected") && (
                <p className="text-sm text-gray-500 italic">
                  This payout has been {detail.status.toLowerCase()}. No further
                  actions available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-gray-500" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div role="list" className="space-y-4">
                {detail.timeline.map((entry, idx) => {
                  const iconCfg = TIMELINE_ICONS[entry.status] || {
                    icon: Clock,
                    color: "text-gray-500",
                  };
                  const Icon = iconCfg.icon;
                  const isFirst = idx === 0;

                  return (
                    <div key={entry.id} role="listitem" className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex items-center justify-center h-7 w-7 rounded-full shrink-0",
                            isFirst ? "bg-gray-100" : "bg-gray-50",
                          )}
                        >
                          <Icon className={cn("h-3.5 w-3.5", iconCfg.color)} />
                        </div>
                        {idx < detail.timeline.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isFirst ? "text-gray-900" : "text-gray-600",
                            )}
                          >
                            {entry.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmtDateTime(entry.timestamp)} &middot; {entry.actor}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Audit History Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                Audit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detail.auditHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No audit entries.</p>
              ) : (
                <div className="space-y-3">
                  {detail.auditHistory.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 text-xs"
                    >
                      <span className="text-gray-400 shrink-0 w-[140px]">
                        {fmtDateTime(entry.timestamp)}
                      </span>
                      <div className="flex-1">
                        <span className="text-gray-700 font-medium">
                          {entry.admin}
                        </span>
                        <span className="text-gray-500"> — {entry.action}</span>
                        {entry.amount && (
                          <span className="text-gray-600 ml-1 tabular-nums">
                            ({fmtCurrency(entry.amount)})
                          </span>
                        )}
                        {entry.notes && (
                          <p className="text-gray-400 mt-0.5">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {detail.auditHistory.length > 10 && (
                    <button
                      className="text-xs text-[#003B95] hover:underline"
                      onClick={() => navigate("/audit-trail")}
                    >
                      View Full Audit Trail
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Re-Auth Modal */}
      <Dialog
        open={showReAuthModal}
        onOpenChange={(v) => {
          if (!v) {
            setShowReAuthModal(false);
            setReAuthPassword("");
            setReAuthError("");
          }
        }}
      >
        <DialogContent
          className="max-w-sm"
          aria-label="Re-authenticate to approve payout"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              Confirm Your Identity
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Please re-enter your password to approve this payout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reauth-password">Password</Label>
              <Input
                id="reauth-password"
                type="password"
                value={reAuthPassword}
                onChange={(e) => {
                  setReAuthPassword(e.target.value);
                  setReAuthError("");
                }}
                placeholder="Enter your password to confirm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReAuth();
                }}
              />
              {reAuthError && (
                <p className="text-xs text-red-500">{reAuthError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowReAuthModal(false);
                setReAuthPassword("");
                setReAuthError("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#003B95] hover:bg-[#002d73] text-white"
              onClick={handleReAuth}
              disabled={!reAuthPassword}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirm Modal */}
      <Dialog
        open={showApproveConfirm}
        onOpenChange={(v) => {
          if (!v && !isProcessing) setShowApproveConfirm(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100">
                <CheckCircle className="h-4 w-4 text-amber-600" />
              </div>
              Approve Payout Request?
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Amount: {fmtCurrency(detail.requestedAmount)} for{" "}
              {detail.provider.name}. This will move the payout to Processing
              status. Confirm?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveConfirm(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#003B95] hover:bg-[#002d73] text-white"
              onClick={handleApproveConfirm}
              disabled={isProcessing}
            >
              {isProcessing && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle Confirm Modal */}
      <Dialog
        open={showSettleConfirm}
        onOpenChange={(v) => {
          if (!v && !isProcessing) setShowSettleConfirm(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100">
                <Banknote className="h-4 w-4 text-amber-600" />
              </div>
              Mark Payout as Settled?
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              This confirms the bank transfer of{" "}
              {fmtCurrency(detail.requestedAmount)} to {detail.provider.name}{" "}
              has been completed outside the platform. Locked balance will be
              released. Confirm?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">
              Internal Notes (optional)
            </Label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes (optional)..."
              className="min-h-[60px] text-sm"
              maxLength={500}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSettleConfirm(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#003B95] hover:bg-[#002d73] text-white"
              onClick={handleSettleConfirm}
              disabled={isProcessing}
            >
              {isProcessing && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Mark Settled
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
