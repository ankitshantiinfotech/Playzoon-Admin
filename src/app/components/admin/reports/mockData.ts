// ─── US-101 Reports — Mock Data ───────────────────────────────────────────────
import {
  RevenueData, ProviderRevenue, BookingStatusData, BookingTypeData, FunnelStep,
  UserGrowthData, UserRoleData, EntityStats, TopEntity, PromotionTypeData, PayoutStatusData,
  TrendPoint, StackedTrendPoint,
  PlayerKPIs, PlayerChannelData, PlayerCityData,
  BookingKPIs, BookingTypeMetric, TopProvider, TopCity,
  PaymentKPIs, PaymentMethodData, FailureReasonData,
  EarningsKPIs, CommissionTypeData, PayoutStatusBreakdown,
} from "./types";

// ─── Deterministic pseudo-random helper ──────────────────────────────────────
const r = (seed: number, min: number, max: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.round(min + frac * (max - min));
};

// ─── Shared date label arrays ─────────────────────────────────────────────────
export const LABELS_7D  = ["Feb 15", "Feb 16", "Feb 17", "Feb 18", "Feb 19", "Feb 20", "Feb 21"];
export const LABELS_30D = [
  "Jan 23","Jan 24","Jan 25","Jan 26","Jan 27","Jan 28","Jan 29",
  "Jan 30","Jan 31","Feb 1","Feb 2","Feb 3","Feb 4","Feb 5",
  "Feb 6","Feb 7","Feb 8","Feb 9","Feb 10","Feb 11","Feb 12",
  "Feb 13","Feb 14","Feb 15","Feb 16","Feb 17","Feb 18","Feb 19",
  "Feb 20","Feb 21",
];
export const LABELS_3M  = ["Dec W1","Dec W2","Dec W3","Dec W4","Jan W1","Jan W2","Jan W3","Jan W4","Feb W1","Feb W2","Feb W3","Feb W4"];
export const LABELS_12M = ["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"];

// ─── PLAYER REPORT DATA ───────────────────────────────────────────────────────

export const PLAYER_KPIS: Record<string, PlayerKPIs> = {
  "7d":  { newRegistrations: 654,    activeTotal: 13_420, retentionRate: 67.8, churnRate: 12.1, newRegTrend: +3.2,  activeTrend: +1.8,  retentionTrend: -0.4, churnTrend: +0.3 },
  "30d": { newRegistrations: 2_847,  activeTotal: 14_250, retentionRate: 68.4, churnRate: 11.8, newRegTrend: +5.2,  activeTrend: +3.8,  retentionTrend: -0.8, churnTrend: +0.4 },
  "3m":  { newRegistrations: 8_642,  activeTotal: 14_250, retentionRate: 69.1, churnRate: 11.2, newRegTrend: +12.4, activeTrend: +9.6,  retentionTrend: +1.2, churnTrend: -1.1 },
  "12m": { newRegistrations: 31_840, activeTotal: 14_250, retentionRate: 71.6, churnRate: 9.8,  newRegTrend: +48.2, activeTrend: +61.4, retentionTrend: +5.4, churnTrend: -4.2 },
};
PLAYER_KPIS["custom"] = PLAYER_KPIS["30d"];

export const PLAYER_REGISTRATION_TREND: Record<string, TrendPoint[]> = {
  "7d":  LABELS_7D.map((label, i)  => ({ label, value: r(i + 1,   60, 130) })),
  "30d": LABELS_30D.map((label, i) => ({ label, value: r(i + 10,  72, 155) })),
  "3m":  LABELS_3M.map((label, i)  => ({ label, value: r(i + 40, 620, 820) })),
  "12m": LABELS_12M.map((label, i) => ({ label, value: r(i + 100, 2100, 3200) })),
};
PLAYER_REGISTRATION_TREND["custom"] = PLAYER_REGISTRATION_TREND["30d"];

export const PLAYER_CHANNELS: PlayerChannelData[] = [
  { channel: "Phone / OTP",    count: 5_840, pct: 44.6, color: "#003B95" },
  { channel: "Email",          count: 3_892, pct: 29.7, color: "#10B981" },
  { channel: "Google",         count: 2_187, pct: 16.7, color: "#F59E0B" },
  { channel: "Apple",          count: 908,   pct: 6.9,  color: "#6366F1" },
  { channel: "Facebook",       count: 423,   pct: 3.1,  color: "#EF4444" },
];

export const PLAYER_CITIES: PlayerCityData[] = [
  { city: "Dubai",       count: 4_284 },
  { city: "Abu Dhabi",   count: 2_841 },
  { city: "Sharjah",     count: 1_920 },
  { city: "Riyadh",      count: 1_482 },
  { city: "Jeddah",      count: 1_240 },
  { city: "Kuwait City", count: 984  },
  { city: "Muscat",      count: 762  },
  { city: "Doha",        count: 698  },
  { city: "Manama",      count: 532  },
  { city: "Cairo",       count: 507  },
];

// ─── BOOKING REPORT DATA ──────────────────────────────────────────────────────

export const BOOKING_KPIS: Record<string, BookingKPIs> = {
  "7d":  { totalBookings: 1_448,  cancellationRate: 6.8, avgBookingValue: 248, topType: "Facility", bookingsTrend: +4.2,  cancellationTrend: -0.3, avgValueTrend: +1.8 },
  "30d": { totalBookings: 6_300,  cancellationRate: 6.2, avgBookingValue: 254, topType: "Facility", bookingsTrend: +8.4,  cancellationTrend: -0.5, avgValueTrend: +2.1 },
  "3m":  { totalBookings: 19_840, cancellationRate: 5.9, avgBookingValue: 261, topType: "Facility", bookingsTrend: +22.8, cancellationTrend: -1.2, avgValueTrend: +4.8 },
  "12m": { totalBookings: 74_200, cancellationRate: 5.4, avgBookingValue: 272, topType: "Facility", bookingsTrend: +64.2, cancellationTrend: -2.4, avgValueTrend: +9.3 },
};
BOOKING_KPIS["custom"] = BOOKING_KPIS["30d"];

export const BOOKING_STACKED_TREND: Record<string, StackedTrendPoint[]> = {
  "7d": LABELS_7D.map((label, i) => ({
    label,
    facility: r(i + 50, 110, 165), training: r(i + 60, 65, 110),
    coach: r(i + 70, 28, 50),      tournament: r(i + 80, 15, 28),
  })),
  "30d": LABELS_30D.map((label, i) => ({
    label,
    facility: r(i + 100, 80, 140), training: r(i + 110, 45, 85),
    coach: r(i + 120, 18, 42),     tournament: r(i + 130, 8, 22),
  })),
  "3m": LABELS_3M.map((label, i) => ({
    label,
    facility: r(i + 200, 640, 920), training: r(i + 210, 380, 560),
    coach: r(i + 220, 155, 245),    tournament: r(i + 230, 72, 128),
  })),
  "12m": LABELS_12M.map((label, i) => ({
    label,
    facility: r(i + 300, 2400, 3600), training: r(i + 310, 1400, 2200),
    coach: r(i + 320, 580, 980),      tournament: r(i + 330, 240, 480),
  })),
};
BOOKING_STACKED_TREND["custom"] = BOOKING_STACKED_TREND["30d"];

export const BOOKING_TYPES_METRICS: BookingTypeMetric[] = [
  { type: "Facility",   count: 2_840, avgValue: 245, cancellationRate: 8.2, color: "#003B95", icon: "🏢" },
  { type: "Training",   count: 1_920, avgValue: 180, cancellationRate: 5.4, color: "#7C3AED", icon: "🏋️" },
  { type: "Coach",      count: 980,   avgValue: 320, cancellationRate: 6.1, color: "#D97706", icon: "👤" },
  { type: "Tournament", count: 560,   avgValue: 420, cancellationRate: 3.8, color: "#DC2626", icon: "🏆" },
];

export const TOP_PROVIDERS: TopProvider[] = [
  { rank: 1, name: "Al Ahly Sports Club",    type: "Facility",  bookings: 842, revenue: 206_290 },
  { rank: 2, name: "Smash Academy Dubai",    type: "Training",  bookings: 620, revenue: 111_600 },
  { rank: 3, name: "UAE Sports Complex",     type: "Facility",  bookings: 584, revenue: 143_080 },
  { rank: 4, name: "Pro Fitness Center",     type: "Training",  bookings: 497, revenue: 89_460  },
  { rank: 5, name: "Coach Khalid Al-Farsi",  type: "Coach",     bookings: 384, revenue: 122_880 },
  { rank: 6, name: "Elite Sports Academy",   type: "Training",  bookings: 342, revenue: 61_560  },
  { rank: 7, name: "Desert Sports Park",     type: "Facility",  bookings: 298, revenue: 73_010  },
  { rank: 8, name: "Coach Sara Mansouri",    type: "Coach",     bookings: 276, revenue: 88_320  },
];

export const TOP_BOOKING_CITIES: TopCity[] = [
  { rank: 1, city: "Dubai",       country: "UAE", bookings: 2_284, pct: 36.3 },
  { rank: 2, city: "Abu Dhabi",   country: "UAE", bookings: 1_120, pct: 17.8 },
  { rank: 3, city: "Riyadh",      country: "KSA", bookings: 842,   pct: 13.4 },
  { rank: 4, city: "Sharjah",     country: "UAE", bookings: 698,   pct: 11.1 },
  { rank: 5, city: "Jeddah",      country: "KSA", bookings: 524,   pct: 8.3  },
  { rank: 6, city: "Kuwait City", country: "KW",  bookings: 387,   pct: 6.1  },
  { rank: 7, city: "Doha",        country: "QA",  bookings: 284,   pct: 4.5  },
  { rank: 8, city: "Muscat",      country: "OM",  bookings: 161,   pct: 2.5  },
];

// ─── PAYMENT REPORT DATA ──────────────────────────────────────────────────────

export const PAYMENT_KPIS: Record<string, PaymentKPIs> = {
  "7d":  { grossRevenue: 423_400,   successfulCount: 1_342, successfulAmount: 423_400,   failedCount: 54,  failedAmount: 18_040, refundsCount: 29, refundsAmount: 9_840,  revenueTrend: +6.8  },
  "30d": { grossRevenue: 1_842_500, successfulCount: 5_842, successfulAmount: 1_842_500, failedCount: 234, failedAmount: 78_400, refundsCount: 127, refundsAmount: 42_800, revenueTrend: +11.2 },
  "3m":  { grossRevenue: 5_641_200, successfulCount: 17_892, successfulAmount: 5_641_200, failedCount: 698, failedAmount: 231_800, refundsCount: 384, refundsAmount: 128_400, revenueTrend: +24.8 },
  "12m": { grossRevenue: 21_482_000, successfulCount: 68_240, successfulAmount: 21_482_000, failedCount: 2_640, failedAmount: 872_400, refundsCount: 1_480, refundsAmount: 482_600, revenueTrend: +68.4 },
};
PAYMENT_KPIS["custom"] = PAYMENT_KPIS["30d"];

export const PAYMENT_REVENUE_TREND: Record<string, TrendPoint[]> = {
  "7d":  LABELS_7D.map((label, i)  => ({ label, value: r(i + 200, 42_000, 72_000) })),
  "30d": LABELS_30D.map((label, i) => ({ label, value: r(i + 300, 48_000, 82_000) })),
  "3m":  LABELS_3M.map((label, i)  => ({ label, value: r(i + 400, 380_000, 540_000) })),
  "12m": LABELS_12M.map((label, i) => ({ label, value: r(i + 500, 1_420_000, 2_100_000) })),
};
PAYMENT_REVENUE_TREND["custom"] = PAYMENT_REVENUE_TREND["30d"];

export const PAYMENT_METHODS: PaymentMethodData[] = [
  { method: "Credit / Debit Card", shortLabel: "Card",       count: 3_164, amount: 828_750,  pct: 45, color: "#003B95" },
  { method: "Platform Wallet",     shortLabel: "Wallet",     count: 1_967, amount: 515_900,  pct: 28, color: "#10B981" },
  { method: "Apple Pay",           shortLabel: "Apple Pay",  count: 1_266, amount: 331_650,  pct: 18, color: "#1C1C1E" },
  { method: "Google Pay",          shortLabel: "Google Pay", count: 633,   amount: 166_200,  pct: 9,  color: "#F59E0B" },
];

export const PAYMENT_FAILURE_REASONS: FailureReasonData[] = [
  { reason: "Insufficient Funds",          count: 98,  pct: 41.9 },
  { reason: "Card Declined",               count: 72,  pct: 30.8 },
  { reason: "3DS Authentication Failed",   count: 38,  pct: 16.2 },
  { reason: "Expired Card",               count: 26,  pct: 11.1 },
];

export const REFUND_TREND: Record<string, TrendPoint[]> = {
  "7d":  LABELS_7D.map((label, i)  => ({ label, value: r(i + 600, 800,   2_200)  })),
  "30d": LABELS_30D.map((label, i) => ({ label, value: r(i + 700, 900,   2_600)  })),
  "3m":  LABELS_3M.map((label, i)  => ({ label, value: r(i + 800, 8_000, 18_000) })),
  "12m": LABELS_12M.map((label, i) => ({ label, value: r(i + 900, 28_000, 58_000) })),
};
REFUND_TREND["custom"] = REFUND_TREND["30d"];

// ─── EARNINGS REPORT DATA ─────────────────────────────────────────────────────

export const EARNINGS_KPIS: Record<string, EarningsKPIs> = {
  "7d":  { totalCommission: 42_380,   payoutDisbursed: 348_200, payoutPending: 42_400, netEarnings: 38_140,   commissionTrend: +5.8,  payoutTrend: +4.2 },
  "30d": { totalCommission: 184_250,  payoutDisbursed: 1_520_000, payoutPending: 145_200, netEarnings: 164_800, commissionTrend: +9.8,  payoutTrend: +8.4 },
  "3m":  { totalCommission: 564_800,  payoutDisbursed: 4_642_000, payoutPending: 145_200, netEarnings: 498_400, commissionTrend: +22.4, payoutTrend: +19.8 },
  "12m": { totalCommission: 2_148_200, payoutDisbursed: 17_642_000, payoutPending: 145_200, netEarnings: 1_842_600, commissionTrend: +64.2, payoutTrend: +58.4 },
};
EARNINGS_KPIS["custom"] = EARNINGS_KPIS["30d"];

export const COMMISSION_TREND: Record<string, TrendPoint[]> = {
  "7d":  LABELS_7D.map((label, i)  => ({ label, value: r(i + 1000, 4_800,   8_200)  })),
  "30d": LABELS_30D.map((label, i) => ({ label, value: r(i + 1100, 4_200,   8_800)  })),
  "3m":  LABELS_3M.map((label, i)  => ({ label, value: r(i + 1200, 38_000,  58_000) })),
  "12m": LABELS_12M.map((label, i) => ({ label, value: r(i + 1300, 142_000, 228_000) })),
};
COMMISSION_TREND["custom"] = COMMISSION_TREND["30d"];

export const COMMISSION_BY_TYPE: CommissionTypeData[] = [
  { type: "Facility",   commission: 84_500,  grossRevenue: 845_000,  rate: 10, color: "#003B95" },
  { type: "Training",   commission: 58_200,  grossRevenue: 485_000,  rate: 12, color: "#7C3AED" },
  { type: "Coach",      commission: 28_400,  grossRevenue: 189_333,  rate: 15, color: "#D97706" },
  { type: "Tournament", commission: 13_150,  grossRevenue: 164_375,  rate: 8,  color: "#DC2626" },
];

export const PAYOUT_STATUS_BREAKDOWN: PayoutStatusBreakdown[] = [
  { status: "Completed",      amount: 1_285_000, pct: 84.5, color: "#10B981" },
  { status: "Processing",     amount: 145_200,   pct: 9.5,  color: "#3B82F6" },
  { status: "Pending Review", amount: 65_800,    pct: 4.3,  color: "#F59E0B" },
  { status: "Failed",         amount: 24_000,    pct: 1.7,  color: "#EF4444" },
];

// ─── Legacy exports (for old section files) ───────────────────────────────────
export const revenueData: RevenueData[] = [
  { date: "Jan", revenue: 12000 }, { date: "Feb", revenue: 15000 }, { date: "Mar", revenue: 18000 },
  { date: "Apr", revenue: 22000 }, { date: "May", revenue: 25000 }, { date: "Jun", revenue: 28000 },
  { date: "Jul", revenue: 32000 }, { date: "Aug", revenue: 30000 }, { date: "Sep", revenue: 35000 },
  { date: "Oct", revenue: 38000 }, { date: "Nov", revenue: 42000 }, { date: "Dec", revenue: 45000 },
];
export const providerRevenue: ProviderRevenue[] = [
  { type: "Freelance", grossRevenue: 45000, commission: 4500, tax: 2250, netPayout: 38250 },
  { type: "Academy",   grossRevenue: 125000, commission: 12500, tax: 6250, netPayout: 106250 },
  { type: "Club",      grossRevenue: 85000, commission: 8500, tax: 4250, netPayout: 72250 },
];
export const bookingStatus: BookingStatusData[] = [
  { status: "Confirmed", count: 850 }, { status: "Completed", count: 1200 }, { status: "Cancelled", count: 150 },
];
export const bookingTypes: BookingTypeData[] = [
  { type: "Facility", count: 1200 }, { type: "Training", count: 850 }, { type: "Coach", count: 450 }, { type: "Tournament", count: 250 },
];
export const bookingFunnel: FunnelStep[] = [
  { step: "Browse", count: 15000, dropOffRate: 0 }, { step: "Detail View", count: 8500, dropOffRate: 43 },
  { step: "Add to Cart", count: 4200, dropOffRate: 51 }, { step: "Checkout", count: 2800, dropOffRate: 33 },
  { step: "Confirmed", count: 2200, dropOffRate: 21 },
];
export const userGrowth: UserGrowthData[] = [
  { date: "Jan", signups: 120 }, { date: "Feb", signups: 150 }, { date: "Mar", signups: 180 },
  { date: "Apr", signups: 220 }, { date: "May", signups: 250 }, { date: "Jun", signups: 280 },
  { date: "Jul", signups: 320 }, { date: "Aug", signups: 300 }, { date: "Sep", signups: 350 },
  { date: "Oct", signups: 380 }, { date: "Nov", signups: 420 }, { date: "Dec", signups: 450 },
];
export const userRoles: UserRoleData[] = [
  { role: "Players", count: 12500 }, { role: "Freelancers", count: 450 },
  { role: "Trainers", count: 320 },  { role: "Clubs", count: 180 },
];
export const entityStats: EntityStats = {
  facilities: { active: 145, inactive: 12 }, trainings: { active: 85, inactive: 5 }, coaches: { verified: 220, unverified: 35 },
};
export const topBookings: TopEntity[] = [
  { id: "1", name: "Zamalek Field", provider: "Al Ahly Club", metric: 450 },
  { id: "2", name: "Tennis Court A", provider: "Smash Academy", metric: 320 },
  { id: "3", name: "Swimming Pool", provider: "Heliopolis Club", metric: 280 },
  { id: "4", name: "Main Stadium", provider: "Cairo Stadium", metric: 250 },
  { id: "5", name: "Basketball Court", provider: "Sporting Club", metric: 210 },
];
export const topRevenue: TopEntity[] = [
  { id: "1", name: "Zamalek Field", provider: "Al Ahly Club", metric: 125000 },
  { id: "2", name: "Main Stadium", provider: "Cairo Stadium", metric: 95000 },
  { id: "3", name: "VIP Lounge", provider: "Wadi Degla", metric: 82000 },
  { id: "4", name: "Tennis Complex", provider: "Smash Academy", metric: 75000 },
  { id: "5", name: "Olympic Pool", provider: "Gezira Club", metric: 68000 },
];
export const promotionTypes: PromotionTypeData[] = [
  { type: "Featured", revenue: 25000 }, { type: "Top Listed", revenue: 15000 }, { type: "Highlighted", revenue: 8000 },
];
export const payoutStatus: PayoutStatusData[] = [
  { status: "Paid", value: 85 }, { status: "Pending", value: 12 }, { status: "Failed", value: 3 },
];
export const refreshActivity = [
  { date: "Mon", count: 120 }, { date: "Tue", count: 145 }, { date: "Wed", count: 132 },
  { date: "Thu", count: 190 }, { date: "Fri", count: 250 }, { date: "Sat", count: 310 }, { date: "Sun", count: 280 },
];
