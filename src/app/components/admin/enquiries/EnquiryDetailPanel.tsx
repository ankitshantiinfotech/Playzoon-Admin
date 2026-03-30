import { useState, useRef, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  X, User, Mail, Phone, ExternalLink,
  Paperclip, FileText, ImageIcon, Send,
  StickyNote, UserCheck, Clock, Shield,
  MessageSquare, CheckCircle2, RefreshCw,
  ChevronUp, AlertTriangle, Info,
  Video as VideoIcon, ShieldAlert,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";
import type { Enquiry, ThreadMessage, StatusHistoryEntry } from "./enquiry-types";
import {
  ADMIN_TEAM, CATEGORY_STYLES, STATUS_STYLES, ACCOUNT_TYPE_STYLES,
  HISTORY_EVENT_STYLES,
} from "./enquiry-types";

// ─── Constants ───────────────────────────────────────────────

const CURRENT_ADMIN = "Super Admin";
const REPLY_MIN     = 10;
const REPLY_MAX     = 3000;

// ─── Props ───────────────────────────────────────────────────

interface Props {
  enquiry: Enquiry;
  onClose: () => void;
  onUpdate: (updated: Enquiry) => void;
  focusReply?: boolean; // set true when opened via "Reply" quick-action
}

// ─── Tab type ────────────────────────────────────────────────

type PanelTab = "thread" | "timeline" | "notes";

// ─── Component ───────────────────────────────────────────────

export function EnquiryDetailPanel({ enquiry, onClose, onUpdate, focusReply = false }: Props) {
  const [replyText,          setReplyText]          = useState("");
  const [noteText,           setNoteText]           = useState("");
  const [replyConfirmOpen,   setReplyConfirmOpen]   = useState(false);
  const [resolveConfirmOpen, setResolveConfirmOpen] = useState(false);
  const [escalateOpen,       setEscalateOpen]       = useState(false);
  const [escalateTarget,     setEscalateTarget]     = useState<string>("");
  const [escalateNote,       setEscalateNote]       = useState("");
  const [tab,                setTab]                = useState<PanelTab>("thread");
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const catStyle    = CATEGORY_STYLES[enquiry.category];
  const statusStyle = STATUS_STYLES[enquiry.status];
  const accStyle    = ACCOUNT_TYPE_STYLES[enquiry.accountType];

  const isResolved = enquiry.status === "Resolved";
  const replyValid = replyText.trim().length >= REPLY_MIN && replyText.trim().length <= REPLY_MAX;

  // ── BR-124-02: Auto-advance "Open" → "In Progress" on view ─
  useEffect(() => {
    if (enquiry.status === "Open") {
      const now = new Date();
      const viewedEntry: StatusHistoryEntry = {
        id: `sh-view-${Date.now()}`,
        event: "Viewed",
        actor: CURRENT_ADMIN,
        timestamp: now,
        note: "Admin opened enquiry — status auto-advanced to In Progress",
      };
      onUpdate({
        ...enquiry,
        status: "In Progress",
        lastUpdated: now,
        statusHistory: [...enquiry.statusHistory, viewedEntry],
      });
    }
    // Only run when the enquiry ID changes (i.e. different enquiry opened)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiry.id]);

  // Focus reply textarea when opened via "Reply" quick-action
  useEffect(() => {
    if (focusReply && replyRef.current) {
      setTimeout(() => replyRef.current?.focus(), 350);
    }
  }, [focusReply]);

  // ─── Helper: append status history entry ─────────────────

  function withHistory(e: Enquiry, entry: Omit<StatusHistoryEntry, "id">): Enquiry {
    return {
      ...e,
      statusHistory: [...e.statusHistory, { ...entry, id: `sh-${Date.now()}` }],
    };
  }

  // ─── Assign ───────────────────────────────────────────────

  const handleAssign = (adminName: string) => {
    const now = new Date();
    let updated: Enquiry = {
      ...enquiry,
      assignedTo: adminName === "__unassigned__" ? null : adminName,
      lastUpdated: now,
    };
    if (adminName !== "__unassigned__") {
      updated = withHistory(updated, { event: "Assigned", actor: CURRENT_ADMIN, timestamp: now, note: `Assigned to ${adminName}` });
    }
    onUpdate(updated);
    toast.success(adminName === "__unassigned__" ? "Assignment removed" : `Assigned to ${adminName}`);
  };

  // ─── Reply (BR-124-03 / BR-124-05) ───────────────────────

  const handleReplySubmit = () => {
    if (!replyValid) return;
    setReplyConfirmOpen(true);
  };

  const confirmReply = () => {
    const now = new Date();
    const msg: ThreadMessage = {
      id: `t-${Date.now()}`,
      from: "admin",
      authorName: CURRENT_ADMIN,
      body: replyText.trim(),
      timestamp: now,
    };
    let updated: Enquiry = {
      ...enquiry,
      thread: [...enquiry.thread, msg],
      lastUpdated: now,
    };
    updated = withHistory(updated, {
      event: "Replied",
      actor: CURRENT_ADMIN,
      timestamp: now,
      note: `Email sent to ${enquiry.submitterEmail} — Re: Your Enquiry [${enquiry.id}]${enquiry.isGuest ? " (email only — guest)" : ""}`,
    });
    onUpdate(updated);
    setReplyText("");
    setReplyConfirmOpen(false);
    // BR-124-05 / BR-124-07
    const notifMsg = enquiry.isGuest
      ? `Reply sent via email to ${enquiry.submitterEmail} (guest — no in-app notification)`
      : `Reply sent to ${enquiry.submitterEmail} via email + in-app notification`;
    toast.success(notifMsg);
    setTab("thread");
  };

  // ─── Mark as Resolved (BR-124-04) ────────────────────────

  const confirmResolve = () => {
    const now = new Date();
    let updated: Enquiry = { ...enquiry, status: "Resolved", lastUpdated: now };
    updated = withHistory(updated, { event: "Resolved", actor: CURRENT_ADMIN, timestamp: now });
    onUpdate(updated);
    setResolveConfirmOpen(false);
    toast.success(`Enquiry ${enquiry.id} marked as Resolved.`);
    setTab("timeline");
  };

  // ─── Re-open (BR-124-04) ─────────────────────────────────

  const handleReopen = () => {
    const now = new Date();
    let updated: Enquiry = { ...enquiry, status: "In Progress", lastUpdated: now };
    updated = withHistory(updated, { event: "Re-opened", actor: CURRENT_ADMIN, timestamp: now });
    onUpdate(updated);
    toast.info(`Enquiry ${enquiry.id} re-opened.`);
  };

  // ─── Escalate (BR-124-06) ─────────────────────────────────

  const handleEscalateConfirm = () => {
    if (!escalateTarget) return;
    const now = new Date();
    const memberName = ADMIN_TEAM.find((a) => a.id === escalateTarget)?.name ?? escalateTarget;
    let updated: Enquiry = { ...enquiry, assignedTo: memberName, lastUpdated: now };
    updated = withHistory(updated, {
      event: "Escalated",
      actor: CURRENT_ADMIN,
      timestamp: now,
      note: `Escalated to ${memberName}${escalateNote ? `: ${escalateNote}` : ""}. Push notification sent.`,
    });
    onUpdate(updated);
    setEscalateOpen(false);
    setEscalateTarget("");
    setEscalateNote("");
    toast.success(`Enquiry escalated to ${memberName}. Push notification sent: "Enquiry [${enquiry.id}] has been assigned to you."`);
  };

  // ─── Internal Note ────────────────────────────────────────

  const addInternalNote = () => {
    if (!noteText.trim()) return;
    const now = new Date();
    const note: ThreadMessage = {
      id: `n-${Date.now()}`,
      from: "note",
      authorName: CURRENT_ADMIN,
      body: noteText.trim(),
      timestamp: now,
    };
    onUpdate({ ...enquiry, internalNotes: [...enquiry.internalNotes, note], lastUpdated: now });
    setNoteText("");
    toast.success("Internal note added");
  };

  // ─── Merged thread (admin + user) ────────────────────────

  const thread = [...enquiry.thread].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const sortedHistory = [...enquiry.statusHistory].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const sortedNotes   = [...enquiry.internalNotes].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // ─── Attachment icon ──────────────────────────────────────

  const AttachIcon = ({ type }: { type: string }) => {
    if (type === "image")  return <ImageIcon  className="h-4 w-4 text-blue-500 shrink-0" />;
    if (type === "video")  return <VideoIcon  className="h-4 w-4 text-purple-500 shrink-0" />;
    if (type === "pdf")    return <FileText   className="h-4 w-4 text-red-500 shrink-0" />;
    return                        <FileText   className="h-4 w-4 text-gray-500 shrink-0" />;
  };

  const TABS: { id: PanelTab; label: string; count?: number }[] = [
    { id: "thread",   label: "Thread",   count: thread.length },
    { id: "timeline", label: "Timeline", count: sortedHistory.length },
    { id: "notes",    label: "Notes",    count: sortedNotes.length },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[580px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-start justify-between px-5 py-4 border-b shrink-0 bg-gray-50/60">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-[#9CA3AF] bg-white border border-gray-200 px-1.5 py-0.5 rounded">{enquiry.id}</span>
              <Badge variant="secondary" className={cn("text-[10px] border", catStyle.bg, catStyle.text, catStyle.border)}>
                {enquiry.category}
              </Badge>
              <Badge variant="secondary" className={cn("text-[10px] gap-1.5 ring-1", statusStyle.bg, statusStyle.text, statusStyle.ring)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dot)} />
                {enquiry.status}
              </Badge>
            </div>
            <h2 className="text-sm text-[#111827] pr-8 leading-snug line-clamp-2">{enquiry.subject}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 shrink-0 mt-0.5 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────── */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* ── Guest notice (BR-124-07) ─────────────── */}
            {enquiry.isGuest && (
              <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700">Guest Submission (BR-124-07) —</span>
                  <span className="text-slate-600"> This enquiry was submitted without a platform account. Reply will be sent via <strong>email only</strong>. No in-app notification will be triggered.</span>
                </div>
              </div>
            )}

            {/* ── Submitter Info ───────────────────────── */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#003B95]/10 flex items-center justify-center text-[#003B95] shrink-0 select-none">
                  {enquiry.submitterName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-[#111827] truncate">{enquiry.submitterName}</p>
                    <Badge variant="secondary" className={cn("text-[9px] border", accStyle.bg, accStyle.text, accStyle.border)}>
                      {enquiry.accountType}
                    </Badge>
                  </div>
                  {enquiry.submitterId && (
                    <p className="text-[11px] text-[#9CA3AF] font-mono">{enquiry.submitterId}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1.5 pl-12">
                <a href={`mailto:${enquiry.submitterEmail}`} className="flex items-center gap-2 text-xs text-[#003B95] hover:underline w-fit">
                  <Mail className="h-3 w-3 text-[#9CA3AF]" />
                  {enquiry.submitterEmail}
                </a>
                {enquiry.submitterPhone && (
                  <span className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <Phone className="h-3 w-3 text-[#9CA3AF]" />
                    {enquiry.submitterPhone}
                  </span>
                )}
                {!enquiry.isGuest && (
                  <button className="flex items-center gap-2 text-xs text-[#003B95] hover:underline w-fit">
                    <ExternalLink className="h-3 w-3" /> View Profile
                  </button>
                )}
              </div>
            </div>

            {/* ── Original Message ─────────────────────── */}
            <div className="space-y-2">
              <h3 className="text-xs text-[#9CA3AF] flex items-center gap-1.5 uppercase tracking-wide">
                <MessageSquare className="h-3.5 w-3.5" /> Original Message
              </h3>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{enquiry.message}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(enquiry.submittedAt, "MMM d, yyyy 'at' hh:mm a")}
                </span>
                <span>({formatDistanceToNow(enquiry.submittedAt, { addSuffix: true })})</span>
              </div>
            </div>

            {/* ── Attachments ──────────────────────────── */}
            {enquiry.attachments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs text-[#9CA3AF] flex items-center gap-1.5 uppercase tracking-wide">
                  <Paperclip className="h-3.5 w-3.5" /> Attachments ({enquiry.attachments.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {enquiry.attachments.map((att) => (
                    <button key={att.id}
                      className="flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors text-left group">
                      <AttachIcon type={att.type} />
                      <div className="min-w-0">
                        <p className="text-xs text-[#374151] truncate max-w-[150px] group-hover:text-[#003B95]">{att.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{att.size}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* ── Admin Actions ────────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-xs text-[#9CA3AF] flex items-center gap-1.5 uppercase tracking-wide">
                <Shield className="h-3.5 w-3.5" /> Admin Actions
              </h3>

              {/* Assign + Escalate row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#6B7280]">Assigned To</label>
                  <Select value={enquiry.assignedTo ?? "__unassigned__"} onValueChange={handleAssign}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Unassigned</SelectItem>
                      {ADMIN_TEAM.map((a) => (
                        <SelectItem key={a.id} value={a.name}>
                          {a.name} <span className="text-[10px] text-gray-400">— {a.role}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => handleAssign(CURRENT_ADMIN)} className="w-full h-7 text-[11px] gap-1.5">
                    <UserCheck className="h-3 w-3" /> Assign to me
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#6B7280]">Quick Actions</label>
                  {/* Mark as Resolved (BR-124-04) */}
                  {!isResolved ? (
                    <Button onClick={() => setResolveConfirmOpen(true)}
                      className="w-full h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Resolved
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleReopen}
                      className="w-full h-8 text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                      <RefreshCw className="h-3.5 w-3.5" /> Re-open Enquiry
                    </Button>
                  )}
                  {/* Escalate (BR-124-06) */}
                  <Button variant="outline" onClick={() => setEscalateOpen(true)}
                    className="w-full h-7 text-[11px] gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50">
                    <ShieldAlert className="h-3 w-3" /> Escalate
                  </Button>
                </div>
              </div>

              {/* Last updated */}
              <p className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
                <Clock className="h-3 w-3" /> Last updated {formatDistanceToNow(enquiry.lastUpdated, { addSuffix: true })}
              </p>
            </div>

            <Separator />

            {/* ── Tabs: Thread / Timeline / Notes ─────── */}
            <div>
              <div className="flex border-b border-gray-200 mb-4">
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={cn("flex-1 pb-2.5 text-xs font-medium border-b-2 transition-colors",
                      tab === t.id ? "border-[#003B95] text-[#003B95]" : "border-transparent text-gray-500 hover:text-gray-700")}>
                    {t.label}
                    {t.count !== undefined && (
                      <span className={cn("ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full",
                        tab === t.id ? "bg-[#003B95]/10 text-[#003B95]" : "bg-gray-100 text-gray-500")}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Thread ─────────────────────────────── */}
              {tab === "thread" && (
                <div className="space-y-3">
                  {thread.length > 0 ? thread.map((msg) => {
                    const isAdmin = msg.from === "admin";
                    return (
                      <div key={msg.id} className={cn("rounded-xl p-3.5 space-y-1.5 border",
                        isAdmin ? "bg-[#003B95]/5 border-[#003B95]/10 ml-0" : "bg-white border-gray-200 mr-0")}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white shrink-0",
                              isAdmin ? "bg-[#003B95]" : "bg-gray-400")}>
                              {msg.authorName.charAt(0)}
                            </div>
                            <span className={cn("text-xs font-medium", isAdmin ? "text-[#003B95]" : "text-[#374151]")}>
                              {msg.authorName}
                            </span>
                            {isAdmin && (
                              <Badge variant="secondary" className="text-[9px] bg-[#003B95]/10 text-[#003B95] border-[#003B95]/20">Admin</Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-[#9CA3AF] shrink-0">{format(msg.timestamp, "MMM d, hh:mm a")}</span>
                        </div>
                        <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap pl-7.5">{msg.body}</p>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 border rounded-xl bg-gray-50/50">
                      <MessageSquare className="h-7 w-7 text-gray-200 mx-auto mb-1.5" />
                      <p className="text-xs text-[#9CA3AF]">No messages yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Status Timeline (BR-124-02/05/06) ──── */}
              {tab === "timeline" && (
                <div className="relative pl-4 border-l-2 border-gray-200 space-y-4 pb-1">
                  {sortedHistory.map((entry) => {
                    const eStyle = HISTORY_EVENT_STYLES[entry.event];
                    return (
                      <div key={entry.id} className="relative">
                        <div className={cn("absolute -left-[18px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white", eStyle.dot)} />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-xs font-semibold", eStyle.text)}>{entry.event}</span>
                            <span className="text-[10px] text-[#9CA3AF]">{format(entry.timestamp, "MMM d, yyyy · hh:mm a")}</span>
                          </div>
                          <p className="text-[11px] text-[#6B7280]">By <strong className="text-[#374151]">{entry.actor}</strong></p>
                          {entry.note && <p className="text-[11px] text-[#9CA3AF] italic">{entry.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Internal Notes ──────────────────────── */}
              {tab === "notes" && (
                <div className="space-y-3">
                  {sortedNotes.length > 0 ? sortedNotes.map((note) => (
                    <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs text-amber-700 font-medium">{note.authorName}</span>
                          <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-600 border-amber-300">Internal</Badge>
                        </div>
                        <span className="text-[10px] text-[#9CA3AF]">{format(note.timestamp, "MMM d, hh:mm a")}</span>
                      </div>
                      <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">{note.body}</p>
                    </div>
                  )) : (
                    <div className="text-center py-8 border rounded-xl bg-gray-50/50">
                      <StickyNote className="h-7 w-7 text-gray-200 mx-auto mb-1.5" />
                      <p className="text-xs text-[#9CA3AF]">No internal notes</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* ── Reply Composition (BR-124-03/04/09) ─── */}
            <div className="space-y-2.5">
              <h3 className="text-xs text-[#6B7280] flex items-center gap-1.5 uppercase tracking-wide">
                <Send className="h-3.5 w-3.5" /> Reply to Submitter
              </h3>

              {isResolved ? (
                /* BR-124-04: Reply disabled when Resolved */
                <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-emerald-800">Enquiry is Resolved. </span>
                    <span className="text-emerald-700">Re-open the enquiry to send new replies.</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-[#9CA3AF]">
                    Reply will be emailed to <span className="text-[#003B95]">{enquiry.submitterEmail}</span>
                    {!enquiry.isGuest && ` and sent as in-app notification (subject: "Re: Your Enquiry [${enquiry.id}]")`}
                    {enquiry.isGuest && " (email only — guest has no platform account)"}
                  </p>
                  <Textarea
                    ref={replyRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Type your reply (minimum ${REPLY_MIN} characters)…`}
                    rows={5}
                    maxLength={REPLY_MAX}
                    className="text-sm resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className={cn("text-[10px]",
                      replyText.length > 0 && replyText.length < REPLY_MIN ? "text-red-500" :
                      replyText.length >= REPLY_MAX ? "text-amber-600" : "text-[#9CA3AF]")}>
                      {replyText.length} / {REPLY_MAX} chars
                      {replyText.length > 0 && replyText.length < REPLY_MIN && ` (min ${REPLY_MIN})`}
                    </p>
                    <Button onClick={handleReplySubmit} disabled={!replyValid}
                      className="bg-[#003B95] hover:bg-[#002a6b] gap-2" size="sm">
                      <Send className="h-3.5 w-3.5" /> Send Reply
                    </Button>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* ── Internal Note ──────────────────────────── */}
            <div className="space-y-2.5">
              <h3 className="text-xs text-amber-600 flex items-center gap-1.5 uppercase tracking-wide">
                <StickyNote className="h-3.5 w-3.5" /> Internal Note
                <span className="text-[10px] text-[#9CA3AF] normal-case ml-1 tracking-normal">(admin-only)</span>
              </h3>
              <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-0.5">
                <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add an internal note visible only to admins…" rows={3}
                  className="text-sm border-0 bg-transparent focus-visible:ring-0 resize-none" />
              </div>
              <Button onClick={addInternalNote} disabled={!noteText.trim()} variant="outline" size="sm"
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
                <StickyNote className="h-3.5 w-3.5" /> Add Note
              </Button>
            </div>

            <div className="h-4" />
          </div>
        </ScrollArea>
      </div>

      {/* ── Reply Confirmation (BR-124-05) ─────────────────── */}
      <AlertDialog open={replyConfirmOpen} onOpenChange={setReplyConfirmOpen}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Send reply?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Reply will be sent to <strong>{enquiry.submitterEmail}</strong> with subject:</p>
                <p className="font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs">Re: Your Enquiry [{enquiry.id}]</p>
                {!enquiry.isGuest && <p>The submitter will also receive an <strong>in-app notification</strong>.</p>}
                {enquiry.isGuest && (
                  <p className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded p-2">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Guest submission — email only, no in-app notification (BR-124-07).
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReply} className="bg-[#003B95] hover:bg-[#002a6b]">Send Reply</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Resolve Confirmation (BR-124-04) ───────────────── */}
      <AlertDialog open={resolveConfirmOpen} onOpenChange={setResolveConfirmOpen}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Mark as Resolved?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-gray-600">
                <p>This will mark <strong>{enquiry.id}</strong> as <strong>Resolved</strong>.</p>
                <p className="text-xs bg-amber-50 border border-amber-100 rounded p-2">
                  Per BR-124-04: A Resolved enquiry cannot receive further replies unless re-opened. A "Re-open" button will appear.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResolve} className="bg-emerald-600 hover:bg-emerald-700">Mark as Resolved</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Escalate Modal (BR-124-06) ──────────────────────── */}
      <AlertDialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" /> Escalate Enquiry
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-gray-600 mt-1">
                <p>Select a Sub-Admin to assign and escalate <strong>{enquiry.id}</strong> to. They will receive an in-app push notification.</p>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 uppercase tracking-wide">Assign to</label>
                  <Select value={escalateTarget} onValueChange={setEscalateTarget}>
                    <SelectTrigger><SelectValue placeholder="Select Sub-Admin…" /></SelectTrigger>
                    <SelectContent>
                      {ADMIN_TEAM.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} <span className="text-[10px] text-gray-400">— {a.role}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 uppercase tracking-wide">Escalation note (optional)</label>
                  <Textarea value={escalateNote} onChange={(e) => setEscalateNote(e.target.value)}
                    placeholder="Reason for escalation or additional context…" rows={3} className="text-sm resize-none" />
                </div>
                <p className="text-[11px] text-orange-700 bg-orange-50 border border-orange-100 rounded p-2 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Push notification will be sent: "Enquiry [{enquiry.id}] has been assigned to you."
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEscalateConfirm} disabled={!escalateTarget}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40">
              Escalate & Notify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
