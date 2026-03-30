// ─── Training Provider Form — Helpers & Mock Data ────────────

// ─── Country Codes ───────────────────────────────────────────

export interface CountryCode {
  code: string;   // e.g. "+971"
  iso: string;    // e.g. "AE"
  flag: string;   // emoji
  name: string;
  label: string;  // "+971 (UAE)"
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "+971", iso: "AE", flag: "\u{1F1E6}\u{1F1EA}", name: "United Arab Emirates", label: "+971 (UAE)" },
  { code: "+966", iso: "SA", flag: "\u{1F1F8}\u{1F1E6}", name: "Saudi Arabia", label: "+966 (KSA)" },
  { code: "+973", iso: "BH", flag: "\u{1F1E7}\u{1F1ED}", name: "Bahrain", label: "+973 (BHR)" },
  { code: "+968", iso: "OM", flag: "\u{1F1F4}\u{1F1F2}", name: "Oman", label: "+968 (OMN)" },
  { code: "+974", iso: "QA", flag: "\u{1F1F6}\u{1F1E6}", name: "Qatar", label: "+974 (QAT)" },
  { code: "+965", iso: "KW", flag: "\u{1F1F0}\u{1F1FC}", name: "Kuwait", label: "+965 (KWT)" },
  { code: "+962", iso: "JO", flag: "\u{1F1EF}\u{1F1F4}", name: "Jordan", label: "+962 (JOR)" },
  { code: "+20",  iso: "EG", flag: "\u{1F1EA}\u{1F1EC}", name: "Egypt", label: "+20 (EGY)" },
  { code: "+91",  iso: "IN", flag: "\u{1F1EE}\u{1F1F3}", name: "India", label: "+91 (IND)" },
  { code: "+92",  iso: "PK", flag: "\u{1F1F5}\u{1F1F0}", name: "Pakistan", label: "+92 (PAK)" },
  { code: "+63",  iso: "PH", flag: "\u{1F1F5}\u{1F1ED}", name: "Philippines", label: "+63 (PHL)" },
  { code: "+44",  iso: "GB", flag: "\u{1F1EC}\u{1F1E7}", name: "United Kingdom", label: "+44 (UK)" },
  { code: "+1",   iso: "US", flag: "\u{1F1FA}\u{1F1F8}", name: "United States", label: "+1 (USA)" },
  { code: "+33",  iso: "FR", flag: "\u{1F1EB}\u{1F1F7}", name: "France", label: "+33 (FRA)" },
  { code: "+49",  iso: "DE", flag: "\u{1F1E9}\u{1F1EA}", name: "Germany", label: "+49 (DEU)" },
  { code: "+86",  iso: "CN", flag: "\u{1F1E8}\u{1F1F3}", name: "China", label: "+86 (CHN)" },
];

// ─── Accepted file types ─────────────────────────────────────

export const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const ACCEPTED_DOC_EXTENSIONS = [".pdf", ".png", ".jpeg", ".jpg", ".doc", ".docx", ".xls", ".xlsx"];

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png"];
export const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── File upload state ───────────────────────────────────────

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number; // 0-100
  status: "uploading" | "complete" | "error";
  previewUrl?: string;
}

// ─── Mock existing emails (for duplicate check) ──────────────

const EXISTING_EMAILS = new Set([
  "info@alhamrasports.ae",
  "admin@dubaiarena.ae",
  "contact@sharjahfitnesshub.ae",
  "bookings@yassportsarena.ae",
  "info@capitalsportsvillage.ae",
  "admin@palmsports.ae",
  "info@marinabay.ae",
  "bookings@rakactive.ae",
  "info@saharadome.ae",
  "admin@khalifacity.ae",
  "info@alwasl.ae",
  "admin@jumeirah.ae",
  "coach@academy.ae",
  "info@elitetraining.ae",
  "training@sportsuae.ae",
  "admin@playzoon.ae",
  "test@example.com",
]);

/**
 * Simulates an async email uniqueness check.
 * Returns true if the email is already registered.
 */
export function checkEmailDuplicate(email: string): Promise<boolean> {
  return new Promise((resolve) => {
    const delay = 800 + Math.random() * 700; // 0.8–1.5s
    setTimeout(() => {
      resolve(EXISTING_EMAILS.has(email.trim().toLowerCase()));
    }, delay);
  });
}

// ─── Validation helpers ──────────────────────────────────────

const ALPHA_SPACES_HYPHENS = /^[A-Za-z\u00C0-\u024F\u0600-\u06FF\s\-']+$/;

export function validateClubName(value: string): string | null {
  if (!value.trim()) return "Club/Institute Name is required";
  if (value.length > 200) return "Maximum 200 characters allowed";
  return null;
}

export function validateName(value: string, fieldLabel: string): string | null {
  if (!value.trim()) return `${fieldLabel} is required`;
  if (value.length > 100) return "Maximum 100 characters allowed";
  if (!ALPHA_SPACES_HYPHENS.test(value.trim()))
    return "Only alphabets, spaces, and hyphens are allowed";
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return "Invalid email format";
  return null;
}

export function validateMobileNumber(value: string): string | null {
  if (!value.trim()) return "Mobile number is required";
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length < 7 || digitsOnly.length > 15)
    return "Mobile number must be 7-15 digits";
  return null;
}

export function validateLandline(value: string): string | null {
  if (!value.trim()) return null; // not required
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length < 7 || digitsOnly.length > 15)
    return "Landline must be 7-15 digits";
  return null;
}

export function validateDateOfIncorporation(value: Date | null): string | null {
  if (!value) return "Date of incorporation is required";
  if (value > new Date()) return "Cannot be a future date";
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
