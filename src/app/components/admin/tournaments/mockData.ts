// ─── Tournament Management — Mock Data (SCR-ADM-021 / SCR-ADM-022) ──────────

import type {
  Tournament,
  TournamentStatus,
  SportType,
  LevelType,
  TournamentType,
  GenderType,
  TournamentAttendee,
  TimelineEvent,
  AuditEntry,
} from "./types";

// ─── Seed Data ───────────────────────────────────────────────────────────────

const CITIES = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Tabuk", "Abha", "Khobar"];
const FACILITY_NAMES = ["Central Sports Arena", "Elite Racket Club", "Champion's Hub", "Premier Sports Complex", "Ace Sports Centre", "Royal Tennis Club", "Desert Sports Academy"];
const HOST_NAMES = [
  "Ahmed Al-Rashid", "Fatima Hassan", "Omar Khalid", "Sara Al-Mansouri",
  "Khalid Ibrahim", "Nour Saleh", "Tariq Al-Farsi", "Layla Mohamed",
];
const PLAYER_NAMES = [
  "Ali Ahmed", "Mohammed Tariq", "Hassan Al-Jabri", "Yousef Al-Harthi",
  "Reem Al-Shehhi", "Amira Yousef", "Faisal Al-Ghamdi", "Nadia Haddad",
  "Ibrahim Shamri", "Sara Balushi", "Khalid Otaibi", "Omar Zahrawi",
];

function isoDate(daysFromNow: number, hour = 10, minute = 0): string {
  const d = new Date("2026-02-21T00:00:00Z");
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function mkAttendees(count: number, tournamentIdx: number, fee: number, status: TournamentStatus): TournamentAttendee[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `att-${tournamentIdx}-${i}`,
    playerName: PLAYER_NAMES[(i + tournamentIdx) % PLAYER_NAMES.length],
    age: 18 + (i * 3) % 30,
    gender: (i % 3 === 0 ? "Female" : "Male") as GenderType,
    registrationDate: isoDate(-14 + i, 9 + i),
    bookingId: `BK-T${String(tournamentIdx).padStart(3, "0")}-${String(i + 1).padStart(2, "0")}`,
    paymentStatus: status === "Cancelled" ? "Refunded" as const : (i % 10 === 0 ? "Pending" as const : "Paid" as const),
    attendeeStatus: status === "Cancelled" ? "Cancelled" as const : "Active" as const,
  }));
}

function mkTimeline(status: TournamentStatus, dayOffset: number): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { status: "Created", timestamp: isoDate(dayOffset - 14, 9), actor: "Host", note: "Tournament created by host" },
  ];
  if (status === "Tentative" || status === "Confirmed" || status === "Full" || status === "Completed") {
    events.push({ status: "Tentative", timestamp: isoDate(dayOffset - 10, 11), actor: "System", note: "Waiting for minimum players" });
  }
  if (status === "Confirmed" || status === "Full" || status === "Completed") {
    events.push({ status: "Confirmed", timestamp: isoDate(dayOffset - 7, 14), actor: "System", note: "Minimum players reached" });
  }
  if (status === "Full") {
    events.push({ status: "Full", timestamp: isoDate(dayOffset - 3, 10), actor: "System", note: "Maximum capacity reached" });
  }
  if (status === "Completed") {
    events.push({ status: "Completed", timestamp: isoDate(dayOffset + 1, 18), actor: "System", note: "Tournament concluded" });
  }
  if (status === "Cancelled") {
    events.push({ status: "Cancelled", timestamp: isoDate(dayOffset - 2, 10), actor: "Host", note: "Tournament cancelled by host" });
  }
  if (status === "Expired") {
    events.push({ status: "Expired", timestamp: isoDate(dayOffset + 1, 0), actor: "System", note: "Tournament date passed without sufficient registrations" });
  }
  return events;
}

function mkAuditTrail(status: TournamentStatus, dayOffset: number, hostName: string): AuditEntry[] {
  const entries: AuditEntry[] = [
    { id: "aud-1", timestamp: isoDate(dayOffset - 14, 9), event: "Tournament created", actor: hostName },
  ];
  if (status === "Confirmed" || status === "Full" || status === "Completed") {
    entries.push({ id: "aud-2", timestamp: isoDate(dayOffset - 7, 14), event: "Status changed to Confirmed", actor: "System", details: "Minimum player threshold reached" });
  }
  if (status === "Full") {
    entries.push({ id: "aud-3", timestamp: isoDate(dayOffset - 3, 10), event: "Status changed to Full", actor: "System", details: "Maximum capacity reached" });
  }
  if (status === "Completed") {
    entries.push({ id: "aud-4", timestamp: isoDate(dayOffset + 1, 18), event: "Tournament completed", actor: "System" });
  }
  if (status === "Cancelled") {
    entries.push({ id: "aud-5", timestamp: isoDate(dayOffset - 2, 10), event: "Tournament cancelled", actor: hostName, details: "Host initiated cancellation" });
  }
  return entries;
}

// ─── Generate Tournaments ────────────────────────────────────────────────────

export function generateMockTournaments(count: number = 50): Tournament[] {
  const sports: SportType[] = ["Tennis", "Padel", "Badminton", "Football", "Squash", "Pickleball", "Basketball", "Cricket", "Swimming"];
  const levels: LevelType[] = ["Beginner", "Intermediate", "Advanced", "All Levels"];
  const statuses: TournamentStatus[] = ["Tentative", "Confirmed", "Full", "Cancelled", "Completed", "Expired"];
  const types: TournamentType[] = ["Singles", "Doubles", "Team"];
  const genders: GenderType[] = ["Male", "Female", "Mixed"];
  const equipments = ["Bring Your Own", "Equipment Provided", "Shared equipment available"];

  const tournaments: Tournament[] = [];

  for (let i = 0; i < count; i++) {
    const sport = sports[i % sports.length];
    const level = levels[i % levels.length];
    const status = statuses[i % statuses.length];
    const tournamentType = types[i % types.length];
    const gender = genders[i % genders.length];
    const city = CITIES[i % CITIES.length];
    const hostName = HOST_NAMES[i % HOST_NAMES.length];
    const facilityName = FACILITY_NAMES[i % FACILITY_NAMES.length];

    const dayOffset = i % 3 === 0
      ? -(Math.floor(i / 3) + 5) // past
      : (Math.floor(i / 3) + 5); // future

    const maxPlayers = [8, 16, 20, 32][i % 4];
    const registrationCount = status === "Full"
      ? maxPlayers
      : status === "Expired"
      ? Math.min(3, maxPlayers)
      : Math.floor(Math.random() * (maxPlayers - 2)) + 2;

    const entryFee = i % 5 === 0 ? 0 : [50, 75, 100, 150, 200][i % 5];
    const feeType = entryFee === 0 ? "Free" as const : "Paid" as const;

    const attendees = mkAttendees(registrationCount, i, entryFee, status);
    const paidCount = attendees.filter((a) => a.paymentStatus === "Paid").length;
    const refundedCount = attendees.filter((a) => a.paymentStatus === "Refunded").length;

    const startHour = 8 + (i % 10);
    const durationHours = [2, 3, 4, 6][i % 4];

    tournaments.push({
      id: `TRN-${String(1000 + i)}`,
      name: `${city} ${sport} ${level} ${["Cup", "Open", "Championship", "Challenge"][i % 4]} 2026`,
      image: i % 3 === 0 ? undefined : `https://picsum.photos/seed/trn${i}/800/300`,
      sport,
      level,
      ageRange: `${13 + (i % 5)} - ${40 + (i % 10)} years`,
      gender,
      equipment: equipments[i % equipments.length],
      tournamentType,
      bookingType: tournamentType === "Team" ? "Team-based" : "Individual",
      priceRange: feeType === "Free" ? "Free" : `${entryFee}.00 SAR`,
      minPlayers: 4,
      maxPlayers,
      registrationCount,
      status,
      host: {
        id: `host-${i}`,
        name: hostName,
        email: `${hostName.toLowerCase().replace(/ /g, ".")}@example.com`,
        phone: `+966 5${i % 10} ${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
      },
      facility: {
        id: `fac-${i}`,
        name: facilityName,
        court: `Court ${(i % 8) + 1}`,
        location: `${(i + 1) * 10} Sports Blvd, ${city}`,
      },
      date: isoDate(dayOffset, startHour),
      startTime: `${String(startHour).padStart(2, "0")}:00`,
      endTime: `${String(startHour + durationHours).padStart(2, "0")}:00`,
      duration: `${durationHours} hours`,
      registrationDeadline: isoDate(dayOffset - 2, 23, 59),
      organizerNotes: i % 4 === 0
        ? "All participants must arrive 30 minutes before the start time. Water and refreshments will be provided."
        : i % 4 === 1
        ? "Please bring valid ID for registration verification. Warm-up area available from 7 AM."
        : i % 4 === 2
        ? "Prizes for top 3 positions. Tournament brackets will be shared 24 hours before the event."
        : "No specific notes. Standard tournament rules apply.",
      specialRules: i % 3 === 0
        ? "Best of 3 sets. Tie-break at 6-6. 10-minute rest between matches."
        : i % 3 === 1
        ? "Round robin format with top 4 advancing to knockout stage."
        : "Standard rules apply. Referee decisions are final.",
      financials: {
        feeType,
        entryFee,
        paymentMethod: "Card / Wallet",
        totalCollected: paidCount * entryFee,
        totalRefunded: refundedCount * entryFee,
      },
      attendees,
      timeline: mkTimeline(status, dayOffset),
      auditTrail: mkAuditTrail(status, dayOffset, hostName),
      createdAt: isoDate(dayOffset - 14, 9),
    });
  }

  return tournaments;
}
