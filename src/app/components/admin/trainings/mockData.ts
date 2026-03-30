import {
  Training, AssignedCoach, TrainingFacility, TrainingProvider,
  FullCourseBatch, PerSessionSlot, SubscriptionPlan,
  ExceptionDate, TrainingCancellationPolicy, TrainingDiscount,
  TrainingReview, TrainingAuditEntry,
  RatingBreakdown, EarningPreview,
  FullCoursePricing, PerSessionPricing, SubscriptionPricing,
} from "./types";

// Helper type for the raw data (old earnings shape)
interface RawEarnings {
  grossRevenue: number; commission: number; commissionPct: number;
  taxCollected: number; taxPct: number; netProviderEarnings: number;
  currency: string; totalBookings: number; activeBookings: number;
  completedSessions: number; cancelledSessions: number; refundTotal: number;
}
type RawTraining = Omit<Training, "earnings" | "ratingBreakdown" | "totalReviews" | "fullCoursePricing" | "perSessionPricing" | "subscriptionPricing"> & { earnings: RawEarnings };

// ─── Providers ────────────────────────────────────────────────

const PROVIDERS: TrainingProvider[] = [
  { id: "PRV-001", name: "Elite Sports Academy",     type: "Training Provider", email: "ops@elitesports.sa",    phone: "+966 11 123 4567", country: "Saudi Arabia" },
  { id: "PRV-002", name: "FitZone Academy",          type: "Training Provider", email: "admin@fitzone.sa",      phone: "+966 11 234 5678", country: "Saudi Arabia" },
  { id: "PRV-003", name: "Gulf Tennis Center",       type: "Training Provider", email: "info@gulftennis.sa",    phone: "+966 11 345 6789", country: "Saudi Arabia" },
  { id: "PRV-004", name: "Champions Sports Club",    type: "Training Provider", email: "cs@champions.sa",       phone: "+966 11 456 7890", country: "Saudi Arabia" },
  { id: "PRV-005", name: "Desert Padel Academy",     type: "Training Provider", email: "play@desertpadel.sa",   phone: "+966 11 567 8901", country: "Saudi Arabia" },
];

// ─── Facilities ───────────────────────────────────────────────

const FACILITIES: TrainingFacility[] = [
  { id: "FAC-001", name: "Champions Arena",          providerName: "Champions Sports Club", address: "Al Olaya, Riyadh",          city: "Riyadh", country: "Saudi Arabia", courtAreaName: "Pitch A & B",         status: "Active" },
  { id: "FAC-002", name: "Gulf Tennis Complex",      providerName: "Gulf Tennis Center",    address: "Al Malaz, Riyadh",          city: "Riyadh", country: "Saudi Arabia", courtAreaName: "Courts 1-3",          status: "Active" },
  { id: "FAC-003", name: "FitZone Training Hub",     providerName: "FitZone Academy",       address: "King Fahd Rd, Riyadh",      city: "Riyadh", country: "Saudi Arabia", courtAreaName: "Main Training Hall",  status: "Active" },
  { id: "FAC-004", name: "Desert Padel Park",        providerName: "Desert Padel Academy",  address: "Al Nakheel, Riyadh",        city: "Riyadh", country: "Saudi Arabia", courtAreaName: "Court 1 & 2",         status: "Active" },
  { id: "FAC-005", name: "Riyadh Sports Academy",    providerName: "Champions Sports Club", address: "Al Olaya, Riyadh",          city: "Riyadh", country: "Saudi Arabia", courtAreaName: "All Courts",          status: "Active" },
  { id: "FAC-006", name: "Aquatic Centre Riyadh",    providerName: "FitZone Academy",       address: "Al Sahafa, Riyadh",         city: "Riyadh", country: "Saudi Arabia", courtAreaName: "Pool 1 (25m)",        status: "Active" },
  { id: "FAC-007", name: "Palm Beach Volleyball",    providerName: "Elite Sports Academy",  address: "Jeddah Corniche, Jeddah",   city: "Jeddah", country: "Saudi Arabia", courtAreaName: "Beach Court 1",       status: "Inactive" },
];

// ─── Default Cancellation Policy ─────────────────────────────

function defaultPolicy(trainingName: string): TrainingCancellationPolicy {
  return {
    policyName: "Standard Training Cancellation Policy",
    applicableTo: trainingName,
    tiers: [
      { window: "More than 72 hours before session",  refundPercent: 100 },
      { window: "48-72 hours before session",          refundPercent: 75 },
      { window: "24-48 hours before session",          refundPercent: 50 },
      { window: "Less than 24 hours before session",   refundPercent: 0 },
    ],
  };
}

// ─── Default audit trail ──────────────────────────────────────

function defaultAudit(createdAt: string, name: string): TrainingAuditEntry[] {
  return [
    { id: "AUD-001", timestamp: createdAt, event: `Training "${name}" created`, actor: "Provider" },
    { id: "AUD-002", timestamp: createdAt, event: "Status set to Active", actor: "System" },
    { id: "AUD-003", timestamp: "2026-02-15T11:30:00Z", event: "Price updated by provider", actor: "Provider" },
  ];
}

// ─── Default reviews ──────────────────────────────────────────

const SAMPLE_REVIEWS: TrainingReview[] = [
  { id: "REV-001", reviewerName: "Ahmed Al-Rashid",    rating: 5, text: "Excellent training programme with highly skilled coaches. The drills are well-structured and challenging. I have improved significantly in just a few weeks.", date: "2026-02-20T10:00:00Z" },
  { id: "REV-002", reviewerName: "Sarah Johnson",      rating: 4, text: "Great coaching and well-organised sessions. The facility is top-notch. Would recommend to anyone looking to improve their skills.", date: "2026-02-18T14:00:00Z" },
  { id: "REV-003", reviewerName: "Mohammed Al-Harbi",   rating: 5, text: "Best training programme I have attended. The coaches are professional and the training environment is motivating.", date: "2026-02-15T09:00:00Z" },
  { id: "REV-004", reviewerName: "Emily Chen",          rating: 3, text: "Good training but the scheduling could be more flexible. Sometimes the batches fill up too quickly.", date: "2026-02-10T16:00:00Z" },
  { id: "REV-005", reviewerName: "Khalid Al-Suwaidi",   rating: 4, text: "Very professional setup. The coaches know their craft and are patient with beginners. Looking forward to the next course.", date: "2026-02-05T11:00:00Z" },
];

// ─── Trainings ────────────────────────────────────────────────

const RAW_TRAININGS: RawTraining[] = [

  // TRN-00001: Football Advanced - Full Course
  {
    id: "TRN-00001",
    name: "Advanced Football Mastery Camp",
    sport: "Football",
    level: "Advanced",
    trainingType: "Full Course",
    types: ["Full Course"],
    description: "An intensive football mastery programme targeting tactical awareness, physical conditioning, and elite-level technique. Designed for serious players aiming to transition to professional or semi-professional football. Includes position-specific drills and match analysis sessions.",
    minPlayers: 10, maxPlayers: 20,
    minAge: 16, maxAge: 30,
    genderRestriction: "Male Only",
    skillLevelDesc: "Must have at least 5 years of competitive football experience. Previous club membership preferred.",
    durationMins: 90,
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    status: "Active",
    promotionStatus: "Promoted",
    createdAt: "2026-01-10T09:00:00Z",
    updatedAt: "2026-02-15T11:30:00Z",
    provider: PROVIDERS[0],
    facility: FACILITIES[0],
    coaches: [
      { id: "COA-001", name: "Carlos Mendez",    email: "c.mendez@elitesports.sa",  specialisation: "Tactical Coaching",     verification: "Verified",   status: "Active",   assignedDate: "2026-01-10" },
      { id: "COA-002", name: "Yusuf Al-Rashidi", email: "y.rashidi@elitesports.sa", specialisation: "Physical Conditioning", verification: "Verified",   status: "Active",   assignedDate: "2026-01-10" },
    ],
    fullCourseBatches: [
      { id: "BAT-001", batchName: "Batch A - Morning",  startDate: "2026-03-01", endDate: "2026-06-30", daysOfWeek: ["Mon","Wed","Fri"], timeSlot: "06:30 - 08:00", totalSessions: 48, price: 2400, currency: "SAR", enrolled: 18, maxCapacity: 20, status: "Open" },
      { id: "BAT-002", batchName: "Batch B - Evening",  startDate: "2026-03-01", endDate: "2026-06-30", daysOfWeek: ["Tue","Thu"],       timeSlot: "18:00 - 19:30", totalSessions: 32, price: 1800, currency: "SAR", enrolled: 20, maxCapacity: 20, status: "Full" },
      { id: "BAT-003", batchName: "Batch C - Weekend",  startDate: "2026-03-07", endDate: "2026-06-28", daysOfWeek: ["Sat"],             timeSlot: "09:00 - 10:30", totalSessions: 16, price: 1200, currency: "SAR", enrolled: 12, maxCapacity: 20, status: "Open" },
    ],
    perSessionSlots: [],
    subscriptionPlans: [],
    exceptionDates: [
      { id: "EXC-001", date: "2026-04-18", reason: "Public Holiday - National Day",     affectedSessions: "All sessions on 18 Apr", playersNotified: true },
      { id: "EXC-002", date: "2026-05-01", reason: "Facility Maintenance - Pitch A",    affectedSessions: "Batch A - Morning",      playersNotified: true },
    ],
    cancellationPolicy: defaultPolicy("Advanced Football Mastery Camp"),
    discounts: [
      { id: "DIS-001", name: "Early Bird 15%",   discountType: "Percentage",   value: 15, applicableTo: "Full Course", validFrom: "2026-01-10", validUntil: "2026-02-28", status: "Expired" },
      { id: "DIS-002", name: "Group Discount",   discountType: "Fixed Amount", value: 200, applicableTo: "Full Course", validFrom: "2026-03-01", validUntil: "2026-06-30", minPlayers: 3, status: "Active" },
    ],
    earnings: { grossRevenue: 98400, commission: 9840, commissionPct: 10, taxCollected: 4428, taxPct: 5, netProviderEarnings: 84132, currency: "SAR", totalBookings: 50, activeBookings: 38, completedSessions: 120, cancelledSessions: 4, refundTotal: 2400 },
    reviews: SAMPLE_REVIEWS.slice(0, 5),
    averageRating: 4.2,
    auditTrail: defaultAudit("2026-01-10T09:00:00Z", "Advanced Football Mastery Camp"),
  },

  // TRN-00002: Tennis Beginner - Per Session
  {
    id: "TRN-00002",
    name: "Beginner Tennis Fundamentals",
    sport: "Tennis",
    level: "Beginner",
    trainingType: "Per Session",
    types: ["Per Session"],
    description: "A structured beginner tennis programme covering grip, stance, forehand, backhand, serve, and court etiquette. Sessions are relaxed and encouraging - perfect for adults with zero prior experience.",
    minPlayers: 2, maxPlayers: 8,
    minAge: 10,
    genderRestriction: "Mixed",
    skillLevelDesc: "No prior experience required. Equipment provided.",
    durationMins: 60,
    startDate: "2026-02-01",
    status: "Active",
    promotionStatus: "Standard",
    createdAt: "2026-01-15T11:00:00Z",
    updatedAt: "2026-02-01T09:00:00Z",
    provider: PROVIDERS[2],
    facility: FACILITIES[1],
    coaches: [
      { id: "COA-003", name: "Emma Wright",   email: "e.wright@gulftennis.sa",  specialisation: "Tennis Fundamentals", verification: "Verified",   status: "Active",   assignedDate: "2026-01-15" },
      { id: "COA-004", name: "Omar Khalid",   email: "o.khalid@gulftennis.sa",  specialisation: "Junior Development",  verification: "Verified",   status: "Active",   assignedDate: "2026-01-20" },
    ],
    fullCourseBatches: [],
    perSessionSlots: [
      { id: "SLT-001", day: "Monday",    timeSlot: "08:00 - 09:00", durationMins: 60, price: 120, currency: "SAR", availableSpots: 6, recurrence: "Weekly" },
      { id: "SLT-002", day: "Wednesday", timeSlot: "08:00 - 09:00", durationMins: 60, price: 120, currency: "SAR", availableSpots: 8, recurrence: "Weekly" },
      { id: "SLT-003", day: "Saturday",  timeSlot: "10:00 - 11:00", durationMins: 60, price: 140, currency: "SAR", availableSpots: 4, recurrence: "Weekly" },
      { id: "SLT-004", day: "Sunday",    timeSlot: "10:00 - 11:00", durationMins: 60, price: 140, currency: "SAR", availableSpots: 5, recurrence: "Weekly" },
    ],
    subscriptionPlans: [],
    exceptionDates: [
      { id: "EXC-003", date: "2026-03-15", reason: "Court Resurfacing - Courts 1-3", affectedSessions: "All sessions", playersNotified: true },
    ],
    cancellationPolicy: { policyName: "Tennis Centre Policy", applicableTo: "Beginner Tennis Fundamentals", tiers: [{ window: "More than 24h", refundPercent: 100 }, { window: "Less than 24h", refundPercent: 0 }] },
    discounts: [
      { id: "DIS-003", name: "4-Session Bundle", discountType: "Fixed Amount", value: 80, applicableTo: "Per Session", validFrom: "2026-02-01", validUntil: "2026-12-31", status: "Active" },
    ],
    earnings: { grossRevenue: 34800, commission: 3480, commissionPct: 10, taxCollected: 1566, taxPct: 5, netProviderEarnings: 29754, currency: "SAR", totalBookings: 290, activeBookings: 42, completedSessions: 260, cancelledSessions: 30, refundTotal: 3600 },
    reviews: SAMPLE_REVIEWS.slice(0, 3),
    averageRating: 4.7,
    auditTrail: defaultAudit("2026-01-15T11:00:00Z", "Beginner Tennis Fundamentals"),
  },

  // TRN-00003: Swimming - Subscription
  {
    id: "TRN-00003",
    name: "Competitive Swimming Programme",
    sport: "Swimming",
    level: "Intermediate",
    trainingType: "Subscription",
    types: ["Subscription"],
    description: "A year-round competitive swimming programme with structured monthly and quarterly plans. Covers stroke technique refinement, flip turns, starts, and race strategy for competitive swimmers.",
    minPlayers: 4, maxPlayers: 12,
    minAge: 12, maxAge: 25,
    genderRestriction: "Mixed",
    skillLevelDesc: "Can swim all 4 strokes. Minimum 400m continuous swim required.",
    durationMins: 90,
    startDate: "2026-01-01",
    status: "Active",
    promotionStatus: "Promoted",
    createdAt: "2025-12-01T08:00:00Z",
    updatedAt: "2026-02-10T12:00:00Z",
    provider: PROVIDERS[1],
    facility: FACILITIES[5],
    coaches: [
      { id: "COA-005", name: "Sarah Al-Mansouri", email: "s.mansouri@fitzone.sa", specialisation: "Competitive Swimming", verification: "Verified", status: "Active", assignedDate: "2025-12-01" },
    ],
    fullCourseBatches: [],
    perSessionSlots: [],
    subscriptionPlans: [
      { id: "PLN-001", planName: "Monthly - 3 Sessions/Week",    planDuration: "Monthly",   sessionsPerWeek: 3, price: 900,  currency: "SAR", autoRenew: true,  activeSubscribers: 8,  status: "Active" },
      { id: "PLN-002", planName: "Monthly - 5 Sessions/Week",    planDuration: "Monthly",   sessionsPerWeek: 5, price: 1350, currency: "SAR", autoRenew: true,  activeSubscribers: 5,  status: "Active" },
      { id: "PLN-003", planName: "Quarterly - 3 Sessions/Week",  planDuration: "Quarterly", sessionsPerWeek: 3, price: 2430, currency: "SAR", autoRenew: false, activeSubscribers: 3,  status: "Active" },
      { id: "PLN-004", planName: "Annual Unlimited",             planDuration: "Annual",    sessionsPerWeek: 5, price: 8400, currency: "SAR", autoRenew: true,  activeSubscribers: 2,  status: "Active" },
    ],
    exceptionDates: [],
    cancellationPolicy: defaultPolicy("Competitive Swimming Programme"),
    discounts: [
      { id: "DIS-004", name: "Annual Plan 20% Off", discountType: "Percentage", value: 20, applicableTo: "Subscription - Annual", validFrom: "2026-01-01", validUntil: "2026-01-31", status: "Expired" },
    ],
    earnings: { grossRevenue: 156600, commission: 15660, commissionPct: 10, taxCollected: 7047, taxPct: 5, netProviderEarnings: 133893, currency: "SAR", totalBookings: 18, activeBookings: 14, completedSessions: 412, cancelledSessions: 8, refundTotal: 900 },
    reviews: SAMPLE_REVIEWS.slice(0, 4),
    averageRating: 4.5,
    auditTrail: defaultAudit("2025-12-01T08:00:00Z", "Competitive Swimming Programme"),
  },

  // TRN-00004: Padel Intermediate - Full Course
  {
    id: "TRN-00004",
    name: "Padel Accelerator - Intermediate",
    sport: "Padel",
    level: "Intermediate",
    trainingType: "Full Course",
    types: ["Full Course"],
    description: "A 2-month accelerator programme for intermediate padel players. Focuses on wall play, lob defence, bandejas, smashes, and doubles strategy.",
    minPlayers: 3, maxPlayers: 6,
    minAge: 18,
    genderRestriction: "Mixed",
    skillLevelDesc: "Can sustain rallies and knows basic padel rules.",
    durationMins: 75,
    startDate: "2026-03-15",
    endDate: "2026-05-15",
    status: "Active",
    promotionStatus: "Standard",
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-02-01T15:00:00Z",
    provider: PROVIDERS[4],
    facility: FACILITIES[3],
    coaches: [
      { id: "COA-006", name: "Diego Fernandez", email: "d.fernandez@desertpadel.sa", specialisation: "Padel Strategy & Technique", verification: "Verified", status: "Active", assignedDate: "2026-01-20" },
    ],
    fullCourseBatches: [
      { id: "BAT-004", batchName: "Accelerator Batch 1",  startDate: "2026-03-15", endDate: "2026-05-15", daysOfWeek: ["Mon","Wed","Sat"], timeSlot: "07:00 - 08:15", totalSessions: 24, price: 1800, currency: "SAR", enrolled: 6, maxCapacity: 6, status: "Full" },
      { id: "BAT-005", batchName: "Accelerator Batch 2",  startDate: "2026-03-15", endDate: "2026-05-15", daysOfWeek: ["Tue","Thu","Sun"], timeSlot: "18:30 - 19:45", totalSessions: 24, price: 1800, currency: "SAR", enrolled: 4, maxCapacity: 6, status: "Open" },
    ],
    perSessionSlots: [],
    subscriptionPlans: [],
    exceptionDates: [
      { id: "EXC-004", date: "2026-04-01", reason: "Facility Deep Clean", affectedSessions: "All batches", playersNotified: false },
    ],
    cancellationPolicy: { policyName: "Desert Padel Standard Policy", applicableTo: "Padel Accelerator", tiers: [{ window: "More than 48h", refundPercent: 100 }, { window: "24-48h", refundPercent: 50 }, { window: "Less than 24h", refundPercent: 0 }] },
    discounts: [],
    earnings: { grossRevenue: 18000, commission: 1800, commissionPct: 10, taxCollected: 810, taxPct: 5, netProviderEarnings: 15390, currency: "SAR", totalBookings: 10, activeBookings: 8, completedSessions: 48, cancelledSessions: 2, refundTotal: 3600 },
    reviews: SAMPLE_REVIEWS.slice(2, 4),
    averageRating: 4.0,
    auditTrail: defaultAudit("2026-01-20T10:00:00Z", "Padel Accelerator - Intermediate"),
  },

  // TRN-00005: Yoga - Subscription - Inactive
  {
    id: "TRN-00005",
    name: "Mindful Yoga & Wellness Programme",
    sport: "Yoga",
    level: "All Levels",
    trainingType: "Subscription",
    types: ["Subscription"],
    description: "A holistic yoga and wellness programme suitable for all levels. Covers Hatha, Vinyasa, and Yin yoga styles with mindfulness and breathing exercises.",
    minPlayers: 2, maxPlayers: 15,
    genderRestriction: "Female Only",
    skillLevelDesc: "No experience required. All yoga mats and props provided.",
    durationMins: 60,
    startDate: "2026-01-01",
    status: "Inactive",
    promotionStatus: "Standard",
    createdAt: "2025-11-20T14:00:00Z",
    updatedAt: "2026-02-18T09:00:00Z",
    provider: PROVIDERS[1],
    facility: FACILITIES[2],
    coaches: [
      { id: "COA-007", name: "Fatima Khalid",    email: "f.khalid@fitzone.sa",  specialisation: "Yoga & Mindfulness",  verification: "Verified",   status: "Active",    assignedDate: "2025-11-20" },
      { id: "COA-008", name: "Priya Nair",       email: "p.nair@fitzone.sa",    specialisation: "Vinyasa & Yin Yoga",  verification: "Unverified", status: "Suspended", assignedDate: "2025-12-01" },
    ],
    fullCourseBatches: [],
    perSessionSlots: [],
    subscriptionPlans: [
      { id: "PLN-005", planName: "Monthly - 3 Sessions/Week", planDuration: "Monthly",   sessionsPerWeek: 3, price: 450, currency: "SAR", autoRenew: true,  activeSubscribers: 0, status: "Inactive" },
      { id: "PLN-006", planName: "Monthly - 5 Sessions/Week", planDuration: "Monthly",   sessionsPerWeek: 5, price: 650, currency: "SAR", autoRenew: true,  activeSubscribers: 0, status: "Inactive" },
    ],
    exceptionDates: [],
    cancellationPolicy: defaultPolicy("Mindful Yoga & Wellness"),
    discounts: [],
    earnings: { grossRevenue: 21450, commission: 2145, commissionPct: 10, taxCollected: 965, taxPct: 5, netProviderEarnings: 18340, currency: "SAR", totalBookings: 47, activeBookings: 0, completedSessions: 310, cancelledSessions: 18, refundTotal: 8100 },
    reviews: [],
    averageRating: 0,
    auditTrail: [
      { id: "AUD-001", timestamp: "2025-11-20T14:00:00Z", event: "Training created", actor: "Provider" },
      { id: "AUD-002", timestamp: "2026-02-18T09:00:00Z", event: "Status changed to Inactive by Admin", actor: "Super Admin" },
    ],
  },

  // TRN-00006: Basketball - Per Session
  {
    id: "TRN-00006",
    name: "Basketball Skills & Drills",
    sport: "Basketball",
    level: "Beginner",
    trainingType: "Per Session",
    types: ["Per Session"],
    description: "Fun, high-energy basketball training sessions teaching dribbling, passing, shooting mechanics, and positional play.",
    minPlayers: 4, maxPlayers: 12,
    minAge: 8, maxAge: 18,
    genderRestriction: "Mixed",
    skillLevelDesc: "No prior experience required. Trainers and bibs provided.",
    durationMins: 60,
    startDate: "2026-02-15",
    status: "Active",
    promotionStatus: "Standard",
    createdAt: "2026-01-25T13:00:00Z",
    updatedAt: "2026-02-10T16:00:00Z",
    provider: PROVIDERS[3],
    facility: FACILITIES[4],
    coaches: [
      { id: "COA-009", name: "James Okafor",  email: "j.okafor@champions.sa", specialisation: "Basketball & Youth Coaching", verification: "Verified", status: "Active", assignedDate: "2026-01-25" },
    ],
    fullCourseBatches: [],
    perSessionSlots: [
      { id: "SLT-005", day: "Tuesday",   timeSlot: "15:30 - 16:30", durationMins: 60, price: 80, currency: "SAR", availableSpots: 10, recurrence: "Weekly" },
      { id: "SLT-006", day: "Thursday",  timeSlot: "15:30 - 16:30", durationMins: 60, price: 80, currency: "SAR", availableSpots: 12, recurrence: "Weekly" },
      { id: "SLT-007", day: "Saturday",  timeSlot: "09:00 - 10:00", durationMins: 60, price: 90, currency: "SAR", availableSpots: 8,  recurrence: "Weekly" },
    ],
    subscriptionPlans: [],
    exceptionDates: [],
    cancellationPolicy: defaultPolicy("Basketball Skills & Drills"),
    discounts: [
      { id: "DIS-005", name: "Kids Summer Discount", discountType: "Percentage", value: 10, applicableTo: "Per Session", validFrom: "2026-06-01", validUntil: "2026-08-31", status: "Active" },
    ],
    earnings: { grossRevenue: 19200, commission: 1920, commissionPct: 10, taxCollected: 864, taxPct: 5, netProviderEarnings: 16416, currency: "SAR", totalBookings: 240, activeBookings: 28, completedSessions: 210, cancelledSessions: 30, refundTotal: 2400 },
    reviews: SAMPLE_REVIEWS.slice(1, 3),
    averageRating: 4.5,
    auditTrail: defaultAudit("2026-01-25T13:00:00Z", "Basketball Skills & Drills"),
  },

  // TRN-00007: Badminton - Full Course
  {
    id: "TRN-00007",
    name: "Badminton Complete Training Course",
    sport: "Badminton",
    level: "Intermediate",
    trainingType: "Full Course",
    types: ["Full Course"],
    description: "A comprehensive badminton course covering footwork, stroke play, net shots, smashes, and singles/doubles tactics.",
    minPlayers: 2, maxPlayers: 8,
    minAge: 14,
    genderRestriction: "Mixed",
    skillLevelDesc: "Should be able to sustain a 10-shot rally consistently.",
    durationMins: 75,
    startDate: "2026-03-01",
    endDate: "2026-05-31",
    status: "Active",
    promotionStatus: "Promoted",
    createdAt: "2026-01-30T08:00:00Z",
    updatedAt: "2026-02-05T10:00:00Z",
    provider: PROVIDERS[0],
    facility: FACILITIES[0],
    coaches: [
      { id: "COA-010", name: "Leong Wei Ming",  email: "l.weiming@elitesports.sa", specialisation: "BWF-Certified Badminton Coach", verification: "Verified", status: "Active", assignedDate: "2026-01-30" },
    ],
    fullCourseBatches: [
      { id: "BAT-006", batchName: "Morning Intensive", startDate: "2026-03-01", endDate: "2026-05-31", daysOfWeek: ["Mon","Wed","Fri"], timeSlot: "07:00 - 08:15", totalSessions: 36, price: 1600, currency: "SAR", enrolled: 7,  maxCapacity: 8, status: "Open" },
      { id: "BAT-007", batchName: "Weekend Batch",    startDate: "2026-03-07", endDate: "2026-05-31", daysOfWeek: ["Sat","Sun"],       timeSlot: "09:00 - 10:15", totalSessions: 24, price: 1200, currency: "SAR", enrolled: 8,  maxCapacity: 8, status: "Full" },
    ],
    perSessionSlots: [],
    subscriptionPlans: [],
    exceptionDates: [{ id: "EXC-005", date: "2026-04-10", reason: "Coach Travel - BWF Qualification", affectedSessions: "All sessions", playersNotified: true }],
    cancellationPolicy: defaultPolicy("Badminton Complete Training Course"),
    discounts: [{ id: "DIS-006", name: "Sibling Pair Discount", discountType: "Fixed Amount", value: 150, applicableTo: "Full Course", validFrom: "2026-03-01", validUntil: "2026-05-31", minPlayers: 2, status: "Active" }],
    earnings: { grossRevenue: 15200, commission: 1520, commissionPct: 10, taxCollected: 684, taxPct: 5, netProviderEarnings: 12996, currency: "SAR", totalBookings: 15, activeBookings: 12, completedSessions: 60, cancelledSessions: 2, refundTotal: 1600 },
    reviews: SAMPLE_REVIEWS.slice(0, 2),
    averageRating: 4.5,
    auditTrail: defaultAudit("2026-01-30T08:00:00Z", "Badminton Complete Training Course"),
  },

  // TRN-00008: Cricket - Per Session
  {
    id: "TRN-00008",
    name: "Cricket Batting & Bowling Academy",
    sport: "Cricket",
    level: "All Levels",
    trainingType: "Per Session",
    types: ["Per Session"],
    description: "Specialised cricket training sessions covering batting technique, pace and spin bowling, and fielding.",
    minPlayers: 1, maxPlayers: 6,
    minAge: 10,
    genderRestriction: "Mixed",
    skillLevelDesc: "Open to all levels.",
    durationMins: 90,
    startDate: "2026-02-01",
    status: "Active",
    promotionStatus: "Standard",
    createdAt: "2026-01-28T09:00:00Z",
    updatedAt: "2026-02-12T14:00:00Z",
    provider: PROVIDERS[3],
    facility: FACILITIES[4],
    coaches: [
      { id: "COA-011", name: "Rahul Sharma",  email: "r.sharma@champions.sa", specialisation: "Batting & Spin Bowling",   verification: "Verified",   status: "Active",   assignedDate: "2026-01-28" },
      { id: "COA-012", name: "Hassan Khan",   email: "h.khan@champions.sa",   specialisation: "Pace Bowling & Fielding",  verification: "Unverified", status: "Inactive", assignedDate: "2026-02-01" },
      { id: "COA-020", name: "Imran Malik",   email: "i.malik@champions.sa",  specialisation: "Wicket Keeping",           verification: "Verified",   status: "Active",   assignedDate: "2026-02-05" },
    ],
    fullCourseBatches: [],
    perSessionSlots: [
      { id: "SLT-008", day: "Monday",    timeSlot: "07:00 - 08:30", durationMins: 90, price: 150, currency: "SAR", availableSpots: 5, recurrence: "Weekly" },
      { id: "SLT-009", day: "Wednesday", timeSlot: "07:00 - 08:30", durationMins: 90, price: 150, currency: "SAR", availableSpots: 6, recurrence: "Weekly" },
      { id: "SLT-010", day: "Friday",    timeSlot: "16:00 - 17:30", durationMins: 90, price: 160, currency: "SAR", availableSpots: 4, recurrence: "Weekly" },
    ],
    subscriptionPlans: [],
    exceptionDates: [],
    cancellationPolicy: defaultPolicy("Cricket Batting & Bowling Academy"),
    discounts: [],
    earnings: { grossRevenue: 27000, commission: 2700, commissionPct: 10, taxCollected: 1215, taxPct: 5, netProviderEarnings: 23085, currency: "SAR", totalBookings: 180, activeBookings: 22, completedSessions: 165, cancelledSessions: 15, refundTotal: 2250 },
    reviews: SAMPLE_REVIEWS.slice(3, 5),
    averageRating: 3.5,
    auditTrail: defaultAudit("2026-01-28T09:00:00Z", "Cricket Batting & Bowling Academy"),
  },

  // TRN-00009: Volleyball - Full Course - Inactive
  {
    id: "TRN-00009",
    name: "Beach Volleyball Essentials",
    sport: "Volleyball",
    level: "Beginner",
    trainingType: "Full Course",
    types: ["Full Course"],
    description: "Learn beach volleyball from scratch in a fun, outdoor setting.",
    minPlayers: 4, maxPlayers: 8,
    minAge: 16,
    genderRestriction: "Mixed",
    skillLevelDesc: "No experience required.",
    durationMins: 60,
    startDate: "2026-03-01",
    endDate: "2026-05-31",
    status: "Inactive",
    promotionStatus: "Standard",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-19T11:00:00Z",
    provider: PROVIDERS[0],
    facility: FACILITIES[6],
    coaches: [
      { id: "COA-013", name: "Maria Santos",  email: "m.santos@elitesports.sa", specialisation: "Beach Volleyball", verification: "Verified", status: "Active", assignedDate: "2026-02-01" },
    ],
    fullCourseBatches: [
      { id: "BAT-008", batchName: "Weekend Warriors", startDate: "2026-03-01", endDate: "2026-05-31", daysOfWeek: ["Sat","Sun"], timeSlot: "07:30 - 08:30", totalSessions: 24, price: 1100, currency: "SAR", enrolled: 0, maxCapacity: 8, status: "Cancelled" },
    ],
    perSessionSlots: [],
    subscriptionPlans: [],
    exceptionDates: [],
    cancellationPolicy: defaultPolicy("Beach Volleyball Essentials"),
    discounts: [],
    earnings: { grossRevenue: 0, commission: 0, commissionPct: 10, taxCollected: 0, taxPct: 5, netProviderEarnings: 0, currency: "SAR", totalBookings: 0, activeBookings: 0, completedSessions: 0, cancelledSessions: 0, refundTotal: 0 },
    reviews: [],
    averageRating: 0,
    auditTrail: [
      { id: "AUD-001", timestamp: "2026-02-01T10:00:00Z", event: "Training created", actor: "Provider" },
      { id: "AUD-002", timestamp: "2026-02-19T11:00:00Z", event: "Status changed to Inactive", actor: "Super Admin" },
    ],
  },

  // TRN-00010: Padel - Subscription - Multi-type
  {
    id: "TRN-00010",
    name: "Padel Unlimited Subscription",
    sport: "Padel",
    level: "All Levels",
    trainingType: "Subscription",
    types: ["Per Session", "Subscription"],
    description: "Flexible padel training subscription for players who want to train at their own pace.",
    minPlayers: 2, maxPlayers: 4,
    genderRestriction: "Mixed",
    skillLevelDesc: "All levels welcome. Ability grouping will be applied.",
    durationMins: 60,
    startDate: "2026-01-15",
    status: "Active",
    promotionStatus: "Promoted",
    createdAt: "2026-01-05T08:00:00Z",
    updatedAt: "2026-02-18T10:00:00Z",
    provider: PROVIDERS[4],
    facility: FACILITIES[3],
    coaches: [
      { id: "COA-014", name: "Elena Sokolova",  email: "e.sokolova@desertpadel.sa", specialisation: "Padel All Levels",   verification: "Verified", status: "Active", assignedDate: "2026-01-05" },
      { id: "COA-006", name: "Diego Fernandez", email: "d.fernandez@desertpadel.sa", specialisation: "Padel Strategy",   verification: "Verified", status: "Active", assignedDate: "2026-01-05" },
    ],
    fullCourseBatches: [],
    perSessionSlots: [
      { id: "SLT-020", day: "Monday",    timeSlot: "07:00 - 08:00", durationMins: 60, price: 100, currency: "SAR", availableSpots: 4, recurrence: "Weekly" },
      { id: "SLT-021", day: "Wednesday", timeSlot: "18:00 - 19:00", durationMins: 60, price: 120, currency: "SAR", availableSpots: 4, recurrence: "Weekly" },
    ],
    subscriptionPlans: [
      { id: "PLN-007", planName: "Starter - 2 Sessions/Week",  planDuration: "Monthly",   sessionsPerWeek: 2, price: 700,  currency: "SAR", autoRenew: true,  activeSubscribers: 12, status: "Active" },
      { id: "PLN-008", planName: "Regular - 3 Sessions/Week",  planDuration: "Monthly",   sessionsPerWeek: 3, price: 950,  currency: "SAR", autoRenew: true,  activeSubscribers: 18, status: "Active" },
      { id: "PLN-009", planName: "Intensive - 5 Sessions/Week",planDuration: "Monthly",   sessionsPerWeek: 5, price: 1400, currency: "SAR", autoRenew: true,  activeSubscribers: 9,  status: "Active" },
      { id: "PLN-010", planName: "Quarterly Regular",          planDuration: "Quarterly", sessionsPerWeek: 3, price: 2565, currency: "SAR", autoRenew: false, activeSubscribers: 6,  status: "Active" },
    ],
    exceptionDates: [{ id: "EXC-006", date: "2026-03-30", reason: "Court Lighting Maintenance", affectedSessions: "Evening sessions only", playersNotified: true }],
    cancellationPolicy: { policyName: "Desert Padel Subscription Policy", applicableTo: "Padel Unlimited", tiers: [{ window: "Before billing date", refundPercent: 100 }, { window: "After billing date", refundPercent: 0 }] },
    discounts: [{ id: "DIS-007", name: "3-Month Bundle", discountType: "Percentage", value: 10, applicableTo: "Subscription - Quarterly", validFrom: "2026-01-15", validUntil: "2026-12-31", status: "Active" }],
    earnings: { grossRevenue: 203900, commission: 20390, commissionPct: 10, taxCollected: 9176, taxPct: 5, netProviderEarnings: 174334, currency: "SAR", totalBookings: 45, activeBookings: 39, completedSessions: 1820, cancelledSessions: 40, refundTotal: 9500 },
    reviews: SAMPLE_REVIEWS,
    averageRating: 4.2,
    auditTrail: defaultAudit("2026-01-05T08:00:00Z", "Padel Unlimited Subscription"),
  },

  // Compact entries for table variety (TRN-00011 through TRN-00020)

  { id: "TRN-00011", name: "Junior Football Stars", sport: "Football", level: "Beginner", trainingType: "Per Session", types: ["Per Session"], description: "Football training for kids 5-10.", minPlayers: 5, maxPlayers: 15, minAge: 5, maxAge: 10, genderRestriction: "Mixed", skillLevelDesc: "For kids aged 5-10.", durationMins: 45, startDate: "2026-02-01", status: "Active", promotionStatus: "Standard", createdAt: "2026-01-18T08:00:00Z", updatedAt: "2026-02-01T10:00:00Z", provider: PROVIDERS[0], facility: FACILITIES[0], coaches: [{ id: "COA-015", name: "Ali Hassan", email: "a.hassan@elitesports.sa", specialisation: "Youth Football", verification: "Verified", status: "Active", assignedDate: "2026-01-18" }], fullCourseBatches: [], perSessionSlots: [{ id: "SLT-011", day: "Saturday", timeSlot: "10:00 - 10:45", durationMins: 45, price: 60, currency: "SAR", availableSpots: 12, recurrence: "Weekly" }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Junior Football Stars"), discounts: [], earnings: { grossRevenue: 12000, commission: 1200, commissionPct: 10, taxCollected: 540, taxPct: 5, netProviderEarnings: 10260, currency: "SAR", totalBookings: 200, activeBookings: 18, completedSessions: 180, cancelledSessions: 20, refundTotal: 1200 }, reviews: SAMPLE_REVIEWS.slice(0, 2), averageRating: 4.5, auditTrail: defaultAudit("2026-01-18T08:00:00Z", "Junior Football Stars") },

  { id: "TRN-00012", name: "Advanced Tennis Strategy", sport: "Tennis", level: "Advanced", trainingType: "Full Course", types: ["Full Course"], description: "Advanced-level tennis strategy and match play.", minPlayers: 2, maxPlayers: 4, genderRestriction: "Mixed", skillLevelDesc: "Club ranking required.", durationMins: 90, startDate: "2026-03-01", endDate: "2026-05-31", status: "Active", promotionStatus: "Standard", createdAt: "2026-02-01T11:00:00Z", updatedAt: "2026-02-12T09:00:00Z", provider: PROVIDERS[2], facility: FACILITIES[1], coaches: [{ id: "COA-016", name: "Marco Rossi", email: "m.rossi@gulftennis.sa", specialisation: "Advanced Match Play", verification: "Verified", status: "Active", assignedDate: "2026-02-01" }], fullCourseBatches: [{ id: "BAT-009", batchName: "Intensive April", startDate: "2026-03-01", endDate: "2026-05-31", daysOfWeek: ["Tue","Thu"], timeSlot: "07:00 - 08:30", totalSessions: 24, price: 3600, currency: "SAR", enrolled: 4, maxCapacity: 4, status: "Full" }], perSessionSlots: [], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Advanced Tennis"), discounts: [], earnings: { grossRevenue: 14400, commission: 1440, commissionPct: 10, taxCollected: 648, taxPct: 5, netProviderEarnings: 12312, currency: "SAR", totalBookings: 4, activeBookings: 4, completedSessions: 18, cancelledSessions: 0, refundTotal: 0 }, reviews: SAMPLE_REVIEWS.slice(0, 1), averageRating: 5.0, auditTrail: defaultAudit("2026-02-01T11:00:00Z", "Advanced Tennis Strategy") },

  { id: "TRN-00013", name: "CrossFit Fundamentals", sport: "Yoga", level: "Beginner", trainingType: "Subscription", types: ["Subscription"], description: "High-intensity functional fitness for beginners.", minPlayers: 5, maxPlayers: 20, genderRestriction: "Mixed", skillLevelDesc: "Basic fitness level required.", durationMins: 45, startDate: "2026-01-01", status: "Active", promotionStatus: "Standard", createdAt: "2025-12-15T09:00:00Z", updatedAt: "2026-02-10T14:00:00Z", provider: PROVIDERS[1], facility: FACILITIES[2], coaches: [{ id: "COA-017", name: "Lena Petrov", email: "l.petrov@fitzone.sa", specialisation: "CrossFit & HIIT", verification: "Verified", status: "Active", assignedDate: "2025-12-15" }], fullCourseBatches: [], perSessionSlots: [], subscriptionPlans: [{ id: "PLN-011", planName: "Monthly 3/Week", planDuration: "Monthly", sessionsPerWeek: 3, price: 400, currency: "SAR", autoRenew: true, activeSubscribers: 22, status: "Active" }], exceptionDates: [], cancellationPolicy: defaultPolicy("CrossFit Fundamentals"), discounts: [], earnings: { grossRevenue: 52800, commission: 5280, commissionPct: 10, taxCollected: 2376, taxPct: 5, netProviderEarnings: 45144, currency: "SAR", totalBookings: 132, activeBookings: 22, completedSessions: 840, cancelledSessions: 28, refundTotal: 3200 }, reviews: SAMPLE_REVIEWS.slice(1, 4), averageRating: 4.0, auditTrail: defaultAudit("2025-12-15T09:00:00Z", "CrossFit Fundamentals") },

  { id: "TRN-00014", name: "Women's Padel Beginner Course", sport: "Padel", level: "Beginner", trainingType: "Full Course", types: ["Full Course"], description: "Ladies-only padel starter course in a welcoming environment.", minPlayers: 2, maxPlayers: 6, genderRestriction: "Female Only", skillLevelDesc: "No experience needed.", durationMins: 60, startDate: "2026-03-08", endDate: "2026-05-08", status: "Active", promotionStatus: "Promoted", createdAt: "2026-02-05T10:00:00Z", updatedAt: "2026-02-15T11:00:00Z", provider: PROVIDERS[4], facility: FACILITIES[3], coaches: [{ id: "COA-014", name: "Elena Sokolova", email: "e.sokolova@desertpadel.sa", specialisation: "Ladies Padel", verification: "Verified", status: "Active", assignedDate: "2026-02-05" }], fullCourseBatches: [{ id: "BAT-010", batchName: "Ladies Spring Batch", startDate: "2026-03-08", endDate: "2026-05-08", daysOfWeek: ["Mon","Wed"], timeSlot: "10:00 - 11:00", totalSessions: 18, price: 980, currency: "SAR", enrolled: 6, maxCapacity: 6, status: "Full" }], perSessionSlots: [], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Women's Padel Beginner"), discounts: [{ id: "DIS-008", name: "International Women's Day Promo", discountType: "Percentage", value: 20, applicableTo: "Full Course", validFrom: "2026-03-08", validUntil: "2026-03-08", status: "Expired" }], earnings: { grossRevenue: 5880, commission: 588, commissionPct: 10, taxCollected: 265, taxPct: 5, netProviderEarnings: 5027, currency: "SAR", totalBookings: 6, activeBookings: 6, completedSessions: 10, cancelledSessions: 0, refundTotal: 0 }, reviews: SAMPLE_REVIEWS.slice(0, 3), averageRating: 4.7, auditTrail: defaultAudit("2026-02-05T10:00:00Z", "Women's Padel Beginner Course") },

  { id: "TRN-00015", name: "Squash Power Training", sport: "Squash", level: "Intermediate", trainingType: "Per Session", types: ["Per Session"], description: "Squash fitness and technical sessions for club players.", minPlayers: 1, maxPlayers: 2, genderRestriction: "Mixed", skillLevelDesc: "Can play basic squash.", durationMins: 60, startDate: "2026-02-10", status: "Active", promotionStatus: "Standard", createdAt: "2026-02-01T12:00:00Z", updatedAt: "2026-02-10T08:00:00Z", provider: PROVIDERS[2], facility: FACILITIES[1], coaches: [{ id: "COA-018", name: "David Park", email: "d.park@gulftennis.sa", specialisation: "Squash & Racquet Sports", verification: "Verified", status: "Active", assignedDate: "2026-02-01" }], fullCourseBatches: [], perSessionSlots: [{ id: "SLT-012", day: "Tuesday", timeSlot: "07:00 - 08:00", durationMins: 60, price: 200, currency: "SAR", availableSpots: 2, recurrence: "Weekly" }, { id: "SLT-013", day: "Thursday", timeSlot: "07:00 - 08:00", durationMins: 60, price: 200, currency: "SAR", availableSpots: 2, recurrence: "Weekly" }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Squash Power Training"), discounts: [], earnings: { grossRevenue: 8800, commission: 880, commissionPct: 10, taxCollected: 396, taxPct: 5, netProviderEarnings: 7524, currency: "SAR", totalBookings: 44, activeBookings: 6, completedSessions: 40, cancelledSessions: 4, refundTotal: 800 }, reviews: SAMPLE_REVIEWS.slice(2, 5), averageRating: 4.0, auditTrail: defaultAudit("2026-02-01T12:00:00Z", "Squash Power Training") },

  { id: "TRN-00016", name: "Football Goalkeeper Masterclass", sport: "Football", level: "Advanced", trainingType: "Per Session", types: ["Per Session"], description: "Goalkeeper-specific training: shot-stopping, distribution, sweeping, command.", minPlayers: 1, maxPlayers: 3, minAge: 14, genderRestriction: "Mixed", skillLevelDesc: "Playing goalkeeper at club level.", durationMins: 90, startDate: "2026-02-08", status: "Active", promotionStatus: "Standard", createdAt: "2026-02-01T09:00:00Z", updatedAt: "2026-02-08T10:00:00Z", provider: PROVIDERS[0], facility: FACILITIES[0], coaches: [{ id: "COA-019", name: "Pedro Alvarez", email: "p.alvarez@elitesports.sa", specialisation: "Goalkeeping", verification: "Verified", status: "Active", assignedDate: "2026-02-01" }], fullCourseBatches: [], perSessionSlots: [{ id: "SLT-014", day: "Sunday", timeSlot: "07:00 - 08:30", durationMins: 90, price: 350, currency: "SAR", availableSpots: 3, recurrence: "Weekly" }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("GK Masterclass"), discounts: [], earnings: { grossRevenue: 7000, commission: 700, commissionPct: 10, taxCollected: 315, taxPct: 5, netProviderEarnings: 5985, currency: "SAR", totalBookings: 20, activeBookings: 4, completedSessions: 18, cancelledSessions: 2, refundTotal: 700 }, reviews: SAMPLE_REVIEWS.slice(0, 1), averageRating: 5.0, auditTrail: defaultAudit("2026-02-01T09:00:00Z", "Football Goalkeeper Masterclass") },

  { id: "TRN-00017", name: "Swim for Fitness - Adults", sport: "Swimming", level: "Beginner", trainingType: "Subscription", types: ["Subscription"], description: "Low-impact swimming fitness programme for adults.", minPlayers: 2, maxPlayers: 8, minAge: 18, genderRestriction: "Mixed", skillLevelDesc: "Must be able to swim 25m unaided.", durationMins: 45, startDate: "2026-01-15", status: "Active", promotionStatus: "Standard", createdAt: "2025-12-20T08:00:00Z", updatedAt: "2026-02-01T09:00:00Z", provider: PROVIDERS[1], facility: FACILITIES[5], coaches: [{ id: "COA-005", name: "Sarah Al-Mansouri", email: "s.mansouri@fitzone.sa", specialisation: "Fitness Swimming", verification: "Verified", status: "Active", assignedDate: "2025-12-20" }], fullCourseBatches: [], perSessionSlots: [], subscriptionPlans: [{ id: "PLN-012", planName: "Monthly 3/Week", planDuration: "Monthly", sessionsPerWeek: 3, price: 500, currency: "SAR", autoRenew: true, activeSubscribers: 14, status: "Active" }], exceptionDates: [], cancellationPolicy: defaultPolicy("Swim for Fitness"), discounts: [], earnings: { grossRevenue: 42000, commission: 4200, commissionPct: 10, taxCollected: 1890, taxPct: 5, netProviderEarnings: 35910, currency: "SAR", totalBookings: 84, activeBookings: 14, completedSessions: 630, cancelledSessions: 14, refundTotal: 2000 }, reviews: SAMPLE_REVIEWS.slice(1, 4), averageRating: 4.0, auditTrail: defaultAudit("2025-12-20T08:00:00Z", "Swim for Fitness - Adults") },

  { id: "TRN-00018", name: "Tennis Juniors Academy", sport: "Tennis", level: "Beginner", trainingType: "Full Course", types: ["Full Course"], description: "Tennis programme for juniors aged 7-15.", minPlayers: 4, maxPlayers: 10, minAge: 7, maxAge: 15, genderRestriction: "Mixed", skillLevelDesc: "No experience required.", durationMins: 60, startDate: "2026-03-01", endDate: "2026-06-30", status: "Active", promotionStatus: "Standard", createdAt: "2026-02-10T09:00:00Z", updatedAt: "2026-02-18T10:00:00Z", provider: PROVIDERS[2], facility: FACILITIES[1], coaches: [{ id: "COA-003", name: "Emma Wright", email: "e.wright@gulftennis.sa", specialisation: "Junior Development", verification: "Verified", status: "Active", assignedDate: "2026-02-10" }], fullCourseBatches: [{ id: "BAT-011", batchName: "Spring Juniors", startDate: "2026-03-01", endDate: "2026-06-30", daysOfWeek: ["Sat","Sun"], timeSlot: "09:00 - 10:00", totalSessions: 32, price: 1600, currency: "SAR", enrolled: 9, maxCapacity: 10, status: "Open" }], perSessionSlots: [], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Tennis Juniors Academy"), discounts: [{ id: "DIS-009", name: "Sibling Discount", discountType: "Percentage", value: 15, applicableTo: "Full Course", validFrom: "2026-03-01", validUntil: "2026-06-30", minPlayers: 2, status: "Active" }], earnings: { grossRevenue: 14400, commission: 1440, commissionPct: 10, taxCollected: 648, taxPct: 5, netProviderEarnings: 12312, currency: "SAR", totalBookings: 9, activeBookings: 9, completedSessions: 24, cancelledSessions: 1, refundTotal: 1600 }, reviews: SAMPLE_REVIEWS.slice(0, 3), averageRating: 4.7, auditTrail: defaultAudit("2026-02-10T09:00:00Z", "Tennis Juniors Academy") },

  { id: "TRN-00019", name: "Functional Fitness Bootcamp", sport: "Yoga", level: "Intermediate", trainingType: "Per Session", types: ["Per Session"], description: "High-intensity bootcamp blending strength, cardio, and core work.", minPlayers: 5, maxPlayers: 20, genderRestriction: "Mixed", skillLevelDesc: "Regular gym-goers or sports players.", durationMins: 45, startDate: "2026-02-01", status: "Inactive", promotionStatus: "Standard", createdAt: "2026-01-10T10:00:00Z", updatedAt: "2026-02-20T12:00:00Z", provider: PROVIDERS[1], facility: FACILITIES[2], coaches: [{ id: "COA-017", name: "Lena Petrov", email: "l.petrov@fitzone.sa", specialisation: "HIIT & Bootcamp", verification: "Verified", status: "Active", assignedDate: "2026-01-10" }], fullCourseBatches: [], perSessionSlots: [{ id: "SLT-015", day: "Monday", timeSlot: "06:00 - 06:45", durationMins: 45, price: 70, currency: "SAR", availableSpots: 15, recurrence: "Weekly" }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Functional Fitness Bootcamp"), discounts: [], earnings: { grossRevenue: 9800, commission: 980, commissionPct: 10, taxCollected: 441, taxPct: 5, netProviderEarnings: 8379, currency: "SAR", totalBookings: 140, activeBookings: 0, completedSessions: 120, cancelledSessions: 20, refundTotal: 1400 }, reviews: [], averageRating: 0, auditTrail: defaultAudit("2026-01-10T10:00:00Z", "Functional Fitness Bootcamp") },

  { id: "TRN-00020", name: "Riyadh Football Academy Junior", sport: "Football", level: "Beginner", trainingType: "Full Course", types: ["Full Course", "Per Session"], description: "Junior football academy programme in Riyadh for kids aged 6-14.", minPlayers: 8, maxPlayers: 20, minAge: 6, maxAge: 14, genderRestriction: "Male Only", skillLevelDesc: "No experience required.", durationMins: 60, startDate: "2026-03-01", endDate: "2026-07-31", status: "Active", promotionStatus: "Standard", createdAt: "2026-02-08T08:00:00Z", updatedAt: "2026-02-18T11:00:00Z", provider: PROVIDERS[3], facility: FACILITIES[4], coaches: [{ id: "COA-009", name: "James Okafor", email: "j.okafor@champions.sa", specialisation: "Youth Football Coaching", verification: "Verified", status: "Active", assignedDate: "2026-02-08" }, { id: "COA-015", name: "Ali Hassan", email: "a.hassan@champions.sa", specialisation: "U10 & U12 Football", verification: "Verified", status: "Active", assignedDate: "2026-02-08" }], fullCourseBatches: [{ id: "BAT-012", batchName: "Riyadh Spring Session", startDate: "2026-03-01", endDate: "2026-07-31", daysOfWeek: ["Tue","Thu","Sat"], timeSlot: "16:00 - 17:00", totalSessions: 65, price: 1800, currency: "SAR", enrolled: 16, maxCapacity: 20, status: "Open" }], perSessionSlots: [{ id: "SLT-030", day: "Sunday", timeSlot: "09:00 - 10:00", durationMins: 60, price: 80, currency: "SAR", availableSpots: 10, recurrence: "Weekly" }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Riyadh Football Academy Junior"), discounts: [{ id: "DIS-010", name: "Second Child 50% Off", discountType: "Percentage", value: 50, applicableTo: "Full Course", validFrom: "2026-03-01", validUntil: "2026-07-31", minPlayers: 2, status: "Active" }], earnings: { grossRevenue: 28800, commission: 2880, commissionPct: 10, taxCollected: 1296, taxPct: 5, netProviderEarnings: 24624, currency: "SAR", totalBookings: 16, activeBookings: 16, completedSessions: 20, cancelledSessions: 0, refundTotal: 0 }, reviews: SAMPLE_REVIEWS.slice(0, 4), averageRating: 4.3, auditTrail: defaultAudit("2026-02-08T08:00:00Z", "Riyadh Football Academy Junior") },
];

// ─── Transform raw data to include new fields ──────────────────

function generateRatingBreakdown(avgRating: number, reviewCount: number): RatingBreakdown {
  if (reviewCount === 0) return { fiveStars: 0, fourStars: 0, threeStars: 0, twoStars: 0, oneStar: 0 };
  const total = reviewCount;
  const five  = Math.round(total * (avgRating >= 4.5 ? 0.45 : avgRating >= 4 ? 0.35 : 0.20));
  const four  = Math.round(total * (avgRating >= 4 ? 0.30 : 0.25));
  const three = Math.round(total * 0.15);
  const two   = Math.round(total * 0.07);
  const one   = Math.max(0, total - five - four - three - two);
  return { fiveStars: five, fourStars: four, threeStars: three, twoStars: two, oneStar: one };
}

function transformEarnings(raw: RawEarnings): EarningPreview {
  const grossPerSession = raw.totalBookings > 0
    ? Math.round((raw.grossRevenue / raw.totalBookings) * 100) / 100
    : 150;
  const commAmt  = Math.round(grossPerSession * raw.commissionPct / 100 * 100) / 100;
  const afterComm = Math.round((grossPerSession - commAmt) * 100) / 100;
  const taxAmt   = Math.round(afterComm * raw.taxPct / 100 * 100) / 100;
  const net      = Math.round((afterComm - taxAmt) * 100) / 100;
  return {
    grossPerSession,
    commissionPct:   raw.commissionPct,
    commissionAmount: commAmt,
    afterCommission: afterComm,
    taxPct:          raw.taxPct,
    taxAmount:       taxAmt,
    netPayout:       net,
    currency:        raw.currency,
    totalBookings:   raw.totalBookings,
    activeBookings:  raw.activeBookings,
  };
}

function deriveFullCoursePricing(t: RawTraining): FullCoursePricing | undefined {
  if (!t.types.includes("Full Course") || t.fullCourseBatches.length === 0) return undefined;
  const b = t.fullCourseBatches[0];
  return {
    totalPrice:       b.price,
    numberOfSessions: b.totalSessions,
    pricePerSession:  Math.round(b.price / b.totalSessions * 100) / 100,
    currency:         b.currency,
  };
}

function derivePerSessionPricing(t: RawTraining): PerSessionPricing | undefined {
  if (!t.types.includes("Per Session") || t.perSessionSlots.length === 0) return undefined;
  const s = t.perSessionSlots[0];
  return {
    pricePerSession: s.price,
    minSessions:     1,
    maxSessions:     t.perSessionSlots.length * 4,
    currency:        s.currency,
  };
}

function deriveSubscriptionPricing(t: RawTraining): SubscriptionPricing | undefined {
  if (!t.types.includes("Subscription") || t.subscriptionPlans.length === 0) return undefined;
  const p = t.subscriptionPlans[0];
  return {
    monthlyPrice:     p.price,
    sessionsPerMonth: p.sessionsPerWeek * 4,
    commitmentPeriod: p.planDuration === "Monthly" ? "1 month" : p.planDuration === "Quarterly" ? "3 months" : "12 months",
    currency:         p.currency,
  };
}

export const MOCK_TRAININGS: Training[] = RAW_TRAININGS.map(raw => ({
  ...raw,
  earnings:            transformEarnings(raw.earnings),
  ratingBreakdown:     generateRatingBreakdown(raw.averageRating, raw.reviews.length),
  totalReviews:        raw.reviews.length,
  fullCoursePricing:   deriveFullCoursePricing(raw),
  perSessionPricing:   derivePerSessionPricing(raw),
  subscriptionPricing: deriveSubscriptionPricing(raw),
}));
