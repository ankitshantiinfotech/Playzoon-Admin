import {
  Facility, FacilityProvider, SportConfig, Court, CourtSchedule,
  PricingRule, FacilitySubscriptionPlan, FacilityException,
  FacilityCancellationPolicy, MediaFile, FacilityEarnings,
  OperatingSchedule, DayHours, FacilityAuditEntry, FacilityReview,
} from "./types";

// Old earnings shape (before transformation)
interface RawEarnings {
  grossRevenue: number; commission: number; commissionPct: number;
  taxCollected: number; netProviderEarnings: number; currency: string;
  totalBookings: number; completedSessions: number; cancelledSessions: number;
  refundTotal: number; avgOccupancyRate: number;
}
type RawFacility = Omit<Facility, "earnings" | "facilityRules" | "auditTrail" | "averageRating" | "totalReviews" | "reviews"> & { earnings: RawEarnings };

// ─── Image Assets ─────────────────────────────────────────────

export const IMG_FOOTBALL_OUTDOOR  = "https://images.unsplash.com/photo-1762828841207-44b4c70f96a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
export const IMG_TENNIS_INDOOR     = "https://images.unsplash.com/photo-1635842906228-2a76cd0e7e11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
export const IMG_PADEL_COURT       = "https://images.unsplash.com/photo-1707664635804-5cdd900a754e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
export const IMG_SWIMMING_POOL     = "https://images.unsplash.com/photo-1761049862641-16616dea7b32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
export const IMG_LOBBY             = "https://images.unsplash.com/photo-1700832720054-71f5e1b140fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
export const IMG_BASKETBALL        = "https://images.unsplash.com/photo-1559369064-c4d65141e408?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
export const IMG_FOOTBALL_NIGHT    = "https://images.unsplash.com/photo-1768327507996-344f082fbe17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
export const IMG_BADMINTON         = "https://images.unsplash.com/photo-1624024834874-2a1611305604?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

// ─── Providers ────────────────────────────────────────────────

const PROVIDERS: FacilityProvider[] = [
  { id: "PRV-FAC-001", name: "Champions Arena Dubai",    type: "Facility Provider", email: "ops@championsarena.ae",    phone: "+971 4 123 4567", status: "Active",    personInCharge: "Khalid Al Marri",    picContact: "k.almarri@championsarena.ae",    country: "UAE" },
  { id: "PRV-FAC-002", name: "Gulf Sports Complex",      type: "Facility Provider", email: "admin@gulfsports.ae",      phone: "+971 4 234 5678", status: "Active",    personInCharge: "Sarah Johnson",       picContact: "s.johnson@gulfsports.ae",        country: "UAE" },
  { id: "PRV-FAC-003", name: "Desert Arena Group",       type: "Facility Provider", email: "info@desertarena.ae",      phone: "+971 2 345 6789", status: "Active",    personInCharge: "Mohammed Al Suwaidi", picContact: "m.suwaidi@desertarena.ae",       country: "UAE" },
  { id: "PRV-FAC-004", name: "Riyadh Sports Hub",        type: "Facility Provider", email: "contact@riyadhhub.sa",     phone: "+966 11 456 7890", status: "Active",   personInCharge: "Faisal Al Harbi",     picContact: "f.alharbi@riyadhhub.sa",         country: "Saudi Arabia" },
  { id: "PRV-FAC-005", name: "Al Qasba Sports Centre",   type: "Facility Provider", email: "info@alqasbasports.ae",    phone: "+971 6 567 8901", status: "Suspended", personInCharge: "Rania Hamdan",        picContact: "r.hamdan@alqasbasports.ae",      country: "UAE" },
];

// ─── Helpers ──────────────────────────────────────────────────

function hours(open: string, close: string): DayHours         { return { open, close, closed: false }; }
function closed(): DayHours                                    { return { open: "", close: "", closed: true }; }

function standardHours(openWeekday: string, closeWeekday: string): OperatingSchedule {
  return {
    Monday: hours(openWeekday, closeWeekday), Tuesday: hours(openWeekday, closeWeekday),
    Wednesday: hours(openWeekday, closeWeekday), Thursday: hours(openWeekday, closeWeekday),
    Friday: hours("14:00", closeWeekday), Saturday: hours("08:00", closeWeekday),
    Sunday: hours("08:00", closeWeekday),
  };
}

function defaultPolicy(name: string): FacilityCancellationPolicy {
  return {
    policyName: name,
    tiers: [
      { window: "More than 48 hours before session",  refundPercent: 100 },
      { window: "24–48 hours before session",          refundPercent: 50  },
      { window: "Less than 24 hours before session",   refundPercent: 0   },
    ],
    platformFeeRefundable: false,
  };
}

function buildSchedule(courtId: string, courtName: string, days: string[], slots: string[], peakSlots: boolean[]): CourtSchedule {
  return {
    courtId,
    courtName,
    schedule: days.map(day => ({
      day,
      slots,
      slotDuration: 60,
      isPeak: peakSlots,
    })),
  };
}

const WEEK = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const SLOTS_60 = ["06:00–07:00","07:00–08:00","08:00–09:00","09:00–10:00","10:00–11:00","11:00–12:00","12:00–13:00","13:00–14:00","14:00–15:00","15:00–16:00","16:00–17:00","17:00–18:00","18:00–19:00","19:00–20:00","20:00–21:00","21:00–22:00"];
const PEAK_60  = [false,false,false,true,true,true,false,false,false,true,true,true,true,true,true,false]; // 09–12 & 15–21 peak

// ─── Mock Facilities ──────────────────────────────────────────

const RAW_FACILITIES: RawFacility[] = [

  // ── FAC-00001: Champions Multi-Sports Complex ──────────────
  {
    id: "FAC-00001",
    name: "Champions Multi-Sports Complex",
    facilityType: "Mixed",
    description: "Dubai's premier multi-sports complex featuring 5 football pitches, 4 padel courts, 2 indoor basketball courts, and a 25m swimming pool. Located in Al Barsha with ample parking and fully air-conditioned indoor areas. Hosts league games, tournaments, and private training sessions year-round.",
    addressLine1: "Building 12, Al Barsha Sports Precinct",
    addressLine2: "Near Mall of the Emirates",
    area: "Al Barsha",
    city: "Dubai",
    country: "UAE",
    latitude: 25.1170,
    longitude: 55.2006,
    contactPhone: "+971 4 111 2233",
    contactEmail: "bookings@championscomplex.ae",
    operatingHours: {
      Monday:    hours("06:00", "23:00"), Tuesday:   hours("06:00", "23:00"),
      Wednesday: hours("06:00", "23:00"), Thursday:  hours("06:00", "23:00"),
      Friday:    hours("14:00", "23:00"), Saturday:  hours("07:00", "23:00"),
      Sunday:    hours("07:00", "23:00"),
    },
    status: "Active",
    promotionStatus: "Promoted",
    createdAt: "2025-06-01T08:00:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
    provider: PROVIDERS[0],
    sports: [
      { sport: "Football",    courtType: "5-a-side Astroturf Pitch", capacity: 10 },
      { sport: "Padel",       courtType: "Panoramic Glass Court",    capacity: 4  },
      { sport: "Basketball",  courtType: "Full-Size Hardwood Court", capacity: 10 },
      { sport: "Swimming",    courtType: "25m Competition Pool",     capacity: 8  },
    ],
    courts: [
      { id: "CRT-001-A", name: "Pitch A",     courtType: "5-a-side Astroturf", sport: "Football",   stations: [],             capacity: 10, isIndoor: false, amenities: ["Floodlights","Changing Rooms","Water Station","Scoreboard"], status: "Available" },
      { id: "CRT-001-B", name: "Pitch B",     courtType: "5-a-side Astroturf", sport: "Football",   stations: [],             capacity: 10, isIndoor: false, amenities: ["Floodlights","Changing Rooms","Water Station"],             status: "Available" },
      { id: "CRT-001-C", name: "Pitch C",     courtType: "5-a-side Astroturf", sport: "Football",   stations: [],             capacity: 10, isIndoor: false, amenities: ["Floodlights","Changing Rooms"],                             status: "Under Maintenance" },
      { id: "CRT-001-D", name: "Padel 1",     courtType: "Panoramic Glass",    sport: "Padel",      stations: [],             capacity: 4,  isIndoor: true,  amenities: ["Air Conditioning","Lighting","Ball Machine"],               status: "Available" },
      { id: "CRT-001-E", name: "Padel 2",     courtType: "Panoramic Glass",    sport: "Padel",      stations: [],             capacity: 4,  isIndoor: true,  amenities: ["Air Conditioning","Lighting"],                             status: "Available" },
      { id: "CRT-001-F", name: "Court 1",     courtType: "Full-Size Hardwood", sport: "Basketball", stations: [],             capacity: 10, isIndoor: true,  amenities: ["Air Conditioning","Scoreboard","Shot Clock","Bleachers"],    status: "Available" },
      { id: "CRT-001-G", name: "Pool — 25m",  courtType: "Competition Pool",   sport: "Swimming",   stations: ["Lane 1","Lane 2","Lane 3","Lane 4","Lane 5","Lane 6"], capacity: 12, isIndoor: true, amenities: ["Heated Pool","Changing Rooms","Showers","Timing System"], status: "Available" },
    ],
    availability: [
      buildSchedule("CRT-001-A", "Pitch A",    WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-001-B", "Pitch B",    WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-001-D", "Padel 1",    WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-001-F", "Court 1",    WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-001-G", "Pool — 25m", WEEK, ["06:00–07:30","07:30–09:00","09:00–10:30","10:30–12:00","16:00–17:30","17:30–19:00","19:00–20:30"], [false,false,true,true,true,true,true]),
    ],
    pricing: [
      { courtId: "CRT-001-A", courtName: "Pitch A",    slotDuration: 60, peakPrice: 280, offPeakPrice: 180, weekendPrice: 320, currency: "AED", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 30, cancellationHours: 24 },
      { courtId: "CRT-001-B", courtName: "Pitch B",    slotDuration: 60, peakPrice: 280, offPeakPrice: 180, weekendPrice: 320, currency: "AED", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 30, cancellationHours: 24 },
      { courtId: "CRT-001-D", courtName: "Padel 1",    slotDuration: 60, peakPrice: 120, offPeakPrice: 80,  weekendPrice: 140, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 14, cancellationHours: 12 },
      { courtId: "CRT-001-F", courtName: "Court 1",    slotDuration: 60, peakPrice: 350, offPeakPrice: 220, weekendPrice: 400, currency: "AED", minBookingSlots: 1, maxBookingSlots: 4, advanceBookingDays: 30, cancellationHours: 24 },
      { courtId: "CRT-001-G", courtName: "Pool — 25m", slotDuration: 90, peakPrice: 180, offPeakPrice: 120, weekendPrice: 200, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 7,  cancellationHours: 12 },
    ],
    subscriptionPlans: [
      { id: "SPL-001-A", planName: "Football Monthly Unlimited", planType: "Unlimited",      duration: "Monthly",   sessionsIncluded: "Unlimited", price: 1800, currency: "AED", autoRenew: true,  activeSubscribers: 24, status: "Active" },
      { id: "SPL-001-B", planName: "Padel 10-Session Pack",      planType: "Fixed Sessions", duration: "Monthly",   sessionsIncluded: 10,          price: 900,  currency: "AED", autoRenew: false, activeSubscribers: 31, status: "Active" },
      { id: "SPL-001-C", planName: "Swim Quarterly",             planType: "Unlimited",      duration: "Quarterly", sessionsIncluded: "Unlimited", price: 2200, currency: "AED", autoRenew: true,  activeSubscribers: 8,  status: "Active" },
    ],
    exceptionDates: [
      { id: "EX-001-A", date: "2026-04-18", reason: "UAE National Holiday",     affectedCourts: "All Courts",    isFullDay: true,  playersNotified: true },
      { id: "EX-001-B", date: "2026-03-20", reason: "Pitch C Resurfacing",       affectedCourts: "Pitch C only",  isFullDay: false, blockedSlots: "All day", playersNotified: true },
      { id: "EX-001-C", date: "2026-05-02", reason: "Private Tournament — DIFC", affectedCourts: "Court 1",       isFullDay: false, blockedSlots: "08:00–18:00", playersNotified: true },
    ],
    cancellationPolicy: {
      policyName: "Champions Standard Policy",
      tiers: [
        { window: "More than 72 hours",  refundPercent: 100 },
        { window: "48–72 hours",          refundPercent: 75  },
        { window: "24–48 hours",          refundPercent: 50  },
        { window: "Less than 24 hours",   refundPercent: 0   },
      ],
      platformFeeRefundable: false,
    },
    media: [
      { id: "MED-001-A", type: "photo",       url: IMG_FOOTBALL_OUTDOOR,  caption: "Pitch A & B — Evening View",     isCover: true  },
      { id: "MED-001-B", type: "photo",       url: IMG_FOOTBALL_NIGHT,    caption: "Floodlit Pitch B — Night Game"                  },
      { id: "MED-001-C", type: "photo",       url: IMG_PADEL_COURT,       caption: "Padel Courts 1 & 2"                             },
      { id: "MED-001-D", type: "photo",       url: IMG_BASKETBALL,        caption: "Full-Size Basketball Court 1"                   },
      { id: "MED-001-E", type: "photo",       url: IMG_SWIMMING_POOL,     caption: "25m Competition Pool"                           },
      { id: "MED-001-F", type: "photo",       url: IMG_LOBBY,             caption: "Reception & Lobby"                              },
      { id: "MED-001-G", type: "video",       url: "https://www.youtube.com/embed/dQw4w9WgXcQ", caption: "Facility Tour Video"      },
      { id: "MED-001-H", type: "virtual-tour",url: "https://matterport.com/tour/example",      caption: "360° Virtual Tour"        },
      { id: "MED-001-I", type: "document",    url: "#",                   caption: "DTCM License 2026"                              },
    ],
    earnings: { grossRevenue: 489600, commission: 48960, commissionPct: 10, taxCollected: 24480, netProviderEarnings: 416160, currency: "AED", totalBookings: 1820, completedSessions: 1680, cancelledSessions: 140, refundTotal: 38400, avgOccupancyRate: 72 },
  },

  // ── FAC-00002: Gulf Tennis & Padel Complex ─────────────────
  {
    id: "FAC-00002",
    name: "Gulf Tennis & Padel Complex",
    facilityType: "Indoor",
    description: "A state-of-the-art tennis and padel complex in Jumeirah Lake Towers. Features 6 indoor tennis courts with professional-grade LED lighting and 4 air-conditioned padel courts. Home to the Gulf Tennis League and numerous corporate tournaments.",
    addressLine1: "Cluster N, Jumeirah Lake Towers",
    area: "JLT",
    city: "Dubai",
    country: "UAE",
    latitude: 25.0684,
    longitude: 55.1405,
    contactPhone: "+971 4 222 3344",
    contactEmail: "courts@gulftennis.ae",
    operatingHours: standardHours("07:00", "22:30"),
    status: "Active",
    promotionStatus: "Promoted",
    createdAt: "2025-08-15T09:00:00Z",
    updatedAt: "2026-01-20T14:00:00Z",
    provider: PROVIDERS[1],
    sports: [
      { sport: "Tennis", courtType: "Hard Court (Rebound Ace)", capacity: 4 },
      { sport: "Padel",  courtType: "Panoramic Glass Court",    capacity: 4 },
    ],
    courts: [
      { id: "CRT-002-A", name: "Tennis Court 1", courtType: "Hard Court",    sport: "Tennis", stations: [], capacity: 4,  isIndoor: true, amenities: ["LED Lighting","Air Conditioning","Seating Gallery","Ball Machine"], status: "Available" },
      { id: "CRT-002-B", name: "Tennis Court 2", courtType: "Hard Court",    sport: "Tennis", stations: [], capacity: 4,  isIndoor: true, amenities: ["LED Lighting","Air Conditioning","Ball Machine"],                   status: "Available" },
      { id: "CRT-002-C", name: "Tennis Court 3", courtType: "Hard Court",    sport: "Tennis", stations: [], capacity: 4,  isIndoor: true, amenities: ["LED Lighting","Air Conditioning"],                                  status: "Under Maintenance" },
      { id: "CRT-002-D", name: "Padel Court 1",  courtType: "Panoramic Glass", sport: "Padel", stations: [], capacity: 4, isIndoor: true, amenities: ["LED Lighting","Air Conditioning","Ball Machine","Video Recording"], status: "Available" },
      { id: "CRT-002-E", name: "Padel Court 2",  courtType: "Panoramic Glass", sport: "Padel", stations: [], capacity: 4, isIndoor: true, amenities: ["LED Lighting","Air Conditioning"],                                  status: "Available" },
    ],
    availability: [
      buildSchedule("CRT-002-A", "Tennis Court 1", WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-002-B", "Tennis Court 2", WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-002-D", "Padel Court 1",  WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-002-E", "Padel Court 2",  WEEK, SLOTS_60, PEAK_60),
    ],
    pricing: [
      { courtId: "CRT-002-A", courtName: "Tennis Court 1", slotDuration: 60, peakPrice: 160, offPeakPrice: 100, weekendPrice: 180, currency: "AED", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 21, cancellationHours: 24 },
      { courtId: "CRT-002-B", courtName: "Tennis Court 2", slotDuration: 60, peakPrice: 160, offPeakPrice: 100, weekendPrice: 180, currency: "AED", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 21, cancellationHours: 24 },
      { courtId: "CRT-002-D", courtName: "Padel Court 1",  slotDuration: 60, peakPrice: 130, offPeakPrice: 85,  weekendPrice: 150, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 14, cancellationHours: 12 },
      { courtId: "CRT-002-E", courtName: "Padel Court 2",  slotDuration: 60, peakPrice: 130, offPeakPrice: 85,  weekendPrice: 150, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 14, cancellationHours: 12 },
    ],
    subscriptionPlans: [
      { id: "SPL-002-A", planName: "Tennis Monthly 12 Sessions", planType: "Fixed Sessions", duration: "Monthly",   sessionsIncluded: 12, price: 1560, currency: "AED", autoRenew: true,  activeSubscribers: 18, status: "Active" },
      { id: "SPL-002-B", planName: "Padel Quarterly Unlimited",  planType: "Unlimited",      duration: "Quarterly", sessionsIncluded: "Unlimited", price: 3200, currency: "AED", autoRenew: true,  activeSubscribers: 7,  status: "Active" },
    ],
    exceptionDates: [
      { id: "EX-002-A", date: "2026-03-15", reason: "Gulf Tennis League — Finals Day", affectedCourts: "Tennis Courts 1 & 2", isFullDay: false, blockedSlots: "08:00–20:00", playersNotified: true },
    ],
    cancellationPolicy: defaultPolicy("Gulf Tennis & Padel Standard Policy"),
    media: [
      { id: "MED-002-A", type: "photo",    url: IMG_TENNIS_INDOOR, caption: "Indoor Tennis Court 1",       isCover: true },
      { id: "MED-002-B", type: "photo",    url: IMG_PADEL_COURT,   caption: "Padel Court 1 — Glass View"              },
      { id: "MED-002-C", type: "photo",    url: IMG_LOBBY,         caption: "Lobby & Pro Shop"                        },
      { id: "MED-002-D", type: "document", url: "#",               caption: "Dubai Sports Council Approval"           },
    ],
    earnings: { grossRevenue: 214800, commission: 21480, commissionPct: 10, taxCollected: 10740, netProviderEarnings: 182580, currency: "AED", totalBookings: 1432, completedSessions: 1380, cancelledSessions: 52, refundTotal: 8320, avgOccupancyRate: 68 },
  },

  // ── FAC-00003: FitZone Aquatic Centre ──────────────────────
  {
    id: "FAC-00003",
    name: "FitZone Aquatic & Wellness Centre",
    facilityType: "Indoor",
    description: "A specialist aquatic and wellness centre in Meydan featuring a 50m Olympic pool, a 25m warm-up pool, and a dedicated hydrotherapy pool. Hosts national swimming competitions and offers year-round lane bookings for clubs and individuals.",
    addressLine1: "Meydan Avenue, Block D",
    area: "Meydan",
    city: "Dubai",
    country: "UAE",
    latitude: 25.1536,
    longitude: 55.3089,
    contactPhone: "+971 4 333 4455",
    contactEmail: "swim@fitzone.ae",
    operatingHours: {
      Monday: hours("05:30","22:00"), Tuesday: hours("05:30","22:00"),
      Wednesday: hours("05:30","22:00"), Thursday: hours("05:30","22:00"),
      Friday: hours("13:00","22:00"), Saturday: hours("06:00","22:00"),
      Sunday: hours("06:00","22:00"),
    },
    status: "Active",
    promotionStatus: "Standard",
    createdAt: "2025-04-10T07:00:00Z",
    updatedAt: "2026-02-01T09:00:00Z",
    provider: PROVIDERS[1],
    sports: [
      { sport: "Swimming", courtType: "50m Olympic Pool",   capacity: 16 },
      { sport: "Swimming", courtType: "25m Training Pool",  capacity: 8  },
    ],
    courts: [
      { id: "CRT-003-A", name: "50m Olympic Pool",    courtType: "Competition Pool",  sport: "Swimming", stations: ["Lane 1","Lane 2","Lane 3","Lane 4","Lane 5","Lane 6","Lane 7","Lane 8"], capacity: 16, isIndoor: true, amenities: ["Heated Pool","Timing System","Changing Rooms","Spectator Seating","Scoreboard"], status: "Available" },
      { id: "CRT-003-B", name: "25m Training Pool",   courtType: "Training Pool",     sport: "Swimming", stations: ["Lane 1","Lane 2","Lane 3","Lane 4"],  capacity: 8,  isIndoor: true, amenities: ["Heated Pool","Changing Rooms","Kickboards & Equipment"],   status: "Available" },
      { id: "CRT-003-C", name: "Hydrotherapy Pool",   courtType: "Hydrotherapy",      sport: "Swimming", stations: [],                                     capacity: 4,  isIndoor: true, amenities: ["Heated Pool","Hydrotherapy Jets","Private Changing Room"], status: "Disabled" },
    ],
    availability: [
      buildSchedule("CRT-003-A", "50m Olympic Pool",  WEEK, ["05:30–07:00","07:00–08:30","08:30–10:00","10:00–11:30","11:30–13:00","16:00–17:30","17:30–19:00","19:00–20:30","20:30–22:00"], [false,false,true,true,false,true,true,true,false]),
      buildSchedule("CRT-003-B", "25m Training Pool", WEEK, ["06:00–07:00","07:00–08:00","08:00–09:00","09:00–10:00","10:00–11:00","16:00–17:00","17:00–18:00","18:00–19:00","19:00–20:00"], [false,false,false,true,true,true,true,true,false]),
    ],
    pricing: [
      { courtId: "CRT-003-A", courtName: "50m Olympic Pool",   slotDuration: 90, peakPrice: 220, offPeakPrice: 140, weekendPrice: 260, currency: "AED", minBookingSlots: 1, maxBookingSlots: 4, advanceBookingDays: 30, cancellationHours: 24 },
      { courtId: "CRT-003-B", courtName: "25m Training Pool",  slotDuration: 60, peakPrice: 150, offPeakPrice: 90,  weekendPrice: 170, currency: "AED", minBookingSlots: 1, maxBookingSlots: 4, advanceBookingDays: 14, cancellationHours: 12 },
    ],
    subscriptionPlans: [
      { id: "SPL-003-A", planName: "Monthly Lane Unlimited",    planType: "Unlimited",      duration: "Monthly",   sessionsIncluded: "Unlimited", price: 1200, currency: "AED", autoRenew: true,  activeSubscribers: 22, status: "Active" },
      { id: "SPL-003-B", planName: "Quarterly 30 Sessions",     planType: "Fixed Sessions", duration: "Quarterly", sessionsIncluded: 30,          price: 3200, currency: "AED", autoRenew: false, activeSubscribers: 9,  status: "Active" },
      { id: "SPL-003-C", planName: "Annual Unlimited",          planType: "Unlimited",      duration: "Annual",    sessionsIncluded: "Unlimited", price: 9800, currency: "AED", autoRenew: true,  activeSubscribers: 4,  status: "Active" },
    ],
    exceptionDates: [
      { id: "EX-003-A", date: "2026-04-05", reason: "UAE Schools Swimming Championships", affectedCourts: "50m Olympic Pool", isFullDay: true,  playersNotified: true  },
      { id: "EX-003-B", date: "2026-05-10", reason: "Maintenance — Filtration System",   affectedCourts: "All Pools",        isFullDay: true,  playersNotified: false },
    ],
    cancellationPolicy: { policyName: "FitZone Aquatic Policy", tiers: [{ window: "More than 24h", refundPercent: 100 }, { window: "12–24h", refundPercent: 50 }, { window: "Less than 12h", refundPercent: 0 }], platformFeeRefundable: false },
    media: [
      { id: "MED-003-A", type: "photo",   url: IMG_SWIMMING_POOL, caption: "50m Olympic Pool — Competition Setup", isCover: true },
      { id: "MED-003-B", type: "photo",   url: IMG_LOBBY,         caption: "Reception & Member Services"                       },
      { id: "MED-003-C", type: "document",url: "#",               caption: "FINA-Compliant Facility Certificate"                },
    ],
    earnings: { grossRevenue: 176400, commission: 17640, commissionPct: 10, taxCollected: 8820, netProviderEarnings: 149940, currency: "AED", totalBookings: 980, completedSessions: 920, cancelledSessions: 60, refundTotal: 9000, avgOccupancyRate: 63 },
  },

  // ── FAC-00004: Desert Padel Park ──────────────────────────
  {
    id: "FAC-00004",
    name: "Desert Padel Park",
    facilityType: "Outdoor",
    description: "Al Quoz's top destination for padel, with 6 outdoor panoramic courts and 2 indoor all-weather courts. Evening floodlighting allows play until midnight. Hosts the annual Dubai Padel Open qualifiers.",
    addressLine1: "Al Quoz Industrial Area 4, Street 8",
    area: "Al Quoz",
    city: "Dubai",
    country: "UAE",
    latitude: 25.1425,
    longitude: 55.2306,
    contactPhone: "+971 4 444 5566",
    contactEmail: "play@desertpadel.ae",
    operatingHours: {
      Monday: hours("06:00","00:00"), Tuesday: hours("06:00","00:00"),
      Wednesday: hours("06:00","00:00"), Thursday: hours("06:00","00:00"),
      Friday: hours("14:00","00:00"), Saturday: hours("06:00","00:00"),
      Sunday: hours("06:00","00:00"),
    },
    status: "Active",
    promotionStatus: "Standard",
    createdAt: "2025-09-20T10:00:00Z",
    updatedAt: "2026-02-12T08:00:00Z",
    provider: PROVIDERS[0],
    sports: [{ sport: "Padel", courtType: "Outdoor Panoramic", capacity: 4 }],
    courts: [
      { id: "CRT-004-A", name: "Court 1 — Outdoor", courtType: "Outdoor Panoramic", sport: "Padel", stations: [], capacity: 4, isIndoor: false, amenities: ["Floodlights","Seating Gallery"], status: "Available" },
      { id: "CRT-004-B", name: "Court 2 — Outdoor", courtType: "Outdoor Panoramic", sport: "Padel", stations: [], capacity: 4, isIndoor: false, amenities: ["Floodlights"],                   status: "Available" },
      { id: "CRT-004-C", name: "Court 3 — Indoor",  courtType: "Indoor Glass",      sport: "Padel", stations: [], capacity: 4, isIndoor: true,  amenities: ["Air Conditioning","LED Lighting","Ball Machine"], status: "Available" },
      { id: "CRT-004-D", name: "Court 4 — Indoor",  courtType: "Indoor Glass",      sport: "Padel", stations: [], capacity: 4, isIndoor: true,  amenities: ["Air Conditioning","LED Lighting"], status: "Under Maintenance" },
    ],
    availability: [
      buildSchedule("CRT-004-A", "Court 1 — Outdoor", WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-004-B", "Court 2 — Outdoor", WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-004-C", "Court 3 — Indoor",  WEEK, SLOTS_60, PEAK_60),
    ],
    pricing: [
      { courtId: "CRT-004-A", courtName: "Court 1 — Outdoor", slotDuration: 60, peakPrice: 110, offPeakPrice: 70, weekendPrice: 130, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 14, cancellationHours: 12 },
      { courtId: "CRT-004-B", courtName: "Court 2 — Outdoor", slotDuration: 60, peakPrice: 110, offPeakPrice: 70, weekendPrice: 130, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 14, cancellationHours: 12 },
      { courtId: "CRT-004-C", courtName: "Court 3 — Indoor",  slotDuration: 60, peakPrice: 140, offPeakPrice: 90, weekendPrice: 160, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 14, cancellationHours: 12 },
    ],
    subscriptionPlans: [],
    exceptionDates: [],
    cancellationPolicy: defaultPolicy("Desert Padel Cancellation Policy"),
    media: [
      { id: "MED-004-A", type: "photo", url: IMG_PADEL_COURT,    caption: "Outdoor Courts at Dusk",       isCover: true },
      { id: "MED-004-B", type: "photo", url: IMG_FOOTBALL_NIGHT, caption: "Evening Play Under Floodlights"              },
    ],
    earnings: { grossRevenue: 98400, commission: 9840, commissionPct: 10, taxCollected: 4920, netProviderEarnings: 83640, currency: "AED", totalBookings: 820, completedSessions: 790, cancelledSessions: 30, refundTotal: 3300, avgOccupancyRate: 78 },
  },

  // ── FAC-00005: Riyadh Sports Hub ──────────────────────────
  {
    id: "FAC-00005",
    name: "Riyadh Sports Hub — Al Olaya",
    facilityType: "Mixed",
    description: "Riyadh's largest multi-sport hub in Al Olaya district, featuring football pitches, squash courts, and an indoor basketball arena. Purpose-built for corporate leagues and weekend family sports.",
    addressLine1: "King Fahd Road, Al Olaya District",
    area: "Al Olaya",
    city: "Riyadh",
    country: "Saudi Arabia",
    latitude: 24.6877,
    longitude: 46.7219,
    contactPhone: "+966 11 567 8901",
    contactEmail: "booking@riyadhhub.sa",
    operatingHours: standardHours("08:00", "22:00"),
    status: "Active",
    promotionStatus: "Standard",
    createdAt: "2025-10-01T08:00:00Z",
    updatedAt: "2026-01-15T12:00:00Z",
    provider: PROVIDERS[3],
    sports: [
      { sport: "Football", courtType: "7-a-side Astroturf", capacity: 14 },
      { sport: "Squash",   courtType: "Glass-Back Court",   capacity: 2  },
      { sport: "Basketball", courtType: "Full-Size Court",  capacity: 10 },
    ],
    courts: [
      { id: "CRT-005-A", name: "Pitch 1", courtType: "7-a-side Astroturf", sport: "Football",   stations: [], capacity: 14, isIndoor: false, amenities: ["Floodlights","Changing Rooms","Electronic Scoreboard"], status: "Available" },
      { id: "CRT-005-B", name: "Pitch 2", courtType: "7-a-side Astroturf", sport: "Football",   stations: [], capacity: 14, isIndoor: false, amenities: ["Floodlights","Changing Rooms"],                         status: "Available" },
      { id: "CRT-005-C", name: "Squash 1",courtType: "Glass-Back Court",   sport: "Squash",     stations: [], capacity: 2,  isIndoor: true,  amenities: ["Air Conditioning","LED Lighting"],                     status: "Available" },
      { id: "CRT-005-D", name: "Squash 2",courtType: "Glass-Back Court",   sport: "Squash",     stations: [], capacity: 2,  isIndoor: true,  amenities: ["Air Conditioning","LED Lighting"],                     status: "Available" },
      { id: "CRT-005-E", name: "Arena 1", courtType: "Full-Size Court",    sport: "Basketball", stations: [], capacity: 10, isIndoor: true,  amenities: ["Air Conditioning","Scoreboard","Bleachers","PA System"], status: "Available" },
    ],
    availability: [
      buildSchedule("CRT-005-A", "Pitch 1",  WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-005-B", "Pitch 2",  WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-005-C", "Squash 1", WEEK, SLOTS_60, PEAK_60),
      buildSchedule("CRT-005-E", "Arena 1",  WEEK, SLOTS_60, PEAK_60),
    ],
    pricing: [
      { courtId: "CRT-005-A", courtName: "Pitch 1",  slotDuration: 60, peakPrice: 350, offPeakPrice: 220, weekendPrice: 400, currency: "SAR", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 30, cancellationHours: 24 },
      { courtId: "CRT-005-B", courtName: "Pitch 2",  slotDuration: 60, peakPrice: 350, offPeakPrice: 220, weekendPrice: 400, currency: "SAR", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 30, cancellationHours: 24 },
      { courtId: "CRT-005-C", courtName: "Squash 1", slotDuration: 60, peakPrice: 140, offPeakPrice: 90,  weekendPrice: 160, currency: "SAR", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 7,  cancellationHours: 12 },
      { courtId: "CRT-005-E", courtName: "Arena 1",  slotDuration: 60, peakPrice: 600, offPeakPrice: 380, weekendPrice: 700, currency: "SAR", minBookingSlots: 1, maxBookingSlots: 4, advanceBookingDays: 30, cancellationHours: 24 },
    ],
    subscriptionPlans: [
      { id: "SPL-005-A", planName: "Football League Monthly Pass", planType: "Unlimited",      duration: "Monthly",   sessionsIncluded: "Unlimited", price: 2400, currency: "SAR", autoRenew: true, activeSubscribers: 16, status: "Active" },
    ],
    exceptionDates: [
      { id: "EX-005-A", date: "2026-04-23", reason: "Saudi National Day Celebration", affectedCourts: "All Courts", isFullDay: true, playersNotified: true },
    ],
    cancellationPolicy: defaultPolicy("Riyadh Sports Hub Standard Policy"),
    media: [
      { id: "MED-005-A", type: "photo", url: IMG_FOOTBALL_OUTDOOR, caption: "Pitch 1 & 2 — Aerial View", isCover: true },
      { id: "MED-005-B", type: "photo", url: IMG_BASKETBALL,       caption: "Indoor Basketball Arena"                  },
      { id: "MED-005-C", type: "photo", url: IMG_BADMINTON,        caption: "Squash Courts Area"                       },
    ],
    earnings: { grossRevenue: 312000, commission: 31200, commissionPct: 10, taxCollected: 15600, netProviderEarnings: 265200, currency: "SAR", totalBookings: 1240, completedSessions: 1180, cancelledSessions: 60, refundTotal: 18000, avgOccupancyRate: 65 },
  },

  // ── FAC-00006: Sharjah Badminton Centre (Inactive) ─────────
  {
    id: "FAC-00006",
    name: "Al Qasba Badminton & Squash Centre",
    facilityType: "Indoor",
    description: "A dedicated racquet sports centre in Sharjah offering 8 BWF-standard badminton courts and 3 squash courts with glass back walls. Currently inactive due to facility ownership transfer.",
    addressLine1: "Al Qasba Canal, Zone 2",
    area: "Al Qasba",
    city: "Sharjah",
    country: "UAE",
    latitude: 25.3485,
    longitude: 55.3913,
    contactPhone: "+971 6 678 9012",
    contactEmail: "info@alqasbasports.ae",
    operatingHours: standardHours("07:00", "22:00"),
    status: "Inactive",
    promotionStatus: "Standard",
    createdAt: "2025-07-14T10:00:00Z",
    updatedAt: "2026-02-18T09:00:00Z",
    provider: PROVIDERS[4],
    sports: [
      { sport: "Badminton", courtType: "BWF Standard Court",  capacity: 4 },
      { sport: "Squash",    courtType: "Glass-Back Court",    capacity: 2 },
    ],
    courts: [
      { id: "CRT-006-A", name: "Badminton Court 1", courtType: "BWF Standard",  sport: "Badminton", stations: [], capacity: 4, isIndoor: true, amenities: ["LED Lighting","Air Conditioning"], status: "Disabled" },
      { id: "CRT-006-B", name: "Badminton Court 2", courtType: "BWF Standard",  sport: "Badminton", stations: [], capacity: 4, isIndoor: true, amenities: ["LED Lighting","Air Conditioning"], status: "Disabled" },
      { id: "CRT-006-C", name: "Squash Court 1",    courtType: "Glass-Back",    sport: "Squash",    stations: [], capacity: 2, isIndoor: true, amenities: ["Air Conditioning"],               status: "Disabled" },
    ],
    availability: [],
    pricing: [
      { courtId: "CRT-006-A", courtName: "Badminton Court 1", slotDuration: 60, peakPrice: 80, offPeakPrice: 50, weekendPrice: 90, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 7, cancellationHours: 12 },
      { courtId: "CRT-006-C", courtName: "Squash Court 1",    slotDuration: 60, peakPrice: 90, offPeakPrice: 60, weekendPrice: 100, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 7, cancellationHours: 12 },
    ],
    subscriptionPlans: [],
    exceptionDates: [],
    cancellationPolicy: defaultPolicy("Al Qasba Standard Policy"),
    media: [
      { id: "MED-006-A", type: "photo", url: IMG_BADMINTON, caption: "Badminton Hall — Courts 1–4", isCover: true },
    ],
    earnings: { grossRevenue: 38400, commission: 3840, commissionPct: 10, taxCollected: 1920, netProviderEarnings: 32640, currency: "AED", totalBookings: 480, completedSessions: 440, cancelledSessions: 40, refundTotal: 4000, avgOccupancyRate: 0 },
  },

  // ── FAC-00007–15: Compact entries for table variety ─────────

  { id: "FAC-00007", name: "Abu Dhabi Football Park",        facilityType: "Outdoor", description: "7-a-side astroturf pitches near Yas Island.",                  addressLine1: "Yas Island, Sector 4",   area: "Yas Island",    city: "Abu Dhabi",     country: "UAE",          latitude: 24.4886,  longitude: 54.6059, contactPhone: "+971 2 789 0123", contactEmail: "pitch@adfootball.ae",    operatingHours: standardHours("06:00","23:00"), status: "Active",   promotionStatus: "Standard",  createdAt: "2025-11-01T08:00:00Z", updatedAt: "2026-01-10T10:00:00Z", provider: PROVIDERS[2], sports: [{ sport: "Football", courtType: "7-a-side Astroturf", capacity: 14 }], courts: [{ id: "CRT-007-A", name: "Pitch 1", courtType: "7-a-side Astroturf", sport: "Football", stations: [], capacity: 14, isIndoor: false, amenities: ["Floodlights","Changing Rooms"], status: "Available" }, { id: "CRT-007-B", name: "Pitch 2", courtType: "7-a-side Astroturf", sport: "Football", stations: [], capacity: 14, isIndoor: false, amenities: ["Floodlights"], status: "Available" }], availability: [buildSchedule("CRT-007-A","Pitch 1",WEEK,SLOTS_60,PEAK_60)], pricing: [{ courtId: "CRT-007-A", courtName: "Pitch 1", slotDuration: 60, peakPrice: 320, offPeakPrice: 200, weekendPrice: 360, currency: "AED", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 30, cancellationHours: 24 }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("AD Football Park Policy"), media: [{ id: "MED-007-A", type: "photo", url: IMG_FOOTBALL_OUTDOOR, caption: "Pitch Overview", isCover: true }], earnings: { grossRevenue: 76800, commission: 7680, commissionPct: 10, taxCollected: 3840, netProviderEarnings: 65280, currency: "AED", totalBookings: 320, completedSessions: 304, cancelledSessions: 16, refundTotal: 3200, avgOccupancyRate: 58 } },

  { id: "FAC-00008", name: "Doha Cricket & Football Centre",  facilityType: "Mixed",   description: "Multi-sport venue in Doha with cricket nets and football pitches.", addressLine1: "Aspire Zone, Doha",     area: "Aspire Zone",   city: "Doha",          country: "Qatar",        latitude: 25.2641,  longitude: 51.4477, contactPhone: "+974 44 901 234", contactEmail: "play@dohacfc.qa",        operatingHours: standardHours("07:00","23:00"), status: "Active",   promotionStatus: "Promoted",  createdAt: "2025-10-15T09:00:00Z", updatedAt: "2026-02-05T11:00:00Z", provider: PROVIDERS[3], sports: [{ sport: "Cricket", courtType: "Cricket Net", capacity: 6 }, { sport: "Football", courtType: "5-a-side Pitch", capacity: 10 }], courts: [{ id: "CRT-008-A", name: "Net 1", courtType: "Cricket Net", sport: "Cricket", stations: [], capacity: 6, isIndoor: false, amenities: ["Floodlights","Bowling Machine"], status: "Available" }, { id: "CRT-008-B", name: "Pitch A", courtType: "5-a-side Astroturf", sport: "Football", stations: [], capacity: 10, isIndoor: false, amenities: ["Floodlights","Changing Rooms"], status: "Available" }], availability: [buildSchedule("CRT-008-A","Net 1",WEEK,SLOTS_60,PEAK_60)], pricing: [{ courtId: "CRT-008-A", courtName: "Net 1", slotDuration: 60, peakPrice: 180, offPeakPrice: 120, weekendPrice: 200, currency: "QAR", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 21, cancellationHours: 24 }], subscriptionPlans: [{ id: "SPL-008-A", planName: "Monthly Unlimited Cricket", planType: "Unlimited", duration: "Monthly", sessionsIncluded: "Unlimited", price: 900, currency: "QAR", autoRenew: true, activeSubscribers: 14, status: "Active" }], exceptionDates: [], cancellationPolicy: defaultPolicy("Doha CFC Policy"), media: [{ id: "MED-008-A", type: "photo", url: IMG_FOOTBALL_OUTDOOR, caption: "Football Pitch", isCover: true }], earnings: { grossRevenue: 108000, commission: 10800, commissionPct: 10, taxCollected: 5400, netProviderEarnings: 91800, currency: "QAR", totalBookings: 600, completedSessions: 572, cancelledSessions: 28, refundTotal: 5040, avgOccupancyRate: 70 } },

  { id: "FAC-00009", name: "Palm Volleyball Beach Club",      facilityType: "Outdoor", description: "Beach volleyball courts on Palm Jumeirah.",                       addressLine1: "Palm Jumeirah, West Crescent", area: "Palm Jumeirah", city: "Dubai",     country: "UAE",          latitude: 25.1124, longitude: 55.1391, contactPhone: "+971 4 555 6677", contactEmail: "beach@palmvolley.ae",   operatingHours: standardHours("06:00","21:00"), status: "Active",   promotionStatus: "Standard",  createdAt: "2025-12-01T10:00:00Z", updatedAt: "2026-02-20T08:00:00Z", provider: PROVIDERS[0], sports: [{ sport: "Volleyball", courtType: "Beach Court", capacity: 12 }], courts: [{ id: "CRT-009-A", name: "Beach Court 1", courtType: "Sand Court", sport: "Volleyball", stations: [], capacity: 12, isIndoor: false, amenities: ["Floodlights","Sunshade","Shower Station"], status: "Available" }, { id: "CRT-009-B", name: "Beach Court 2", courtType: "Sand Court", sport: "Volleyball", stations: [], capacity: 12, isIndoor: false, amenities: ["Floodlights"], status: "Available" }], availability: [buildSchedule("CRT-009-A","Beach Court 1",WEEK,SLOTS_60,PEAK_60)], pricing: [{ courtId: "CRT-009-A", courtName: "Beach Court 1", slotDuration: 60, peakPrice: 200, offPeakPrice: 130, weekendPrice: 240, currency: "AED", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 14, cancellationHours: 12 }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Palm Volley Policy"), media: [{ id: "MED-009-A", type: "photo", url: IMG_FOOTBALL_OUTDOOR, caption: "Beach Courts Aerial", isCover: true }], earnings: { grossRevenue: 43200, commission: 4320, commissionPct: 10, taxCollected: 2160, netProviderEarnings: 36720, currency: "AED", totalBookings: 216, completedSessions: 200, cancelledSessions: 16, refundTotal: 3200, avgOccupancyRate: 55 } },

  { id: "FAC-00010", name: "JBR Basketball & Fitness Hub",    facilityType: "Indoor",  description: "Indoor basketball and fitness facility at JBR Walk.",           addressLine1: "JBR Walk, Building 2", area: "JBR",           city: "Dubai",         country: "UAE",          latitude: 25.0784, longitude: 55.1321, contactPhone: "+971 4 666 7788", contactEmail: "info@jbrbball.ae",      operatingHours: standardHours("06:00","23:00"), status: "Active",   promotionStatus: "Standard",  createdAt: "2026-01-10T09:00:00Z", updatedAt: "2026-02-15T14:00:00Z", provider: PROVIDERS[1], sports: [{ sport: "Basketball", courtType: "Full-Size Hardwood", capacity: 10 }], courts: [{ id: "CRT-010-A", name: "Main Court",   courtType: "Full-Size Hardwood", sport: "Basketball", stations: [], capacity: 10, isIndoor: true, amenities: ["Air Conditioning","Scoreboard","LED Lighting","Video Wall"], status: "Available" }, { id: "CRT-010-B", name: "Practice Court", courtType: "Half Court",         sport: "Basketball", stations: [], capacity: 5,  isIndoor: true, amenities: ["Air Conditioning","LED Lighting"], status: "Available" }], availability: [buildSchedule("CRT-010-A","Main Court",WEEK,SLOTS_60,PEAK_60)], pricing: [{ courtId: "CRT-010-A", courtName: "Main Court", slotDuration: 60, peakPrice: 400, offPeakPrice: 250, weekendPrice: 450, currency: "AED", minBookingSlots: 1, maxBookingSlots: 4, advanceBookingDays: 30, cancellationHours: 24 }], subscriptionPlans: [{ id: "SPL-010-A", planName: "Monthly 10 Sessions", planType: "Fixed Sessions", duration: "Monthly", sessionsIncluded: 10, price: 2800, currency: "AED", autoRenew: false, activeSubscribers: 5, status: "Active" }], exceptionDates: [], cancellationPolicy: defaultPolicy("JBR Basketball Policy"), media: [{ id: "MED-010-A", type: "photo", url: IMG_BASKETBALL, caption: "Main Court", isCover: true }], earnings: { grossRevenue: 52000, commission: 5200, commissionPct: 10, taxCollected: 2600, netProviderEarnings: 44200, currency: "AED", totalBookings: 130, completedSessions: 122, cancelledSessions: 8, refundTotal: 3200, avgOccupancyRate: 48 } },

  { id: "FAC-00011", name: "Muscat Tennis Club",              facilityType: "Outdoor", description: "Open-air tennis facility in Muscat with clay courts.",          addressLine1: "Al Khuwair District",  area: "Al Khuwair",    city: "Muscat",        country: "Oman",         latitude: 23.5957,  longitude: 58.3930, contactPhone: "+968 2234 5678", contactEmail: "play@muscattennis.om",  operatingHours: standardHours("06:00","21:00"), status: "Active",   promotionStatus: "Standard",  createdAt: "2025-09-05T09:00:00Z", updatedAt: "2026-01-20T11:00:00Z", provider: PROVIDERS[2], sports: [{ sport: "Tennis", courtType: "Clay Court", capacity: 4 }], courts: [{ id: "CRT-011-A", name: "Clay Court 1", courtType: "Clay Court", sport: "Tennis", stations: [], capacity: 4, isIndoor: false, amenities: ["Floodlights","Seating"], status: "Available" }, { id: "CRT-011-B", name: "Clay Court 2", courtType: "Clay Court", sport: "Tennis", stations: [], capacity: 4, isIndoor: false, amenities: ["Floodlights"], status: "Available" }], availability: [buildSchedule("CRT-011-A","Clay Court 1",WEEK,SLOTS_60,PEAK_60)], pricing: [{ courtId: "CRT-011-A", courtName: "Clay Court 1", slotDuration: 60, peakPrice: 25, offPeakPrice: 15, weekendPrice: 30, currency: "OMR", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 14, cancellationHours: 12 }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Muscat Tennis Policy"), media: [{ id: "MED-011-A", type: "photo", url: IMG_TENNIS_INDOOR, caption: "Clay Courts", isCover: true }], earnings: { grossRevenue: 14400, commission: 1440, commissionPct: 10, taxCollected: 720, netProviderEarnings: 12240, currency: "OMR", totalBookings: 480, completedSessions: 460, cancelledSessions: 20, refundTotal: 300, avgOccupancyRate: 60 } },

  { id: "FAC-00012", name: "Mirdif Padel & Squash Hub",       facilityType: "Indoor",  description: "Padel and squash courts in Mirdif City Centre area.",           addressLine1: "Mirdif City Centre Road", area: "Mirdif",      city: "Dubai",         country: "UAE",          latitude: 25.2215, longitude: 55.4115, contactPhone: "+971 4 777 8899", contactEmail: "book@mirdifhub.ae",     operatingHours: standardHours("07:00","23:00"), status: "Active",   promotionStatus: "Promoted",  createdAt: "2025-11-20T08:00:00Z", updatedAt: "2026-02-18T10:00:00Z", provider: PROVIDERS[0], sports: [{ sport: "Padel", courtType: "Indoor Glass", capacity: 4 }, { sport: "Squash", courtType: "Glass-Back", capacity: 2 }], courts: [{ id: "CRT-012-A", name: "Padel 1", courtType: "Indoor Glass", sport: "Padel", stations: [], capacity: 4, isIndoor: true, amenities: ["Air Conditioning","LED Lighting","Ball Machine"], status: "Available" }, { id: "CRT-012-B", name: "Squash 1", courtType: "Glass-Back", sport: "Squash", stations: [], capacity: 2, isIndoor: true, amenities: ["Air Conditioning","LED Lighting"], status: "Available" }], availability: [buildSchedule("CRT-012-A","Padel 1",WEEK,SLOTS_60,PEAK_60)], pricing: [{ courtId: "CRT-012-A", courtName: "Padel 1", slotDuration: 60, peakPrice: 120, offPeakPrice: 80, weekendPrice: 140, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 14, cancellationHours: 12 }], subscriptionPlans: [{ id: "SPL-012-A", planName: "Padel Monthly 8 Sessions", planType: "Fixed Sessions", duration: "Monthly", sessionsIncluded: 8, price: 720, currency: "AED", autoRenew: true, activeSubscribers: 20, status: "Active" }], exceptionDates: [], cancellationPolicy: defaultPolicy("Mirdif Hub Policy"), media: [{ id: "MED-012-A", type: "photo", url: IMG_PADEL_COURT, caption: "Padel Court 1", isCover: true }], earnings: { grossRevenue: 57600, commission: 5760, commissionPct: 10, taxCollected: 2880, netProviderEarnings: 48960, currency: "AED", totalBookings: 480, completedSessions: 460, cancelledSessions: 20, refundTotal: 2400, avgOccupancyRate: 67 } },

  { id: "FAC-00013", name: "DIFC Golf & Sports Club",         facilityType: "Mixed",   description: "Premium indoor sports club in DIFC with squash and fitness courts.", addressLine1: "DIFC, Gate Avenue",   area: "DIFC",          city: "Dubai",         country: "UAE",          latitude: 25.2158, longitude: 55.2816, contactPhone: "+971 4 888 9900", contactEmail: "concierge@difcsports.ae", operatingHours: standardHours("06:00","22:00"), status: "Active",   promotionStatus: "Promoted",  createdAt: "2026-01-05T09:00:00Z", updatedAt: "2026-02-22T10:00:00Z", provider: PROVIDERS[1], sports: [{ sport: "Squash", courtType: "ASF-Standard Court", capacity: 2 }], courts: [{ id: "CRT-013-A", name: "Squash Court 1", courtType: "ASF-Standard", sport: "Squash", stations: [], capacity: 2, isIndoor: true, amenities: ["Air Conditioning","Glass Viewing Wall","LED Lighting","Locker Rooms"], status: "Available" }, { id: "CRT-013-B", name: "Squash Court 2", courtType: "ASF-Standard", sport: "Squash", stations: [], capacity: 2, isIndoor: true, amenities: ["Air Conditioning","Glass Viewing Wall","LED Lighting"], status: "Under Maintenance" }], availability: [buildSchedule("CRT-013-A","Squash Court 1",WEEK,SLOTS_60,PEAK_60)], pricing: [{ courtId: "CRT-013-A", courtName: "Squash Court 1", slotDuration: 60, peakPrice: 280, offPeakPrice: 180, weekendPrice: 320, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 14, cancellationHours: 24 }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("DIFC Sports Policy"), media: [{ id: "MED-013-A", type: "photo", url: IMG_BADMINTON, caption: "Squash Court 1", isCover: true }], earnings: { grossRevenue: 33600, commission: 3360, commissionPct: 10, taxCollected: 1680, netProviderEarnings: 28560, currency: "AED", totalBookings: 120, completedSessions: 112, cancelledSessions: 8, refundTotal: 2240, avgOccupancyRate: 44 } },

  { id: "FAC-00014", name: "Jeddah Sports City Arena",        facilityType: "Mixed",   description: "Large multi-sport venue in Jeddah hosting football, basketball, and athletics.", addressLine1: "King Abdullah Sports City, Jeddah", area: "Al Hamra", city: "Jeddah",     country: "Saudi Arabia", latitude: 21.6037,  longitude: 39.1048, contactPhone: "+966 12 678 9012", contactEmail: "arena@jeddsport.sa",   operatingHours: standardHours("08:00","23:00"), status: "Inactive", promotionStatus: "Standard",  createdAt: "2025-08-20T08:00:00Z", updatedAt: "2026-02-19T15:00:00Z", provider: PROVIDERS[3], sports: [{ sport: "Football", courtType: "Full-Size Pitch", capacity: 22 }, { sport: "Basketball", courtType: "Indoor Court", capacity: 10 }], courts: [{ id: "CRT-014-A", name: "Main Pitch",      courtType: "Full-Size Grass",    sport: "Football",   stations: [], capacity: 22, isIndoor: false, amenities: ["Floodlights","VIP Seating","Changing Rooms","PA System"], status: "Disabled" }, { id: "CRT-014-B", name: "Indoor Arena",    courtType: "Full-Size Hardwood", sport: "Basketball", stations: [], capacity: 10, isIndoor: true, amenities: ["Air Conditioning","Scoreboard","Bleachers"],              status: "Disabled" }], availability: [], pricing: [{ courtId: "CRT-014-A", courtName: "Main Pitch", slotDuration: 60, peakPrice: 1800, offPeakPrice: 1200, weekendPrice: 2000, currency: "SAR", minBookingSlots: 1, maxBookingSlots: 3, advanceBookingDays: 30, cancellationHours: 48 }], subscriptionPlans: [], exceptionDates: [], cancellationPolicy: defaultPolicy("Jeddah Arena Policy"), media: [{ id: "MED-014-A", type: "photo", url: IMG_FOOTBALL_OUTDOOR, caption: "Main Pitch", isCover: true }], earnings: { grossRevenue: 126000, commission: 12600, commissionPct: 10, taxCollected: 6300, netProviderEarnings: 107100, currency: "SAR", totalBookings: 70, completedSessions: 65, cancelledSessions: 5, refundTotal: 9000, avgOccupancyRate: 0 } },

  { id: "FAC-00015", name: "Al Barsha Yoga & Wellness Studio", facilityType: "Indoor", description: "Boutique yoga, pilates, and wellness studio in Al Barsha with 2 studio rooms.", addressLine1: "Al Barsha 2, Community Mall", area: "Al Barsha 2", city: "Dubai",       country: "UAE",          latitude: 25.1090,  longitude: 55.2052, contactPhone: "+971 4 999 0011", contactEmail: "namaste@barshayoga.ae",  operatingHours: { Monday: hours("06:00","21:00"), Tuesday: hours("06:00","21:00"), Wednesday: hours("06:00","21:00"), Thursday: hours("06:00","21:00"), Friday: hours("08:00","20:00"), Saturday: hours("07:00","18:00"), Sunday: closed() }, status: "Active", promotionStatus: "Standard", createdAt: "2026-01-20T10:00:00Z", updatedAt: "2026-02-22T09:00:00Z", provider: PROVIDERS[1], sports: [{ sport: "Yoga", courtType: "Yoga Studio", capacity: 15 }], courts: [{ id: "CRT-015-A", name: "Studio A", courtType: "Yoga/Pilates Studio", sport: "Yoga", stations: [], capacity: 15, isIndoor: true, amenities: ["Air Conditioning","Mirrors","Sound System","Mats & Props","Changing Rooms"], status: "Available" }, { id: "CRT-015-B", name: "Studio B", courtType: "Pilates Reformer Studio", sport: "Yoga", stations: [], capacity: 8, isIndoor: true, amenities: ["Air Conditioning","Reformer Machines"], status: "Available" }], availability: [buildSchedule("CRT-015-A","Studio A",["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],["06:00–07:00","09:00–10:00","10:00–11:00","18:00–19:00","19:00–20:00","20:00–21:00"],[false,false,false,true,true,false])], pricing: [{ courtId: "CRT-015-A", courtName: "Studio A", slotDuration: 60, peakPrice: 90, offPeakPrice: 60, weekendPrice: 80, currency: "AED", minBookingSlots: 1, maxBookingSlots: 2, advanceBookingDays: 7, cancellationHours: 12 }], subscriptionPlans: [{ id: "SPL-015-A", planName: "Monthly 12 Classes", planType: "Fixed Sessions", duration: "Monthly", sessionsIncluded: 12, price: 720, currency: "AED", autoRenew: true, activeSubscribers: 35, status: "Active" }, { id: "SPL-015-B", planName: "Quarterly Unlimited", planType: "Unlimited", duration: "Quarterly", sessionsIncluded: "Unlimited", price: 1800, currency: "AED", autoRenew: true, activeSubscribers: 12, status: "Active" }], exceptionDates: [{ id: "EX-015-A", date: "2026-03-21", reason: "International Day of Yoga — Free Open Session", affectedCourts: "Studio A", isFullDay: false, blockedSlots: "08:00–10:00", playersNotified: true }], cancellationPolicy: { policyName: "Yoga Studio Policy", tiers: [{ window: "More than 24h", refundPercent: 100 }, { window: "Less than 24h", refundPercent: 0 }], platformFeeRefundable: false }, media: [{ id: "MED-015-A", type: "photo", url: IMG_LOBBY, caption: "Studio A", isCover: true }], earnings: { grossRevenue: 63000, commission: 6300, commissionPct: 10, taxCollected: 3150, netProviderEarnings: 53550, currency: "AED", totalBookings: 700, completedSessions: 672, cancelledSessions: 28, refundTotal: 2520, avgOccupancyRate: 74 } },
];

// ─── Facility rules per facility ────────────────────────────

const FACILITY_RULES: string[][] = [
  ["No outside food or beverages", "Appropriate sports footwear required", "Facility not responsible for lost items", "All equipment must be returned in good condition"],
  ["Proper sports attire required at all times", "No pets allowed", "Children under 12 must be accompanied by an adult", "Please respect court booking times"],
  ["Shower before entering the pool", "No diving in shallow areas", "Swimming caps required", "Lockers available at reception"],
  ["No glass containers on premises", "Smoking prohibited in all areas", "Management reserves right to refuse entry"],
  ["Booking cancellations must be made 24 hours in advance", "Equipment damage will be charged to the booking holder"],
];

// ─── Sample reviews ─────────────────────────────────────────

const SAMPLE_REVIEWS: FacilityReview[] = [
  { id: "FREV-001", reviewerName: "Ahmed Al-Rashid",   rating: 5, text: "Excellent facility with well-maintained courts. The staff is very helpful and the booking process is seamless.", date: "2026-02-20T10:00:00Z" },
  { id: "FREV-002", reviewerName: "Sarah Johnson",     rating: 4, text: "Great location and good amenities. Would recommend for regular training sessions. Changing rooms could be bigger.", date: "2026-02-18T14:00:00Z" },
  { id: "FREV-003", reviewerName: "Mohammed Al-Harbi",  rating: 5, text: "Best sports facility I have used. Premium quality courts and excellent customer service.", date: "2026-02-15T09:00:00Z" },
  { id: "FREV-004", reviewerName: "Emily Chen",         rating: 3, text: "Decent facility but gets very crowded during peak hours. Parking can be challenging on weekends.", date: "2026-02-10T16:00:00Z" },
  { id: "FREV-005", reviewerName: "Khalid Al-Suwaidi",  rating: 4, text: "Very professional setup with modern equipment. The air conditioning works well in the indoor courts.", date: "2026-02-05T11:00:00Z" },
];

// ─── Default audit trail ────────────────────────────────────

function defaultAudit(createdAt: string, name: string): FacilityAuditEntry[] {
  return [
    { id: "FAUD-001", timestamp: createdAt,                event: `Facility "${name}" created`, actor: "Provider" },
    { id: "FAUD-002", timestamp: createdAt,                event: "Status set to Active",       actor: "System" },
    { id: "FAUD-003", timestamp: "2026-02-15T11:30:00Z",  event: "Operating hours updated",    actor: "Provider" },
  ];
}

// ─── Transform raw data ─────────────────────────────────────

const RATINGS   = [4.8, 4.5, 4.2, 4.7, 3.9, 4.1, 4.6, 4.3, 4.4, 4.0, 3.8, 4.5, 4.1, 3.5, 4.2];
const REV_COUNT = [12, 8, 6, 10, 4, 7, 5, 9, 11, 3, 6, 8, 4, 2, 14];

function transformEarnings(raw: RawEarnings): FacilityEarnings {
  const grossPerSession = raw.totalBookings > 0
    ? Math.round((raw.grossRevenue / raw.totalBookings) * 100) / 100
    : 200;
  const commAmt    = Math.round(grossPerSession * raw.commissionPct / 100 * 100) / 100;
  const afterComm  = Math.round((grossPerSession - commAmt) * 100) / 100;
  const taxPct     = 5;
  const taxAmt     = Math.round(afterComm * taxPct / 100 * 100) / 100;
  const net        = Math.round((afterComm - taxAmt) * 100) / 100;
  const activeBookings = Math.round(raw.totalBookings * 0.15);
  return {
    ...raw,
    activeBookings,
    totalRevenue:     raw.grossRevenue,
    grossPerSession,
    commissionAmount: commAmt,
    afterCommission:  afterComm,
    taxPct,
    taxAmount:        taxAmt,
    netPayout:        net,
  };
}

export const MOCK_FACILITIES: Facility[] = RAW_FACILITIES.map((raw, i) => ({
  ...raw,
  earnings:      transformEarnings(raw.earnings),
  facilityRules: FACILITY_RULES[i % FACILITY_RULES.length],
  auditTrail:    defaultAudit(raw.createdAt, raw.name),
  averageRating: RATINGS[i % RATINGS.length],
  totalReviews:  REV_COUNT[i % REV_COUNT.length],
  reviews:       SAMPLE_REVIEWS.slice(0, Math.min(5, REV_COUNT[i % REV_COUNT.length])),
}));
