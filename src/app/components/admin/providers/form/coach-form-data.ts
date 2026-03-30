// ─── US-4.2.1 — Coach Form Data, Types & Validation ─────────

// Re-export shared utilities from training provider
export {
  COUNTRY_CODES,
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTO_SIZE,
  formatFileSize,
  checkEmailDuplicate,
  validateEmail,
  validateMobileNumber,
} from "./training-provider-form-data";

export type { CountryCode } from "./training-provider-form-data";

// Re-export status types from provider-data for toggles
export type { VerificationStatus, AccountStatus, PlatformStatus } from "../provider-data";

// ─── Gender ──────────────────────────────────────────────────

export const GENDERS = ["Male", "Female", "Rather not Say"] as const;
export type Gender = (typeof GENDERS)[number];

// ─── Nationalities (master data) ─────────────────────────────

export const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan",
  "Argentine", "Armenian", "Australian", "Austrian", "Azerbaijani",
  "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian",
  "Bolivian", "Bosnian", "Brazilian", "British", "Bulgarian",
  "Cambodian", "Cameroonian", "Canadian", "Chilean", "Chinese",
  "Colombian", "Congolese", "Costa Rican", "Croatian", "Cuban",
  "Czech", "Danish", "Dominican", "Dutch", "Ecuadorian",
  "Egyptian", "Emirati", "Eritrean", "Estonian", "Ethiopian",
  "Filipino", "Finnish", "French", "Georgian", "German",
  "Ghanaian", "Greek", "Guatemalan", "Haitian", "Honduran",
  "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian",
  "Iraqi", "Irish", "Israeli", "Italian", "Ivorian",
  "Jamaican", "Japanese", "Jordanian", "Kazakh", "Kenyan",
  "Korean", "Kuwaiti", "Kyrgyz", "Lao", "Latvian",
  "Lebanese", "Libyan", "Lithuanian", "Luxembourgish", "Macedonian",
  "Malaysian", "Maldivian", "Malian", "Maltese", "Mauritanian",
  "Mexican", "Moldovan", "Mongolian", "Montenegrin", "Moroccan",
  "Mozambican", "Namibian", "Nepali", "New Zealander", "Nicaraguan",
  "Nigerian", "Norwegian", "Omani", "Pakistani", "Palestinian",
  "Panamanian", "Paraguayan", "Peruvian", "Polish", "Portuguese",
  "Qatari", "Romanian", "Russian", "Rwandan", "Saudi",
  "Senegalese", "Serbian", "Singaporean", "Slovak", "Slovenian",
  "Somali", "South African", "Spanish", "Sri Lankan", "Sudanese",
  "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik",
  "Tanzanian", "Thai", "Togolese", "Trinidadian", "Tunisian",
  "Turkish", "Turkmen", "Ugandan", "Ukrainian", "Uruguayan",
  "Uzbek", "Venezuelan", "Vietnamese", "Yemeni", "Zambian", "Zimbabwean",
] as const;

// ─── Languages (master data) ────────────────────────────────

export const LANGUAGES = [
  "Arabic", "English", "French", "Spanish", "Portuguese",
  "German", "Italian", "Russian", "Chinese (Mandarin)", "Chinese (Cantonese)",
  "Japanese", "Korean", "Hindi", "Urdu", "Bengali",
  "Tagalog", "Turkish", "Persian (Farsi)", "Malay", "Indonesian",
  "Thai", "Vietnamese", "Dutch", "Greek", "Polish",
  "Romanian", "Swedish", "Norwegian", "Danish", "Finnish",
  "Czech", "Hungarian", "Hebrew", "Swahili", "Amharic",
] as const;

// ─── Coach Form State ────────────────────────────────────────

export interface CoachFormState {
  // ── Personal Information (US-4.2.1) ──
  profileImage: string | null; // data URL of cropped image or null
  firstName: string;
  lastName: string;
  dob: Date | null;
  gender: Gender | "";
  email: string;
  countryCode: string;
  mobileNumber: string;
  nationality: string;
  languages: string[];
  // ── Status & Verification (US-4.3.1) ──
  verificationStatus: "Pending" | "Approved" | "Rejected";
  accountStatus: "Locked" | "Unlocked";
  platformStatus: "Active" | "Inactive";
}

// ─── Field Error / Touched Types ─────────────────────────────

export type CoachFieldErrors = Partial<
  Record<keyof CoachFormState, string>
>;
export type CoachTouchedFields = Partial<
  Record<keyof CoachFormState, boolean>
>;

// ─── Initial Form State ─────────────────────────────────────

export const INITIAL_COACH_FORM: CoachFormState = {
  profileImage: null,
  firstName: "",
  lastName: "",
  dob: null,
  gender: "",
  email: "",
  countryCode: "+971",
  mobileNumber: "",
  nationality: "",
  languages: [],
  // ── Status defaults (US-4.3.1) ──
  verificationStatus: "Pending",
  accountStatus: "Unlocked",
  platformStatus: "Inactive",
};

// ─── Validation Functions ───────────────────────────────────

const ALPHA_SPACES_HYPHENS = /^[A-Za-z\u00C0-\u024F\u0600-\u06FF\s\-']+$/;

export function validateFirstName(value: string): string | null {
  if (!value.trim()) return "First Name is required";
  if (value.length > 100) return "Maximum 100 characters allowed";
  if (!ALPHA_SPACES_HYPHENS.test(value.trim()))
    return "Only alphabets, spaces, and hyphens are allowed";
  return null;
}

export function validateLastName(value: string): string | null {
  if (!value.trim()) return "Last Name is required";
  if (value.length > 100) return "Maximum 100 characters allowed";
  if (!ALPHA_SPACES_HYPHENS.test(value.trim()))
    return "Only alphabets, spaces, and hyphens are allowed";
  return null;
}

export function validateDOB(value: Date | null): string | null {
  if (!value) return "Date of Birth is required";
  const today = new Date();
  if (value > today) return "Date of Birth cannot be in the future";
  // Age >= 18 check
  const eighteenYearsAgo = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );
  if (value > eighteenYearsAgo)
    return "Coach must be at least 18 years old";
  return null;
}

export function validateGender(value: string): string | null {
  if (!value) return "Gender is required";
  return null;
}

export function validateNationality(value: string): string | null {
  if (!value) return "Nationality is required";
  return null;
}

// ─── Mock Coach Detail (for edit mode pre-fill) ──────────────

export function getCoachDetail(id: string): CoachFormState | null {
  // Simulate fetching detail for edit mode
  const mockDetails: Record<string, CoachFormState> = {
    "FC-001": {
      profileImage: null,
      firstName: "Ahmed",
      lastName: "Al Mansouri",
      dob: new Date(1988, 2, 15),
      gender: "Male",
      email: "ahmed.mansouri@coach.ae",
      countryCode: "+971",
      mobileNumber: "507000001",
      nationality: "Emirati",
      languages: ["Arabic", "English"],
      // ── Status defaults (US-4.3.1) ──
      verificationStatus: "Approved",
      accountStatus: "Unlocked",
      platformStatus: "Active",
    },
    "FC-002": {
      profileImage: null,
      firstName: "Sara",
      lastName: "Al Hashemi",
      dob: new Date(1992, 6, 22),
      gender: "Female",
      email: "sara.hashemi@coach.ae",
      countryCode: "+971",
      mobileNumber: "557000002",
      nationality: "Emirati",
      languages: ["Arabic", "English", "French"],
      // ── Status defaults (US-4.3.1) ──
      verificationStatus: "Pending",
      accountStatus: "Unlocked",
      platformStatus: "Inactive",
    },
    "FC-003": {
      profileImage: null,
      firstName: "Khalid",
      lastName: "bin Rashid Al Nuaimi",
      dob: new Date(1985, 10, 8),
      gender: "Male",
      email: "khalid.nuaimi@coach.ae",
      countryCode: "+971",
      mobileNumber: "567000003",
      nationality: "Emirati",
      languages: ["Arabic", "English"],
      // ── Status defaults (US-4.3.1) ──
      verificationStatus: "Rejected",
      accountStatus: "Locked",
      platformStatus: "Inactive",
    },
  };
  return mockDetails[id] ?? null;
}