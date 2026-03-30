import { Conversation, ChatUser, ChatMessage, ChatAttachment } from "./types";

// ─── Helpers ─────────────────────────────────────────────────

const BASE = new Date(2026, 1, 25, 10, 0, 0); // Feb 25, 2026
const ago = (h: number) => new Date(BASE.getTime() - h * 3_600_000);
const dago = (d: number, h = 0) => new Date(BASE.getTime() - (d * 24 + h) * 3_600_000);

const COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
];

// ─── Users ───────────────────────────────────────────────────

const ADMIN: ChatUser = {
  id: "ADM-001", name: "Admin Support", initials: "AS", role: "Admin",
  avatarColor: "bg-[#003B95]", email: "admin@playzoon.ae", isBlocked: false,
};

const PLAYERS: ChatUser[] = [
  { id: "PLY-001", name: "Ahmed Hassan",    initials: "AH", role: "Player",  avatarColor: COLORS[0], email: "ahmed.h@gmail.com",    isBlocked: false },
  { id: "PLY-002", name: "Sara Al-Rashidi", initials: "SR", role: "Player",  avatarColor: COLORS[1], email: "sara.r@gmail.com",     isBlocked: false },
  { id: "PLY-003", name: "Omar Khalid",     initials: "OK", role: "Player",  avatarColor: COLORS[2], email: "omar.k@outlook.com",   isBlocked: false },
  { id: "PLY-004", name: "Fatima Yusuf",    initials: "FY", role: "Player",  avatarColor: COLORS[3], email: "fatima.y@gmail.com",   isBlocked: false },
  { id: "PLY-005", name: "Khalid Nasser",   initials: "KN", role: "Player",  avatarColor: COLORS[4], email: "khalid.n@hotmail.com", isBlocked: false },
  { id: "PLY-006", name: "Lena Morris",     initials: "LM", role: "Player",  avatarColor: COLORS[5], email: "lena.m@gmail.com",     isBlocked: false },
  { id: "PLY-007", name: "Tariq Al-Sayed",  initials: "TS", role: "Player",  avatarColor: COLORS[6], email: "tariq.s@yahoo.com",    isBlocked: false },
];

const PROVIDERS: ChatUser[] = [
  { id: "PRV-001", name: "Desert Padel Club",     initials: "DP", role: "Provider",         avatarColor: COLORS[7], email: "info@desertpadel.ae",    isBlocked: false },
  { id: "PRV-002", name: "Elite Sports Academy",  initials: "ES", role: "Provider",         avatarColor: COLORS[0], email: "contact@elitesports.ae", isBlocked: false },
  { id: "PRV-003", name: "Gulf Tennis Center",    initials: "GT", role: "Provider",         avatarColor: COLORS[2], email: "info@gulftennnis.ae",    isBlocked: false },
  { id: "PRV-004", name: "Coach Sara Khalil",     initials: "CK", role: "Freelancer Coach", avatarColor: COLORS[3], email: "coach.sara@playzoon.ae", isBlocked: false },
  { id: "PRV-005", name: "FitZone Academy",       initials: "FZ", role: "Provider",         avatarColor: COLORS[1], email: "hello@fitzone.ae",       isBlocked: false },
  { id: "PRV-006", name: "Champions Sports Club", initials: "CS", role: "Provider",         avatarColor: COLORS[4], email: "info@championssc.ae",    isBlocked: false },
];

// ─── Message builder ─────────────────────────────────────────

let msgSeq = 1;
function msg(ts: Date, senderId: string, senderName: string, content: string, extras: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `MSG-${String(msgSeq++).padStart(5, "0")}`, senderId, senderName, content, timestamp: ts,
    type: "text", isFlagged: false, isDeleted: false, ...extras,
  };
}
function sys(ts: Date, content: string): ChatMessage {
  return {
    id: `SYS-${String(msgSeq++).padStart(5, "0")}`, senderId: "SYSTEM", senderName: "System", content, timestamp: ts,
    type: "system", isFlagged: false, isDeleted: false,
  };
}
function imgMsg(ts: Date, senderId: string, senderName: string, content: string, attachment: ChatAttachment): ChatMessage {
  return {
    id: `MSG-${String(msgSeq++).padStart(5, "0")}`, senderId, senderName, content, timestamp: ts,
    type: "image", isFlagged: false, isDeleted: false, attachment,
  };
}
function fileMsg(ts: Date, senderId: string, senderName: string, content: string, attachment: ChatAttachment): ChatMessage {
  return {
    id: `MSG-${String(msgSeq++).padStart(5, "0")}`, senderId, senderName, content, timestamp: ts,
    type: "file", isFlagged: false, isDeleted: false, attachment,
  };
}

// ─── Conversations ───────────────────────────────────────────

// 1. Support Request — Player asks admin for booking help (unread)
const CONV_1_MSGS: ChatMessage[] = [
  msg(ago(2),   "PLY-001", "Ahmed Hassan",    "Hi, I need help with my booking BK-20260224-112. The payment went through but I didn't receive a confirmation."),
  msg(ago(1.5), "ADM-001", "Admin Support",   "Hello Ahmed! Let me look into that for you. Can you share the payment reference number?"),
  msg(ago(1),   "PLY-001", "Ahmed Hassan",    "Sure, the reference is PAY-REF-88431. I was charged AED 180."),
  msg(ago(0.5), "PLY-001", "Ahmed Hassan",    "Also, I tried calling the facility but no one picked up."),
];

// 2. User-to-User — Player & Provider normal booking chat
const CONV_2_MSGS: ChatMessage[] = [
  msg(dago(1, 8),  "PLY-002", "Sara Al-Rashidi",    "Hello, I'd like to book the CrossFit Fundamentals programme starting next week."),
  msg(dago(1, 7),  "PRV-002", "Elite Sports Academy","Hi Sara! Great choice. We have openings on Mon/Wed/Fri at 6 AM and 8 AM."),
  msg(dago(1, 6),  "PLY-002", "Sara Al-Rashidi",    "8 AM Mon/Wed works for me. How do I sign up?"),
  msg(dago(1, 5),  "PRV-002", "Elite Sports Academy","You can book directly through the app. The package is AED 450/month."),
  msg(dago(1, 4),  "PLY-002", "Sara Al-Rashidi",    "Done! Just completed the booking. See you Monday!"),
  sys(dago(1, 3),  "Booking BK-20260224-201 confirmed: CrossFit Fundamentals — Mon 24 Feb, 8:00 AM"),
];

// 3. Provider-to-Admin — Provider asks admin about commission rates
const CONV_3_MSGS: ChatMessage[] = [
  msg(dago(0, 6), "PRV-001", "Desert Padel Club",  "Hi Admin, we noticed our commission rate changed from 12% to 15%. Was this intentional?"),
  msg(dago(0, 5), "ADM-001", "Admin Support",      "Hello! Yes, the new commission structure was announced on Feb 20th. It applies to all facility providers."),
  msg(dago(0, 4), "PRV-001", "Desert Padel Club",  "We didn't receive any notification about this. Can you check?"),
  msg(dago(0, 3), "ADM-001", "Admin Support",      "Let me check the notification logs. One moment please."),
  msg(dago(0, 2), "ADM-001", "Admin Support",      "I found the issue — the email was sent to your old email address. I've updated it now and resent the notification."),
  msg(dago(0, 1), "PRV-001", "Desert Padel Club",  "Thank you for resolving that quickly!"),
];

// 4. Support Request — Player reports inappropriate provider behaviour (with flagged message)
const CONV_4_MSGS: ChatMessage[] = [
  msg(dago(2, 10), "PLY-003", "Omar Khalid",     "I need to report something. The provider I booked with sent me an inappropriate message."),
  msg(dago(2, 9),  "ADM-001", "Admin Support",   "I'm sorry to hear that, Omar. Can you share the details so we can investigate?"),
  msg(dago(2, 8),  "PLY-003", "Omar Khalid",     "Here's a screenshot of what they sent me."),
  imgMsg(dago(2, 8), "PLY-003", "Omar Khalid", "Screenshot of the inappropriate message", {
    id: "ATT-001", type: "image", url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop", name: "screenshot_chat.png", size: "1.2 MB",
  }),
  msg(dago(2, 7), "ADM-001", "Admin Support",    "Thank you for reporting this. I can see the message clearly. We'll take immediate action."),
  msg(dago(2, 6), "PLY-003", "Omar Khalid",      "Will my booking still be honoured?"),
  msg(dago(2, 5), "ADM-001", "Admin Support",    "Absolutely. We'll reassign you to another available court if needed. Your experience matters to us."),
];

// 5. User-to-User — Player & Coach scheduling (with file attachment)
const CONV_5_MSGS: ChatMessage[] = [
  msg(dago(3, 10), "PLY-004", "Fatima Yusuf",      "Hi Coach Sara, I'm looking for personal training sessions focused on functional fitness."),
  msg(dago(3, 9),  "PRV-004", "Coach Sara Khalil",  "Hi Fatima! I'd love to help. I specialise in functional fitness. What's your current fitness level?"),
  msg(dago(3, 8),  "PLY-004", "Fatima Yusuf",      "I'd say intermediate. I've been working out 3x a week for the past year."),
  msg(dago(3, 7),  "PRV-004", "Coach Sara Khalil",  "Great foundation! Here's a sample training plan I'd recommend for you:"),
  fileMsg(dago(3, 7), "PRV-004", "Coach Sara Khalil", "Your personalised 4-week plan", {
    id: "ATT-002", type: "file", url: "#", name: "Training_Plan_Fatima.pdf", size: "2.4 MB",
  }),
  msg(dago(3, 6), "PLY-004", "Fatima Yusuf",       "This looks amazing! When can we start?"),
  msg(dago(3, 5), "PRV-004", "Coach Sara Khalil",   "I have Sunday 7 PM and Tuesday 6 PM available. Which works better?"),
  msg(dago(3, 4), "PLY-004", "Fatima Yusuf",       "Sunday 7 PM is perfect. Booking it now!"),
  sys(dago(3, 3), "Booking BK-20260222-305 confirmed: Personal Training — Sun 23 Feb, 7:00 PM"),
];

// 6. User-to-User — Tennis court booking with flagged inappropriate message
const CONV_6_MSGS: ChatMessage[] = [
  msg(dago(4, 8),  "PLY-005", "Khalid Nasser",      "Hi, I wanted to book tennis court 3 for next Saturday."),
  msg(dago(4, 7),  "PRV-003", "Gulf Tennis Center",  "Hello Khalid! Court 3 is available from 2 PM to 6 PM on Saturday."),
  msg(dago(4, 6),  "PLY-005", "Khalid Nasser",      "Great, I'll take the 4 PM slot."),
  msg(dago(4, 5),  "PRV-003", "Gulf Tennis Center",  "Confirmed! AED 120 for 1 hour."),
  msg(dago(3, 10), "PLY-005", "Khalid Nasser",      "Hey, can you give me your personal number? I want to deal directly next time to avoid platform fees."),
  msg(dago(3, 9),  "PRV-003", "Gulf Tennis Center",  "I'm sorry, all bookings must go through the platform per our agreement."),
  msg(dago(3, 8),  "PLY-005", "Khalid Nasser",
    "Come on, don't be such a robot. Give me your number. We can do cash deals. Nobody needs to know — the platform takes too much anyway.",
    { isFlagged: true, flagReason: "Attempting to take bookings off-platform" }),
];

// 7. Support Request — Provider needs help with payout (unread)
const CONV_7_MSGS: ChatMessage[] = [
  msg(ago(4),   "PRV-005", "FitZone Academy",  "Hello, our payout for January hasn't been processed yet. It's been 25 days."),
  msg(ago(3.5), "ADM-001", "Admin Support",    "Hi FitZone! Let me check the payout status for your account."),
  msg(ago(3),   "ADM-001", "Admin Support",    "I can see the payout was held due to a pending bank verification. Your updated bank details need to be verified first."),
  msg(ago(2.5), "PRV-005", "FitZone Academy",  "We submitted the new bank details on Feb 10th. How long does verification take?"),
  msg(ago(2),   "PRV-005", "FitZone Academy",  "Also, can you send us the pending payout summary?"),
  fileMsg(ago(1.5), "ADM-001", "Admin Support", "Here's your January payout summary", {
    id: "ATT-003", type: "file", url: "#", name: "FitZone_Payout_Jan2026.pdf", size: "856 KB",
  }),
  msg(ago(1),   "ADM-001", "Admin Support",    "Bank verification typically takes 3-5 business days. I've escalated yours for priority review."),
  msg(ago(0.3), "PRV-005", "FitZone Academy",  "Thank you! That's very helpful."),
];

// 8. User-to-User — Simple padel booking
const CONV_8_MSGS: ChatMessage[] = [
  msg(dago(0, 5), "PLY-006", "Lena Morris",        "Hi! Do you have any padel courts available this weekend?"),
  msg(dago(0, 4), "PRV-001", "Desert Padel Club",   "Hello Lena! We have Court 1 at 10 AM and Court 2 at 3 PM on Saturday."),
  msg(dago(0, 3), "PLY-006", "Lena Morris",        "Court 2 at 3 PM sounds perfect. Can I bring my own racket?"),
  msg(dago(0, 2), "PRV-001", "Desert Padel Club",   "Absolutely! We provide balls. Racket rental is optional at AED 20."),
  msg(dago(0, 1), "PLY-006", "Lena Morris",        "Awesome, booking now!"),
  sys(dago(0, 0), "Booking BK-20260225-410 confirmed: Padel Court 2 — Sat 1 Mar, 3:00 PM"),
];

// 9. User-to-User — Football academy enquiry
const CONV_9_MSGS: ChatMessage[] = [
  msg(dago(1, 6),  "PLY-007", "Tariq Al-Sayed",       "Good morning! I'd like to know about your junior football programme."),
  msg(dago(1, 5),  "PRV-006", "Champions Sports Club", "Morning Tariq! We have U-12 and U-15 programmes. How old is your child?"),
  msg(dago(1, 4),  "PLY-007", "Tariq Al-Sayed",       "He's 11. What's the schedule and pricing?"),
  msg(dago(1, 3),  "PRV-006", "Champions Sports Club", "U-12 is Saturdays 9-11 AM. AED 350/month. First session is a free trial!"),
  msg(dago(1, 2),  "PLY-007", "Tariq Al-Sayed",       "That's great! We'll come this Saturday."),
  msg(dago(1, 1),  "PRV-006", "Champions Sports Club", "Wonderful! Please arrive 10 minutes early for registration."),
];

// 10. Provider-to-Admin — Provider asks about listing verification
const CONV_10_MSGS: ChatMessage[] = [
  msg(dago(5, 8),  "PRV-002", "Elite Sports Academy", "Hi Admin, our new facility listing has been pending verification for 5 days. Can you expedite?"),
  msg(dago(5, 7),  "ADM-001", "Admin Support",        "Hello Elite Sports! Let me check the verification queue."),
  msg(dago(5, 6),  "ADM-001", "Admin Support",        "I see — the listing is missing the facility insurance document. Can you upload it?"),
  msg(dago(5, 5),  "PRV-002", "Elite Sports Academy", "I didn't realise that was required. Uploading now."),
  imgMsg(dago(5, 4), "PRV-002", "Elite Sports Academy", "Insurance certificate uploaded", {
    id: "ATT-004", type: "image", url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop", name: "insurance_cert.jpg", size: "3.1 MB",
  }),
  msg(dago(5, 3),  "ADM-001", "Admin Support",        "Received! I'll fast-track the verification. You should be live within 24 hours."),
  msg(dago(5, 2),  "PRV-002", "Elite Sports Academy", "Thank you so much!"),
];

// 11. Support Request — Player blocked from booking
const CONV_11_MSGS: ChatMessage[] = [
  msg(dago(6, 4), "PLY-001", "Ahmed Hassan",    "Hi, I'm trying to book a court but the system says my account is restricted. What's going on?"),
  msg(dago(6, 3), "ADM-001", "Admin Support",   "Hello Ahmed. Let me check your account status."),
  msg(dago(6, 2), "ADM-001", "Admin Support",   "I see that you had 3 consecutive no-shows which triggered an automatic 7-day booking restriction."),
  msg(dago(6, 1), "PLY-001", "Ahmed Hassan",    "I had emergencies! Is there any way to lift the restriction?"),
  msg(dago(6, 0), "ADM-001", "Admin Support",   "I understand. I've submitted an appeal on your behalf. You should regain access within 24 hours."),
];

// ─── Build all conversations ──────────────────────────────────

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "CONV-001", type: "support", participants: [PLAYERS[0], ADMIN],
    messages: CONV_1_MSGS, unreadCount: 2, isSupport: true,
    createdAt: ago(2), updatedAt: ago(0.5),
  },
  {
    id: "CONV-002", type: "user-to-user", participants: [PLAYERS[1], PROVIDERS[1]],
    messages: CONV_2_MSGS, unreadCount: 0, isSupport: false,
    createdAt: dago(1, 8), updatedAt: dago(1, 3),
  },
  {
    id: "CONV-003", type: "provider-to-admin", participants: [PROVIDERS[0], ADMIN],
    messages: CONV_3_MSGS, unreadCount: 0, isSupport: false,
    createdAt: dago(0, 6), updatedAt: dago(0, 1),
  },
  {
    id: "CONV-004", type: "support", participants: [PLAYERS[2], ADMIN],
    messages: CONV_4_MSGS, unreadCount: 0, isSupport: true,
    createdAt: dago(2, 10), updatedAt: dago(2, 5),
  },
  {
    id: "CONV-005", type: "user-to-user", participants: [PLAYERS[3], PROVIDERS[3]],
    messages: CONV_5_MSGS, unreadCount: 0, isSupport: false,
    createdAt: dago(3, 10), updatedAt: dago(3, 3),
  },
  {
    id: "CONV-006", type: "user-to-user", participants: [PLAYERS[4], PROVIDERS[2]],
    messages: CONV_6_MSGS, unreadCount: 1, isSupport: false,
    createdAt: dago(4, 8), updatedAt: dago(3, 8),
  },
  {
    id: "CONV-007", type: "support", participants: [PROVIDERS[4], ADMIN],
    messages: CONV_7_MSGS, unreadCount: 1, isSupport: true,
    createdAt: ago(4), updatedAt: ago(0.3),
  },
  {
    id: "CONV-008", type: "user-to-user", participants: [PLAYERS[5], PROVIDERS[0]],
    messages: CONV_8_MSGS, unreadCount: 0, isSupport: false,
    createdAt: dago(0, 5), updatedAt: dago(0, 0),
  },
  {
    id: "CONV-009", type: "user-to-user", participants: [PLAYERS[6], PROVIDERS[5]],
    messages: CONV_9_MSGS, unreadCount: 0, isSupport: false,
    createdAt: dago(1, 6), updatedAt: dago(1, 1),
  },
  {
    id: "CONV-010", type: "provider-to-admin", participants: [PROVIDERS[1], ADMIN],
    messages: CONV_10_MSGS, unreadCount: 0, isSupport: false,
    createdAt: dago(5, 8), updatedAt: dago(5, 2),
  },
  {
    id: "CONV-011", type: "support", participants: [PLAYERS[0], ADMIN],
    messages: CONV_11_MSGS, unreadCount: 0, isSupport: true,
    createdAt: dago(6, 4), updatedAt: dago(6, 0),
  },
];

export const ADMIN_USER = ADMIN;
