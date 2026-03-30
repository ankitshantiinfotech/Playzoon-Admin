import { AdminNotification } from "./types";

// ─── Helpers ─────────────────────────────────────────────────

const BASE = new Date(2026, 1, 21, 14, 0, 0); // 21 Feb 2026 14:00
const ago  = (h: number)  => new Date(BASE.getTime() - h  * 3_600_000);
const dago = (d: number, h = 0) => new Date(BASE.getTime() - (d * 24 + h) * 3_600_000);

let seq = 1;
const id = () => `AN-${String(seq++).padStart(4, "0")}`;

function n(
  ts: Date,
  type: AdminNotification["type"],
  title: string,
  body: string,
  deepLink: string,
  isRead: boolean,
  priority: AdminNotification["priority"] = "normal",
  meta?: { entityName?: string; entityId?: string } & Record<string, string>,
): AdminNotification {
  const { entityName, entityId, ...rest } = meta ?? {};
  return {
    id: id(), type, priority,
    category: ({
      new_provider_registration: "Provider Events",
      bank_account_submitted:    "Financial",
      new_payout_request:        "Financial",
      new_enquiry:               "Support",
      chat_flagged:              "Content",
      new_promoted_listing:      "Content",
      review_flagged:            "Content",
      facility_access_request:   "Provider Events",
      system_error:              "System",
      broadcast_scheduled:       "System",
      sub_admin_action:          "System",
      tournament_auto_status:    "Provider Events",
    } as Record<string, AdminNotification["category"]>)[type] as AdminNotification["category"],
    title, body: body.slice(0, 120), timestamp: ts, isRead, deepLink,
    entityName, entityId,
    meta: Object.keys(rest).length ? rest : undefined,
  };
}

// ─── Mock Notifications (35 entries) ─────────────────────────

export const INITIAL_NOTIFICATIONS: AdminNotification[] = [

  // ── TODAY (8 notifications, 7 unread) ──
  n(ago(0.3),  "system_error",
    "System Error Alert — Payment Gateway Timeout",
    "Payment gateway returned a 503 timeout during the Feb W3 payout batch. 4 payouts failed. Manual retry required.",
    "/payouts", false, "critical",
    { entityName: "Payout Batch BATCH-20260221-03", entityId: "BATCH-003", errorCode: "PG-503" }),

  n(ago(0.8),  "new_provider_registration",
    "New Provider Registration — Pending Approval",
    "Elite Fitness Hub has submitted a new Training Provider registration. Documents uploaded and awaiting review.",
    "/providers", false, "normal",
    { entityName: "Elite Fitness Hub", entityId: "PRV-1012" }),

  n(ago(1.2),  "chat_flagged",
    "Chat Message Flagged by User",
    "Player Ahmed Hassan flagged a message from Desert Padel Club as 'Threats / intimidation'. Immediate review needed.",
    "/chat", false, "normal",
    { entityName: "Ahmed Hassan ↔ Desert Padel Club", entityId: "THR-20260218-001", flagReason: "Threats / intimidation" }),

  n(ago(2.0),  "new_payout_request",
    "New Payout Request — Desert Padel Club",
    "Desert Padel Club has submitted a payout request for AED 14,200. Bank account verified. Pending admin approval.",
    "/payouts", false, "normal",
    { entityName: "Desert Padel Club", entityId: "PRV-001", amount: "AED 14,200" }),

  n(ago(2.5),  "new_enquiry",
    "New Contact Us Enquiry Submitted",
    "A new support enquiry (ENQ-20260221-031) was submitted by a guest user regarding booking cancellation policy.",
    "/enquiries", false, "normal",
    { entityName: "ENQ-20260221-031", enquiryType: "Cancellation Query" }),

  n(ago(3.0),  "bank_account_submitted",
    "Bank Account Submitted — Pending Verification",
    "Coach Sara Khalil has submitted bank account details (IBAN ending 4421) for verification. Action required.",
    "/bank-verification", false, "normal",
    { entityName: "Coach Sara Khalil", entityId: "PRV-004" }),

  n(ago(4.5),  "new_promoted_listing",
    "New Promoted Listing Request — Gulf Tennis Center",
    "Gulf Tennis Center has requested to promote 'Clay Court 1' for the next 30 days. Requires approval.",
    "/listings", false, "normal",
    { entityName: "Gulf Tennis Center — Clay Court 1", entityId: "LST-20260221-088" }),

  n(ago(5.5),  "tournament_auto_status",
    "Tournament Auto-Confirmed — UAE Padel Open 2026",
    "UAE Padel Open 2026 has reached 32/32 registrations and was automatically confirmed by the system.",
    "/tournaments", true, "normal",
    { entityName: "UAE Padel Open 2026", entityId: "TRN-2026-018", registrations: "32/32" }),

  // ── YESTERDAY (6 notifications, all read) ──
  n(dago(1, 2),  "new_provider_registration",
    "New Provider Registration — Quick Fit Studio",
    "Quick Fit Studio has submitted a Facility Provider registration. Trade license and insurance documents uploaded.",
    "/providers", true, "normal",
    { entityName: "Quick Fit Studio", entityId: "PRV-1011" }),

  n(dago(1, 5),  "review_flagged",
    "Review Flagged for Moderation",
    "A 1-star review on Desert Padel Club (REV-20260220-044) was flagged as 'Spam / fake review' by the provider.",
    "/reviews", true, "normal",
    { entityName: "Desert Padel Club", entityId: "PRV-001", reviewId: "REV-20260220-044" }),

  n(dago(1, 7),  "new_payout_request",
    "New Payout Request — FitZone Academy",
    "FitZone Academy has submitted a payout request for AED 8,450 for the period Feb 1–15. Pending approval.",
    "/payouts", true, "normal",
    { entityName: "FitZone Academy", entityId: "PRV-005", amount: "AED 8,450" }),

  n(dago(1, 9),  "new_enquiry",
    "New Contact Us Enquiry — Provider Complaint",
    "Training Provider 'Elite Sports Academy' submitted a support ticket (ENQ-20260220-028) regarding payout delay.",
    "/enquiries", true, "normal",
    { entityName: "ENQ-20260220-028", enquiryType: "Provider Complaint" }),

  n(dago(1, 12), "broadcast_scheduled",
    "Broadcast Notification Scheduled — Ramadan Offer",
    "Broadcast notification 'Ramadan 2026 Special Offers' has been scheduled for 28 Feb 2026 at 08:00 GST.",
    "/notifications", true, "normal",
    { entityName: "NOTIF-20260220-012", scheduledFor: "28 Feb 2026, 08:00 GST" }),

  n(dago(1, 15), "sub_admin_action",
    "Sub-Admin Account Created — Admin Layla Abbas",
    "Super Admin created a new Sub-Admin account for Layla Abbas (layla.a@playzoon.com) with Provider Management scope.",
    "/sub-admins", true, "normal",
    { entityName: "Admin Layla Abbas", entityId: "USR-005" }),

  // ── THIS WEEK — Feb 16–19 (10 notifications) ──
  n(dago(2, 3),  "bank_account_submitted",
    "Bank Account Submitted — Riverside Tennis Gardens",
    "Riverside Tennis Gardens submitted bank account details for the first time. IBAN ending 8812 awaiting verification.",
    "/bank-verification", true, "normal",
    { entityName: "Riverside Tennis Gardens", entityId: "PRV-1009" }),

  n(dago(2, 8),  "chat_flagged",
    "Chat Message Flagged — Abusive Language",
    "Player Sara Al-Rashidi flagged a message from Elite Sports Academy as 'Abusive language'. Review in Chat Management.",
    "/chat", true, "normal",
    { entityName: "Sara Al-Rashidi ↔ Elite Sports Academy", entityId: "THR-20260217-002" }),

  n(dago(3, 4),  "new_provider_registration",
    "New Provider Registration — Ace Badminton Arena",
    "Ace Badminton Arena has applied as a Facility Provider. 3 courts listed. Documents under review.",
    "/providers", true, "normal",
    { entityName: "Ace Badminton Arena", entityId: "PRV-1010" }),

  n(dago(3, 9),  "tournament_auto_status",
    "Tournament Auto-Cancelled — Beginners Yoga March",
    "Training programme 'Beginners Yoga — March Session' was auto-cancelled: 3 registrations (minimum 5). 3 refunds issued.",
    "/tournaments", true, "normal",
    { entityName: "Beginners Yoga — March Session", entityId: "TRN-2026-021", registrations: "3/5 (min not met)" }),

  n(dago(4, 6),  "new_payout_request",
    "New Payout Request — Champions Sports Club",
    "Champions Sports Club requested a payout of AED 22,800 for Jan 2026 earnings. Bank account verified.",
    "/payouts", true, "normal",
    { entityName: "Champions Sports Club", entityId: "PRV-006", amount: "AED 22,800" }),

  n(dago(4, 10), "facility_access_request",
    "Facility Access Request — FitZone Academy",
    "FitZone Academy (Training Provider) has requested access to Champions Arena Pool for Aqua Fitness sessions.",
    "/facilities", true, "normal",
    { entityName: "FitZone Academy → Champions Arena Pool", requestType: "Pool Access" }),

  n(dago(5, 3),  "review_flagged",
    "Review Flagged — Gulf Tennis Center",
    "Gulf Tennis Center flagged review REV-20260217-031 as 'Defamatory content'. Review requires admin decision.",
    "/reviews", true, "normal",
    { entityName: "Gulf Tennis Center", entityId: "PRV-003", reviewId: "REV-20260217-031" }),

  n(dago(5, 8),  "new_enquiry",
    "New Contact Us Enquiry — Technical Issue Report",
    "Player Omar Khalid submitted a technical issue report (ENQ-20260217-014) — payment not processing on iOS app.",
    "/enquiries", true, "normal",
    { entityName: "ENQ-20260217-014", enquiryType: "Technical Issue" }),

  n(dago(6, 5),  "sub_admin_action",
    "Sub-Admin Permissions Updated — Admin Omar Fadel",
    "Super Admin added 'Payout Approval' permission to Sub-Admin Omar Fadel's account. Change logged in Audit Trail.",
    "/sub-admins", true, "normal",
    { entityName: "Admin Omar Fadel", entityId: "USR-004", change: "Added: Payout Approval" }),

  n(dago(6, 11), "system_error",
    "System Error Alert — Search Index Re-index Failed",
    "Elasticsearch cluster unreachable during scheduled re-index at 14:00. Index on previous version. Manual retry needed.",
    "/track-activities", true, "critical",
    { errorCode: "ES-CONN-TIMEOUT", affectedService: "Search Index", retryRequired: "Yes" }),

  n(dago(7, 7),  "broadcast_scheduled",
    "Broadcast Notification Sent — New Padel Courts",
    "Broadcast 'Try the New Padel Courts in Dubai' was sent successfully to 184 recipients (98% delivery rate).",
    "/notifications", true, "normal",
    { entityName: "NOTIF-20260214-009", deliveryRate: "98%", recipients: "184" }),

  // ── OLDER — Feb 7–14 (10 notifications) ──
  n(dago(8, 6),  "new_provider_registration",
    "New Provider Registration — Ocean Sports Hub",
    "Ocean Sports Hub applied as a Facility Provider offering water sports and beach volleyball. Pending review.",
    "/providers", true, "normal",
    { entityName: "Ocean Sports Hub", entityId: "PRV-1008" }),

  n(dago(9, 4),  "bank_account_submitted",
    "Bank Account Submitted — Pro Kick Football Academy",
    "Pro Kick Football Academy submitted updated bank account details (IBAN ending 3302) after previous rejection.",
    "/bank-verification", true, "normal",
    { entityName: "Pro Kick Football Academy", entityId: "PRV-007" }),

  n(dago(10, 9), "new_payout_request",
    "New Payout Request — Coach Ahmed Al-Farsi",
    "Freelancer Coach Ahmed Al-Farsi submitted a payout request for AED 3,400 (Jan 2026 coaching sessions).",
    "/payouts", true, "normal",
    { entityName: "Coach Ahmed Al-Farsi", entityId: "PRV-008", amount: "AED 3,400" }),

  n(dago(11, 5), "facility_access_request",
    "Facility Access Request — Gulf Tennis Training Program",
    "Gulf Tennis Center Training Program requested dedicated court access for their junior academy on Wednesdays.",
    "/facilities", true, "normal",
    { entityName: "Gulf Tennis Junior Academy", requestType: "Court Allocation" }),

  n(dago(12, 3), "chat_flagged",
    "Chat Message Flagged — Inappropriate Content",
    "Player Lena Morris flagged a message from Desert Padel Club staff as 'Inappropriate content'. Message hidden.",
    "/chat", true, "normal",
    { entityName: "Lena Morris ↔ Desert Padel Club", entityId: "THR-20260211-006" }),

  n(dago(13, 8), "review_flagged",
    "Review Flagged — FitZone Academy",
    "FitZone Academy flagged review REV-20260209-018 containing a competitor advertisement as 'Spam'.",
    "/reviews", true, "normal",
    { entityName: "FitZone Academy", entityId: "PRV-005", reviewId: "REV-20260209-018" }),

  n(dago(14, 4), "sub_admin_action",
    "Sub-Admin Created — Admin Omar Fadel",
    "Super Admin created Sub-Admin account for Omar Fadel (omar.f@playzoon.com) with Booking & Report scope.",
    "/sub-admins", true, "normal",
    { entityName: "Admin Omar Fadel", entityId: "USR-004" }),

  n(dago(15, 6), "tournament_auto_status",
    "Tournament Auto-Confirmed — Dubai Indoor Football Cup",
    "Dubai Indoor Football Cup reached 16/16 registrations and was automatically confirmed for Feb 18.",
    "/tournaments", true, "normal",
    { entityName: "Dubai Indoor Football Cup", entityId: "TRN-2026-017", registrations: "16/16" }),

  n(dago(16, 7), "new_enquiry",
    "New Contact Us Enquiry — Billing Dispute",
    "Provider Champions Sports Club submitted enquiry ENQ-20260206-007 disputing a commission charge deduction.",
    "/enquiries", true, "normal",
    { entityName: "ENQ-20260206-007", enquiryType: "Billing Dispute" }),

  n(dago(18, 5), "new_promoted_listing",
    "New Promoted Listing Request — FitZone Academy",
    "FitZone Academy requested to promote 'CrossFit Fundamentals' programme for 14 days in Dubai and Abu Dhabi.",
    "/listings", true, "normal",
    { entityName: "FitZone Academy — CrossFit Fundamentals", entityId: "LST-20260204-041" }),
];

// ─── Simulated real-time notification (BR-130-05 demo) ────────

export function buildRealtimeNotification(seq: number): AdminNotification {
  const demos: Omit<AdminNotification, "id" | "category" | "timestamp" | "isRead">[] = [
    {
      type: "new_payout_request", priority: "normal",
      title: "New Payout Request — Elite Sports Academy",
      body: "Elite Sports Academy submitted a payout request for AED 11,600 for Feb 16–28.",
      deepLink: "/payouts", entityName: "Elite Sports Academy", entityId: "PRV-002",
      meta: { amount: "AED 11,600" },
    },
    {
      type: "new_provider_registration", priority: "normal",
      title: "New Provider Registration — Sunrise Yoga Studio",
      body: "Sunrise Yoga Studio applied as a Training Provider. 3 programmes listed. Documents uploaded.",
      deepLink: "/providers", entityName: "Sunrise Yoga Studio", entityId: `PRV-${1020 + seq}`,
    },
    {
      type: "system_error", priority: "critical",
      title: "System Error Alert — CDN Cache Purge Timeout",
      body: "Scheduled CDN cache purge timed out after 30s. 3 edge nodes not updated. Manual purge recommended.",
      deepLink: "/track-activities",
      meta: { errorCode: "CDN-TIMEOUT", affectedNodes: "3" },
    },
    {
      type: "new_enquiry", priority: "normal",
      title: "New Contact Us Enquiry Submitted",
      body: `A new enquiry (ENQ-20260221-03${seq}) was submitted by a player about booking a group tournament.`,
      deepLink: "/enquiries",
      entityName: `ENQ-20260221-03${seq}`,
    },
  ];
  const demo = demos[seq % demos.length];
  return {
    ...demo,
    id:        `AN-RT-${String(seq).padStart(3, "0")}`,
    category:  ({
      new_provider_registration: "Provider Events",
      bank_account_submitted:    "Financial",
      new_payout_request:        "Financial",
      new_enquiry:               "Support",
      chat_flagged:              "Content",
      new_promoted_listing:      "Content",
      review_flagged:            "Content",
      facility_access_request:   "Provider Events",
      system_error:              "System",
      broadcast_scheduled:       "System",
      sub_admin_action:          "System",
      tournament_auto_status:    "Provider Events",
    } as Record<string, AdminNotification["category"]>)[demo.type] as AdminNotification["category"],
    timestamp: new Date(),
    isRead:    false,
  };
}
