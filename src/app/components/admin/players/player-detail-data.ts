// ─── Player Detail Types ──────────────────────────

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
  countryCode: string;
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
  avatarUrl?: string;
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