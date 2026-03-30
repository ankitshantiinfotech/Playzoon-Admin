// ─── SCR-ADM-030: Bank Account Verification Detail ────────────────────────────
// Full-page detail view for an individual provider bank account submission.
// Allows admins to review bank details, view supporting documents, and
// approve/reject/revoke submissions. Two-column layout (60/40 split).

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft, User, Mail, Phone, Building2,
  Lock, FileText, ImageIcon, Download, Eye,
  CheckCircle2, XCircle, ShieldCheck, ShieldX, ShieldAlert,
  AlertTriangle, Clock, History, ExternalLink, Copy, CopyCheck,
  X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";
import {
  BankVerification, BVHistoryEntry,
  BV_STATUS_STYLES, BV_PROVIDER_TYPE_STYLES, BV_HISTORY_EVENT_STYLES,
  formatIBAN,
} from "./types";
import { INITIAL_VERIFICATIONS } from "./mockData";

// ─── Constants ──────────────────────────────────────────────────────────────

const CURRENT_ADMIN = "Super Admin";
const REASON_MIN = 10;
const REASON_MAX = 500;

// ─── Card Component ─────────────────────────────────────────────────────────

function DetailCard({ title, icon, children, ariaLabel }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; ariaLabel: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl" role="region" aria-label={ariaLabel}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <span className="text-[#6B7280]">{icon}</span>
        <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ─── Info Field ─────────────────────────────────────────────────────────────

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start px-0 py-2">
      <dt className="text-xs text-[#6B7280] w-40 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-[#111827]">{children}</dd>
    </div>
  );
}

// ─── IBAN Copy Button ───────────────────────────────────────────────────────

function IBANCopyButton({ iban }: { iban: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(iban.replace(/\s/g, "")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} title="Copy IBAN"
      className="ml-2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
      {copied ? <CopyCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── withHistory helper ─────────────────────────────────────────────────────

function withHistory(r: BankVerification, entry: Omit<BVHistoryEntry, "id">): BankVerification {
  return { ...r, history: [...r.history, { ...entry, id: `he-${Date.now()}` }] };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function BankVerificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find the record in mock data
  const initialRecord = INITIAL_VERIFICATIONS.find(r => r.id === id);
  const [record, setRecord] = useState<BankVerification | null>(initialRecord ?? null);

  // ── Action states ──
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRevokeForm, setShowRevokeForm] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  // ── Document viewer modal ──
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocIndex, setViewerDocIndex] = useState(0);

  // ── Validation ──
  const rejectValid = rejectReason.trim().length >= REASON_MIN && rejectReason.trim().length <= REASON_MAX;
  const revokeValid = revokeReason.trim().length >= REASON_MIN && revokeReason.trim().length <= REASON_MAX;

  // ── 404 State ──
  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">Submission Not Found</h1>
          <p className="text-sm text-[#6B7280] max-w-sm">
            Submission not found. It may have been removed or the URL is invalid.
          </p>
          <Button variant="outline" onClick={() => navigate("/bank-verification")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to List
          </Button>
        </div>
      </div>
    );
  }

  const ss = BV_STATUS_STYLES[record.status];
  const ts = BV_PROVIDER_TYPE_STYLES[record.providerType];

  // ── Sorted history ──
  const sortedHistory = [...record.history].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // ── Mock provider data for detail view ──
  const providerPhone = record.providerPhone ?? "+971 50 123 4567";
  const providerRegDate = record.providerRegistrationDate ?? new Date(record.submittedAt.getTime() - 30 * 86400000);
  const providerStatus = record.providerStatus ?? "Active";

  // ── Mock documents list ──
  const documents = record.documents ?? (record.document ? [record.document] : []);

  // ── Approve (irreversible per US-125 AC#10) ──
  const confirmApprove = () => {
    const now = new Date();
    let updated: BankVerification = {
      ...record,
      status: "Approved",
      reviewedAt: now,
      reviewedBy: CURRENT_ADMIN,
    };
    updated = withHistory(updated, {
      event: "Approved",
      actor: CURRENT_ADMIN,
      timestamp: now,
      note: `Bank account verified and approved. Provider is now eligible for payouts.`,
    });
    setRecord(updated);
    setApproveConfirmOpen(false);
    toast.success("Bank account approved. The provider is now eligible for payouts.");
  };

  // ── Reject (irreversible per US-125 AC#10) ──
  const confirmReject = () => {
    if (!rejectValid) return;
    const now = new Date();
    let updated: BankVerification = {
      ...record,
      status: "Rejected",
      reviewedAt: now,
      reviewedBy: CURRENT_ADMIN,
      rejectionReason: rejectReason.trim(),
    };
    updated = withHistory(updated, {
      event: "Rejected",
      actor: CURRENT_ADMIN,
      timestamp: now,
      reason: rejectReason.trim(),
    });
    setRecord(updated);
    setShowRejectForm(false);
    setRejectReason("");
    toast.success("Bank account rejected. The provider has been notified with the rejection reason.");
  };

  // ── Revoke ──
  const submitRevocation = () => {
    if (!revokeValid) return;
    const now = new Date();
    let updated: BankVerification = {
      ...record,
      revocationPending: true,
      revocationReason: revokeReason.trim(),
    };
    updated = withHistory(updated, {
      event: "Revocation Requested",
      actor: CURRENT_ADMIN,
      timestamp: now,
      reason: revokeReason.trim(),
      note: "Revocation request submitted. Awaiting Super Admin confirmation.",
    });
    setRecord(updated);
    setShowRevokeForm(false);
    setRevokeReason("");
    toast.success("Revocation request submitted. A Super Admin must confirm before it takes effect.");
  };

  const isPending = record.status === "Pending";
  const isApproved = record.status === "Approved";
  const isRejected = record.status === "Rejected";
  const isRevoked = record.status === "Revoked";

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]" role="main" aria-label="Bank Account Verification Detail">

      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280] flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => navigate("/bank-verification")}
          aria-label="Back to Bank Account Verification list"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="hover:text-[#003B95] cursor-pointer" onClick={() => navigate("/")}>Admin</span>
        <span className="mx-1">/</span>
        <span className="hover:text-[#003B95] cursor-pointer" onClick={() => navigate("/commissions")}>Financial</span>
        <span className="mx-1">/</span>
        <span className="hover:text-[#003B95] cursor-pointer" onClick={() => navigate("/bank-verification")}>Bank Account Verification</span>
        <span className="mx-1">/</span>
        <span className="text-[#111827] font-medium">{record.providerName}</span>
      </nav>

      {/* ── Page Title Row ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            {record.providerName} - Bank Account Verification
          </h1>
          <span
            className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", ss.bg, ss.text, ss.border)}
            aria-label={`Submission status: ${record.status}`}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", ss.dot)} />
            {record.status}
          </span>
        </div>
      </div>

      {/* ── Revocation Pending Banner ── */}
      {record.revocationPending && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Revocation pending approval from a Super Admin.</p>
            <p className="text-xs text-blue-700 mt-0.5">
              The revocation request has been submitted and is awaiting confirmation from a second Super Admin before it takes effect.
            </p>
          </div>
        </div>
      )}

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-5 gap-6">

        {/* ── Left Column (60%) ── */}
        <div className="col-span-3 space-y-6">

          {/* Provider Info Card */}
          <DetailCard title="Provider Information" icon={<User className="w-4 h-4" />} ariaLabel="Provider Information">
            <dl className="divide-y divide-gray-100">
              <InfoField label="Provider Name">{record.providerName}</InfoField>
              <InfoField label="Provider Type">
                <Badge variant="outline" className={cn("text-xs border", ts.bg, ts.text, ts.border)}>
                  {record.providerType}
                </Badge>
              </InfoField>
              <InfoField label="Email">
                <a href={`mailto:${record.providerEmail}`} className="text-[#003B95] hover:underline flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {record.providerEmail}
                </a>
              </InfoField>
              <InfoField label="Phone">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#6B7280]" /> {providerPhone}
                </span>
              </InfoField>
              <InfoField label="Registration Date">{format(providerRegDate, "dd MMM yyyy")}</InfoField>
              <InfoField label="Provider Status">
                <Badge variant="outline" className={cn("text-xs border",
                  providerStatus === "Active" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                  providerStatus === "Inactive" ? "bg-gray-100 text-gray-600 border-gray-200" :
                  providerStatus === "Pending" ? "bg-amber-100 text-amber-800 border-amber-200" :
                  "bg-red-100 text-red-800 border-red-200"
                )}>
                  {providerStatus}
                </Badge>
              </InfoField>
            </dl>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-[#003B95] hover:text-[#002d73] text-xs"
                onClick={() => navigate(`/providers/${record.providerId}`)}
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Provider
              </Button>
            </div>
          </DetailCard>

          {/* Bank Details Card */}
          <DetailCard title="Bank Account Details" icon={<Building2 className="w-4 h-4" />} ariaLabel="Bank Account Details">
            <dl className="divide-y divide-gray-100">
              <InfoField label="Account Holder Name">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span className="font-semibold">{record.accountHolderName}</span>
                </div>
              </InfoField>
              <InfoField label="Bank Name">{record.bankName}</InfoField>
              <InfoField label="Account Number / IBAN">
                <div className="flex items-center">
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#6B7280]" />
                    <span className="font-mono text-sm font-semibold tracking-widest">
                      {formatIBAN(record.ibanFull)}
                    </span>
                  </div>
                  <IBANCopyButton iban={record.ibanFull} />
                </div>
              </InfoField>
              {record.swiftCode && (
                <InfoField label="IFSC / SWIFT Code">
                  <span className="font-mono text-sm">{record.swiftCode}</span>
                </InfoField>
              )}
              <InfoField label="Submission Date">
                <div>
                  <p className="text-sm">{format(record.submittedAt, "dd MMM yyyy, HH:mm")} UTC</p>
                  <p className="text-[10px] text-[#9CA3AF]">{formatDistanceToNow(record.submittedAt, { addSuffix: true })}</p>
                </div>
              </InfoField>
              {record.submissionNotes && (
                <InfoField label="Submission Notes">
                  <p className="text-sm text-[#374151] italic">{record.submissionNotes}</p>
                </InfoField>
              )}
            </dl>
          </DetailCard>

          {/* Submission Timeline */}
          <DetailCard title="Submission Timeline" icon={<History className="w-4 h-4" />} ariaLabel="Submission Timeline">
            <div className="relative border-l-2 border-gray-200 ml-3 pl-5 space-y-5 pb-1" role="list">
              {sortedHistory.map((entry) => {
                const es = BV_HISTORY_EVENT_STYLES[entry.event] ?? { dot: "bg-gray-400", text: "text-gray-700" };
                return (
                  <div key={entry.id} className="relative" role="listitem">
                    <div className={cn("absolute -left-[21px] top-1.5 w-4 h-4 rounded-full border-2 border-white", es.dot)} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-sm font-semibold", es.text)}>{entry.event}</span>
                      <span className="text-xs text-[#9CA3AF]">{format(entry.timestamp, "dd MMM yyyy, HH:mm")} UTC</span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      by <strong className="text-[#111827]">{entry.actor}</strong>
                    </p>
                    {entry.note && <p className="text-xs text-[#6B7280] mt-0.5">{entry.note}</p>}
                    {entry.reason && (
                      <p className="text-xs text-red-600 italic mt-1 bg-red-50 border border-red-100 rounded px-2 py-1">
                        Reason: {entry.reason}
                      </p>
                    )}
                  </div>
                );
              })}
              {sortedHistory.length === 0 && (
                <p className="text-sm text-[#9CA3AF]">No timeline events recorded.</p>
              )}
            </div>
          </DetailCard>
        </div>

        {/* ── Right Column (40%) ── */}
        <div className="col-span-2 space-y-6">

          {/* Supporting Documents Card */}
          <DetailCard title="Supporting Documents" icon={<FileText className="w-4 h-4" />} ariaLabel="Supporting Documents">
            {documents.length > 0 ? (
              <div className="space-y-3" role="list">
                {documents.map((doc, i) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-3 space-y-2" role="listitem">
                    <div className="flex items-center gap-3">
                      {doc.type === "image"
                        ? <ImageIcon className="w-8 h-8 text-blue-500 shrink-0" />
                        : <FileText className="w-8 h-8 text-red-500 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827] truncate">{doc.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{doc.size} -- Uploaded {format(doc.uploadedAt, "dd MMM yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          setViewerDocIndex(i);
                          setViewerOpen(true);
                        }}
                        aria-label={`View ${doc.name} full screen`}
                      >
                        <Eye className="w-3.5 h-3.5" /> View Full Screen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => toast.info(`Downloading: ${doc.name}`)}
                        aria-label={`Download ${doc.name}`}
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-[#6B7280]">
                <FileText className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                No supporting documents provided by provider.
              </div>
            )}
          </DetailCard>

          {/* Action Card */}
          <DetailCard
            title="Actions"
            icon={isPending ? <Clock className="w-4 h-4" /> : isApproved ? <ShieldCheck className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />}
            ariaLabel="Verification Actions"
          >
            {/* Status-based content */}
            {isPending && !showRejectForm && (
              <div className="space-y-3">
                <p className="text-sm text-[#6B7280]">Review the bank details and supporting documents, then approve or reject the submission.</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setApproveConfirmOpen(true)}
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    aria-label={`Approve bank account for ${record.providerName}`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Bank Account
                  </Button>
                  <Button
                    onClick={() => setShowRejectForm(true)}
                    variant="destructive"
                    className="flex-1 gap-2"
                    aria-label={`Reject bank account for ${record.providerName}`}
                  >
                    <XCircle className="w-4 h-4" /> Reject Bank Account
                  </Button>
                </div>
              </div>
            )}

            {isPending && showRejectForm && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#111827]" htmlFor="reject-reason">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value.slice(0, REASON_MAX))}
                    placeholder="Enter the reason for rejection..."
                    rows={4}
                    maxLength={REASON_MAX}
                    className="text-sm resize-none mt-1"
                    aria-required="true"
                    aria-describedby="reject-reason-counter reject-reason-error"
                  />
                  <div className="flex justify-between mt-1">
                    <p
                      id="reject-reason-counter"
                      className={cn("text-xs", rejectReason.trim().length > 0 && rejectReason.trim().length < REASON_MIN ? "text-red-500" : "text-[#9CA3AF]")}
                    >
                      {rejectReason.trim().length} / {REASON_MAX}
                    </p>
                  </div>
                  {rejectReason.trim().length > 0 && rejectReason.trim().length < REASON_MIN && (
                    <p id="reject-reason-error" className="text-xs text-red-500 mt-1">
                      Rejection reason must be at least {REASON_MIN} characters.
                    </p>
                  )}
                  {rejectReason.trim().length === 0 && showRejectForm && (
                    <p id="reject-reason-error" className="text-xs text-red-500 mt-1">
                      Rejection reason is required.
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={confirmReject}
                    variant="destructive"
                    className="gap-2"
                    disabled={!rejectValid}
                  >
                    <XCircle className="w-4 h-4" /> Confirm Rejection
                  </Button>
                  <Button
                    onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isApproved && !record.revocationPending && !showRevokeForm && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Verified & Approved</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Approved by <strong>{record.reviewedBy}</strong> on {record.reviewedAt ? format(record.reviewedAt, "dd MMM yyyy, HH:mm") : "--"} UTC.
                      Payout processing is enabled for this provider.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowRevokeForm(true)}
                  variant="outline"
                  className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  aria-label={`Revoke approval for ${record.providerName}`}
                >
                  <ShieldX className="w-4 h-4" /> Revoke Approval
                </Button>
              </div>
            )}

            {isApproved && showRevokeForm && !record.revocationPending && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#111827]" htmlFor="revoke-reason">
                    Revocation Reason <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="revoke-reason"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value.slice(0, REASON_MAX))}
                    placeholder="Enter the reason for revocation..."
                    rows={4}
                    maxLength={REASON_MAX}
                    className="text-sm resize-none mt-1"
                    aria-required="true"
                    aria-describedby="revoke-reason-counter revoke-reason-error"
                  />
                  <div className="flex justify-between mt-1">
                    <p
                      id="revoke-reason-counter"
                      className={cn("text-xs", revokeReason.trim().length > 0 && revokeReason.trim().length < REASON_MIN ? "text-red-500" : "text-[#9CA3AF]")}
                    >
                      {revokeReason.trim().length} / {REASON_MAX}
                    </p>
                  </div>
                  {revokeReason.trim().length > 0 && revokeReason.trim().length < REASON_MIN && (
                    <p id="revoke-reason-error" className="text-xs text-red-500 mt-1">
                      Revocation reason must be at least {REASON_MIN} characters.
                    </p>
                  )}
                  {revokeReason.trim().length === 0 && showRevokeForm && (
                    <p id="revoke-reason-error" className="text-xs text-red-500 mt-1">
                      Revocation reason is required.
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={submitRevocation}
                    variant="destructive"
                    className="gap-2"
                    disabled={!revokeValid}
                  >
                    <ShieldX className="w-4 h-4" /> Submit Revocation Request
                  </Button>
                  <Button
                    onClick={() => { setShowRevokeForm(false); setRevokeReason(""); }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isApproved && record.revocationPending && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Revocation Pending</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Revocation pending approval from a Super Admin.
                  </p>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <ShieldX className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Rejected by {record.reviewedBy} on {record.reviewedAt ? format(record.reviewedAt, "dd MMM yyyy") : "--"}
                    </p>
                    {record.rejectionReason && (
                      <p className="text-sm text-red-700 mt-1 italic">"{record.rejectionReason}"</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isRevoked && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <ShieldX className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Approval Revoked</p>
                  {record.revocationReason && (
                    <p className="text-sm text-gray-600 mt-1 italic">"{record.revocationReason}"</p>
                  )}
                </div>
              </div>
            )}
          </DetailCard>

          {/* Audit History Card */}
          <DetailCard title="Audit History" icon={<History className="w-4 h-4" />} ariaLabel="Audit History">
            {sortedHistory.length > 0 ? (
              <div className="space-y-3">
                {sortedHistory.slice(0, 10).map((entry) => {
                  const es = BV_HISTORY_EVENT_STYLES[entry.event] ?? { dot: "bg-gray-400", text: "text-gray-700" };
                  return (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", es.dot)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("font-medium", es.text)}>{entry.event}</p>
                          <span className="text-xs text-[#9CA3AF] whitespace-nowrap">
                            {format(entry.timestamp, "dd MMM yyyy, HH:mm")} UTC
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280]">
                          by {entry.actor}
                          {entry.reason && ` -- ${entry.reason}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {sortedHistory.length > 10 && (
                  <button className="text-xs text-[#003B95] hover:underline font-medium">
                    View Full Audit Trail
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF]">No audit history available.</p>
            )}
          </DetailCard>
        </div>
      </div>

      {/* ── Approve Confirmation Modal ── */}
      <AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <AlertDialogContent role="alertdialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-600" /> Approve Bank Account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-[#6B7280] mt-1">
                <p>
                  This action is irreversible. The provider will become eligible for payouts. Confirm approval?
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
                  <p className="font-semibold text-[#111827]">{record.providerName}</p>
                  <p className="text-xs text-[#6B7280]">{record.providerType}</p>
                  <p className="text-xs text-[#6B7280] font-mono tracking-wider mt-1">IBAN: {formatIBAN(record.ibanFull)}</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} className="bg-emerald-600 hover:bg-emerald-700">
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Document Viewer Modal ── */}
      {viewerOpen && documents.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          role="dialog"
          aria-label="Document viewer"
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={() => setViewerOpen(false)}
              aria-label="Close document viewer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-col items-center gap-4 max-w-4xl w-full px-8">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full aspect-[4/3] flex items-center justify-center">
              {documents[viewerDocIndex]?.type === "image" ? (
                <div className="text-center">
                  <ImageIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-[#6B7280]">Image preview: {documents[viewerDocIndex]?.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-[#6B7280]">PDF preview: {documents[viewerDocIndex]?.name}</p>
                </div>
              )}
            </div>
            {documents.length > 1 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => setViewerDocIndex(i => Math.max(0, i - 1))}
                  disabled={viewerDocIndex === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-sm text-white">
                  Page {viewerDocIndex + 1} of {documents.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => setViewerDocIndex(i => Math.min(documents.length - 1, i + 1))}
                  disabled={viewerDocIndex === documents.length - 1}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
