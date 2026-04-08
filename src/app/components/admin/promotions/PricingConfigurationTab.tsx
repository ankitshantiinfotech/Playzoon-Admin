// ─── SCR-ADM-042: Promotion Pricing Configuration ────────────────────────────
// Manages pricing matrix (Placement x Duration), homepage slot limits, and audit log.
// Changes apply only to future promotion purchases.
// All changes logged in audit trail.

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  Save,
  Loader2,
  Info,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Clock,
  Home,
  LayoutList,
  Layers,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  PricingCell,
  PricingAuditEntry,
  HomepageSlotConfig,
  PlacementType,
  PromotionDuration,
  PLACEMENT_TYPES,
  DURATIONS,
  fmtSAR,
} from "./types";
import {
  INITIAL_PRICING_CELLS,
  INITIAL_HOMEPAGE_SLOT_CONFIG,
  PRICING_AUDIT_LOG,
} from "./mockData";

// ─── Placement Icons ─────────────────────────────────────────────────────────

const PLACEMENT_ICONS: Record<PlacementType, React.ElementType> = {
  Homepage: Home,
  "Listing Page": LayoutList,
  Both: Layers,
};

// ─── Duration Labels ─────────────────────────────────────────────────────────

const DURATION_LABELS: Record<PromotionDuration, string> = {
  Daily: "Daily (24h)",
  Weekly: "Weekly (7 days)",
  Monthly: "Monthly (30 days)",
  Yearly: "Yearly",
};

// ─── Helper to get cell key ──────────────────────────────────────────────────

function cellKey(
  placement: PlacementType,
  duration: PromotionDuration,
): string {
  return `${placement}::${duration}`;
}

function getCell(
  cells: PricingCell[],
  placement: PlacementType,
  duration: PromotionDuration,
): PricingCell {
  return cells.find(
    (c) => c.placement === placement && c.duration === duration,
  )!;
}

// ─── Detect changes ──────────────────────────────────────────────────────────

interface ChangeEntry {
  field: string;
  oldValue: string;
  newValue: string;
}

function detectChanges(
  original: PricingCell[],
  current: PricingCell[],
  origSlots: HomepageSlotConfig,
  currSlots: HomepageSlotConfig,
): ChangeEntry[] {
  const changes: ChangeEntry[] = [];
  for (const placement of PLACEMENT_TYPES) {
    for (const duration of DURATIONS) {
      const orig = getCell(original, placement, duration);
      const curr = getCell(current, placement, duration);
      if (orig.price !== curr.price) {
        changes.push({
          field: `${placement} ${duration} Price`,
          oldValue: fmtSAR(orig.price),
          newValue: fmtSAR(curr.price),
        });
      }
      if (orig.isActive !== curr.isActive) {
        changes.push({
          field: `${placement} ${duration} Status`,
          oldValue: orig.isActive ? "Active" : "Inactive",
          newValue: curr.isActive ? "Active" : "Inactive",
        });
      }
    }
  }
  if (origSlots.maxSlots !== currSlots.maxSlots) {
    changes.push({
      field: "Max Homepage Slots",
      oldValue: String(origSlots.maxSlots),
      newValue: String(currSlots.maxSlots),
    });
  }
  return changes;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PricingConfigurationTab() {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────
  const [cells, setCells] = useState<PricingCell[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_PRICING_CELLS)),
  );
  const [originalCells] = useState<PricingCell[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_PRICING_CELLS)),
  );
  const [slotConfig, setSlotConfig] = useState<HomepageSlotConfig>({
    ...INITIAL_HOMEPAGE_SLOT_CONFIG,
  });
  const [originalSlotConfig] = useState<HomepageSlotConfig>({
    ...INITIAL_HOMEPAGE_SLOT_CONFIG,
  });
  const [auditLog] = useState<PricingAuditEntry[]>(PRICING_AUDIT_LOG);
  const [auditExpanded, setAuditExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // ── Change detection ─────────────────────────────────────────────────────
  const changes = useMemo(
    () => detectChanges(originalCells, cells, originalSlotConfig, slotConfig),
    [originalCells, cells, originalSlotConfig, slotConfig],
  );
  const hasChanges = changes.length > 0;

  // ── All plans inactive warning ───────────────────────────────────────────
  const allInactive = cells.every((c) => !c.isActive);

  // ── Cell update helpers ──────────────────────────────────────────────────
  const updateCellPrice = useCallback(
    (placement: PlacementType, duration: PromotionDuration, price: number) => {
      setCells((prev) =>
        prev.map((c) =>
          c.placement === placement && c.duration === duration
            ? { ...c, price }
            : c,
        ),
      );
      // Clear validation error for this cell
      const key = cellKey(placement, duration);
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const updateCellActive = useCallback(
    (
      placement: PlacementType,
      duration: PromotionDuration,
      isActive: boolean,
    ) => {
      setCells((prev) =>
        prev.map((c) =>
          c.placement === placement && c.duration === duration
            ? { ...c, isActive }
            : c,
        ),
      );
      // Clear validation error when deactivating
      if (!isActive) {
        const key = cellKey(placement, duration);
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [],
  );

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    for (const cell of cells) {
      const key = cellKey(cell.placement, cell.duration);
      if (cell.isActive && cell.price < 0) {
        errors[key] = "Price cannot be negative.";
      }
    }

    if (!slotConfig.maxSlots || slotConfig.maxSlots < 1) {
      errors["maxSlots"] = "Minimum value is 1.";
    } else if (!Number.isInteger(slotConfig.maxSlots)) {
      errors["maxSlots"] = "Must be a whole number.";
    } else if (slotConfig.maxSlots < slotConfig.currentUsage) {
      errors["maxSlots"] =
        `Cannot set maximum below current active homepage promotions (currently ${slotConfig.currentUsage} active).`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSaveClick = () => {
    if (!validate()) {
      toast.error("Please fix the validation errors before saving.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSaving(false);
    setConfirmOpen(false);
    toast.success("Pricing configuration saved successfully.");
  };

  // ── Slot usage indicator ─────────────────────────────────────────────────
  const usagePct =
    slotConfig.maxSlots > 0
      ? (slotConfig.currentUsage / slotConfig.maxSlots) * 100
      : 0;
  const usageColorClass =
    usagePct >= 100
      ? "bg-red-50 border-red-200 text-red-700"
      : usagePct >= 80
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-blue-50 border-blue-200 text-blue-700";

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* ── Breadcrumb + Save Button ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-9 rounded-lg bg-[#003B95]/10">
            <Settings className="h-5 w-5 text-[#003B95]" />
          </div>
          <div>
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1.5 text-xs text-gray-500">
                <li>
                  <button
                    onClick={() => navigate("/promotions")}
                    className="hover:text-[#003B95] transition-colors"
                  >
                    Promotions
                  </button>
                </li>
                <li>
                  <ChevronRight className="h-3 w-3" />
                </li>
                <li className="text-gray-900 font-medium" aria-current="page">
                  Pricing Configuration
                </li>
              </ol>
            </nav>
            <h1 className="text-xl font-semibold text-gray-900 mt-0.5">
              Pricing Configuration
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSaveClick}
            disabled={!hasChanges || isSaving}
            className="gap-2 bg-[#003B95] hover:bg-[#002d73]"
            aria-label={isSaving ? "Saving pricing..." : "Save Changes"}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ── Back to Promotions Link ─────────────────────────────────────────── */}
      <button
        onClick={() => navigate("/promotions")}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#003B95] transition-colors w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Promotions
      </button>

      {/* ── Warning Banners ─────────────────────────────────────────────────── */}
      {allInactive && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700">
              All promotion plans are currently inactive
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Providers cannot purchase promotions. Activate at least one plan
              to enable promotion purchases.
            </p>
          </div>
        </div>
      )}

      {/* ── Section 1: Pricing Matrix ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Promotion Pricing
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Configure prices for each placement and duration combination.
            Inactive plans cannot be purchased by providers.
          </p>
        </div>

        <div
          className="p-6 overflow-x-auto"
          role="grid"
          aria-label="Promotion pricing matrix"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-left text-xs font-medium text-gray-500 pb-3 pr-4 w-[160px]"
                >
                  Placement
                </th>
                {DURATIONS.map((d) => (
                  <th
                    key={d}
                    scope="col"
                    className="text-center text-xs font-medium text-gray-500 pb-3 px-3 min-w-[180px]"
                  >
                    {DURATION_LABELS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLACEMENT_TYPES.map((placement) => {
                const PlacementIcon = PLACEMENT_ICONS[placement];
                return (
                  <tr key={placement} className="border-t border-gray-100">
                    <th scope="row" className="text-left py-4 pr-4 align-top">
                      <div className="flex items-center gap-2">
                        <PlacementIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {placement}
                        </span>
                      </div>
                    </th>
                    {DURATIONS.map((duration) => {
                      const cell = getCell(cells, placement, duration);
                      const key = cellKey(placement, duration);
                      const error = validationErrors[key];

                      return (
                        <td
                          key={duration}
                          className="px-3 py-4 align-top"
                          role="gridcell"
                        >
                          <div
                            className={cn(
                              "rounded-lg border p-3 space-y-3 transition-colors",
                              cell.isActive
                                ? "bg-white border-gray-200"
                                : "bg-gray-50 border-gray-100",
                            )}
                          >
                            {/* Price Input */}
                            <div>
                              <Label
                                htmlFor={`price-${key}`}
                                className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1.5"
                              >
                                Price (SAR)
                              </Label>
                              <div className="relative">
                                <Input
                                  id={`price-${key}`}
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={cell.price}
                                  onChange={(e) =>
                                    updateCellPrice(
                                      placement,
                                      duration,
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  disabled={!cell.isActive}
                                  className={cn(
                                    "h-8 text-sm text-right pr-12",
                                    error &&
                                      "border-red-300 focus-visible:ring-red-200",
                                    !cell.isActive &&
                                      "opacity-50 cursor-not-allowed bg-gray-100",
                                  )}
                                  aria-required={cell.isActive}
                                  aria-disabled={!cell.isActive}
                                  aria-describedby={
                                    error ? `error-${key}` : undefined
                                  }
                                  aria-label={`${placement} ${duration} Price`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                                  SAR
                                </span>
                              </div>
                              {error && (
                                <p
                                  id={`error-${key}`}
                                  className="text-[10px] text-red-600 mt-1"
                                >
                                  {error}
                                </p>
                              )}
                            </div>

                            {/* Status Toggle */}
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor={`toggle-${key}`}
                                className="text-[10px] text-gray-500 cursor-pointer"
                              >
                                {cell.isActive ? "Active" : "Inactive"}
                              </Label>
                              <Switch
                                id={`toggle-${key}`}
                                checked={cell.isActive}
                                onCheckedChange={(checked) =>
                                  updateCellActive(placement, duration, checked)
                                }
                                aria-label={`${placement} ${duration} status`}
                                className={cn(
                                  cell.isActive
                                    ? "data-[state=checked]:bg-emerald-500"
                                    : "",
                                )}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Homepage Slot Limits ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Homepage Slot Limits
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Control how many promotions can appear on the homepage
            simultaneously.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="max-w-sm">
            <Label htmlFor="max-homepage" className="text-sm text-gray-700">
              Maximum Homepage Promotions
            </Label>
            <Input
              id="max-homepage"
              type="number"
              min={1}
              step={1}
              value={slotConfig.maxSlots}
              onChange={(e) => {
                setSlotConfig((prev) => ({
                  ...prev,
                  maxSlots: parseInt(e.target.value) || 0,
                }));
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next["maxSlots"];
                  return next;
                });
              }}
              className={cn(
                "mt-1.5 h-10 w-32",
                validationErrors["maxSlots"] &&
                  "border-red-300 focus-visible:ring-red-200",
              )}
              aria-required="true"
              aria-describedby="max-homepage-help max-homepage-error"
            />
            {validationErrors["maxSlots"] && (
              <p id="max-homepage-error" className="text-xs text-red-600 mt-1">
                {validationErrors["maxSlots"]}
              </p>
            )}
          </div>

          {/* Current Usage */}
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm",
              usageColorClass,
            )}
            aria-live="polite"
          >
            <Home className="h-4 w-4" />
            Currently {slotConfig.currentUsage} of {slotConfig.maxSlots}{" "}
            homepage slots in use
          </div>

          {/* Info text */}
          <p
            id="max-homepage-help"
            className="text-xs text-gray-500 flex items-start gap-1.5"
          >
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
            When all homepage slots are filled, providers can only select
            listing page placement.
          </p>
        </div>
      </div>

      {/* ── Section 3: Audit Log ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200">
        <button
          onClick={() => setAuditExpanded((e) => !e)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
          aria-expanded={auditExpanded}
        >
          <h2 className="text-base font-semibold text-gray-900">
            Recent Changes
          </h2>
          {auditExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {auditExpanded && (
          <div
            className="px-6 pb-5 border-t border-gray-100"
            role="log"
            aria-label="Recent pricing changes"
          >
            <div className="space-y-0 mt-3">
              {auditLog.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-start gap-4 py-3",
                    idx < auditLog.length - 1 && "border-b border-gray-50",
                  )}
                >
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-100 shrink-0 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700">
                      {entry.changeSummary}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {format(
                          parseISO(entry.timestamp),
                          "dd MMM yyyy, HH:mm",
                        )}
                      </span>
                      <span className="text-[10px] text-gray-300">|</span>
                      <span className="text-[10px] text-gray-500">
                        {entry.adminName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Confirmation Modal ───────────────────────────────────────────────── */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(v) => {
          if (!v && !isSaving) setConfirmOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              Confirm Pricing Changes
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              This change will apply to all future promotion purchases. Existing
              active promotions are unaffected.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 max-h-[300px] overflow-y-auto">
            <div className="space-y-2">
              {changes.map((change, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs"
                >
                  <p className="text-gray-700 font-medium">{change.field}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-red-500 line-through">
                      {change.oldValue}
                    </span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span className="text-emerald-600 font-medium">
                      {change.newValue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSave}
              disabled={isSaving}
              className="gap-1.5 bg-[#003B95] hover:bg-[#002d73] text-white min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" /> Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
