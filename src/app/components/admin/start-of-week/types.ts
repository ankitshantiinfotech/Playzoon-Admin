// ─── Start of Week Management — Types ────────────────────────────────────────

export type DayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface StartOfWeekEntry {
  id: string;
  country: string;
  countryCode: string;
  startOfWeek: DayOfWeek;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
