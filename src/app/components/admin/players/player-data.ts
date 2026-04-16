// ─── Extended player types & mock data ───────────────────────

export type PlayerStatus = "Active" | "Inactive" | "Locked" | "Unlocked";
export type LockStatus  = "Locked" | "Unlocked";

export interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  status: PlayerStatus;
  dependents: number;
  createdAt: Date;
  lastActiveAt: Date;
  avatarUrl?: string;
  lockedUntil?: string;
  walletBalance: number;
  isSSOUser: boolean;
  // AC-PM-021 / AC-PM-013 additions
  nationality: string;
  defaultCity: string;
  defaultCountry: string;
  savedAddressesCount: number; // total saved addresses (including default)
}

export interface AppliedFilters {
  search: string;
  statuses: PlayerStatus[];
  nationalities: string[];
  lockStatuses: LockStatus[];
  createdFrom: Date | undefined;
  createdTo: Date | undefined;
  hasDependents: boolean;
}

export const EMPTY_FILTERS: AppliedFilters = {
  search: "",
  statuses: [],
  nationalities: [],
  lockStatuses: [],
  createdFrom: undefined,
  createdTo: undefined,
  hasDependents: false,
};

export interface PlayerAuditEvent {
  id: string;
  timestamp: Date;
  actor: string;
  actorRole: string;
  action: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string;
  module: string;
}