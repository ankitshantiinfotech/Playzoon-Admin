// ─── Service Provider Types & Mock Data ──────────────────────

export type ProviderType = "Facility Provider" | "Training Provider";
export type OnboardingProviderType = "Facility Provider" | "Training Provider" | "Freelance Coach";
export type VerificationStatus = "Pending" | "Approved" | "Rejected";
export type AccountStatus = "Locked" | "Unlocked";
export type PlatformStatus = "Active" | "Inactive";

// ─── Submission History ──────────────────────────────────────

export interface FieldSnapshot {
  providerName: string;
  businessName: string;
  email: string;
  mobile: string;
  city: string;
  area: string;
  licenseNumber: string;
  description: string;
  sportCategory: string;
  website?: string;
}

export interface SubmissionEntry {
  submissionNumber: number;
  submittedAt: Date;
  status: VerificationStatus;
  rejectionReason?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  fieldSnapshot: FieldSnapshot;
}

export interface ServiceProvider {
  id: string;
  name: string;
  email: string;
  mobile: string;
  providerType: ProviderType;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  platformStatus: PlatformStatus;
  createdAt: Date;
  rejectionReason?: string;
  resubmissionCount?: number;
  submissionHistory?: SubmissionEntry[];
  profileData?: FieldSnapshot;
  /** Display-only provider type for onboarding (may differ from tab-level providerType) */
  onboardingType?: OnboardingProviderType;
  // ── Lock info (US-5.1.1) ──
  lockedAt?: Date;
  lockedBy?: string;
  // ── Facility-specific fields ──
  incorporationDate?: Date;
  personInCharge?: string;
}

// ─── Provider-type tab definitions ───────────────────────────

export type ProviderTabKey = ProviderType | "Onboarding";

export const PROVIDER_TABS: { key: ProviderTabKey; label: string; shortLabel: string }[] = [
  { key: "Facility Provider", label: "Facility Providers", shortLabel: "Facility" },
  { key: "Training Provider", label: "Training Providers", shortLabel: "Training" },
  { key: "Onboarding", label: "Onboarding Requests", shortLabel: "Onboarding" },
];

// ─── Sort fields ─────────────────────────────────────────────

export type SortField = "name" | "email" | "verificationStatus" | "createdAt";
export type FacilitySortField = "name" | "incorporationDate" | "email" | "personInCharge" | "verificationStatus";
export type SortDir = "asc" | "desc";

export const SORTABLE_COLUMNS: { field: SortField; label: string }[] = [
  { field: "name", label: "Provider Name" },
  { field: "email", label: "Email ID" },
  { field: "verificationStatus", label: "Verification Status" },
  { field: "createdAt", label: "Created Date" },
];

// ─── Page size options ───────────────────────────────────────

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ─── Date helpers ────────────────────────────────────────────

const d = (daysAgo: number, hours = 10, minutes = 0): Date => {
  const base = new Date(2026, 1, 20, hours, minutes, 0);
  return new Date(base.getTime() - daysAgo * 86400000);
};

// ─── Mock Data ───────────────────────────────────────────────

export const MOCK_PROVIDERS: ServiceProvider[] = [
  // ── Facility Providers (18) ──────────────────────────────
  {
    id: "FP-001",
    name: "Al Hamra Sports Complex",
    email: "info@alhamrasports.ae",
    mobile: "+971 50 123 4567",
    providerType: "Facility Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(180, 9, 15),
    incorporationDate: d(365, 9, 15),
    personInCharge: "Mr. Ahmed Al Mansouri",
  },
  {
    id: "FP-002",
    name: "Dubai Arena & Recreation Center",
    email: "admin@dubaiarena.ae",
    mobile: "+971 55 234 5678",
    providerType: "Facility Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(160, 14, 30),
    incorporationDate: d(345, 14, 30),
    personInCharge: "Mr. Khalid bin Rashid Al Nuaimi",
  },
  {
    id: "FP-003",
    name: "Sharjah Fitness Hub & Wellness Zone",
    email: "contact@sharjahfitnesshub.ae",
    mobile: "+971 56 345 6789",
    providerType: "Facility Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(3, 11, 45),
    onboardingType: "Facility Provider",
    incorporationDate: d(350, 11, 45),
    personInCharge: "Mr. Fatima Al Zaabi",
  },
  {
    id: "FP-004",
    name: "Yas Sports Arena",
    email: "bookings@yassportsarena.ae",
    mobile: "+971 50 456 7890",
    providerType: "Facility Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(140, 8, 0),
    incorporationDate: d(325, 8, 0),
    personInCharge: "Mr. Omar Benali",
  },
  {
    id: "FP-005",
    name: "Falcon Stadium",
    email: "ops@falconstadium.ae",
    mobile: "+971 52 567 8901",
    providerType: "Facility Provider",
    verificationStatus: "Approved",
    accountStatus: "Locked",
    platformStatus: "Inactive",
    createdAt: d(120, 16, 20),
    lockedAt: d(15, 9, 30),
    lockedBy: "Admin Sarah",
    incorporationDate: d(305, 16, 20),
    personInCharge: "Mr. Layla Abdulrahman",
  },
  {
    id: "FP-006",
    name: "Oasis Tennis & Padel Club",
    email: "hello@oasispadel.ae",
    mobile: "+971 58 678 9012",
    providerType: "Facility Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(5, 10, 30),
    onboardingType: "Facility Provider",
    incorporationDate: d(300, 10, 30),
    personInCharge: "Mr. Youssef Khatib",
  },
  {
    id: "FP-007",
    name: "Capital Sports Village",
    email: "info@capitalsportsvillage.ae",
    mobile: "+971 50 789 0123",
    providerType: "Facility Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(100, 9, 0),
    incorporationDate: d(285, 9, 0),
    personInCharge: "Mr. Maryam Al Suwaidi",
  },
  {
    id: "FP-008",
    name: "Gulf Star Aquatics",
    email: "swim@gulfstaraquatics.ae",
    mobile: "+971 55 890 1234",
    providerType: "Facility Provider",
    verificationStatus: "Rejected",
    accountStatus: "Locked",
    platformStatus: "Inactive",
    createdAt: d(90, 13, 15),
    lockedAt: d(12, 14, 15),
    lockedBy: "System (Auto-lock)",
    rejectionReason: "Facility does not meet safety standards.",
    incorporationDate: d(275, 13, 15),
    personInCharge: "Mr. Hassan Farouk",
  },
  {
    id: "FP-009",
    name: "Palm Sports Facility",
    email: "mgr@palmsports.ae",
    mobile: "+971 56 901 2345",
    providerType: "Facility Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(2, 15, 0),
    onboardingType: "Freelance Coach",
    incorporationDate: d(270, 15, 0),
    personInCharge: "Mr. Aisha Khalil",
  },
  {
    id: "FP-010",
    name: "Deira Community Ground",
    email: "support@deiracommunity.ae",
    mobile: "+971 50 012 3456",
    providerType: "Facility Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(80, 10, 45),
    incorporationDate: d(265, 10, 45),
    personInCharge: "Mr. Zayed Al Maktoum",
  },
  {
    id: "FP-011",
    name: "Marina Bay Fitness Park",
    email: "contact@marinabayfit.ae",
    mobile: "+971 52 123 9876",
    providerType: "Facility Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(70, 8, 30),
    incorporationDate: d(260, 8, 30),
    personInCharge: "Mr. Nadia El-Amin",
  },
  {
    id: "FP-012",
    name: "Al Ain Sports District",
    email: "info@alainsports.ae",
    mobile: "+971 55 234 8765",
    providerType: "Facility Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(1, 9, 20),
    onboardingType: "Facility Provider",
    incorporationDate: d(255, 9, 20),
    personInCharge: "Mr. Ahmed Al Mansouri",
  },
  {
    id: "FP-013",
    name: "Jumeirah Beach Sports Club",
    email: "admin@jbsportsclub.ae",
    mobile: "+971 58 345 7654",
    providerType: "Facility Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(55, 11, 0),
    incorporationDate: d(250, 11, 0),
    personInCharge: "Mr. Khalid bin Rashid Al Nuaimi",
  },
  {
    id: "FP-014",
    name: "RAK Active Center",
    email: "ops@rakactive.ae",
    mobile: "+971 50 456 6543",
    providerType: "Facility Provider",
    verificationStatus: "Rejected",
    accountStatus: "Locked",
    platformStatus: "Inactive",
    createdAt: d(45, 14, 10),
    lockedAt: d(8, 11, 0),
    lockedBy: "Admin Mohammed",
    rejectionReason: "Facility does not meet safety standards.",
    incorporationDate: d(245, 14, 10),
    personInCharge: "Mr. Fatima Al Zaabi",
  },
  {
    id: "FP-015",
    name: "Sahara Sports Dome",
    email: "book@saharasportsdome.ae",
    mobile: "+971 56 567 5432",
    providerType: "Facility Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(35, 16, 30),
    incorporationDate: d(240, 16, 30),
    personInCharge: "Mr. Omar Benali",
  },
  {
    id: "FP-016",
    name: "Madinat Al Riyada Complex",
    email: "admin@madinatalriyada.ae",
    mobile: "+971 52 678 4321",
    providerType: "Facility Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(4, 13, 45),
    onboardingType: "Facility Provider",
    incorporationDate: d(235, 13, 45),
    personInCharge: "Mr. Layla Abdulrahman",
  },
  {
    id: "FP-017",
    name: "Khalifa City Sports Grounds",
    email: "info@khalifasports.ae",
    mobile: "+971 55 789 3210",
    providerType: "Facility Provider",
    verificationStatus: "Rejected",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(25, 10, 0),
    rejectionReason: "Facility does not meet safety standards.",
    incorporationDate: d(230, 10, 0),
    personInCharge: "Mr. Youssef Khatib",
  },
  {
    id: "FP-018",
    name: "Abu Dhabi Indoor Arena",
    email: "events@adindoorarena.ae",
    mobile: "+971 50 890 2109",
    providerType: "Facility Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(0, 8, 0),
    onboardingType: "Freelance Coach",
    incorporationDate: d(225, 8, 0),
    personInCharge: "Mr. Maryam Al Suwaidi",
  },

  // ── Training Providers (15) ──────────────────────────────
  {
    id: "TP-001",
    name: "ProFit Training Academy",
    email: "hello@profitacademy.ae",
    mobile: "+971 50 111 0001",
    providerType: "Training Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(200, 9, 0),
  },
  {
    id: "TP-002",
    name: "Champions Football School",
    email: "enroll@championsfootball.ae",
    mobile: "+971 55 222 0002",
    providerType: "Training Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(175, 10, 30),
  },
  {
    id: "TP-003",
    name: "SwimStar Aquatics Training Center",
    email: "lessons@swimstar.ae",
    mobile: "+971 56 333 0003",
    providerType: "Training Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(6, 14, 0),
    onboardingType: "Training Provider",
  },
  {
    id: "TP-004",
    name: "Desert Warriors MMA",
    email: "train@desertwarriorsmma.ae",
    mobile: "+971 52 444 0004",
    providerType: "Training Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(150, 11, 15),
  },
  {
    id: "TP-005",
    name: "Peak Performance Sports Lab",
    email: "info@peakperformancelab.ae",
    mobile: "+971 58 555 0005",
    providerType: "Training Provider",
    verificationStatus: "Approved",
    accountStatus: "Locked",
    platformStatus: "Inactive",
    createdAt: d(130, 8, 45),
    lockedAt: d(5, 16, 45),
    lockedBy: "Admin Sarah",
  },
  {
    id: "TP-006",
    name: "Emirates Youth Athletics",
    email: "youth@emiratesathletics.ae",
    mobile: "+971 50 666 0006",
    providerType: "Training Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(3, 16, 20),
    onboardingType: "Training Provider",
  },
  {
    id: "TP-007",
    name: "Zenith Martial Arts Studio",
    email: "join@zenithmartialarts.ae",
    mobile: "+971 55 777 0007",
    providerType: "Training Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(110, 9, 30),
  },
  {
    id: "TP-008",
    name: "Gulf Gymnastics Institute",
    email: "classes@gulfgymnastics.ae",
    mobile: "+971 56 888 0008",
    providerType: "Training Provider",
    verificationStatus: "Rejected",
    accountStatus: "Locked",
    platformStatus: "Inactive",
    createdAt: d(85, 13, 0),
    lockedAt: d(10, 10, 20),
    lockedBy: "System (Auto-lock)",
    rejectionReason: "Facility does not meet safety standards.",
  },
  {
    id: "TP-009",
    name: "Velocity Sports Training LLC",
    email: "admin@velocitysportstraining.ae",
    mobile: "+971 52 999 0009",
    providerType: "Training Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(2, 10, 15),
    onboardingType: "Freelance Coach",
  },
  {
    id: "TP-010",
    name: "Tennis Pro Academy",
    email: "coach@tennisproae.ae",
    mobile: "+971 50 101 0010",
    providerType: "Training Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(60, 14, 45),
  },
  {
    id: "TP-011",
    name: "Sandstorm CrossFit",
    email: "wod@sandstormcrossfit.ae",
    mobile: "+971 55 202 0011",
    providerType: "Training Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(1, 11, 30),
    onboardingType: "Training Provider",
  },
  {
    id: "TP-012",
    name: "Blue Wave Surf School",
    email: "surf@bluewave.ae",
    mobile: "+971 58 303 0012",
    providerType: "Training Provider",
    verificationStatus: "Approved",
    accountStatus: "Unlocked",
    platformStatus: "Active",
    createdAt: d(40, 8, 0),
  },
  {
    id: "TP-013",
    name: "Iron Forge Strength Camp",
    email: "lift@ironforgecamp.ae",
    mobile: "+971 56 404 0013",
    providerType: "Training Provider",
    verificationStatus: "Rejected",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(30, 15, 10),
    rejectionReason: "Facility does not meet safety standards.",
  },
  {
    id: "TP-014",
    name: "Skyline Yoga & Pilates",
    email: "namaste@skylineyoga.ae",
    mobile: "+971 50 505 0014",
    providerType: "Training Provider",
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    createdAt: d(0, 9, 0),
    onboardingType: "Training Provider",
  },
  {
    id: "TP-015",
    name: "Endurance Cycling Hub",
    email: "ride@endurancecycling.ae",
    mobile: "+971 52 606 0015",
    providerType: "Training Provider",
    verificationStatus: "Rejected",
    accountStatus: "Locked",
    platformStatus: "Inactive",
    createdAt: d(20, 12, 30),
    lockedAt: d(3, 8, 10),
    lockedBy: "Admin Sarah",
    rejectionReason: "Facility does not meet safety standards.",
  },

];

// ─── Helper: get counts ──────────────────────────────────────

export function getTabCounts(providers: ServiceProvider[]): Record<ProviderTabKey, number> {
  return {
    "Facility Provider": providers.filter(p => p.providerType === "Facility Provider").length,
    "Training Provider": providers.filter(p => p.providerType === "Training Provider").length,
    "Onboarding": providers.filter(p => p.verificationStatus === "Pending").length,
  };
}

export function getPendingCount(providers: ServiceProvider[], type: ProviderType): number {
  return providers.filter(p => p.providerType === type && p.verificationStatus === "Pending").length;
}

// ─── Mock submission histories for rejected providers ────────

const SPORT_CATEGORIES = [
  "Football", "Tennis", "Swimming", "Basketball", "Padel",
  "Martial Arts", "Gymnastics", "Cycling", "Yoga", "CrossFit",
];

function buildProfileData(p: ServiceProvider): FieldSnapshot {
  // Deterministic selection based on provider ID hash
  const hash = p.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cities = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "RAK"];
  const areas = ["Downtown", "Marina", "Al Reem", "Sports City", "JLT"];
  const city = cities[hash % cities.length];
  const area = areas[(hash + 3) % areas.length];
  const cat = SPORT_CATEGORIES[hash % SPORT_CATEGORIES.length];
  return {
    providerName: p.name,
    businessName: p.name + " LLC",
    email: p.email,
    mobile: p.mobile,
    city,
    area,
    licenseNumber: `LIC-${p.id}-2025`,
    description: `Professional ${cat.toLowerCase()} services and training programs for all ages and skill levels.`,
    sportCategory: cat,
    website: `https://www.${p.name.toLowerCase().replace(/\s+/g, "")}.ae`,
  };
}

/** Generates mock submission history for a given provider */
export function getMockSubmissionHistory(provider: ServiceProvider): SubmissionEntry[] {
  const profile = buildProfileData(provider);
  const entries: SubmissionEntry[] = [];

  // Original submission
  entries.push({
    submissionNumber: 1,
    submittedAt: provider.createdAt,
    status: provider.verificationStatus === "Approved" ? "Approved" : provider.verificationStatus === "Pending" ? "Pending" : "Rejected",
    rejectionReason: provider.verificationStatus === "Rejected" ? provider.rejectionReason : undefined,
    reviewedAt: provider.verificationStatus !== "Pending"
      ? new Date(provider.createdAt.getTime() + 2 * 86400000)
      : undefined,
    reviewedBy: provider.verificationStatus !== "Pending" ? "Admin Sarah" : undefined,
    fieldSnapshot: { ...profile },
  });

  // For rejected providers with resubmission history, add extra entries
  if (provider.verificationStatus === "Rejected" && provider.resubmissionCount) {
    for (let i = 0; i < provider.resubmissionCount; i++) {
      const subDate = new Date(provider.createdAt.getTime() + (i + 1) * 5 * 86400000);
      const isLast = i === provider.resubmissionCount - 1;
      entries.push({
        submissionNumber: i + 2,
        submittedAt: subDate,
        status: isLast ? "Rejected" : "Rejected",
        rejectionReason: isLast
          ? provider.rejectionReason
          : "Incomplete documentation provided. Please upload all required certificates.",
        reviewedAt: new Date(subDate.getTime() + 86400000),
        reviewedBy: i % 2 === 0 ? "Admin Mohammed" : "Admin Sarah",
        fieldSnapshot: {
          ...profile,
          description: `Updated submission #${i + 2}: Improved ${profile.sportCategory.toLowerCase()} facilities and programs.`,
          licenseNumber: `LIC-${provider.id}-2025-R${i + 1}`,
        },
      });
    }
  }

  // Most recent first
  return entries.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

/** Get a full provider object with profile data and submission history */
export function getProviderWithHistory(providerId: string): ServiceProvider | undefined {
  const provider = MOCK_PROVIDERS.find(p => p.id === providerId);
  if (!provider) return undefined;

  const profile = buildProfileData(provider);
  const resubCount = provider.verificationStatus === "Rejected" ? (provider.id === "FP-008" ? 2 : provider.id === "FP-014" ? 1 : provider.id === "TP-008" ? 2 : provider.id === "CO-008" ? 1 : 0) : 0;

  return {
    ...provider,
    profileData: profile,
    resubmissionCount: resubCount,
    submissionHistory: getMockSubmissionHistory({ ...provider, resubmissionCount: resubCount }),
  };
}

/** All rejected provider IDs (for the portal demo picker) */
export function getRejectedProviderIds(): { id: string; name: string }[] {
  return MOCK_PROVIDERS
    .filter(p => p.verificationStatus === "Rejected")
    .map(p => ({ id: p.id, name: p.name }));
}