import { useState, useMemo } from "react";
import { ReviewTable } from "./ReviewTable";
import { MOCK_REVIEWS } from "./mockData";
import { Review } from "./types";
import {
  MessageSquare,
  EyeOff,
  Flag,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}

function StatCard({ label, value, icon, iconBg, valueColor = "text-gray-900" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
    </div>
  );
}

export function AdminReviewPage() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const handleUpdate = (reviewId: string, updates: Partial<Review>) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, ...updates } : r))
    );
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    const flagged = reviews.filter((r) => r.status === "Flagged").length;
    const hidden = reviews.filter((r) => r.status === "Hidden").length;
    return { total, flagged, hidden };
  }, [reviews]);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Reviews &amp; Ratings
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Moderate player reviews across all categories — hide flagged reviews or unflag provider disputes.
          </p>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Reviews"
          value={stats.total}
          icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Flagged"
          value={stats.flagged}
          icon={<Flag className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-50"
          valueColor="text-amber-600"
        />
        <StatCard
          label="Hidden"
          value={stats.hidden}
          icon={<EyeOff className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-50"
          valueColor="text-red-600"
        />
      </div>

      {/* ── Review Table ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <ReviewTable reviews={reviews} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}
