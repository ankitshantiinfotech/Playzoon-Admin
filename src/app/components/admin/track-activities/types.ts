// ─── US-128: Track / Refresh Activities — Types ──────────────

// ─── Activity Log ─────────────────────────────────────────────

export type ActionCategory = "Admin Action" | "System Action" | "Security Event";
export type ActionStatus   = "Success" | "Failed";
export type ActorRole      = "Super Admin" | "Sub-Admin" | "System";

export interface ActivityLogActor {
  id:   string;
  name: string;
  role: ActorRole;
}

export interface ActivityLogEntry {
  id:           string;             // ACT-YYYYMMDD-NNN
  actionName:   string;             // e.g. "Provider Approved"
  category:     ActionCategory;
  actor:        ActivityLogActor;
  target:       string;             // affected entity label
  targetType:   string;             // Provider / Player / Listing / System / ...
  timestamp:    Date;
  ipAddress?:   string;             // BR-128-07: human actions only
  status:       ActionStatus;
  failureReason?: string;           // BR-128-03: expandable in detail
  metadata?:    Record<string, string>; // extra key/value context
}

// ─── Refresh Activities ───────────────────────────────────────

export type RefreshType    = "Search Index Re-index" | "CDN Cache Purge" | "Featured Content Refresh" | "Payment Reconciliation" | "DB Backup";
export type RefreshStatus  = "In Progress" | "Completed" | "Failed";
export type RefreshTrigger = "Manual" | "Scheduled";

export interface RefreshActivity {
  id:               string;         // REF-YYYYMMDD-NNN
  refreshType:      RefreshType;
  triggeredBy:      RefreshTrigger;
  triggeredByUser?: string;         // if Manual
  startTime:        Date;
  endTime?:         Date;           // absent if In Progress
  durationSeconds?: number;
  status:           RefreshStatus;
  affectedRecords?: number;         // e.g. index entries refreshed
  errorMessage?:    string;
}

// ─── Style maps ───────────────────────────────────────────────

export const CATEGORY_STYLES: Record<ActionCategory, { bg: string; text: string; border: string; dot: string }> = {
  "Admin Action":   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500"   },
  "System Action":  { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
  "Security Event": { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500"    },
};

export const STATUS_STYLES: Record<ActionStatus, { bg: string; text: string; border: string }> = {
  Success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Failed:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"     },
};

export const REFRESH_STATUS_STYLES: Record<RefreshStatus, { bg: string; text: string; border: string; dot: string }> = {
  "In Progress": { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400"    },
  Completed:     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  Failed:        { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
};

export const REFRESH_TYPE_CONFIG: Record<RefreshType, { icon: string; description: string; estimatedSeconds: number; color: string }> = {
  "Search Index Re-index":     { icon: "search",   description: "Re-index all searchable content into the search engine.",          estimatedSeconds: 45,  color: "text-blue-600 bg-blue-50"   },
  "CDN Cache Purge":           { icon: "globe",    description: "Purge all cached assets from the CDN edge nodes globally.",         estimatedSeconds: 8,   color: "text-emerald-600 bg-emerald-50" },
  "Featured Content Refresh":  { icon: "star",     description: "Re-fetch and re-rank featured listings for the home page.",         estimatedSeconds: 12,  color: "text-amber-600 bg-amber-50"  },
  "Payment Reconciliation":    { icon: "credit",   description: "Reconcile all pending transactions with the payment gateway.",      estimatedSeconds: 90,  color: "text-violet-600 bg-violet-50" },
  "DB Backup":                 { icon: "database", description: "Full incremental database backup to secure cold storage.",          estimatedSeconds: 180, color: "text-slate-600 bg-slate-100" },
};

export const ACTOR_ROLE_STYLES: Record<ActorRole, { bg: string; text: string; border: string }> = {
  "Super Admin": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Sub-Admin":   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
  System:        { bg: "bg-gray-100",  text: "text-gray-600",   border: "border-gray-200"   },
};

// ─── Rate limit constant ──────────────────────────────────────

/** BR-128-05: same refresh type can only be triggered once every 5 minutes */
export const RATE_LIMIT_MS = 5 * 60 * 1000;
