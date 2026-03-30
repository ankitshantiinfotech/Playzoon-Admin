export interface CountryModules {
  countryId: string;
  countryName: string;
  countryCode: string;
  player: boolean;
  freelancerCoach: boolean;
  trainingProvider: boolean;
  facilityProvider: boolean;
  tournaments: boolean;
}

export type ModuleKey = "player" | "freelancerCoach" | "trainingProvider" | "facilityProvider" | "tournaments";

export const MODULE_LABELS: Record<ModuleKey, string> = {
  player: "Player",
  freelancerCoach: "Freelancer Coach",
  trainingProvider: "Training Provider",
  facilityProvider: "Facility Provider",
  tournaments: "Tournaments",
};

export interface AuditEntry {
  id: string;
  editedBy: string;
  country: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}
