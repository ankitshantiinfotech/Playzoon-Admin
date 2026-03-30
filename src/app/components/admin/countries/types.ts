// ─── SCR-ADM-044: Location Master Data — Types ──────────────────────────────

export interface City {
  id: string;
  countryId: string;
  nameEn: string;
  nameAr: string;
  code: string; // 2-5 uppercase alphanumeric
  isActive: boolean;
  facilitiesCount: number; // referenced facilities count (for delete blocking)
  addressesCount: number; // referenced user addresses count
  createdAt: string; // ISO date
}

export interface Country {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string; // ISO 3166-1 alpha-2
  isActive: boolean;
  cities: City[];
  createdAt: string; // ISO date
}

// Legacy compat — keep old interface fields for CountryConfigurationPage
export interface CountryModuleConfig {
  tournaments: boolean;
  facilities: boolean;
  trainings: boolean;
  coaches: boolean;
  wallet: boolean;
  chat: boolean;
}

export interface CountryCommissionConfig {
  tournaments: number;
  facilities: number;
  trainings: number;
  coaches: number;
}

export interface CountrySettings {
  currency: string;
  defaultCity: string;
  commissionRates: CountryCommissionConfig;
  taxRate: number;
}

export interface LegacyCountry {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  isActive: boolean;
  modules: CountryModuleConfig;
  settings: CountrySettings;
}
