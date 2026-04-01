import { useState, useMemo, useEffect, useCallback } from "react";
import { ReviewTable } from "./ReviewTable";
import { Review } from "./types";
import {
  MessageSquare,
  EyeOff,
  Flag,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapReview = useCallback((r: Record<string, unknown>): Review => {
    const typeMap: Record<string, Review["target"]["type"]> = {
      facility: "Facility", training: "Training", coach: "Coach", tournament: "Tournament",
    };
    return {
      id: String(r.id || ""),
      reviewer: {
        id: String(r.reviewer_id || ""),
        name: String(r.reviewer_name || "Anonymous"),
        photo: "",
        email: "",
      },
      target: {
        id: String(r.entity_id || ""),
        name: String(r.entity_name || ""),
        type: typeMap[String(r.entity_type || "facility")] || "Facility",
      },
      rating: Number(r.rating || 0),
      text: String(r.review_text || ""),
      submittedAt: String(r.created_at || new Date().toISOString()),
      status: r.is_hidden ? "Hidden" : r.is_flagged ? "Flagged" : "Visible",
      flaggedReason: String(r.flag_reason || ""),
    };
  }, []);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.listReviews({ page: 1, limit: 100 });
      const list = res?.reviews || res?.data?.reviews || [];
      setReviews(Array.isArray(list) ? list.map(mapReview) : []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      toast.error("Failed to load reviews.");
    } finally {
      setIsLoading(false);
    }
  }, [mapReview]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleUpdate = async (reviewId: string, updates: Partial<Review>) => {
    try {
      const apiUpdates: Record<string, unknown> = {};
      if (updates.status === "Hidden") apiUpdates.action = "hide";
      else if (updates.status === "Published") apiUpdates.action = "unhide";
      if (Object.keys(apiUpdates).length > 0) {
        await adminService.updateReview(reviewId, apiUpdates);
      }
    } catch (err) {
      console.error("Review update API failed:", err);
    }
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
