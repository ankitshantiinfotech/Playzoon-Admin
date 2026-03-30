// ─── US-130: Admin In-App Notification Centre — Types ────────

export type AdminNotifType =
  | "new_provider_registration"
  | "bank_account_submitted"
  | "new_payout_request"
  | "new_enquiry"
  | "chat_flagged"
  | "new_promoted_listing"
  | "review_flagged"
  | "facility_access_request"
  | "system_error"
  | "broadcast_scheduled"
  | "sub_admin_action"
  | "tournament_auto_status";

export type AdminNotifCategory =
  | "Provider Events"
  | "Financial"
  | "Support"
  | "System"
  | "Content";

export type NotifPriority = "normal" | "critical";

export interface AdminNotification {
  id:        string;
  type:      AdminNotifType;
  category:  AdminNotifCategory;
  priority:  NotifPriority;    // BR-130-04: critical always shown
  title:     string;
  body:      string;           // max 120 chars
  timestamp: Date;
  isRead:    boolean;
  deepLink:  string;           // route path — BR-130-02: navigate on click
  entityName?: string;         // e.g. "Desert Padel Club"
  entityId?:   string;         // e.g. "PRV-001"
  meta?:       Record<string, string>; // extra context
}

// ─── Type configuration map ───────────────────────────────────

export const NOTIF_TYPE_CONFIG: Record<AdminNotifType, {
  label:    string;
  icon:     string;    // lucide icon name
  color:    string;    // icon container colour classes
  category: AdminNotifCategory;
}> = {
  new_provider_registration: {
    label:    "New Provider Registration",
    icon:     "Building2",
    color:    "bg-blue-50 text-blue-600",
    category: "Provider Events",
  },
  bank_account_submitted: {
    label:    "Bank Account Submitted",
    icon:     "BadgeCheck",
    color:    "bg-violet-50 text-violet-600",
    category: "Financial",
  },
  new_payout_request: {
    label:    "New Payout Request",
    icon:     "Banknote",
    color:    "bg-emerald-50 text-emerald-600",
    category: "Financial",
  },
  new_enquiry: {
    label:    "New Contact Us Enquiry",
    icon:     "HelpCircle",
    color:    "bg-sky-50 text-sky-600",
    category: "Support",
  },
  chat_flagged: {
    label:    "Chat Message Flagged",
    icon:     "Flag",
    color:    "bg-amber-50 text-amber-600",
    category: "Content",
  },
  new_promoted_listing: {
    label:    "New Promoted Listing Request",
    icon:     "TrendingUp",
    color:    "bg-purple-50 text-purple-600",
    category: "Content",
  },
  review_flagged: {
    label:    "Review Flagged for Moderation",
    icon:     "StarOff",
    color:    "bg-orange-50 text-orange-600",
    category: "Content",
  },
  facility_access_request: {
    label:    "Facility Access Request",
    icon:     "DoorOpen",
    color:    "bg-teal-50 text-teal-600",
    category: "Provider Events",
  },
  system_error: {
    label:    "System Error Alert",
    icon:     "AlertTriangle",
    color:    "bg-red-50 text-red-600",
    category: "System",
  },
  broadcast_scheduled: {
    label:    "Broadcast Notification Scheduled",
    icon:     "Radio",
    color:    "bg-indigo-50 text-indigo-600",
    category: "System",
  },
  sub_admin_action: {
    label:    "Sub-Admin Account Action",
    icon:     "UserCog",
    color:    "bg-slate-100 text-slate-600",
    category: "System",
  },
  tournament_auto_status: {
    label:    "Tournament Auto-Status Change",
    icon:     "Trophy",
    color:    "bg-amber-50 text-amber-700",
    category: "Provider Events",
  },
};

export const CATEGORY_COLORS: Record<AdminNotifCategory, string> = {
  "Provider Events": "bg-blue-50 text-blue-700 border-blue-200",
  "Financial":       "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Support":         "bg-sky-50 text-sky-700 border-sky-200",
  "System":          "bg-red-50 text-red-700 border-red-200",
  "Content":         "bg-amber-50 text-amber-700 border-amber-200",
};

export const ALL_CATEGORIES: AdminNotifCategory[] = [
  "Provider Events", "Financial", "Support", "System", "Content",
];

/** BR-130-03: notifications retained 90 days */
export const RETENTION_DAYS = 90;

/** BR-130-05: polling interval in ms */
export const POLL_INTERVAL_MS = 30_000;
