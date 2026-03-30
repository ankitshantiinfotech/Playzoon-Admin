// ─── US-4.1.1 — Freelancer Coach Data & Types ───────────────
// Dedicated data layer for freelancer coaches with all 13 list columns.

import type { VerificationStatus, AccountStatus, PlatformStatus } from "../provider-data";

// ─── Types ───────────────────────────────────────────────────

export type Gender = "Male" | "Female" | "Rather not Say";

export interface FreelancerCoach {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  gender: Gender;
  nationality: string;
  dob: Date;
  location: { city: string; country: string };
  specialization: string;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  platformStatus: PlatformStatus;
  createdAt: Date;
  rejectionReason?: string;
  // ── Lock info (US-5.1.1) ──
  lockedAt?: Date;
  lockedBy?: string;
}

// ─── Sort fields (7 sortable out of 13 columns) ─────────────

export type CoachSortField =
  | "name"
  | "email"
  | "nationality"
  | "dob"
  | "specialization"
  | "verificationStatus"
  | "createdAt";

// ─── Date helper (relative to 21 Feb 2026) ──────────────────

const d = (daysAgo: number, hours = 10, minutes = 0): Date => {
  const base = new Date(2026, 1, 21, hours, minutes, 0);
  return new Date(base.getTime() - daysAgo * 86400000);
};

const dob = (year: number, month: number, day: number): Date =>
  new Date(year, month - 1, day);

// ─── Specializations (master data) ──────────────────────────

export const COACH_SPECIALIZATIONS = [
  "Football",
  "Basketball",
  "Tennis",
  "Swimming",
  "Padel",
  "Fitness & Conditioning",
  "Martial Arts",
  "Cricket",
  "Yoga & Wellness",
  "Athletics",
  "Boxing",
  "Gymnastics",
] as const;

// ─── Mock Data — 15 Freelancer Coaches ──────────────────────

export const MOCK_FREELANCER_COACHES: FreelancerCoach[] = [
  {
    id: "FC-001",
    firstName: "Ahmed",
    lastName: "Al Mansouri",
    email: "ahmed.mansouri@coach.ae",
    mobile: "+971 50 700 0001",
    gender: "Male",
    nationality: "Emirati",
    dob: dob(1988, 3, 15),
    location: { city: "Dubai", country: "UAE" },
    specialization: "Football",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(190, 9, 0),
  },
  {
    id: "FC-002",
    firstName: "Sara",
    lastName: "Al Hashemi",
    email: "sara.hashemi@coach.ae",
    mobile: "+971 55 700 0002",
    gender: "Female",
    nationality: "Emirati",
    dob: dob(1992, 7, 22),
    location: { city: "Abu Dhabi", country: "UAE" },
    specialization: "Tennis",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(170, 10, 0),
  },
  {
    id: "FC-003",
    firstName: "Khalid",
    lastName: "bin Rashid Al Nuaimi",
    email: "khalid.nuaimi@coach.ae",
    mobile: "+971 56 700 0003",
    gender: "Male",
    nationality: "Emirati",
    dob: dob(1985, 11, 8),
    location: { city: "Sharjah", country: "UAE" },
    specialization: "Swimming",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(4, 14, 0),
  },
  {
    id: "FC-004",
    firstName: "Fatima",
    lastName: "Al Zaabi",
    email: "fatima.zaabi@coach.ae",
    mobile: "+971 52 700 0004",
    gender: "Female",
    nationality: "Emirati",
    dob: dob(1995, 1, 30),
    location: { city: "Al Ain", country: "UAE" },
    specialization: "Yoga & Wellness",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(145, 11, 30),
  },
  {
    id: "FC-005",
    firstName: "Omar",
    lastName: "Benali",
    email: "omar.benali@coach.ae",
    mobile: "+971 58 700 0005",
    gender: "Male",
    nationality: "Algerian",
    dob: dob(1990, 5, 12),
    location: { city: "Dubai", country: "UAE" },
    specialization: "Boxing",
    verificationStatus: "Approved",
    accountStatus: "Locked",
    platformStatus: "Inactive",
    createdAt: d(125, 8, 15),
    lockedAt: d(7, 14, 30),
    lockedBy: "Admin Mohammed",
  },
  {
    id: "FC-006",
    firstName: "Layla",
    lastName: "Abdulrahman",
    email: "layla.abdulrahman@coach.ae",
    mobile: "+971 50 700 0006",
    gender: "Female",
    nationality: "Saudi",
    dob: dob(1993, 9, 4),
    location: { city: "Ajman", country: "UAE" },
    specialization: "Fitness & Conditioning",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(2, 16, 0),
  },
  {
    id: "FC-007",
    firstName: "Youssef",
    lastName: "Khatib",
    email: "youssef.khatib@coach.ae",
    mobile: "+971 55 700 0007",
    gender: "Male",
    nationality: "Lebanese",
    dob: dob(1987, 12, 19),
    location: { city: "Dubai", country: "UAE" },
    specialization: "Basketball",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(105, 9, 45),
  },
  {
    id: "FC-008",
    firstName: "Maryam",
    lastName: "Al Suwaidi",
    email: "maryam.suwaidi@coach.ae",
    mobile: "+971 56 700 0008",
    gender: "Female",
    nationality: "Emirati",
    dob: dob(1991, 4, 7),
    location: { city: "Fujairah", country: "UAE" },
    specialization: "Gymnastics",
    verificationStatus: "Rejected",
    accountStatus: "Locked",
    platformStatus: "Inactive",
    createdAt: d(75, 13, 30),
    lockedAt: d(14, 9, 0),
    lockedBy: "System (Auto-lock)",
    rejectionReason: "Coaching certifications could not be verified.",
  },
  {
    id: "FC-009",
    firstName: "Hassan",
    lastName: "Farouk",
    email: "hassan.farouk@coach.ae",
    mobile: "+971 52 700 0009",
    gender: "Male",
    nationality: "Egyptian",
    dob: dob(1984, 8, 25),
    location: { city: "Abu Dhabi", country: "UAE" },
    specialization: "Martial Arts",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(1, 10, 20),
  },
  {
    id: "FC-010",
    firstName: "Aisha",
    lastName: "Khalil",
    email: "aisha.khalil@coach.ae",
    mobile: "+971 50 700 0010",
    gender: "Female",
    nationality: "Jordanian",
    dob: dob(1996, 2, 14),
    location: { city: "Dubai", country: "UAE" },
    specialization: "Padel",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(50, 15, 0),
  },
  {
    id: "FC-011",
    firstName: "Zayed",
    lastName: "Al Maktoum",
    email: "zayed.maktoum@coach.ae",
    mobile: "+971 58 700 0011",
    gender: "Male",
    nationality: "Emirati",
    dob: dob(1998, 6, 3),
    location: { city: "Ras Al Khaimah", country: "UAE" },
    specialization: "Cricket",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(0, 7, 30),
  },
  {
    id: "FC-012",
    firstName: "Nadia",
    lastName: "El-Amin",
    email: "nadia.elamin@coach.ae",
    mobile: "+971 55 700 0012",
    gender: "Female",
    nationality: "Sudanese",
    dob: dob(1989, 10, 11),
    location: { city: "Sharjah", country: "UAE" },
    specialization: "Athletics",
    verificationStatus: "Rejected",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(15, 12, 0),
    rejectionReason: "Missing mandatory documents.",
  },
  {
    id: "FC-013",
    firstName: "Tariq",
    lastName: "Al Shamsi",
    email: "tariq.shamsi@coach.ae",
    mobile: "+971 50 700 0013",
    gender: "Male",
    nationality: "Emirati",
    dob: dob(1986, 7, 28),
    location: { city: "Dubai", country: "UAE" },
    specialization: "Football",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(200, 8, 0),
  },
  {
    id: "FC-014",
    firstName: "Reem",
    lastName: "Hassan",
    email: "reem.hassan@coach.ae",
    mobile: "+971 52 700 0014",
    gender: "Female",
    nationality: "Egyptian",
    dob: dob(1994, 3, 20),
    location: { city: "Abu Dhabi", country: "UAE" },
    specialization: "Swimming",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(88, 14, 30),
  },
  {
    id: "FC-015",
    firstName: "Ali",
    lastName: "Qasim",
    email: "ali.qasim@coach.ae",
    mobile: "+971 56 700 0015",
    gender: "Rather not Say",
    nationality: "Iraqi",
    dob: dob(1997, 12, 5),
    location: { city: "Ajman", country: "UAE" },
    specialization: "Fitness & Conditioning",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(3, 9, 15),
  },
];

// ─── Helpers ─────────────────────────────────────────────────

export function getCoachFullName(coach: FreelancerCoach): string {
  return `${coach.firstName} ${coach.lastName}`;
}

export function getCoachLocation(coach: FreelancerCoach): string {
  return `${coach.location.city}, ${coach.location.country}`;
}

export function getCoachPendingCount(coaches: FreelancerCoach[]): number {
  return coaches.filter(c => c.verificationStatus === "Pending").length;
}