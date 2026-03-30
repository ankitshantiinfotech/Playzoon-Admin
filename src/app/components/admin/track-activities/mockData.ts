import { ActivityLogEntry, RefreshActivity } from "./types";

// ─── Helpers ─────────────────────────────────────────────────

const BASE = new Date(2026, 1, 21, 14, 0, 0); // 21 Feb 2026 14:00 UTC
const ago  = (h: number)  => new Date(BASE.getTime() - h * 3_600_000);
const dago = (d: number)  => new Date(BASE.getTime() - d * 86_400_000);

const ADMINS = {
  super:  { id: "USR-001", name: "Super Admin",           role: "Super Admin" as const },
  khalid: { id: "USR-002", name: "Admin Khalid Al-Rashid", role: "Sub-Admin"  as const },
  sarah:  { id: "USR-003", name: "Admin Sarah Johnson",    role: "Sub-Admin"  as const },
  omar:   { id: "USR-004", name: "Admin Omar Fadel",       role: "Sub-Admin"  as const },
  layla:  { id: "USR-005", name: "Admin Layla Abbas",      role: "Sub-Admin"  as const },
  system: { id: "SYS-001", name: "System",                 role: "System"     as const },
};

const IPS = [
  "81.22.44.10",  "81.22.44.10", "81.22.44.10",
  "185.44.22.88", "185.44.22.88",
  "94.13.77.55",  "94.13.77.55",
  "80.211.33.12",
  "212.84.10.33",
];
let ipIdx = 0;
const ip = () => IPS[ipIdx++ % IPS.length];

let seq = 1;
function actId(d: Date) { return `ACT-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${String(seq++).padStart(3,"0")}`; }

function act(
  ts: Date,
  actionName: string,
  category: ActivityLogEntry["category"],
  actor: ActivityLogEntry["actor"],
  target: string,
  targetType: string,
  status: ActivityLogEntry["status"] = "Success",
  failureReason?: string,
  metadata?: Record<string,string>,
): ActivityLogEntry {
  return {
    id: actId(ts),
    actionName,
    category,
    actor,
    target,
    targetType,
    timestamp: ts,
    ipAddress: actor.role !== "System" ? ip() : undefined,
    status,
    failureReason,
    metadata,
  };
}

// ─── Activity Log Mock Data (60 entries) ──────────────────────

export const INITIAL_ACTIVITY_LOGS: ActivityLogEntry[] = [

  // ── Today (Feb 21) ─────────────────────────────
  act(ago(0.1),  "Admin Login",                     "Admin Action",   ADMINS.super,  "Super Admin",                   "Auth",     "Success", undefined, { device: "Chrome / macOS", location: "Dubai, UAE" }),
  act(ago(0.3),  "Provider Approved",               "Admin Action",   ADMINS.super,  "Elite Sports Academy",          "Provider", "Success", undefined, { providerType: "Training Provider", id: "PRV-1001" }),
  act(ago(0.5),  "Bank Account Verified",           "Admin Action",   ADMINS.super,  "Elite Sports Academy",          "Provider", "Success", undefined, { verificationId: "BV-20260221-001" }),
  act(ago(0.8),  "Payout Approved",                 "Admin Action",   ADMINS.khalid, "Desert Padel Club",             "Payout",   "Success", undefined, { amount: "AED 14,200", payoutId: "PO-20260221-004" }),
  act(ago(1.0),  "Enquiry Replied",                 "Admin Action",   ADMINS.sarah,  "ENQ-20260221-031 (Guest User)", "Enquiry",  "Success"),
  act(ago(1.2),  "Broadcast Notification Sent",     "Admin Action",   ADMINS.super,  "All Active Players (1,247)",    "Notification", "Success", undefined, { type: "Promotional", title: "February Fitness Challenge" }),
  act(ago(1.5),  "Payout Batch Processed",          "System Action",  ADMINS.system, "42 providers — Feb W3 cycle",   "Payout",   "Success", undefined, { totalAmount: "AED 218,400", batchId: "BATCH-20260221-03" }),
  act(ago(1.8),  "Scheduled Notification Sent",     "System Action",  ADMINS.system, "Booking reminders (312 users)", "Notification", "Success"),
  act(ago(2.0),  "Promotion Approved",              "Admin Action",   ADMINS.omar,   "Desert Padel Club — 20% OFF",   "Promotion","Success"),
  act(ago(2.2),  "Slot Hold Expired",               "System Action",  ADMINS.system, "Basketball Court A — 3 slots",  "Booking",  "Success"),
  act(ago(2.5),  "Multiple Failed Login Attempts",  "Security Event", ADMINS.system, "user: coach.mike@gmail.com",    "Auth",     "Failed",  "User exceeded 5 failed login attempts in 10 min. Account temporarily locked.", { ip: "192.168.1.45", attempts: "5" }),
  act(ago(2.8),  "Sub-Admin Created",               "Admin Action",   ADMINS.super,  "Admin Layla Abbas",             "Sub-Admin","Success", undefined, { email: "layla.a@playzoon.com", role: "Sub-Admin" }),
  act(ago(3.0),  "Tournament Auto-Confirmed",       "System Action",  ADMINS.system, "UAE Padel Open 2026",           "Tournament","Success", undefined, { registrations: "32/32", tournamentId: "TRN-2026-018" }),
  act(ago(3.2),  "Player Account Suspended",        "Admin Action",   ADMINS.khalid, "Hassan Al-Marzouqi (PLY-4421)", "Player",   "Success", undefined, { reason: "Repeated booking fraud attempt" }),
  act(ago(3.5),  "CMS Page Updated",                "Admin Action",   ADMINS.layla,  "Terms & Conditions (EN + AR)",  "CMS",      "Success"),
  act(ago(3.8),  "Commission Rate Changed",         "Admin Action",   ADMINS.super,  "Facility Providers — Dubai",    "Config",   "Success", undefined, { oldRate: "12%", newRate: "14%", scope: "Facility / Dubai" }),
  act(ago(4.0),  "Bank Account Rejected",           "Admin Action",   ADMINS.sarah,  "Coach Sara Khalil",             "Provider", "Success", undefined, { verificationId: "BV-20260219-001", reason: "IBAN name mismatch" }),
  act(ago(4.2),  "Suspicious Payment Pattern Flagged", "Security Event", ADMINS.system, "PLY-8843 — 7 transactions in 3 min", "Payment", "Failed", "Multiple high-value card transactions from the same IP within 3 minutes. Flagged for manual review.", { transactionCount: "7", totalAmount: "AED 4,200", ip: "45.88.12.99" }),
  act(ago(4.5),  "Report Generated",                "Admin Action",   ADMINS.khalid, "Monthly Revenue Report — Jan 2026", "Report","Success"),
  act(ago(4.8),  "Wallet Reserve Released",         "System Action",  ADMINS.system, "AED 350 — PLY-2211 dispute resolved","Wallet","Success"),
  act(ago(5.0),  "Banner Created",                  "Admin Action",   ADMINS.layla,  "February Promo Banner (Home)",  "Banner",   "Success"),
  act(ago(5.5),  "Payout Rejected",                 "Admin Action",   ADMINS.super,  "Hoops Academy — PO-20260220-011","Payout", "Success", undefined, { reason: "Bank account not verified" }),
  act(ago(6.0),  "Provider Suspended",              "Admin Action",   ADMINS.super,  "Gulf Tennis Center",            "Provider", "Success", undefined, { reason: "Multiple unresolved disputes" }),

  // ── Yesterday (Feb 20) ─────────────────────────
  act(dago(1),   "Admin Login",                     "Admin Action",   ADMINS.khalid, "Admin Khalid Al-Rashid",        "Auth",     "Success", undefined, { device: "Firefox / Windows", location: "Dubai, UAE" }),
  act(new Date(dago(1).getTime() + 3600000), "Provider Rejected", "Admin Action", ADMINS.khalid, "Quick Fit Gym",  "Provider", "Success", undefined, { reason: "Incomplete trade license" }),
  act(new Date(dago(1).getTime() + 7200000), "Training Programme Auto-Cancelled", "System Action", ADMINS.system, "Beginners Yoga — Mar Session", "Training", "Success", undefined, { registrations: "3", minimum: "5", refunds: "3" }),
  act(new Date(dago(1).getTime() + 10800000), "Cancellation Policy Updated", "Admin Action", ADMINS.sarah, "Standard 24h Policy — All Facilities", "Config", "Success"),
  act(new Date(dago(1).getTime() + 14400000), "Payout Approved",  "Admin Action", ADMINS.sarah, "FitZone Academy",              "Payout",   "Success", undefined, { amount: "AED 8,450", payoutId: "PO-20260220-003" }),
  act(new Date(dago(1).getTime() + 18000000), "Enquiry Escalated", "Admin Action", ADMINS.khalid, "ENQ-20260219-015 → Super Admin", "Enquiry", "Success"),
  act(new Date(dago(1).getTime() + 21600000), "Mass Booking Anomaly Detected", "Security Event", ADMINS.system, "Desert Padel Court 1 — 88 requests in 5 min", "Booking", "Failed", "Automated detection: 88 booking requests from 3 IPs within 5 minutes on the same slot. Slot temporarily locked.", { ip1: "91.44.12.33", ip2: "91.44.12.34", ip3: "91.44.12.35" }),
  act(new Date(dago(1).getTime() + 25200000), "CMS Page Updated", "Admin Action", ADMINS.layla, "Privacy Policy (AR update)",  "CMS",       "Success"),
  act(new Date(dago(1).getTime() + 28800000), "Banner Updated",   "Admin Action", ADMINS.layla,  "Ramadan 2026 Banner",          "Banner",    "Success"),
  act(new Date(dago(1).getTime() + 32400000), "Sub-Admin Modified", "Admin Action", ADMINS.super, "Admin Omar Fadel — permissions", "Sub-Admin","Success", undefined, { changed: "Added: Payout Approval" }),
  act(new Date(dago(1).getTime() + 36000000), "Payout Batch Processed", "System Action", ADMINS.system, "38 providers — Feb W2 cycle","Payout","Failed", "Payment gateway timeout during batch. 12 payouts failed; 26 succeeded. Retried at 23:00.", { failed: "12", succeeded: "26", batchId: "BATCH-20260220-02" }),

  // ── Feb 19 ─────────────────────────────────────
  act(dago(2),   "Provider Approved",               "Admin Action",   ADMINS.omar,   "Riverside Tennis Gardens",      "Provider", "Success"),
  act(new Date(dago(2).getTime() + 7200000), "Promotion Rejected", "Admin Action", ADMINS.khalid, "Champions Arena — 50% OFF (misleading)", "Promotion", "Success", undefined, { reason: "Discount terms misleading / non-compliant" }),
  act(new Date(dago(2).getTime() + 14400000), "Scheduled Notification Sent", "System Action", ADMINS.system, "Weekly tournament digest (876 users)", "Notification", "Success"),
  act(new Date(dago(2).getTime() + 21600000), "Player Account Reinstated", "Admin Action", ADMINS.super, "Faisal Al-Shaikh (PLY-3302)", "Player", "Success", undefined, { reason: "Appeal reviewed — suspension lifted" }),
  act(new Date(dago(2).getTime() + 28800000), "Admin Login from New Location", "Security Event", ADMINS.system, "Admin Sarah Johnson — London, UK", "Auth", "Success", undefined, { location: "London, UK", device: "Chrome / Windows", ip: "80.211.33.12", note: "Admin confirmed via email" }),
  act(new Date(dago(2).getTime() + 36000000), "Report Generated", "Admin Action", ADMINS.omar, "Booking Analytics — Q4 2025",   "Report",   "Success"),

  // ── Feb 18 ─────────────────────────────────────
  act(dago(3),   "Banner Deleted",                  "Admin Action",   ADMINS.layla,  "Christmas 2025 Banner",         "Banner",   "Success"),
  act(new Date(dago(3).getTime() + 7200000), "Tournament Auto-Confirmed", "System Action", ADMINS.system, "Dubai Indoor Football Cup", "Tournament", "Success", undefined, { registrations: "16/16" }),
  act(new Date(dago(3).getTime() + 14400000), "Wallet Reserve Released", "System Action", ADMINS.system, "AED 620 — 4 expired disputes", "Wallet", "Success"),
  act(new Date(dago(3).getTime() + 21600000), "Commission Rate Changed", "Admin Action", ADMINS.super, "Training Providers — All", "Config", "Success", undefined, { oldRate: "10%", newRate: "12%" }),
  act(new Date(dago(3).getTime() + 28800000), "Payout Approved",  "Admin Action",  ADMINS.omar,   "Ace Tennis Club",               "Payout",   "Success", undefined, { amount: "AED 6,100" }),
  act(new Date(dago(3).getTime() + 32400000), "CMS Page Updated", "Admin Action",  ADMINS.layla,  "About Us page (EN)",            "CMS",       "Success"),

  // ── Feb 17 ─────────────────────────────────────
  act(dago(4),   "Sub-Admin Deleted",               "Admin Action",   ADMINS.super,  "Admin Tariq Hassan — deactivated","Sub-Admin","Success"),
  act(new Date(dago(4).getTime() + 7200000), "Bank Account Verified", "Admin Action", ADMINS.sarah, "Ace Tennis Club", "Provider", "Success"),
  act(new Date(dago(4).getTime() + 14400000), "Provider Suspended", "Admin Action", ADMINS.khalid, "FastFit Studio (policy violation)", "Provider", "Failed", "Suspension failed: active bookings within 48h. Manual review required.", { bookingsBlocking: "3", earliestBooking: "2026-02-18 09:00" }),
  act(new Date(dago(4).getTime() + 21600000), "Payout Batch Processed", "System Action", ADMINS.system, "41 providers — Feb W1 cycle", "Payout", "Success", undefined, { totalAmount: "AED 196,800" }),
  act(new Date(dago(4).getTime() + 28800000), "Enquiry Replied",  "Admin Action",  ADMINS.sarah,  "ENQ-20260217-008 (Provider)",   "Enquiry",  "Success"),

  // ── Feb 14-16 ──────────────────────────────────
  act(dago(5),   "Promotion Approved",              "Admin Action",   ADMINS.omar,   "Elite Padel Hub — 15% OFF Weekday","Promotion","Success"),
  act(dago(6),   "Admin Login",                     "Admin Action",   ADMINS.super,  "Super Admin",                   "Auth",     "Success", undefined, { device: "Chrome / macOS", location: "Dubai, UAE" }),
  act(new Date(dago(6).getTime() + 3600000), "Player Account Suspended", "Admin Action", ADMINS.khalid, "Omar Al-Nasser (PLY-5511)", "Player", "Success", undefined, { reason: "Fraudulent dispute pattern" }),
  act(dago(7),   "Training Programme Auto-Cancelled", "System Action", ADMINS.system, "Advanced Swimming — Adult",   "Training", "Success", undefined, { registrations: "2", minimum: "6" }),
  act(new Date(dago(7).getTime() + 7200000), "Banner Created",   "Admin Action",  ADMINS.layla,  "Ramadan 2026 Countdown Banner", "Banner",  "Success"),
  act(dago(8),   "Report Generated",                "Admin Action",   ADMINS.omar,   "Provider Performance — Jan",    "Report",   "Success"),
  act(dago(9),   "Commission Rate Changed",         "Admin Action",   ADMINS.super,  "Freelancer Coaches — All",      "Config",   "Failed",  "Permission denied: commission changes for Coach type require Super Admin + Finance sign-off.", { requiredApprovals: "2", receivedApprovals: "1" }),
  act(dago(10),  "Payout Batch Processed",          "System Action",  ADMINS.system, "39 providers — Jan W4 cycle",   "Payout",   "Success", undefined, { totalAmount: "AED 183,200" }),
  act(dago(12),  "Admin Login",                     "Admin Action",   ADMINS.sarah,  "Admin Sarah Johnson",           "Auth",     "Success"),
  act(dago(14),  "Sub-Admin Created",               "Admin Action",   ADMINS.super,  "Admin Omar Fadel",              "Sub-Admin","Success", undefined, { email: "omar.f@playzoon.com", role: "Sub-Admin" }),
];

// ─── Refresh Activities Mock Data ─────────────────────────────

let rseq = 1;
function refId(d: Date) { return `REF-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${String(rseq++).padStart(3,"0")}`; }

function ref(
  ts: Date,
  type: RefreshActivity["refreshType"],
  trigger: RefreshActivity["triggeredBy"],
  status: RefreshActivity["status"],
  durationSec?: number,
  affectedRecords?: number,
  user?: string,
  errorMsg?: string,
): RefreshActivity {
  const endTime = status !== "In Progress" && durationSec ? new Date(ts.getTime() + durationSec * 1000) : undefined;
  return {
    id: refId(ts),
    refreshType: type,
    triggeredBy: trigger,
    triggeredByUser: user,
    startTime: ts,
    endTime,
    durationSeconds: status !== "In Progress" ? durationSec : undefined,
    status,
    affectedRecords,
    errorMessage: errorMsg,
  };
}

export const INITIAL_REFRESH_ACTIVITIES: RefreshActivity[] = [
  // Today
  ref(ago(0.7),  "CDN Cache Purge",           "Manual",    "Completed", 7,   undefined, "Super Admin"),
  ref(ago(2.1),  "Featured Content Refresh",  "Scheduled", "Completed", 11,  148),
  ref(ago(4.0),  "Search Index Re-index",     "Manual",    "Completed", 43,  28_440, "Admin Khalid Al-Rashid"),
  ref(ago(6.0),  "Payment Reconciliation",    "Scheduled", "Completed", 88,  312),

  // Yesterday
  ref(new Date(dago(1).getTime() + 2*3600000),  "DB Backup",               "Scheduled", "Completed", 174, undefined),
  ref(new Date(dago(1).getTime() + 8*3600000),  "CDN Cache Purge",         "Scheduled", "Completed", 6,   undefined),
  ref(new Date(dago(1).getTime() + 10*3600000), "Featured Content Refresh","Scheduled", "Completed", 13,  152),
  ref(new Date(dago(1).getTime() + 14*3600000), "Search Index Re-index",   "Manual",    "Failed",    undefined, undefined, "Admin Sarah Johnson", "Elasticsearch cluster unreachable. Connection timeout after 30s. Retried 3 times. Index remains on previous version."),
  ref(new Date(dago(1).getTime() + 14.5*3600000), "Search Index Re-index","Manual",    "Completed", 51, 28_012, "Admin Sarah Johnson"),
  ref(new Date(dago(1).getTime() + 20*3600000), "Payment Reconciliation",  "Scheduled", "Completed", 76,  298),

  // Feb 19
  ref(new Date(dago(2).getTime() + 2*3600000),  "DB Backup",               "Scheduled", "Completed", 168, undefined),
  ref(new Date(dago(2).getTime() + 8*3600000),  "Featured Content Refresh","Scheduled", "Completed", 9,   141),
  ref(new Date(dago(2).getTime() + 12*3600000), "CDN Cache Purge",         "Manual",    "Completed", 8,   undefined, "Admin Omar Fadel"),
  ref(new Date(dago(2).getTime() + 16*3600000), "Search Index Re-index",   "Scheduled", "Completed", 47, 27_988),

  // Feb 18
  ref(new Date(dago(3).getTime() + 2*3600000),  "DB Backup",               "Scheduled", "Completed", 159, undefined),
  ref(new Date(dago(3).getTime() + 10*3600000), "Payment Reconciliation",  "Scheduled", "Failed",    undefined, undefined, undefined, "Payment gateway returned error 503. 18 transactions could not be reconciled. Manually resolved at 11:45."),
  ref(new Date(dago(3).getTime() + 11.75*3600000), "Payment Reconciliation","Manual",   "Completed", 54,  280, "Super Admin"),
  ref(new Date(dago(3).getTime() + 16*3600000), "Featured Content Refresh","Scheduled", "Completed", 10,  149),

  // Feb 14
  ref(new Date(dago(7).getTime() + 2*3600000),  "DB Backup",               "Scheduled", "Completed", 182, undefined),
  ref(new Date(dago(7).getTime() + 14*3600000), "Search Index Re-index",   "Scheduled", "Completed", 44, 27_201),
];
