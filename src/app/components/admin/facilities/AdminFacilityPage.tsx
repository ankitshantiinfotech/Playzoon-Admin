import { useState } from "react";
import { FacilityListPage }   from "./FacilityListPage";
import { FacilityDetailPage } from "./FacilityDetailPage";

// ─── US-133: Admin Facility Listing Management ────────────────
// Internal state navigation: list ↔ detail (no extra route needed)

export function AdminFacilityPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return (
      <FacilityDetailPage
        facilityId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <FacilityListPage
      onViewDetail={(id) => setSelectedId(id)}
    />
  );
}
