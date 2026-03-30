import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronDown, ChevronRight, Clock, User, FileText,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Badge } from "../../../ui/badge";
import type { SubmissionEntry, FieldSnapshot } from "../provider-data";

// ─── Field Label Map ─────────────────────────────────────────

const FIELD_LABELS: Record<keyof FieldSnapshot, string> = {
  providerName: "Provider Name",
  businessName: "Business Name",
  email: "Email Address",
  mobile: "Mobile Number",
  city: "City",
  area: "Area",
  licenseNumber: "License Number",
  description: "Description",
  sportCategory: "Sport Category",
  website: "Website",
};

// ─── Snapshot Detail View ────────────────────────────────────

function SnapshotDetail({ snapshot }: { snapshot: FieldSnapshot }) {
  const fields = Object.entries(FIELD_LABELS) as [keyof FieldSnapshot, string][];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
      {fields.map(([key, label]) => {
        const value = snapshot[key];
        if (!value) return null;
        return (
          <div key={key} className="space-y-0.5">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">{label}</p>
            <p className={cn(
              "text-xs text-[#374151]",
              key === "description" && "sm:col-span-2"
            )}>
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Submission History Timeline (Admin View)
// ═══════════════════════════════════════════════════════════════

interface SubmissionHistoryProps {
  entries: SubmissionEntry[];
  resubmissionCount: number;
  providerName: string;
}

export function SubmissionHistory({
  entries,
  resubmissionCount,
  providerName,
}: SubmissionHistoryProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  const toggleEntry = (submissionNumber: number) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(submissionNumber)) {
        next.delete(submissionNumber);
      } else {
        next.add(submissionNumber);
      }
      return next;
    });
  };

  const statusConfig = {
    Pending: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      dotColor: "bg-amber-500",
      badgeCn: "bg-amber-100 text-amber-800 border-amber-200",
    },
    Approved: {
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      dotColor: "bg-emerald-500",
      badgeCn: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    Rejected: {
      icon: XCircle,
      iconColor: "text-red-500",
      dotColor: "bg-red-500",
      badgeCn: "bg-red-100 text-red-800 border-red-200",
    },
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-gray-50/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#003B95]" />
            <h2 className="text-sm text-[#111827]">Submission History</h2>
          </div>
          <div className="flex items-center gap-2">
            {resubmissionCount > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] gap-1">
                <RefreshCw className="h-2.5 w-2.5" />
                Re-submitted {resubmissionCount} {resubmissionCount === 1 ? "time" : "times"}
              </Badge>
            )}
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-[10px]">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-5">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-[#9CA3AF]">No submission history available</p>
          </div>
        ) : (
          <div className="space-y-0">
            {entries.map((entry, idx) => {
              const isLast = idx === entries.length - 1;
              const isExpanded = expandedEntries.has(entry.submissionNumber);
              const config = statusConfig[entry.status];
              const StatusIcon = config.icon;
              const isOriginal = entry.submissionNumber === 1;

              return (
                <div key={entry.submissionNumber} className="flex gap-4">
                  {/* Timeline column */}
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0",
                      config.dotColor,
                      idx === 0 && "ring-2 ring-offset-1 ring-gray-200"
                    )} />
                    {!isLast && (
                      <div className="w-px flex-1 bg-gray-200 min-h-[24px]" />
                    )}
                  </div>

                  {/* Entry content */}
                  <div className={cn("flex-1 pb-5", isLast && "pb-0")}>
                    {/* Clickable header */}
                    <button
                      onClick={() => toggleEntry(entry.submissionNumber)}
                      className="flex items-start gap-3 w-full text-left group hover:bg-gray-50/50 rounded-lg -ml-1 pl-1 pr-2 py-1 transition-colors"
                      aria-expanded={isExpanded}
                      aria-label={`Submission #${entry.submissionNumber} — ${entry.status}. Click to ${isExpanded ? "collapse" : "expand"} details.`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-[#111827]">
                            {isOriginal ? "Original Submission" : `Re-Submission #${entry.submissionNumber - 1}`}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px]", config.badgeCn)}>
                            <StatusIcon className={cn("h-2.5 w-2.5 mr-0.5", config.iconColor)} />
                            {entry.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(entry.submittedAt, "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                          <span className="text-xs text-[#D1D5DB]">&middot;</span>
                          <span className="text-xs text-[#9CA3AF]">
                            {formatDistanceToNow(entry.submittedAt, { addSuffix: true })}
                          </span>
                          {entry.reviewedBy && (
                            <>
                              <span className="text-xs text-[#D1D5DB]">&middot;</span>
                              <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.reviewedBy}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Rejection reason inline (always visible) */}
                        {entry.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded px-2.5 py-1.5 border border-red-100 inline-block">
                            Rejection reason: {entry.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Expand chevron */}
                      <div className="shrink-0 mt-0.5 text-gray-400 group-hover:text-gray-600 transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {/* Expandable snapshot */}
                    {isExpanded && (
                      <div className="mt-1 ml-0">
                        <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1 ml-1">
                          Field Snapshot at Submission
                        </p>
                        <SnapshotDetail snapshot={entry.fieldSnapshot} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
