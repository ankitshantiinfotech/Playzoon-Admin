// ─── SCR-ADM-031 / SCR-ADM-032 Commission Configuration — Types ──────────────

export type ProviderType = "Facility Provider" | "Training Provider" | "Coach";
export type ServiceType = "Per Session" | "Subscription" | "All";
export type DurationType = "Days" | "Weeks" | "Months";
export type CommissionStatus = "Active" | "Inactive";

export const PROVIDER_TYPES: ProviderType[] = [
  "Facility Provider",
  "Training Provider",
  "Coach",
];

export const SERVICE_TYPES: ServiceType[] = [
  "Per Session",
  "Subscription",
  "All",
];

export const DURATION_TYPES: DurationType[] = ["Days", "Weeks", "Months"];

export interface CommissionRule {
  id: string;
  providerType: ProviderType;
  serviceType: ServiceType;
  providerName: string; // specific provider name or "All Providers"
  providerId: string | null; // null means "All Providers"
  country: string; // specific country name or "All Countries"
  countryCode: string | null; // null means "All Countries"
  commissionRate: number; // 0.00 - 100.00
  taxRate: number; // 0.00 - 100.00
  payoutDuration: number; // integer >= 1
  durationType: DurationType;
  status: CommissionStatus;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  updatedBy: string;
}

export interface ChangeHistoryRecord {
  id: string;
  ruleId: string;
  previousRate: number | null;
  newRate: number;
  previousTaxRate: number | null;
  newTaxRate: number | null;
  effectiveFrom: string; // ISO datetime
  modifiedBy: string;
  timestamp: string; // ISO datetime
}

export interface CommissionFormData {
  providerType: ProviderType | "";
  serviceType: ServiceType | "";
  providerName: string; // "All Providers" or specific
  providerId: string | null;
  country: string; // "All Countries" or specific
  countryCode: string | null;
  commissionRate: string;
  taxRate: string;
  payoutDuration: string;
  durationType: DurationType | "";
  status: CommissionStatus;
}

export const EMPTY_FORM: CommissionFormData = {
  providerType: "",
  serviceType: "",
  providerName: "All Providers",
  providerId: null,
  country: "All Countries",
  countryCode: null,
  commissionRate: "",
  taxRate: "",
  payoutDuration: "",
  durationType: "",
  status: "Active",
};

// Provider list for the searchable dropdown (mock)
export interface ProviderOption {
  id: string;
  name: string;
  type: ProviderType;
}

export const MOCK_PROVIDERS: ProviderOption[] = [
  { id: "fp-001", name: "Al Wasl Sports Complex", type: "Facility Provider" },
  { id: "fp-002", name: "Crescent Sports Club", type: "Facility Provider" },
  { id: "fp-003", name: "London Premier Pitches", type: "Facility Provider" },
  { id: "fp-004", name: "Bahrain Water Sports Hub", type: "Facility Provider" },
  { id: "tp-001", name: "Elite Football Academy", type: "Training Provider" },
  { id: "tp-002", name: "Cairo Sports Academy", type: "Training Provider" },
  { id: "tp-003", name: "Kuwait Elite Training", type: "Training Provider" },
  { id: "tp-004", name: "Al-Riyadh Youth Sports Club", type: "Training Provider" },
  { id: "co-001", name: "Ahmad Al-Rashidi", type: "Coach" },
  { id: "co-002", name: "Hassan Al-Farsi", type: "Coach" },
  { id: "co-003", name: "Nour Al-Khalid", type: "Coach" },
];

export interface CountryOption {
  code: string;
  name: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "JO", name: "Jordan" },
  { code: "EG", name: "Egypt" },
  { code: "GB", name: "United Kingdom" },
];
