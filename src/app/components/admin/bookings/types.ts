// ─── Booking Management — Types (SCR-ADM-019 / SCR-ADM-020) ────────────────

export type BookingType = "Facility" | "Training" | "Coach" | "Tournament";
export type BookingStatus =
  | "Created"
  | "Upcoming"
  | "Ongoing"
  | "Completed"
  | "Cancelled"
  | "Partially Cancelled"
  | "Expired";

export type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Refunded"
  | "Partial Refund"
  | "Failed";

export const BOOKING_TYPES: BookingType[] = [
  "Facility",
  "Training",
  "Coach",
  "Tournament",
];

export const BOOKING_STATUSES: BookingStatus[] = [
  "Created",
  "Upcoming",
  "Ongoing",
  "Completed",
  "Cancelled",
  "Partially Cancelled",
  "Expired",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "Paid",
  "Pending",
  "Refunded",
  "Partial Refund",
  "Failed",
];

// ─── Sub-types ─────────────────────────────────────────────────────────────

export interface BookingPlayer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface BookingProvider {
  id: string;
  name: string;
  type: BookingType;
  email: string;
  phone: string;
  businessName?: string;
}

export interface BookingEntity {
  id: string;
  name: string;
  location: string;
  detail: string;
  sport?: string;
  image?: string;
}

export interface RefundRecord {
  id: string;
  amount: number;
  pct: number;
  reason: string;
  processedAt: string;
  processedBy: string;
  method?: string;
  status?: "Processed" | "Pending" | "Failed";
}

export interface BookingFinancials {
  grossAmount: number;
  discount: number;
  discountCode?: string;
  subtotal: number;
  commissionPct: number;
  commissionAmount: number;
  taxLabel: string;
  taxPct: number;
  taxAmount: number;
  netPayout: number;
  paymentMethod: "Credit Card" | "Apple Pay" | "Google Pay" | "Wallet" | "Mada";
  gatewayRef: string;
  paidAt: string;
  transactionId: string;
  refundHistory: RefundRecord[];
}

export interface BookingDependant {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  relation?: string;
  status: "Active" | "Cancelled";
}

export interface TimelineEvent {
  label: string;
  timestamp: string;
  actor: string;
  note?: string;
  isAdminAction?: boolean;
}

export interface CancellationInfo {
  cancelledBy: "Player" | "Provider" | "Admin Override" | "System";
  actorName?: string;
  reason: string;
  refundPct: number;
  refundAmount: number;
  cancelledAt: string;
  cancellationCharge: number;
  cancellationPolicy?: string;
  adminNotes?: string;
}

export interface FlagInfo {
  flaggedBy: string;
  flaggedAt: string;
  reason: string;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
}

export interface Booking {
  id: string;
  type: BookingType;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  player: BookingPlayer;
  provider: BookingProvider;
  entity: BookingEntity;
  bookingDate: string; // ISO datetime — the date of the actual booking
  duration: number; // minutes
  period: string; // "60 min", "Full Day", "Per Session"
  playersCount: number;
  dependants: BookingDependant[];
  financials: BookingFinancials;
  timeline: TimelineEvent[];
  cancellation?: CancellationInfo;
  flagInfo?: FlagInfo;
  auditTrail: AuditTrailEntry[];
  bookingSource: "App" | "Web";
  createdAt: string;
  flagged: boolean;
}

// ─── Business Rule helpers ─────────────────────────────────────────────────

/** BR-004: Admin can only cancel Upcoming bookings */
export function canAdminCancel(status: BookingStatus): boolean {
  return status === "Upcoming";
}
