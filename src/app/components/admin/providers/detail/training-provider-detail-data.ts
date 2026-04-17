// ─── Training Provider Detail — Extended Mock Data ───────────
import type { ServiceProvider, VerificationStatus, AccountStatus, PlatformStatus } from "../provider-data";
import { MOCK_PROVIDERS } from "../provider-data";
import { type BankAccountDetails, generateMockBankDetails } from "../components/BankDetailsCard";

// ─── Document types ──────────────────────────────────────────

export type DocFileType = "pdf" | "image" | "doc" | "xls";

export interface ProviderDocument {
  id: string;
  name: string;
  fileType: DocFileType;
  size: string;         // e.g. "2.4 MB"
  sizeBytes: number;
  uploadedAt: Date;
  url: string;          // mock URL
  thumbnailUrl?: string;
}

// ─── Assigned Facility ───────────────────────────────────────

export type FacilityStatus = "Active" | "Inactive";

export interface AssignedFacility {
  id: string;
  name: string;
  location: string;
  sportsAvailable: string[];
  status: FacilityStatus;
  assignedAt: Date;
}

// ─── Facility Request ────────────────────────────────────────

export type FacilityRequestStatus = "Pending" | "Approved" | "Rejected";

export interface FacilityRequest {
  id: string;
  facilityName: string;
  location: string;
  contractDocumentUrl: string;
  contractDocumentName: string;
  status: FacilityRequestStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

// ─── Coach under a Training Provider ─────────────────────────

export type CoachStatus = "Active" | "Inactive" | "Suspended";

export type CoachGender = "Male" | "Female";

export interface CoachQualification {
  id: string;
  title: string;
  description: string;
}

export interface CoachExperience {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  certificateFileName?: string;
}

export interface ProviderCoach {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth?: Date;
  gender?: CoachGender;
  profilePictureUrl?: string;
  sports: string[];
  description: string;
  nationality?: string;
  languages: string[];
  qualifications: CoachQualification[];
  experiences: CoachExperience[];
  specialities: string[];
  skills: string[];
  areaOfExpertise: string[];
  status: CoachStatus;
  joinedAt: Date;
  assignedTrainings?: number;
}

// ─── Full Training Provider Detail ───────────────────────────

export interface TrainingProviderDetail {
  // Core from ServiceProvider
  id: string;
  clubName: string;              // "Club/Institute Name"
  firstName: string;
  lastName: string;
  /** Resolved label from master designation (GET /admin/providers/:id → designation.name_en) */
  designationLabel?: string;
  email: string;
  mobile: string;
  dateOfIncorporation: Date;
  landline?: string;
  profilePhotoUrl?: string;
  providerType: "Training Provider";
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  platformStatus: PlatformStatus;
  createdAt: Date;

  // Lock info
  lockedAt?: Date;
  lockedBy?: string;

  // Sections
  documents: ProviderDocument[];
  assignedFacilities: AssignedFacility[];
  facilityRequests: FacilityRequest[];
  coaches: ProviderCoach[];
  bankDetails: BankAccountDetails;
}

// ─── Mock Facilities Pool (unassigned) ───────────────────────

export interface FacilityOption {
  id: string;
  name: string;
  location: string;
  sportsAvailable: string[];
}

const ALL_FACILITIES: FacilityOption[] = [
  { id: "FAC-001", name: "Al Hamra Sports Complex", location: "Dubai, Al Barsha", sportsAvailable: ["Football", "Tennis", "Swimming"] },
  { id: "FAC-002", name: "Dubai Arena & Recreation Center", location: "Dubai, Downtown", sportsAvailable: ["Basketball", "Volleyball", "Badminton"] },
  { id: "FAC-003", name: "Sharjah Fitness Hub", location: "Sharjah, Al Majaz", sportsAvailable: ["CrossFit", "Yoga", "Martial Arts"] },
  { id: "FAC-004", name: "Yas Sports Arena", location: "Abu Dhabi, Yas Island", sportsAvailable: ["Football", "Cricket", "Tennis"] },
  { id: "FAC-005", name: "Capital Sports Village", location: "Abu Dhabi, Al Reem", sportsAvailable: ["Swimming", "Gymnastics", "Padel"] },
  { id: "FAC-006", name: "Palm Sports Facility", location: "Dubai, Palm Jumeirah", sportsAvailable: ["Tennis", "Padel", "Yoga"] },
  { id: "FAC-007", name: "Marina Bay Fitness Park", location: "Dubai, Marina", sportsAvailable: ["Running", "Cycling", "CrossFit"] },
  { id: "FAC-008", name: "RAK Active Center", location: "Ras Al Khaimah", sportsAvailable: ["Football", "Basketball", "Volleyball"] },
  { id: "FAC-009", name: "Sahara Sports Dome", location: "Sharjah, Industrial Area", sportsAvailable: ["Cricket", "Badminton", "Table Tennis"] },
  { id: "FAC-010", name: "Khalifa City Sports Grounds", location: "Abu Dhabi, Khalifa City", sportsAvailable: ["Football", "Rugby", "Athletics"] },
  { id: "FAC-011", name: "Jumeirah Beach Sports Club", location: "Dubai, Jumeirah", sportsAvailable: ["Swimming", "Beach Volleyball", "Surfing"] },
  { id: "FAC-012", name: "Deira Community Ground", location: "Dubai, Deira", sportsAvailable: ["Cricket", "Football", "Running"] },
];

export function getAvailableFacilities(assignedIds: string[]): FacilityOption[] {
  return ALL_FACILITIES.filter(f => !assignedIds.includes(f.id));
}

// ─── Helper ──────────────────────────────────────────────────

const d = (daysAgo: number, hours = 10, minutes = 0): Date => {
  const base = new Date(2026, 1, 20, hours, minutes, 0);
  return new Date(base.getTime() - daysAgo * 86400000);
};

// ─── Mock document sets per provider ─────────────────────────

function buildDocuments(providerId: string): ProviderDocument[] {
  const hash = providerId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const docs: ProviderDocument[] = [
    {
      id: `${providerId}-DOC-001`,
      name: "Trade License.pdf",
      fileType: "pdf",
      size: "2.4 MB",
      sizeBytes: 2516582,
      uploadedAt: d(60),
      url: "/mock/trade-license.pdf",
    },
    {
      id: `${providerId}-DOC-002`,
      name: "Insurance Certificate.pdf",
      fileType: "pdf",
      size: "1.1 MB",
      sizeBytes: 1153434,
      uploadedAt: d(58),
      url: "/mock/insurance-cert.pdf",
    },
    {
      id: `${providerId}-DOC-003`,
      name: "Facility Photo.jpg",
      fileType: "image",
      size: "3.7 MB",
      sizeBytes: 3880755,
      uploadedAt: d(55),
      url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200",
      thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300",
    },
    {
      id: `${providerId}-DOC-004`,
      name: "Training Schedule.xls",
      fileType: "xls",
      size: "540 KB",
      sizeBytes: 552960,
      uploadedAt: d(50),
      url: "/mock/training-schedule.xls",
    },
  ];

  // Add extra image for some providers
  if (hash % 3 === 0) {
    docs.push({
      id: `${providerId}-DOC-005`,
      name: "Equipment Inventory.docx",
      fileType: "doc",
      size: "820 KB",
      sizeBytes: 839680,
      uploadedAt: d(45),
      url: "/mock/equipment-inventory.docx",
    });
  }
  if (hash % 2 === 0) {
    docs.push({
      id: `${providerId}-DOC-006`,
      name: "Indoor Court.jpg",
      fileType: "image",
      size: "2.9 MB",
      sizeBytes: 3041689,
      uploadedAt: d(40),
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200",
      thumbnailUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300",
    });
  }

  return docs;
}

// ─── Mock coach assignments ──────────────────────────────────

function buildCoaches(providerId: string): ProviderCoach[] {
  if (providerId === "TP-003" || providerId === "TP-014") return [];

  const COACHES_POOL: ProviderCoach[] = [
    {
      id: "PCH-001",
      firstName: "Ahmed",
      lastName: "Al Mansouri",
      email: "ahmed.mansouri@coach.ae",
      mobile: "+971 50 700 0001",
      dateOfBirth: new Date(1990, 3, 15),
      gender: "Male",
      profilePictureUrl: "https://api.dicebear.com/9.x/initials/svg?seed=AM&backgroundColor=003B95&textColor=ffffff",
      sports: ["Football", "Basketball"],
      description: "Professional football coach with over 10 years of experience in youth and senior level coaching. Specialized in tactical analysis and player development programs.",
      nationality: "Emirati",
      languages: ["Arabic", "English"],
      qualifications: [
        { id: "Q-001", title: "AFC Pro License", description: "Asian Football Confederation professional coaching license obtained in 2018." },
        { id: "Q-002", title: "Sports Science Degree", description: "Bachelor of Science in Sports Science from UAE University." },
      ],
      experiences: [
        { id: "E-001", title: "Head Coach - Al Wahda FC Youth", description: "Led the U-19 team to regional championship. Managed training programs for 30+ players.", startDate: new Date(2020, 0, 1), endDate: new Date(2024, 5, 30), certificateFileName: "alwahda_certificate.pdf" },
        { id: "E-002", title: "Assistant Coach - Dubai Sports Academy", description: "Assisted in football training programs and player evaluations.", startDate: new Date(2017, 2, 1), endDate: new Date(2019, 11, 31) },
      ],
      specialities: ["Tactical Analysis", "Youth Development", "Set Pieces"],
      skills: ["Team Management", "Video Analysis", "Fitness Planning"],
      areaOfExpertise: ["Football Coaching", "Player Scouting", "Match Preparation"],
      status: "Active",
      joinedAt: new Date(2025, 8, 10),
      assignedTrainings: 3,
    },
    {
      id: "PCH-002",
      firstName: "Sara",
      lastName: "Al Hashemi",
      email: "sara.hashemi@coach.ae",
      mobile: "+971 55 700 0002",
      dateOfBirth: new Date(1992, 7, 22),
      gender: "Female",
      sports: ["Tennis", "Padel"],
      description: "Certified tennis and padel instructor with expertise in individual and group coaching. Passionate about promoting women's sports in the region.",
      nationality: "Saudi",
      languages: ["Arabic", "English", "French"],
      qualifications: [
        { id: "Q-003", title: "ITF Level 3 Coach", description: "International Tennis Federation advanced coaching certification." },
      ],
      experiences: [
        { id: "E-003", title: "Senior Tennis Coach - Riyadh Sports Club", description: "Coached competitive players aged 12-18 for national tournaments.", startDate: new Date(2019, 5, 1), endDate: new Date(2024, 3, 15), certificateFileName: "riyadh_tennis_cert.pdf" },
      ],
      specialities: ["Serve Technique", "Match Strategy", "Mental Conditioning"],
      skills: ["Biomechanics", "Nutrition Planning", "Tournament Preparation"],
      areaOfExpertise: ["Tennis Coaching", "Padel Training", "Sports Psychology"],
      status: "Active",
      joinedAt: new Date(2025, 9, 5),
      assignedTrainings: 2,
    },
    {
      id: "PCH-003",
      firstName: "Khalid",
      lastName: "bin Rashid",
      email: "khalid.rashid@coach.ae",
      mobile: "+971 56 700 0003",
      dateOfBirth: new Date(1985, 1, 10),
      gender: "Male",
      profilePictureUrl: "https://api.dicebear.com/9.x/initials/svg?seed=KR&backgroundColor=003B95&textColor=ffffff",
      sports: ["Swimming", "Volleyball"],
      description: "Former competitive swimmer turned coach. Specializes in stroke correction, endurance training, and competitive swim preparation for all age groups.",
      nationality: "Bahraini",
      languages: ["Arabic", "English", "Hindi"],
      qualifications: [
        { id: "Q-004", title: "FINA Coaching Certificate", description: "World Aquatics certified swimming coach." },
        { id: "Q-005", title: "Lifeguard Certification", description: "International Lifesaving Federation certification." },
      ],
      experiences: [
        { id: "E-004", title: "Head Swim Coach - Bahrain National Team", description: "Trained national level swimmers for Gulf Championships and Asian Games qualifying events.", startDate: new Date(2015, 0, 1), endDate: new Date(2022, 11, 31), certificateFileName: "bahrain_swim_cert.pdf" },
        { id: "E-005", title: "Swim Instructor - Dubai Aquatic Center", description: "Taught beginner to advanced swimming classes.", startDate: new Date(2023, 0, 1), endDate: new Date(2025, 5, 30) },
      ],
      specialities: ["Stroke Correction", "Endurance Training", "Race Preparation"],
      skills: ["Water Safety", "Competition Coaching", "Training Periodization"],
      areaOfExpertise: ["Swimming Coaching", "Aquatic Sports", "Fitness Assessment"],
      status: "Inactive",
      joinedAt: new Date(2025, 6, 20),
      assignedTrainings: 0,
    },
    {
      id: "PCH-004",
      firstName: "Fatima",
      lastName: "Al Zaabi",
      email: "fatima.zaabi@coach.ae",
      mobile: "+971 52 700 0004",
      dateOfBirth: new Date(1995, 10, 3),
      gender: "Female",
      sports: ["Cricket", "Volleyball", "Basketball"],
      description: "Multi-sport coach specializing in team sports. Strong background in athletic conditioning and group dynamics for youth and adult programs.",
      nationality: "Indian",
      languages: ["English", "Arabic", "Urdu", "Hindi"],
      qualifications: [
        { id: "Q-006", title: "BCCI Level 2 Cricket Coach", description: "Board of Control for Cricket in India coaching certification." },
        { id: "Q-007", title: "NSCA Certified Strength Coach", description: "National Strength and Conditioning Association professional certification." },
      ],
      experiences: [
        { id: "E-006", title: "Cricket Coach - Abu Dhabi Cricket Academy", description: "Coached junior and senior cricket squads. Organized inter-academy tournaments.", startDate: new Date(2021, 3, 1), endDate: new Date(2025, 2, 31), certificateFileName: "adca_certificate.pdf" },
        { id: "E-007", title: "Volleyball Coach - Al Ain Sports Club", description: "Trained women's volleyball team for local and national competitions.", startDate: new Date(2019, 0, 1), endDate: new Date(2021, 2, 31) },
      ],
      specialities: ["Batting Technique", "Team Tactics", "Fielding Drills"],
      skills: ["Strength & Conditioning", "Game Analysis", "Leadership Development"],
      areaOfExpertise: ["Cricket Coaching", "Multi-Sport Training", "Youth Athletics"],
      status: "Active",
      joinedAt: new Date(2025, 10, 1),
      assignedTrainings: 1,
    },
  ];

  const hash = providerId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = (hash % 4) + 1;

  return COACHES_POOL.slice(0, count).map((c, i) => ({
    ...c,
    id: `${providerId}-${c.id}`,
    joinedAt: d(90 - i * 15),
  }));
}

// ─── Mock facility assignments ───────────────────────────────

function buildAssignedFacilities(providerId: string): AssignedFacility[] {
  const hash = providerId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  // Ensure at least 3 for main provider (TP-001)
  const count = providerId === "TP-001" ? 3 : hash % 4;

  return ALL_FACILITIES.slice(0, count).map((f, i) => ({
    id: f.id,
    name: f.name,
    location: f.location,
    sportsAvailable: f.sportsAvailable,
    status: (i === 2 ? "Inactive" : "Active") as FacilityStatus,
    assignedAt: d(100 - i * 20),
  }));
}

// ─── Mock facility requests ──────────────────────────────────

function buildFacilityRequests(providerId: string): FacilityRequest[] {
  const hash = providerId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (providerId === "TP-003" || providerId === "TP-014") return [];

  const requests: FacilityRequest[] = [
    {
      id: `${providerId}-FREQ-001`,
      facilityName: "Al Quoz Indoor Arena",
      location: "Dubai, Al Quoz",
      contractDocumentUrl: "/mock/contract-al-quoz.pdf",
      contractDocumentName: "Contract_AlQuoz_Arena.pdf",
      status: "Pending",
      requestedAt: d(5, 14, 30),
    },
    {
      id: `${providerId}-FREQ-002`,
      facilityName: "Silicon Oasis Sports Park",
      location: "Dubai, Silicon Oasis",
      contractDocumentUrl: "/mock/contract-silicon-oasis.pdf",
      contractDocumentName: "Contract_SiliconOasis.pdf",
      status: "Pending",
      requestedAt: d(3, 9, 15),
    },
    {
      id: `${providerId}-FREQ-003`,
      facilityName: "Mirdif Active Club",
      location: "Dubai, Mirdif",
      contractDocumentUrl: "/mock/contract-mirdif.pdf",
      contractDocumentName: "Contract_Mirdif_Club.pdf",
      status: "Approved",
      requestedAt: d(15, 11, 0),
      reviewedAt: d(12, 16, 30),
    },
  ];

  // Return fewer for some providers
  if (hash % 3 === 0) return requests;
  return requests.slice(0, 2);
}

// ─── First / Last name split ─────────────────────────────────

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(" ");
  if (parts.length <= 1) return { firstName: fullName, lastName: "" };
  return {
    firstName: parts.slice(0, Math.ceil(parts.length / 2)).join(" "),
    lastName: parts.slice(Math.ceil(parts.length / 2)).join(" "),
  };
}

// ─── Build the full detail object ────────────────────────────

export function getTrainingProviderDetail(id: string): TrainingProviderDetail | null {
  const provider = MOCK_PROVIDERS.find(p => p.id === id);
  if (!provider) return null;

  const { firstName, lastName } = splitName(provider.name);
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const months = [0, 2, 4, 6, 8, 10];
  const incMonth = months[hash % months.length];

  return {
    id: provider.id,
    clubName: `${provider.name} Institute`,
    firstName,
    lastName,
    email: provider.email,
    mobile: provider.mobile,
    dateOfIncorporation: new Date(2018 + (hash % 5), incMonth, 1 + (hash % 28)),
    landline: hash % 3 === 0 ? `+971 4 ${300 + (hash % 100)} ${1000 + (hash % 9000)}` : undefined,
    profilePhotoUrl: hash % 2 === 0 ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(firstName)}&backgroundColor=003B95&textColor=ffffff` : undefined,
    providerType: "Training Provider",
    verificationStatus: provider.verificationStatus,
    accountStatus: provider.accountStatus,
    platformStatus: provider.platformStatus,
    createdAt: provider.createdAt,
    lockedAt: provider.accountStatus === "Locked" ? d(10) : undefined,
    lockedBy: provider.accountStatus === "Locked" ? "Admin Sarah" : undefined,
    documents: buildDocuments(provider.id),
    assignedFacilities: buildAssignedFacilities(provider.id),
    facilityRequests: buildFacilityRequests(provider.id),
    coaches: buildCoaches(provider.id),
    bankDetails: generateMockBankDetails(provider.id, provider.name),
  };
}