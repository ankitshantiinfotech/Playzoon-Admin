// ─── US-102 Payment Management — Types ───────────────────────────────────────

export type PaymentStatus =
  | "Success"
  | "Failed"
  | "Pending"
  | "Refunded"
  | "Refund Initiated"   // BR-001: card refund in progress (3-7 days)
  | "Resolved";          // BR-005: failed tx resolved externally without financial action

export type PaymentMethod = "Card" | "Wallet" | "Apple Pay" | "Google Pay" | "Mada" | "STC Pay";
export type CardBrand = "Visa" | "MasterCard" | "Mada" | null;
export type TransactionType = "Booking Payment" | "Wallet Top-Up" | "Refund" | "Payout";
export type RefundDestination = "Player Wallet" | "Original Payment Method";

// ─── Sub-entities ─────────────────────────────────────────────────────────────

export interface TxnPlayer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface TxnProvider {
  id: string;
  name: string;
  type: "Facility" | "Training" | "Coach";
}

export interface RefundRecord {
  id: string;
  amount: number;
  destination: RefundDestination;
  reason: string;
  processedBy: string;
  processedAt: string;
  status: "Completed" | "Initiated" | "Failed";
}

export interface AdminNote {
  id: string;
  note: string;
  addedBy: string;
  addedAt: string;
}

export interface ResolutionRecord {
  reason: string;
  resolvedBy: string;
  resolvedAt: string;
}

// ─── Main transaction ─────────────────────────────────────────────────────────

export interface PaymentTransaction {
  id: string;                    // Internal TXN-XXXXX
  gatewayReference: string;      // External gateway ref e.g. MF-XXXXXXX
  player: TxnPlayer;
  provider?: TxnProvider;        // Present for Booking Payment and Payout types
  type: TransactionType;
  amount: number;                // AED
  currency: "AED";
  method: PaymentMethod;
  cardBrand: CardBrand;
  cardLast4?: string;
  status: PaymentStatus;
  gatewayResponseCode: string;
  createdAt: string;             // ISO
  processedAt?: string;
  completedAt?: string;
  receiptUrl?: string;
  bookingId?: string;            // if type === "Booking Payment"
  refundHistory: RefundRecord[];
  totalRefunded: number;         // sum of all completed refunds
  adminNotes: AdminNote[];
  resolution?: ResolutionRecord;
}

// ─── Filter state ─────────────────────────────────────────────────────────────

export interface PaymentFilters {
  search: string;
  status: PaymentStatus | "All";
  type: TransactionType | "All";
  method: PaymentMethod | "All";
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export const DEFAULT_FILTERS: PaymentFilters = {
  search: "",
  status: "All",
  type: "All",
  method: "All",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};
