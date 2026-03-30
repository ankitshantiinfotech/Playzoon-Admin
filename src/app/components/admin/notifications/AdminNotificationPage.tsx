// ─── SCR-ADM-043: Push Notification Compose & Send ───────────────────────────
// Compose, preview, send/schedule push notifications.
// Push-only — NOT tracked in the in-app notification bell (F16.21.4).
// History table with edit/delete/view/retry actions.

import { useState, useMemo, useCallback } from "react";
import { format, parseISO, isPast, addDays } from "date-fns";
import { toast } from "sonner";
import {
  Bell,
  Send,
  Clock,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Info,
  AlertCircle,
  Trash2,
  Eye,
  Pencil,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Smartphone,
  BellRing,
  Users,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { Checkbox } from "../../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
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
import {
  PushNotificationRecord,
  ComposeFormState,
  AudienceRole,
  NotificationStatus,
  EMPTY_FORM,
  AUDIENCE_ROLES,
  AUDIENCE_ROLE_SHORT,
  NOTIFICATION_STATUSES,
  estimateRecipients,
} from "./types";
import { MOCK_NOTIFICATIONS } from "./mockData";

// ─── Constants ───────────────────────────────────────────────────────────────

const TITLE_MAX = 100;
const BODY_MAX = 500;
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZES = [10, 20, 50] as const;

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<NotificationStatus, { label: string; icon: React.ElementType; cls: string }> = {
  Sent:      { label: "Sent",      icon: CheckCircle,   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Scheduled: { label: "Scheduled", icon: Clock,         cls: "bg-blue-50 text-blue-700 border-blue-200" },
  Failed:    { label: "Failed",    icon: AlertTriangle, cls: "bg-red-50 text-red-700 border-red-200" },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminNotificationPage() {
  // ── Notification state ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<PushNotificationRecord[]>(MOCK_NOTIFICATIONS);
  const [form, setForm] = useState<ComposeFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [clearFormOpen, setClearFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PushNotificationRecord | null>(null);
  const [viewTarget, setViewTarget] = useState<PushNotificationRecord | null>(null);

  // ── History filters ──────────────────────────────────────────────────────
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<NotificationStatus | "All">("All");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(DEFAULT_PAGE_SIZE);

  // ── Derived ──────────────────────────────────────────────────────────────
  const estimate = useMemo(() => estimateRecipients(form.audiences), [form.audiences]);
  const isScheduled = form.deliveryType === "scheduled";
  const isEditing = editingId !== null;
  const formHasContent = form.title.trim() !== "" || form.body.trim() !== "" || form.audiences.length > 0;

  // ── Form helpers ─────────────────────────────────────────────────────────
  const update = useCallback((patch: Partial<ComposeFormState>) => {
    setForm((p) => ({ ...p, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Notification title is required.";
    else if (form.title.length > TITLE_MAX) e.title = `Title must not exceed ${TITLE_MAX} characters.`;
    if (!form.body.trim()) e.body = "Message body is required.";
    else if (form.body.length > BODY_MAX) e.body = `Message must not exceed ${BODY_MAX} characters.`;
    if (form.audiences.length === 0) e.audiences = "Please select at least one target audience.";
    if (form.deliveryType === "scheduled") {
      if (!form.scheduledAt) e.scheduledAt = "Please select a date and time for the scheduled notification.";
      else if (isPast(new Date(form.scheduledAt))) e.scheduledAt = "Scheduled date must be in the future.";
      else if (new Date(form.scheduledAt) > addDays(new Date(), 365)) e.scheduledAt = "Scheduled date cannot exceed 365 days from today.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmitClick = () => {
    if (!validate()) {
      toast.error("Please fix the errors before sending.");
      return;
    }
    setConfirmSendOpen(true);
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSending(false);
    setConfirmSendOpen(false);

    if (isEditing) {
      // Update scheduled notification
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === editingId
            ? {
                ...n,
                title: form.title,
                body: form.body,
                audiences: form.audiences,
                deliveryType: form.deliveryType,
                scheduledAt: isScheduled ? form.scheduledAt : undefined,
                estimatedRecipients: estimate,
              }
            : n,
        ),
      );
      toast.success("Scheduled notification updated.");
      setEditingId(null);
    } else {
      // Create new
      const newRecord: PushNotificationRecord = {
        id: `PUSH-${Date.now()}`,
        title: form.title,
        body: form.body,
        audiences: form.audiences,
        deliveryType: form.deliveryType,
        scheduledAt: isScheduled ? form.scheduledAt : undefined,
        sentAt: !isScheduled ? new Date().toISOString() : undefined,
        status: isScheduled ? "Scheduled" : "Sent",
        createdAt: new Date().toISOString(),
        createdBy: "Super Admin",
        estimatedRecipients: estimate,
        actualRecipients: !isScheduled ? Math.round(estimate * 0.97) : undefined,
        deliveryRate: !isScheduled ? 97 : undefined,
      };
      setNotifications((prev) => [newRecord, ...prev]);
      toast.success(
        isScheduled
          ? `Notification scheduled for ${format(new Date(form.scheduledAt), "MMM d, yyyy 'at' HH:mm")} UTC.`
          : `Notification sent to approximately ${estimate.toLocaleString()} recipients.`,
      );
    }

    setForm(EMPTY_FORM);
    setErrors({});
  };

  // ── Edit handler ─────────────────────────────────────────────────────────
  const handleEdit = (n: PushNotificationRecord) => {
    setEditingId(n.id);
    setForm({
      title: n.title,
      body: n.body,
      audiences: [...n.audiences],
      deliveryType: n.deliveryType,
      scheduledAt: n.scheduledAt ? new Date(n.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setErrors({});
    toast.info("Editing scheduled notification. Make changes and save.");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setDeleteTarget(null);
    toast.success("Scheduled notification deleted.");
  };

  // ── Retry handler ────────────────────────────────────────────────────────
  const handleRetry = async (id: string) => {
    toast.info("Retrying notification delivery...");
    await new Promise((r) => setTimeout(r, 1200));
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, status: "Sent" as const, sentAt: new Date().toISOString(), actualRecipients: Math.round(n.estimatedRecipients * 0.97), deliveryRate: 97 }
          : n,
      ),
    );
    toast.success("Notification retried and sent successfully.");
  };

  // ── Clear form ───────────────────────────────────────────────────────────
  const handleClearForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setClearFormOpen(false);
    toast.info("Form cleared.");
  };

  // ── Audience toggles ────────────────────────────────────────────────────
  const toggleAudience = (role: AudienceRole) => {
    update({
      audiences: form.audiences.includes(role)
        ? form.audiences.filter((r) => r !== role)
        : [...form.audiences, role],
    });
  };

  const toggleSelectAll = () => {
    if (form.audiences.length === AUDIENCE_ROLES.length) {
      update({ audiences: [] });
    } else {
      update({ audiences: [...AUDIENCE_ROLES] });
    }
  };

  const allSelected = form.audiences.length === AUDIENCE_ROLES.length;
  const someSelected = form.audiences.length > 0 && !allSelected;

  // ── History Filtering ────────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return notifications.filter((n) => {
      if (historyStatus !== "All" && n.status !== historyStatus) return false;
      if (q && !n.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [notifications, historySearch, historyStatus]);

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / historyPageSize));
  const pagedHistory = filteredHistory.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize,
  );

  // ── Character counter ────────────────────────────────────────────────────
  function CharCount({ current, max }: { current: number; max: number }) {
    const pct = current / max;
    return (
      <span className={cn(
        "text-[10px] tabular-nums",
        pct >= 1 ? "text-red-500" : pct >= 0.9 ? "text-amber-500" : "text-gray-400",
      )}>
        {current}/{max}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#003B95]/10">
          <Bell className="h-5 w-5 text-[#003B95]" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Push Notifications</h1>
      </div>

      {/* ── Two-Column Layout: Compose + Preview ───────────────────────────── */}
      <div className="grid grid-cols-[1fr_0.67fr] gap-6">
        {/* ── LEFT: Compose Form ───────────────────────────────────────────── */}
        <div className="space-y-5" role="form" aria-label="Compose push notification">
          {/* Info Banner */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Push notifications are delivered via push only and will not appear in users' in-app notification center.
            </p>
          </div>

          {/* Editing Banner */}
          {isEditing && (
            <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-500" />
                <p className="text-xs text-amber-700">
                  Editing scheduled notification. Make changes and save.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setErrors({}); }}
                className="text-xs text-amber-600 hover:text-amber-800"
              >
                Cancel Edit
              </Button>
            </div>
          )}

          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Compose Notification</h2>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="notif-title" className="text-xs text-gray-600">
                  Notification Title <span className="text-red-500">*</span>
                </Label>
                <CharCount current={form.title.length} max={TITLE_MAX} />
              </div>
              <Input
                id="notif-title"
                type="text"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                maxLength={TITLE_MAX}
                placeholder="Enter notification title"
                className={cn(
                  "h-9 text-sm",
                  errors.title && "border-red-300 focus-visible:ring-red-200",
                )}
                aria-required="true"
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" className="flex items-center gap-1 text-[10px] text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />{errors.title}
                </p>
              )}
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="notif-body" className="text-xs text-gray-600">
                  Message Body <span className="text-red-500">*</span>
                </Label>
                <CharCount current={form.body.length} max={BODY_MAX} />
              </div>
              <Textarea
                id="notif-body"
                value={form.body}
                onChange={(e) => update({ body: e.target.value })}
                maxLength={BODY_MAX}
                rows={5}
                placeholder="Enter notification message"
                className={cn(
                  "text-sm resize-none",
                  errors.body && "border-red-300 focus-visible:ring-red-200",
                )}
                aria-required="true"
                aria-describedby={errors.body ? "body-error" : undefined}
              />
              {errors.body && (
                <p id="body-error" className="flex items-center gap-1 text-[10px] text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />{errors.body}
                </p>
              )}
            </div>
          </div>

          {/* Audience */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Target Audience</h2>

            <fieldset>
              <legend className="sr-only">Target Audience</legend>

              {/* Select All */}
              <div className="flex items-center gap-2.5 mb-3">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  // @ts-ignore — shadcn Checkbox indeterminate
                  data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all audiences"
                />
                <Label htmlFor="select-all" className="text-xs text-gray-700 cursor-pointer">
                  Select All
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {AUDIENCE_ROLES.map((role) => (
                  <div key={role} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`audience-${role}`}
                      checked={form.audiences.includes(role)}
                      onCheckedChange={() => toggleAudience(role)}
                    />
                    <Label htmlFor={`audience-${role}`} className="text-xs text-gray-700 cursor-pointer">
                      {role}
                    </Label>
                  </div>
                ))}
              </div>

              {errors.audiences && (
                <p className="flex items-center gap-1 text-[10px] text-red-600 mt-2">
                  <AlertCircle className="h-3 w-3 shrink-0" />{errors.audiences}
                </p>
              )}
            </fieldset>

            {/* Estimated recipients */}
            <div className="text-xs text-gray-500" aria-live="polite">
              Estimated recipients: <span className="text-[#003B95] font-medium">~{estimate.toLocaleString()}</span>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Delivery</h2>

            <fieldset>
              <legend className="sr-only">Delivery Type</legend>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { type: "immediate" as const, label: "Immediate", icon: Send },
                  { type: "scheduled" as const, label: "Scheduled", icon: Clock },
                ]).map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => update({ deliveryType: type })}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 border-2 rounded-xl text-xs transition-all",
                      form.deliveryType === type
                        ? "border-[#003B95] bg-blue-50/50 text-[#003B95]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {isScheduled && (
              <div>
                <Label htmlFor="scheduled-at" className="text-xs text-gray-600">
                  Schedule Date & Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="scheduled-at"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => update({ scheduledAt: e.target.value })}
                  min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                  className={cn(
                    "mt-1.5 h-9 text-sm",
                    errors.scheduledAt && "border-red-300 focus-visible:ring-red-200",
                  )}
                  aria-label="Scheduled date and time"
                  aria-required="true"
                  aria-describedby={errors.scheduledAt ? "schedule-error" : undefined}
                />
                {errors.scheduledAt && (
                  <p id="schedule-error" className="flex items-center gap-1 text-[10px] text-red-600 mt-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />{errors.scheduledAt}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 gap-1.5"
              onClick={() => {
                if (formHasContent) {
                  setClearFormOpen(true);
                } else {
                  handleClearForm();
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
              Clear Form
            </Button>

            <Button
              onClick={handleSubmitClick}
              disabled={isSending}
              className={cn(
                "gap-2 text-white",
                isScheduled
                  ? "bg-[#003B95] hover:bg-[#002d73]"
                  : "bg-[#003B95] hover:bg-[#002d73]",
              )}
            >
              {isScheduled ? (
                <><Clock className="h-4 w-4" />{isEditing ? "Update Schedule" : "Schedule"}</>
              ) : (
                <><Send className="h-4 w-4" />Send Now</>
              )}
            </Button>
          </div>
        </div>

        {/* ── RIGHT: Preview Panel ─────────────────────────────────────────── */}
        <div className="sticky top-4 h-fit" role="region" aria-label="Notification preview" aria-live="polite">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Preview</h2>
            <PushPreviewPanel title={form.title} body={form.body} />
          </div>
        </div>
      </div>

      {/* ── Notification History ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Notification History</h2>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <Select
            value={historyStatus}
            onValueChange={(v) => { setHistoryStatus(v as NotificationStatus | "All"); setHistoryPage(1); }}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              {NOTIFICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title..."
              value={historySearch}
              onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="text-[11px] uppercase tracking-wider text-gray-500">Title</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-gray-500">Audience</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-gray-500">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-gray-500">Date</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-gray-500 w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bell className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">No Notifications Yet</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Compose and send your first push notification above.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedHistory.map((n, idx) => {
                  const statusCfg = STATUS_CONFIG[n.status];
                  const StatusIcon = statusCfg.icon;

                  return (
                    <TableRow key={n.id} className={cn("hover:bg-gray-50 transition-colors", idx % 2 === 1 && "bg-gray-50/30")}>
                      {/* Title */}
                      <TableCell className="max-w-[240px]">
                        <p className="text-xs text-gray-900 truncate">{n.title.length > 60 ? n.title.slice(0, 60) + "..." : n.title}</p>
                      </TableCell>

                      {/* Audience Chips */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {n.audiences.map((role) => (
                            <span
                              key={role}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200"
                            >
                              {AUDIENCE_ROLE_SHORT[role]}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
                          statusCfg.cls,
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="whitespace-nowrap">
                        {n.status === "Scheduled" && n.scheduledAt ? (
                          <div>
                            <p className="text-[10px] text-blue-500 uppercase">Scheduled</p>
                            <p className="text-xs text-gray-700">{format(parseISO(n.scheduledAt), "MMM d, HH:mm")} UTC</p>
                          </div>
                        ) : n.sentAt ? (
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase">Sent</p>
                            <p className="text-xs text-gray-700">{format(parseISO(n.sentAt), "MMM d, HH:mm")} UTC</p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300">--</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {n.status === "Scheduled" && (
                            <>
                              <button
                                onClick={() => handleEdit(n)}
                                className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-[#003B95] hover:bg-blue-50 transition-colors"
                                aria-label={`Edit ${n.title}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(n)}
                                className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                aria-label={`Delete ${n.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {n.status === "Sent" && (
                            <button
                              onClick={() => setViewTarget(n)}
                              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-[#003B95] hover:bg-blue-50 transition-colors"
                              aria-label={`View ${n.title}`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {n.status === "Failed" && (
                            <>
                              <button
                                onClick={() => setViewTarget(n)}
                                className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-[#003B95] hover:bg-blue-50 transition-colors"
                                aria-label={`View ${n.title}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRetry(n.id)}
                                className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                aria-label={`Retry ${n.title}`}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              {filteredHistory.length === 0
                ? "No results"
                : `Showing ${(historyPage - 1) * historyPageSize + 1}--${Math.min(historyPage * historyPageSize, filteredHistory.length)} of ${filteredHistory.length}`}
            </p>
            <Select
              value={String(historyPageSize)}
              onValueChange={(v) => { setHistoryPageSize(Number(v)); setHistoryPage(1); }}
            >
              <SelectTrigger className="w-[80px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <nav role="navigation" aria-label="Pagination" className="flex items-center gap-1">
            <button
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage((p) => p - 1)}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setHistoryPage(p)}
                className={cn(
                  "h-7 min-w-[28px] rounded-md text-xs transition-colors",
                  historyPage === p
                    ? "bg-[#003B95] text-white"
                    : "text-gray-500 hover:bg-gray-100",
                )}
              >
                {p}
              </button>
            ))}
            <button
              disabled={historyPage >= historyTotalPages}
              onClick={() => setHistoryPage((p) => p + 1)}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </nav>
        </div>
      </div>

      {/* ── Confirm Send/Schedule Modal ──────────────────────────────────────── */}
      <Dialog open={confirmSendOpen} onOpenChange={(v) => { if (!v && !isSending) setConfirmSendOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className={cn(
                "flex items-center justify-center h-8 w-8 rounded-lg",
                isScheduled ? "bg-blue-100" : "bg-[#003B95]/10",
              )}>
                {isScheduled
                  ? <Clock className="h-4 w-4 text-blue-600" />
                  : <Send className="h-4 w-4 text-[#003B95]" />}
              </div>
              {isEditing ? "Update Scheduled Notification" : isScheduled ? "Schedule Notification" : "Send Notification"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {isScheduled
                ? `Schedule this notification for ${form.scheduledAt ? format(new Date(form.scheduledAt), "MMM d, yyyy 'at' HH:mm") : "the selected time"} UTC to approximately ${estimate.toLocaleString()} recipients?`
                : `Send this notification to approximately ${estimate.toLocaleString()} recipients now?`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-blue-400 uppercase tracking-wide mb-1">Estimated Recipients</p>
              <p className="text-3xl font-semibold text-[#003B95] tabular-nums">{estimate.toLocaleString()}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Title</span>
                <span className="text-gray-700 text-right max-w-[200px] truncate">{form.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Audience</span>
                <span className="text-gray-700">{form.audiences.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery</span>
                <span className="text-gray-700">{isScheduled ? "Scheduled" : "Immediate"}</span>
              </div>
              {isScheduled && form.scheduledAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">When</span>
                  <span className="text-gray-700">{format(new Date(form.scheduledAt), "MMM d, yyyy 'at' HH:mm")} UTC</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmSendOpen(false)} disabled={isSending}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleConfirmSend}
              disabled={isSending}
              className="gap-1.5 bg-[#003B95] hover:bg-[#002d73] text-white min-w-[130px]"
            >
              {isSending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{isScheduled ? "Scheduling..." : "Sending..."}</>
                : isScheduled
                ? <><Clock className="h-3.5 w-3.5" />{isEditing ? "Update" : "Schedule"}</>
                : <><Send className="h-3.5 w-3.5" />Send Now</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Clear Form Confirm Modal ─────────────────────────────────────────── */}
      <Dialog open={clearFormOpen} onOpenChange={(v) => { if (!v) setClearFormOpen(false); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Clear Form?</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Clear all form fields? Unsaved content will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setClearFormOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleClearForm} className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Scheduled Modal ───────────────────────────────────────────── */}
      <Dialog open={deleteTarget !== null} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-100">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              Delete Scheduled Notification
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Delete this scheduled notification? It will not be sent.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="py-2">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs">
                <p className="text-gray-700 font-medium">{deleteTarget.title}</p>
                {deleteTarget.scheduledAt && (
                  <p className="text-blue-600 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    Scheduled for {format(parseISO(deleteTarget.scheduledAt), "MMM d, yyyy 'at' HH:mm")} UTC
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Detail Modal ────────────────────────────────────────────────── */}
      <Dialog open={viewTarget !== null} onOpenChange={(v) => { if (!v) setViewTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Notification Detail</DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-3 py-2">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Title</span>
                  <p className="text-gray-900">{viewTarget.title}</p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Body</span>
                  <p className="text-gray-700">{viewTarget.body}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Audience</span>
                    <div className="flex flex-wrap gap-1">
                      {viewTarget.audiences.map((role) => (
                        <span key={role} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {AUDIENCE_ROLE_SHORT[role]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Status</span>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
                      STATUS_CONFIG[viewTarget.status].cls,
                    )}>
                      {viewTarget.status}
                    </span>
                  </div>
                  {viewTarget.sentAt && (
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Sent</span>
                      <p className="text-gray-700">{format(parseISO(viewTarget.sentAt), "MMM d, yyyy HH:mm")} UTC</p>
                    </div>
                  )}
                  {viewTarget.scheduledAt && (
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Scheduled</span>
                      <p className="text-gray-700">{format(parseISO(viewTarget.scheduledAt), "MMM d, yyyy HH:mm")} UTC</p>
                    </div>
                  )}
                  {viewTarget.actualRecipients !== undefined && (
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Delivered To</span>
                      <p className="text-gray-700">{viewTarget.actualRecipients.toLocaleString()} / {viewTarget.estimatedRecipients.toLocaleString()}</p>
                    </div>
                  )}
                  {viewTarget.deliveryRate !== undefined && (
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Delivery Rate</span>
                      <p className="text-gray-700">{viewTarget.deliveryRate}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Push Preview Panel (inline) ─────────────────────────────────────────────

function PushPreviewPanel({ title, body }: { title: string; body: string }) {
  const displayTitle = title.trim() || "Notification Title";
  const displayBody = body.trim() || "Your notification message will appear here...";
  const hasContent = title.trim() !== "" || body.trim() !== "";

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Smartphone className="h-8 w-8 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">Start typing to see a preview.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phone Frame */}
      <div className="relative">
        <div className="relative w-[220px] h-[390px] rounded-[32px] bg-gray-900 shadow-2xl">
          {/* Screen */}
          <div className="absolute inset-[6px] rounded-[28px] overflow-hidden">
            {/* Wallpaper */}
            <div className="w-full h-full bg-gradient-to-b from-[#0f2167] via-[#1e3a8a] to-[#0f172a]" />

            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-white text-[10px]">9:41</span>
              <div className="w-16 h-3.5 bg-black rounded-full mx-auto absolute left-1/2 -translate-x-1/2" />
              <div className="flex items-center gap-1">
                <div className="text-white text-[9px]">***</div>
              </div>
            </div>

            {/* Lock screen */}
            <div className="absolute top-12 left-0 right-0 text-center">
              <p className="text-white/80 text-[10px] uppercase tracking-widest">Today</p>
              <p className="text-white text-2xl mt-0.5">9:41</p>
            </div>

            {/* Notification card */}
            <div className="absolute left-2 right-2 top-[90px] rounded-2xl bg-white/25 backdrop-blur-md border border-white/20">
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-[#003B95] flex items-center justify-center shrink-0">
                    <BellRing className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/90 text-[9px] uppercase tracking-wide">Playzoon</span>
                </div>
                <span className="text-white/50 text-[9px]">now</span>
              </div>
              <div className="px-3 pb-3">
                <p className="text-[11px] leading-snug text-white font-medium mb-0.5">
                  {displayTitle.length > 40 ? displayTitle.slice(0, 40) + "..." : displayTitle}
                </p>
                <p className="text-[10px] leading-snug text-white/70">
                  {displayBody.length > 80 ? displayBody.slice(0, 80) + "..." : displayBody}
                </p>
              </div>
              <div className="border-t border-white/15 flex">
                <span className="flex-1 py-1.5 text-[10px] text-[#60a5fa] text-center border-r border-white/15">Open</span>
                <span className="flex-1 py-1.5 text-[10px] text-white/50 text-center">Dismiss</span>
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/50 rounded-full" />
          </div>
        </div>

        {/* Side buttons */}
        <div className="absolute right-[-4px] top-[90px] w-1 h-10 bg-gray-700 rounded-r-md" />
        <div className="absolute left-[-4px] top-[70px] w-1 h-8 bg-gray-700 rounded-l-md" />
        <div className="absolute left-[-4px] top-[88px] w-1 h-8 bg-gray-700 rounded-l-md" />
        <div className="absolute left-[-4px] top-[108px] w-1 h-8 bg-gray-700 rounded-l-md" />
      </div>

      <p className="text-[10px] text-gray-400 text-center max-w-[200px]">
        Preview only. Actual appearance may vary by device.
      </p>
    </div>
  );
}
