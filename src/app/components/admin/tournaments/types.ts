// ─── Tournament Management — Types (SCR-ADM-021 / SCR-ADM-022) ─────────────

export type TournamentStatus =
  | "Tentative"
  | "Confirmed"
  | "Full"
  | "Cancelled"
  | "Completed"
  | "Expired";

export type SportType =
  | "Tennis"
  | "Padel"
  | "Badminton"
  | "Pickleball"
  | "Squash"
  | "Football"
  | "Basketball"
  | "Cricket"
  | "Swimming";

export type LevelType = "Beginner" | "Intermediate" | "Advanced" | "All Levels";
export type TournamentType = "Singles" | "Doubles" | "Team";
export type GenderType = "Male" | "Female" | "Mixed";

export const TOURNAMENT_STATUSES: TournamentStatus[] = [
  "Tentative",
  "Confirmed",
  "Full",
  "Cancelled",
  "Completed",
  "Expired",
];

export const SPORT_TYPES: SportType[] = [
  "Tennis",
  "Padel",
  "Badminton",
  "Pickleball",
  "Squash",
  "Football",
  "Basketball",
  "Cricket",
  "Swimming",
];

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface TournamentHost {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface TournamentFacility {
  id: string;
  name: string;
  court: string;
  location: string;
  image?: string;
}

export interface TournamentAttendee {
  id: string;
  playerName: string;
  age: number;
  gender: GenderType;
  registrationDate: string;
  bookingId: string;
  paymentStatus: "Paid" | "Pending" | "Refunded";
  attendeeStatus: "Active" | "Withdrawn" | "Cancelled";
}

export interface TournamentFinancials {
  feeType: "Free" | "Paid";
  entryFee: number;
  paymentMethod: string;
  totalCollected: number;
  totalRefunded: number;
}

export interface TimelineEvent {
  status: TournamentStatus | "Created";
  timestamp: string;
  actor: string;
  note?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  details?: string;
}

export interface Tournament {
  id: string;
  name: string;
  image?: string;
  sport: SportType;
  level: LevelType;
  ageRange: string;
  gender: GenderType;
  equipment: string;
  tournamentType: TournamentType;
  bookingType: "Individual" | "Team-based";
  priceRange: string;
  minPlayers: number;
  maxPlayers: number;
  registrationCount: number;
  status: TournamentStatus;
  host: TournamentHost;
  facility: TournamentFacility;
  date: string;        // ISO
  startTime: string;
  endTime: string;
  duration: string;
  registrationDeadline?: string;
  organizerNotes: string;
  specialRules: string;
  financials: TournamentFinancials;
  attendees: TournamentAttendee[];
  timeline: TimelineEvent[];
  auditTrail: AuditEntry[];
  createdAt: string;
}
