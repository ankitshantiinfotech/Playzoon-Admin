// ─── Courts Management – Courts, Availability, Pricing, Subscriptions, Exceptions ───
// Implements all acceptance criteria for Facility Detail sub-tabs

import React, { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  AlertTriangle,
  Info,
  LayoutGrid,
  Clock,
  DollarSign,
  RefreshCw,
  CalendarDays,
  AlertCircle,
  Edit2,
  Save,
  Zap,
  ZapOff,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import {
  Facility,
  Court,
  CourtStatus,
  CourtSchedule,
  PricingRule,
  PricingModel,
  FacilitySubscriptionPlan,
  PlanDuration,
  FacilityException,
  ExceptionReason,
  ExceptionType,
  SlotStatus,
} from "./types";

// ─── Constants ────────────────────────────────────────────────

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const PLAN_DURATIONS: PlanDuration[] = [
  "Weekly",
  "Monthly",
  "Quarterly",
  "Semi-Annual",
  "Annual",
  "Custom",
];

const EXCEPTION_REASONS: ExceptionReason[] = [
  "Holiday",
  "Maintenance",
  "Special Event",
  "Other",
];

const TAB_ITEMS = [
  { key: "courts", label: "Courts / Sub-Facilities", icon: LayoutGrid },
  { key: "availability", label: "Availability", icon: Clock },
  { key: "pricing", label: "Pricing", icon: DollarSign },
  { key: "subscriptions", label: "Subscriptions", icon: RefreshCw },
  { key: "exceptions", label: "Exception Dates", icon: CalendarDays },
] as const;

type TabKey = (typeof TAB_ITEMS)[number]["key"];

// ─── Helpers ──────────────────────────────────────────────────

function generateTimeSlots(
  openTime: string,
  closeTime: string,
  durationMins: number = 60,
): string[] {
  const slots: string[] = [];
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  let startMins = oh * 60 + om;
  const endMins = ch * 60 + cm;
  while (startMins + durationMins <= endMins) {
    const sh = Math.floor(startMins / 60)
      .toString()
      .padStart(2, "0");
    const sm = (startMins % 60).toString().padStart(2, "0");
    const eh = Math.floor((startMins + durationMins) / 60)
      .toString()
      .padStart(2, "0");
    const em = ((startMins + durationMins) % 60).toString().padStart(2, "0");
    slots.push(`${sh}:${sm}\u2013${eh}:${em}`);
    startMins += durationMins;
  }
  return slots;
}

function isSlotInFacilityHours(
  slotStr: string,
  dayOpen: string,
  dayClose: string,
): boolean {
  const parts = slotStr.split("\u2013");
  if (parts.length < 2) return false;
  const slotStart = parts[0];
  const slotEnd = parts[1];
  return slotStart >= dayOpen && slotEnd <= dayClose;
}

function getCourtStatusBadgeCls(status: CourtStatus): string {
  if (status === "Available")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Under Maintenance")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

// ─── Section Wrapper ──────────────────────────────────────────

function SubSection({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  emptyText,
  isEmpty,
  errorText,
  isError,
  onRetry,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children?: React.ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
  errorText?: string;
  isError?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-[#003B95]/10 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-[#003B95]" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {isError ? (
        <div className="flex flex-col items-center gap-3 py-8 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-600">
            {errorText || "Failed to load. Please try again."}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-[#003B95] hover:underline font-medium"
            >
              Retry
            </button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-2 py-8 text-gray-400 bg-gray-50 border border-gray-200 rounded-xl">
          {Icon && <Icon className="w-8 h-8 text-gray-200" />}
          <p className="text-sm">{emptyText || "No items configured."}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────

function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Confirmation Modal ───────────────────────────────────────

function CourtStatusModal({
  courtName,
  currentStatus,
  onConfirm,
  onCancel,
}: {
  courtName: string;
  currentStatus: CourtStatus;
  onConfirm: (newStatus: CourtStatus) => void;
  onCancel: () => void;
}) {
  const newStatus: CourtStatus =
    currentStatus === "Available"
      ? "Under Maintenance"
      : currentStatus === "Under Maintenance"
        ? "Available"
        : "Available";
  const isActivating = newStatus === "Available";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4",
            isActivating ? "bg-emerald-50" : "bg-amber-50",
          )}
        >
          {isActivating ? (
            <Zap className="w-6 h-6 text-emerald-600" />
          ) : (
            <ZapOff className="w-6 h-6 text-amber-600" />
          )}
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-2">
          {isActivating ? "Activate Court?" : "Deactivate Court?"}
        </h3>
        <p className="text-sm font-semibold text-gray-800 text-center mb-1">
          {courtName}
        </p>
        <p className="text-xs text-gray-500 text-center mb-5">
          {isActivating
            ? "This court will become available for bookings."
            : "This court will be marked as inactive. Existing bookings remain unaffected."}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
          <Info className="w-3.5 h-3.5 shrink-0 text-blue-400" />
          This action will be logged in the Audit Trail.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(newStatus)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors",
              isActivating
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-amber-600 hover:bg-amber-700",
            )}
          >
            {isActivating ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Courts Tab ───────────────────────────────────────────────

function CourtsTab({
  facility,
  courts,
  onCourtsChange,
  addAuditEntry,
}: {
  facility: Facility;
  courts: Court[];
  onCourtsChange: (courts: Court[]) => void;
  addAuditEntry: (field: string, oldVal: string, newVal: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    courtId: string;
    name: string;
    status: CourtStatus;
  } | null>(null);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newSport, setNewSport] = useState(facility.sports[0]?.sport || "");
  const [newCapacity, setNewCapacity] = useState("4");
  const [formError, setFormError] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editSport, setEditSport] = useState("");
  const [editCapacity, setEditCapacity] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) {
      setFormError("Court name is required.");
      return;
    }
    if (!newSport) {
      setFormError("Sport type is required.");
      return;
    }
    const cap = parseInt(newCapacity) || 0;
    if (cap < 1 || cap > 1000) {
      setFormError("Capacity must be between 1 and 1000.");
      return;
    }

    const newCourt: Court = {
      id: `CRT-NEW-${Date.now()}`,
      name: newName.trim(),
      courtType:
        facility.sports.find((s) => s.sport === newSport)?.courtType ||
        "Standard",
      sport: newSport,
      stations: [],
      capacity: cap,
      isIndoor: facility.facilityType === "Indoor",
      amenities: [],
      status: "Available",
    };
    onCourtsChange([...courts, newCourt]);
    addAuditEntry("Court Added", "—", newCourt.name);
    toast.success(`Court "${newCourt.name}" added.`);
    setShowAddForm(false);
    setNewName("");
    setNewCapacity("4");
    setFormError("");
  };

  const startEdit = (court: Court) => {
    setEditingId(court.id);
    setEditName(court.name);
    setEditSport(court.sport);
    setEditCapacity(court.capacity.toString());
  };

  const handleSaveEdit = (courtId: string) => {
    if (!editName.trim()) {
      toast.error("Court name is required.");
      return;
    }
    const cap = parseInt(editCapacity) || 0;
    if (cap < 1 || cap > 1000) {
      toast.error("Capacity must be between 1 and 1000.");
      return;
    }
    const old = courts.find((c) => c.id === courtId);
    onCourtsChange(
      courts.map((c) =>
        c.id === courtId
          ? {
              ...c,
              name: editName.trim(),
              sport: editSport,
              capacity: cap,
              courtType:
                facility.sports.find((s) => s.sport === editSport)?.courtType ||
                c.courtType,
            }
          : c,
      ),
    );
    if (old) addAuditEntry("Court Updated", old.name, editName.trim());
    toast.success("Court updated.");
    setEditingId(null);
  };

  const handleDelete = (court: Court) => {
    onCourtsChange(courts.filter((c) => c.id !== court.id));
    addAuditEntry("Court Removed", court.name, "—");
    toast.success(`Court "${court.name}" removed.`);
  };

  const handleStatusConfirm = (newStatus: CourtStatus) => {
    if (!statusModal) return;
    onCourtsChange(
      courts.map((c) =>
        c.id === statusModal.courtId ? { ...c, status: newStatus } : c,
      ),
    );
    addAuditEntry(
      `Court Status — ${statusModal.name}`,
      statusModal.status,
      newStatus,
    );
    toast.success(`"${statusModal.name}" status changed to ${newStatus}.`);
    setStatusModal(null);
  };

  return (
    <SubSection
      title="Courts / Sub-Facilities"
      subtitle={`${courts.length} court${courts.length !== 1 ? "s" : ""} configured`}
      icon={LayoutGrid}
      isEmpty={courts.length === 0 && !showAddForm}
      emptyText="No courts or sub-facilities configured."
      action={
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003B95] text-white rounded-lg text-xs font-semibold hover:bg-[#002d75] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Court
        </button>
      }
    >
      {/* Add Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide">
            New Court / Sub-Facility
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Court Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setFormError("");
                }}
                placeholder="e.g. Court 1"
                maxLength={100}
                className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Court Type / Sport <span className="text-red-500">*</span>
              </label>
              <select
                value={newSport}
                onChange={(e) => setNewSport(e.target.value)}
                className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95] bg-white"
              >
                {facility.sports.map((s) => (
                  <option key={s.sport} value={s.sport}>
                    {s.sport} — {s.courtType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Capacity
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95]"
              />
            </div>
          </div>
          {formError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
            >
              <Save className="w-3.5 h-3.5" />
              Save Court
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormError("");
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Courts List */}
      {courts.length > 0 && (
        <div className="space-y-2">
          {courts.map((court) => (
            <div
              key={court.id}
              className={cn(
                "border rounded-xl p-4 transition-colors",
                court.status === "Under Maintenance"
                  ? "bg-amber-50/50 border-amber-200"
                  : court.status === "Disabled"
                    ? "bg-red-50/30 border-red-200"
                    : "bg-white border-gray-200 hover:border-gray-300",
              )}
            >
              {editingId === court.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">
                        Court Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">
                        Sport
                      </label>
                      <select
                        value={editSport}
                        onChange={(e) => setEditSport(e.target.value)}
                        className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95] bg-white"
                      >
                        {facility.sports.map((s) => (
                          <option key={s.sport} value={s.sport}>
                            {s.sport}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">
                        Capacity
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(e.target.value)}
                        className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(court.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">
                          {court.name}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {court.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-600">
                          {court.sport} — {court.courtType}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Capacity: {court.capacity}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-md border",
                            court.isIndoor
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-teal-50 text-teal-700 border-teal-200",
                          )}
                        >
                          {court.isIndoor ? "Indoor" : "Outdoor"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                        getCourtStatusBadgeCls(court.status),
                      )}
                    >
                      {court.status === "Under Maintenance" && (
                        <AlertTriangle className="w-2.5 h-2.5" />
                      )}
                      {court.status}
                    </span>
                    <button
                      onClick={() =>
                        setStatusModal({
                          courtId: court.id,
                          name: court.name,
                          status: court.status,
                        })
                      }
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
                        court.status === "Available"
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                      )}
                    >
                      {court.status === "Available" ? (
                        <>
                          <ZapOff className="w-3 h-3" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(court)}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors"
                      aria-label="Edit court"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(court)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition-colors"
                      aria-label="Delete court"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status confirmation modal */}
      {statusModal && (
        <CourtStatusModal
          courtName={statusModal.name}
          currentStatus={statusModal.status}
          onConfirm={handleStatusConfirm}
          onCancel={() => setStatusModal(null)}
        />
      )}
    </SubSection>
  );
}

// ─── Availability Tab ─────────────────────────────────────────

interface AvailabilitySlot {
  status: SlotStatus;
}

interface AvailabilityGrid {
  [day: string]: { [slotKey: string]: AvailabilitySlot };
}

function AvailabilityTab({
  facility,
  courts,
  availability,
  onAvailabilityChange,
}: {
  facility: Facility;
  courts: Court[];
  availability: CourtSchedule[];
  onAvailabilityChange: (avail: CourtSchedule[]) => void;
}) {
  const [selectedCourtIdx, setSelectedCourtIdx] = useState(0);
  const activeCourts = courts.filter((c) => c.status === "Available");

  // Build all possible time slots from facility hours
  const allSlots = useMemo(() => {
    const firstOpenDay = DAYS_OF_WEEK.find(
      (d) => !facility.operatingHours[d].closed,
    );
    if (!firstOpenDay) return generateTimeSlots("06:00", "22:00");
    return generateTimeSlots(
      facility.operatingHours[firstOpenDay].open,
      facility.operatingHours[firstOpenDay].close,
    );
  }, [facility.operatingHours]);

  // Build grid state for the selected court
  const selectedCourt = activeCourts[selectedCourtIdx];
  const courtSchedule = selectedCourt
    ? availability.find((a) => a.courtId === selectedCourt.id)
    : null;

  // Mock some booked slots for demo
  const bookedSlots = useMemo(() => {
    const set = new Set<string>();
    if (selectedCourt) {
      // Simulate some bookings on specific day+slot combos
      set.add("Tuesday|2");
      set.add("Wednesday|4");
      set.add("Thursday|3");
      set.add("Saturday|5");
      set.add("Saturday|6");
    }
    return set;
  }, [selectedCourt]);

  // Build a mutable grid from the schedule
  const [gridOverrides, setGridOverrides] = useState<
    Record<string, Record<string, SlotStatus>>
  >({});

  const getSlotStatus = useCallback(
    (day: string, slotIdx: number): SlotStatus => {
      // Check overrides first
      const courtId = selectedCourt?.id || "";
      const key = `${courtId}|${day}|${slotIdx}`;
      if (gridOverrides[courtId]?.[`${day}|${slotIdx}`]) {
        return gridOverrides[courtId][`${day}|${slotIdx}`];
      }
      // Check if booked
      if (bookedSlots.has(`${day}|${slotIdx}`)) return "booked";
      // Default from schedule
      return "available";
    },
    [selectedCourt, gridOverrides, bookedSlots],
  );

  const toggleSlot = useCallback(
    (day: string, slotIdx: number) => {
      if (!selectedCourt) return;
      const courtId = selectedCourt.id;
      // Check if booked
      if (bookedSlots.has(`${day}|${slotIdx}`)) return;
      // Check if outside facility hours
      const dayHours =
        facility.operatingHours[day as keyof typeof facility.operatingHours];
      if (dayHours.closed) return;
      const slot = allSlots[slotIdx];
      if (!slot) return;
      if (!isSlotInFacilityHours(slot, dayHours.open, dayHours.close)) return;

      setGridOverrides((prev) => {
        const courtGrid = { ...(prev[courtId] || {}) };
        const key = `${day}|${slotIdx}`;
        const current =
          courtGrid[key] ||
          (bookedSlots.has(`${day}|${slotIdx}`) ? "booked" : "available");
        courtGrid[key] = current === "available" ? "blocked" : "available";
        return { ...prev, [courtId]: courtGrid };
      });
    },
    [selectedCourt, bookedSlots, facility.operatingHours, allSlots],
  );

  if (activeCourts.length === 0) {
    return (
      <SubSection
        title="Availability Schedule"
        subtitle="Per-court weekly availability grid"
        icon={Clock}
        isEmpty
        emptyText="No availability set. Configure availability to enable bookings."
      />
    );
  }

  return (
    <SubSection
      title="Availability Schedule"
      subtitle="Click slots to toggle Available (green) / Blocked (red). Blue = Booked (non-togglable)."
      icon={Clock}
    >
      {/* Court selector */}
      <div className="flex flex-wrap gap-2 mb-2">
        {activeCourts.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setSelectedCourtIdx(i)}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
              i === selectedCourtIdx
                ? "bg-[#003B95] text-white border-[#003B95]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-[11px] text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-red-500" />
          <span className="text-[11px] text-gray-600">Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-[11px] text-gray-600">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-gray-200" />
          <span className="text-[11px] text-gray-600">Outside Hours</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 z-10 min-w-[90px]">
                Day
              </th>
              {allSlots.map((slot, si) => (
                <th
                  key={si}
                  className="px-1 py-2.5 text-center text-[9px] font-semibold text-gray-500 whitespace-nowrap min-w-[56px]"
                >
                  {slot.split("\u2013")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {DAYS_OF_WEEK.map((day) => {
              const dayHours = facility.operatingHours[day];
              return (
                <tr
                  key={day}
                  className={cn(dayHours.closed ? "opacity-40" : "")}
                >
                  <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-white z-10 text-xs">
                    {day.substring(0, 3)}
                    {dayHours.closed && (
                      <span className="text-[9px] text-red-500 ml-1">
                        Closed
                      </span>
                    )}
                  </td>
                  {allSlots.map((slot, si) => {
                    const outsideHours =
                      dayHours.closed ||
                      !isSlotInFacilityHours(
                        slot,
                        dayHours.open,
                        dayHours.close,
                      );
                    const status = outsideHours
                      ? "outside"
                      : getSlotStatus(day, si);
                    const isBooked = status === "booked";

                    return (
                      <td key={si} className="px-0.5 py-1.5 text-center">
                        <button
                          onClick={() =>
                            !outsideHours && !isBooked && toggleSlot(day, si)
                          }
                          disabled={outsideHours}
                          title={
                            outsideHours
                              ? "Outside facility hours"
                              : isBooked
                                ? "This slot has an active booking and cannot be blocked."
                                : status === "blocked"
                                  ? "Blocked — click to make available"
                                  : "Available — click to block"
                          }
                          className={cn(
                            "w-full h-7 rounded-md text-[9px] font-bold transition-all",
                            outsideHours &&
                              "bg-gray-100 text-gray-300 cursor-not-allowed",
                            status === "available" &&
                              "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer",
                            status === "blocked" &&
                              "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer",
                            status === "booked" &&
                              "bg-blue-100 text-blue-700 cursor-not-allowed",
                          )}
                        >
                          {outsideHours
                            ? "—"
                            : status === "available"
                              ? "A"
                              : status === "blocked"
                                ? "B"
                                : "BK"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SubSection>
  );
}

// ─── Pricing Tab ──────────────────────────────────────────────

interface PricingFormState {
  courtId: string;
  pricingModel: PricingModel;
  basePrice: string;
  peakPrice: string;
  offPeakPrice: string;
  peakHoursStart: string;
  peakHoursEnd: string;
  currency: string;
}

function PricingTab({
  facility,
  courts,
  pricing,
  onPricingChange,
  addAuditEntry,
}: {
  facility: Facility;
  courts: Court[];
  pricing: PricingRule[];
  onPricingChange: (pricing: PricingRule[]) => void;
  addAuditEntry: (field: string, oldVal: string, newVal: string) => void;
}) {
  const [editingCourt, setEditingCourt] = useState<string | null>(null);
  const [form, setForm] = useState<PricingFormState>({
    courtId: "",
    pricingModel: "Peak/Off-Peak",
    basePrice: "",
    peakPrice: "",
    offPeakPrice: "",
    peakHoursStart: "",
    peakHoursEnd: "",
    currency: "AED",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const startEdit = (courtId: string) => {
    const rule = pricing.find((p) => p.courtId === courtId);
    const model = rule?.pricingModel || "Peak/Off-Peak";
    setForm({
      courtId,
      pricingModel: model,
      basePrice: (rule?.basePrice ?? rule?.offPeakPrice ?? 0).toString(),
      peakPrice: (rule?.peakPrice ?? 0).toString(),
      offPeakPrice: (rule?.offPeakPrice ?? 0).toString(),
      peakHoursStart: rule?.peakHoursStart || "09:00",
      peakHoursEnd: rule?.peakHoursEnd || "17:00",
      currency: rule?.currency || "AED",
    });
    setErrors({});
    setEditingCourt(courtId);
  };

  const validateAndSave = () => {
    const newErrors: Record<string, string> = {};
    const base = parseFloat(form.basePrice);
    if (isNaN(base) || base <= 0)
      newErrors.basePrice = "Base price is required and must be positive.";

    if (form.pricingModel === "Peak/Off-Peak") {
      const peak = parseFloat(form.peakPrice);
      const offPeak = parseFloat(form.offPeakPrice);
      if (isNaN(peak) || peak <= 0)
        newErrors.peakPrice = "Peak price is required.";
      if (isNaN(offPeak) || offPeak <= 0)
        newErrors.offPeakPrice = "Off-peak price is required.";
      if (!form.peakHoursStart || !form.peakHoursEnd)
        newErrors.peakHours = "Peak hours are required.";
      else if (form.peakHoursStart >= form.peakHoursEnd)
        newErrors.peakHours = "Start must be before end.";
      // Validate peak hours within facility hours
      const firstOpen = DAYS_OF_WEEK.find(
        (d) => !facility.operatingHours[d].closed,
      );
      if (firstOpen) {
        const fOpen = facility.operatingHours[firstOpen].open;
        const fClose = facility.operatingHours[firstOpen].close;
        if (form.peakHoursStart < fOpen || form.peakHoursEnd > fClose) {
          newErrors.peakHours = `Peak hours must be within facility hours (${fOpen}–${fClose}).`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const court = courts.find((c) => c.id === form.courtId);
    const existing = pricing.find((p) => p.courtId === form.courtId);
    const updated: PricingRule = {
      courtId: form.courtId,
      courtName: court?.name || "",
      pricingModel: form.pricingModel,
      slotDuration: existing?.slotDuration || 60,
      basePrice: parseFloat(form.basePrice),
      peakPrice:
        form.pricingModel === "Peak/Off-Peak"
          ? parseFloat(form.peakPrice)
          : parseFloat(form.basePrice),
      offPeakPrice:
        form.pricingModel === "Peak/Off-Peak"
          ? parseFloat(form.offPeakPrice)
          : parseFloat(form.basePrice),
      weekendPrice: existing?.weekendPrice || parseFloat(form.basePrice),
      currency: form.currency,
      peakHoursStart:
        form.pricingModel === "Peak/Off-Peak" ? form.peakHoursStart : undefined,
      peakHoursEnd:
        form.pricingModel === "Peak/Off-Peak" ? form.peakHoursEnd : undefined,
      minBookingSlots: existing?.minBookingSlots || 1,
      maxBookingSlots: existing?.maxBookingSlots || 3,
      advanceBookingDays: existing?.advanceBookingDays || 14,
      cancellationHours: existing?.cancellationHours || 24,
    };

    if (existing) {
      onPricingChange(
        pricing.map((p) => (p.courtId === form.courtId ? updated : p)),
      );
    } else {
      onPricingChange([...pricing, updated]);
    }
    addAuditEntry(
      `Pricing — ${court?.name}`,
      existing ? "Updated" : "Created",
      `${form.pricingModel}, Base: ${form.basePrice} ${form.currency}`,
    );
    toast.success(`Pricing updated for "${court?.name}".`);
    setEditingCourt(null);
  };

  return (
    <SubSection
      title="Pricing Configuration"
      subtitle="Configure pricing model per court. Select a court to edit its pricing."
      icon={DollarSign}
      isEmpty={courts.length === 0}
      emptyText="No courts available to configure pricing."
    >
      <div className="space-y-3">
        {courts.map((court) => {
          const rule = pricing.find((p) => p.courtId === court.id);
          const model = rule?.pricingModel || "Peak/Off-Peak";
          const isEditing = editingCourt === court.id;

          return (
            <div
              key={court.id}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">
                    {court.name}
                  </span>
                  <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                    {court.sport}
                  </span>
                  {rule && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      {model}
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    isEditing ? setEditingCourt(null) : startEdit(court.id)
                  }
                  className="flex items-center gap-1 text-xs font-medium text-[#003B95] hover:underline"
                >
                  <Edit2 className="w-3 h-3" />
                  {isEditing ? "Close" : "Edit Pricing"}
                </button>
              </div>

              {/* Read-only summary */}
              {!isEditing && rule && (
                <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">
                      Base Price
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {rule.currency}{" "}
                      {(rule.basePrice ?? rule.offPeakPrice).toLocaleString()}
                    </p>
                  </div>
                  {model === "Peak/Off-Peak" && (
                    <>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">
                          Peak Price
                        </p>
                        <p className="text-sm font-bold text-red-700">
                          {rule.currency} {rule.peakPrice.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">
                          Off-Peak Price
                        </p>
                        <p className="text-sm font-bold text-emerald-700">
                          {rule.currency} {rule.offPeakPrice.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">
                          Peak Hours
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          {rule.peakHoursStart || "09:00"} –{" "}
                          {rule.peakHoursEnd || "17:00"}
                        </p>
                      </div>
                    </>
                  )}
                  {model !== "Peak/Off-Peak" && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">
                        Slot Duration
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {rule.slotDuration} min
                      </p>
                    </div>
                  )}
                </div>
              )}
              {!isEditing && !rule && (
                <div className="px-4 py-3 text-sm text-gray-400">
                  No pricing configured. Click "Edit Pricing" to set up.
                </div>
              )}

              {/* Edit form */}
              {isEditing && (
                <div className="px-4 py-4 space-y-4 bg-blue-50/30">
                  {/* Pricing Model */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">
                      Pricing Model <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {(
                        [
                          "Per Session",
                          "Hourly",
                          "Peak/Off-Peak",
                        ] as PricingModel[]
                      ).map((model) => (
                        <label
                          key={model}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors",
                            form.pricingModel === model
                              ? "bg-[#003B95] text-white border-[#003B95]"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                          )}
                        >
                          <input
                            type="radio"
                            name="pricingModel"
                            value={model}
                            checked={form.pricingModel === model}
                            onChange={() =>
                              setForm((f) => ({ ...f, pricingModel: model }))
                            }
                            className="hidden"
                          />
                          {model}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Base Price — always visible */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">
                        Base Price <span className="text-red-500">*</span>
                      </label>
                      <div className="flex mt-1">
                        <span className="h-10 px-3 flex items-center bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs font-semibold text-gray-600">
                          {form.currency}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={form.basePrice}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              basePrice: e.target.value,
                            }))
                          }
                          className={cn(
                            "flex-1 h-10 px-3 text-sm border rounded-r-lg outline-none transition-colors",
                            errors.basePrice
                              ? "border-red-400 bg-red-50/30"
                              : "border-gray-300 focus:border-[#003B95]",
                          )}
                        />
                      </div>
                      {errors.basePrice && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.basePrice}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">
                        Currency
                      </label>
                      <select
                        value={form.currency}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, currency: e.target.value }))
                        }
                        className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95] bg-white"
                      >
                        {["AED", "SAR", "QAR", "OMR", "USD"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Peak/Off-Peak conditional fields */}
                  {form.pricingModel === "Peak/Off-Peak" && (
                    <div className="space-y-4 bg-amber-50/50 rounded-xl p-4 border border-amber-200">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                        Peak / Off-Peak Configuration
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700">
                            Peak Price <span className="text-red-500">*</span>
                          </label>
                          <div className="flex mt-1">
                            <span className="h-10 px-3 flex items-center bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs font-semibold text-gray-600">
                              {form.currency}
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={form.peakPrice}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  peakPrice: e.target.value,
                                }))
                              }
                              className={cn(
                                "flex-1 h-10 px-3 text-sm border rounded-r-lg outline-none",
                                errors.peakPrice
                                  ? "border-red-400 bg-red-50/30"
                                  : "border-gray-300 focus:border-[#003B95]",
                              )}
                            />
                          </div>
                          {errors.peakPrice && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.peakPrice}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700">
                            Off-Peak Price{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="flex mt-1">
                            <span className="h-10 px-3 flex items-center bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs font-semibold text-gray-600">
                              {form.currency}
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={form.offPeakPrice}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  offPeakPrice: e.target.value,
                                }))
                              }
                              className={cn(
                                "flex-1 h-10 px-3 text-sm border rounded-r-lg outline-none",
                                errors.offPeakPrice
                                  ? "border-red-400 bg-red-50/30"
                                  : "border-gray-300 focus:border-[#003B95]",
                              )}
                            />
                          </div>
                          {errors.offPeakPrice && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.offPeakPrice}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">
                          Peak Hours Definition{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="time"
                            value={form.peakHoursStart}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                peakHoursStart: e.target.value,
                              }))
                            }
                            className={cn(
                              "h-10 px-3 text-sm border rounded-lg outline-none font-mono",
                              errors.peakHours
                                ? "border-red-400 bg-red-50/30"
                                : "border-gray-300 focus:border-[#003B95]",
                            )}
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <input
                            type="time"
                            value={form.peakHoursEnd}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                peakHoursEnd: e.target.value,
                              }))
                            }
                            className={cn(
                              "h-10 px-3 text-sm border rounded-lg outline-none font-mono",
                              errors.peakHours
                                ? "border-red-400 bg-red-50/30"
                                : "border-gray-300 focus:border-[#003B95]",
                            )}
                          />
                        </div>
                        {errors.peakHours && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.peakHours}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Save / Cancel */}
                  <div className="flex gap-2">
                    <button
                      onClick={validateAndSave}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Pricing
                    </button>
                    <button
                      onClick={() => {
                        setEditingCourt(null);
                        setErrors({});
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SubSection>
  );
}

// ─── Subscriptions Tab ────────────────────────────────────────

function SubscriptionsTab({
  plans,
  onPlansChange,
  addAuditEntry,
  currency,
}: {
  plans: FacilitySubscriptionPlan[];
  onPlansChange: (plans: FacilitySubscriptionPlan[]) => void;
  addAuditEntry: (field: string, oldVal: string, newVal: string) => void;
  currency: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDuration, setFormDuration] = useState<PlanDuration>("Monthly");
  const [formPrice, setFormPrice] = useState("");
  const [formBenefits, setFormBenefits] = useState("");
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormDuration("Monthly");
    setFormPrice("");
    setFormBenefits("");
    setFormError("");
  };

  const handleAdd = () => {
    if (!formName.trim()) {
      setFormError("Plan name is required.");
      return;
    }
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      setFormError("Price must be a positive number.");
      return;
    }

    const plan: FacilitySubscriptionPlan = {
      id: `SPL-NEW-${Date.now()}`,
      planName: formName.trim(),
      planType: "Unlimited",
      duration: formDuration,
      sessionsIncluded: "Unlimited",
      price,
      currency,
      autoRenew: true,
      activeSubscribers: 0,
      status: "Active",
    };
    onPlansChange([...plans, plan]);
    addAuditEntry("Subscription Plan Added", "—", plan.planName);
    toast.success(`Plan "${plan.planName}" created.`);
    setShowAdd(false);
    resetForm();
  };

  const startEdit = (plan: FacilitySubscriptionPlan) => {
    setEditId(plan.id);
    setFormName(plan.planName);
    setFormDuration(plan.duration);
    setFormPrice(plan.price.toString());
    setFormBenefits("");
    setFormError("");
  };

  const handleSaveEdit = () => {
    if (!formName.trim()) {
      setFormError("Plan name is required.");
      return;
    }
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      setFormError("Price must be positive.");
      return;
    }

    onPlansChange(
      plans.map((p) =>
        p.id === editId
          ? { ...p, planName: formName.trim(), duration: formDuration, price }
          : p,
      ),
    );
    addAuditEntry("Subscription Plan Updated", editId || "", formName.trim());
    toast.success("Plan updated.");
    setEditId(null);
    resetForm();
  };

  const toggleStatus = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const newStatus = plan.status === "Active" ? "Inactive" : "Active";
    onPlansChange(
      plans.map((p) => (p.id === planId ? { ...p, status: newStatus } : p)),
    );
    addAuditEntry(`Plan Status — ${plan.planName}`, plan.status, newStatus);
    toast.success(`"${plan.planName}" is now ${newStatus}.`);
  };

  const handleDelete = (plan: FacilitySubscriptionPlan) => {
    onPlansChange(plans.filter((p) => p.id !== plan.id));
    addAuditEntry("Subscription Plan Removed", plan.planName, "—");
    toast.success(`Plan "${plan.planName}" removed.`);
  };

  return (
    <SubSection
      title="Subscription Plans"
      subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""}`}
      icon={RefreshCw}
      isEmpty={plans.length === 0 && !showAdd}
      emptyText="No subscription plans."
      action={
        <button
          onClick={() => {
            setShowAdd(true);
            resetForm();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003B95] text-white rounded-lg text-xs font-semibold hover:bg-[#002d75]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Plan
        </button>
      }
    >
      {/* Add form */}
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide">
            New Subscription Plan
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setFormError("");
                }}
                placeholder="e.g. Monthly Unlimited"
                maxLength={100}
                className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                value={formDuration}
                onChange={(e) =>
                  setFormDuration(e.target.value as PlanDuration)
                }
                className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95] bg-white"
              >
                {PLAN_DURATIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="flex mt-1">
                <span className="h-10 px-3 flex items-center bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs font-semibold text-gray-600">
                  {currency}
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formPrice}
                  onChange={(e) => {
                    setFormPrice(e.target.value);
                    setFormError("");
                  }}
                  className="flex-1 h-10 px-3 text-sm border border-gray-300 rounded-r-lg outline-none focus:border-[#003B95]"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">
              Benefits (optional)
            </label>
            <textarea
              value={formBenefits}
              onChange={(e) => setFormBenefits(e.target.value)}
              placeholder="List benefits, one per line..."
              rows={2}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95] resize-none"
            />
          </div>
          {formError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
            >
              <Save className="w-3.5 h-3.5" />
              Create Plan
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                resetForm();
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plans list */}
      {plans.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Plan Name",
                  "Duration",
                  "Price",
                  "Subscribers",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50/60">
                  {editId === plan.id ? (
                    <>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full h-8 px-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95]"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={formDuration}
                          onChange={(e) =>
                            setFormDuration(e.target.value as PlanDuration)
                          }
                          className="h-8 px-2 text-sm border border-gray-300 rounded-lg bg-white"
                        >
                          {PLAN_DURATIONS.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          className="w-24 h-8 px-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95]"
                        />
                      </td>
                      <td className="px-3 py-3 text-center text-gray-500">
                        {plan.activeSubscribers}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                            plan.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveEdit}
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditId(null);
                              resetForm();
                            }}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-3 font-semibold text-gray-900">
                        {plan.planName}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {plan.duration}
                      </td>
                      <td className="px-3 py-3 font-bold text-gray-900 tabular-nums">
                        {plan.currency} {plan.price.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums font-semibold text-gray-700">
                        {plan.activeSubscribers}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleStatus(plan.id)}
                          className={cn(
                            "text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors",
                            plan.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                          )}
                        >
                          {plan.status}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(plan)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(plan)}
                            className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SubSection>
  );
}

// ─── Exception Dates Tab ──────────────────────────────────────

function ExceptionsTab({
  exceptions,
  onExceptionsChange,
  addAuditEntry,
}: {
  exceptions: FacilityException[];
  onExceptionsChange: (exceptions: FacilityException[]) => void;
  addAuditEntry: (field: string, oldVal: string, newVal: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formReason, setFormReason] = useState<string>("Holiday");
  const [formType, setFormType] = useState<ExceptionType>("Full Day");
  const [formStartTime, setFormStartTime] = useState("08:00");
  const [formEndTime, setFormEndTime] = useState("18:00");
  const [formError, setFormError] = useState("");

  const handleAdd = () => {
    if (!formDate) {
      setFormError("Exception date is required.");
      return;
    }
    // No past dates
    const today = new Date().toISOString().split("T")[0];
    if (formDate < today) {
      setFormError("Exception date cannot be in the past.");
      return;
    }
    // No duplicates
    if (exceptions.some((e) => e.date === formDate)) {
      setFormError("An exception already exists for this date.");
      return;
    }
    if (formType === "Partial Closure") {
      if (!formStartTime || !formEndTime) {
        setFormError("Start and end times are required for partial closure.");
        return;
      }
      if (formStartTime >= formEndTime) {
        setFormError("Start time must be before end time.");
        return;
      }
    }

    const ex: FacilityException = {
      id: `EX-NEW-${Date.now()}`,
      date: formDate,
      reason: formReason,
      affectedCourts: "All Courts",
      isFullDay: formType === "Full Day",
      type: formType,
      startTime: formType === "Partial Closure" ? formStartTime : undefined,
      endTime: formType === "Partial Closure" ? formEndTime : undefined,
      blockedSlots:
        formType === "Partial Closure"
          ? `${formStartTime}–${formEndTime}`
          : undefined,
      playersNotified: false,
    };
    onExceptionsChange([...exceptions, ex]);
    addAuditEntry("Exception Date Added", "—", `${formDate} — ${formReason}`);
    toast.success(
      `Exception added for ${format(new Date(formDate), "dd MMM yyyy")}.`,
    );
    setShowAdd(false);
    setFormDate("");
    setFormError("");
  };

  const handleDelete = (ex: FacilityException) => {
    onExceptionsChange(exceptions.filter((e) => e.id !== ex.id));
    addAuditEntry("Exception Date Removed", `${ex.date} — ${ex.reason}`, "—");
    toast.success("Exception removed.");
  };

  return (
    <SubSection
      title="Exception Dates"
      subtitle="Holidays, maintenance, and special events that override normal availability."
      icon={CalendarDays}
      isEmpty={exceptions.length === 0 && !showAdd}
      emptyText="No exception dates."
      action={
        <button
          onClick={() => {
            setShowAdd(true);
            setFormError("");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003B95] text-white rounded-lg text-xs font-semibold hover:bg-[#002d75]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Exception
        </button>
      }
    >
      {/* Add form */}
      {showAdd && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide">
            New Exception Date
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => {
                  setFormDate(e.target.value);
                  setFormError("");
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95] bg-white"
              >
                {EXCEPTION_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Exception Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mt-1">
                {(["Full Day", "Partial Closure"] as ExceptionType[]).map(
                  (t) => (
                    <label
                      key={t}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors",
                        formType === t
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                      )}
                    >
                      <input
                        type="radio"
                        name="exceptionType"
                        value={t}
                        checked={formType === t}
                        onChange={() => setFormType(t)}
                        className="hidden"
                      />
                      {t}
                    </label>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Partial closure time pickers */}
          {formType === "Partial Closure" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white rounded-lg p-3 border border-amber-200">
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95] font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full mt-1 h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#003B95] font-mono"
                />
              </div>
            </div>
          )}

          {formError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700"
            >
              <Save className="w-3.5 h-3.5" />
              Add Exception
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setFormError("");
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Exceptions list */}
      {exceptions.length > 0 && (
        <div className="space-y-2">
          {exceptions.map((ex) => (
            <div
              key={ex.id}
              className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">
                    {format(new Date(ex.date), "EEEE, dd MMM yyyy")}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      ex.isFullDay
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {ex.isFullDay ? "Full Day" : "Partial Closure"}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {ex.reason}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      ex.playersNotified
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700",
                    )}
                  >
                    Players {ex.playersNotified ? "Notified" : "NOT Notified"}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Affected: {ex.affectedCourts}
                </p>
                {!ex.isFullDay &&
                  (ex.blockedSlots || (ex.startTime && ex.endTime)) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Blocked:{" "}
                      {ex.blockedSlots || `${ex.startTime}–${ex.endTime}`}
                    </p>
                  )}
              </div>
              <button
                onClick={() => handleDelete(ex)}
                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-100 text-red-500 transition-colors shrink-0"
                aria-label="Remove exception"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SubSection>
  );
}

// ─── Main CourtsManagement Component ──────────────────────────

interface CourtsManagementProps {
  facility: Facility;
  onFacilityUpdate: (updates: Partial<Facility>) => void;
  addAuditEntry: (field: string, oldVal: string, newVal: string) => void;
}

export function CourtsManagement({
  facility,
  onFacilityUpdate,
  addAuditEntry,
}: CourtsManagementProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("courts");
  const [isLoading, setIsLoading] = useState(false);

  // Local state derived from facility
  const [courts, setCourts] = useState<Court[]>(facility.courts);
  const [availability, setAvailability] = useState<CourtSchedule[]>(
    facility.availability,
  );
  const [pricing, setPricing] = useState<PricingRule[]>(facility.pricing);
  const [plans, setPlans] = useState<FacilitySubscriptionPlan[]>(
    facility.subscriptionPlans,
  );
  const [exceptions, setExceptions] = useState<FacilityException[]>(
    facility.exceptionDates,
  );

  // Propagate changes up
  const handleCourtsChange = useCallback(
    (newCourts: Court[]) => {
      setCourts(newCourts);
      onFacilityUpdate({ courts: newCourts });
    },
    [onFacilityUpdate],
  );

  const handleAvailabilityChange = useCallback(
    (newAvail: CourtSchedule[]) => {
      setAvailability(newAvail);
      onFacilityUpdate({ availability: newAvail });
    },
    [onFacilityUpdate],
  );

  const handlePricingChange = useCallback(
    (newPricing: PricingRule[]) => {
      setPricing(newPricing);
      onFacilityUpdate({ pricing: newPricing });
    },
    [onFacilityUpdate],
  );

  const handlePlansChange = useCallback(
    (newPlans: FacilitySubscriptionPlan[]) => {
      setPlans(newPlans);
      onFacilityUpdate({ subscriptionPlans: newPlans });
    },
    [onFacilityUpdate],
  );

  const handleExceptionsChange = useCallback(
    (newExceptions: FacilityException[]) => {
      setExceptions(newExceptions);
      onFacilityUpdate({ exceptionDates: newExceptions });
    },
    [onFacilityUpdate],
  );

  const currency = facility.pricing[0]?.currency || "AED";

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#003B95]/10 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-4 h-4 text-[#003B95]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Courts, Availability & Pricing
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Manage courts, schedules, pricing models, subscriptions, and
              exception dates.
            </p>
          </div>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
          {courts.length} court{courts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 px-5 bg-gray-50/50">
        <div className="flex gap-0 overflow-x-auto">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors",
                  isActive
                    ? "text-[#003B95] border-[#003B95]"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {isLoading ? (
          <TabSkeleton />
        ) : (
          <>
            {activeTab === "courts" && (
              <CourtsTab
                facility={facility}
                courts={courts}
                onCourtsChange={handleCourtsChange}
                addAuditEntry={addAuditEntry}
              />
            )}
            {activeTab === "availability" && (
              <AvailabilityTab
                facility={facility}
                courts={courts}
                availability={availability}
                onAvailabilityChange={handleAvailabilityChange}
              />
            )}
            {activeTab === "pricing" && (
              <PricingTab
                facility={facility}
                courts={courts}
                pricing={pricing}
                onPricingChange={handlePricingChange}
                addAuditEntry={addAuditEntry}
              />
            )}
            {activeTab === "subscriptions" && (
              <SubscriptionsTab
                plans={plans}
                onPlansChange={handlePlansChange}
                addAuditEntry={addAuditEntry}
                currency={currency}
              />
            )}
            {activeTab === "exceptions" && (
              <ExceptionsTab
                exceptions={exceptions}
                onExceptionsChange={handleExceptionsChange}
                addAuditEntry={addAuditEntry}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
