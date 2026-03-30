import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  X, User, Mail, Building2, Globe2, CopyCheck, Copy, FileText,
  ImageIcon, Download, CheckCircle2, XCircle, StickyNote, Save,
  RotateCcw, AlertTriangle, Lock, Info, ExternalLink, Clock,
  ShieldCheck, ShieldX, History,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";
import {
  BankVerification, BVHistoryEntry,
  BV_STATUS_STYLES, BV_PROVIDER_TYPE_STYLES, BV_HISTORY_EVENT_STYLES,
  canApprove, canReject, formatIBAN,
} from "./types";

// ─── Constants ───────────────────────────────────────────────

const CURRENT_ADMIN     = "Super Admin";
const REJECT_REASON_MIN = 10;
const REJECT_REASON_MAX = 500;
const NOTES_MAX         = 1000;

const QUICK_REJECT_REASONS = [
  "IBAN does not match the supporting document",
  "Account holder name does not match the registered legal name",
  "SWIFT/BIC code does not match the bank name provided",
  "Supporting document is outdated (older than 3 months)",
  "Document is illegible or corrupted",
  "Third-party account detected — account must be in provider's name",
  "IBAN country does not match registered address country",
];

// ─── Props ───────────────────────────────────────────────────

interface Props {
  record: BankVerification;
  allRecords: BankVerification[];       // For resolving previous-rejection link
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: BankVerification) => void;
}

// ─── Tab ─────────────────────────────────────────────────────

type PanelTab = "details" | "history" | "notes";

// ─── Helpers ─────────────────────────────────────────────────

function withHistory(r: BankVerification, entry: Omit<BVHistoryEntry, "id">): BankVerification {
  return { ...r, history: [...r.history, { ...entry, id: `he-${Date.now()}` }] };
}

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

// ─── Component ───────────────────────────────────────────────

export function BankVerificationDetailPanel({ record, allRecords, isOpen, onClose, onUpdate }: Props) {
  const [tab,                setTab]                = useState<PanelTab>("details");
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectOpen,         setRejectOpen]         = useState(false);
  const [rejectReason,       setRejectReason]       = useState("");
  const [selectedQuickReason, setSelectedQuickReason] = useState("");
  const [noteText,           setNoteText]           = useState(record.adminNotes ?? "");
  const [notesSaved,         setNotesSaved]         = useState(false);

  // Reset when record changes
  useEffect(() => {
    setTab("details");
    setRejectReason("");
    setSelectedQuickReason("");
    setNoteText(record.adminNotes ?? "");
    setNotesSaved(false);
  }, [record.id]);

  const ss  = BV_STATUS_STYLES[record.status];
  const ts  = BV_PROVIDER_TYPE_STYLES[record.providerType];

  const rejectValid = rejectReason.trim().length >= REJECT_REASON_MIN && rejectReason.trim().length <= REJECT_REASON_MAX;
  const notesChanged = noteText !== (record.adminNotes ?? "");

  // Previous rejection record (for resubmission chain)
  const previousRecord = record.isResubmission && record.previousVerificationId
    ? allRecords.find((r) => r.id === record.previousVerificationId) ?? null
    : null;

  // ─── Approve (BR-125-03) ─────────────────────────────────

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
      note: `Bank account verified and approved. Payout processing enabled for ${record.providerName}.`,
    });
    onUpdate(updated);
    setApproveConfirmOpen(false);
    toast.success(`Bank account approved for ${record.providerName}. Provider notified: "Your bank account has been verified. Payouts are now enabled."`);
  };

  // ─── Reject (BR-125-04) ──────────────────────────────────

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
    onUpdate(updated);
    setRejectOpen(false);
    setRejectReason("");
    setSelectedQuickReason("");
    toast.error(`Bank account rejected for ${record.providerName}. Provider notified with rejection reason.`);
  };

  // ─── Save Notes (BR-125-08) ──────────────────────────────

  const saveNotes = () => {
    const now = new Date();
    let updated: BankVerification = { ...record, adminNotes: noteText.trim() };
    if (noteText.trim() && noteText.trim() !== record.adminNotes) {
      updated = withHistory(updated, { event: "Note Added", actor: CURRENT_ADMIN, timestamp: now, note: noteText.trim() });
    }
    onUpdate(updated);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
    toast.success("Admin notes saved (internal only — not visible to provider).");
  };

  // ─── Quick-reason handler ─────────────────────────────────

  const handleQuickReason = (r: string) => {
    setSelectedQuickReason(r);
    setRejectReason(r);
  };

  // ─── History sorted ───────────────────────────────────────

  const sortedHistory = [...record.history].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const TABS: { id: PanelTab; label: string; count?: number }[] = [
    { id: "details", label: "Bank Details" },
    { id: "history", label: "Verification History", count: sortedHistory.length },
    { id: "notes",   label: "Admin Notes" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className={cn("fixed inset-0 bg-black/40 z-40 transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={onClose} />

      {/* Panel */}
      <div className={cn("fixed inset-y-0 right-0 z-50 w-full max-w-[600px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full")}>

        {/* ── Header ── */}
        <div className="shrink-0 border-b border-gray-200 bg-gray-50/70 px-5 pt-5 pb-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">{record.id}</span>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", ss.bg, ss.text, ss.border)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", ss.dot)} />
                  {record.status}
                </span>
                {record.isResubmission && (
                  <span className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                    <RotateCcw className="w-3 h-3" /> Resubmission
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-gray-900 pr-8">{record.providerName}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", ts.bg, ts.text, ts.border)}>
                  {record.providerType}
                </span>
                <a href={`mailto:${record.providerEmail}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Mail className="w-3 h-3" />{record.providerEmail}
                </a>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 shrink-0 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b-0">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("px-4 py-2.5 text-xs font-medium border-b-2 transition-colors",
                  tab === t.id ? "border-blue-600 text-blue-700 bg-blue-50/40" : "border-transparent text-gray-500 hover:text-gray-700")}>
                {t.label}
                {t.count !== undefined && (
                  <span className={cn("ml-1.5 text-[10px] px-1 py-0.5 rounded-full", tab === t.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500")}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* ════ DETAILS TAB ════ */}
            {tab === "details" && (
              <>
                {/* Resubmission notice */}
                {record.isResubmission && previousRecord && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <RotateCcw className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">Resubmission — Previous record: {previousRecord.id}</p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        Previous submission was <strong>rejected</strong> on {previousRecord.reviewedAt ? format(previousRecord.reviewedAt, "dd MMM yyyy") : "—"} by {previousRecord.reviewedBy}.
                        Switch to the <strong>Verification History</strong> tab to view the full rejection chain.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejection notice (if already rejected) */}
                {record.status === "Rejected" && record.rejectionReason && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <ShieldX className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Rejected by {record.reviewedBy} on {record.reviewedAt ? format(record.reviewedAt, "dd MMM yyyy") : "—"}</p>
                      <p className="text-sm text-red-700 mt-1 italic">"{record.rejectionReason}"</p>
                    </div>
                  </div>
                )}

                {/* Approved notice */}
                {record.status === "Approved" && (
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Verified & Approved</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Approved by <strong>{record.reviewedBy}</strong> on {record.reviewedAt ? format(record.reviewedAt, "dd MMM yyyy 'at' HH:mm") : "—"}.
                        Payout processing is enabled for this provider.
                      </p>
                    </div>
                  </div>
                )}

                {/* BR-125-01 payout blocked notice */}
                {record.status === "Pending" && (
                  <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>BR-125-01:</strong> Payout requests for this provider are <strong>blocked</strong> until bank account verification is approved.</span>
                  </div>
                )}

                {/* ── Bank Details ── */}
                <section>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Bank Account Details
                  </p>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">

                    {/* Account Holder */}
                    <div className="flex items-start px-4 py-3 border-b border-gray-200">
                      <span className="text-xs text-gray-500 w-40 shrink-0 pt-0.5">Account Holder</span>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-900">{record.accountHolderName}</span>
                      </div>
                    </div>

                    {/* Bank Name */}
                    <div className="flex items-start px-4 py-3 border-b border-gray-200">
                      <span className="text-xs text-gray-500 w-40 shrink-0 pt-0.5">Bank Name</span>
                      <span className="text-sm text-gray-800">{record.bankName}</span>
                    </div>

                    {/* Country */}
                    <div className="flex items-start px-4 py-3 border-b border-gray-200">
                      <span className="text-xs text-gray-500 w-40 shrink-0 pt-0.5">Bank Country</span>
                      <div className="flex items-center gap-1.5">
                        <Globe2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-800">{record.bankCountry}</span>
                      </div>
                    </div>

                    {/* IBAN — Full (BR-125-06: visible to Admin only in detail view) */}
                    <div className="flex items-start px-4 py-3 border-b border-gray-200 bg-blue-50/30">
                      <span className="text-xs text-gray-500 w-40 shrink-0 pt-0.5 flex items-center gap-1">
                        IBAN <Lock className="w-3 h-3 text-gray-400" title="Admin-only — never exposed via API to non-admin" />
                      </span>
                      <div>
                        <div className="flex items-center">
                          <span className="font-mono text-sm font-semibold text-gray-900 tracking-widest">
                            {formatIBAN(record.ibanFull)}
                          </span>
                          <IBANCopyButton iban={record.ibanFull} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">Full IBAN — Admin view only (BR-125-06)</p>
                      </div>
                    </div>

                    {/* SWIFT */}
                    {record.swiftCode && (
                      <div className="flex items-start px-4 py-3 border-b border-gray-200">
                        <span className="text-xs text-gray-500 w-40 shrink-0 pt-0.5">SWIFT / BIC</span>
                        <span className="font-mono text-sm text-gray-800">{record.swiftCode}</span>
                      </div>
                    )}

                    {/* Submitted */}
                    <div className="flex items-start px-4 py-3">
                      <span className="text-xs text-gray-500 w-40 shrink-0 pt-0.5">Submitted</span>
                      <div>
                        <p className="text-sm text-gray-800">{format(record.submittedAt, "dd MMM yyyy 'at' HH:mm")}</p>
                        <p className="text-[10px] text-gray-400">{formatDistanceToNow(record.submittedAt, { addSuffix: true })}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── Supporting Document ── */}
                <section>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Supporting Document
                  </p>
                  {record.document ? (
                    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3">
                        {record.document.type === "image"
                          ? <ImageIcon className="w-8 h-8 text-blue-500 shrink-0" />
                          : <FileText className="w-8 h-8 text-red-500 shrink-0" />}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{record.document.name}</p>
                          <p className="text-xs text-gray-400">{record.document.size} · Uploaded {format(record.document.uploadedAt, "dd MMM yyyy")}</p>
                        </div>
                      </div>
                      <button onClick={() => { toast.info(`Downloading: ${record.document!.name}`); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500">
                      <Info className="w-4 h-4 text-gray-400 shrink-0" />
                      No supporting document provided by provider.
                    </div>
                  )}
                </section>

                {/* ── Admin Actions ── */}
                {(canApprove(record) || canReject(record)) && (
                  <>
                    <Separator />
                    <section>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Admin Actions</p>
                      <div className="flex gap-3">
                        {/* Approve (BR-125-03) */}
                        <Button onClick={() => setApproveConfirmOpen(true)}
                          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle2 className="w-4 h-4" /> Approve Account
                        </Button>
                        {/* Reject (BR-125-04) */}
                        <Button onClick={() => setRejectOpen(true)} variant="destructive"
                          className="flex-1 gap-2">
                          <XCircle className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    </section>
                  </>
                )}
              </>
            )}

            {/* ════ HISTORY TAB (BR-125-05) ════ */}
            {tab === "history" && (
              <section>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Full Verification Timeline
                </p>

                {/* Previous rejection record chain */}
                {record.isResubmission && previousRecord && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                    <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1.5">
                      <RotateCcw className="w-3 h-3" /> Previous Record: {previousRecord.id}
                    </p>
                    <div className="relative border-l-2 border-orange-200 ml-2 pl-4 space-y-3">
                      {[...previousRecord.history]
                        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                        .map((entry) => {
                          const es = BV_HISTORY_EVENT_STYLES[entry.event];
                          return (
                            <div key={entry.id} className="relative">
                              <div className={cn("absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-white", es.dot)} />
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn("text-xs font-semibold", es.text)}>{entry.event}</span>
                                <span className="text-[10px] text-gray-400">{format(entry.timestamp, "dd MMM yyyy · HH:mm")}</span>
                              </div>
                              <p className="text-[11px] text-gray-500">by <strong className="text-gray-700">{entry.actor}</strong></p>
                              {entry.reason && <p className="text-[11px] text-red-600 italic mt-0.5">Reason: {entry.reason}</p>}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Current record history */}
                <div className="relative border-l-2 border-gray-200 ml-3 pl-5 space-y-5 pb-1">
                  {sortedHistory.map((entry) => {
                    const es = BV_HISTORY_EVENT_STYLES[entry.event];
                    return (
                      <div key={entry.id} className="relative">
                        <div className={cn("absolute -left-[21px] top-1.5 w-4 h-4 rounded-full border-2 border-white", es.dot)} />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-sm font-semibold", es.text)}>{entry.event}</span>
                          <span className="text-xs text-gray-400">{format(entry.timestamp, "dd MMM yyyy · HH:mm")}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">by <strong className="text-gray-700">{entry.actor}</strong></p>
                        {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                        {entry.reason && (
                          <p className="text-xs text-red-600 italic mt-1 bg-red-50 border border-red-100 rounded px-2 py-1">
                            Rejection reason: {entry.reason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ════ NOTES TAB (BR-125-08) ════ */}
            {tab === "notes" && (
              <section className="space-y-3">
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Internal only (BR-125-08):</strong> Admin notes are never visible to the provider in any portal or notification.</span>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" /> Admin Internal Notes
                </p>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value.slice(0, NOTES_MAX))}
                  placeholder="Add internal notes about this verification (e.g., document verification steps taken, any anomalies noticed, cross-checks performed)…"
                  rows={8}
                  className="text-sm resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className={cn("text-xs", noteText.length >= NOTES_MAX * 0.9 ? "text-amber-600" : "text-gray-400")}>
                    {noteText.length} / {NOTES_MAX} characters
                  </p>
                  <Button onClick={saveNotes} disabled={!notesChanged} size="sm" variant="outline"
                    className={cn("gap-2", notesSaved && "border-emerald-300 text-emerald-700 hover:bg-emerald-50")}>
                    {notesSaved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Notes</>}
                  </Button>
                </div>
              </section>
            )}

            <div className="h-4" />
          </div>
        </ScrollArea>

        {/* ── Footer (always-visible action bar for Pending) ── */}
        {record.status === "Pending" && tab !== "details" && (
          <div className="shrink-0 border-t border-gray-200 px-5 py-3 bg-gray-50 flex items-center gap-3">
            <Button onClick={() => { setApproveConfirmOpen(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Approve
            </Button>
            <Button onClick={() => setRejectOpen(true)} variant="destructive" className="gap-2">
              <XCircle className="w-4 h-4" /> Reject
            </Button>
            <button onClick={onClose} className="ml-auto px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
              Close
            </button>
          </div>
        )}
      </div>

      {/* ── Approve Confirmation (BR-125-03) ── */}
      <AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Approve Bank Account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-gray-600 mt-1">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex gap-3">
                    <img src={record.providerAvatar} alt={record.providerName} className="w-8 h-8 rounded-full border border-gray-200 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">{record.providerName}</p>
                      <p className="text-xs text-gray-500">{record.providerType}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-mono tracking-wider mt-1">IBAN: {formatIBAN(record.ibanFull)}</p>
                </div>
                <p>On approval (BR-125-03):</p>
                <ul className="space-y-1 pl-4">
                  {[
                    "Verification status set to Approved",
                    "Payout processing enabled for this provider",
                    `Provider receives in-app + push notification: "Your bank account has been verified. Payouts are now enabled."`,
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} className="bg-emerald-600 hover:bg-emerald-700">
              Confirm Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject Modal (BR-125-04) ── */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent className="z-[60] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" /> Reject Bank Account
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm text-gray-600 mt-1">
                <p>You are rejecting the bank account submission for <strong>{record.providerName}</strong>.</p>

                {/* Quick-reason chips */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Quick reasons:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REJECT_REASONS.map((r) => (
                      <button key={r} onClick={() => handleQuickReason(r)}
                        className={cn("text-xs px-2.5 py-1.5 rounded-full border transition-colors",
                          selectedQuickReason === r ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-300 hover:border-red-300 hover:text-red-700")}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason textarea */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Rejection reason <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(min {REJECT_REASON_MIN} chars — shared with provider)</span>
                  </label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => { setRejectReason(e.target.value.slice(0, REJECT_REASON_MAX)); setSelectedQuickReason(""); }}
                    placeholder="Explain why the bank account details are being rejected. This reason will be sent to the provider…"
                    rows={4}
                    maxLength={REJECT_REASON_MAX}
                    className="text-sm resize-none"
                  />
                  <div className="flex justify-between">
                    <p className={cn("text-[10px]", !rejectReason.trim() || rejectReason.trim().length < REJECT_REASON_MIN ? "text-red-500" : "text-gray-400")}>
                      {rejectReason.trim().length} / {REJECT_REASON_MAX}
                      {rejectReason.trim().length > 0 && rejectReason.trim().length < REJECT_REASON_MIN && ` (need ${REJECT_REASON_MIN - rejectReason.trim().length} more)`}
                    </p>
                  </div>
                </div>

                {/* Provider notification preview */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Provider will receive (BR-125-04):</p>
                  <p className="italic">In-app + push notification: "Your bank account submission has been rejected. Reason: [your reason]. Please log in to resubmit corrected details."</p>
                  <p>Payout processing will remain blocked until a new submission is approved.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRejectReason(""); setSelectedQuickReason(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} disabled={!rejectValid}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
