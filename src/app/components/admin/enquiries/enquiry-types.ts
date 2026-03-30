// ─── US-124: Contact Us Enquiries — Types & Mock Data ────────

export type EnquiryCategory =
  | "General Inquiry"
  | "Technical Issue"
  | "Payment Issue"
  | "Booking Issue"
  | "Feedback"
  | "Other";

// SCR-ADM-012: Status values are Open and Resolved only
export type EnquiryStatus = "Open" | "Resolved";

// Submitter account types (BR-124-07 Guest = email only)
export type AccountType =
  | "Player"
  | "Training Provider"
  | "Facility Provider"
  | "Freelancer Coach"
  | "Guest";

// ─── Status History (BR-124-02 / BR-124-05 / BR-124-06) ──────
export type HistoryEvent =
  | "Opened"
  | "Viewed"
  | "Replied"
  | "Resolved"
  | "Re-opened";

export interface StatusHistoryEntry {
  id: string;
  event: HistoryEvent;
  actor: string;
  timestamp: Date;
  note?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "pdf" | "doc" | "video";
  url: string;
  size: string;
}

export interface ThreadMessage {
  id: string;
  from: "admin" | "user" | "note";
  authorName: string;
  body: string;
  timestamp: Date;
}

export interface Enquiry {
  id: string;                   // ENQ-YYYYMMDD-NNN
  subject: string;
  category: EnquiryCategory;
  message: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;      // optional
  accountType: AccountType;
  submitterId: string;          // "" for Guest
  isGuest: boolean;             // BR-124-07
  status: EnquiryStatus;
  assignedTo: string | null;
  submittedAt: Date;
  lastUpdated: Date;
  attachments: Attachment[];
  thread: ThreadMessage[];
  internalNotes: ThreadMessage[];
  statusHistory: StatusHistoryEntry[];
}

// ─── Sub-Admin team ──────────────────────────────────────────

export const ADMIN_TEAM = [
  { id: "sa1", name: "Khalid Al-Rashid",  role: "Senior Admin" },
  { id: "sa2", name: "Sarah Johnson",     role: "Support Lead" },
  { id: "sa3", name: "Omar Fadel",        role: "Sub-Admin" },
  { id: "sa4", name: "Layla Abbas",       role: "Sub-Admin" },
  { id: "sa5", name: "David Chen",        role: "Technical Admin" },
];

// ─── Style maps ──────────────────────────────────────────────

export const CATEGORY_STYLES: Record<EnquiryCategory, { bg: string; text: string; border: string }> = {
  "General Inquiry": { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200"  },
  "Technical Issue": { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
  "Payment Issue":   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200"},
  "Booking Issue":   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"   },
  "Feedback":        { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  "Other":           { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200"   },
};

// SCR-ADM-012: Open=semantic-warning, Resolved=semantic-success
export const STATUS_STYLES: Record<EnquiryStatus, { bg: string; text: string; dot: string; ring: string }> = {
  "Open":        { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   ring: "ring-amber-100"   },
  "Resolved":    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-100" },
};

export const ACCOUNT_TYPE_STYLES: Record<AccountType, { bg: string; text: string; border: string }> = {
  "Player":             { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
  "Training Provider":  { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "Facility Provider":  { bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200"    },
  "Freelancer Coach":   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200"   },
  "Guest":              { bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-200"   },
};

export const HISTORY_EVENT_STYLES: Record<HistoryEvent, { dot: string; text: string }> = {
  Opened:    { dot: "bg-blue-500",    text: "text-blue-700"    },
  Viewed:    { dot: "bg-slate-400",   text: "text-slate-600"   },
  Replied:   { dot: "bg-[#003B95]",   text: "text-[#003B95]"   },
  Resolved:  { dot: "bg-emerald-500", text: "text-emerald-700" },
  "Re-opened": { dot: "bg-amber-500", text: "text-amber-700"   },
};

// ─── Mock data helpers ───────────────────────────────────────

const BASE = new Date(2026, 1, 21, 14, 0, 0); // Feb 21 2026
function ago(h: number): Date { return new Date(BASE.getTime() - h * 3_600_000); }

function sh(entries: Array<{ event: HistoryEvent; actor: string; h: number; note?: string }>): StatusHistoryEntry[] {
  return entries.map((e, i) => ({
    id: `sh-${i}`,
    event: e.event,
    actor: e.actor,
    timestamp: ago(e.h),
    note: e.note,
  }));
}

// ─── Mock data ───────────────────────────────────────────────

export const INITIAL_ENQUIRIES: Enquiry[] = [
  // ── 1. Payment Issue — Player — Open ──────────────────────
  {
    id: "ENQ-20260221-001",
    subject: "Unable to complete booking payment — card keeps declining",
    category: "Payment Issue",
    message:
      "I've been trying to book a tennis court at Gulf Tennis Center for the past hour but every time I try to pay with my Visa card, it says 'Payment failed — please try another method.' I've tried 3 different cards and they all work fine everywhere else. My wallet balance is 0 so I can't use that either. This is really frustrating. Please help urgently as the slot I want is almost sold out.",
    submitterName: "Mohammed Al-Sayed",
    submitterEmail: "m.alsayed@gmail.com",
    submitterPhone: "+971-50-123-4567",
    accountType: "Player",
    submitterId: "USR-4521",
    isGuest: false,
    status: "Open",
    assignedTo: null,
    submittedAt: ago(0.5),
    lastUpdated: ago(0.5),
    attachments: [
      { id: "att1", name: "payment_error_screenshot.png", type: "image", url: "#", size: "245 KB" },
    ],
    thread: [],
    internalNotes: [],
    statusHistory: sh([
      { event: "Opened", actor: "System", h: 0.5, note: "Enquiry submitted via Player Contact Us form" },
    ]),
  },

  // ── 2. Other (Booking issue) — Player — In Progress ───────
  {
    id: "ENQ-20260221-002",
    subject: "Booking was confirmed but facility says no reservation found",
    category: "Other",
    message:
      "I booked Indoor Basketball Court A at Champions Sports Club for today at 6 PM. I received a confirmation email and the amount was deducted from my wallet. When I arrived at the facility, they said there's no booking under my name and the court is already taken by someone else. I need this resolved immediately — either give me the court or refund my money. Booking reference: BK-78923.",
    submitterName: "Ali Hassan",
    submitterEmail: "ali.h@outlook.com",
    submitterPhone: "+971-55-987-6543",
    accountType: "Player",
    submitterId: "USR-3298",
    isGuest: false,
    status: "Open",
    assignedTo: "Khalid Al-Rashid",
    submittedAt: ago(3),
    lastUpdated: ago(1),
    attachments: [
      { id: "att2", name: "booking_confirmation.png", type: "image", url: "#", size: "182 KB" },
      { id: "att3", name: "wallet_deduction.pdf",     type: "pdf",   url: "#", size: "94 KB"  },
    ],
    thread: [
      { id: "t1", from: "admin", authorName: "Khalid Al-Rashid", body: "Hi Ali, thank you for reaching out. I've escalated this to the facility management. I can see your booking BK-78923 is confirmed in our system. We're investigating the sync issue. I'll update you within the hour.", timestamp: ago(2) },
      { id: "t2", from: "user",  authorName: "Ali Hassan",        body: "Thank you for the quick response. I'm still at the facility — please hurry as I have a game scheduled with my team.",                                                                                           timestamp: ago(1.5) },
    ],
    internalNotes: [
      { id: "n1", from: "note", authorName: "Khalid Al-Rashid", body: "Checked system logs — booking was created successfully but the facility's POS didn't sync. Their API returned 200 but the webhook to update their local system failed. Contacted their tech team.", timestamp: ago(1.8) },
    ],
    statusHistory: sh([
      { event: "Opened",   actor: "System",            h: 3,   note: "Enquiry submitted via Player Contact Us form" },
      { event: "Viewed",   actor: "Khalid Al-Rashid",  h: 2.5, note: "Admin opened enquiry — status advanced to In Progress" },
      { event: "Replied",  actor: "Khalid Al-Rashid",  h: 2,   note: "Email sent to ali.h@outlook.com — Re: Your Enquiry [ENQ-20260221-002]" },
    ]),
  },

  // ── 3. Technical Issue — Player — In Progress ─────────────
  {
    id: "ENQ-20260221-003",
    subject: "App crashes when I try to view tournament brackets",
    category: "Technical Issue",
    message:
      "Every time I tap on the 'Brackets' tab in the Summer Football Cup tournament page, the app freezes for about 5 seconds and then crashes back to the home screen. I'm using iPhone 15 Pro with iOS 19.1. I've tried reinstalling the app and clearing cache but the issue persists. Other tournament pages work fine.",
    submitterName: "Fatima Al-Zahra",
    submitterEmail: "fatima.z@icloud.com",
    submitterPhone: "+971-56-333-2211",
    accountType: "Player",
    submitterId: "USR-7754",
    isGuest: false,
    status: "Open",
    assignedTo: "David Chen",
    submittedAt: ago(6),
    lastUpdated: ago(2),
    attachments: [
      { id: "att4", name: "crash_log.txt", type: "doc", url: "#", size: "12 KB" },
    ],
    thread: [
      { id: "t3", from: "admin", authorName: "David Chen",    body: "Hi Fatima, thanks for the detailed report. We've identified the issue — it's related to a bracket rendering bug when there are more than 32 teams. Our dev team is pushing a fix today. Can you confirm your app version?",  timestamp: ago(4)   },
      { id: "t4", from: "user",  authorName: "Fatima Al-Zahra", body: "App version is 3.2.1 (build 4567). Thank you for looking into this!",                                                                                                                                                     timestamp: ago(3.5) },
    ],
    internalNotes: [
      { id: "n2", from: "note", authorName: "David Chen", body: "Ticket JIRA-4523 created. Root cause: SVG bracket renderer OOM for large tournaments. Hotfix scheduled for 3.2.2 release.", timestamp: ago(3) },
    ],
    statusHistory: sh([
      { event: "Opened",   actor: "System",       h: 6,   note: "Enquiry submitted via Player Contact Us form" },
      { event: "Viewed",   actor: "David Chen",   h: 5.5, note: "Admin opened enquiry — status advanced to In Progress" },
      { event: "Replied",  actor: "David Chen",   h: 4,   note: "Email sent to fatima.z@icloud.com — Re: Your Enquiry [ENQ-20260221-003]" },
    ]),
  },

  // ── 4. General Enquiry — Facility Provider — Resolved ─────
  {
    id: "ENQ-20260218-001",
    subject: "Request to become a service provider on the platform",
    category: "General Inquiry",
    message:
      "Hello, I own a sports facility in Abu Dhabi (2 padel courts + 1 football pitch) and I'm interested in listing my venue on Playzoon. Could you please guide me through the registration process? What documents do I need and how long does verification take?",
    submitterName: "Hassan Bakr",
    submitterEmail: "h.bakr@facilitygroup.ae",
    submitterPhone: "+971-2-445-6789",
    accountType: "Facility Provider",
    submitterId: "USR-9012",
    isGuest: false,
    status: "Resolved",
    assignedTo: "Sarah Johnson",
    submittedAt: ago(72),
    lastUpdated: ago(8),
    attachments: [],
    thread: [
      { id: "t5", from: "admin", authorName: "Sarah Johnson", body: "Hi Hassan! Welcome to Playzoon. To register as a provider, please visit playzoon.com/provider-signup. You'll need: 1) Trade license copy, 2) Facility photos (minimum 5), 3) Floor plan, 4) Insurance certificate. Verification typically takes 2-3 business days.", timestamp: ago(68) },
      { id: "t6", from: "user",  authorName: "Hassan Bakr",   body: "Thank you! I've submitted the application with all documents. Looking forward to going live.",                                                                                                                              timestamp: ago(48) },
      { id: "t7", from: "admin", authorName: "Sarah Johnson", body: "Great news! Your application has been approved and your facility is now live on the platform. Our onboarding team will reach out to help you set up your availability calendar. Welcome aboard!",                           timestamp: ago(8)  },
    ],
    internalNotes: [],
    statusHistory: sh([
      { event: "Opened",   actor: "System",         h: 72 },
      { event: "Viewed",   actor: "Sarah Johnson",  h: 70 },
      { event: "Replied",  actor: "Sarah Johnson",  h: 68 },
      { event: "Replied",  actor: "Sarah Johnson",  h: 8  },
      { event: "Resolved", actor: "Sarah Johnson",  h: 8,  note: "Enquiry marked as resolved — provider successfully onboarded" },
    ]),
  },

  // ── 5. Payment Issue — Player — Resolved ──────────────────
  {
    id: "ENQ-20260219-001",
    subject: "Charged twice for the same booking — need immediate refund",
    category: "Payment Issue",
    message:
      "I was charged twice for booking BK-78445 at AquaSplash Waterpark. The first payment went through but the app showed an error, so I tried again and it charged me a second time. Total overcharge is AED 150. I need the duplicate charge refunded to my card immediately. This is unacceptable.",
    submitterName: "Noor Al-Mutawa",
    submitterEmail: "noor.m@yahoo.com",
    submitterPhone: "+971-50-888-9999",
    accountType: "Player",
    submitterId: "USR-2233",
    isGuest: false,
    status: "Resolved",
    assignedTo: "Omar Fadel",
    submittedAt: ago(48),
    lastUpdated: ago(12),
    attachments: [
      { id: "att5", name: "bank_statement.pdf",          type: "pdf",   url: "#", size: "340 KB" },
      { id: "att6", name: "double_charge_evidence.png",  type: "image", url: "#", size: "198 KB" },
    ],
    thread: [
      { id: "t8",  from: "admin", authorName: "Omar Fadel",      body: "Hi Noor, I sincerely apologize for the inconvenience. I've confirmed the duplicate charge in our payment system. I've initiated a refund of AED 150 to your card ending in ****4521. Please allow 5-7 business days for it to reflect.", timestamp: ago(40) },
      { id: "t9",  from: "user",  authorName: "Noor Al-Mutawa",  body: "Thank you for the quick resolution. I'll check my statement in a few days.",                                                                                                                                                        timestamp: ago(36) },
      { id: "t10", from: "admin", authorName: "Omar Fadel",      body: "Just a follow-up — the refund has been processed by our payment gateway (Ref: RF-99812). You should see it reflected soon. Again, we apologize for the inconvenience.",                                                               timestamp: ago(12) },
    ],
    internalNotes: [
      { id: "n3", from: "note", authorName: "Omar Fadel", body: "Root cause: payment gateway timeout caused retry. Added to known issues list. Refund RF-99812 processed via Stripe.", timestamp: ago(38) },
    ],
    statusHistory: sh([
      { event: "Opened",   actor: "System",      h: 48 },
      { event: "Viewed",   actor: "Omar Fadel",  h: 46 },
      { event: "Replied",  actor: "Omar Fadel",  h: 40, note: "Email sent to noor.m@yahoo.com — Re: Your Enquiry [ENQ-20260219-001]" },
      { event: "Replied",  actor: "Omar Fadel",  h: 12 },
      { event: "Resolved", actor: "Omar Fadel",  h: 12, note: "Refund confirmed. Enquiry marked as resolved." },
    ]),
  },

  // ── 6. Feedback (Complaint) — Player — In Progress — Escalated
  {
    id: "ENQ-20260216-001",
    subject: "Facility was in terrible condition — formal complaint",
    category: "Feedback",
    message:
      "I booked the outdoor football pitch at XYZ Sports Complex on Feb 15. The field was in horrible condition — uneven surface, no working floodlights (the game was at 8 PM), broken goal posts, and the changing rooms were filthy. This is not what was shown in the listing photos. I demand a full refund and I want this facility to be reviewed and penalised. I have video evidence.",
    submitterName: "Rashid Al-Mansoori",
    submitterEmail: "rashid.m@gmail.com",
    submitterPhone: "+971-55-111-2233",
    accountType: "Player",
    submitterId: "USR-5544",
    isGuest: false,
    status: "Open",
    assignedTo: "Layla Abbas",
    submittedAt: ago(120),
    lastUpdated: ago(4),
    attachments: [
      { id: "att7", name: "field_condition_video.mp4",  type: "video", url: "#", size: "15.2 MB" },
      { id: "att8", name: "listing_vs_reality.png",     type: "image", url: "#", size: "890 KB"  },
    ],
    thread: [
      { id: "t11", from: "admin", authorName: "Layla Abbas",         body: "Dear Rashid, thank you for bringing this to our attention. We take facility quality very seriously. I've reviewed your complaint and the evidence provided. We will: 1) Process a full refund for your booking, 2) Issue a formal warning to the facility, 3) Schedule an inspection within 48 hours. I'll keep you updated.", timestamp: ago(108) },
      { id: "t12", from: "user",  authorName: "Rashid Al-Mansoori",  body: "Thank you Layla. I appreciate the prompt action. Please make sure other users don't have the same experience.",                                                                                                          timestamp: ago(96) },
      { id: "t13", from: "admin", authorName: "Layla Abbas",         body: "Update: The refund has been processed. Our quality team visited the facility today and confirmed the issues. The facility has been given 7 days to rectify all problems or face suspension from the platform.",             timestamp: ago(4) },
    ],
    internalNotes: [
      { id: "n4", from: "note", authorName: "Layla Abbas", body: "ESCALATED: This is the 3rd complaint about XYZ Sports Complex this month. Recommended suspension if issues not fixed by Feb 25. CC'd provider management team.", timestamp: ago(105) },
    ],
    statusHistory: sh([
      { event: "Opened",    actor: "System",       h: 120 },
      { event: "Viewed",    actor: "Layla Abbas",  h: 115 },
      { event: "Replied",   actor: "Layla Abbas",  h: 108 },
      { event: "Replied",   actor: "Layla Abbas",  h: 4   },
    ]),
  },

  // ── 7. Account Help — Player — Resolved ───────────────────
  {
    id: "ENQ-20260219-002",
    subject: "How to transfer wallet balance to bank account?",
    category: "Booking Issue",
    message:
      "I have AED 500 in my Playzoon wallet from cancelled bookings. How do I transfer this to my bank account? I can't find the option in the app.",
    submitterName: "Aisha Khalifa",
    submitterEmail: "aisha.k@hotmail.com",
    submitterPhone: "+971-50-444-5566",
    accountType: "Player",
    submitterId: "USR-8899",
    isGuest: false,
    status: "Resolved",
    assignedTo: "Sarah Johnson",
    submittedAt: ago(144),
    lastUpdated: ago(96),
    attachments: [],
    thread: [
      { id: "t14", from: "admin", authorName: "Sarah Johnson", body: "Hi Aisha! Currently, wallet balance can only be used for future bookings on the platform. Bank transfers are not yet supported but we're working on adding this feature. In the meantime, would you like us to process a refund to your original payment method instead?", timestamp: ago(140) },
      { id: "t15", from: "user",  authorName: "Aisha Khalifa", body: "Yes please, I'd prefer a refund to my card. Can you process that?",                                                                                                                                                              timestamp: ago(130) },
      { id: "t16", from: "admin", authorName: "Sarah Johnson", body: "Done! I've initiated a refund of AED 500 to your card ending in ****7890. Please allow 5-7 business days. Is there anything else I can help with?",                                                                              timestamp: ago(110) },
      { id: "t17", from: "user",  authorName: "Aisha Khalifa", body: "No that's all. Thank you for your help!",                                                                                                                                                                                        timestamp: ago(96)  },
    ],
    internalNotes: [],
    statusHistory: sh([
      { event: "Opened",   actor: "System",         h: 144 },
      { event: "Viewed",   actor: "Sarah Johnson",  h: 142 },
      { event: "Replied",  actor: "Sarah Johnson",  h: 140 },
      { event: "Replied",  actor: "Sarah Johnson",  h: 110 },
      { event: "Resolved", actor: "Sarah Johnson",  h: 96,  note: "Refund processed and confirmed. Enquiry resolved." },
    ]),
  },

  // ── 8. Other — Player — Open ──────────────────────────────
  {
    id: "ENQ-20260221-004",
    subject: "Training session coach didn't show up",
    category: "Other",
    message:
      "I enrolled in the 'CrossFit Fundamentals' program at FitZone Academy and had a session booked today at 7 AM. I arrived on time but the coach never showed up. No cancellation notice, nothing. I wasted my morning and the fuel to get there. I want a refund for this session and compensation.",
    submitterName: "Tariq Mansour",
    submitterEmail: "tariq.m@protonmail.com",
    submitterPhone: "+971-56-777-8899",
    accountType: "Player",
    submitterId: "USR-6677",
    isGuest: false,
    status: "Open",
    assignedTo: null,
    submittedAt: ago(1.5),
    lastUpdated: ago(1.5),
    attachments: [],
    thread: [],
    internalNotes: [],
    statusHistory: sh([
      { event: "Opened", actor: "System", h: 1.5 },
    ]),
  },

  // ── 9. Technical Issue — Facility Provider — Open ─────────
  {
    id: "ENQ-20260221-005",
    subject: "Cannot update my facility operating hours",
    category: "Technical Issue",
    message:
      "I'm a provider and I've been trying to update the operating hours for my facility (Desert Padel Club) for the past 2 days. Every time I save the changes, it reverts back to the old hours. I've tried on both the app and the website. My Ramadan hours need to be updated urgently before March 1st.",
    submitterName: "Ibrahim Al-Qadi",
    submitterEmail: "ibrahim@desertpadel.com",
    submitterPhone: "+971-4-556-7788",
    accountType: "Facility Provider",
    submitterId: "PRV-0234",
    isGuest: false,
    status: "Open",
    assignedTo: null,
    submittedAt: ago(2),
    lastUpdated: ago(2),
    attachments: [
      { id: "att9", name: "hours_not_saving_screenrec.mp4", type: "video", url: "#", size: "8.4 MB" },
    ],
    thread: [],
    internalNotes: [],
    statusHistory: sh([
      { event: "Opened", actor: "System", h: 2 },
    ]),
  },

  // ── 10. Payment Issue — Player — Resolved ─────────────────
  {
    id: "ENQ-20260220-001",
    subject: "Promotional code not applying discount correctly",
    category: "Payment Issue",
    message:
      "I have a promo code PLAY25 that's supposed to give 25% off my first booking. When I apply it, the discount only shows 10% (AED 15 instead of AED 37.50). The total booking was AED 150. Please fix this or manually adjust the price.",
    submitterName: "Laila Bint Saeed",
    submitterEmail: "laila.s@gmail.com",
    submitterPhone: "+971-55-222-3344",
    accountType: "Player",
    submitterId: "USR-1122",
    isGuest: false,
    status: "Resolved",
    assignedTo: "Omar Fadel",
    submittedAt: ago(36),
    lastUpdated: ago(18),
    attachments: [
      { id: "att10", name: "promo_discount_error.png", type: "image", url: "#", size: "156 KB" },
    ],
    thread: [
      { id: "t18", from: "admin", authorName: "Omar Fadel",       body: "Hi Laila, thank you for reporting this. I've checked the promo code PLAY25 and found that it was configured with a maximum discount cap of AED 15. However, since the promotion was advertised as a flat 25%, I've applied a wallet credit of AED 22.50 (the difference) to your account.", timestamp: ago(30) },
      { id: "t19", from: "user",  authorName: "Laila Bint Saeed", body: "I see the credit in my wallet now. Thank you for the quick fix!",                                                                                                                                                              timestamp: ago(18) },
    ],
    internalNotes: [
      { id: "n5", from: "note", authorName: "Omar Fadel", body: "Promo PLAY25 config issue — max cap was set to AED 15 by mistake. Notified promotions team to fix. Ref: PROMO-TICKET-332.", timestamp: ago(28) },
    ],
    statusHistory: sh([
      { event: "Opened",   actor: "System",      h: 36 },
      { event: "Viewed",   actor: "Omar Fadel",  h: 34 },
      { event: "Replied",  actor: "Omar Fadel",  h: 30 },
      { event: "Resolved", actor: "Omar Fadel",  h: 18, note: "Wallet credit applied. Enquiry resolved." },
    ]),
  },

  // ── 11. Feedback — Player — In Progress — Escalated ───────
  {
    id: "ENQ-20260219-003",
    subject: "Want to report an abusive player during tournament",
    category: "Feedback",
    message:
      "During the weekend padel tournament at Desert Padel Club, a player named 'Ahmed K.' was extremely abusive towards the referee and other players. He used foul language, threw his racket, and almost hit another player. Several of us have complained to the organizer but nothing was done. Please take action against this player.",
    submitterName: "Youssef Nabil",
    submitterEmail: "youssef.n@gmail.com",
    submitterPhone: "+971-50-999-0011",
    accountType: "Player",
    submitterId: "USR-3344",
    isGuest: false,
    status: "Open",
    assignedTo: "Khalid Al-Rashid",
    submittedAt: ago(48),
    lastUpdated: ago(6),
    attachments: [
      { id: "att11", name: "incident_video.mp4", type: "video", url: "#", size: "22.1 MB" },
    ],
    thread: [
      { id: "t20", from: "admin", authorName: "Khalid Al-Rashid", body: "Dear Youssef, thank you for reporting this serious matter. We have a zero-tolerance policy for abusive behavior. I've forwarded the video evidence to our trust & safety team for review. The player in question will be contacted and may face suspension pending investigation. We'll keep you informed of the outcome.", timestamp: ago(40) },
    ],
    internalNotes: [
      { id: "n6", from: "note", authorName: "Khalid Al-Rashid", body: "Player identified: USR-6789 (Ahmed Khaled). Prior warning on record from Nov 2025. Recommend 30-day suspension. Escalated to Trust & Safety.", timestamp: ago(35) },
    ],
    statusHistory: sh([
      { event: "Opened",    actor: "System",            h: 48 },
      { event: "Viewed",    actor: "Khalid Al-Rashid",  h: 46 },
      { event: "Replied",   actor: "Khalid Al-Rashid",  h: 40 },
    ]),
  },

  // ── 12. Account Help — Freelancer Coach — Open ────────────
  {
    id: "ENQ-20260221-006",
    subject: "Profile verification stuck for over 2 weeks",
    category: "Booking Issue",
    message:
      "I submitted my coach verification documents (coaching certificate, ID, and background check) on February 3rd but my profile still shows 'Verification Pending.' It's been over 2 weeks now. I'm losing potential clients because unverified coaches appear lower in search results. Please expedite.",
    submitterName: "Coach Sara Khalil",
    submitterEmail: "sara.k@coachpro.com",
    submitterPhone: "+971-56-123-4567",
    accountType: "Freelancer Coach",
    submitterId: "COA-0089",
    isGuest: false,
    status: "Open",
    assignedTo: null,
    submittedAt: ago(4),
    lastUpdated: ago(4),
    attachments: [
      { id: "att12", name: "coaching_certificate.pdf", type: "pdf", url: "#", size: "1.2 MB"  },
      { id: "att13", name: "background_check.pdf",     type: "pdf", url: "#", size: "780 KB"  },
    ],
    thread: [],
    internalNotes: [],
    statusHistory: sh([
      { event: "Opened", actor: "System", h: 4 },
    ]),
  },

  // ── 13. General Enquiry — Guest — Open (BR-124-07) ────────
  {
    id: "ENQ-20260221-007",
    subject: "Interested in listing my sports academy on Playzoon",
    category: "General Inquiry",
    message:
      "Hello, I run a multi-sport academy in Sharjah offering football, cricket, and basketball coaching for children aged 6–16. I'm interested in partnering with Playzoon to reach more families. Could you please explain the partnership model, commission structure, and onboarding process? I don't currently have a Playzoon account.",
    submitterName: "Mansoor Al-Tamimi",
    submitterEmail: "mansoor@tamimiacademy.ae",
    submitterPhone: "+971-6-567-1234",
    accountType: "Guest",
    submitterId: "",
    isGuest: true,
    status: "Open",
    assignedTo: null,
    submittedAt: ago(0.25),
    lastUpdated: ago(0.25),
    attachments: [],
    thread: [],
    internalNotes: [],
    statusHistory: sh([
      { event: "Opened", actor: "System", h: 0.25, note: "Submitted via guest Contact Us form — no platform account" },
    ]),
  },

  // ── 14. Technical Issue — Training Provider — In Progress ─
  {
    id: "ENQ-20260220-002",
    subject: "Cannot access my earnings dashboard — shows blank screen",
    category: "Technical Issue",
    message:
      "For the last 3 days, whenever I navigate to the Earnings section in my provider dashboard, it shows a completely blank white screen. I've tried on Chrome, Safari, and the mobile app — same issue on all. I need to access my earnings data urgently to prepare my monthly report. Provider ID: PRV-1122.",
    submitterName: "Hana Al-Rashidi",
    submitterEmail: "hana@sportspro.ae",
    submitterPhone: "+971-4-888-2211",
    accountType: "Training Provider",
    submitterId: "PRV-1122",
    isGuest: false,
    status: "Open",
    assignedTo: "David Chen",
    submittedAt: ago(30),
    lastUpdated: ago(8),
    attachments: [
      { id: "att14", name: "blank_dashboard.png",   type: "image", url: "#", size: "78 KB"  },
      { id: "att15", name: "console_errors.txt",    type: "doc",   url: "#", size: "4.2 KB" },
    ],
    thread: [
      { id: "t21", from: "admin", authorName: "David Chen",      body: "Hi Hana, thank you for reporting this. I've reproduced the issue on our staging environment. It appears to be a JavaScript rendering error introduced in our v4.1.2 dashboard update. I've filed a hotfix request with the engineering team (JIRA-4601). Expected resolution: 4–6 hours. I'll notify you when it's fixed.", timestamp: ago(22) },
      { id: "t22", from: "user",  authorName: "Hana Al-Rashidi", body: "Thank you David. Please expedite — I have a meeting with my accountant tomorrow morning and I need this data.",                                                                                                             timestamp: ago(18) },
    ],
    internalNotes: [
      { id: "n7", from: "note", authorName: "David Chen", body: "Root cause identified: earnings API endpoint returning 500 for providers with >5000 bookings due to query timeout. Temporary fix: increased DB query timeout. Permanent fix in progress.", timestamp: ago(20) },
    ],
    statusHistory: sh([
      { event: "Opened",   actor: "System",       h: 30 },
      { event: "Viewed",   actor: "David Chen",   h: 28 },
      { event: "Replied",  actor: "David Chen",   h: 22 },
    ]),
  },

  // ── 15. Feedback — Player — Resolved ──────────────────────
  {
    id: "ENQ-20260219-004",
    subject: "Excellent experience at Gulf Tennis Center — wanted to share",
    category: "Feedback",
    message:
      "Just wanted to send some positive feedback! I booked a tennis court at Gulf Tennis Center last Saturday through Playzoon and the experience was fantastic — easy booking flow, the court was in perfect condition, and the staff were very welcoming. The app is very intuitive. Well done to the Playzoon team and the facility. I've already recommended it to 5 friends!",
    submitterName: "Khalid Al-Fardan",
    submitterEmail: "k.alfardan@gmail.com",
    submitterPhone: "+971-55-400-1122",
    accountType: "Player",
    submitterId: "USR-4488",
    isGuest: false,
    status: "Resolved",
    assignedTo: "Sarah Johnson",
    submittedAt: ago(60),
    lastUpdated: ago(50),
    attachments: [],
    thread: [
      { id: "t23", from: "admin", authorName: "Sarah Johnson", body: "Hi Khalid, thank you so much for taking the time to share this wonderful feedback! We're delighted to hear you had such a great experience. We'll pass your kind words along to the Gulf Tennis Center team. See you on the court soon!", timestamp: ago(55) },
      { id: "t24", from: "user",  authorName: "Khalid Al-Fardan", body: "Thank you! Keep up the great work.",                                                                                                                                                                                         timestamp: ago(50) },
    ],
    internalNotes: [],
    statusHistory: sh([
      { event: "Opened",   actor: "System",        h: 60 },
      { event: "Viewed",   actor: "Sarah Johnson", h: 58 },
      { event: "Replied",  actor: "Sarah Johnson", h: 55 },
      { event: "Resolved", actor: "Sarah Johnson", h: 50, note: "Positive feedback acknowledged and forwarded to facility." },
    ]),
  },
];
