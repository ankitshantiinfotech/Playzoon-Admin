// ─── SCR-ADM-043: Push Notification Compose & Send — Types ───────────────────

// ─── Audience Roles ──────────────────────────────────────────────────────────

export type AudienceRole = "Players" | "Facility Providers" | "Training Providers" | "Coaches";

export const AUDIENCE_ROLES: AudienceRole[] = [
  "Players",
  "Facility Providers",
  "Training Providers",
  "Coaches",
];

export const AUDIENCE_ROLE_SHORT: Record<AudienceRole, string> = {
  Players: "Players",
  "Facility Providers": "FP",
  "Training Providers": "TP",
  Coaches: "Coaches",
};

// ─── Notification Status ─────────────────────────────────────────────────────

export type NotificationStatus = "Sent" | "Scheduled" | "Failed";

export const NOTIFICATION_STATUSES: NotificationStatus[] = [
  "Sent",
  "Scheduled",
  "Failed",
];

// ─── Delivery Type ───────────────────────────────────────────────────────────

export type DeliveryType = "immediate" | "scheduled";

// ─── Notification Record ─────────────────────────────────────────────────────

export interface PushNotificationRecord {
  id: string;
  title: string;
  body: string;
  audiences: AudienceRole[];
  deliveryType: DeliveryType;
  scheduledAt?: string;      // ISO datetime — only for scheduled
  sentAt?: string;           // ISO datetime — when delivered
  status: NotificationStatus;
  createdAt: string;         // ISO datetime
  createdBy: string;
  estimatedRecipients: number;
  actualRecipients?: number;
  deliveryRate?: number;     // 0-100 %
}

// ─── Compose Form State ──────────────────────────────────────────────────────

export interface ComposeFormState {
  title: string;
  body: string;
  audiences: AudienceRole[];
  deliveryType: DeliveryType;
  scheduledAt: string;       // datetime-local value
}

export const EMPTY_FORM: ComposeFormState = {
  title: "",
  body: "",
  audiences: [],
  deliveryType: "immediate",
  scheduledAt: "",
};

// ─── Audience size estimates ─────────────────────────────────────────────────

const BASE_SIZES: Record<AudienceRole, number> = {
  Players: 2450,
  "Facility Providers": 95,
  "Training Providers": 180,
  Coaches: 75,
};

export function estimateRecipients(audiences: AudienceRole[]): number {
  if (audiences.length === 0) return 0;
  return audiences.reduce((sum, role) => sum + BASE_SIZES[role], 0);
}
