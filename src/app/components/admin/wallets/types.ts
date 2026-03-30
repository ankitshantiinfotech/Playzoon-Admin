// ─── SCR-ADM-047: Wallet Management — Types ─────────────────────────────────

export type WalletStatus = "Active" | "Frozen";
export type UserType = "Player" | "Facility Provider" | "Training Provider" | "Coach";
export type AdjustmentType = "Credit" | "Debit";

export type TransactionType =
  | "Add Money"
  | "Join Tournament Payment"
  | "Reserved Hold"
  | "Reserved Release"
  | "Tournament Refund"
  | "Facility Payment"
  | "Training Payment"
  | "Coach Payment"
  | "Refund"
  | "Booking Earnings"
  | "Commission Deduction"
  | "Promotion Payment"
  | "Payout Deduction"
  | "Admin Manual Adjustment"
  | "Cancellation Penalty";

export interface WalletUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface WalletEntry {
  id: string;
  user: WalletUser;
  userType: UserType;
  status: WalletStatus;
  availableBalance: number;
  lockedBalance: number;  // Reserved for players, Blocked for providers
  lifetimeAmount: number; // Lifetime Spends (player) or Lifetime Earnings (provider)
  lastTransactionDate: string; // ISO datetime
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  description: string;
  amount: number;  // positive = credit, negative = debit
  balanceAfter: number;
  date: string; // ISO datetime
  isCredit: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isProviderType(type: UserType): boolean {
  return type === "Facility Provider" || type === "Training Provider" || type === "Coach";
}

export function userTypeShort(type: UserType): string {
  switch (type) {
    case "Player": return "Player";
    case "Facility Provider": return "FP";
    case "Training Provider": return "TP";
    case "Coach": return "Coach";
  }
}
