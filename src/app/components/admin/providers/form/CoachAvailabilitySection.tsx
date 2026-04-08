// ─── US-4.3.3 — Coach Availability & Cost View/Edit UI ──────
// Weekly schedule grid with toggleable time slots + cost/pricing
// with inline-editable numeric fields, currency selector, and
// save confirmation flow.

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Clock,
  DollarSign,
  Save,
  Loader2,
  RotateCcw,
  CalendarDays,
  Pencil,
  Check,
  X,
  ChevronDown,
  CreditCard,
  Banknote,
  Package,
  Search,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../ui/alert-dialog";

// ═══════════════════════════════════════════════════════════════
// Types & Constants
// ═══════════════════════════════════════════════════════════════

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// Time slots from 6 AM to 10 PM (17 slots, 1-hour each)
const SLOT_START = 6; // 6:00 AM
const SLOT_END = 22; // 10:00 PM
const SLOTS: number[] = [];
for (let h = SLOT_START; h < SLOT_END; h++) SLOTS.push(h);

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

function formatHourShort(h: number): string {
  if (h === 0 || h === 24) return "12a";
  if (h === 12) return "12p";
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

// Slot key: "Mon-14" = Monday at 2 PM
type SlotKey = `${(typeof DAYS)[number]}-${number}`;
function makeSlotKey(day: (typeof DAYS)[number], hour: number): SlotKey {
  return `${day}-${hour}` as SlotKey;
}

// Currency
interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "SAR", symbol: "ر.س", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal", flag: "🇶🇦" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", flag: "🇰🇼" },
  { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar", flag: "🇧🇭" },
  { code: "OMR", symbol: "ر.ع.", name: "Omani Rial", flag: "🇴🇲" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", flag: "🇪🇬" },
  { code: "JOD", symbol: "د.ا", name: "Jordanian Dinar", flag: "🇯🇴" },
];

// ═══════════════════════════════════════════════════════════════
// State Types
// ═══════════════════════════════════════════════════════════════

export interface CoachAvailabilityState {
  slots: Set<SlotKey>;
  currency: string;
  perSessionRate: string;
  perHourRate: string;
  packageRate5: string; // 5-session package
  packageRate10: string; // 10-session package
  trialSessionRate: string;
}

export function createInitialAvailability(): CoachAvailabilityState {
  // Provide sensible defaults: weekdays 9-5
  const slots = new Set<SlotKey>();
  for (const day of ["Mon", "Tue", "Wed", "Thu"] as const) {
    for (let h = 9; h < 17; h++) slots.add(makeSlotKey(day, h));
  }
  // Saturday morning
  for (let h = 9; h < 13; h++) slots.add(makeSlotKey("Sat", h));

  return {
    slots,
    currency: "AED",
    perSessionRate: "250",
    perHourRate: "300",
    packageRate5: "1100",
    packageRate10: "2000",
    trialSessionRate: "150",
  };
}

// ═══════════════════════════════════════════════════════════════
// Currency Dropdown
// ═══════════════════════════════════════════════════════════════

function CurrencyDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0];

  const filtered = useMemo(() => {
    if (!search.trim()) return CURRENCIES;
    const q = search.toLowerCase();
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 h-10 px-2.5 border rounded-md text-sm bg-white hover:bg-gray-50 transition-colors min-w-[120px]",
          open && "ring-2 ring-[#003B95]/20 border-[#003B95]",
        )}
      >
        <span>{selected.flag}</span>
        <span className="text-[#374151]">{selected.code}</span>
        <span className="text-xs text-gray-400">({selected.symbol})</span>
        <ChevronDown className="h-3 w-3 text-gray-400 ml-auto" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search currency..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-2 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-[#003B95]/30"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-44">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                  c.code === value && "bg-blue-50 text-[#003B95]",
                )}
              >
                <span>{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-xs text-gray-400">{c.code}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                No currencies found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Inline Editable Cost Field
// ═══════════════════════════════════════════════════════════════

function CostField({
  label,
  icon,
  value,
  currencySymbol,
  onChange,
  description,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  currencySymbol: string;
  onChange: (val: string) => void;
  description?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const confirmEdit = () => {
    // Only digits and one decimal point
    const cleaned = draft.replace(/[^0-9.]/g, "");
    onChange(cleaned || "0");
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirmEdit();
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-lg border bg-gray-50/50 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[#111827]">{label}</p>
          {description && (
            <p className="text-[11px] text-[#9CA3AF]">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {currencySymbol}
              </span>
              <Input
                value={draft}
                onChange={(e) =>
                  setDraft(e.target.value.replace(/[^0-9.]/g, ""))
                }
                onKeyDown={handleKeyDown}
                className="h-8 w-28 pl-8 text-sm text-right"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={confirmEdit}
              className="p-1 rounded hover:bg-emerald-100 text-emerald-600"
              aria-label="Confirm"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="p-1 rounded hover:bg-gray-200 text-gray-400"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-[#111827] tabular-nums">
              {currencySymbol} {Number(value || 0).toLocaleString()}
            </span>
            <button
              type="button"
              onClick={startEdit}
              className="p-1 rounded hover:bg-gray-200 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Edit ${label}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CoachAvailabilitySection({
  availability,
  setAvailability,
  onDirty,
}: {
  availability: CoachAvailabilityState;
  setAvailability: React.Dispatch<React.SetStateAction<CoachAvailabilityState>>;
  onDirty: () => void;
}) {
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove" | null>(null);

  const currencyObj =
    CURRENCIES.find((c) => c.code === availability.currency) ?? CURRENCIES[0];

  // ── Slot toggling ─────────────────────────────────────
  const toggleSlot = useCallback(
    (day: (typeof DAYS)[number], hour: number) => {
      const key = makeSlotKey(day, hour);
      setAvailability((prev) => {
        const next = new Set(prev.slots);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return { ...prev, slots: next };
      });
      onDirty();
    },
    [setAvailability, onDirty],
  );

  // ── Drag selection for quick slot paint ────────────────
  const handleSlotMouseDown = useCallback(
    (day: (typeof DAYS)[number], hour: number) => {
      const key = makeSlotKey(day, hour);
      const removing = availability.slots.has(key);
      setIsDragging(true);
      setDragMode(removing ? "remove" : "add");
      toggleSlot(day, hour);
    },
    [availability.slots, toggleSlot],
  );

  const handleSlotMouseEnter = useCallback(
    (day: (typeof DAYS)[number], hour: number) => {
      if (!isDragging || dragMode === null) return;
      const key = makeSlotKey(day, hour);
      const isActive = availability.slots.has(key);
      if (dragMode === "add" && !isActive) toggleSlot(day, hour);
      if (dragMode === "remove" && isActive) toggleSlot(day, hour);
    },
    [isDragging, dragMode, availability.slots, toggleSlot],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragMode(null);
  }, []);

  // ── Quick actions ─────────────────────────────────────
  const selectWeekdays = useCallback(() => {
    setAvailability((prev) => {
      const next = new Set(prev.slots);
      for (const day of ["Mon", "Tue", "Wed", "Thu"] as const) {
        for (let h = 9; h < 17; h++) next.add(makeSlotKey(day, h));
      }
      return { ...prev, slots: next };
    });
    onDirty();
  }, [setAvailability, onDirty]);

  const clearAll = useCallback(() => {
    setAvailability((prev) => ({ ...prev, slots: new Set() }));
    onDirty();
  }, [setAvailability, onDirty]);

  // ── Slot stats ────────────────────────────────────────
  const totalSlots = availability.slots.size;
  const hoursPerWeek = totalSlots; // each slot = 1 hour
  const dayStats = useMemo(() => {
    const stats: Record<string, number> = {};
    DAYS.forEach((d) => {
      stats[d] = 0;
    });
    availability.slots.forEach((key) => {
      const day = key.split("-")[0];
      if (stats[day] !== undefined) stats[day]++;
    });
    return stats;
  }, [availability.slots]);

  // ── Cost field updater ────────────────────────────────
  const updateCost = useCallback(
    (field: keyof CoachAvailabilityState, value: string) => {
      setAvailability((prev) => ({ ...prev, [field]: value }));
      onDirty();
    },
    [setAvailability, onDirty],
  );

  // ── Save confirmation ─────────────────────────────────
  const handleSaveSection = async () => {
    setIsSavingSection(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSavingSection(false);
    setShowSaveConfirm(false);
    toast.success("Availability & pricing saved successfully.");
  };

  // ═══════════════════════════════════════════════════════
  return (
    <TooltipProvider delayDuration={200}>
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm text-[#111827] flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#003B95]" />
              Availability & Cost
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Manage the coach's weekly schedule and pricing information.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="bg-[#003B95] hover:bg-[#002d73] text-white gap-1.5 text-xs"
            onClick={() => setShowSaveConfirm(true)}
          >
            <Save className="h-3 w-3" /> Save Section
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* ════════════════════════════════════════════════
              Availability Schedule Grid
              ════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-sm text-[#374151] flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#003B95]" /> Weekly Schedule
              </Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 text-gray-500"
                >
                  {hoursPerWeek} hr{hoursPerWeek !== 1 ? "s" : ""}/week
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 px-2 gap-1"
                  onClick={selectWeekdays}
                >
                  <CalendarDays className="h-3 w-3" /> Weekdays 9-5
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 px-2 gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={clearAll}
                >
                  <RotateCcw className="h-3 w-3" /> Clear
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-[#9CA3AF]">
              Click or drag across slots to toggle availability. Green =
              available.
            </p>

            {/* Grid */}
            <div
              className="overflow-x-auto -mx-2 px-2 pb-2 select-none"
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="min-w-[640px]">
                {/* Header row */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-0.5 mb-0.5">
                  <div className="h-8" /> {/* Empty corner */}
                  {DAYS.map((day, di) => (
                    <div
                      key={day}
                      className="h-8 flex flex-col items-center justify-center rounded-t-md bg-gray-100"
                    >
                      <span className="text-[11px] text-[#374151]">{day}</span>
                      <span className="text-[9px] text-[#9CA3AF]">
                        {dayStats[day]}h
                      </span>
                    </div>
                  ))}
                </div>

                {/* Time slot rows */}
                {SLOTS.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-[60px_repeat(7,1fr)] gap-0.5 mb-0.5"
                  >
                    {/* Time label */}
                    <div className="flex items-center justify-end pr-2 h-7">
                      <span className="text-[10px] text-[#9CA3AF] tabular-nums whitespace-nowrap">
                        {formatHour(hour)}
                      </span>
                    </div>
                    {/* Day cells */}
                    {DAYS.map((day) => {
                      const key = makeSlotKey(day, hour);
                      const active = availability.slots.has(key);
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onMouseDown={() => handleSlotMouseDown(day, hour)}
                              onMouseEnter={() =>
                                handleSlotMouseEnter(day, hour)
                              }
                              className={cn(
                                "h-7 rounded-sm transition-colors",
                                active
                                  ? "bg-emerald-400 hover:bg-emerald-500"
                                  : "bg-gray-100 hover:bg-gray-200",
                              )}
                              aria-label={`${DAYS_FULL[DAYS.indexOf(day)]} ${formatHour(hour)} - ${active ? "Available" : "Unavailable"}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {DAYS_FULL[DAYS.indexOf(day)]}, {formatHour(hour)} –{" "}
                            {formatHour(hour + 1)}
                            <br />
                            <span
                              className={
                                active ? "text-emerald-400" : "text-gray-400"
                              }
                            >
                              {active ? "✓ Available" : "✗ Unavailable"}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px] text-[#6B7280]">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-emerald-400" />
                Available
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-gray-100 border border-gray-200" />
                Unavailable
              </div>
            </div>

            {/* Day summary chips */}
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => (
                <Badge
                  key={day}
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0.5",
                    dayStats[day] > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-50 text-gray-400 border-gray-200",
                  )}
                >
                  {day}: {dayStats[day]}h
                </Badge>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* ════════════════════════════════════════════════
              Cost / Pricing
              ════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-sm text-[#374151] flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-[#003B95]" /> Pricing
              </Label>
              <CurrencyDropdown
                value={availability.currency}
                onChange={(code) => {
                  setAvailability((prev) => ({ ...prev, currency: code }));
                  onDirty();
                }}
              />
            </div>

            <p className="text-[11px] text-[#9CA3AF]">
              Hover over a field and click the pencil icon to edit. Press Enter
              to confirm or Escape to cancel.
            </p>

            <div className="space-y-2">
              <CostField
                label="Per Session Rate"
                icon={<CreditCard className="h-4 w-4 text-blue-500" />}
                value={availability.perSessionRate}
                currencySymbol={currencyObj.symbol}
                onChange={(v) => updateCost("perSessionRate", v)}
                description="Standard single-session booking price"
              />
              <CostField
                label="Per Hour Rate"
                icon={<Clock className="h-4 w-4 text-blue-500" />}
                value={availability.perHourRate}
                currencySymbol={currencyObj.symbol}
                onChange={(v) => updateCost("perHourRate", v)}
                description="Hourly coaching rate"
              />
              <CostField
                label="5-Session Package"
                icon={<Package className="h-4 w-4 text-indigo-500" />}
                value={availability.packageRate5}
                currencySymbol={currencyObj.symbol}
                onChange={(v) => updateCost("packageRate5", v)}
                description="Discounted bundle for 5 sessions"
              />
              <CostField
                label="10-Session Package"
                icon={<Package className="h-4 w-4 text-purple-500" />}
                value={availability.packageRate10}
                currencySymbol={currencyObj.symbol}
                onChange={(v) => updateCost("packageRate10", v)}
                description="Discounted bundle for 10 sessions"
              />
              <CostField
                label="Trial Session"
                icon={<Banknote className="h-4 w-4 text-emerald-500" />}
                value={availability.trialSessionRate}
                currencySymbol={currencyObj.symbol}
                onChange={(v) => updateCost("trialSessionRate", v)}
                description="Introductory/trial session price"
              />
            </div>

            {/* Pricing summary */}
            <div className="rounded-lg border bg-blue-50/50 px-4 py-3">
              <p className="text-xs text-[#003B95] mb-2 flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5" /> Rate Comparison
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-[#6B7280]">Session</p>
                  <p className="text-sm text-[#111827] tabular-nums">
                    {currencyObj.symbol}{" "}
                    {Number(availability.perSessionRate || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B7280]">5-Pack / session</p>
                  <p className="text-sm text-[#111827] tabular-nums">
                    {currencyObj.symbol}{" "}
                    {(
                      Number(availability.packageRate5 || 0) / 5
                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B7280]">
                    10-Pack / session
                  </p>
                  <p className="text-sm text-[#111827] tabular-nums">
                    {currencyObj.symbol}{" "}
                    {(
                      Number(availability.packageRate10 || 0) / 10
                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              {/* Savings indicators */}
              {Number(availability.perSessionRate) > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Number(availability.packageRate5) > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-2 py-0",
                        Number(availability.packageRate5) / 5 <
                          Number(availability.perSessionRate)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-500 border-gray-200",
                      )}
                    >
                      5-Pack:{" "}
                      {Math.round(
                        (1 -
                          Number(availability.packageRate5) /
                            5 /
                            Number(availability.perSessionRate)) *
                          100,
                      )}
                      % savings
                    </Badge>
                  )}
                  {Number(availability.packageRate10) > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-2 py-0",
                        Number(availability.packageRate10) / 10 <
                          Number(availability.perSessionRate)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-500 border-gray-200",
                      )}
                    >
                      10-Pack:{" "}
                      {Math.round(
                        (1 -
                          Number(availability.packageRate10) /
                            10 /
                            Number(availability.perSessionRate)) *
                          100,
                      )}
                      % savings
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          Save Confirmation Dialog
          ═══════════════════════════════════════════════════ */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Save className="h-4 w-4 text-[#003B95]" /> Save Availability &
              Pricing
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to save the coach's availability schedule (
              {hoursPerWeek} hours/week across{" "}
              {DAYS.filter((d) => dayStats[d] > 0).length} days) and pricing
              information. This will update the coach's booking settings
              immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingSection}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveSection}
              disabled={isSavingSection}
              className="bg-[#003B95] hover:bg-[#002d73] gap-1.5"
            >
              {isSavingSection ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" /> Confirm & Save
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
