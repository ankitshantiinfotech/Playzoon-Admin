export type MasterDataCategory =
  | "Sports"
  | "Court Types"
  | "Court Stations";

export interface MasterDataEntity {
  id: string;
  nameEn: string;
  nameAr: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  // Sports-specific
  icon?: string; // URL to sport icon
  // Court Types / Court Stations specific
  description?: string;
  // Common
  sortOrder?: number;
}

export const CATEGORIES: MasterDataCategory[] = [
  "Sports",
  "Court Types",
  "Court Stations"
];
