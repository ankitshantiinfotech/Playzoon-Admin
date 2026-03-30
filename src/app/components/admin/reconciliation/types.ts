// ─── SCR-ADM-038: Reconciliation Mismatches Types & Mock Data ─────────────────

// ─── Mismatch Types ──────────────────────────────────────────────────────────

export type MismatchType =
  | "Amount Mismatch"
  | "Missing Payment"
  | "Duplicate Charge"
  | "Status Inconsistency"
  | "Pending Timeout";

export const ALL_MISMATCH_TYPES: MismatchType[] = [
  "Amount Mismatch",
  "Missing Payment",
  "Duplicate Charge",
  "Status Inconsistency",
  "Pending Timeout",
];

export const MISMATCH_TYPE_STYLES: Record<MismatchType, string> = {
  "Amount Mismatch":       "bg-amber-50 text-amber-700 border-amber-200",
  "Missing Payment":       "bg-red-50 text-red-600 border-red-200",
  "Duplicate Charge":      "bg-red-50 text-red-600 border-red-200",
  "Status Inconsistency":  "bg-amber-50 text-amber-700 border-amber-200",
  "Pending Timeout":       "bg-blue-50 text-blue-700 border-blue-200",
};

// ─── Mismatch Status ─────────────────────────────────────────────────────────

export type MismatchStatus = "Unresolved" | "Acknowledged" | "Resolved";

export const MISMATCH_STATUS_STYLES: Record<MismatchStatus, string> = {
  Unresolved:   "bg-red-50 text-red-600 border-red-200",
  Acknowledged: "bg-amber-50 text-amber-700 border-amber-200",
  Resolved:     "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ─── Resolution Categories ───────────────────────────────────────────────────

export type ResolutionCategory =
  | "Gateway Delay (auto-resolved)"
  | "Manual Refund Issued"
  | "Booking Corrected"
  | "Duplicate Reversed"
  | "False Positive"
  | "Other";

export const ALL_RESOLUTION_CATEGORIES: ResolutionCategory[] = [
  "Gateway Delay (auto-resolved)",
  "Manual Refund Issued",
  "Booking Corrected",
  "Duplicate Reversed",
  "False Positive",
  "Other",
];

// ─── Mismatch Entry ──────────────────────────────────────────────────────────

export interface ReconciliationMismatch {
  id: string;
  bookingId: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  gatewayReference: string;
  mismatchType: MismatchType;
  detectedAt: Date;
  status: MismatchStatus;
  // Resolution fields (populated when status is Resolved)
  resolutionCategory?: ResolutionCategory;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  // Acknowledged info
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// ─── Mock Helpers ────────────────────────────────────────────────────────────

const BASE = new Date(2026, 2, 11, 10, 0, 0); // March 11, 2026 10:00 UTC
function ago(minutes: number) {
  return new Date(BASE.getTime() - minutes * 60_000);
}

export const LAST_CRON_RUN = ago(15); // 15 minutes ago

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_MISMATCHES: ReconciliationMismatch[] = [
  {
    id: "REC-001",
    bookingId: "BK-80234",
    expectedAmount: 350.00,
    actualAmount: 300.00,
    difference: -50.00,
    gatewayReference: "MF-TXN-98765",
    mismatchType: "Amount Mismatch",
    detectedAt: ago(30),
    status: "Unresolved",
  },
  {
    id: "REC-002",
    bookingId: "BK-80198",
    expectedAmount: 500.00,
    actualAmount: 0,
    difference: -500.00,
    gatewayReference: "MF-TXN-98740",
    mismatchType: "Missing Payment",
    detectedAt: ago(90),
    status: "Unresolved",
  },
  {
    id: "REC-003",
    bookingId: "BK-80156",
    expectedAmount: 200.00,
    actualAmount: 400.00,
    difference: 200.00,
    gatewayReference: "MF-TXN-98712",
    mismatchType: "Duplicate Charge",
    detectedAt: ago(150),
    status: "Unresolved",
  },
  {
    id: "REC-004",
    bookingId: "BK-80120",
    expectedAmount: 180.00,
    actualAmount: 180.00,
    difference: 0,
    gatewayReference: "MF-TXN-98690",
    mismatchType: "Status Inconsistency",
    detectedAt: ago(210),
    status: "Acknowledged",
    acknowledgedBy: "Omar Fadel",
    acknowledgedAt: ago(180),
  },
  {
    id: "REC-005",
    bookingId: "BK-80089",
    expectedAmount: 750.00,
    actualAmount: 750.00,
    difference: 0,
    gatewayReference: "MF-TXN-98665",
    mismatchType: "Pending Timeout",
    detectedAt: ago(300),
    status: "Acknowledged",
    acknowledgedBy: "Layla Abbas",
    acknowledgedAt: ago(250),
  },
  {
    id: "REC-006",
    bookingId: "BK-80045",
    expectedAmount: 420.00,
    actualAmount: 370.00,
    difference: -50.00,
    gatewayReference: "MF-TXN-98632",
    mismatchType: "Amount Mismatch",
    detectedAt: ago(480),
    status: "Resolved",
    resolutionCategory: "Manual Refund Issued",
    resolutionNotes: "Customer was charged SAR 370 instead of SAR 420 due to a promotional discount that was not reflected in the booking record. Booking record updated to match the actual charged amount. No refund needed.",
    resolvedBy: "Sarah Johnson",
    resolvedAt: ago(360),
  },
  {
    id: "REC-007",
    bookingId: "BK-79998",
    expectedAmount: 275.00,
    actualAmount: 275.00,
    difference: 0,
    gatewayReference: "MF-TXN-98600",
    mismatchType: "Pending Timeout",
    detectedAt: ago(600),
    status: "Resolved",
    resolutionCategory: "Gateway Delay (auto-resolved)",
    resolutionNotes: "Auto-resolved by reconciliation cron on 2026-03-10T08:00:00Z. Payment was confirmed by MyFatoorah after a 26-hour delay.",
    resolvedBy: "System",
    resolvedAt: ago(540),
  },
  {
    id: "REC-008",
    bookingId: "BK-79956",
    expectedAmount: 600.00,
    actualAmount: 1200.00,
    difference: 600.00,
    gatewayReference: "MF-TXN-98578",
    mismatchType: "Duplicate Charge",
    detectedAt: ago(720),
    status: "Resolved",
    resolutionCategory: "Duplicate Reversed",
    resolutionNotes: "Customer was charged twice for the same booking. Second charge of SAR 600 reversed via MyFatoorah refund API. Refund reference: MF-REF-44521. Customer notified via email.",
    resolvedBy: "Omar Fadel",
    resolvedAt: ago(660),
  },
  {
    id: "REC-009",
    bookingId: "BK-79912",
    expectedAmount: 150.00,
    actualAmount: 150.00,
    difference: 0,
    gatewayReference: "MF-TXN-98550",
    mismatchType: "Status Inconsistency",
    detectedAt: ago(840),
    status: "Resolved",
    resolutionCategory: "False Positive",
    resolutionNotes: "Gateway webhook arrived out of order, causing temporary status mismatch. Status was corrected by the next webhook. No action needed.",
    resolvedBy: "Khalid Al-Rashid",
    resolvedAt: ago(800),
  },
  {
    id: "REC-010",
    bookingId: "BK-79880",
    expectedAmount: 320.00,
    actualAmount: 290.00,
    difference: -30.00,
    gatewayReference: "MF-TXN-98525",
    mismatchType: "Amount Mismatch",
    detectedAt: ago(960),
    status: "Resolved",
    resolutionCategory: "Booking Corrected",
    resolutionNotes: "Booking amount was incorrectly calculated due to a promo code application error. Booking record corrected to SAR 290 to match the actual charge. Promo code logic bug reported to engineering (JIRA-4521).",
    resolvedBy: "David Chen",
    resolvedAt: ago(900),
  },
  {
    id: "REC-011",
    bookingId: "BK-80250",
    expectedAmount: 450.00,
    actualAmount: 0,
    difference: -450.00,
    gatewayReference: "MF-TXN-98780",
    mismatchType: "Missing Payment",
    detectedAt: ago(60),
    status: "Unresolved",
  },
  {
    id: "REC-012",
    bookingId: "BK-80267",
    expectedAmount: 225.00,
    actualAmount: 225.00,
    difference: 0,
    gatewayReference: "MF-TXN-98795",
    mismatchType: "Pending Timeout",
    detectedAt: ago(45),
    status: "Unresolved",
  },
];
