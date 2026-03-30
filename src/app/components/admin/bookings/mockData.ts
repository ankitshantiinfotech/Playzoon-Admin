// ─── Booking Management — Mock Data (SCR-ADM-019 / SCR-ADM-020) ────────────
// No external dependencies — fully self-contained realistic GCC data.

import type {
  Booking,
  BookingType,
  BookingStatus,
  PaymentStatus,
  BookingFinancials,
  RefundRecord,
  TimelineEvent,
  BookingDependant,
  AuditTrailEntry,
} from "./types";

// ─── Seed pools ──────────────────────────────────────────────────────────────

const PLAYERS = [
  { id: "pl-01", name: "Ahmed Al-Rashid",   email: "ahmed.rashid@gmail.com",   phone: "+966 50 123 4567" },
  { id: "pl-02", name: "Mohammed Al-Farsi", email: "m.alfarsi@hotmail.com",    phone: "+966 55 234 5678" },
  { id: "pl-03", name: "Khalid Al-Otaibi",  email: "khalid.otaibi@outlook.com",phone: "+966 33 345 6789" },
  { id: "pl-04", name: "Faisal Al-Ghamdi",  email: "faisal.ghamdi@yahoo.com",  phone: "+966 60 456 7890" },
  { id: "pl-05", name: "Omar Al-Zahrawi",   email: "omar.zahrawi@gmail.com",   phone: "+966 39 567 8901" },
  { id: "pl-06", name: "Ali Nouri Hassan",  email: "ali.nouri@mail.com",       phone: "+966 55 678 9012" },
  { id: "pl-07", name: "Tariq Al-Mansouri", email: "tariq.mansouri@icloud.com",phone: "+966 50 789 0123" },
  { id: "pl-08", name: "Hassan Al-Jabri",   email: "hassan.jabri@gmail.com",   phone: "+966 44 890 1234" },
  { id: "pl-09", name: "Yousef Al-Harthi",  email: "yousef.harthi@outlook.com",phone: "+966 55 901 2345" },
  { id: "pl-10", name: "Ibrahim Al-Shamri", email: "ibrahim.shamri@hotmail.com",phone: "+966 56 012 3456" },
  { id: "pl-11", name: "Sara Al-Balushi",   email: "sara.balushi@gmail.com",   phone: "+966 36 123 4567" },
  { id: "pl-12", name: "Nadia Haddad",      email: "nadia.haddad@yahoo.com",   phone: "+966 55 234 5678" },
  { id: "pl-13", name: "Deleted User",      email: "—",                        phone: "—" },
  { id: "pl-14", name: "Reem Al-Shehhi",    email: "reem.shehhi@icloud.com",   phone: "+966 59 456 7890" },
  { id: "pl-15", name: "Amira Yousef",      email: "amira.yousef@outlook.com", phone: "+966 55 567 8901" },
];

type ProviderType = "Facility" | "Training" | "Coach" | "Tournament";

const PROVIDERS: Record<ProviderType, { id: string; name: string; email: string; phone: string; business?: string }[]> = {
  Facility: [
    { id: "fac-01", name: "Al Wasl Sports Complex",  email: "bookings@alwasl-sports.sa",  phone: "+966 11 321 0000", business: "Al Wasl Sports LLC" },
    { id: "fac-02", name: "Lusail Sports Hub",       email: "info@lusailhub.sa",          phone: "+966 11 555 0001", business: "Lusail Sports Group" },
    { id: "fac-03", name: "King Fahd Sports Arena",  email: "reservations@kfsa.sa",       phone: "+966 11 222 3333", business: "KFSA Corp" },
    { id: "fac-04", name: "National Sports Club",    email: "nsc@sportkw.sa",             phone: "+966 12 233 4455", business: "National Sports" },
  ],
  Training: [
    { id: "trn-01", name: "Desert Sports Academy",   email: "training@desertacademy.sa",  phone: "+966 11 400 1100", business: "Desert Academy Co" },
    { id: "trn-02", name: "Elite Training Center",   email: "elite@trainingsa.com",       phone: "+966 12 333 4444", business: "Elite Sports Group" },
    { id: "trn-03", name: "Doha Sports Institute",   email: "dsi@dohasports.sa",          phone: "+966 13 444 5555", business: "DSI Holdings" },
  ],
  Coach: [
    { id: "coa-01", name: "Ahmad Al-Rashidi",  email: "coach@rashidi.sa",     phone: "+966 55 100 0001" },
    { id: "coa-02", name: "Yousef Harthi",     email: "y.harthi@coaching.sa", phone: "+966 50 200 0002" },
    { id: "coa-03", name: "Hassan Mostafa",    email: "h.mostafa@coaching.sa",phone: "+966 55 300 0003" },
  ],
  Tournament: [
    { id: "thost-01", name: "Ahmed Al-Rashid (Host)", email: "ahmed.rashid@gmail.com",    phone: "+966 50 123 4567" },
    { id: "thost-02", name: "Sara Al-Balushi (Host)", email: "sara.balushi@gmail.com",    phone: "+966 36 123 4567" },
  ],
};

const ENTITIES: Record<BookingType, { name: string; location: string; detail: string; sport: string }[]> = {
  Facility: [
    { name: "Main Court A",    location: "Riyadh, Al Olaya",        detail: "Court 1 — Futsal",       sport: "Football" },
    { name: "Pitch 3",         location: "Jeddah, Al Hamra",        detail: "5-a-side Turf",          sport: "Football" },
    { name: "Indoor Arena",    location: "Riyadh, Al Malaz",        detail: "Hall B — Badminton",     sport: "Badminton" },
    { name: "Tennis Court 2",  location: "Dammam, Corniche",        detail: "Hard Court — Singles",   sport: "Tennis" },
    { name: "Swimming Pool",   location: "Riyadh, King Abdullah",   detail: "Lane 4 — 25m Pool",     sport: "Swimming" },
    { name: "Squash Arena",    location: "Jeddah, Tahlia",          detail: "Court 3 — Premium",      sport: "Squash" },
    { name: "Cricket Ground",  location: "Riyadh, DQ",              detail: "Net Practice Zone",      sport: "Cricket" },
  ],
  Training: [
    { name: "Morning Drill",    location: "Riyadh, Al Malaz",       detail: "Batch A — Advanced",     sport: "Football" },
    { name: "Evening Batch",    location: "Jeddah, Al Hamra",       detail: "Batch C — Intermediate", sport: "Football" },
    { name: "Youth Program",    location: "Riyadh, Al Olaya",       detail: "U-14 Football",          sport: "Football" },
    { name: "Fitness Camp",     location: "Dammam, Corniche",       detail: "Strength & Conditioning",sport: "Fitness" },
    { name: "Swim Squad",       location: "Riyadh, King Abdullah",  detail: "Competitive Track",      sport: "Swimming" },
  ],
  Coach: [
    { name: "1-on-1 Session",       location: "Home visit — Riyadh",    detail: "Football Skills",   sport: "Football" },
    { name: "Private Training",     location: "King Fahd Complex",      detail: "Goalkeeping",       sport: "Football" },
    { name: "Group Session (4)",    location: "Jeddah Sports Club",     detail: "Fitness & Agility", sport: "Fitness" },
    { name: "Performance Session",  location: "Riyadh Training Zone",   detail: "Speed & Power",     sport: "Athletics" },
  ],
  Tournament: [
    { name: "Riyadh Tennis Open 2026",        location: "Riyadh, Al Olaya",   detail: "Singles Knockout",    sport: "Tennis" },
    { name: "Jeddah Padel Championship 2026", location: "Jeddah, Al Hamra",   detail: "Doubles Round Robin", sport: "Padel" },
    { name: "KSA Badminton Cup 2026",         location: "Dammam, Corniche",   detail: "Team Tournament",     sport: "Badminton" },
  ],
};

const PERIODS: Record<BookingType, string[]> = {
  Facility:   ["60 min", "90 min", "120 min", "Full Day"],
  Training:   ["60 min", "90 min", "Per Session"],
  Coach:      ["60 min", "90 min", "Per Session"],
  Tournament: ["Per Event", "Full Day"],
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function isoDate(daysFromNow: number, hour = 10, minute = 0): string {
  const d = new Date("2026-02-21T00:00:00Z");
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ─── Generator helpers ────────────────────────────────────────────────────────

function mkFinancials(
  grossBase: number,
  discountAmt: number,
  commPct: number,
  taxPct: number,
  paidDaysFromNow: number,
  method: BookingFinancials["paymentMethod"],
  seq: number,
  refundHistory: RefundRecord[] = [],
  discountCode?: string,
): BookingFinancials {
  const grossAmount = grossBase;
  const discount = discountAmt;
  const subtotal = grossAmount - discount;
  const commissionAmount = Math.round(subtotal * commPct) / 100;
  const taxAmount = Math.round((subtotal - commissionAmount) * taxPct) / 100;
  const netPayout = subtotal - commissionAmount - taxAmount;
  return {
    grossAmount,
    discount,
    discountCode,
    subtotal,
    commissionPct: commPct,
    commissionAmount,
    taxLabel: "VAT",
    taxPct,
    taxAmount,
    netPayout,
    paymentMethod: method,
    gatewayRef: `MF-${Math.abs(seq * 31337).toString(16).slice(0, 8).toUpperCase()}`,
    paidAt: isoDate(paidDaysFromNow - 1),
    transactionId: `TXN-${String(seq).padStart(6, "0")}`,
    refundHistory,
  };
}

function mkAuditTrail(status: BookingStatus, createdDate: string, bookingDate: string, playerName: string): AuditTrailEntry[] {
  const entries: AuditTrailEntry[] = [
    { id: "a-1", timestamp: createdDate, event: "Booking created", actor: playerName, details: "New booking submitted" },
    { id: "a-2", timestamp: isoDate(-5, 10), event: "Payment received", actor: "System", details: "Payment confirmed via gateway" },
  ];
  if (status === "Upcoming" || status === "Ongoing" || status === "Completed") {
    entries.push({ id: "a-3", timestamp: isoDate(-4, 11), event: "Status changed to Upcoming", actor: "System", oldValue: "Created", newValue: "Upcoming" });
  }
  if (status === "Ongoing" || status === "Completed") {
    entries.push({ id: "a-4", timestamp: bookingDate, event: "Status changed to Ongoing", actor: "System", oldValue: "Upcoming", newValue: "Ongoing" });
  }
  if (status === "Completed") {
    entries.push({ id: "a-5", timestamp: isoDate(1, 12), event: "Status changed to Completed", actor: "System", oldValue: "Ongoing", newValue: "Completed" });
  }
  if (status === "Cancelled") {
    entries.push({ id: "a-6", timestamp: isoDate(-3, 14), event: "Booking cancelled", actor: playerName, details: "Cancellation requested" });
  }
  return entries;
}

// ─── Booking factory ──────────────────────────────────────────────────────────

function mkBooking(
  seq: number,
  type: BookingType,
  status: BookingStatus,
  paymentStatus: PaymentStatus,
  playerIdx: number,
  providerIdx: number,
  entityIdx: number,
  scheduledDays: number,
  scheduledHour: number,
  duration: number,
  gross: number,
  discount: number,
  commPct: number,
  payMethod: BookingFinancials["paymentMethod"],
  override?: Partial<Booking>,
): Booking {
  const player = PLAYERS[playerIdx % PLAYERS.length];
  const providerPool = PROVIDERS[type];
  const provider = providerPool[providerIdx % providerPool.length];
  const entityPool = ENTITIES[type];
  const entity = entityPool[entityIdx % entityPool.length];
  const periodPool = PERIODS[type];
  const period = periodPool[entityIdx % periodPool.length];
  const bookingDate = isoDate(scheduledDays, scheduledHour);
  const createdDate = isoDate(scheduledDays - 7, 9);
  const financials = mkFinancials(gross, discount, commPct, 15, scheduledDays - 3, payMethod, seq, override?.financials?.refundHistory ?? []);

  const dependants: BookingDependant[] = [];
  if (type !== "Coach") {
    dependants.push({
      id: `dep-${seq}-1`,
      name: `Guest of ${player.name.split(" ")[0]}`,
      age: 14,
      gender: "Male",
      relation: "Son",
      status: "Active",
    });
  }

  const timeline: TimelineEvent[] = [
    { label: "Booking Created", timestamp: createdDate, actor: player.name },
    { label: "Payment Confirmed", timestamp: isoDate(scheduledDays - 3, 10), actor: "System" },
  ];
  if (status !== "Cancelled" && status !== "Created") {
    timeline.push({ label: "Booking Confirmed", timestamp: isoDate(scheduledDays - 2, 11), actor: "System" });
  }
  if (status === "Ongoing" || status === "Completed") {
    timeline.push({ label: "Session Started", timestamp: isoDate(scheduledDays, scheduledHour), actor: "System" });
  }
  if (status === "Completed") {
    timeline.push({ label: "Session Completed", timestamp: isoDate(scheduledDays, scheduledHour + 1), actor: "System" });
  }
  if (status === "Cancelled") {
    timeline.push({ label: "Booking Cancelled", timestamp: isoDate(scheduledDays - 1, 14), actor: player.name });
  }

  const auditTrail = mkAuditTrail(status, createdDate, bookingDate, player.name);

  return {
    id: `BK-${String(seq).padStart(5, "0")}`,
    type,
    status,
    paymentStatus,
    player: { id: player.id, name: player.name, email: player.email, phone: player.phone },
    provider: {
      id: provider.id,
      name: provider.name,
      type,
      email: provider.email,
      phone: provider.phone,
      businessName: provider.business,
    },
    entity: {
      id: `ent-${seq}`,
      name: entity.name,
      location: entity.location,
      detail: entity.detail,
      sport: entity.sport,
    },
    bookingDate,
    duration,
    period,
    playersCount: type === "Coach" ? 1 : 2,
    dependants,
    financials,
    timeline,
    auditTrail,
    bookingSource: seq % 3 === 0 ? "Web" : "App",
    createdAt: createdDate,
    flagged: false,
    ...override,
  };
}

// ─── The 65 bookings ──────────────────────────────────────────────────────────

export const MOCK_BOOKINGS: Booking[] = [
  // ── UPCOMING (15) ──
  mkBooking(1,  "Facility",   "Upcoming", "Paid",  0, 0, 0, 5, 16, 90,  350, 0,  10, "Credit Card"),
  mkBooking(2,  "Training",   "Upcoming", "Paid",  1, 0, 0, 6, 9,  60,  450, 0,  8,  "Apple Pay"),
  mkBooking(3,  "Coach",      "Upcoming", "Paid",  2, 0, 0, 4, 11, 60,  600, 0,  12, "Credit Card"),
  mkBooking(4,  "Facility",   "Upcoming", "Paid",  3, 1, 1, 7, 18, 60,  280, 0,  10, "Google Pay"),
  mkBooking(5,  "Training",   "Upcoming", "Paid",  5, 1, 1, 10, 7, 90,  380, 25, 8,  "Apple Pay"),
  mkBooking(6,  "Facility",   "Upcoming", "Paid",  6, 2, 2, 12, 20, 60, 200, 0,  10, "Credit Card"),
  mkBooking(7,  "Coach",      "Upcoming", "Paid",  7, 1, 1, 9, 10, 90,  750, 0,  12, "Apple Pay"),
  mkBooking(8,  "Facility",   "Upcoming", "Pending", 9, 3, 3, 11, 8, 60, 230, 0,  10, "Wallet"),
  mkBooking(9,  "Training",   "Upcoming", "Paid",  10, 2, 2, 15, 9, 60, 420, 0,  8,  "Credit Card"),
  mkBooking(10, "Tournament", "Upcoming", "Paid",  0, 0, 0, 8, 14, 180, 100, 0, 10,  "Credit Card"),
  mkBooking(11, "Facility",   "Upcoming", "Paid",  0, 0, 4, 17, 17, 90, 310, 0,  10, "Google Pay"),
  mkBooking(12, "Facility",   "Upcoming", "Pending", 4, 0, 5, 19, 19, 60, 400, 0, 10, "Credit Card"),
  mkBooking(13, "Tournament", "Upcoming", "Paid",  1, 1, 1, 20, 8, 240, 150, 0, 10,  "Wallet"),
  mkBooking(14, "Coach",      "Upcoming", "Paid",  8, 2, 3, 21, 10, 90, 800, 0, 12,  "Credit Card"),
  mkBooking(15, "Facility",   "Upcoming", "Paid",  1, 1, 6, 22, 18, 60, 270, 0, 10,  "Apple Pay"),

  // ── CREATED (3) ──
  mkBooking(16, "Facility",   "Created",  "Pending", 11, 2, 0, 25, 10, 60, 350, 0, 10, "Credit Card"),
  mkBooking(17, "Training",   "Created",  "Pending", 3, 0, 3, 26, 7,  90, 200, 0, 7,  "Google Pay"),
  mkBooking(18, "Tournament", "Created",  "Pending", 5, 0, 2, 28, 9, 180,  75, 0, 10, "Apple Pay"),

  // ── ONGOING (4) ──
  mkBooking(19, "Facility",   "Ongoing",  "Paid", 6, 3, 1, 0, 14, 120, 450, 0, 10, "Credit Card"),
  mkBooking(20, "Training",   "Ongoing",  "Paid", 7, 1, 0, 0, 9,  90,  380, 0, 8,  "Apple Pay"),
  mkBooking(21, "Coach",      "Ongoing",  "Paid", 8, 0, 2, 0, 11, 60,  550, 0, 12, "Wallet"),
  mkBooking(22, "Tournament", "Ongoing",  "Paid", 9, 1, 0, 0, 10, 300, 120, 0, 10, "Credit Card"),

  // ── COMPLETED (20) ──
  mkBooking(23, "Facility",   "Completed", "Paid", 1, 0, 0, -1,  9,  90,  350, 0,  10, "Credit Card"),
  mkBooking(24, "Training",   "Completed", "Paid", 3, 0, 0, -1,  14, 60,  420, 0,  8,  "Apple Pay"),
  mkBooking(25, "Coach",      "Completed", "Paid", 5, 1, 1, -2,  11, 60,  600, 0,  12, "Credit Card"),
  mkBooking(26, "Facility",   "Completed", "Paid", 9, 2, 2, -4,  8,  60,  250, 0,  10, "Wallet"),
  mkBooking(27, "Training",   "Completed", "Paid", 11, 1, 1, -5, 9,  90,  380, 25, 8,  "Apple Pay"),
  mkBooking(28, "Coach",      "Completed", "Paid", 0, 2, 3, -6,  10, 90,  720, 0,  12, "Credit Card"),
  mkBooking(29, "Facility",   "Completed", "Paid", 2, 3, 3, -7,  18, 60,  310, 0,  10, "Credit Card"),
  mkBooking(30, "Training",   "Completed", "Paid", 6, 2, 2, -9,  7,  60,  450, 0,  8,  "Google Pay"),
  mkBooking(31, "Facility",   "Completed", "Paid", 8, 0, 5, -10, 16, 60,  400, 0,  10, "Credit Card"),
  mkBooking(32, "Tournament", "Completed", "Paid", 10, 0, 0, -3, 10, 180, 100, 0,  10, "Apple Pay"),
  mkBooking(33, "Facility",   "Completed", "Paid", 12, 1, 6, -15, 10, 60, 320, 0,  10, "Credit Card"),
  mkBooking(34, "Coach",      "Completed", "Paid", 5, 0, 0, -17, 15, 90, 680, 0,  12, "Google Pay"),
  mkBooking(35, "Facility",   "Completed", "Paid", 7, 3, 3, -18, 17, 60, 240, 0,  10, "Wallet"),
  mkBooking(36, "Training",   "Completed", "Paid", 9, 2, 4, -20, 8,  60, 400, 0,  8,  "Credit Card"),
  mkBooking(37, "Facility",   "Completed", "Paid", 0, 2, 1, -24, 9,  60, 370, 0,  10, "Credit Card"),
  mkBooking(38, "Coach",      "Completed", "Paid", 14, 2, 3, -26, 11, 60, 580, 0,  12, "Wallet"),
  mkBooking(39, "Training",   "Completed", "Paid", 2, 1, 2, -28, 7,  90, 440, 30, 8,  "Apple Pay"),
  mkBooking(40, "Facility",   "Completed", "Paid", 4, 0, 0, -30, 18, 60, 260, 0,  10, "Credit Card"),
  mkBooking(41, "Tournament", "Completed", "Paid", 3, 1, 1, -12, 10, 240, 150, 0,  10, "Credit Card"),
  mkBooking(42, "Training",   "Completed", "Paid", 14, 2, 0, -35, 8, 60, 410, 0,  8,  "Apple Pay"),

  // ── EXPIRED (3) ──
  mkBooking(43, "Facility",   "Expired", "Pending", 4, 3, 3, -40, 10, 60, 230, 0, 10, "Wallet"),
  mkBooking(44, "Training",   "Expired", "Failed",  7, 0, 0, -45, 9,  60, 420, 0, 8,  "Apple Pay"),
  mkBooking(45, "Tournament", "Expired", "Failed",  9, 0, 2, -50, 14, 180, 75, 0, 10, "Credit Card"),

  // ── CANCELLED (8) ──
  {
    ...mkBooking(46, "Facility", "Cancelled", "Refunded", 8, 0, 0, -5, 10, 60, 350, 0, 10, "Credit Card"),
    cancellation: {
      cancelledBy: "Player",
      actorName: PLAYERS[8].name,
      reason: "Schedule conflict with work meeting",
      refundPct: 50,
      refundAmount: 175,
      cancelledAt: isoDate(-6, 18),
      cancellationCharge: 175,
      cancellationPolicy: "Cancel window: 24h, Charge: 50%",
    },
    financials: {
      ...mkBooking(46, "Facility", "Cancelled", "Refunded", 8, 0, 0, -5, 10, 60, 350, 0, 10, "Credit Card").financials,
      refundHistory: [{
        id: "ref-01", amount: 175, pct: 50,
        reason: "Standard 50% early cancellation policy",
        processedAt: isoDate(-6, 19), processedBy: "System",
        method: "Original Payment Method", status: "Processed",
      }],
    },
  },
  {
    ...mkBooking(47, "Training", "Cancelled", "Refunded", 10, 1, 1, -3, 9, 90, 420, 0, 8, "Apple Pay"),
    cancellation: {
      cancelledBy: "Provider",
      actorName: "Elite Training Center",
      reason: "Provider unavailable due to staff shortage",
      refundPct: 100,
      refundAmount: 420,
      cancelledAt: isoDate(-4, 14),
      cancellationCharge: 0,
      cancellationPolicy: "Provider cancellation — full refund",
    },
    financials: {
      ...mkBooking(47, "Training", "Cancelled", "Refunded", 10, 1, 1, -3, 9, 90, 420, 0, 8, "Apple Pay").financials,
      refundHistory: [{
        id: "ref-02", amount: 420, pct: 100,
        reason: "Provider cancelled — full refund issued",
        processedAt: isoDate(-4, 15), processedBy: "System",
        method: "Original Payment Method", status: "Processed",
      }],
    },
  },
  {
    ...mkBooking(48, "Coach", "Cancelled", "Refunded", 12, 2, 2, -8, 11, 60, 700, 0, 12, "Credit Card"),
    cancellation: {
      cancelledBy: "Admin Override",
      actorName: "Super Admin",
      reason: "Player disputed the session quality",
      refundPct: 100,
      refundAmount: 700,
      cancelledAt: isoDate(-9, 16),
      cancellationCharge: 0,
      cancellationPolicy: "Admin override — dispute resolution",
      adminNotes: "Player dispute ticket #D-1042. Coach did not appear for the session.",
    },
    financials: {
      ...mkBooking(48, "Coach", "Cancelled", "Refunded", 12, 2, 2, -8, 11, 60, 700, 0, 12, "Credit Card").financials,
      refundHistory: [{
        id: "ref-03", amount: 700, pct: 100,
        reason: "Admin Override — dispute resolution (full refund)",
        processedAt: isoDate(-9, 17), processedBy: "Super Admin",
        method: "Wallet Credit", status: "Processed",
      }],
    },
  },
  mkBooking(49, "Facility", "Cancelled", "Paid", 5, 1, 1, -20, 14, 120, 150, 0, 7, "Credit Card", {
    cancellation: {
      cancelledBy: "Player",
      actorName: PLAYERS[5].name,
      reason: "Duplicate booking",
      refundPct: 0,
      refundAmount: 0,
      cancelledAt: isoDate(-21, 9),
      cancellationCharge: 150,
      cancellationPolicy: "Late cancellation — no refund",
    },
  }),
  mkBooking(50, "Training", "Cancelled", "Paid", 7, 2, 3, -25, 8, 60, 400, 0, 8, "Apple Pay", {
    cancellation: {
      cancelledBy: "Player",
      actorName: PLAYERS[7].name,
      reason: "Personal reasons — schedule conflict",
      refundPct: 0,
      refundAmount: 0,
      cancelledAt: isoDate(-26, 12),
      cancellationCharge: 400,
      cancellationPolicy: "Late cancellation — no refund",
    },
  }),
  {
    ...mkBooking(51, "Facility", "Cancelled", "Refunded", 11, 2, 2, -40, 18, 60, 260, 0, 10, "Credit Card"),
    cancellation: {
      cancelledBy: "Admin Override",
      actorName: "Super Admin",
      reason: "Provider complaint about player conduct",
      refundPct: 50,
      refundAmount: 130,
      cancelledAt: isoDate(-41, 16),
      cancellationCharge: 130,
      cancellationPolicy: "Admin override — compromise refund 50%",
      adminNotes: "Provider complaint about player conduct. 50% refund as compromise.",
    },
    financials: {
      ...mkBooking(51, "Facility", "Cancelled", "Refunded", 11, 2, 2, -40, 18, 60, 260, 0, 10, "Credit Card").financials,
      refundHistory: [{
        id: "ref-05", amount: 130, pct: 50,
        reason: "Admin Override — conduct dispute (50% refund)",
        processedAt: isoDate(-41, 17), processedBy: "Super Admin",
        method: "Wallet Credit", status: "Processed",
      }],
    },
  },
  mkBooking(52, "Coach", "Cancelled", "Refunded", 14, 0, 0, -50, 11, 60, 600, 0, 12, "Wallet", {
    cancellation: {
      cancelledBy: "Player",
      actorName: PLAYERS[14].name,
      reason: "Payment issue — chargeback",
      refundPct: 100,
      refundAmount: 600,
      cancelledAt: isoDate(-51, 8),
      cancellationCharge: 0,
      cancellationPolicy: "Payment reversal — full refund",
    },
    financials: {
      ...mkBooking(52, "Coach", "Cancelled", "Refunded", 14, 0, 0, -50, 11, 60, 600, 0, 12, "Wallet").financials,
      refundHistory: [{
        id: "ref-06", amount: 600, pct: 100,
        reason: "Payment reversal — chargeback initiated",
        processedAt: isoDate(-51, 9), processedBy: "System",
        method: "Original Payment Method", status: "Processed",
      }],
    },
  }),
  mkBooking(53, "Tournament", "Cancelled", "Refunded", 3, 0, 0, -15, 10, 180, 100, 0, 10, "Credit Card", {
    cancellation: {
      cancelledBy: "System",
      actorName: "System",
      reason: "Tournament cancelled by host — minimum players not reached",
      refundPct: 100,
      refundAmount: 100,
      cancelledAt: isoDate(-16, 8),
      cancellationCharge: 0,
      cancellationPolicy: "Tournament cancellation — full refund",
    },
    financials: {
      ...mkBooking(53, "Tournament", "Cancelled", "Refunded", 3, 0, 0, -15, 10, 180, 100, 0, 10, "Credit Card").financials,
      refundHistory: [{
        id: "ref-07", amount: 100, pct: 100,
        reason: "Tournament cancelled — full refund",
        processedAt: isoDate(-16, 9), processedBy: "System",
        method: "Wallet Credit", status: "Processed",
      }],
    },
  }),

  // ── PARTIALLY CANCELLED (2) ──
  {
    ...mkBooking(54, "Facility", "Partially Cancelled", "Partial Refund", 0, 0, 0, -2, 16, 90, 350, 0, 10, "Credit Card"),
    playersCount: 3,
    dependants: [
      { id: "dep-54-1", name: "Abdullah Al-Rashid", age: 14, gender: "Male", relation: "Son", status: "Active" },
      { id: "dep-54-2", name: "Fatima Al-Rashid", age: 12, gender: "Female", relation: "Daughter", status: "Cancelled" },
    ],
    financials: {
      ...mkBooking(54, "Facility", "Partially Cancelled", "Partial Refund", 0, 0, 0, -2, 16, 90, 350, 0, 10, "Credit Card").financials,
      refundHistory: [{
        id: "ref-08", amount: 116.67, pct: 33,
        reason: "Partial cancellation — 1 of 3 players cancelled",
        processedAt: isoDate(-3, 10), processedBy: "System",
        method: "Original Payment Method", status: "Processed",
      }],
    },
  },
  {
    ...mkBooking(55, "Training", "Partially Cancelled", "Partial Refund", 6, 1, 1, -5, 9, 60, 380, 0, 8, "Apple Pay"),
    playersCount: 2,
    dependants: [
      { id: "dep-55-1", name: "Guest of Ali", age: 16, gender: "Male", relation: "Nephew", status: "Cancelled" },
    ],
    financials: {
      ...mkBooking(55, "Training", "Partially Cancelled", "Partial Refund", 6, 1, 1, -5, 9, 60, 380, 0, 8, "Apple Pay").financials,
      refundHistory: [{
        id: "ref-09", amount: 190, pct: 50,
        reason: "Partial cancellation — 1 of 2 players cancelled",
        processedAt: isoDate(-6, 12), processedBy: "System",
        method: "Wallet Credit", status: "Processed",
      }],
    },
  },
];

// ── Apply flags to a couple of bookings ──
MOCK_BOOKINGS[2].flagged = true;
MOCK_BOOKINGS[2].flagInfo = {
  flaggedBy: "Super Admin",
  flaggedAt: isoDate(-1, 14),
  reason: "Unusual booking pattern — same player booked 5 coaching sessions in 2 hours. Potential fraud or system abuse.",
};

MOCK_BOOKINGS[9].flagged = true;
MOCK_BOOKINGS[9].flagInfo = {
  flaggedBy: "Sara (Sub-Admin)",
  flaggedAt: isoDate(-2, 11),
  reason: "Tournament registration with suspect payment method. Investigating potential chargebacks.",
};

// ── Apply a discount code to one booking ──
MOCK_BOOKINGS[4].financials.discountCode = "SPORT25";
MOCK_BOOKINGS[4].financials.discount = 25;
