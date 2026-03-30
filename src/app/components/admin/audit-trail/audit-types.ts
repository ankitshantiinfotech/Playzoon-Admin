// ─── SCR-ADM-037: Audit Trail Types & Mock Data ──────────────────────────────

// ─── Action Types ────────────────────────────────────────────────────────────

export type AuditAction =
  | "Created"
  | "Updated"
  | "Deleted"
  | "Approved"
  | "Rejected"
  | "Activated"
  | "Deactivated"
  | "Locked"
  | "Unlocked"
  | "Login"
  | "Logout"
  | "Export"
  | "Settings Changed"
  | "Payout Action"
  | "Wallet Adjustment"
  | "Commission Change"
  | "Revoked";

export const ALL_ACTIONS: AuditAction[] = [
  "Created",
  "Updated",
  "Deleted",
  "Approved",
  "Rejected",
  "Activated",
  "Deactivated",
  "Locked",
  "Unlocked",
  "Login",
  "Logout",
  "Export",
  "Settings Changed",
  "Payout Action",
  "Wallet Adjustment",
  "Commission Change",
  "Revoked",
];

// ─── Entity Types ────────────────────────────────────────────────────────────

export type AuditEntityType =
  | "Player"
  | "Facility Provider"
  | "Training Provider"
  | "Coach"
  | "Booking"
  | "Tournament"
  | "Training Program"
  | "Facility"
  | "Bank Account"
  | "Payout"
  | "Commission Rule"
  | "Promotion"
  | "Review"
  | "Notification"
  | "Settings"
  | "Sub-Admin"
  | "CMS Content"
  | "Wallet"
  | "Country Config";

export const ALL_ENTITY_TYPES: AuditEntityType[] = [
  "Player",
  "Facility Provider",
  "Training Provider",
  "Coach",
  "Booking",
  "Tournament",
  "Training Program",
  "Facility",
  "Bank Account",
  "Payout",
  "Commission Rule",
  "Promotion",
  "Review",
  "Notification",
  "Settings",
  "Sub-Admin",
  "CMS Content",
  "Wallet",
  "Country Config",
];

// ─── Audit Log Entry ─────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  adminUser: string;
  adminEmail: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityDeleted?: boolean;
  details: string;
  ipAddress: string;
}

// ─── Style Maps ──────────────────────────────────────────────────────────────

export type ActionCategory = "success" | "info" | "error" | "neutral";

export function getActionCategory(action: AuditAction): ActionCategory {
  switch (action) {
    case "Created":
    case "Approved":
    case "Activated":
      return "success";
    case "Updated":
    case "Settings Changed":
      return "info";
    case "Deleted":
    case "Rejected":
    case "Deactivated":
    case "Locked":
    case "Revoked":
      return "error";
    case "Login":
    case "Logout":
    case "Export":
    case "Payout Action":
    case "Wallet Adjustment":
    case "Commission Change":
    case "Unlocked":
    default:
      return "neutral";
  }
}

export const ACTION_BADGE_STYLES: Record<ActionCategory, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  error: "bg-red-50 text-red-600 border-red-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
};

// ─── Admin Users for Filter ──────────────────────────────────────────────────

export const ADMIN_USERS = [
  { name: "Khalid Al-Rashid", email: "khalid@playzoon.com" },
  { name: "Sarah Johnson", email: "sarah@playzoon.com" },
  { name: "Omar Fadel", email: "omar@playzoon.com" },
  { name: "Layla Abbas", email: "layla@playzoon.com" },
  { name: "David Chen", email: "david@playzoon.com" },
  { name: "Noura Al-Hashimi", email: "noura@playzoon.com" },
];

// ─── Mock Helpers ────────────────────────────────────────────────────────────

const BASE = new Date(2026, 2, 10, 16, 0, 0); // March 10, 2026
function ago(minutes: number) {
  return new Date(BASE.getTime() - minutes * 60_000);
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "AUD-10001",
    timestamp: ago(12),
    adminUser: "Khalid Al-Rashid",
    adminEmail: "khalid@playzoon.com",
    action: "Approved",
    entityType: "Facility Provider",
    entityId: "PRV-0891",
    details: "Provider application approved. Business license and trade documents verified. Status: Pending -> Active",
    ipAddress: "10.0.1.45",
  },
  {
    id: "AUD-10002",
    timestamp: ago(28),
    adminUser: "Sarah Johnson",
    adminEmail: "sarah@playzoon.com",
    action: "Deactivated",
    entityType: "Player",
    entityId: "PLR-4521",
    details: "Player account deactivated due to repeated policy violations. Active -> Deactivated. Reason: Harassment reports (3 confirmed incidents)",
    ipAddress: "10.0.1.22",
  },
  {
    id: "AUD-10003",
    timestamp: ago(45),
    adminUser: "Omar Fadel",
    adminEmail: "omar@playzoon.com",
    action: "Payout Action",
    entityType: "Payout",
    entityId: "PAY-7823",
    details: "Payout request approved and marked for processing. Amount: SAR 12,500.00. Provider: Desert Sports Complex. Pending -> Processing",
    ipAddress: "10.0.1.33",
  },
  {
    id: "AUD-10004",
    timestamp: ago(67),
    adminUser: "Layla Abbas",
    adminEmail: "layla@playzoon.com",
    action: "Rejected",
    entityType: "Bank Account",
    entityId: "BNK-0234",
    details: "Bank verification rejected. Reason: Account holder name does not match provider registration name. Provider notified via email.",
    ipAddress: "10.0.1.41",
  },
  {
    id: "AUD-10005",
    timestamp: ago(92),
    adminUser: "Khalid Al-Rashid",
    adminEmail: "khalid@playzoon.com",
    action: "Settings Changed",
    entityType: "Settings",
    entityId: "CFG-COMMISSION",
    details: "commission_rate: 12.5% -> 15.0%. Effective from: 2026-03-01. Applies to all new bookings.",
    ipAddress: "10.0.1.45",
  },
  {
    id: "AUD-10006",
    timestamp: ago(118),
    adminUser: "David Chen",
    adminEmail: "david@playzoon.com",
    action: "Created",
    entityType: "Tournament",
    entityId: "TRN-0056",
    details: "Created tournament: Riyadh Football Championship 2026. Start: 2026-04-15. Max teams: 32. Entry fee: SAR 2,500.",
    ipAddress: "10.0.1.55",
  },
  {
    id: "AUD-10007",
    timestamp: ago(145),
    adminUser: "Sarah Johnson",
    adminEmail: "sarah@playzoon.com",
    action: "Updated",
    entityType: "CMS Content",
    entityId: "CMS-PRIVACY",
    details: "Privacy Policy updated to v5. Added GDPR addendum section. Published immediately. Version: 4 -> 5",
    ipAddress: "10.0.1.22",
  },
  {
    id: "AUD-10008",
    timestamp: ago(172),
    adminUser: "Omar Fadel",
    adminEmail: "omar@playzoon.com",
    action: "Commission Change",
    entityType: "Commission Rule",
    entityId: "CMR-0012",
    details: "Facility provider commission adjusted. Old rate: 12%. New rate: 10%. Reason: Volume-based discount tier reached. Effective: 2026-03-01",
    ipAddress: "10.0.1.33",
  },
  {
    id: "AUD-10009",
    timestamp: ago(195),
    adminUser: "Khalid Al-Rashid",
    adminEmail: "khalid@playzoon.com",
    action: "Locked",
    entityType: "Training Provider",
    entityId: "PRV-0567",
    details: "Provider account locked. 3rd warning issued. Reason: Quality score dropped below minimum (2.1/5.0). Suspension until: 2026-02-25",
    ipAddress: "10.0.1.45",
  },
  {
    id: "AUD-10010",
    timestamp: ago(220),
    adminUser: "Layla Abbas",
    adminEmail: "layla@playzoon.com",
    action: "Wallet Adjustment",
    entityType: "Wallet",
    entityId: "WLT-8899",
    details: "Manual wallet adjustment. Balance: SAR 500.00 -> SAR 0.00. Reason: Refund to original payment card per customer request. Reference: SUP-4423",
    ipAddress: "10.0.1.41",
  },
  {
    id: "AUD-10011",
    timestamp: ago(248),
    adminUser: "Khalid Al-Rashid",
    adminEmail: "khalid@playzoon.com",
    action: "Deleted",
    entityType: "Facility Provider",
    entityId: "PRV-0890",
    entityDeleted: true,
    details: "Provider permanently removed. Reason: Confirmed fraud - fake facility photos and nonexistent address. All pending bookings cancelled and refunded.",
    ipAddress: "10.0.1.45",
  },
  {
    id: "AUD-10012",
    timestamp: ago(280),
    adminUser: "Sarah Johnson",
    adminEmail: "sarah@playzoon.com",
    action: "Activated",
    entityType: "Player",
    entityId: "PLR-6789",
    details: "Player account reactivated after appeal review. Suspension lifted. Previous status: Suspended -> Active",
    ipAddress: "10.0.1.22",
  },
  {
    id: "AUD-10013",
    timestamp: ago(310),
    adminUser: "Noura Al-Hashimi",
    adminEmail: "noura@playzoon.com",
    action: "Updated",
    entityType: "Review",
    entityId: "REV-3344",
    details: "Review flagged and hidden. Status: Published -> Hidden. Reason: Under investigation, linked to complaint ENQ-2396",
    ipAddress: "10.0.1.60",
  },
  {
    id: "AUD-10014",
    timestamp: ago(340),
    adminUser: "David Chen",
    adminEmail: "david@playzoon.com",
    action: "Created",
    entityType: "Promotion",
    entityId: "PROMO-RAMADAN50",
    details: "Created promotion code RAMADAN50. Type: 50% percentage discount. Max cap: SAR 100.00. Valid: 2026-03-01 to 2026-03-30. Usage limit: 500",
    ipAddress: "10.0.1.55",
  },
  {
    id: "AUD-10015",
    timestamp: ago(375),
    adminUser: "Khalid Al-Rashid",
    adminEmail: "khalid@playzoon.com",
    action: "Created",
    entityType: "Sub-Admin",
    entityId: "ADM-008",
    details: "New sub-admin account created: Noura Al-Hashimi (noura@playzoon.com). Assigned modules: Enquiries, Reviews. Permissions: read:all, write:enquiries, write:reviews",
    ipAddress: "10.0.1.45",
  },
  {
    id: "AUD-10016",
    timestamp: ago(400),
    adminUser: "Omar Fadel",
    adminEmail: "omar@playzoon.com",
    action: "Payout Action",
    entityType: "Payout",
    entityId: "PAY-7810",
    details: "Payout rejected. Amount: SAR 8,750.00. Provider: Gulf Tennis Center. Reason: Bank account verification pending. Provider must resubmit bank details.",
    ipAddress: "10.0.1.33",
  },
  {
    id: "AUD-10017",
    timestamp: ago(430),
    adminUser: "Sarah Johnson",
    adminEmail: "sarah@playzoon.com",
    action: "Approved",
    entityType: "Coach",
    entityId: "COA-0089",
    details: "Coach profile approved and verified. Documents: coaching certificate, background check - all approved. Status: Pending -> Verified",
    ipAddress: "10.0.1.22",
  },
  {
    id: "AUD-10018",
    timestamp: ago(465),
    adminUser: "David Chen",
    adminEmail: "david@playzoon.com",
    action: "Updated",
    entityType: "Facility",
    entityId: "FAC-0234",
    details: "Facility operating hours updated. Ramadan hours set: Weekday 06:00-01:00, Weekend 06:00-02:00. Facility: Desert Padel Club",
    ipAddress: "10.0.1.55",
  },
  {
    id: "AUD-10019",
    timestamp: ago(500),
    adminUser: "Khalid Al-Rashid",
    adminEmail: "khalid@playzoon.com",
    action: "Settings Changed",
    entityType: "Settings",
    entityId: "CFG-CANCEL-POLICY",
    details: "cancellation_window_hours: 24 -> 12. refund_percentage_outside_window: 0% -> 50%. More lenient cancellation policy effective immediately.",
    ipAddress: "10.0.1.45",
  },
  {
    id: "AUD-10020",
    timestamp: ago(530),
    adminUser: "Layla Abbas",
    adminEmail: "layla@playzoon.com",
    action: "Approved",
    entityType: "Bank Account",
    entityId: "BNK-0256",
    details: "Bank account verification approved. IBAN verified. Account holder: Desert Sports LLC. Bank: Al Rajhi Bank. Status: Pending -> Verified",
    ipAddress: "10.0.1.41",
  },
  {
    id: "AUD-10021",
    timestamp: ago(560),
    adminUser: "Sarah Johnson",
    adminEmail: "sarah@playzoon.com",
    action: "Login",
    entityType: "Sub-Admin",
    entityId: "ADM-002",
    details: "Admin login successful. Session initiated. Browser: Chrome 121, OS: Windows 11",
    ipAddress: "10.0.1.22",
  },
  {
    id: "AUD-10022",
    timestamp: ago(590),
    adminUser: "Omar Fadel",
    adminEmail: "omar@playzoon.com",
    action: "Export",
    entityType: "Booking",
    entityId: "EXPORT-BK-20260310",
    details: "Exported bookings report. Format: CSV. Date range: 2026-02-01 to 2026-03-10. Total records: 1,247. Filters: All statuses",
    ipAddress: "10.0.1.33",
  },
  {
    id: "AUD-10023",
    timestamp: ago(620),
    adminUser: "Khalid Al-Rashid",
    adminEmail: "khalid@playzoon.com",
    action: "Unlocked",
    entityType: "Facility Provider",
    entityId: "PRV-0445",
    details: "Provider account unlocked after suspension period ended. Quality score improvement plan submitted and approved. Status: Locked -> Active",
    ipAddress: "10.0.1.45",
  },
  {
    id: "AUD-10024",
    timestamp: ago(660),
    adminUser: "David Chen",
    adminEmail: "david@playzoon.com",
    action: "Updated",
    entityType: "Training Program",
    entityId: "TRG-0067",
    details: "Training program updated: CrossFit Fundamentals. Price: SAR 180 -> SAR 200. Duration: 8 -> 10 weeks. Max participants: 15 -> 20",
    ipAddress: "10.0.1.55",
  },
  {
    id: "AUD-10025",
    timestamp: ago(720),
    adminUser: "Noura Al-Hashimi",
    adminEmail: "noura@playzoon.com",
    action: "Updated",
    entityType: "Country Config",
    entityId: "CNTRY-SA",
    details: "Saudi Arabia configuration updated. Tax rate: 15% (no change). Added new city: NEOM. Updated supported payment methods: added Apple Pay",
    ipAddress: "10.0.1.60",
  },
  {
    id: "AUD-10026",
    timestamp: ago(780),
    adminUser: "Khalid Al-Rashid",
    adminEmail: "khalid@playzoon.com",
    action: "Revoked",
    entityType: "Sub-Admin",
    entityId: "ADM-006",
    entityDeleted: true,
    details: "Sub-admin access revoked: [Deleted Admin]. Reason: Employee termination. All active sessions invalidated. Permissions removed immediately.",
    ipAddress: "10.0.1.45",
  },
  {
    id: "AUD-10027",
    timestamp: ago(840),
    adminUser: "Layla Abbas",
    adminEmail: "layla@playzoon.com",
    action: "Created",
    entityType: "Notification",
    entityId: "NOTIF-BULK-001",
    details: "Bulk notification sent. Target: All active players (2,456 recipients). Title: Ramadan Special Offers. Channel: Push + In-app",
    ipAddress: "10.0.1.41",
  },
  {
    id: "AUD-10028",
    timestamp: ago(900),
    adminUser: "Omar Fadel",
    adminEmail: "omar@playzoon.com",
    action: "Payout Action",
    entityType: "Payout",
    entityId: "PAY-7798",
    details: "Payout marked as completed (paid). Amount: SAR 15,200.00. Provider: Gulf Fitness Academy. Bank transfer reference: BT-2026031098. Processing -> Completed",
    ipAddress: "10.0.1.33",
  },
  {
    id: "AUD-10029",
    timestamp: ago(960),
    adminUser: "Sarah Johnson",
    adminEmail: "sarah@playzoon.com",
    action: "Rejected",
    entityType: "Facility Provider",
    entityId: "PRV-0902",
    details: "Provider application rejected. Reason: Incomplete documentation - missing trade license and liability insurance. Provider notified with required documents list.",
    ipAddress: "10.0.1.22",
  },
  {
    id: "AUD-10030",
    timestamp: ago(1020),
    adminUser: "Khalid Al-Rashid",
    adminEmail: "khalid@playzoon.com",
    action: "Logout",
    entityType: "Sub-Admin",
    entityId: "ADM-001",
    details: "Admin logout. Session duration: 4h 32m. Actions performed: 14",
    ipAddress: "10.0.1.45",
  },
];
