// ─── SCR-ADM-033: Platform Settings — Types ─────────────────────────────────

export type PenaltyType = "fixed" | "percentage";
export type PayoutDurationType = "Days" | "Weeks" | "Months";
export type CancellationWindow = "12" | "24" | "48" | "72" | "120" | "168" | "240";

export interface PlatformSettings {
  // Section 1: Refresh Counts
  fpPromotedRefresh: number;
  fpStandardRefresh: number;
  tpPromotedRefresh: number;
  tpStandardRefresh: number;
  coachPromotedRefresh: number;
  coachStandardRefresh: number;

  // Section 2: Payout Configuration
  minPayoutAmount: number;
  payoutCycleDuration: number;
  payoutCycleDurationType: PayoutDurationType;

  // Section 3: Communication Settings
  adminProviderChat: boolean;
  offlineMessages: boolean;

  // Section 4: Provider Cancellation Policy
  cancellationWindow: CancellationWindow;
  penaltyValue: number;
  penaltyType: PenaltyType;

  // Section 5: General Configuration
  maxSubAdminsPerProvider: number;
}

// Legacy compat — keep old interface fields for CountryModuleManagement
export type CountryCode = 'SA' | 'AE' | 'QA' | 'BH' | 'KW' | 'OM';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
}

export type ModuleId = 'tournaments' | 'subscriptions' | 'coach-booking' | 'training-session' | 'training-course';

export interface Module {
  id: ModuleId;
  name: string;
}

export type CountryModuleSettings = Record<CountryCode, Record<ModuleId, boolean>>;
