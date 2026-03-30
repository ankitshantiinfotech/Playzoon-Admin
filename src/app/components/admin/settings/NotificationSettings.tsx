import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Smartphone,
  Inbox,
  Pencil,
  Save,
  ChevronLeft,
  Eye,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

// ─── Types ──────────────────────────────────────────────────
interface EventConfig {
  id: string;
  name: string;
  description: string;
  push: boolean;
  email: boolean;
  inApp: boolean;
}

interface NotificationTemplate {
  id: string;
  eventTypeId: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
}

// ─── Constants ──────────────────────────────────────────────
const AVAILABLE_TOKENS = [
  { label: "Player Name", value: "{player_name}" },
  { label: "Amount", value: "{amount}" },
  { label: "Date", value: "{date}" },
  { label: "Facility", value: "{facility_name}" },
  { label: "Booking ID", value: "{booking_id}" },
  { label: "Provider", value: "{provider_name}" },
  { label: "Tournament", value: "{tournament_name}" },
  { label: "Time", value: "{time}" },
];

const INITIAL_EVENTS: EventConfig[] = [
  { id: "booking_confirmed", name: "Booking Confirmed", description: "When a booking is successfully confirmed", push: true, email: true, inApp: true },
  { id: "booking_cancelled", name: "Booking Cancelled", description: "When a booking is cancelled by user or provider", push: true, email: true, inApp: true },
  { id: "payment_received", name: "Payment Received", description: "When a payment is processed successfully", push: true, email: true, inApp: true },
  { id: "tournament_joined", name: "Tournament Joined", description: "When a player joins a tournament", push: true, email: false, inApp: true },
  { id: "review_received", name: "Review Received", description: "When a new review is submitted", push: false, email: true, inApp: true },
  { id: "payout_processed", name: "Payout Processed", description: "When a provider payout is completed", push: true, email: true, inApp: true },
  { id: "training_booked", name: "Training Booked", description: "When a training session is booked", push: true, email: true, inApp: true },
  { id: "wallet_recharged", name: "Wallet Recharged", description: "When wallet balance is topped up", push: true, email: false, inApp: true },
  { id: "promotion_activated", name: "Promotion Activated", description: "When a promotional offer is activated", push: true, email: true, inApp: false },
  { id: "account_verified", name: "Account Verified", description: "When a provider account is verified", push: false, email: true, inApp: true },
];

const INITIAL_TEMPLATES: NotificationTemplate[] = [
  {
    id: "tpl_1",
    eventTypeId: "booking_confirmed",
    titleEn: "Booking Confirmed!",
    titleAr: "تم تأكيد الحجز!",
    bodyEn: "Hi {player_name}, your booking #{booking_id} at {facility_name} on {date} at {time} has been confirmed.",
    bodyAr: "مرحباً {player_name}، تم تأكيد حجزك #{booking_id} في {facility_name} بتاريخ {date} الساعة {time}.",
  },
  {
    id: "tpl_2",
    eventTypeId: "booking_cancelled",
    titleEn: "Booking Cancelled",
    titleAr: "تم إلغاء الحجز",
    bodyEn: "Hi {player_name}, your booking #{booking_id} on {date} has been cancelled. Amount {amount} will be refunded.",
    bodyAr: "مرحباً {player_name}، تم إلغاء حجزك #{booking_id} بتاريخ {date}. سيتم استرداد المبلغ {amount}.",
  },
  {
    id: "tpl_3",
    eventTypeId: "payment_received",
    titleEn: "Payment Received",
    titleAr: "تم استلام الدفعة",
    bodyEn: "Hi {player_name}, your payment of {amount} has been received successfully on {date}.",
    bodyAr: "مرحباً {player_name}، تم استلام دفعتك بمبلغ {amount} بنجاح بتاريخ {date}.",
  },
  {
    id: "tpl_4",
    eventTypeId: "tournament_joined",
    titleEn: "Tournament Registration Confirmed",
    titleAr: "تم تأكيد التسجيل في البطولة",
    bodyEn: "Hi {player_name}, you've successfully joined {tournament_name} on {date}. Good luck!",
    bodyAr: "مرحباً {player_name}، لقد انضممت بنجاح إلى {tournament_name} بتاريخ {date}. بالتوفيق!",
  },
  {
    id: "tpl_5",
    eventTypeId: "review_received",
    titleEn: "New Review Received",
    titleAr: "تم استلام تقييم جديد",
    bodyEn: "Hi {provider_name}, you received a new review for {facility_name} from {player_name}.",
    bodyAr: "مرحباً {provider_name}، لقد استلمت تقييماً جديداً لـ {facility_name} من {player_name}.",
  },
  {
    id: "tpl_6",
    eventTypeId: "payout_processed",
    titleEn: "Payout Processed",
    titleAr: "تم معالجة الدفعة",
    bodyEn: "Hi {provider_name}, your payout of {amount} has been processed on {date}.",
    bodyAr: "مرحباً {provider_name}، تم معالجة دفعتك بمبلغ {amount} بتاريخ {date}.",
  },
  {
    id: "tpl_7",
    eventTypeId: "training_booked",
    titleEn: "Training Session Booked",
    titleAr: "تم حجز جلسة تدريبية",
    bodyEn: "Hi {player_name}, your training session at {facility_name} on {date} at {time} is confirmed.",
    bodyAr: "مرحباً {player_name}، تم تأكيد جلستك التدريبية في {facility_name} بتاريخ {date} الساعة {time}.",
  },
  {
    id: "tpl_8",
    eventTypeId: "wallet_recharged",
    titleEn: "Wallet Recharged",
    titleAr: "تم شحن المحفظة",
    bodyEn: "Hi {player_name}, your wallet has been recharged with {amount} on {date}.",
    bodyAr: "مرحباً {player_name}، تم شحن محفظتك بمبلغ {amount} بتاريخ {date}.",
  },
  {
    id: "tpl_9",
    eventTypeId: "promotion_activated",
    titleEn: "New Promotion Available!",
    titleAr: "عرض ترويجي جديد متاح!",
    bodyEn: "Hi {player_name}, a new promotion is now active at {facility_name}. Book now and save!",
    bodyAr: "مرحباً {player_name}، عرض ترويجي جديد متاح الآن في {facility_name}. احجز الآن ووفر!",
  },
  {
    id: "tpl_10",
    eventTypeId: "account_verified",
    titleEn: "Account Verified",
    titleAr: "تم التحقق من الحساب",
    bodyEn: "Hi {provider_name}, your account has been verified on {date}. You can now start receiving bookings.",
    bodyAr: "مرحباً {provider_name}، تم التحقق من حسابك بتاريخ {date}. يمكنك الآن البدء في استقبال الحجوزات.",
  },
];

// ─── Sub-Components ─────────────────────────────────────────

function ChannelHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Icon className="h-4 w-4 text-gray-500" />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

// ─── Toggle Grid ────────────────────────────────────────────

function ToggleGrid({
  events,
  onToggle,
}: {
  events: EventConfig[];
  onToggle: (eventId: string, channel: "push" | "email" | "inApp") => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm text-gray-600">Event Type</th>
            <th className="text-center py-3 px-4 w-24">
              <ChannelHeader icon={Smartphone} label="Push" />
            </th>
            <th className="text-center py-3 px-4 w-24">
              <ChannelHeader icon={Mail} label="Email" />
            </th>
            <th className="text-center py-3 px-4 w-24">
              <ChannelHeader icon={Inbox} label="In-App" />
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, idx) => (
            <tr
              key={event.id}
              className={cn(
                "border-b border-gray-100 transition-colors hover:bg-gray-50/50",
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              )}
            >
              <td className="py-3 px-4">
                <div>
                  <p className="text-sm text-gray-900">{event.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>
                </div>
              </td>
              <td className="text-center py-3 px-4">
                <div className="flex justify-center">
                  <Switch
                    checked={event.push}
                    onCheckedChange={() => onToggle(event.id, "push")}
                    className="data-[state=checked]:bg-[#003B95]"
                  />
                </div>
              </td>
              <td className="text-center py-3 px-4">
                <div className="flex justify-center">
                  <Switch
                    checked={event.email}
                    onCheckedChange={() => onToggle(event.id, "email")}
                    className="data-[state=checked]:bg-[#003B95]"
                  />
                </div>
              </td>
              <td className="text-center py-3 px-4">
                <div className="flex justify-center">
                  <Switch
                    checked={event.inApp}
                    onCheckedChange={() => onToggle(event.id, "inApp")}
                    className="data-[state=checked]:bg-[#003B95]"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Token Chips ────────────────────────────────────────────

function TokenChips({
  onInsert,
}: {
  onInsert: (token: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-500">Available Tokens — click to insert at cursor</Label>
      <div className="flex flex-wrap gap-1.5">
        {AVAILABLE_TOKENS.map((token) => (
          <button
            key={token.value}
            type="button"
            onClick={() => onInsert(token.value)}
            className="inline-flex items-center gap-1 rounded-md border border-[#003B95]/20 bg-[#003B95]/5 px-2.5 py-1 text-xs text-[#003B95] hover:bg-[#003B95]/10 hover:border-[#003B95]/40 transition-colors cursor-pointer"
          >
            <span className="font-mono">{token.value}</span>
            <span className="text-gray-400 hidden sm:inline">·</span>
            <span className="text-gray-500 hidden sm:inline">{token.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Preview Panel ──────────────────────────────────────────

function PreviewPanel({ template }: { template: NotificationTemplate }) {
  const resolveTokens = (text: string) => {
    return text
      .replace(/\{player_name\}/g, "Ahmed Ali")
      .replace(/\{amount\}/g, "150 SAR")
      .replace(/\{date\}/g, "Feb 20, 2026")
      .replace(/\{time\}/g, "4:00 PM")
      .replace(/\{facility_name\}/g, "Sports Arena Riyadh")
      .replace(/\{booking_id\}/g, "BK-2847")
      .replace(/\{provider_name\}/g, "Sports Arena Co.")
      .replace(/\{tournament_name\}/g, "Weekend Cup");
  };

  const eventName = INITIAL_EVENTS.find((e) => e.id === template.eventTypeId)?.name || "Notification";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <Eye className="h-4 w-4" />
        <span>Live Preview</span>
      </div>

      {/* Push Notification Preview */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Push Notification</p>
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 space-y-1">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-[#003B95] flex items-center justify-center">
              <Bell className="h-3 w-3 text-white" />
            </div>
            <span className="text-[10px] text-gray-400 uppercase">Playzoon</span>
            <span className="text-[10px] text-gray-300 ml-auto">now</span>
          </div>
          <p className="text-sm text-gray-900">{resolveTokens(template.titleEn) || "Notification Title"}</p>
          <p className="text-xs text-gray-500 line-clamp-2">{resolveTokens(template.bodyEn) || "Notification body goes here..."}</p>
        </div>
      </div>

      {/* Arabic Preview */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Arabic (RTL)</p>
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 space-y-1" dir="rtl">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-[#003B95] flex items-center justify-center">
              <Bell className="h-3 w-3 text-white" />
            </div>
            <span className="text-[10px] text-gray-400 uppercase">Playzoon</span>
            <span className="text-[10px] text-gray-300 mr-auto">الآن</span>
          </div>
          <p className="text-sm text-gray-900">{resolveTokens(template.titleAr) || "عنوان الإشعار"}</p>
          <p className="text-xs text-gray-500 line-clamp-2">{resolveTokens(template.bodyAr) || "نص الإشعار هنا..."}</p>
        </div>
      </div>

      {/* Email Preview */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-[#003B95] px-4 py-3">
            <span className="text-white text-xs tracking-wider uppercase">Playzoon</span>
          </div>
          <div className="bg-white p-4 space-y-2">
            <p className="text-sm text-gray-900">{resolveTokens(template.titleEn) || "Email Subject"}</p>
            <div className="border-t border-gray-100 pt-2">
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{resolveTokens(template.bodyEn) || "Email body goes here..."}</p>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">© 2026 Playzoon. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template Editor ────────────────────────────────────────

function TemplateEditor({
  template,
  events,
  onChange,
  onSave,
  onBack,
  errors,
}: {
  template: NotificationTemplate;
  events: EventConfig[];
  onChange: (updated: NotificationTemplate) => void;
  onSave: () => void;
  onBack: () => void;
  errors: Record<string, string>;
}) {
  const bodyEnRef = useRef<HTMLTextAreaElement>(null);
  const bodyArRef = useRef<HTMLTextAreaElement>(null);
  const [activeBodyField, setActiveBodyField] = useState<"en" | "ar">("en");

  const handleInsertToken = useCallback(
    (token: string) => {
      const ref = activeBodyField === "en" ? bodyEnRef : bodyArRef;
      const fieldKey = activeBodyField === "en" ? "bodyEn" : "bodyAr";
      const textarea = ref.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = activeBodyField === "en" ? template.bodyEn : template.bodyAr;
        const newValue = currentValue.substring(0, start) + token + currentValue.substring(end);
        onChange({ ...template, [fieldKey]: newValue });
        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start + token.length, start + token.length);
        });
      } else {
        // Fallback: append to the active field
        const fieldKey = activeBodyField === "en" ? "bodyEn" : "bodyAr";
        const currentValue = activeBodyField === "en" ? template.bodyEn : template.bodyAr;
        onChange({ ...template, [fieldKey]: currentValue + token });
      }
    },
    [activeBodyField, template, onChange]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" />
          Back to templates
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Editor (3 cols) */}
        <div className="xl:col-span-3 space-y-5">
          {/* Event Type */}
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select
              value={template.eventTypeId}
              onValueChange={(val) => onChange({ ...template, eventTypeId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bilingual Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titleEn">Title (EN)</Label>
              <Input
                id="titleEn"
                value={template.titleEn}
                onChange={(e) => onChange({ ...template, titleEn: e.target.value })}
                placeholder="Enter English title"
              />
              {errors.titleEn && <p className="text-xs text-red-500">{errors.titleEn}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleAr" className="text-right block" style={{ direction: "rtl" }}>
                Title (AR)
              </Label>
              <Input
                id="titleAr"
                value={template.titleAr}
                onChange={(e) => onChange({ ...template, titleAr: e.target.value })}
                placeholder="أدخل العنوان بالعربية"
                dir="rtl"
              />
              {errors.titleAr && <p className="text-xs text-red-500">{errors.titleAr}</p>}
            </div>
          </div>

          {/* Token Chips */}
          <TokenChips onInsert={handleInsertToken} />

          {/* Bilingual Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bodyEn">Body (EN)</Label>
              <Textarea
                id="bodyEn"
                ref={bodyEnRef}
                value={template.bodyEn}
                onFocus={() => setActiveBodyField("en")}
                onChange={(e) => onChange({ ...template, bodyEn: e.target.value })}
                placeholder="Enter English notification body..."
                className="min-h-[120px]"
              />
              {errors.bodyEn && <p className="text-xs text-red-500">{errors.bodyEn}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyAr" className="text-right block" style={{ direction: "rtl" }}>
                Body (AR)
              </Label>
              <Textarea
                id="bodyAr"
                ref={bodyArRef}
                value={template.bodyAr}
                onFocus={() => setActiveBodyField("ar")}
                onChange={(e) => onChange({ ...template, bodyAr: e.target.value })}
                placeholder="أدخل نص الإشعار بالعربية..."
                dir="rtl"
                className="min-h-[120px]"
              />
              {errors.bodyAr && <p className="text-xs text-red-500">{errors.bodyAr}</p>}
            </div>
          </div>

          {/* Active field indicator */}
          <p className="text-xs text-gray-400">
            Tokens will insert into: <span className="text-[#003B95]">{activeBodyField === "en" ? "Body (EN)" : "Body (AR)"}</span>
          </p>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={onSave} className="bg-[#003B95] hover:bg-[#002a6b] gap-2">
              <Save className="h-4 w-4" />
              Save Template
            </Button>
          </div>
        </div>

        {/* Preview (2 cols) */}
        <div className="xl:col-span-2">
          <div className="sticky top-0 bg-gray-50 rounded-xl border border-gray-200 p-5">
            <PreviewPanel template={template} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template List ──────────────────────────────────────────

function TemplateList({
  templates,
  events,
  onEdit,
}: {
  templates: NotificationTemplate[];
  events: EventConfig[];
  onEdit: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {templates.map((tpl) => {
        const event = events.find((e) => e.id === tpl.eventTypeId);
        return (
          <div
            key={tpl.id}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:border-[#003B95]/30 hover:shadow-sm transition-all group cursor-pointer"
            onClick={() => onEdit(tpl.id)}
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-900 truncate">{tpl.titleEn}</p>
                <Badge variant="secondary" className="text-[10px] shrink-0 bg-[#003B95]/10 text-[#003B95] border-[#003B95]/20">
                  {event?.name || tpl.eventTypeId}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 truncate">{tpl.bodyEn}</p>
              <p className="text-xs text-gray-400 truncate" dir="rtl">{tpl.titleAr}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#003B95]"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(tpl.id);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function NotificationSettings() {
  const [events, setEvents] = useState<EventConfig[]>(INITIAL_EVENTS);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(INITIAL_TEMPLATES);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editorErrors, setEditorErrors] = useState<Record<string, string>>({});

  // ─── Event Config Handlers ─────────────────────────────
  const handleToggle = (eventId: string, channel: "push" | "email" | "inApp") => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, [channel]: !e[channel] } : e))
    );
  };

  const handleSaveEventConfig = () => {
    toast.success("Settings saved");
  };

  // ─── Template Handlers ─────────────────────────────────
  const handleEditTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setEditingTemplateId(templateId);
      setEditingTemplate({ ...tpl });
      setEditorErrors({});
    }
  };

  const handleTemplateChange = (updated: NotificationTemplate) => {
    setEditingTemplate(updated);
    // Clear errors for fields that are now filled
    if (updated.titleEn) setEditorErrors((prev) => ({ ...prev, titleEn: "" }));
    if (updated.titleAr) setEditorErrors((prev) => ({ ...prev, titleAr: "" }));
    if (updated.bodyEn) setEditorErrors((prev) => ({ ...prev, bodyEn: "" }));
    if (updated.bodyAr) setEditorErrors((prev) => ({ ...prev, bodyAr: "" }));
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    const errors: Record<string, string> = {};
    if (!editingTemplate.titleEn.trim()) errors.titleEn = "Title (EN) is required";
    if (!editingTemplate.titleAr.trim()) errors.titleAr = "Title (AR) is required";
    if (!editingTemplate.bodyEn.trim()) errors.bodyEn = "Body (EN) is required";
    if (!editingTemplate.bodyAr.trim()) errors.bodyAr = "Body (AR) is required";

    if (Object.keys(errors).length > 0) {
      setEditorErrors(errors);
      toast.error("Title and body are required for both languages");
      return;
    }

    setTemplates((prev) =>
      prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t))
    );
    setEditingTemplateId(null);
    setEditingTemplate(null);
    setEditorErrors({});
    toast.success("Settings saved");
  };

  const handleBackToList = () => {
    setEditingTemplateId(null);
    setEditingTemplate(null);
    setEditorErrors({});
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Notification Settings</h2>
        <p className="text-muted-foreground">Configure event-based notifications, channels, and bilingual templates.</p>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="events" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4">
            <Bell className="h-4 w-4" />
            Event Configuration
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4">
            <Mail className="h-4 w-4" />
            Template Management
          </TabsTrigger>
        </TabsList>

        {/* ── Event Configuration Tab ─────────────────────── */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#003B95]" />
                Event Channel Configuration
              </CardTitle>
              <CardDescription>
                Control which channels (Push, Email, In-App) are active for each event type. Changes affect all platform users.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ToggleGrid events={events} onToggle={handleToggle} />
              <div className="flex justify-end p-4 border-t border-gray-100">
                <Button onClick={handleSaveEventConfig} className="bg-[#003B95] hover:bg-[#002a6b] gap-2">
                  <Save className="h-4 w-4" />
                  Save Channel Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Template Management Tab ─────────────────────── */}
        <TabsContent value="templates">
          {editingTemplateId && editingTemplate ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-[#003B95]" />
                  Edit Template
                </CardTitle>
                <CardDescription>
                  Modify the notification template content for both English and Arabic. Use token chips to insert dynamic values.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateEditor
                  template={editingTemplate}
                  events={events}
                  onChange={handleTemplateChange}
                  onSave={handleSaveTemplate}
                  onBack={handleBackToList}
                  errors={editorErrors}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#003B95]" />
                  Notification Templates
                </CardTitle>
                <CardDescription>
                  Manage bilingual notification templates. Click a template to edit its content and preview.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateList
                  templates={templates}
                  events={events}
                  onEdit={handleEditTemplate}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}