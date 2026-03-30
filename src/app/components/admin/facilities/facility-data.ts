// ─── Facility Listing Data (AC-FM-001…AC-FM-013) ───────────────
// Extends base Facility type with verification, published status, and rating
// without modifying the original types.ts or mockData.ts.

import type { Facility, FacilityStatus } from "./types";
import { MOCK_FACILITIES } from "./mockData";

export type VerificationStatus = "Verified" | "Unverified";
export type PublishedStatus    = "Published" | "Unpublished";

export interface FacilityRow extends Facility {
  verificationStatus: VerificationStatus;
  publishedStatus:    PublishedStatus;
  rating:             number;   // 0–5
}

// ─── Deterministic mock values ───────────────────────────────
const _V: VerificationStatus[] = [
  "Verified", "Verified", "Unverified", "Verified", "Unverified",
  "Verified", "Unverified", "Verified",
];
const _P: PublishedStatus[] = [
  "Published", "Published", "Published", "Unpublished", "Published",
  "Published", "Unpublished", "Published",
];
const _R = [4.8, 4.5, 4.2, 4.7, 3.9, 4.1, 4.6, 4.3];

export const MOCK_FACILITY_ROWS: FacilityRow[] = MOCK_FACILITIES.map((f, i) => ({
  ...f,
  verificationStatus: _V[i % _V.length],
  publishedStatus:    _P[i % _P.length],
  rating:             _R[i % _R.length],
}));

// ─── Derived filter option lists ─────────────────────────────
export const SPORT_OPTIONS   = [...new Set(MOCK_FACILITY_ROWS.flatMap(f => f.sports.map(s => s.sport)))].sort();
export const LOCATION_OPTIONS= [...new Set(MOCK_FACILITY_ROWS.map(f => f.city))].sort();
export const PROVIDER_OPTIONS= [...new Set(MOCK_FACILITY_ROWS.map(f => f.provider.name))].sort();

// ─── Bulk action types ───────────────────────────────────────
export type BulkAction =
  | "activate"
  | "deactivate"
  | "verify"
  | "unverify"
  | "publish"
  | "unpublish";

export const BULK_ACTION_META: Record<
  BulkAction,
  { title: string; verb: string; color: string }
> = {
  activate:   { title: "Activate Facilities",     verb: "activate",               color: "bg-emerald-600 hover:bg-emerald-700" },
  deactivate: { title: "Deactivate Facilities",   verb: "deactivate",             color: "bg-gray-600 hover:bg-gray-700" },
  verify:     { title: "Verify Facilities",        verb: "verify",                 color: "bg-blue-600 hover:bg-blue-700" },
  unverify:   { title: "Remove Verification",     verb: "remove verification for", color: "bg-amber-600 hover:bg-amber-700" },
  publish:    { title: "Publish Facilities",       verb: "publish",                color: "bg-emerald-600 hover:bg-emerald-700" },
  unpublish:  { title: "Unpublish Facilities",    verb: "unpublish",              color: "bg-gray-600 hover:bg-gray-700" },
};
