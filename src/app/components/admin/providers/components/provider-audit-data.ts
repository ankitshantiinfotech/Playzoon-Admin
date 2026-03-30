// ─── US-5.4.1 — Provider Audit Trail Types & Mock Data ───────
// Field-level change entries for provider audit trail.
// Each row = one field changed by one admin at one time.

export type AuditActionType =
  | "Create"
  | "Update"
  | "Delete"
  | "Status Change"
  | "Approval"
  | "Rejection";

export interface ProviderAuditEntry {
  id: string;
  /** Provider this audit entry belongs to */
  providerId: string;
  providerName: string;
  /** Admin / system user who performed the action */
  editedBy: string;
  /** Exact field name that was changed */
  fieldName: string;
  /** Previous value ('N/A' for new entries) */
  oldValue: string;
  /** Updated value after change */
  newValue: string;
  /** When the change occurred */
  dateTime: Date;
  /** Type of action */
  actionType: AuditActionType;
}

// ─── Style config for action type badges ─────────────────────

export const ACTION_TYPE_STYLES: Record<
  AuditActionType,
  { bg: string; text: string; border: string }
> = {
  Create:        { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Update:        { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  Delete:        { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200" },
  "Status Change": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Approval:      { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200" },
  Rejection:     { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200" },
};

export const ALL_ACTION_TYPES: AuditActionType[] = [
  "Create", "Update", "Delete", "Status Change", "Approval", "Rejection",
];

// ─── Mock date helper ────────────────────────────────────────

const NOW = new Date(2026, 1, 21, 14, 30, 0); // Feb 21, 2026 14:30
function ago(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60_000);
}

// ─── Admin names pool ────────────────────────────────────────

const ADMINS = [
  "Khalid Al-Rashid",
  "Sarah Johnson",
  "Omar Fadel",
  "Layla Abbas",
  "David Chen",
  "System",
];

// ─── Field names pool ────────────────────────────────────────

export const ALL_FIELD_NAMES = [
  "Club Name",
  "Email",
  "Mobile",
  "Verification Status",
  "Account Status",
  "Platform Status",
  "Commission %",
  "Effective Date",
  "Bank Approval Status",
  "Profile Photo",
  "Trade License",
  "First Name",
  "Last Name",
  "Sport Category",
  "City",
  "Description",
  "Landline",
  "Operating Hours",
  "Price",
  "Coach Assignment",
  "Facility Assignment",
];

// ─── Mock audit data for all providers ───────────────────────
// Rich set of entries covering all action types, varied providers

export const MOCK_PROVIDER_AUDIT: ProviderAuditEntry[] = [
  // ── Provider TP-001 — several changes ──────────────
  {
    id: "PA-0001", providerId: "TP-001", providerName: "Champions Academy",
    editedBy: "Khalid Al-Rashid", fieldName: "Club Name",
    oldValue: "Champions Sports", newValue: "Champions Academy",
    dateTime: ago(5), actionType: "Update",
  },
  {
    id: "PA-0002", providerId: "TP-001", providerName: "Champions Academy",
    editedBy: "Khalid Al-Rashid", fieldName: "Email",
    oldValue: "info@championssports.ae", newValue: "info@championsacademy.ae",
    dateTime: ago(5), actionType: "Update",
  },
  {
    id: "PA-0003", providerId: "TP-001", providerName: "Champions Academy",
    editedBy: "Sarah Johnson", fieldName: "Verification Status",
    oldValue: "Pending", newValue: "Approved",
    dateTime: ago(45), actionType: "Approval",
  },
  {
    id: "PA-0004", providerId: "TP-001", providerName: "Champions Academy",
    editedBy: "System", fieldName: "Commission %",
    oldValue: "10.00%", newValue: "12.50%",
    dateTime: ago(120), actionType: "Update",
  },
  {
    id: "PA-0005", providerId: "TP-001", providerName: "Champions Academy",
    editedBy: "Omar Fadel", fieldName: "Platform Status",
    oldValue: "Inactive", newValue: "Active",
    dateTime: ago(180), actionType: "Status Change",
  },

  // ── Provider TP-002 ────────────────────────────────
  {
    id: "PA-0006", providerId: "TP-002", providerName: "Al Noor Training Center",
    editedBy: "Layla Abbas", fieldName: "Verification Status",
    oldValue: "Approved", newValue: "Rejected",
    dateTime: ago(10), actionType: "Rejection",
  },
  {
    id: "PA-0007", providerId: "TP-002", providerName: "Al Noor Training Center",
    editedBy: "Layla Abbas", fieldName: "Account Status",
    oldValue: "Unlocked", newValue: "Locked",
    dateTime: ago(10), actionType: "Status Change",
  },
  {
    id: "PA-0008", providerId: "TP-002", providerName: "Al Noor Training Center",
    editedBy: "David Chen", fieldName: "Sport Category",
    oldValue: "Football", newValue: "Football, Tennis",
    dateTime: ago(200), actionType: "Update",
  },

  // ── Provider FP-001 — Facility ─────────────────────
  {
    id: "PA-0009", providerId: "FP-001", providerName: "Dubai Sports Arena",
    editedBy: "Sarah Johnson", fieldName: "Operating Hours",
    oldValue: "06:00 – 22:00", newValue: "06:00 – 00:00",
    dateTime: ago(15), actionType: "Update",
  },
  {
    id: "PA-0010", providerId: "FP-001", providerName: "Dubai Sports Arena",
    editedBy: "Khalid Al-Rashid", fieldName: "Bank Approval Status",
    oldValue: "Pending", newValue: "Approved",
    dateTime: ago(60), actionType: "Approval",
  },
  {
    id: "PA-0011", providerId: "FP-001", providerName: "Dubai Sports Arena",
    editedBy: "Omar Fadel", fieldName: "Commission %",
    oldValue: "15.00%", newValue: "12.50%",
    dateTime: ago(90), actionType: "Update",
  },
  {
    id: "PA-0012", providerId: "FP-001", providerName: "Dubai Sports Arena",
    editedBy: "System", fieldName: "Club Name",
    oldValue: "N/A", newValue: "Dubai Sports Arena",
    dateTime: ago(1440), actionType: "Create",
  },
  {
    id: "PA-0013", providerId: "FP-001", providerName: "Dubai Sports Arena",
    editedBy: "System", fieldName: "Email",
    oldValue: "N/A", newValue: "info@dubaisportsarena.ae",
    dateTime: ago(1440), actionType: "Create",
  },
  {
    id: "PA-0014", providerId: "FP-001", providerName: "Dubai Sports Arena",
    editedBy: "System", fieldName: "Mobile",
    oldValue: "N/A", newValue: "+971 50 123 4567",
    dateTime: ago(1440), actionType: "Create",
  },

  // ── Provider CO-001 — Coach ────────────────────────
  {
    id: "PA-0015", providerId: "CO-001", providerName: "Coach Ahmad Youssef",
    editedBy: "David Chen", fieldName: "Price",
    oldValue: "150 AED/hr", newValue: "180 AED/hr",
    dateTime: ago(20), actionType: "Update",
  },
  {
    id: "PA-0016", providerId: "CO-001", providerName: "Coach Ahmad Youssef",
    editedBy: "Sarah Johnson", fieldName: "Verification Status",
    oldValue: "Pending", newValue: "Approved",
    dateTime: ago(300), actionType: "Approval",
  },
  {
    id: "PA-0017", providerId: "CO-001", providerName: "Coach Ahmad Youssef",
    editedBy: "Sarah Johnson", fieldName: "Platform Status",
    oldValue: "Inactive", newValue: "Active",
    dateTime: ago(300), actionType: "Status Change",
  },

  // ── Provider TP-003 ────────────────────────────────
  {
    id: "PA-0018", providerId: "TP-003", providerName: "Gulf Sports Academy",
    editedBy: "Khalid Al-Rashid", fieldName: "Trade License",
    oldValue: "TL-2024-001.pdf", newValue: "TL-2026-001.pdf",
    dateTime: ago(25), actionType: "Update",
  },
  {
    id: "PA-0019", providerId: "TP-003", providerName: "Gulf Sports Academy",
    editedBy: "Khalid Al-Rashid", fieldName: "Description",
    oldValue: "Premier sports training center in Dubai",
    newValue: "UAE's leading multi-sport training academy with world-class facilities",
    dateTime: ago(25), actionType: "Update",
  },
  {
    id: "PA-0020", providerId: "TP-003", providerName: "Gulf Sports Academy",
    editedBy: "System", fieldName: "Account Status",
    oldValue: "Locked", newValue: "Unlocked",
    dateTime: ago(500), actionType: "Status Change",
  },

  // ── Provider FP-002 ────────────────────────────────
  {
    id: "PA-0021", providerId: "FP-002", providerName: "Sharjah Sports Complex",
    editedBy: "Omar Fadel", fieldName: "Facility Assignment",
    oldValue: "N/A", newValue: "Indoor Court A, Indoor Court B",
    dateTime: ago(30), actionType: "Update",
  },
  {
    id: "PA-0022", providerId: "FP-002", providerName: "Sharjah Sports Complex",
    editedBy: "Layla Abbas", fieldName: "Verification Status",
    oldValue: "Pending", newValue: "Approved",
    dateTime: ago(350), actionType: "Approval",
  },

  // ── Provider CO-002 — Coach ────────────────────────
  {
    id: "PA-0023", providerId: "CO-002", providerName: "Coach Fatima Hassan",
    editedBy: "David Chen", fieldName: "Coach Assignment",
    oldValue: "Gulf Sports Academy", newValue: "Champions Academy",
    dateTime: ago(35), actionType: "Update",
  },
  {
    id: "PA-0024", providerId: "CO-002", providerName: "Coach Fatima Hassan",
    editedBy: "Sarah Johnson", fieldName: "Verification Status",
    oldValue: "Approved", newValue: "Rejected",
    dateTime: ago(40), actionType: "Rejection",
  },
  {
    id: "PA-0025", providerId: "CO-002", providerName: "Coach Fatima Hassan",
    editedBy: "Sarah Johnson", fieldName: "Account Status",
    oldValue: "Unlocked", newValue: "Locked",
    dateTime: ago(40), actionType: "Status Change",
  },

  // ── Provider TP-004 ────────────────────────────────
  {
    id: "PA-0026", providerId: "TP-004", providerName: "Emirates Athletic Club",
    editedBy: "Omar Fadel", fieldName: "Commission %",
    oldValue: "8.00%", newValue: "10.00%",
    dateTime: ago(50), actionType: "Update",
  },
  {
    id: "PA-0027", providerId: "TP-004", providerName: "Emirates Athletic Club",
    editedBy: "Khalid Al-Rashid", fieldName: "Landline",
    oldValue: "+971 4 300 1234", newValue: "+971 4 300 5678",
    dateTime: ago(55), actionType: "Update",
  },

  // ── Provider FP-003 ────────────────────────────────
  {
    id: "PA-0028", providerId: "FP-003", providerName: "RAK Sports Village",
    editedBy: "Layla Abbas", fieldName: "City",
    oldValue: "Dubai", newValue: "Ras Al Khaimah",
    dateTime: ago(70), actionType: "Update",
  },
  {
    id: "PA-0029", providerId: "FP-003", providerName: "RAK Sports Village",
    editedBy: "Layla Abbas", fieldName: "First Name",
    oldValue: "Rashid", newValue: "Rashid Ahmad",
    dateTime: ago(70), actionType: "Update",
  },

  // ── Provider CO-003 ────────────────────────────────
  {
    id: "PA-0030", providerId: "CO-003", providerName: "Coach Ali Mahmoud",
    editedBy: "David Chen", fieldName: "Profile Photo",
    oldValue: "avatar_old.jpg", newValue: "avatar_2026.jpg",
    dateTime: ago(75), actionType: "Update",
  },
  {
    id: "PA-0031", providerId: "CO-003", providerName: "Coach Ali Mahmoud",
    editedBy: "System", fieldName: "Last Name",
    oldValue: "N/A", newValue: "Mahmoud",
    dateTime: ago(2880), actionType: "Create",
  },

  // ── Provider TP-005 ────────────────────────────────
  {
    id: "PA-0032", providerId: "TP-005", providerName: "Falcon Fitness Hub",
    editedBy: "Sarah Johnson", fieldName: "Verification Status",
    oldValue: "Pending", newValue: "Approved",
    dateTime: ago(100), actionType: "Approval",
  },
  {
    id: "PA-0033", providerId: "TP-005", providerName: "Falcon Fitness Hub",
    editedBy: "Sarah Johnson", fieldName: "Platform Status",
    oldValue: "Inactive", newValue: "Active",
    dateTime: ago(100), actionType: "Status Change",
  },
  {
    id: "PA-0034", providerId: "TP-005", providerName: "Falcon Fitness Hub",
    editedBy: "Omar Fadel", fieldName: "Effective Date",
    oldValue: "01/01/2026", newValue: "01/03/2026",
    dateTime: ago(110), actionType: "Update",
  },

  // ── Deletions ──────────────────────────────────────
  {
    id: "PA-0035", providerId: "TP-006", providerName: "Inactive Sports Co.",
    editedBy: "Khalid Al-Rashid", fieldName: "Account Status",
    oldValue: "Active", newValue: "Deleted",
    dateTime: ago(150), actionType: "Delete",
  },

  // ── More varied entries ────────────────────────────
  {
    id: "PA-0036", providerId: "FP-004", providerName: "Abu Dhabi Sports Hub",
    editedBy: "System", fieldName: "Club Name",
    oldValue: "N/A", newValue: "Abu Dhabi Sports Hub",
    dateTime: ago(4320), actionType: "Create",
  },
  {
    id: "PA-0037", providerId: "FP-004", providerName: "Abu Dhabi Sports Hub",
    editedBy: "System", fieldName: "Email",
    oldValue: "N/A", newValue: "admin@adsportshub.ae",
    dateTime: ago(4320), actionType: "Create",
  },
  {
    id: "PA-0038", providerId: "FP-004", providerName: "Abu Dhabi Sports Hub",
    editedBy: "System", fieldName: "Mobile",
    oldValue: "N/A", newValue: "+971 52 456 7890",
    dateTime: ago(4320), actionType: "Create",
  },
  {
    id: "PA-0039", providerId: "FP-004", providerName: "Abu Dhabi Sports Hub",
    editedBy: "David Chen", fieldName: "Bank Approval Status",
    oldValue: "Pending", newValue: "Rejected",
    dateTime: ago(160), actionType: "Rejection",
  },
  {
    id: "PA-0040", providerId: "CO-004", providerName: "Coach Mariam Al Blooshi",
    editedBy: "Layla Abbas", fieldName: "Sport Category",
    oldValue: "Swimming", newValue: "Swimming, Aqua Fitness",
    dateTime: ago(170), actionType: "Update",
  },
  {
    id: "PA-0041", providerId: "CO-004", providerName: "Coach Mariam Al Blooshi",
    editedBy: "Sarah Johnson", fieldName: "Verification Status",
    oldValue: "Pending", newValue: "Approved",
    dateTime: ago(400), actionType: "Approval",
  },
  {
    id: "PA-0042", providerId: "TP-007", providerName: "Peak Performance Center",
    editedBy: "Omar Fadel", fieldName: "Commission %",
    oldValue: "0.00%", newValue: "15.00%",
    dateTime: ago(190), actionType: "Update",
  },
  {
    id: "PA-0043", providerId: "TP-007", providerName: "Peak Performance Center",
    editedBy: "Khalid Al-Rashid", fieldName: "Account Status",
    oldValue: "Locked", newValue: "Unlocked",
    dateTime: ago(600), actionType: "Status Change",
  },
  {
    id: "PA-0044", providerId: "FP-005", providerName: "Marina Beach Club",
    editedBy: "David Chen", fieldName: "Operating Hours",
    oldValue: "08:00 – 20:00", newValue: "06:00 – 23:00",
    dateTime: ago(210), actionType: "Update",
  },
  {
    id: "PA-0045", providerId: "FP-005", providerName: "Marina Beach Club",
    editedBy: "Layla Abbas", fieldName: "Description",
    oldValue: "Beachside sports club",
    newValue: "Premium beachside sports & recreation club with full amenities",
    dateTime: ago(210), actionType: "Update",
  },
];

// ─── Helper: get entries filtered by provider ────────────────

export function getProviderAuditEntries(providerId: string): ProviderAuditEntry[] {
  return MOCK_PROVIDER_AUDIT
    .filter(e => e.providerId === providerId)
    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
}

// ─── Helper: get unique editors across all entries ───────────

export function getUniqueEditors(entries: ProviderAuditEntry[]): string[] {
  return Array.from(new Set(entries.map(e => e.editedBy))).sort();
}

// ─── Helper: get unique field names across entries ───────────

export function getUniqueFieldNames(entries: ProviderAuditEntry[]): string[] {
  return Array.from(new Set(entries.map(e => e.fieldName))).sort();
}
