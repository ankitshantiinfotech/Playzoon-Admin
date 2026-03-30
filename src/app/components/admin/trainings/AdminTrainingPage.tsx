import { useState } from "react";
import { TrainingListPage }   from "./TrainingListPage";
import { TrainingDetailPage } from "./TrainingDetailPage";

// ─── US-132: Admin Training Listing Management ────────────────
// Internal state navigation: list ↔ detail (no extra route needed)

export function AdminTrainingPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return (
      <TrainingDetailPage
        trainingId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <TrainingListPage
      onViewDetail={(id) => setSelectedId(id)}
    />
  );
}
