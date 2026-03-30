export type ReviewStatus = "Visible" | "Flagged" | "Hidden";
export type ReviewType = "Facility" | "Training" | "Coach" | "Tournament";

export const HIDE_REASON_CATEGORIES = [
  "Inappropriate Content",
  "Spam",
  "Fake Review",
  "Policy Violation",
  "Other",
] as const;

export type HideReasonCategory = (typeof HIDE_REASON_CATEGORIES)[number];

export interface Reviewer {
  id: string;
  name: string;
  photo: string;
  email: string;
}

export interface ReviewTarget {
  id: string;
  name: string;
  type: ReviewType;
}

export interface Review {
  id: string;
  reviewer: Reviewer;
  target: ReviewTarget;
  rating: number;
  text: string;
  submittedAt: string;
  status: ReviewStatus;
  flaggedByProvider?: string;
  flaggedReason?: string;
  hideReasonCategory?: HideReasonCategory;
  hideAdditionalNotes?: string;
  hiddenAt?: string;
  hiddenBy?: string;
}

export interface FlaggedPlayer {
  reviewer: Reviewer;
  flagCount: number;
}
