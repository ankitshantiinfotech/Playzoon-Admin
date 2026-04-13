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
  lastActiveFrom: Date | undefined;
  lastActiveTo: Date | undefined;
  hasDependents: boolean;
}

export const EMPTY_FILTERS: AppliedFilters = {
  search: "",
  statuses: [],
  nationalities: [],
  lockStatuses: [],
  createdFrom: undefined,
  createdTo: undefined,
  lastActiveFrom: undefined,
  lastActiveTo: undefined,
  hasDependents: false,
};

export const EXPORT_FIELDS = [
  { value: "id", label: "Player ID" },
  { value: "name", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "gender", label: "Gender" },
  { value: "nationality", label: "Nationality" },
  { value: "status", label: "Status" },
  { value: "dependents", label: "Dependents Count" },
  { value: "createdAt", label: "Created Date" },
  { value: "lastActiveAt", label: "Last Active" },
  { value: "walletBalance", label: "Wallet Balance" },
];

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