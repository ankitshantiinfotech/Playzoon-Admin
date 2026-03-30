// ─── SCR-ADM-041 & SCR-ADM-042 — Promotion Management Types ──────────────────

// ─── Provider Types ──────────────────────────────────────────────────────────

export type ProviderType = "Facility Provider" | "Training Provider";

export const PROVIDER_TYPES: ProviderType[] = [
  "Facility Provider",
  "Training Provider",
];

// ─── Placement Types ─────────────────────────────────────────────────────────

export type PlacementType = "Homepage" | "Listing Page" | "Both";

export const PLACEMENT_TYPES: PlacementType[] = [
  "Homepage",
  "Listing Page",
  "Both",
];

// ─── Duration Types ──────────────────────────────────────────────────────────

export type PromotionDuration = "Daily" | "Weekly" | "Monthly" | "Yearly";

export const DURATIONS: PromotionDuration[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Yearly",
];

// ─── Promotion Status ────────────────────────────────────────────────────────

export type PromotionStatus = "Live" | "Upcoming" | "Ended";

export const PROMOTION_STATUSES: PromotionStatus[] = [
  "Live",
  "Upcoming",
  "Ended",
];

// ─── Payment Status ──────────────────────────────────────────────────────────

export type PaymentStatus = "Success" | "Pending" | "Failed";

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "Success",
  "Pending",
  "Failed",
];

// ─── Payment Method ──────────────────────────────────────────────────────────

export type PaymentMethod = "Credit Card" | "Wallet" | "Bank Transfer" | "Apple Pay";

// ─── Core Promotion Record (SCR-ADM-041) ─────────────────────────────────────

export interface PromotionRecord {
  id: string;
  entityName: string;
  entityType: "Facility" | "Training";
  providerName: string;
  providerType: ProviderType;
  placement: PlacementType;
  duration: PromotionDuration;
  startDate: string;   // ISO date
  endDate: string;     // ISO date
  amount: number;      // SAR
  paymentMethod: PaymentMethod;
  transactionId: string;
  paymentStatus: PaymentStatus;
  promotionStatus: PromotionStatus;
}

// ─── Pricing Configuration (SCR-ADM-042) ─────────────────────────────────────

export interface PricingCell {
  placement: PlacementType;
  duration: PromotionDuration;
  price: number;       // SAR — 0 means free promotion
  isActive: boolean;
}

export interface PricingMatrix {
  cells: PricingCell[];
}

export interface HomepageSlotConfig {
  maxSlots: number;
  currentUsage: number;
}

export interface PricingAuditEntry {
  id: string;
  timestamp: string;    // ISO datetime
  adminName: string;
  changeSummary: string;
}

// ─── Summary Stats (SCR-ADM-041) ─────────────────────────────────────────────

export interface PromotionStats {
  total: number;
  live: number;
  upcoming: number;
  ended: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function computeStats(promotions: PromotionRecord[]): PromotionStats {
  return {
    total: promotions.length,
    live: promotions.filter((p) => p.promotionStatus === "Live").length,
    upcoming: promotions.filter((p) => p.promotionStatus === "Upcoming").length,
    ended: promotions.filter((p) => p.promotionStatus === "Ended").length,
  };
}

export function fmtSAR(amount: number): string {
  return `SAR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildDefaultPricingMatrix(): PricingCell[] {
  const cells: PricingCell[] = [];
  for (const placement of PLACEMENT_TYPES) {
    for (const duration of DURATIONS) {
      cells.push({ placement, duration, price: 0, isActive: false });
    }
  }
  return cells;
}
