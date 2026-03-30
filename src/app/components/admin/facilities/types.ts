// ─── US-133: Admin Facility Listing Management ───────────────

export type FacilityStatus   = "Active" | "Inactive";
export type FacilityType     = "Indoor" | "Outdoor" | "Mixed";
export type CourtStatus      = "Available" | "Under Maintenance" | "Disabled";
export type PromotionStatus  = "Standard" | "Promoted";
export type PlanType         = "Unlimited" | "Fixed Sessions";
export type PlanDuration     = "Weekly" | "Monthly" | "Quarterly" | "Semi-Annual" | "Annual" | "Custom";
export type ProviderStatus   = "Active" | "Suspended" | "Inactive";
export type PricingModel     = "Per Session" | "Hourly" | "Peak/Off-Peak";
export type ExceptionReason  = "Holiday" | "Maintenance" | "Special Event" | "Other";
export type ExceptionType    = "Full Day" | "Partial Closure";
export type SlotStatus       = "available" | "blocked" | "booked";

// ─── Operating Hours ─────────────────────────────────────────

export interface DayHours {
  open:   string;   // "06:00"
  close:  string;   // "23:00"
  closed: boolean;
}

export type OperatingSchedule = Record<
  "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
  DayHours
>;

// ─── Provider ────────────────────────────────────────────────

export interface FacilityProvider {
  id:             string;
  name:           string;
  type:           "Facility Provider";
  email:          string;
  phone:          string;
  status:         ProviderStatus;
  personInCharge: string;
  picContact:     string;
  country:        string;
}

// ─── Sports Configuration ─────────────────────────────────────

export interface SportConfig {
  sport:      string;
  courtType:  string;   // e.g. "5-a-side Pitch", "Hard Court"
  capacity:   number;
}

// ─── Court / Area ─────────────────────────────────────────────

export interface Court {
  id:        string;
  name:      string;
  courtType: string;
  sport:     string;
  stations:  string[];      // e.g. ["Lane 1", "Lane 2"] for pool; empty for single-area courts
  capacity:  number;
  isIndoor:  boolean;
  amenities: string[];
  status:    CourtStatus;
}

// ─── Availability ─────────────────────────────────────────────

export interface DaySchedule {
  day:          string;     // "Monday"
  slots:        string[];   // ["06:00–07:00","07:00–08:00",...]
  slotDuration: number;     // mins
  isPeak:       boolean[];  // parallel array — whether each slot is peak
}

export interface CourtSchedule {
  courtId:   string;
  courtName: string;
  schedule:  DaySchedule[];
}

// ─── Pricing ─────────────────────────────────────────────────

export interface PricingRule {
  courtId:              string;
  courtName:            string;
  pricingModel?:        PricingModel;
  slotDuration:         number;     // mins
  basePrice?:           number;
  peakPrice:            number;
  offPeakPrice:         number;
  weekendPrice:         number;
  currency:             string;
  peakHoursStart?:      string;     // "09:00"
  peakHoursEnd?:        string;     // "12:00"
  minBookingSlots:      number;
  maxBookingSlots:      number;
  advanceBookingDays:   number;
  cancellationHours:    number;
}

// ─── Subscription Plans ───────────────────────────────────────

export interface FacilitySubscriptionPlan {
  id:               string;
  planName:         string;
  planType:         PlanType;
  duration:         PlanDuration;
  sessionsIncluded: number | "Unlimited";
  price:            number;
  currency:         string;
  autoRenew:        boolean;
  activeSubscribers:number;
  status:           "Active" | "Inactive";
}

// ─── Exception Dates ─────────────────────────────────────────

export interface FacilityException {
  id:              string;
  date:            string;
  reason:          string;
  affectedCourts:  string;    // "All Courts" or specific court names
  isFullDay:       boolean;
  type?:           ExceptionType;
  blockedSlots?:   string;    // if partial
  startTime?:      string;    // for partial closure
  endTime?:        string;    // for partial closure
  playersNotified: boolean;
}

// ─── Cancellation Policy ──────────────────────────────────────

export interface FacilityCancellationTier {
  window:        string;
  refundPercent: number;
}

export interface FacilityCancellationPolicy {
  policyName:            string;
  tiers:                 FacilityCancellationTier[];
  platformFeeRefundable: boolean;
}

// ─── Media ────────────────────────────────────────────────────

export type MediaType = "photo" | "video" | "virtual-tour" | "document";

export interface MediaFile {
  id:       string;
  type:     MediaType;
  url:      string;
  caption?: string;
  isCover?: boolean;
}

// ─── Earning Preview ─────────────────────────────────────────

export interface FacilityEarnings {
  grossRevenue:       number;
  commission:         number;
  commissionPct:      number;
  taxCollected:       number;
  netProviderEarnings:number;
  currency:           string;
  totalBookings:      number;
  activeBookings:     number;
  completedSessions:  number;
  cancelledSessions:  number;
  refundTotal:        number;
  avgOccupancyRate:   number;  // %
  totalRevenue:       number;
  // Per-session preview
  grossPerSession:    number;
  commissionAmount:   number;
  afterCommission:    number;
  taxPct:             number;
  taxAmount:          number;
  netPayout:          number;
}

// ─── Facility Rules ─────────────────────────────────────────

export interface FacilityRules {
  rules: string[];
}

// ─── Audit Trail ────────────────────────────────────────────

export interface FacilityAuditEntry {
  id:          string;
  timestamp:   string;
  event:       string;
  actor:       string;
}

// ─── Rating / Reviews ───────────────────────────────────────

export interface FacilityReview {
  id:           string;
  reviewerName: string;
  rating:       number;
  text:         string;
  date:         string;
}

// ─── Main Facility Record ─────────────────────────────────────

export interface Facility {
  id:               string;
  name:             string;
  facilityType:     FacilityType;
  description:      string;
  addressLine1:     string;
  addressLine2?:    string;
  area:             string;
  city:             string;
  country:          string;
  latitude:         number;
  longitude:        number;
  contactPhone:     string;
  contactEmail:     string;
  operatingHours:   OperatingSchedule;
  status:           FacilityStatus;
  promotionStatus:  PromotionStatus;
  createdAt:        string;
  updatedAt:        string;

  provider:         FacilityProvider;
  sports:           SportConfig[];
  courts:           Court[];
  availability:     CourtSchedule[];
  pricing:          PricingRule[];
  subscriptionPlans:FacilitySubscriptionPlan[];
  exceptionDates:   FacilityException[];
  cancellationPolicy:FacilityCancellationPolicy;
  media:            MediaFile[];
  earnings:         FacilityEarnings;
  facilityRules:    string[];
  auditTrail:       FacilityAuditEntry[];
  averageRating:    number;
  totalReviews:     number;
  reviews:          FacilityReview[];
}

// ─── Constants ────────────────────────────────────────────────

export const SPORTS_LIST = [
  "Football", "Tennis", "Padel", "Swimming", "Basketball",
  "Badminton", "Squash", "Cricket", "Volleyball", "Yoga",
];

export const CITIES_LIST = [
  "Dubai", "Abu Dhabi", "Sharjah", "Riyadh", "Doha", "Muscat",
];