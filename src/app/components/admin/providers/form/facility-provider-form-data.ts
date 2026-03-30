// ─── Facility Provider Form — Helpers, Validation & Mock Data ─

// Re-export shared utilities from the training provider form data
export {
  COUNTRY_CODES,
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_EXTENSIONS,
  ACCEPTED_PHOTO_TYPES,
  MAX_DOC_SIZE,
  MAX_PHOTO_SIZE,
  formatFileSize,
  checkEmailDuplicate,
  validateEmail,
  validateMobileNumber,
  validateLandline,
  validateDateOfIncorporation,
} from "./training-provider-form-data";

export type { CountryCode, UploadedFile } from "./training-provider-form-data";

// ─── Re-export status types from provider-data ────────────────
export type { VerificationStatus, AccountStatus, PlatformStatus } from "../provider-data";

// ─── Facility Form State ─────────────────────────────────────

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface FacilityFormState {
  facilityName: string;
  incorporationDate: Date | null;
  email: string;
  countryCode: string;
  mobileNumber: string;
  personInCharge: string;
  designation: string;
  landline: string;
  website: string;
  // ── Facility Details (US-3.2.2) ──
  aboutFacility: string;
  openingTime: string; // "HH:MM" or ""
  closingTime: string; // "HH:MM" or ""
  workingDays: Weekday[];
  facilityRules: string;
  cancellationPolicy: string;
  // ── Status & Verification (US-3.2.3) ──
  verificationStatus: "Pending" | "Approved" | "Rejected";
  accountStatus: "Locked" | "Unlocked";
  platformStatus: "Active" | "Inactive";
  // ── Additional Information (US-3.2.4) ──
  providerId: string;
  registrationNumber: string;
  taxId: string;
  businessLicense: string;
  createdAt: Date | null; // read-only, system-generated
}

/** Fields excluded from error/touched tracking (read-only or non-validatable) */
type ExcludedFields = "workingDays" | "verificationStatus" | "accountStatus" | "platformStatus" | "createdAt";

export type FacilityFieldErrors = Partial<Record<keyof Omit<FacilityFormState, ExcludedFields> | "workingDays" | "timeRange", string>>;
export type FacilityTouchedFields = Partial<Record<keyof Omit<FacilityFormState, ExcludedFields> | "workingDays" | "timeRange", boolean>>;

// ─── Facility-Specific Validation ────────────────────────────

const ALPHA_SPACES = /^[A-Za-z\u00C0-\u024F\u0600-\u06FF\s\-'.]+$/;

export function validateFacilityName(value: string): string | null {
  if (!value.trim()) return "Facility Name is required";
  if (value.length > 200) return "Maximum 200 characters allowed";
  return null;
}

export function validatePersonInCharge(value: string): string | null {
  if (!value.trim()) return "Person In Charge is required";
  if (value.length > 150) return "Maximum 150 characters allowed";
  if (!ALPHA_SPACES.test(value.trim()))
    return "Only alphabets and spaces are allowed";
  return null;
}

export function validateDesignation(value: string): string | null {
  if (!value.trim()) return null; // not required
  if (value.length > 100) return "Maximum 100 characters allowed";
  return null;
}

export function validateWebsite(value: string): string | null {
  if (!value.trim()) return null; // not required
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Please enter a valid URL (http:// or https://)";
    }
    return null;
  } catch {
    return "Please enter a valid URL (http:// or https://)";
  }
}

// ─── Facility Details Validation (US-3.2.2) ──────────────────

const MAX_TEXTAREA_LENGTH = 5000;

export function validateAboutFacility(value: string): string | null {
  if (value.length > MAX_TEXTAREA_LENGTH) return `Maximum ${MAX_TEXTAREA_LENGTH} characters allowed`;
  return null;
}

export function validateFacilityRules(value: string): string | null {
  if (value.length > MAX_TEXTAREA_LENGTH) return `Maximum ${MAX_TEXTAREA_LENGTH} characters allowed`;
  return null;
}

export function validateCancellationPolicy(value: string): string | null {
  if (value.length > MAX_TEXTAREA_LENGTH) return `Maximum ${MAX_TEXTAREA_LENGTH} characters allowed`;
  return null;
}

/** Parse "HH:MM" → minutes since midnight, or null if empty/invalid */
export function parseTimeToMinutes(time: string): number | null {
  if (!time.trim()) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/** Cross-field: returns error when opening >= closing */
export function validateTimeRange(opening: string, closing: string): string | null {
  const openMin = parseTimeToMinutes(opening);
  const closeMin = parseTimeToMinutes(closing);
  if (openMin === null || closeMin === null) return null; // skip if either empty
  if (openMin >= closeMin) return "Closing time must be after opening time.";
  return null;
}

/** Soft warning when times are set but no working days selected */
export function getWorkingDaysWarning(openingTime: string, closingTime: string, workingDays: Weekday[]): string | null {
  if ((openingTime.trim() || closingTime.trim()) && workingDays.length === 0) {
    return "Consider selecting at least one working day when operating hours are set.";
  }
  return null;
}

/** Generate time slots in 30-minute increments (00:00 → 23:30) */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return slots;
}

export const TIME_SLOTS = generateTimeSlots();

// ─── Additional Information Validation (US-3.2.4) ────────────

const ALPHANUMERIC_EXTENDED = /^[A-Za-z0-9\u00C0-\u024F\u0600-\u06FF\s\-/_.]+$/;

export function validateProviderId(value: string): string | null {
  if (!value.trim()) return null; // not required
  if (value.length > 50) return "Maximum 50 characters allowed";
  if (!ALPHANUMERIC_EXTENDED.test(value.trim())) return "Only alphanumeric characters allowed";
  return null;
}

export function validateRegistrationNumber(value: string): string | null {
  if (!value.trim()) return null; // not required
  if (value.length > 50) return "Maximum 50 characters allowed";
  if (!ALPHANUMERIC_EXTENDED.test(value.trim())) return "Only alphanumeric characters allowed";
  return null;
}

export function validateTaxId(value: string): string | null {
  if (!value.trim()) return null; // not required
  if (value.length > 50) return "Maximum 50 characters allowed";
  if (!ALPHANUMERIC_EXTENDED.test(value.trim())) return "Only alphanumeric characters allowed";
  return null;
}

export function validateBusinessLicense(value: string): string | null {
  if (!value.trim()) return null; // not required
  if (value.length > 100) return "Maximum 100 characters allowed";
  if (!ALPHANUMERIC_EXTENDED.test(value.trim())) return "Only alphanumeric characters allowed";
  return null;
}

/** Generate an auto Provider ID for new facility providers */
export function generateProviderId(): string {
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `FP-${seq}`;
}

// ─── Mock Facility Detail for Edit Mode ──────────────────────

import { MOCK_PROVIDERS } from "../provider-data";

export interface FacilityProviderDetail {
  id: string;
  facilityName: string;
  incorporationDate: Date;
  email: string;
  mobile: string;
  personInCharge: string;
  designation: string;
  landline: string;
  website: string;
  verificationStatus: string;
  accountStatus: string;
  platformStatus: string;
  // ── Facility Details (US-3.2.2) ──
  aboutFacility: string;
  openingTime: string;
  closingTime: string;
  workingDays: Weekday[];
  facilityRules: string;
  cancellationPolicy: string;
  // ── Additional Information (US-3.2.4) ──
  providerId: string;
  registrationNumber: string;
  taxId: string;
  businessLicense: string;
  createdAt: Date;
}

// Additional info mock data per facility provider
interface FacilityAdditionalInfo {
  registrationNumber: string;
  taxId: string;
  businessLicense: string;
  createdAt: Date;
}

const FACILITY_ADDITIONAL_INFO: Record<string, FacilityAdditionalInfo> = {
  "FP-001": { registrationNumber: "REG-2024-00142", taxId: "TAX-AE-78291", businessLicense: "BL-DXB-2024-0891", createdAt: new Date(2024, 8, 15, 10, 23, 45) },
  "FP-002": { registrationNumber: "REG-2024-00287", taxId: "TAX-AE-63412", businessLicense: "BL-DXB-2024-1102", createdAt: new Date(2024, 9, 2, 14, 5, 12) },
  "FP-003": { registrationNumber: "", taxId: "", businessLicense: "", createdAt: new Date(2024, 10, 18, 9, 45, 0) },
  "FP-004": { registrationNumber: "REG-2024-00501", taxId: "TAX-AE-90112", businessLicense: "BL-AUH-2024-0445", createdAt: new Date(2024, 7, 22, 11, 30, 22) },
  "FP-005": { registrationNumber: "REG-2025-00033", taxId: "", businessLicense: "BL-DXB-2025-0073", createdAt: new Date(2025, 0, 5, 8, 15, 0) },
  "FP-006": { registrationNumber: "", taxId: "", businessLicense: "", createdAt: new Date(2025, 1, 10, 16, 42, 33) },
  "FP-007": { registrationNumber: "REG-2024-00612", taxId: "TAX-AE-44089", businessLicense: "BL-AUH-2024-0712", createdAt: new Date(2024, 6, 1, 12, 0, 0) },
  "FP-008": { registrationNumber: "", taxId: "", businessLicense: "", createdAt: new Date(2025, 2, 8, 10, 55, 18) },
  "FP-009": { registrationNumber: "REG-2024-00788", taxId: "TAX-AE-55123", businessLicense: "", createdAt: new Date(2024, 11, 20, 9, 10, 5) },
  "FP-010": { registrationNumber: "REG-2024-00412", taxId: "TAX-AE-33901", businessLicense: "BL-DXB-2024-0533", createdAt: new Date(2024, 5, 14, 15, 20, 40) },
  "FP-011": { registrationNumber: "", taxId: "", businessLicense: "BL-DXB-2025-0201", createdAt: new Date(2025, 0, 28, 13, 35, 0) },
  "FP-012": { registrationNumber: "REG-2025-00089", taxId: "", businessLicense: "", createdAt: new Date(2025, 3, 1, 7, 50, 22) },
  "FP-013": { registrationNumber: "REG-2024-00955", taxId: "TAX-AE-67234", businessLicense: "BL-DXB-2024-1288", createdAt: new Date(2024, 4, 10, 11, 0, 0) },
  "FP-014": { registrationNumber: "", taxId: "", businessLicense: "", createdAt: new Date(2025, 4, 5, 14, 25, 10) },
  "FP-015": { registrationNumber: "REG-2024-01100", taxId: "TAX-AE-81456", businessLicense: "BL-SHJ-2024-0322", createdAt: new Date(2024, 3, 18, 16, 10, 0) },
  "FP-016": { registrationNumber: "", taxId: "", businessLicense: "", createdAt: new Date(2025, 5, 12, 9, 0, 0) },
  "FP-017": { registrationNumber: "REG-2025-00156", taxId: "", businessLicense: "", createdAt: new Date(2025, 1, 20, 10, 45, 30) },
  "FP-018": { registrationNumber: "REG-2024-00678", taxId: "TAX-AE-72345", businessLicense: "BL-AUH-2024-0901", createdAt: new Date(2024, 2, 25, 8, 30, 0) },
};

// Map from provider-data mock entries for facility providers
const FACILITY_DETAILS: Record<string, Partial<FacilityProviderDetail>> = {
  "FP-001": { designation: "General Manager", landline: "+971 4 300 1111", website: "https://alhamrasports.ae", aboutFacility: "Premier multi-sport facility featuring world-class courts, swimming pools, and fitness centers. Al Hamra Sports Complex offers state-of-the-art amenities for athletes of all levels.", openingTime: "06:00", closingTime: "22:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as Weekday[], facilityRules: "1. Proper sports attire required at all times\n2. No food or drinks in court areas\n3. Guests must check in at reception\n4. Children under 12 must be accompanied by an adult", cancellationPolicy: "Cancellations must be made at least 24 hours in advance for a full refund. Late cancellations will incur a 50% charge." },
  "FP-002": { designation: "Operations Director", landline: "+971 4 300 2222", website: "https://dubaiarena.ae", aboutFacility: "Dubai Arena is a world-class indoor sporting venue hosting major events and providing premium training facilities.", openingTime: "07:00", closingTime: "23:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as Weekday[], facilityRules: "1. Valid membership or booking required\n2. No smoking on premises", cancellationPolicy: "48-hour cancellation policy applies. No-shows will be charged in full." },
  "FP-003": { designation: "Facility Manager", landline: "", website: "", aboutFacility: "", openingTime: "", closingTime: "", workingDays: [] as Weekday[], facilityRules: "", cancellationPolicy: "" },
  "FP-004": { designation: "CEO", landline: "+971 2 400 3333", website: "https://yassportsarena.ae", aboutFacility: "Located on Yas Island, this multi-purpose sports arena offers indoor and outdoor facilities for tennis, basketball, and swimming.", openingTime: "05:30", closingTime: "21:30", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as Weekday[], facilityRules: "All visitors must register at the front desk.", cancellationPolicy: "Free cancellation up to 12 hours before booking." },
  "FP-005": { designation: "Head of Operations", landline: "+971 4 300 5555", website: "https://falconstadium.ae", aboutFacility: "Falcon Stadium is a premier football venue with FIFA-standard pitches.", openingTime: "08:00", closingTime: "22:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as Weekday[], facilityRules: "No metal studs allowed on artificial pitches.", cancellationPolicy: "Cancellations accepted up to 24 hours before the booked slot." },
  "FP-006": { designation: "Club Manager", landline: "", website: "https://oasispadel.ae", aboutFacility: "", openingTime: "07:00", closingTime: "21:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as Weekday[], facilityRules: "", cancellationPolicy: "" },
  "FP-007": { designation: "Director", landline: "+971 2 400 6666", website: "https://capitalsportsvillage.ae", aboutFacility: "Capital Sports Village offers a wide range of outdoor and indoor sports facilities.", openingTime: "06:00", closingTime: "22:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as Weekday[], facilityRules: "Proper conduct expected at all times.", cancellationPolicy: "24-hour cancellation policy." },
  "FP-008": { designation: "General Manager", landline: "", website: "", aboutFacility: "", openingTime: "", closingTime: "", workingDays: [] as Weekday[], facilityRules: "", cancellationPolicy: "" },
  "FP-009": { designation: "Operations Manager", landline: "+971 4 300 9999", website: "", aboutFacility: "", openingTime: "09:00", closingTime: "20:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as Weekday[], facilityRules: "", cancellationPolicy: "" },
  "FP-010": { designation: "Community Manager", landline: "+971 4 300 1010", website: "https://deiracommunity.ae", aboutFacility: "Deira Community Sports Center serves the local community with affordable sports programs.", openingTime: "06:30", closingTime: "21:30", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as Weekday[], facilityRules: "1. Community members have priority booking\n2. Equipment must be returned after use", cancellationPolicy: "Free cancellation up to 6 hours in advance." },
  "FP-011": { designation: "Fitness Director", landline: "", website: "https://marinabayfit.ae", aboutFacility: "", openingTime: "05:00", closingTime: "23:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as Weekday[], facilityRules: "", cancellationPolicy: "" },
  "FP-012": { designation: "Sports Coordinator", landline: "+971 3 500 1212", website: "", aboutFacility: "", openingTime: "", closingTime: "", workingDays: [] as Weekday[], facilityRules: "", cancellationPolicy: "" },
  "FP-013": { designation: "General Manager", landline: "+971 4 300 1313", website: "https://jbsportsclub.ae", aboutFacility: "JB Sports Club offers premium tennis, squash, and swimming facilities.", openingTime: "06:00", closingTime: "22:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as Weekday[], facilityRules: "Proper sports attire required.", cancellationPolicy: "24-hour cancellation required for refund." },
  "FP-014": { designation: "Center Manager", landline: "", website: "", aboutFacility: "", openingTime: "", closingTime: "", workingDays: [] as Weekday[], facilityRules: "", cancellationPolicy: "" },
  "FP-015": { designation: "Operations Head", landline: "+971 6 600 1515", website: "https://saharasportsdome.ae", aboutFacility: "Sahara Sports Dome is a climate-controlled indoor sports facility.", openingTime: "07:00", closingTime: "23:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as Weekday[], facilityRules: "No outdoor footwear inside the dome.", cancellationPolicy: "Cancellations within 12 hours will be charged 25%." },
  "FP-016": { designation: "Complex Manager", landline: "", website: "", aboutFacility: "", openingTime: "", closingTime: "", workingDays: [] as Weekday[], facilityRules: "", cancellationPolicy: "" },
  "FP-017": { designation: "Grounds Manager", landline: "+971 2 400 1717", website: "", aboutFacility: "", openingTime: "06:00", closingTime: "20:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as Weekday[], facilityRules: "", cancellationPolicy: "" },
  "FP-018": { designation: "Events Director", landline: "+971 2 400 1818", website: "https://adindoorarena.ae", aboutFacility: "Abu Dhabi Indoor Arena hosts international sports events and training camps.", openingTime: "08:00", closingTime: "22:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as Weekday[], facilityRules: "Photo ID required for entry.", cancellationPolicy: "Events: 72 hours. Training: 24 hours." },
};

export function getFacilityProviderDetail(id: string): FacilityProviderDetail | null {
  const provider = MOCK_PROVIDERS.find(p => p.id === id && p.providerType === "Facility Provider");
  if (!provider) return null;

  const extra = FACILITY_DETAILS[id] ?? {};
  const additionalInfo = FACILITY_ADDITIONAL_INFO[id] ?? { registrationNumber: "", taxId: "", businessLicense: "", createdAt: new Date() };

  return {
    id: provider.id,
    facilityName: provider.name,
    incorporationDate: provider.incorporationDate ?? new Date(2025, 0, 1),
    email: provider.email,
    mobile: provider.mobile,
    personInCharge: provider.personInCharge ?? "",
    designation: extra.designation ?? "",
    landline: extra.landline ?? "",
    website: extra.website ?? "",
    verificationStatus: provider.verificationStatus,
    accountStatus: provider.accountStatus,
    platformStatus: provider.platformStatus,
    // ── Facility Details (US-3.2.2) ──
    aboutFacility: extra.aboutFacility ?? "",
    openingTime: extra.openingTime ?? "",
    closingTime: extra.closingTime ?? "",
    workingDays: extra.workingDays ?? [],
    facilityRules: extra.facilityRules ?? "",
    cancellationPolicy: extra.cancellationPolicy ?? "",
    // ── Additional Information (US-3.2.4) ──
    providerId: provider.id,
    registrationNumber: additionalInfo.registrationNumber,
    taxId: additionalInfo.taxId,
    businessLicense: additionalInfo.businessLicense,
    createdAt: additionalInfo.createdAt,
  };
}