export type ListingType = "Training" | "Facility";
export type ListingStatus = "Active" | "Inactive" | "Suspended" | "Removed";
export type SportType =
  | "Tennis" | "Padel" | "Badminton" | "Pickleball" | "Squash"
  | "Football" | "Basketball" | "Swimming" | "Yoga" | "Cricket" | "Boxing";

export interface ListingProvider {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface FutureBooking {
  id: string;
  playerName: string;
  date: string;         // ISO
  amount: number;
  refunded: boolean;
}

export interface ListingAuditEntry {
  id: string;
  action: "Created" | "Suspended" | "Unsuspended" | "Removed" | "Viewed";
  adminName: string;
  timestamp: string;
  reason?: string;
}

export interface Listing {
  id: string;
  type: ListingType;
  name: string;
  thumbnailUrl: string;
  provider: ListingProvider;
  sport: SportType;
  city: string;
  status: ListingStatus;

  // Counts
  activeBookingsCount: number;
  futureBookings: FutureBooking[];  // shown in detail; cancelled on Remove
  rating: number;
  reviewCount: number;
  description: string;

  // Training-specific
  level?: string;
  enrolledCount?: number;
  batchCount?: number;

  // Facility-specific
  facilityType?: "Indoor" | "Outdoor" | "Hybrid";
  courtsCount?: number;

  // Admin actions metadata
  suspendedReason?: string;
  suspendedAt?: string;
  removedReason?: string;
  removedAt?: string;

  auditLog: ListingAuditEntry[];
  createdAt: string;
}
