// ─── SCR-ADM-034 / SCR-ADM-035 Payout Management — Types ─────────────────────

export type PayoutProviderType = "Facility Provider" | "Training Provider" | "Coach";
export type PayoutStatus = "Pending" | "Processing" | "Partially Paid" | "Settled" | "Rejected";
export type BankAccountStatus = "Approved" | "Not Approved" | "Revoked";

export const PAYOUT_PROVIDER_TYPES: PayoutProviderType[] = [
  "Facility Provider",
  "Training Provider",
  "Coach",
];

export const PAYOUT_STATUSES: PayoutStatus[] = [
  "Pending",
  "Processing",
  "Partially Paid",
  "Settled",
  "Rejected",
];

// ─── Provider Info ───────────────────────────────────────────────────────────

export interface PayoutProviderInfo {
  id: string;
  name: string;
  type: PayoutProviderType;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
}

// ─── Bank Account Info ───────────────────────────────────────────────────────

export interface BankAccountInfo {
  holderName: string;
  bankName: string;
  ibanMasked: string; // e.g. "****1234"
  status: BankAccountStatus;
}

// ─── Wallet Summary ──────────────────────────────────────────────────────────

export interface WalletSummary {
  availableBalance: number;
  lockedBalance: number;
  lifetimeEarnings: number;
}

// ─── Payout Cycle Info ───────────────────────────────────────────────────────

export interface PayoutCycleInfo {
  cycleDuration: string;       // e.g. "14 Days"
  currentCycleStart: string;   // ISO date
  currentCycleEnd: string;     // ISO date
  nextPayoutDate: string;      // ISO date
  amountPaidThisCycle: number;
  amountRemainingThisCycle: number;
}

// ─── Partial Payment ─────────────────────────────────────────────────────────

export interface PartialPayment {
  id: string;
  date: string;              // ISO datetime
  amountPaid: number;
  remainingAfter: number;
  adminUser: string;
  notes?: string;
}

// ─── Status Timeline Entry ───────────────────────────────────────────────────

export interface StatusTimelineEntry {
  id: string;
  status: string;
  timestamp: string;         // ISO datetime
  actor: string;
  notes?: string;
}

// ─── Audit Entry ─────────────────────────────────────────────────────────────

export interface PayoutAuditEntry {
  id: string;
  timestamp: string;         // ISO datetime
  admin: string;
  action: string;
  amount?: number;
  notes?: string;
}

// ─── Payout Request (list item) ──────────────────────────────────────────────

export interface PayoutRequest {
  id: string;                   // request ID, e.g. "PAY-2026-001"
  providerName: string;
  providerType: PayoutProviderType;
  requestedAmount: number;      // SAR
  walletBalance: number;        // SAR at request time
  status: PayoutStatus;
  submissionDate: string;       // ISO datetime
  bankStatus: BankAccountStatus;
  providerId: string;
}

// ─── Payout Detail (SCR-ADM-035) ─────────────────────────────────────────────

export interface PayoutDetail {
  id: string;
  status: PayoutStatus;
  requestedAmount: number;
  requestDate: string;          // ISO datetime
  rejectionReason?: string;
  adminNotes?: string;
  // Linked entities
  provider: PayoutProviderInfo;
  bankAccount: BankAccountInfo;
  wallet: WalletSummary;
  cycle: PayoutCycleInfo;
  partialPayments: PartialPayment[];
  timeline: StatusTimelineEntry[];
  auditHistory: PayoutAuditEntry[];
}

// ─── Summary stat for the cards ──────────────────────────────────────────────

export interface PayoutSummaryStat {
  status: PayoutStatus;
  count: number;
  totalAmount: number;
}
