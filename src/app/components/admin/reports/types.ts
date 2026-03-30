// ─── US-101 Reports — Extended Types ─────────────────────────────────────────

// ── Filter types ─────────────────────────────────────────────────────────────
export type DatePreset = "7d" | "30d" | "3m" | "12m" | "custom";
export type CountryCode = "all" | "uae" | "ksa" | "bh" | "kw" | "qa" | "om" | "eg";

export interface ReportFilters {
  preset: DatePreset;
  from: Date;
  to: Date;
  country: CountryCode;
}

export const COUNTRY_OPTIONS: { value: CountryCode; label: string }[] = [
  { value: "all", label: "All Countries" },
  { value: "uae", label: "UAE" },
  { value: "ksa", label: "Saudi Arabia" },
  { value: "bh",  label: "Bahrain" },
  { value: "kw",  label: "Kuwait" },
  { value: "qa",  label: "Qatar" },
  { value: "om",  label: "Oman" },
  { value: "eg",  label: "Egypt" },
];

export const DATE_PRESETS: { value: DatePreset; label: string; days: number }[] = [
  { value: "7d",     label: "Last 7 Days",    days: 7   },
  { value: "30d",    label: "Last 30 Days",   days: 30  },
  { value: "3m",     label: "Last 3 Months",  days: 90  },
  { value: "12m",    label: "Last 12 Months", days: 365 },
  { value: "custom", label: "Custom",         days: 0   },
];

// ── Shared chart primitives ───────────────────────────────────────────────────
export interface TrendPoint {
  label: string;
  value: number;
}

export interface StackedTrendPoint {
  label: string;
  facility: number;
  training: number;
  coach: number;
  tournament: number;
}

// ── Player Report ─────────────────────────────────────────────────────────────
export interface PlayerKPIs {
  newRegistrations: number;
  activeTotal: number;
  retentionRate: number;  // %
  churnRate: number;      // %
  newRegTrend: number;    // % vs prev period
  activeTrend: number;
  retentionTrend: number;
  churnTrend: number;
}

export interface PlayerChannelData {
  channel: string;
  count: number;
  pct: number;
  color: string;
}

export interface PlayerCityData {
  city: string;
  count: number;
}

// ── Booking Report ────────────────────────────────────────────────────────────
export interface BookingKPIs {
  totalBookings: number;
  cancellationRate: number;   // %
  avgBookingValue: number;    // AED
  topType: string;
  bookingsTrend: number;
  cancellationTrend: number;
  avgValueTrend: number;
}

export interface BookingTypeMetric {
  type: string;
  count: number;
  avgValue: number;
  cancellationRate: number;
  color: string;
  icon: string;
}

export interface TopProvider {
  rank: number;
  name: string;
  type: string;
  bookings: number;
  revenue: number;
}

export interface TopCity {
  rank: number;
  city: string;
  country: string;
  bookings: number;
  pct: number;
}

// ── Payment Report ────────────────────────────────────────────────────────────
export interface PaymentKPIs {
  grossRevenue: number;
  successfulCount: number;
  successfulAmount: number;
  failedCount: number;
  failedAmount: number;
  refundsCount: number;
  refundsAmount: number;
  revenueTrend: number;
}

export interface PaymentMethodData {
  method: string;
  shortLabel: string;
  count: number;
  amount: number;
  pct: number;
  color: string;
}

export interface FailureReasonData {
  reason: string;
  count: number;
  pct: number;
}

// ── Earnings Report ───────────────────────────────────────────────────────────
export interface EarningsKPIs {
  totalCommission: number;
  payoutDisbursed: number;
  payoutPending: number;
  netEarnings: number;
  commissionTrend: number;
  payoutTrend: number;
}

export interface CommissionTypeData {
  type: string;
  commission: number;
  grossRevenue: number;
  rate: number;
  color: string;
}

export interface PayoutStatusBreakdown {
  status: string;
  amount: number;
  pct: number;
  color: string;
}

// ── Legacy types (kept for backwards compatibility with old section files) ────
export type DateRange = "today" | "week" | "month" | "quarter" | "year" | "custom";

export interface DateFilter {
  range: DateRange;
  startDate: Date;
  endDate: Date;
}

export interface RevenueData { date: string; revenue: number; }
export interface ProviderRevenue { type: string; grossRevenue: number; commission: number; tax: number; netPayout: number; }
export interface BookingStatusData { status: string; count: number; }
export interface BookingTypeData { type: string; count: number; }
export interface FunnelStep { step: string; count: number; dropOffRate: number; }
export interface UserGrowthData { date: string; signups: number; }
export interface UserRoleData { role: string; count: number; }
export interface EntityStats { facilities: { active: number; inactive: number }; trainings: { active: number; inactive: number }; coaches: { verified: number; unverified: number }; }
export interface TopEntity { id: string; name: string; provider: string; metric: number; }
export interface PromotionTypeData { type: string; revenue: number; }
export interface PayoutStatusData { status: string; value: number; }
