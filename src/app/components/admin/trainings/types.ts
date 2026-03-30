// ─── US-131: Admin Training Management ────────────────────────

export type TrainingStatus       = "Active" | "Inactive";
export type TrainingLevel        = "Beginner" | "Intermediate" | "Advanced" | "All Levels";
export type TrainingType         = "Full Course" | "Per Session" | "Subscription";
export type PromotionStatus      = "Standard" | "Promoted";
export type GenderRestriction    = "Male Only" | "Female Only" | "Mixed";
export type CoachStatus          = "Active" | "Inactive" | "Suspended";
export type BatchStatus          = "Open" | "Full" | "Completed" | "Cancelled";
export type PlanDuration         = "Monthly" | "Quarterly" | "Annual";
export type DiscountType         = "Percentage" | "Fixed Amount";
export type DiscountStatus       = "Active" | "Expired";
export type CoachVerification    = "Verified" | "Unverified";

// ─── Coaches ──────────────────────────────────────────────────

export interface AssignedCoach {
  id:               string;
  name:             string;
  email:            string;
  specialisation:   string;
  status:           CoachStatus;
  verification:     CoachVerification;
  assignedDate:     string; // ISO date
}

// ─── Facility ─────────────────────────────────────────────────

export interface TrainingFacility {
  id:               string;
  name:             string;
  providerName:     string;
  address:          string;
  city:             string;
  country:          string;
  courtAreaName:    string;
  status:           "Active" | "Inactive";
}

// ─── Availability & Pricing ───────────────────────────────────

export interface FullCourseBatch {
  id:           string;
  batchName:    string;
  startDate:    string;
  endDate:      string;
  daysOfWeek:   string[];       // ["Mon", "Wed", "Fri"]
  timeSlot:     string;          // "09:00 – 10:30"
  totalSessions:number;
  price:        number;
  currency:     string;
  enrolled:     number;
  maxCapacity:  number;
  status:       BatchStatus;
}

export interface PerSessionSlot {
  id:           string;
  day:          string;
  timeSlot:     string;
  durationMins: number;
  price:        number;
  currency:     string;
  availableSpots:number;
  recurrence:   "Weekly" | "One-time";
}

export interface SubscriptionPlan {
  id:               string;
  planName:         string;
  planDuration:     PlanDuration;
  sessionsPerWeek:  number;
  price:            number;
  currency:         string;
  autoRenew:        boolean;
  activeSubscribers:number;
  status:           "Active" | "Inactive";
}

// ─── Exception Dates ─────────────────────────────────────────

export interface ExceptionDate {
  id:                 string;
  date:               string;
  reason:             string;
  affectedSessions:   string;
  playersNotified:    boolean;
}

// ─── Cancellation Policy ──────────────────────────────────────

export interface CancellationTier {
  window:        string;   // e.g., "0–24 hours"
  refundPercent: number;
}

export interface TrainingCancellationPolicy {
  policyName:    string;
  applicableTo:  string;
  tiers:         CancellationTier[];
}

// ─── Discounts ────────────────────────────────────────────────

export interface TrainingDiscount {
  id:              string;
  name:            string;
  discountType:    DiscountType;
  value:           number;         // % or fixed SAR
  applicableTo:    string;
  validFrom:       string;
  validUntil:      string;
  minPlayers?:     number;
  status:          DiscountStatus;
}

// ─── Pricing Summary (for detail view) ──────────────────────

export interface FullCoursePricing {
  totalPrice:       number;
  numberOfSessions: number;
  pricePerSession:  number;
  currency:         string;
}

export interface PerSessionPricing {
  pricePerSession:  number;
  minSessions:      number;
  maxSessions:      number;
  currency:         string;
}

export interface SubscriptionPricing {
  monthlyPrice:     number;
  sessionsPerMonth: number;
  commitmentPeriod: string;
  currency:         string;
}

// ─── Earning Preview ─────────────────────────────────────────

export interface EarningPreview {
  grossPerSession:    number;
  commissionPct:      number;
  commissionAmount:   number;
  afterCommission:    number;
  taxPct:             number;
  taxAmount:          number;
  netPayout:          number;
  currency:           string;
  totalBookings:      number;
  activeBookings:     number;
}

// ─── Rating Breakdown ───────────────────────────────────────

export interface RatingBreakdown {
  fiveStars:   number;
  fourStars:   number;
  threeStars:  number;
  twoStars:    number;
  oneStar:     number;
}

// ─── Provider (summary) ───────────────────────────────────────

export interface TrainingProvider {
  id:       string;
  name:     string;
  type:     string;
  email:    string;
  phone:    string;
  country:  string;
}

// ─── Reviews ─────────────────────────────────────────────────

export interface TrainingReview {
  id:           string;
  reviewerName: string;
  rating:       number;
  text:         string;
  date:         string; // ISO
}

// ─── Audit Trail ─────────────────────────────────────────────

export interface TrainingAuditEntry {
  id:          string;
  timestamp:   string;  // ISO UTC
  event:       string;
  actor:       string;  // "System" | "Provider" | admin name
}

// ─── Main Training Record ─────────────────────────────────────

export interface Training {
  id:                  string;
  name:                string;
  sport:               string;
  level:               TrainingLevel;
  trainingType:        TrainingType;
  types:               TrainingType[];       // all offered types
  description:         string;
  minPlayers:          number;
  maxPlayers:          number;
  minAge?:             number;
  maxAge?:             number;
  genderRestriction:   GenderRestriction;
  skillLevelDesc:      string;
  durationMins:        number;    // per session duration
  startDate:           string;
  endDate?:            string;
  status:              TrainingStatus;
  promotionStatus:     PromotionStatus;
  createdAt:           string;
  updatedAt:           string;

  // Relations
  provider:            TrainingProvider;
  facility:            TrainingFacility;
  coaches:             AssignedCoach[];

  // Pricing summaries (for detail view)
  fullCoursePricing?:  FullCoursePricing;
  perSessionPricing?:  PerSessionPricing;
  subscriptionPricing?:SubscriptionPricing;

  // Availability & Pricing
  fullCourseBatches:   FullCourseBatch[];
  perSessionSlots:     PerSessionSlot[];
  subscriptionPlans:   SubscriptionPlan[];

  exceptionDates:      ExceptionDate[];
  cancellationPolicy:  TrainingCancellationPolicy;
  discounts:           TrainingDiscount[];
  earnings:            EarningPreview;

  // Reviews & Stats
  reviews:             TrainingReview[];
  averageRating:       number;
  ratingBreakdown:     RatingBreakdown;
  totalReviews:        number;

  // Audit trail
  auditTrail:          TrainingAuditEntry[];
}

// ─── Constants ────────────────────────────────────────────────

export const SPORTS_LIST = [
  "Football", "Tennis", "Swimming", "Padel", "Basketball",
  "Badminton", "Cricket", "Yoga", "Volleyball", "Squash",
];

export const TRAINING_LEVELS: TrainingLevel[] = [
  "Beginner", "Intermediate", "Advanced", "All Levels",
];

export const TRAINING_TYPES: TrainingType[] = [
  "Full Course", "Per Session", "Subscription",
];

export const PROMOTION_STATUSES: PromotionStatus[] = ["Standard", "Promoted"];

export const STATUS_OPTIONS: TrainingStatus[] = ["Active", "Inactive"];
