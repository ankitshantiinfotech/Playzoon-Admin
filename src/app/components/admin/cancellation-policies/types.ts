// ─── US-100 Cancellation Policy Management — Types ───────────────────────────

export type BookingType = "Facility" | "Training" | "Coach";
export type PolicyStatus = "Active" | "Inactive" | "Draft";
export type TierComparison = "More than" | "Between" | "Less than";
export type TimeUnit = "hours" | "days";

// ─── Core domain types ────────────────────────────────────────────────────────

export interface PolicyTier {
  id: string;
  comparison: TierComparison;
  /** Primary time bound — the single value for "More than"/"Less than", the LOWER bound for "Between" */
  lowerValue: number;
  lowerUnit: TimeUnit;
  /** Only used when comparison === "Between" — the UPPER (farther) time bound */
  upperValue?: number;
  upperUnit?: TimeUnit;
  /** 0–100 */
  refundPercentage: number;
  /** BR-005: platform fee refunded separately */
  platformFeeRefundable: boolean;
}

export interface CancellationPolicy {
  id: string;
  name: string;
  /** A policy can apply to multiple booking types simultaneously */
  applicableTo: BookingType[];
  tiers: PolicyTier[];
  /** Flat fee charged on cancellation (optional) */
  cancellationFee: number;
  cancellationFeeCurrency: string;
  /** Whether this is the platform-wide default policy */
  isDefault: boolean;
  /** Number of active providers currently using this policy */
  assignedProviders: number;
  status: PolicyStatus;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
  createdBy: string;
  activatedAt?: string; // ISO — last time status became Active
}

// ─── Editor draft (extends tiers with string inputs for form validation) ──────

export interface TierDraft {
  id: string;
  comparison: TierComparison;
  lowerValue: string;
  lowerUnit: TimeUnit;
  upperValue: string;
  upperUnit: TimeUnit;
  refundPercentage: string;
  platformFeeRefundable: boolean;
}

export interface PolicyDraft {
  name: string;
  applicableTo: BookingType[];
  tiers: TierDraft[];
  cancellationFee: string;
  cancellationFeeCurrency: string;
  isDefault: boolean;
  saveAsActive: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface TierErrors {
  lowerValue?: string;
  upperValue?: string;
  refundPercentage?: string;
}

export interface PolicyFormErrors {
  name?: string;
  applicableTo?: string;
  tiers: TierErrors[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const BOOKING_TYPES: BookingType[] = ["Facility", "Training", "Coach"];

export function blankTierDraft(id: string): TierDraft {
  return {
    id,
    comparison: "More than",
    lowerValue: "",
    lowerUnit: "hours",
    upperValue: "",
    upperUnit: "hours",
    refundPercentage: "",
    platformFeeRefundable: false,
  };
}

export function blankPolicyDraft(): PolicyDraft {
  return {
    name: "",
    applicableTo: [],
    tiers: [blankTierDraft("new-1")],
    cancellationFee: "",
    cancellationFeeCurrency: "AED",
    isDefault: false,
    saveAsActive: false,
  };
}

/** Convert a PolicyTier to its plain-English time label */
export function tierTimeLabel(tier: PolicyTier): string {
  const f = (v: number, u: TimeUnit) => `${v} ${v === 1 ? u.slice(0, -1) : u}`;
  switch (tier.comparison) {
    case "More than": return `More than ${f(tier.lowerValue, tier.lowerUnit)}`;
    case "Less than": return `Less than ${f(tier.lowerValue, tier.lowerUnit)}`;
    case "Between":
      return `${f(tier.lowerValue, tier.lowerUnit)} – ${f(tier.upperValue!, tier.upperUnit ?? tier.lowerUnit)}`;
  }
}

/** Short label for card display */
export function tierTimeShortLabel(tier: PolicyTier): string {
  const f = (v: number, u: TimeUnit) => `${v}${u === "hours" ? "h" : "d"}`;
  switch (tier.comparison) {
    case "More than": return `>${f(tier.lowerValue, tier.lowerUnit)}`;
    case "Less than": return `<${f(tier.lowerValue, tier.lowerUnit)}`;
    case "Between":
      return `${f(tier.lowerValue, tier.lowerUnit)}–${f(tier.upperValue!, tier.upperUnit ?? tier.lowerUnit)}`;
  }
}

/** CSS class for a refund % level */
export function refundColorClass(pct: number): string {
  if (pct === 100) return "bg-emerald-500";
  if (pct >= 75)   return "bg-teal-400";
  if (pct >= 50)   return "bg-amber-400";
  if (pct >= 1)    return "bg-orange-400";
  return "bg-red-400";
}

export function refundTextClass(pct: number): string {
  if (pct === 100) return "text-emerald-600";
  if (pct >= 75)   return "text-teal-600";
  if (pct >= 50)   return "text-amber-600";
  if (pct >= 1)    return "text-orange-600";
  return "text-red-500";
}

export function refundBgClass(pct: number): string {
  if (pct === 100) return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (pct >= 75)   return "bg-teal-50 border-teal-200 text-teal-700";
  if (pct >= 50)   return "bg-amber-50 border-amber-200 text-amber-700";
  if (pct >= 1)    return "bg-orange-50 border-orange-200 text-orange-700";
  return "bg-red-50 border-red-200 text-red-600";
}

/** Convert draft tiers to persisted tiers */
export function draftTiersToTiers(drafts: TierDraft[]): PolicyTier[] {
  return drafts.map((d) => ({
    id: d.id,
    comparison: d.comparison,
    lowerValue: parseFloat(d.lowerValue) || 0,
    lowerUnit: d.lowerUnit,
    upperValue: d.comparison === "Between" ? parseFloat(d.upperValue) || 0 : undefined,
    upperUnit: d.comparison === "Between" ? d.upperUnit : undefined,
    refundPercentage: parseFloat(d.refundPercentage) ?? 0,
    platformFeeRefundable: d.platformFeeRefundable,
  }));
}

/** Convert persisted tiers to draft tiers for editing */
export function tiersToDraftTiers(tiers: PolicyTier[]): TierDraft[] {
  return tiers.map((t) => ({
    id: t.id,
    comparison: t.comparison,
    lowerValue: String(t.lowerValue),
    lowerUnit: t.lowerUnit,
    upperValue: t.upperValue != null ? String(t.upperValue) : "",
    upperUnit: t.upperUnit ?? "hours",
    refundPercentage: String(t.refundPercentage),
    platformFeeRefundable: t.platformFeeRefundable,
  }));
}

export function validatePolicyForm(draft: PolicyDraft): PolicyFormErrors {
  const errs: PolicyFormErrors = { tiers: draft.tiers.map(() => ({})) };

  if (draft.name.trim().length < 2) errs.name = "Policy name must be at least 2 characters.";
  else if (draft.name.trim().length > 60) errs.name = "Policy name must be 60 characters or fewer.";

  if (draft.applicableTo.length === 0) errs.applicableTo = "Select at least one booking type.";

  draft.tiers.forEach((tier, i) => {
    const tierErr: TierErrors = {};
    const lv = parseFloat(tier.lowerValue);
    if (isNaN(lv) || lv <= 0) tierErr.lowerValue = "Enter a valid positive number.";

    if (tier.comparison === "Between") {
      const uv = parseFloat(tier.upperValue);
      if (isNaN(uv) || uv <= 0) tierErr.upperValue = "Enter a valid positive number.";
      else {
        // Convert both to hours for comparison
        const lvH = lv * (tier.lowerUnit === "days" ? 24 : 1);
        const uvH = uv * (tier.upperUnit === "days" ? 24 : 1);
        if (uvH <= lvH) tierErr.upperValue = "Upper bound must be greater than lower bound.";
      }
    }

    const rp = parseFloat(tier.refundPercentage);
    if (isNaN(rp) || rp < 0 || rp > 100) tierErr.refundPercentage = "Enter a value between 0 and 100.";

    errs.tiers[i] = tierErr;
  });

  return errs;
}

export function hasErrors(errs: PolicyFormErrors): boolean {
  if (errs.name || errs.applicableTo) return true;
  return errs.tiers.some((t) => t.lowerValue || t.upperValue || t.refundPercentage);
}