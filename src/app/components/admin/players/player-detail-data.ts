// ─── Player Detail Types & Mock Data ──────────────────────────

import type { PlayerStatus } from "./player-data";

export interface NotificationSettings {
  emailBookingConfirm: boolean;
  emailCancellation: boolean;
  emailPromotions: boolean;
  pushReminders: boolean;
  pushSessionUpdates: boolean;
  smsAlerts: boolean;
}

export interface PrivacySettings {
  profileVisible: boolean;
  showActivityHistory: boolean;
  allowFriendRequests: boolean;
  shareWithCoaches: boolean;
}

export interface PlayerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: PlayerStatus;
  lockedUntil?: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  username: string;
  bio: string;
  occupation: string;
  interestedSports: string[];
  preferredLanguage: string;
  notes: string;
  walletBalance: number;
  isSSOUser: boolean;
  createdAt: Date;
  lastActiveAt: Date;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  profilePictureUrl?: string;
}

export interface PlayerAddress {
  id: string;
  addressType: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  lastUpdated: Date;
}

export interface PlayerDependent {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  notes: string;
  lastUpdated: Date;
}

export interface DetailAuditEvent {
  id: string;
  timestamp: Date;
  actor: string;
  actorRole: string;
  module: string;
  action: string;
  target: string;
  targetId: string;
  result: "Success" | "Failed";
  metadata: Record<string, unknown>;
}

// ─── New tab types ───────────────────────────────────────────

export interface SavedCard {
  id: string;
  brand: "Visa" | "Mastercard" | "Mada";
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export interface PlayerBooking {
  id: string;
  type: "Facility" | "Training" | "Coach" | "Tournament";
  entityName: string;
  dateTime: Date;
  status: "Confirmed" | "Completed" | "Cancelled" | "Pending" | "No-Show";
  amount: number;
}

export interface WalletTransaction {
  id: string;
  type: "Credit" | "Debit";
  amount: number;
  description: string;
  date: Date;
}

export interface PlayerTournament {
  id: string;
  name: string;
  sport: string;
  date: Date;
  status: "Upcoming" | "In Progress" | "Completed" | "Cancelled";
  teamOrSolo: "Team" | "Solo";
  result: string;
}

export interface PlayerFriend {
  id: string;
  name: string;
  playerId: string;
  status: "Accepted" | "Pending";
  addedDate: Date;
}

// ─── COUNTRIES list ──────────────────────────────────────────

export const COUNTRIES = [
  "United States", "United Kingdom", "United Arab Emirates",
  "Saudi Arabia", "Canada", "Australia", "Germany",
  "France", "Japan", "India", "Brazil", "South Korea",
  "China", "Spain", "Ireland", "Italy", "Mexico",
];

export const GENDER_OPTIONS = [
  "Male", "Female", "Non-binary", "Other", "Prefer not to say",
];

export const RELATIONSHIP_OPTIONS = [
  "Child", "Spouse/Partner", "Parent", "Sibling", "Other",
];

export const ADDRESS_TYPE_OPTIONS = [
  "Home", "Work", "Billing", "Shipping", "Other",
];

// ─── Mock players registry (keyed by id) ─────────────────────

const ago = (d: number, h = 0) => {
  const base = new Date(2026, 1, 20, 10, 0, 0);
  return new Date(base.getTime() - (d * 86400000 + h * 3600000));
};

export const MOCK_PLAYER_DETAILS: Record<string, PlayerDetail> = {
  "P-104392": {
    id: "P-104392",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    phone: "+1 415 555 0123",
    status: "Locked",
    lockedUntil: "2026-03-20",
    dateOfBirth: "1994-07-23",
    gender: "Female",
    nationality: "American",
    username: "jane.doe94",
    bio: "Passionate about tennis and swimming.",
    occupation: "Software Engineer",
    interestedSports: ["Tennis", "Swimming"],
    preferredLanguage: "English",
    notes: "VIP customer — handle with care.",
    walletBalance: 350.0,
    isSSOUser: false,
    createdAt: new Date(2023, 5, 15, 9, 30),
    lastActiveAt: ago(2),
    profilePictureUrl: undefined,
    notificationSettings: {
      emailBookingConfirm: true,
      emailCancellation: true,
      emailPromotions: false,
      pushReminders: true,
      pushSessionUpdates: true,
      smsAlerts: false,
    },
    privacySettings: {
      profileVisible: true,
      showActivityHistory: false,
      allowFriendRequests: true,
      shareWithCoaches: true,
    },
  },
};

export const MOCK_ADDRESSES: Record<string, PlayerAddress[]> = {
  "P-104392": [
    {
      id: "addr-1",
      addressType: "Home",
      addressLine1: "500 Market St",
      addressLine2: "Apt 12",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "United States",
      isDefault: true,
      lastUpdated: ago(2),
    },
    {
      id: "addr-2",
      addressType: "Work",
      addressLine1: "1000 Main Ave",
      addressLine2: "Suite 400",
      city: "Oakland",
      state: "CA",
      postalCode: "94612",
      country: "United States",
      isDefault: false,
      lastUpdated: ago(90),
    },
  ],
};

export const MOCK_DEPENDENTS: Record<string, PlayerDependent[]> = {
  "P-104392": [
    {
      id: "dep-1",
      firstName: "Mia",
      lastName: "Doe",
      relationship: "Child",
      dateOfBirth: "2014-08-22",
      email: "",
      phone: "",
      notes: "Allergies: peanuts",
      lastUpdated: ago(5),
    },
    {
      id: "dep-2",
      firstName: "Sam",
      lastName: "Doe",
      relationship: "Spouse/Partner",
      dateOfBirth: "1990-09-02",
      email: "sam@example.com",
      phone: "+1 415 555 0199",
      notes: "Emergency contact",
      lastUpdated: ago(14),
    },
  ],
};

export const MOCK_DETAIL_AUDIT: Record<string, DetailAuditEvent[]> = {
  "P-104392": [
    {
      id: "AE-001",
      timestamp: new Date(2026, 1, 12, 9, 43, 21),
      actor: "Olivia Brown",
      actorRole: "Admin",
      module: "Players",
      action: "StatusChange",
      target: "Jane Doe (#P-104392)",
      targetId: "P-104392",
      result: "Success",
      metadata: { from: "Active", to: "Locked", lockUntil: "2026-03-20" },
    },
    {
      id: "AE-002",
      timestamp: new Date(2026, 1, 10, 16, 12, 3),
      actor: "System",
      actorRole: "System",
      module: "Players",
      action: "Update",
      target: "Jane Doe (#P-104392)",
      targetId: "P-104392",
      result: "Success",
      metadata: { field: "email", before: "jane@old.com", after: "jane.doe@example.com" },
    },
    {
      id: "AE-003",
      timestamp: new Date(2026, 1, 8, 11, 5, 44),
      actor: "Olivia Brown",
      actorRole: "Admin",
      module: "Players",
      action: "Create",
      target: "Address: 123 Main St",
      targetId: "addr-1",
      result: "Success",
      metadata: { type: "Home", city: "San Francisco" },
    },
    {
      id: "AE-004",
      timestamp: new Date(2026, 1, 5, 14, 30, 0),
      actor: "System",
      actorRole: "System",
      module: "Players",
      action: "Notification",
      target: "Jane Doe (#P-104392)",
      targetId: "P-104392",
      result: "Success",
      metadata: { type: "email", subject: "Account locked notice" },
    },
    {
      id: "AE-005",
      timestamp: new Date(2026, 0, 28, 10, 0, 0),
      actor: "Jane Doe",
      actorRole: "Player",
      module: "Players",
      action: "Update",
      target: "Jane Doe (#P-104392)",
      targetId: "P-104392",
      result: "Success",
      metadata: { field: "phone", before: "+1 415 555 0000", after: "+1 415 555 0123" },
    },
    {
      id: "AE-006",
      timestamp: new Date(2026, 0, 20, 9, 15, 30),
      actor: "Olivia Brown",
      actorRole: "Admin",
      module: "Players",
      action: "Create",
      target: "Dependent: Alex Doe",
      targetId: "dep-1",
      result: "Success",
      metadata: { relationship: "Child", dob: "2012-05-10" },
    },
    {
      id: "AE-007",
      timestamp: new Date(2026, 0, 15, 8, 0, 0),
      actor: "System",
      actorRole: "System",
      module: "Players",
      action: "Create",
      target: "Jane Doe (#P-104392)",
      targetId: "P-104392",
      result: "Success",
      metadata: { source: "admin_panel", initialStatus: "Active" },
    },
    {
      id: "AE-008",
      timestamp: new Date(2025, 11, 10, 14, 22, 11),
      actor: "System",
      actorRole: "System",
      module: "Players",
      action: "Update",
      target: "Jane Doe (#P-104392)",
      targetId: "P-104392",
      result: "Failed",
      metadata: { field: "wallet_balance", error: "Insufficient funds for refund" },
    },
  ],
};

// ─── Helper: get or create default player detail ─────────────

export function getPlayerDetail(playerId: string): PlayerDetail {
  if (MOCK_PLAYER_DETAILS[playerId]) return MOCK_PLAYER_DETAILS[playerId];
  return {
    id: playerId,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    phone: "+1 415 555 0123",
    status: "Locked",
    lockedUntil: "2026-03-20",
    dateOfBirth: "1994-07-23",
    gender: "Female",
    nationality: "American",
    username: "jane.doe94",
    bio: "Passionate about tennis and swimming.",
    occupation: "Software Engineer",
    interestedSports: ["Tennis", "Swimming"],
    preferredLanguage: "English",
    notes: "VIP customer — handle with care.",
    walletBalance: 350.0,
    isSSOUser: false,
    createdAt: new Date(2023, 5, 15, 9, 30),
    lastActiveAt: ago(2),
    notificationSettings: {
      emailBookingConfirm: true,
      emailCancellation: true,
      emailPromotions: false,
      pushReminders: true,
      pushSessionUpdates: true,
      smsAlerts: false,
    },
    privacySettings: {
      profileVisible: true,
      showActivityHistory: false,
      allowFriendRequests: true,
      shareWithCoaches: true,
    },
  };
}

export function getPlayerAddresses(playerId: string): PlayerAddress[] {
  return MOCK_ADDRESSES[playerId] || MOCK_ADDRESSES["P-104392"];
}

export function getPlayerDependents(playerId: string): PlayerDependent[] {
  return MOCK_DEPENDENTS[playerId] || MOCK_DEPENDENTS["P-104392"];
}

export function getDetailAuditEvents(playerId: string): DetailAuditEvent[] {
  return MOCK_DETAIL_AUDIT[playerId] || MOCK_DETAIL_AUDIT["P-104392"];
}

// ─── Mock data for new tabs ─────────────────────────────────

export const MOCK_SAVED_CARDS: Record<string, SavedCard[]> = {
  "P-104392": [
    { id: "card-1", brand: "Visa", last4: "4521", expiry: "09/27", isDefault: true },
    { id: "card-2", brand: "Mastercard", last4: "8834", expiry: "03/26", isDefault: false },
    { id: "card-3", brand: "Mada", last4: "1190", expiry: "12/28", isDefault: false },
  ],
};

export const MOCK_BOOKINGS: Record<string, PlayerBooking[]> = {
  "P-104392": [
    { id: "BK-20410", type: "Facility", entityName: "Al Riyadh Sports Complex – Court 3", dateTime: new Date(2026, 2, 5, 18, 0), status: "Completed", amount: 150 },
    { id: "BK-20411", type: "Training", entityName: "Padel Beginners Session", dateTime: new Date(2026, 2, 8, 10, 0), status: "Confirmed", amount: 200 },
    { id: "BK-20412", type: "Coach", entityName: "Coach Ahmed – Private Tennis", dateTime: new Date(2026, 2, 12, 16, 30), status: "Confirmed", amount: 350 },
    { id: "BK-20413", type: "Tournament", entityName: "Riyadh Open 2026 – Mixed Doubles", dateTime: new Date(2026, 2, 20, 9, 0), status: "Pending", amount: 500 },
    { id: "BK-20414", type: "Facility", entityName: "Jeddah Swim Center – Lane 5", dateTime: new Date(2026, 1, 28, 7, 0), status: "Completed", amount: 80 },
    { id: "BK-20415", type: "Training", entityName: "Cricket Fielding Drills", dateTime: new Date(2026, 1, 20, 14, 0), status: "Cancelled", amount: 120 },
    { id: "BK-20416", type: "Facility", entityName: "King Fahd Stadium – Pitch B", dateTime: new Date(2026, 1, 15, 19, 0), status: "No-Show", amount: 250 },
    { id: "BK-20417", type: "Coach", entityName: "Coach Sara – Swimming", dateTime: new Date(2026, 2, 25, 8, 0), status: "Pending", amount: 300 },
  ],
};

export const MOCK_WALLET_TRANSACTIONS: Record<string, WalletTransaction[]> = {
  "P-104392": [
    { id: "TXN-90001", type: "Credit", amount: 500, description: "Wallet top-up via Visa ****4521", date: new Date(2026, 2, 1, 10, 15) },
    { id: "TXN-90002", type: "Debit", amount: 150, description: "Booking BK-20410 – Al Riyadh Sports Complex", date: new Date(2026, 2, 5, 18, 5) },
    { id: "TXN-90003", type: "Credit", amount: 120, description: "Refund – Cancelled booking BK-20415", date: new Date(2026, 1, 21, 9, 0) },
    { id: "TXN-90004", type: "Debit", amount: 200, description: "Booking BK-20411 – Padel Beginners Session", date: new Date(2026, 2, 8, 10, 5) },
    { id: "TXN-90005", type: "Debit", amount: 80, description: "Booking BK-20414 – Jeddah Swim Center", date: new Date(2026, 1, 28, 7, 5) },
    { id: "TXN-90006", type: "Credit", amount: 1000, description: "Promotional credit – Welcome bonus", date: new Date(2026, 0, 15, 12, 0) },
    { id: "TXN-90007", type: "Debit", amount: 350, description: "Booking BK-20412 – Coach Ahmed Tennis", date: new Date(2026, 2, 12, 16, 35) },
    { id: "TXN-90008", type: "Debit", amount: 490, description: "Tournament entry – Riyadh Open 2026", date: new Date(2026, 2, 18, 11, 0) },
  ],
};

export const MOCK_TOURNAMENTS: Record<string, PlayerTournament[]> = {
  "P-104392": [
    { id: "T-3001", name: "Riyadh Open 2026", sport: "Tennis", date: new Date(2026, 2, 20), status: "Upcoming", teamOrSolo: "Solo", result: "—" },
    { id: "T-3002", name: "Jeddah Swimming Championship", sport: "Swimming", date: new Date(2026, 1, 10), status: "Completed", teamOrSolo: "Solo", result: "3rd Place" },
    { id: "T-3003", name: "KSA Corporate Cricket League", sport: "Cricket", date: new Date(2026, 0, 5), status: "Completed", teamOrSolo: "Team", result: "Runner-Up" },
    { id: "T-3004", name: "Padel Masters Invitational", sport: "Padel", date: new Date(2026, 3, 15), status: "Upcoming", teamOrSolo: "Team", result: "—" },
    { id: "T-3005", name: "National Basketball 3x3", sport: "Basketball", date: new Date(2025, 10, 22), status: "Completed", teamOrSolo: "Team", result: "Quarter-Finals" },
  ],
};

export const MOCK_FRIENDS: Record<string, PlayerFriend[]> = {
  "P-104392": [
    { id: "fr-1", name: "Ahmed Al-Farsi", playerId: "P-104401", status: "Accepted", addedDate: new Date(2025, 8, 10) },
    { id: "fr-2", name: "Noura Khalid", playerId: "P-104455", status: "Accepted", addedDate: new Date(2025, 10, 3) },
    { id: "fr-3", name: "Carlos Rivera", playerId: "P-104320", status: "Accepted", addedDate: new Date(2026, 0, 18) },
    { id: "fr-4", name: "Fatima Hassan", playerId: "P-104510", status: "Pending", addedDate: new Date(2026, 2, 2) },
    { id: "fr-5", name: "Liam Park", playerId: "P-104488", status: "Accepted", addedDate: new Date(2026, 1, 14) },
    { id: "fr-6", name: "Sara Mohammed", playerId: "P-104399", status: "Pending", addedDate: new Date(2026, 2, 8) },
  ],
};

// ─── Getter functions for new tab data ──────────────────────

export function getPlayerSavedCards(playerId: string): SavedCard[] {
  return MOCK_SAVED_CARDS[playerId] || MOCK_SAVED_CARDS["P-104392"];
}

export function getPlayerBookings(playerId: string): PlayerBooking[] {
  return MOCK_BOOKINGS[playerId] || MOCK_BOOKINGS["P-104392"];
}

export function getPlayerWalletTransactions(playerId: string): WalletTransaction[] {
  return MOCK_WALLET_TRANSACTIONS[playerId] || MOCK_WALLET_TRANSACTIONS["P-104392"];
}

export function getPlayerTournaments(playerId: string): PlayerTournament[] {
  return MOCK_TOURNAMENTS[playerId] || MOCK_TOURNAMENTS["P-104392"];
}

export function getPlayerFriends(playerId: string): PlayerFriend[] {
  return MOCK_FRIENDS[playerId] || MOCK_FRIENDS["P-104392"];
}