// ─── Cancellation Policy Management ───────────────────────────────────────────
// Admin configures tiered cancellation policies per booking type.
// BR-001: Exactly one Active policy per booking type at a time.
// BR-002: Activating a new policy auto-deactivates the previous one for that type.
// BR-003: Policy changes apply only to future bookings.
// BR-004: No active policy → 0% refund default (fully non-refundable).
// BR-005: Platform fee refundability is a separate toggle per tier.
// States: Loading skeleton · Error with retry · Empty

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ElementType,
} from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ShieldCheck,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Copy,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  Building2,
  GraduationCap,
  Users,
  GripVertical,
  ClipboardList,
  RefreshCw,
  Star,
  DollarSign,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Switch } from "../../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  BookingType,
  PolicyStatus,
  TierComparison,
  TimeUnit,
  CancellationPolicy,
  PolicyTier,
  TierDraft,
  PolicyDraft,
  PolicyFormErrors,
  BOOKING_TYPES,
  blankTierDraft,
  blankPolicyDraft,
  tierTimeLabel,
  tierTimeShortLabel,
  refundColorClass,
  refundTextClass,
  refundBgClass,
  draftTiersToTiers,
  tiersToDraftTiers,
  validatePolicyForm,
  hasErrors,
} from "./types";
import { MOCK_POLICIES } from "./mockData";

// ─── Config ───────────────────────────────────────────────────────────────────

const BOOKING_TYPE_CFG: Record<
  BookingType,
  { icon: ElementType; bg: string; text: string; border: string; label: string }
> = {
  Facility: {
    icon: Building2,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Facility",
  },
  Training: {
    icon: GraduationCap,
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    label: "Training",
  },
  Coach: {
    icon: Users,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Freelancer Coach",
  },
};

const STATUS_CFG: Record<
  PolicyStatus,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  Active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Active",
  },
  Inactive: {
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
    dot: "bg-gray-400",
    label: "Inactive",
  },
  Draft: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    label: "Draft",
  },
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fmtCurrency(amount: number, currency: string) {
  if (amount === 0) return "—";
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] gap-1.5 border shrink-0",
        cfg.bg,
        cfg.text,
        cfg.border,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </Badge>
  );
}

function BookingTypeBadge({ type }: { type: BookingType }) {
  const cfg = BOOKING_TYPE_CFG[type];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] gap-1 border", cfg.bg, cfg.text, cfg.border)}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </Badge>
  );
}

/** Horizontal tier bar visualization — shows refund levels as colour-coded bars */
function TierBar({ tiers }: { tiers: PolicyTier[] }) {
  return (
    <div className="space-y-1.5">
      {tiers.map((tier) => (
        <div key={tier.id} className="flex items-center gap-2">
          <div className="w-[88px] shrink-0">
            <span className="text-[10px] text-gray-400 tabular-nums">
              {tierTimeShortLabel(tier)}
            </span>
          </div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                refundColorClass(tier.refundPercentage),
              )}
              style={{
                width: `${Math.max(tier.refundPercentage, tier.refundPercentage === 0 ? 0 : 4)}%`,
              }}
            />
          </div>
          <span
            className={cn(
              "text-[11px] w-9 text-right tabular-nums shrink-0",
              refundTextClass(tier.refundPercentage),
            )}
          >
            {tier.refundPercentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

/** Coverage card for one booking type — shows active policy or BR-004 warning */
function CoverageCard({
  type,
  activePolicy,
  onClick,
}: {
  type: BookingType;
  activePolicy?: CancellationPolicy;
  onClick: () => void;
}) {
  const cfg = BOOKING_TYPE_CFG[type];
  const Icon = cfg.icon;
  const covered = !!activePolicy;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm",
        covered
          ? "bg-white border-gray-200 hover:border-[#003B95]/30"
          : "bg-amber-50/40 border-amber-200 hover:border-amber-300",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center h-10 w-9 rounded-lg shrink-0",
          cfg.bg,
        )}
      >
        <Icon className={cn("h-4 w-4", cfg.text)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-700">{cfg.label} Bookings</p>
        {covered ? (
          <>
            <p className="text-xs text-gray-900 truncate mt-0.5">
              {activePolicy!.name}
              {activePolicy!.isDefault && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                  <Star className="h-2.5 w-2.5" /> Default
                </span>
              )}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Active policy assigned
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] text-amber-600 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              No active policy — 0% refund (BR-004)
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Fully non-refundable by default
            </p>
          </>
        )}
      </div>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCoverageCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 animate-pulse"
        >
          <div className="h-10 w-9 rounded-lg bg-gray-200" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-36 bg-gray-100 rounded" />
            <div className="h-2.5 w-28 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonPolicyCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border rounded-xl p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-center gap-2">
            <div className="h-5 w-14 bg-gray-200 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="border-t pt-3 space-y-2">
            <div className="h-2 w-full bg-gray-100 rounded-full" />
            <div className="h-2 w-3/4 bg-gray-100 rounded-full" />
          </div>
          <div className="border-t pt-3 flex justify-between">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-7 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Policy Card ──────────────────────────────────────────────────────────────

function PolicyCard({
  policy,
  onEdit,
  onActivate,
  onDeactivate,
  onDuplicate,
  onDelete,
}: {
  policy: CancellationPolicy;
  onEdit: (p: CancellationPolicy) => void;
  onActivate: (p: CancellationPolicy) => void;
  onDeactivate: (p: CancellationPolicy) => void;
  onDuplicate: (p: CancellationPolicy) => void;
  onDelete: (p: CancellationPolicy) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = policy.status === "Active";
  const isDraft = policy.status === "Draft";
  const hasAssignments = policy.assignedProviders > 0;

  return (
    <div
      className={cn(
        "bg-white border rounded-xl p-5 flex flex-col gap-4 transition-all hover:shadow-sm",
        isActive && "border-emerald-200",
        isDraft && "border-blue-200 border-dashed",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <PolicyStatusBadge status={policy.status} />
            {policy.isDefault && (
              <Badge
                variant="outline"
                className="text-[11px] gap-1 border bg-amber-50 text-amber-700 border-amber-200"
              >
                <Star className="h-2.5 w-2.5" /> Default
              </Badge>
            )}
            {policy.applicableTo.map((t) => (
              <BookingTypeBadge key={t} type={t} />
            ))}
          </div>
          <p className="text-base text-gray-900 mt-2 leading-snug">
            {policy.name}
          </p>
          {policy.cancellationFee > 0 && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Cancellation fee:{" "}
              {fmtCurrency(
                policy.cancellationFee,
                policy.cancellationFeeCurrency,
              )}
            </p>
          )}
        </div>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-sm">
            <DropdownMenuItem
              onClick={() => {
                onEdit(policy);
                setMenuOpen(false);
              }}
              className="gap-2"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Policy
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onDuplicate(policy);
                setMenuOpen(false);
              }}
              className="gap-2"
            >
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!isActive ? (
              <DropdownMenuItem
                onClick={() => {
                  onActivate(policy);
                  setMenuOpen(false);
                }}
                className="gap-2 text-emerald-700 focus:bg-emerald-50"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Activate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => {
                  onDeactivate(policy);
                  setMenuOpen(false);
                }}
                className="gap-2 text-orange-700 focus:bg-orange-50"
              >
                <XCircle className="h-3.5 w-3.5" /> Deactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onDelete(policy);
                setMenuOpen(false);
              }}
              className="gap-2 text-red-600 focus:bg-red-50"
              disabled={isActive || hasAssignments}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isActive
                ? "Cannot delete active"
                : hasAssignments
                  ? "In use by providers"
                  : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tier Bar */}
      <div className="border-t pt-3">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
          {policy.tiers.length} tier{policy.tiers.length !== 1 ? "s" : ""} ·
          Refund timeline
        </p>
        <TierBar tiers={policy.tiers} />
      </div>

      {/* Platform fee info */}
      {policy.tiers.some((t) => t.platformFeeRefundable) && (
        <div className="flex items-center gap-1.5 text-[11px] text-violet-600">
          <ShieldCheck className="h-3 w-3 shrink-0" />
          Platform fee refundable on early cancellation (BR-005)
        </div>
      )}

      {/* Assigned providers info */}
      {hasAssignments && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Users className="h-3 w-3 shrink-0" />
          Assigned to {policy.assignedProviders} active provider
          {policy.assignedProviders !== 1 ? "s" : ""}
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[10px] text-gray-400 leading-tight">
          <p>Created by {policy.createdBy}</p>
          <p>{format(parseISO(policy.createdAt), "d MMM yyyy")}</p>
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1"
            onClick={() => onEdit(policy)}
          >
            <Edit2 className="h-3 w-3" /> Edit
          </Button>
          {!isActive && (
            <Button
              size="sm"
              className="h-7 px-2.5 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onActivate(policy)}
            >
              <CheckCircle className="h-3 w-3" /> Activate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tier Row (inside Policy Editor) ─────────────────────────────────────────

function TierRow({
  tier,
  index,
  total,
  errors,
  onChange,
  onRemove,
}: {
  tier: TierDraft;
  index: number;
  total: number;
  errors: {
    lowerValue?: string;
    upperValue?: string;
    refundPercentage?: string;
  };
  onChange: (updates: Partial<TierDraft>) => void;
  onRemove: () => void;
}) {
  const isBetween = tier.comparison === "Between";

  return (
    <div className="border rounded-xl p-4 space-y-3 bg-gray-50/40 relative group">
      {/* Tier header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-300" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            Tier {index + 1}
          </span>
          {tier.refundPercentage !== "" &&
            !isNaN(parseFloat(tier.refundPercentage)) && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] border ml-1",
                  refundBgClass(parseFloat(tier.refundPercentage)),
                )}
              >
                {parseFloat(tier.refundPercentage)}% refund
              </Badge>
            )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={total <= 1}
          className={cn(
            "p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors",
            total <= 1 && "opacity-30 cursor-not-allowed",
          )}
          title={total <= 1 ? "At least one tier is required" : "Remove tier"}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Time window */}
      <div className="space-y-1">
        <label className="text-xs text-gray-600">
          Cancellation window <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap items-start gap-2">
          {/* Comparison */}
          <Select
            value={tier.comparison}
            onValueChange={(v) =>
              onChange({
                comparison: v as TierComparison,
                upperValue: v !== "Between" ? "" : tier.upperValue,
              })
            }
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="More than">More than</SelectItem>
              <SelectItem value="Between">Between</SelectItem>
              <SelectItem value="Less than">Less than</SelectItem>
            </SelectContent>
          </Select>

          {/* Lower bound */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={tier.lowerValue}
                onChange={(e) => onChange({ lowerValue: e.target.value })}
                placeholder="e.g. 48"
                className={cn(
                  "h-8 w-[72px] text-xs tabular-nums",
                  errors.lowerValue && "border-red-300",
                )}
              />
              <Select
                value={tier.lowerUnit}
                onValueChange={(v) => onChange({ lowerUnit: v as TimeUnit })}
              >
                <SelectTrigger className="h-8 w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">hours</SelectItem>
                  <SelectItem value="days">days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.lowerValue && (
              <p className="text-[10px] text-red-500">{errors.lowerValue}</p>
            )}
          </div>

          {/* Upper bound (Between only) */}
          {isBetween && (
            <>
              <span className="text-xs text-gray-400 self-center">and</span>
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <Input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={tier.upperValue}
                    onChange={(e) => onChange({ upperValue: e.target.value })}
                    placeholder="e.g. 72"
                    className={cn(
                      "h-8 w-[72px] text-xs tabular-nums",
                      errors.upperValue && "border-red-300",
                    )}
                  />
                  <Select
                    value={tier.upperUnit}
                    onValueChange={(v) =>
                      onChange({ upperUnit: v as TimeUnit })
                    }
                  >
                    <SelectTrigger className="h-8 w-[80px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">hours</SelectItem>
                      <SelectItem value="days">days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.upperValue && (
                  <p className="text-[10px] text-red-500">
                    {errors.upperValue}
                  </p>
                )}
              </div>
            </>
          )}
          <span className="text-xs text-gray-400 self-center">
            before session
          </span>
        </div>
      </div>

      {/* Refund % + Platform fee toggle */}
      <div className="flex items-start gap-6 flex-wrap">
        {/* Refund % */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">
            Refund percentage <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={100}
                step={5}
                value={tier.refundPercentage}
                onChange={(e) => onChange({ refundPercentage: e.target.value })}
                placeholder="0–100"
                className={cn(
                  "h-8 w-[80px] pr-6 text-xs tabular-nums",
                  errors.refundPercentage && "border-red-300",
                )}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                %
              </span>
            </div>
            {/* Visual swatch */}
            {tier.refundPercentage !== "" &&
              !isNaN(parseFloat(tier.refundPercentage)) && (
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "h-2 w-10 rounded-full",
                      refundColorClass(parseFloat(tier.refundPercentage)),
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px] tabular-nums",
                      refundTextClass(parseFloat(tier.refundPercentage)),
                    )}
                  >
                    {parseFloat(tier.refundPercentage)}%
                  </span>
                </div>
              )}
          </div>
          {errors.refundPercentage && (
            <p className="text-[10px] text-red-500">
              {errors.refundPercentage}
            </p>
          )}
        </div>

        {/* Platform fee toggle */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">
            Platform fee refundable
            <span className="text-gray-400 text-[10px] ml-1">(BR-005)</span>
          </label>
          <div className="flex items-center gap-2 h-8">
            <Switch
              checked={tier.platformFeeRefundable}
              onCheckedChange={(v) => onChange({ platformFeeRefundable: v })}
            />
            <span className="text-xs text-gray-500">
              {tier.platformFeeRefundable ? (
                <span className="text-violet-600">Refundable</span>
              ) : (
                <span className="text-gray-400">Not refundable</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Policy Preview Panel ─────────────────────────────────────────────────────

function PolicyPreview({
  name,
  applicableTo,
  tiers,
  cancellationFee,
  cancellationFeeCurrency,
  isDefault,
  saveAsActive,
}: {
  name: string;
  applicableTo: BookingType[];
  tiers: TierDraft[];
  cancellationFee: string;
  cancellationFeeCurrency: string;
  isDefault: boolean;
  saveAsActive: boolean;
}) {
  const validTiers = tiers.filter(
    (t) =>
      t.lowerValue !== "" &&
      !isNaN(parseFloat(t.lowerValue)) &&
      t.refundPercentage !== "" &&
      !isNaN(parseFloat(t.refundPercentage)),
  );

  const feeVal = parseFloat(cancellationFee);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="text-[11px] text-gray-400 uppercase tracking-wider">
        Live Preview
      </p>

      <div>
        <p className="text-sm text-gray-900">
          {name || (
            <span className="text-gray-300 italic">Untitled Policy</span>
          )}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {applicableTo.length > 0 ? (
            applicableTo.map((t) => <BookingTypeBadge key={t} type={t} />)
          ) : (
            <span className="text-[11px] text-gray-400">No types selected</span>
          )}
          {isDefault && (
            <Badge
              variant="outline"
              className="text-[10px] gap-0.5 border bg-amber-50 text-amber-700 border-amber-200"
            >
              <Star className="h-2 w-2" /> Default
            </Badge>
          )}
        </div>
      </div>

      {validTiers.length > 0 ? (
        <div className="space-y-2 border-t pt-3">
          {validTiers.map((tier) => {
            const pct = parseFloat(tier.refundPercentage);
            const comparison = tier.comparison;
            const lv = parseFloat(tier.lowerValue);
            const lu = tier.lowerUnit;
            const uvStr =
              comparison === "Between" && tier.upperValue !== ""
                ? `${parseFloat(tier.upperValue)} ${tier.upperUnit}`
                : "";
            const label = (() => {
              const f = (v: number, u: TimeUnit) =>
                `${v} ${v === 1 ? u.slice(0, -1) : u}`;
              if (comparison === "More than")
                return `> ${f(lv, lu)} before session`;
              if (comparison === "Less than")
                return `< ${f(lv, lu)} before session`;
              return `${f(lv, lu)} – ${uvStr} before session`;
            })();
            return (
              <div key={tier.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    refundColorClass(pct),
                  )}
                />
                <p className="text-xs text-gray-600 flex-1">{label}</p>
                <span
                  className={cn(
                    "text-xs tabular-nums shrink-0",
                    refundTextClass(pct),
                  )}
                >
                  {pct}% refund{tier.platformFeeRefundable ? " + fee" : ""}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 italic border-t pt-3">
          Add tiers above to see the preview.
        </p>
      )}

      {!isNaN(feeVal) && feeVal > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600 border-t pt-2">
          <DollarSign className="h-3 w-3 text-gray-400" />
          Cancellation fee: {fmtCurrency(feeVal, cancellationFeeCurrency)}
        </div>
      )}

      <div className="border-t pt-2">
        <span
          className={cn(
            "text-[11px] px-2 py-0.5 rounded-full border",
            saveAsActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-blue-50 text-blue-600 border-blue-200",
          )}
        >
          Will be saved as: {saveAsActive ? "Active" : "Draft"}
        </span>
      </div>
    </div>
  );
}

// ─── Policy Editor Dialog ─────────────────────────────────────────────────────

function PolicyEditorDialog({
  open,
  editing,
  existingDefault,
  onClose,
  onSave,
  isSaving,
}: {
  open: boolean;
  editing: CancellationPolicy | null;
  existingDefault: CancellationPolicy | undefined;
  onClose: () => void;
  onSave: (draft: PolicyDraft, editingId: string | null) => void;
  isSaving: boolean;
}) {
  const isNew = editing === null;

  const [draft, setDraft] = useState<PolicyDraft>(() =>
    editing
      ? {
          name: editing.name,
          applicableTo: [...editing.applicableTo],
          tiers: tiersToDraftTiers(editing.tiers),
          cancellationFee:
            editing.cancellationFee > 0 ? String(editing.cancellationFee) : "",
          cancellationFeeCurrency: editing.cancellationFeeCurrency,
          isDefault: editing.isDefault,
          saveAsActive: editing.status === "Active",
        }
      : blankPolicyDraft(),
  );
  const [errors, setErrors] = useState<PolicyFormErrors>({ tiers: [] });
  const [submitted, setSubmitted] = useState(false);

  // Reset when dialog opens/closes or editing changes
  useEffect(() => {
    if (open) {
      setDraft(
        editing
          ? {
              name: editing.name,
              applicableTo: [...editing.applicableTo],
              tiers: tiersToDraftTiers(editing.tiers),
              cancellationFee:
                editing.cancellationFee > 0
                  ? String(editing.cancellationFee)
                  : "",
              cancellationFeeCurrency: editing.cancellationFeeCurrency,
              isDefault: editing.isDefault,
              saveAsActive: editing.status === "Active",
            }
          : blankPolicyDraft(),
      );
      setErrors({ tiers: [] });
      setSubmitted(false);
    }
  }, [open, editing]);

  // Live validation after first submit attempt
  useEffect(() => {
    if (submitted) {
      setErrors(validatePolicyForm(draft));
    }
  }, [draft, submitted]);

  function updateTier(index: number, updates: Partial<TierDraft>) {
    setDraft((prev) => {
      const tiers = [...prev.tiers];
      tiers[index] = { ...tiers[index], ...updates };
      return { ...prev, tiers };
    });
  }

  function addTier() {
    setDraft((prev) => ({
      ...prev,
      tiers: [...prev.tiers, blankTierDraft(uid())],
    }));
    setErrors((prev) => ({ ...prev, tiers: [...prev.tiers, {}] }));
  }

  function removeTier(index: number) {
    if (draft.tiers.length <= 1) return;
    setDraft((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index),
    }));
    setErrors((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index).map(() => ({})),
    }));
  }

  function toggleBookingType(type: BookingType) {
    setDraft((prev) => {
      const exists = prev.applicableTo.includes(type);
      return {
        ...prev,
        applicableTo: exists
          ? prev.applicableTo.filter((t) => t !== type)
          : [...prev.applicableTo, type],
      };
    });
  }

  function handleSubmit() {
    setSubmitted(true);
    const errs = validatePolicyForm(draft);
    setErrors(errs);
    if (hasErrors(errs)) return;
    onSave(draft, editing?.id ?? null);
  }

  const tierErrors = errors.tiers ?? draft.tiers.map(() => ({}));

  // Check if toggling isDefault would replace an existing default
  const willReplaceDefault =
    draft.isDefault && existingDefault && existingDefault.id !== editing?.id;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isSaving) onClose();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Fixed header */}
        <div className="px-6 py-5 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#003B95]/10">
                <ClipboardList className="h-4 w-4 text-[#003B95]" />
              </div>
              {isNew ? "Create Cancellation Policy" : `Edit — ${editing!.name}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Configure cancellation windows, refund tiers, and fees. BR-003:
              changes apply to future bookings only.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ── Form column ── */}
            <div className="lg:col-span-3 space-y-6">
              {/* Policy name */}
              <div className="space-y-1.5">
                <label className="text-sm text-gray-700">
                  Policy Name <span className="text-red-500">*</span>
                  <span className="text-gray-400 text-xs ml-1">
                    (2–60 chars)
                  </span>
                </label>
                <Input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Standard 24-Hour Policy"
                  className={cn(
                    "h-10 text-sm",
                    errors.name && "border-red-300",
                  )}
                  maxLength={60}
                  disabled={isSaving}
                />
                <div className="flex items-center justify-between">
                  {errors.name ? (
                    <p className="text-[11px] text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={cn(
                      "text-[10px] tabular-nums",
                      draft.name.trim().length > 55
                        ? "text-amber-500"
                        : "text-gray-400",
                    )}
                  >
                    {draft.name.trim().length}/60
                  </span>
                </div>
              </div>

              {/* Applies to */}
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Applicable To <span className="text-red-500">*</span>
                  <span className="text-gray-400 text-xs ml-1">
                    (select one or more)
                  </span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {BOOKING_TYPES.map((type) => {
                    const cfg = BOOKING_TYPE_CFG[type];
                    const Icon = cfg.icon;
                    const selected = draft.applicableTo.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleBookingType(type)}
                        disabled={isSaving}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm transition-all",
                          selected
                            ? cn("border-current", cfg.text, cfg.bg)
                            : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            selected ? cfg.text : "text-gray-300",
                          )}
                        />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                {errors.applicableTo && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.applicableTo}
                  </p>
                )}
              </div>

              {/* Cancellation Fee */}
              <div className="space-y-1.5">
                <label className="text-sm text-gray-700">
                  Cancellation Fee
                  <span className="text-gray-400 text-xs ml-1">
                    (optional flat fee)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    value={draft.cancellationFeeCurrency}
                    onValueChange={(v) =>
                      setDraft((p) => ({ ...p, cancellationFeeCurrency: v }))
                    }
                  >
                    <SelectTrigger className="h-10 w-[80px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="QAR">QAR</SelectItem>
                      <SelectItem value="KWD">KWD</SelectItem>
                      <SelectItem value="BHD">BHD</SelectItem>
                      <SelectItem value="EGP">EGP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.cancellationFee}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        cancellationFee: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="h-10 w-[120px] text-sm tabular-nums"
                    disabled={isSaving}
                  />
                  <span className="text-xs text-gray-400">
                    Flat fee charged on every cancellation
                  </span>
                </div>
              </div>

              {/* Tiers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">
                    Cancellation Tiers <span className="text-red-500">*</span>
                    <span className="text-gray-400 text-xs ml-1">(min 1)</span>
                  </label>
                  <Badge
                    variant="outline"
                    className="text-[11px] text-gray-500 border-gray-200"
                  >
                    {draft.tiers.length} tier
                    {draft.tiers.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {draft.tiers.map((tier, i) => (
                    <TierRow
                      key={tier.id}
                      tier={tier}
                      index={i}
                      total={draft.tiers.length}
                      errors={tierErrors[i] ?? {}}
                      onChange={(updates) => updateTier(i, updates)}
                      onRemove={() => removeTier(i)}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTier}
                  disabled={isSaving || draft.tiers.length >= 8}
                  className="gap-1.5 text-xs w-full border-dashed"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Tier
                </Button>
              </div>

              {/* Is Default Policy toggle */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700 flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500" />
                      Set as Default Policy
                    </label>
                    <p className="text-xs text-gray-400 mt-0.5">
                      The default policy applies platform-wide to all new
                      providers.
                    </p>
                  </div>
                  <Switch
                    checked={draft.isDefault}
                    onCheckedChange={(v) =>
                      setDraft((p) => ({ ...p, isDefault: v }))
                    }
                    disabled={isSaving}
                  />
                </div>
                {willReplaceDefault && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      This will replace the current default policy:{" "}
                      <strong>"{existingDefault!.name}"</strong>. Only one
                      policy can be the platform default at a time.
                    </p>
                  </div>
                )}
              </div>

              {/* Status toggle */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700">Status</label>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Active policies are available for providers to select.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs",
                        draft.saveAsActive
                          ? "text-emerald-600"
                          : "text-gray-400",
                      )}
                    >
                      {draft.saveAsActive ? "Active" : "Draft"}
                    </span>
                    <Switch
                      checked={draft.saveAsActive}
                      onCheckedChange={(v) =>
                        setDraft((p) => ({ ...p, saveAsActive: v }))
                      }
                      disabled={isSaving}
                    />
                  </div>
                </div>
                {draft.saveAsActive && (
                  <p className="text-[11px] text-amber-600 flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                    BR-002: Any currently active policy for the selected booking
                    type(s) will be automatically deactivated.
                  </p>
                )}
              </div>
            </div>

            {/* ── Preview column ── */}
            <div className="lg:col-span-2">
              <div className="sticky top-0">
                <PolicyPreview
                  name={draft.name}
                  applicableTo={draft.applicableTo}
                  tiers={draft.tiers}
                  cancellationFee={draft.cancellationFee}
                  cancellationFeeCurrency={draft.cancellationFeeCurrency}
                  isDefault={draft.isDefault}
                  saveAsActive={draft.saveAsActive}
                />
                {/* BR-003 notice */}
                <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-600">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  BR-003: Policy changes apply only to future bookings. Existing
                  bookings retain the policy active at their booking time.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="px-6 py-4 border-t bg-gray-50 shrink-0 flex justify-between gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-[#003B95] hover:bg-[#002d73] text-white min-w-[140px] gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </>
            ) : isNew ? (
              <>
                <Plus className="h-3.5 w-3.5" /> Create Policy
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Activate Confirm Dialog ──────────────────────────────────────────────────

function ActivateConfirmDialog({
  policy,
  conflicts,
  open,
  onClose,
  onConfirm,
  isSaving,
}: {
  policy: CancellationPolicy | null;
  conflicts: CancellationPolicy[];
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSaving: boolean;
}) {
  if (!policy) return null;
  const hasConflicts = conflicts.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isSaving) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            Activate Policy?
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            "{policy.name}" will become the active policy for:{" "}
            {policy.applicableTo.map((t) => (
              <strong key={t}> {BOOKING_TYPE_CFG[t].label}</strong>
            ))}{" "}
            bookings.
          </DialogDescription>
        </DialogHeader>

        {hasConflicts && (
          <div className="space-y-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <strong>BR-002:</strong> The following active{" "}
              {conflicts.length > 1 ? "policies" : "policy"} will be
              automatically deactivated:
            </p>
            <ul className="space-y-1 ml-5">
              {conflicts.map((c) => (
                <li key={c.id} className="text-xs text-amber-800 list-disc">
                  {c.name}
                  <span className="text-amber-500 ml-1">
                    (
                    {c.applicableTo
                      .filter((t) => policy.applicableTo.includes(t))
                      .join(", ")}
                    )
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[110px]"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Activate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Deactivate Confirm Dialog ────────────────────────────────────────────────

function DeactivateConfirmDialog({
  policy,
  open,
  onClose,
  onConfirm,
  isSaving,
}: {
  policy: CancellationPolicy | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSaving: boolean;
}) {
  if (!policy) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isSaving) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-orange-100">
              <XCircle className="h-4 w-4 text-orange-600" />
            </div>
            Deactivate Policy?
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            "{policy.name}" will be deactivated. Providers currently using this
            policy will be notified to select an alternative.
          </DialogDescription>
        </DialogHeader>

        {policy.assignedProviders > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <strong>
                {policy.assignedProviders} provider
                {policy.assignedProviders !== 1 ? "s" : ""}
              </strong>{" "}
              currently use this policy. They will be notified to select a new
              cancellation policy.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-orange-600 hover:bg-orange-700 text-white min-w-[110px]"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Deactivate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  policy,
  open,
  onClose,
  onConfirm,
  isSaving,
}: {
  policy: CancellationPolicy | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSaving: boolean;
}) {
  if (!policy) return null;
  const inUse = policy.assignedProviders > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isSaving) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-100">
              <Trash2 className="h-4 w-4 text-red-600" />
            </div>
            {inUse ? "Cannot Delete Policy" : "Delete Policy?"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {inUse
              ? `"${policy.name}" cannot be deleted because it is currently assigned to ${policy.assignedProviders} active provider${policy.assignedProviders !== 1 ? "s" : ""}. Deactivate the policy first, then have providers switch to another policy.`
              : `"${policy.name}" will be permanently deleted. This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>

        {inUse && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              Policy is assigned to active providers and cannot be deleted.
              Please deactivate it and reassign providers first.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {inUse ? "Close" : "Cancel"}
          </Button>
          {!inUse && (
            <Button
              onClick={onConfirm}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[110px]"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type FilterType = BookingType | "All";
type StatusFilter = PolicyStatus | "All";

export function CancellationPoliciesPage() {
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("All");
  const [isSaving, setIsSaving] = useState(false);

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CancellationPolicy | null>(
    null,
  );

  // Activate confirm dialog
  const [activateTarget, setActivateTarget] =
    useState<CancellationPolicy | null>(null);
  const [activateConflicts, setActivateConflicts] = useState<
    CancellationPolicy[]
  >([]);

  // Deactivate confirm dialog
  const [deactivateTarget, setDeactivateTarget] =
    useState<CancellationPolicy | null>(null);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<CancellationPolicy | null>(
    null,
  );

  // ── Load data ──
  const loadData = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => {
      setPolicies(MOCK_POLICIES);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const activePoliciesByType = useMemo(() => {
    const map: Partial<Record<BookingType, CancellationPolicy>> = {};
    BOOKING_TYPES.forEach((type) => {
      const active = policies.find(
        (p) => p.status === "Active" && p.applicableTo.includes(type),
      );
      if (active) map[type] = active;
    });
    return map;
  }, [policies]);

  const currentDefault = useMemo(() => {
    return policies.find((p) => p.isDefault);
  }, [policies]);

  const filtered = useMemo(() => {
    let r = policies;
    if (filterType !== "All")
      r = r.filter((p) => p.applicableTo.includes(filterType));
    if (filterStatus !== "All") r = r.filter((p) => p.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.createdBy.toLowerCase().includes(q),
      );
    }
    // Sort: Active first, then Draft, then Inactive; within each, newest first
    return [...r].sort((a, b) => {
      const order: PolicyStatus[] = ["Active", "Draft", "Inactive"];
      const ao = order.indexOf(a.status);
      const bo = order.indexOf(b.status);
      if (ao !== bo) return ao - bo;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [policies, filterType, filterStatus, search]);

  const typeCounts: Record<FilterType, number> = useMemo(() => {
    const counts: Record<FilterType, number> = {
      All: policies.length,
      Facility: 0,
      Training: 0,
      Coach: 0,
    };
    policies.forEach((p) => {
      p.applicableTo.forEach((t) => {
        counts[t]++;
      });
    });
    return counts;
  }, [policies]);

  const uncoveredTypes = BOOKING_TYPES.filter((t) => !activePoliciesByType[t]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditingPolicy(null);
    setEditorOpen(true);
  }

  function openEdit(policy: CancellationPolicy) {
    setEditingPolicy(policy);
    setEditorOpen(true);
  }

  const handleSave = useCallback(
    async (draft: PolicyDraft, editingId: string | null) => {
      setIsSaving(true);
      await new Promise((r) => setTimeout(r, 800));

      const now = new Date().toISOString();
      const tiers = draftTiersToTiers(draft.tiers);
      const fee = parseFloat(draft.cancellationFee) || 0;

      if (editingId) {
        // Edit existing
        setPolicies((prev) =>
          prev.map((p) => {
            if (p.id === editingId) {
              return {
                ...p,
                name: draft.name,
                applicableTo: draft.applicableTo,
                tiers,
                cancellationFee: fee,
                cancellationFeeCurrency: draft.cancellationFeeCurrency,
                isDefault: draft.isDefault,
                status: draft.saveAsActive
                  ? "Active"
                  : p.status === "Active"
                    ? "Active"
                    : "Draft",
                updatedAt: now,
                activatedAt: draft.saveAsActive ? now : p.activatedAt,
              };
            }
            // BR-002: deactivate conflicting active policies
            if (
              draft.saveAsActive &&
              p.status === "Active" &&
              p.id !== editingId
            ) {
              const overlaps = p.applicableTo.some((t) =>
                draft.applicableTo.includes(t),
              );
              if (overlaps) return { ...p, status: "Inactive", updatedAt: now };
            }
            // Clear default flag from other policies if this one is default
            if (draft.isDefault && p.id !== editingId && p.isDefault) {
              return { ...p, isDefault: false, updatedAt: now };
            }
            return p;
          }),
        );
        toast.success(`"${draft.name}" updated successfully.`);
      } else {
        // Create new
        const newPolicy: CancellationPolicy = {
          id: `CP-${Date.now()}`,
          name: draft.name,
          applicableTo: draft.applicableTo,
          tiers,
          cancellationFee: fee,
          cancellationFeeCurrency: draft.cancellationFeeCurrency,
          isDefault: draft.isDefault,
          assignedProviders: 0,
          status: draft.saveAsActive ? "Active" : "Draft",
          createdAt: now,
          updatedAt: now,
          createdBy: "Current Admin",
          activatedAt: draft.saveAsActive ? now : undefined,
        };

        // BR-002: deactivate conflicting policies + clear other defaults
        setPolicies((prev) => [
          newPolicy,
          ...prev.map((p) => {
            let updated = p;
            if (draft.saveAsActive && p.status === "Active") {
              const overlaps = p.applicableTo.some((t) =>
                draft.applicableTo.includes(t),
              );
              if (overlaps)
                updated = {
                  ...updated,
                  status: "Inactive" as PolicyStatus,
                  updatedAt: now,
                };
            }
            if (draft.isDefault && p.isDefault) {
              updated = { ...updated, isDefault: false, updatedAt: now };
            }
            return updated;
          }),
        ]);
        toast.success(`"${draft.name}" created successfully.`);
      }

      setEditorOpen(false);
      setIsSaving(false);
    },
    [],
  );

  function initiateActivate(policy: CancellationPolicy) {
    const conflicts = policies.filter(
      (p) =>
        p.id !== policy.id &&
        p.status === "Active" &&
        p.applicableTo.some((t) => policy.applicableTo.includes(t)),
    );
    setActivateConflicts(conflicts);
    setActivateTarget(policy);
  }

  const handleActivate = useCallback(async () => {
    if (!activateTarget) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const now = new Date().toISOString();

    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === activateTarget.id) {
          return { ...p, status: "Active", updatedAt: now, activatedAt: now };
        }
        // BR-002: deactivate overlapping active policies
        if (
          p.status === "Active" &&
          p.applicableTo.some((t) => activateTarget.applicableTo.includes(t))
        ) {
          return { ...p, status: "Inactive", updatedAt: now };
        }
        return p;
      }),
    );

    toast.success(`"${activateTarget.name}" is now Active.`);
    if (activateConflicts.length > 0) {
      toast.info(
        `${activateConflicts.length} previous ${activateConflicts.length > 1 ? "policies" : "policy"} deactivated (BR-002).`,
      );
    }

    setActivateTarget(null);
    setActivateConflicts([]);
    setIsSaving(false);
  }, [activateTarget, activateConflicts]);

  const handleDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === deactivateTarget.id
          ? { ...p, status: "Inactive", updatedAt: new Date().toISOString() }
          : p,
      ),
    );
    toast.success(`"${deactivateTarget.name}" deactivated.`);
    if (deactivateTarget.assignedProviders > 0) {
      toast.info(
        `${deactivateTarget.assignedProviders} provider${deactivateTarget.assignedProviders !== 1 ? "s" : ""} will be notified to select a new policy.`,
      );
    }
    setDeactivateTarget(null);
    setIsSaving(false);
  }, [deactivateTarget]);

  const handleDuplicate = useCallback((policy: CancellationPolicy) => {
    const now = new Date().toISOString();
    const copy: CancellationPolicy = {
      ...policy,
      id: `CP-${Date.now()}`,
      name: `${policy.name} (Copy)`,
      status: "Draft",
      isDefault: false,
      assignedProviders: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: "Current Admin",
      activatedAt: undefined,
      tiers: policy.tiers.map((t) => ({ ...t, id: uid() })),
    };
    setPolicies((prev) => [copy, ...prev]);
    toast.success(`"${copy.name}" created as a Draft copy.`);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    // Double-check: cannot delete if in use
    if (deleteTarget.assignedProviders > 0) {
      toast.error(
        `Cannot delete "${deleteTarget.name}" — it is assigned to ${deleteTarget.assignedProviders} active provider(s).`,
      );
      setDeleteTarget(null);
      return;
    }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setPolicies((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    toast.success(`"${deleteTarget.name}" deleted.`);
    setDeleteTarget(null);
    setIsSaving(false);
  }, [deleteTarget]);

  // ── Render: Error State ─────────────────────────────────────────────────

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg text-gray-900">
          Unable to load cancellation policies
        </h2>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Something went wrong while loading the policy data. Please try again.
        </p>
        <Button
          onClick={loadData}
          className="gap-2 bg-[#003B95] hover:bg-[#002d73]"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl text-gray-900 flex items-center gap-2.5">
            <div className="flex items-center justify-center h-10 w-9 rounded-lg bg-[#003B95]/10">
              <ClipboardList className="h-5 w-5 text-[#003B95]" />
            </div>
            Cancellation Policy Management
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Define cancellation windows, refund rules, and fees for provider
            bookings. One active policy per type at a time (BR-001).
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={isLoading}
          className="bg-[#003B95] hover:bg-[#002d73] text-white gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Policy
        </Button>
      </div>

      {/* ── BR-003 notice ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
        <span>
          <strong>BR-003:</strong> Policy changes apply only to{" "}
          <strong>future bookings</strong>. Existing bookings are not
          retroactively affected — they retain the policy that was active at
          their booking time. <strong>BR-004:</strong> If no active policy
          exists for a booking type, a 0% refund is applied by default (fully
          non-refundable).
        </span>
      </div>

      {/* ── Coverage Overview (BR-004) ────────────────────────────────────── */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5">
          Active Policy Coverage
        </p>
        {isLoading ? (
          <SkeletonCoverageCards />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BOOKING_TYPES.map((type) => (
              <CoverageCard
                key={type}
                type={type}
                activePolicy={activePoliciesByType[type]}
                onClick={() => setFilterType(type)}
              />
            ))}
          </div>
        )}
        {!isLoading && uncoveredTypes.length > 0 && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>BR-004:</strong> {uncoveredTypes.join(", ")} booking
              {uncoveredTypes.length > 1 ? "s have" : " has"} no active
              cancellation policy. The 0% refund default will apply.
            </span>
          </div>
        )}
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Type filter pills */}
        <div className="flex gap-1 bg-gray-100/70 rounded-lg p-1 border">
          {(["All", ...BOOKING_TYPES] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-all",
                filterType === type
                  ? "bg-white text-[#003B95] shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {type === "Coach" ? "Freelancer Coach" : type}
              <span
                className={cn(
                  "ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full tabular-nums",
                  filterType === type
                    ? "bg-[#003B95]/15 text-[#003B95]"
                    : "bg-gray-200 text-gray-500",
                )}
              >
                {typeCounts[type]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          {/* Status filter */}
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as StatusFilter)}
          >
            <SelectTrigger className="h-10 w-[140px] text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies…"
              className="pl-9 pr-8 h-10 text-xs w-[200px]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} polic{filtered.length !== 1 ? "ies" : "y"}
          </p>
        </div>
      </div>

      {/* ── Policy Grid ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <SkeletonPolicyCards />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl py-20 text-center">
          <ClipboardList className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">
            {policies.length === 0
              ? "No cancellation policies found. Click 'Add Policy' to create one."
              : "No policies match your filters."}
          </p>
          {policies.length === 0 ? (
            <Button
              onClick={openCreate}
              className="mt-4 bg-[#003B95] hover:bg-[#002d73] text-white gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Policy
            </Button>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              Try a different filter or create a new policy.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onEdit={openEdit}
              onActivate={initiateActivate}
              onDeactivate={(p) => setDeactivateTarget(p)}
              onDuplicate={handleDuplicate}
              onDelete={(p) => setDeleteTarget(p)}
            />
          ))}
        </div>
      )}

      {/* ── BR-005 Info Box ───────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3 text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-gray-700">BR-005:</strong> Platform fee
            refundability is configured per tier independently of the booking
            refund percentage. If a tier has platform fee refundable{" "}
            <em>off</em>, the platform fee is excluded from all refund
            calculations for that cancellation window.
          </span>
        </div>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <PolicyEditorDialog
        open={editorOpen}
        editing={editingPolicy}
        existingDefault={currentDefault}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <ActivateConfirmDialog
        policy={activateTarget}
        conflicts={activateConflicts}
        open={!!activateTarget}
        onClose={() => {
          setActivateTarget(null);
          setActivateConflicts([]);
        }}
        onConfirm={handleActivate}
        isSaving={isSaving}
      />

      <DeactivateConfirmDialog
        policy={deactivateTarget}
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        isSaving={isSaving}
      />

      <DeleteConfirmDialog
        policy={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isSaving={isSaving}
      />
    </div>
  );
}
