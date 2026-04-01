import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Tag,
  Activity,
  FileText,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import { Separator } from "../../ui/separator";
import type {
  Enquiry,
  ThreadMessage,
  StatusHistoryEntry,
} from "./enquiry-types";
import {
  INITIAL_ENQUIRIES,
  CATEGORY_STYLES,
  STATUS_STYLES,
  HISTORY_EVENT_STYLES,
  ACCOUNT_TYPE_STYLES,
} from "./enquiry-types";

// ─── Constants ────────────────────────────────────────────────
const CURRENT_ADMIN = "Super Admin";
const REPLY_MAX = 2000;

// ─── Component ────────────────────────────────────────────────

export function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find enquiry: try API first, fallback to mock data
  const sourceEnquiry = INITIAL_ENQUIRIES.find((e) => e.id === id) ?? null;
  const [enquiry, setEnquiry] = useState<Enquiry | null>(sourceEnquiry);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { adminService } = await import("@/services/admin.service");
        const res = await adminService.getEnquiry(id);
        const e = res?.enquiry || res?.data?.enquiry || res;
        if (e && e.id) {
          setEnquiry({
            id: String(e.id),
            submitterName: String(e.name || "Unknown"),
            submitterEmail: String(e.email || ""),
            submitterPhone: String(e.phone || ""),
            accountType: String(e.user_type || "Player") as Enquiry["accountType"],
            category: String(e.category || "General") as Enquiry["category"],
            subject: String(e.subject || e.message_preview || ""),
            message: String(e.message || e.message_preview || ""),
            status: String(e.status) === "resolved" || String(e.status) === "closed" ? "Resolved" : "Open",
            submittedAt: new Date(String(e.created_at || Date.now())),
            lastUpdated: new Date(String(e.updated_at || Date.now())),
            adminNotes: "",
            statusHistory: Array.isArray(e.status_history) ? e.status_history : [],
            thread: Array.isArray(e.comments) ? e.comments.map((c: Record<string, unknown>) => ({
              id: String(c.id || ""),
              sender: String(c.author_name || "Admin"),
              senderRole: "admin" as const,
              message: String(c.content || ""),
              timestamp: new Date(String(c.created_at || Date.now())),
            })) : [],
          });
        }
      } catch {
        // Keep mock data fallback
      }
    })();
  }, [id]);

  const [replyText, setReplyText] = useState("");

  // ── 404 State ─────────────────────────────────────────────
  if (!enquiry) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8 text-[#9CA3AF]" />
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">
            Enquiry Not Found
          </h1>
          <p className="text-sm text-[#6B7280] max-w-sm">
            The enquiry you are looking for does not exist or may have been
            removed.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/enquiries")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Enquiries
          </Button>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────
  const catStyle = CATEGORY_STYLES[enquiry.category];
  const statusStyle = STATUS_STYLES[enquiry.status];
  const accStyle = ACCOUNT_TYPE_STYLES[enquiry.accountType];
  const isOpen = enquiry.status === "Open";
  const isResolved = enquiry.status === "Resolved";
  const replyValid = replyText.trim().length > 0;

  // ── Sorted data ───────────────────────────────────────────
  const thread = [...enquiry.thread].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const reversedHistory = [...enquiry.statusHistory].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // ── Helper: append status history entry ───────────────────
  function withHistory(
    e: Enquiry,
    entry: Omit<StatusHistoryEntry, "id">
  ): Enquiry {
    return {
      ...e,
      statusHistory: [
        ...e.statusHistory,
        { ...entry, id: `sh-${Date.now()}` },
      ],
    };
  }

  // ── Send Reply ────────────────────────────────────────────
  const handleSendReply = () => {
    if (!replyValid) return;
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
      note: `Reply sent to ${enquiry.submitterEmail}`,
    });
    setEnquiry(updated);
    setReplyText("");
    toast.success(`Reply sent to ${enquiry.submitterEmail}`);
  };

  // ── Mark as Resolved ──────────────────────────────────────
  const handleResolve = () => {
    const now = new Date();
    let updated: Enquiry = {
      ...enquiry,
      status: "Resolved",
      lastUpdated: now,
    };
    updated = withHistory(updated, {
      event: "Resolved",
      actor: CURRENT_ADMIN,
      timestamp: now,
    });
    setEnquiry(updated);
    toast.success(`Enquiry ${enquiry.id} marked as Resolved.`);
  };

  // ── Reopen ────────────────────────────────────────────────
  const handleReopen = () => {
    const now = new Date();
    let updated: Enquiry = {
      ...enquiry,
      status: "Open",
      lastUpdated: now,
    };
    updated = withHistory(updated, {
      event: "Re-opened",
      actor: CURRENT_ADMIN,
      timestamp: now,
    });
    setEnquiry(updated);
    toast.success(`Enquiry ${enquiry.id} has been re-opened.`);
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* ── Back Button ──────────────────────────────────── */}
        <button
          onClick={() => navigate("/enquiries")}
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Enquiries
        </button>

        {/* ── Two-Column Layout ─────────────────────────────── */}
        <div className="flex gap-6">
          {/* ════════════════════════════════════════════════════
              LEFT COLUMN — 65% — Message Thread
              ════════════════════════════════════════════════════ */}
          <div className="w-[65%] space-y-6">
            {/* ── Original Enquiry Card ────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              {/* Category badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs border",
                    catStyle.bg,
                    catStyle.text,
                    catStyle.border
                  )}
                >
                  {enquiry.category}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs gap-1.5 ring-1",
                    statusStyle.bg,
                    statusStyle.text,
                    statusStyle.ring
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      statusStyle.dot
                    )}
                  />
                  {enquiry.status}
                </Badge>
              </div>

              {/* Subject */}
              <h1 className="text-lg font-semibold text-[#111827] leading-snug">
                {enquiry.subject}
              </h1>

              {/* Message body */}
              <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                {enquiry.message}
              </p>

              <Separator />

              {/* Submitted info */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#003B95]/10 flex items-center justify-center text-[#003B95] text-sm font-medium shrink-0 select-none">
                    {enquiry.submitterName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">
                      {enquiry.submitterName}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {enquiry.submitterEmail}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Submitted{" "}
                  {format(enquiry.submittedAt, "MMM d, yyyy 'at' hh:mm a")}
                </span>
              </div>
            </div>

            {/* ── Conversation Thread ──────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#6B7280]" />
                Conversation Thread
                {thread.length > 0 && (
                  <span className="text-xs font-normal text-[#9CA3AF]">
                    ({thread.length}{" "}
                    {thread.length === 1 ? "reply" : "replies"})
                  </span>
                )}
              </h2>

              <Separator />

              {thread.length > 0 ? (
                <div className="space-y-4">
                  {thread.map((msg) => {
                    const isAdmin = msg.from === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "rounded-xl p-4 space-y-2 border",
                          isAdmin
                            ? "bg-[#003B95]/5 border-[#003B95]/10"
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-[11px] text-white shrink-0",
                                isAdmin ? "bg-[#003B95]" : "bg-gray-400"
                              )}
                            >
                              {msg.authorName.charAt(0)}
                            </div>
                            <span
                              className={cn(
                                "text-sm font-medium",
                                isAdmin
                                  ? "text-[#003B95]"
                                  : "text-[#374151]"
                              )}
                            >
                              {msg.authorName}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px]",
                                isAdmin
                                  ? "bg-[#003B95]/10 text-[#003B95] border-[#003B95]/20"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              )}
                            >
                              {isAdmin ? "Admin" : "User"}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-[#9CA3AF] shrink-0">
                            {format(msg.timestamp, "MMM d, yyyy 'at' hh:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap pl-9">
                          {msg.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">
                    No replies yet. Be the first to respond.
                  </p>
                </div>
              )}
            </div>

            {/* ── Reply Form ───────────────────────────────── */}
            {isOpen && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#6B7280]" />
                  Reply
                </h2>

                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={5}
                  maxLength={REPLY_MAX}
                  className="text-sm resize-none"
                />

                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "text-xs",
                      replyText.length >= REPLY_MAX
                        ? "text-amber-600"
                        : "text-[#9CA3AF]"
                    )}
                  >
                    {replyText.length} / {REPLY_MAX} characters
                  </p>
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyValid}
                    className="bg-[#003B95] hover:bg-[#002a6b] gap-2"
                    size="sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Reply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════
              RIGHT COLUMN — 35% — Details & Activity
              ════════════════════════════════════════════════════ */}
          <div className="w-[35%] space-y-6">
            {/* ── Enquiry Details Card ─────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#111827]">
                Enquiry Details
              </h2>

              <Separator />

              <div className="space-y-3">
                {/* Name */}
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#6B7280]">Name</p>
                    <p className="text-sm text-[#111827]">
                      {enquiry.submitterName}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#6B7280]">Email</p>
                    <a
                      href={`mailto:${enquiry.submitterEmail}`}
                      className="text-sm text-[#003B95] hover:underline"
                    >
                      {enquiry.submitterEmail}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                {enquiry.submitterPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#6B7280]">Phone</p>
                      <p className="text-sm text-[#111827]">
                        {enquiry.submitterPhone}
                      </p>
                    </div>
                  </div>
                )}

                {/* User Type */}
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#6B7280]">User Type</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs border mt-0.5",
                        accStyle.bg,
                        accStyle.text,
                        accStyle.border
                      )}
                    >
                      {enquiry.accountType}
                    </Badge>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#6B7280]">Category</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs border mt-0.5",
                        catStyle.bg,
                        catStyle.text,
                        catStyle.border
                      )}
                    >
                      {enquiry.category}
                    </Badge>
                  </div>
                </div>

                {/* Submission Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#6B7280]">Submission Date</p>
                    <p className="text-sm text-[#111827]">
                      {format(enquiry.submittedAt, "MMM d, yyyy 'at' hh:mm a")}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-3">
                  <Activity className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#6B7280]">Status</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs gap-1.5 ring-1 mt-0.5",
                        statusStyle.bg,
                        statusStyle.text,
                        statusStyle.ring
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          statusStyle.dot
                        )}
                      />
                      {enquiry.status}
                    </Badge>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#6B7280]">Last Updated</p>
                    <p className="text-sm text-[#111827]">
                      {format(
                        enquiry.lastUpdated,
                        "MMM d, yyyy 'at' hh:mm a"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Activity Log Card ────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#6B7280]" />
                Activity Log
              </h2>

              <Separator />

              {reversedHistory.length > 0 ? (
                <div className="relative pl-4 border-l-2 border-gray-200 space-y-4">
                  {reversedHistory.map((entry) => {
                    const eStyle = HISTORY_EVENT_STYLES[entry.event];
                    return (
                      <div key={entry.id} className="relative">
                        <div
                          className={cn(
                            "absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-white",
                            eStyle.dot
                          )}
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                eStyle.text
                              )}
                            >
                              {entry.event}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280]">
                            By{" "}
                            <span className="font-medium text-[#374151]">
                              {entry.actor}
                            </span>
                          </p>
                          <p className="text-[10px] text-[#9CA3AF]">
                            {format(
                              entry.timestamp,
                              "MMM d, yyyy 'at' hh:mm a"
                            )}
                          </p>
                          {entry.note && (
                            <p className="text-[11px] text-[#9CA3AF] italic">
                              {entry.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-[#9CA3AF]">No activity yet.</p>
                </div>
              )}
            </div>

            {/* ── Actions ──────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#111827]">Actions</h2>

              <Separator />

              {isOpen && (
                <Button
                  onClick={handleResolve}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Resolved
                </Button>
              )}

              {isResolved && (
                <Button
                  variant="outline"
                  onClick={handleReopen}
                  className="w-full gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
