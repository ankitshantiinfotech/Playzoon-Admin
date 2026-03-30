import { useState, useCallback } from "react";
import { toast } from "sonner";
import { format, isBefore, startOfDay, addDays } from "date-fns";
import {
  Building2,
  CalendarClock,
  Save,
  ChevronDown,
  Info,
  Clock,
  Percent,
  CalendarDays,
  History,
  AlertCircle,
  CheckCircle2,
  Timer,
  UserCheck,
  BookOpen,
  Repeat,
  CreditCard,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Slider } from "../../ui/slider";
import { Badge } from "../../ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui/card";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";

// ─── Types ──────────────────────────────────────────────────

interface ActivePolicy {
  windowHours: number;
  chargePct: number;
  effectiveFrom: string; // ISO date
}

interface DraftPolicy {
  windowHours: string;
  chargePct: number;
  effectiveFrom: Date | undefined;
}

interface PolicyCardData {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  activePolicy: ActivePolicy;
  draft: DraftPolicy;
}

interface PolicyHistoryEntry {
  id: string;
  policyId: string;
  windowHours: number;
  chargePct: number;
  effectiveFrom: string;
  createdAt: string;
  createdBy: string;
  status: "active" | "expired" | "scheduled";
}

interface ValidationErrors {
  windowHours?: string;
  chargePct?: string;
  effectiveFrom?: string;
}

// ─── Mock Data ──────────────────────────────────────────────

const INITIAL_POLICIES: PolicyCardData[] = [
  {
    id: "fp",
    label: "Facility Provider",
    description:
      "Courts, pitches, pools and other bookable venues operated by facility owners.",
    icon: Building2,
    color: "#003B95",
    activePolicy: {
      windowHours: 24,
      chargePct: 15,
      effectiveFrom: "2025-09-01",
    },
    draft: { windowHours: "24", chargePct: 15, effectiveFrom: undefined },
  },
  {
    id: "tp-full-course",
    label: "Training Provider — Full Course",
    description:
      "Multi-session training courses purchased as a complete package.",
    icon: BookOpen,
    color: "#0F766E",
    activePolicy: {
      windowHours: 48,
      chargePct: 25,
      effectiveFrom: "2025-09-01",
    },
    draft: { windowHours: "48", chargePct: 25, effectiveFrom: undefined },
  },
  {
    id: "tp-per-session",
    label: "Training Provider — Per Session",
    description: "Individual training sessions booked one at a time.",
    icon: Repeat,
    color: "#7C3AED",
    activePolicy: {
      windowHours: 12,
      chargePct: 10,
      effectiveFrom: "2025-10-15",
    },
    draft: { windowHours: "12", chargePct: 10, effectiveFrom: undefined },
  },
  {
    id: "tp-subscription",
    label: "Training Provider — Subscription",
    description:
      "Recurring subscription-based training plans with monthly billing.",
    icon: CreditCard,
    color: "#B45309",
    activePolicy: {
      windowHours: 72,
      chargePct: 30,
      effectiveFrom: "2025-08-01",
    },
    draft: { windowHours: "72", chargePct: 30, effectiveFrom: undefined },
  },
  {
    id: "fc",
    label: "Freelance Coach",
    description:
      "Independent coaches offering personal or group training sessions.",
    icon: UserCheck,
    color: "#BE185D",
    activePolicy: {
      windowHours: 6,
      chargePct: 20,
      effectiveFrom: "2025-11-01",
    },
    draft: { windowHours: "6", chargePct: 20, effectiveFrom: undefined },
  },
];

const INITIAL_HISTORY: PolicyHistoryEntry[] = [
  {
    id: "h1",
    policyId: "fp",
    windowHours: 24,
    chargePct: 15,
    effectiveFrom: "2025-09-01",
    createdAt: "2025-08-20T10:30:00Z",
    createdBy: "Admin",
    status: "active",
  },
  {
    id: "h2",
    policyId: "fp",
    windowHours: 12,
    chargePct: 10,
    effectiveFrom: "2025-03-01",
    createdAt: "2025-02-15T14:00:00Z",
    createdBy: "Admin",
    status: "expired",
  },
  {
    id: "h3",
    policyId: "fp",
    windowHours: 8,
    chargePct: 5,
    effectiveFrom: "2024-06-01",
    createdAt: "2024-05-20T09:00:00Z",
    createdBy: "Super Admin",
    status: "expired",
  },
  {
    id: "h4",
    policyId: "tp-full-course",
    windowHours: 48,
    chargePct: 25,
    effectiveFrom: "2025-09-01",
    createdAt: "2025-08-25T11:00:00Z",
    createdBy: "Admin",
    status: "active",
  },
  {
    id: "h5",
    policyId: "tp-full-course",
    windowHours: 36,
    chargePct: 20,
    effectiveFrom: "2025-01-01",
    createdAt: "2024-12-18T16:00:00Z",
    createdBy: "Admin",
    status: "expired",
  },
  {
    id: "h6",
    policyId: "tp-per-session",
    windowHours: 12,
    chargePct: 10,
    effectiveFrom: "2025-10-15",
    createdAt: "2025-10-01T08:30:00Z",
    createdBy: "Admin",
    status: "active",
  },
  {
    id: "h7",
    policyId: "tp-subscription",
    windowHours: 72,
    chargePct: 30,
    effectiveFrom: "2025-08-01",
    createdAt: "2025-07-20T13:45:00Z",
    createdBy: "Super Admin",
    status: "active",
  },
  {
    id: "h8",
    policyId: "fc",
    windowHours: 6,
    chargePct: 20,
    effectiveFrom: "2025-11-01",
    createdAt: "2025-10-25T15:00:00Z",
    createdBy: "Admin",
    status: "active",
  },
  {
    id: "h9",
    policyId: "fc",
    windowHours: 4,
    chargePct: 15,
    effectiveFrom: "2025-05-01",
    createdAt: "2025-04-15T10:00:00Z",
    createdBy: "Admin",
    status: "expired",
  },
  {
    id: "h10",
    policyId: "fc",
    windowHours: 2,
    chargePct: 10,
    effectiveFrom: "2024-09-01",
    createdAt: "2024-08-20T12:00:00Z",
    createdBy: "Super Admin",
    status: "expired",
  },
];

// ─── Helper ─────────────────────────────────────────────────

function getPolicyLabel(id: string): string {
  const map: Record<string, string> = {
    fp: "Facility Provider",
    "tp-full-course": "Training — Full Course",
    "tp-per-session": "Training — Per Session",
    "tp-subscription": "Training — Subscription",
    fc: "Freelance Coach",
  };
  return map[id] || id;
}

// ─── Sub-Components ─────────────────────────────────────────

function ActivePolicyBanner({ policy }: { policy: ActivePolicy }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 border border-gray-200 p-3.5">
      <Info className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-1.5">Current Active Policy</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-500">Window:</span>{" "}
            <span className="text-gray-900">{policy.windowHours}h</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <Percent className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-500">Charge:</span>{" "}
            <span className="text-gray-900">{policy.chargePct}%</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-500">Since:</span>{" "}
            <span className="text-gray-900">
              {format(new Date(policy.effectiveFrom), "MMM d, yyyy")}
            </span>
          </span>
        </div>
      </div>
      <Badge
        variant="secondary"
        className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0"
      >
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    </div>
  );
}

function DatePickerField({
  value,
  onChange,
  error,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  error?: string;
}) {
  const tomorrow = addDays(startOfDay(new Date()), 1);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
        Effective From
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left h-9 px-3",
              !value && "text-muted-foreground",
              error && "border-red-400 ring-red-100 ring-2"
            )}
          >
            <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
            {value ? format(value, "MMM d, yyyy") : "Select future date..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={(date) => isBefore(date, tomorrow)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Policy Card ────────────────────────────────────────────

function PolicyCard({
  policy,
  errors,
  onDraftChange,
}: {
  policy: PolicyCardData;
  errors: ValidationErrors;
  onDraftChange: (id: string, draft: Partial<DraftPolicy>) => void;
}) {
  const Icon = policy.icon;
  const windowHoursNum = Number(policy.draft.windowHours);
  const hasWindowError = !!errors.windowHours;
  const hasChargeError = !!errors.chargePct;

  return (
    <Card className="overflow-hidden">
      {/* Color accent bar */}
      <div className="h-1" style={{ backgroundColor: policy.color }} />

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${policy.color}10` }}
          >
            <Icon className="h-5 w-5" style={{ color: policy.color }} />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{policy.label}</CardTitle>
            <CardDescription className="text-xs mt-0.5 line-clamp-1">
              {policy.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Active Policy Info */}
        <ActivePolicyBanner policy={policy.activePolicy} />

        {/* Draft Section */}
        <div className="space-y-4 pt-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Timer className="h-3 w-3" />
            New Policy (Scheduled)
          </p>

          {/* Cancellation Window */}
          <div className="space-y-2">
            <Label
              htmlFor={`window-${policy.id}`}
              className="flex items-center gap-1.5"
            >
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              Cancellation Window (hours)
            </Label>
            <div className="relative">
              <Input
                id={`window-${policy.id}`}
                type="number"
                min="0"
                step="1"
                value={policy.draft.windowHours}
                onChange={(e) =>
                  onDraftChange(policy.id, { windowHours: e.target.value })
                }
                className={cn(
                  "pr-12",
                  hasWindowError && "border-red-400 ring-red-100 ring-2"
                )}
                placeholder="e.g. 24"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                hrs
              </span>
            </div>
            {errors.windowHours && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.windowHours}
              </p>
            )}
          </div>

          {/* Cancellation Charge */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-gray-400" />
              Cancellation Charge
            </Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  value={[policy.draft.chargePct]}
                  onValueChange={([val]) =>
                    onDraftChange(policy.id, { chargePct: val })
                  }
                  min={0}
                  max={100}
                  step={1}
                  className="[&_[data-slot=slider-range]]:bg-[#003B95] [&_[data-slot=slider-thumb]]:border-[#003B95] [&_[data-slot=slider-track]]:h-2"
                />
              </div>
              <div className="relative w-20 shrink-0">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={policy.draft.chargePct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onDraftChange(policy.id, {
                      chargePct: Math.min(Math.max(val, 0), 100),
                    });
                  }}
                  className={cn(
                    "text-center pr-6",
                    hasChargeError && "border-red-400 ring-red-100 ring-2"
                  )}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  %
                </span>
              </div>
            </div>
            {/* Visual indicator */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 px-0.5">
              <span>0% (Full refund)</span>
              <span>100% (No refund)</span>
            </div>
            {errors.chargePct && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.chargePct}
              </p>
            )}
          </div>

          {/* Effective From */}
          <DatePickerField
            value={policy.draft.effectiveFrom}
            onChange={(date) =>
              onDraftChange(policy.id, { effectiveFrom: date })
            }
            error={errors.effectiveFrom}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Policy History Timeline ────────────────────────────────

function PolicyHistoryTimeline({
  history,
}: {
  history: PolicyHistoryEntry[];
}) {
  const sorted = [...history].sort(
    (a, b) =>
      new Date(b.effectiveFrom).getTime() -
      new Date(a.effectiveFrom).getTime()
  );

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-0">
        {sorted.map((entry, idx) => {
          const isActive = entry.status === "active";
          const isScheduled = entry.status === "scheduled";

          return (
            <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Dot */}
              <div className="relative z-10 flex shrink-0">
                <div
                  className={cn(
                    "w-[10px] h-[10px] rounded-full mt-1.5 ring-4 ring-white",
                    isActive
                      ? "bg-emerald-500"
                      : isScheduled
                        ? "bg-[#003B95]"
                        : "bg-gray-300"
                  )}
                  style={{ marginLeft: "15px" }}
                />
              </div>

              {/* Content */}
              <div
                className={cn(
                  "flex-1 rounded-lg border p-3.5 min-w-0",
                  isActive
                    ? "bg-emerald-50/50 border-emerald-200"
                    : isScheduled
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-900">
                      {getPolicyLabel(entry.policyId)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        isActive
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : isScheduled
                            ? "bg-blue-100 text-[#003B95] border-blue-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                      )}
                    >
                      {isActive
                        ? "Active"
                        : isScheduled
                          ? "Scheduled"
                          : "Expired"}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    Set on{" "}
                    {format(new Date(entry.createdAt), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                  <span className="text-gray-500">
                    Window:{" "}
                    <span className="text-gray-700">
                      {entry.windowHours}h
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Charge:{" "}
                    <span className="text-gray-700">
                      {entry.chargePct}%
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Effective:{" "}
                    <span className="text-gray-700">
                      {format(
                        new Date(entry.effectiveFrom),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </span>
                  <span className="text-gray-400">
                    by {entry.createdBy}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function CancellationPolicies() {
  const [policies, setPolicies] = useState<PolicyCardData[]>(INITIAL_POLICIES);
  const [history, setHistory] = useState<PolicyHistoryEntry[]>(INITIAL_HISTORY);
  const [errors, setErrors] = useState<Record<string, ValidationErrors>>({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  // ─── Draft Handlers ────────────────────────────────────

  const handleDraftChange = useCallback(
    (id: string, changes: Partial<DraftPolicy>) => {
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, draft: { ...p.draft, ...changes } } : p
        )
      );
      // Clear relevant errors on change
      setErrors((prev) => {
        const updated = { ...prev };
        if (updated[id]) {
          const policyErrors = { ...updated[id] };
          if ("windowHours" in changes) delete policyErrors.windowHours;
          if ("chargePct" in changes) delete policyErrors.chargePct;
          if ("effectiveFrom" in changes) delete policyErrors.effectiveFrom;
          updated[id] = policyErrors;
        }
        return updated;
      });
    },
    []
  );

  // ─── Validation & Save ─────────────────────────────────

  const validateAll = (): boolean => {
    const newErrors: Record<string, ValidationErrors> = {};
    let hasError = false;
    const tomorrow = startOfDay(addDays(new Date(), 1));

    policies.forEach((p) => {
      const pErrors: ValidationErrors = {};
      const windowNum = Number(p.draft.windowHours);

      if (p.draft.windowHours === "" || isNaN(windowNum)) {
        pErrors.windowHours = "Cancellation window is required";
        hasError = true;
      } else if (windowNum < 0) {
        pErrors.windowHours = "Invalid window";
        hasError = true;
      }

      if (p.draft.chargePct < 0) {
        pErrors.chargePct = "Cannot be negative";
        hasError = true;
      } else if (p.draft.chargePct > 100) {
        pErrors.chargePct = "Cannot exceed 100%";
        hasError = true;
      }

      if (!p.draft.effectiveFrom) {
        pErrors.effectiveFrom = "Effective date is required";
        hasError = true;
      } else if (isBefore(p.draft.effectiveFrom, tomorrow)) {
        pErrors.effectiveFrom = "Must be future date";
        hasError = true;
      }

      if (Object.keys(pErrors).length > 0) {
        newErrors[p.id] = pErrors;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleSave = () => {
    if (!validateAll()) {
      // Find first error type for toast message
      const allErrors = Object.values(errors).flatMap((e) =>
        Object.values(e)
      );
      const firstNewErrors: string[] = [];
      const tomorrow = startOfDay(addDays(new Date(), 1));

      policies.forEach((p) => {
        const windowNum = Number(p.draft.windowHours);
        if (p.draft.windowHours === "" || isNaN(windowNum)) {
          firstNewErrors.push("Cancellation window is required");
        } else if (windowNum < 0) {
          firstNewErrors.push("Invalid window");
        }
        if (p.draft.chargePct > 100) {
          firstNewErrors.push("Cannot exceed 100%");
        }
        if (!p.draft.effectiveFrom) {
          firstNewErrors.push("Effective date is required");
        } else if (isBefore(p.draft.effectiveFrom, tomorrow)) {
          firstNewErrors.push("Must be future date");
        }
      });

      toast.error(
        firstNewErrors[0] ||
          "Please fix the validation errors before saving."
      );
      return;
    }

    // Create new history entries and update active policies
    const newHistoryEntries: PolicyHistoryEntry[] = [];
    const now = new Date().toISOString();

    const updatedPolicies = policies.map((p) => {
      const newEntry: PolicyHistoryEntry = {
        id: `h${Date.now()}-${p.id}`,
        policyId: p.id,
        windowHours: Number(p.draft.windowHours),
        chargePct: p.draft.chargePct,
        effectiveFrom: p.draft.effectiveFrom
          ? format(p.draft.effectiveFrom, "yyyy-MM-dd")
          : "",
        createdAt: now,
        createdBy: "Admin",
        status: "scheduled",
      };
      newHistoryEntries.push(newEntry);

      return {
        ...p,
        draft: {
          windowHours: p.draft.windowHours,
          chargePct: p.draft.chargePct,
          effectiveFrom: undefined as Date | undefined,
        },
      };
    });

    setPolicies(updatedPolicies);
    setHistory((prev) => [...newHistoryEntries, ...prev]);
    setErrors({});
    toast.success("Cancellation policy updated");
  };

  // ─── Filtered History ──────────────────────────────────

  const filteredHistory =
    historyFilter === "all"
      ? history
      : history.filter((h) => h.policyId === historyFilter);

  // ─── Changed policies count ────────────────────────────

  const changedCount = policies.filter(
    (p) =>
      p.draft.effectiveFrom !== undefined ||
      Number(p.draft.windowHours) !== p.activePolicy.windowHours ||
      p.draft.chargePct !== p.activePolicy.chargePct
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Cancellation Policies
        </h2>
        <p className="text-muted-foreground">
          Configure cancellation windows and charge rules per provider type.
          Changes are time-versioned and apply only to future bookings.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
        <Info className="h-4 w-4 text-[#003B95] mt-0.5 shrink-0" />
        <div className="text-sm text-[#003B95]/80">
          <span className="text-[#003B95]">Time-versioned policies:</span>{" "}
          Policy changes require a future effective date and will never apply
          retroactively to existing bookings. The current active policy
          remains in effect until the new date arrives.
        </div>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {policies.map((policy) => (
          <PolicyCard
            key={policy.id}
            policy={policy}
            errors={errors[policy.id] || {}}
            onDraftChange={handleDraftChange}
          />
        ))}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-500">
          {changedCount > 0 ? (
            <span>
              <span className="text-[#003B95]">{changedCount}</span> policy{" "}
              {changedCount === 1 ? "card has" : "cards have"} pending
              changes
            </span>
          ) : (
            <span>Configure new policies above and click save</span>
          )}
        </div>
        <Button
          onClick={handleSave}
          className="bg-[#003B95] hover:bg-[#002a6b] gap-2"
          size="lg"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Policy History Collapsible */}
      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button className="w-full text-left">
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <History className="h-5 w-5 text-[#003B95]" />
                    <div>
                      <CardTitle className="text-base">
                        Policy History
                      </CardTitle>
                      <CardDescription className="mt-0.5">
                        View all past and scheduled policy changes across
                        provider types.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-600"
                    >
                      {history.length} entries
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-gray-400 transition-transform duration-200",
                        historyOpen && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </CardHeader>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Filter */}
              <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                {[
                  { id: "all", label: "All" },
                  { id: "fp", label: "Facility" },
                  { id: "tp-full-course", label: "Full Course" },
                  { id: "tp-per-session", label: "Per Session" },
                  { id: "tp-subscription", label: "Subscription" },
                  { id: "fc", label: "Freelance" },
                ].map((filter) => (
                  <Button
                    key={filter.id}
                    variant={
                      historyFilter === filter.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setHistoryFilter(filter.id)}
                    className={cn(
                      "h-7 text-xs",
                      historyFilter === filter.id &&
                        "bg-[#003B95] hover:bg-[#002a6b]"
                    )}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Timeline */}
              {filteredHistory.length > 0 ? (
                <PolicyHistoryTimeline history={filteredHistory} />
              ) : (
                <div className="text-center py-8 text-sm text-gray-400">
                  No history entries found for this filter.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}