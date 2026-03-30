// ─── US-125: Bank Account Verification — Types ───────────────

export type BVProviderType = "Training Provider" | "Facility Provider" | "Freelancer Coach";
export type BVStatus       = "Pending" | "Approved" | "Rejected" | "Revoked";

// ─── History entry (BR-125-05: resubmission chain) ───────────

export type BVHistoryEvent = "Submitted" | "Approved" | "Rejected" | "Revoked" | "Revocation Requested" | "Note Added";

export interface BVHistoryEntry {
  id: string;
  event: BVHistoryEvent;
  actor: string;
  timestamp: Date;
  reason?: string;          // Rejection reason
  note?: string;            // Admin note text
}

// ─── Supporting document ─────────────────────────────────────

export interface BVDocument {
  id: string;
  name: string;
  type: "pdf" | "image";
  url: string;
  size: string;
  uploadedAt: Date;
}

// ─── Main record ─────────────────────────────────────────────

export interface BankVerification {
  id: string;               // BV-YYYYMMDD-NNN

  // Provider
  providerId: string;
  providerName: string;
  providerType: BVProviderType;
  providerEmail: string;
  providerAvatar: string;

  providerPhone?: string;
  providerRegistrationDate?: Date;
  providerStatus?: "Active" | "Inactive" | "Pending" | "Locked";

  // Bank details (BR-125-06: full IBAN in detail only)
  accountHolderName: string;
  bankName: string;
  bankCountry: string;
  ibanFull: string;         // Full — detail view only
  ibanMasked: string;       // Last 4 digits visible in list
  swiftCode?: string;
  accountNumber?: string;   // Where IBAN not used
  submissionNotes?: string; // Optional notes from the provider

  // Document
  document?: BVDocument;    // Optional supporting doc
  documents?: BVDocument[]; // Multiple supporting docs for SCR-ADM-030

  // Status & audit
  status: BVStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  revocationReason?: string;
  revocationPending?: boolean;
  adminNotes: string;

  // Resubmission chain (BR-125-05)
  isResubmission: boolean;
  previousVerificationId?: string;  // Links to the rejected record
  history: BVHistoryEntry[];
}

// ─── Style maps ──────────────────────────────────────────────

export const BV_STATUS_STYLES: Record<BVStatus, { bg: string; text: string; dot: string; border: string }> = {
  Pending:  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   border: "border-amber-200"  },
  Approved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  Rejected: { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     border: "border-red-200"    },
  Revoked:  { bg: "bg-gray-50",    text: "text-gray-600",    dot: "bg-gray-400",    border: "border-gray-200"   },
};

export const BV_PROVIDER_TYPE_STYLES: Record<BVProviderType, { bg: string; text: string; border: string; abbr: string }> = {
  "Training Provider": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", abbr: "TP" },
  "Facility Provider": { bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200",    abbr: "FP" },
  "Freelancer Coach":  { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200",   abbr: "FC" },
};

export const BV_HISTORY_EVENT_STYLES: Record<BVHistoryEvent, { dot: string; text: string }> = {
  Submitted:             { dot: "bg-blue-500",    text: "text-blue-700"    },
  Approved:              { dot: "bg-emerald-500", text: "text-emerald-700" },
  Rejected:              { dot: "bg-red-500",     text: "text-red-700"     },
  Revoked:               { dot: "bg-gray-500",    text: "text-gray-700"    },
  "Revocation Requested": { dot: "bg-orange-500", text: "text-orange-700"  },
  "Note Added":          { dot: "bg-amber-400",   text: "text-amber-700"   },
};

// ─── IBAN display helpers ─────────────────────────────────────

/** Format a raw IBAN string with spaces every 4 chars */
export function formatIBAN(iban: string): string {
  return iban.replace(/\s/g, "").match(/.{1,4}/g)?.join(" ") ?? iban;
}

/** Return the masked version showing only last 4 of clean IBAN */
export function buildMaskedIBAN(ibanFull: string): string {
  const clean = ibanFull.replace(/\s/g, "");
  const last4 = clean.slice(-4);
  // Keep country code visible, mask the rest
  return `${clean.slice(0, 2)}•• •••• •••• •••• ••${last4}`;
}

// ─── Quick-resolve helpers ────────────────────────────────────

export function canApprove(v: BankVerification) { return v.status === "Pending"; }
export function canReject(v: BankVerification)  { return v.status === "Pending"; }
