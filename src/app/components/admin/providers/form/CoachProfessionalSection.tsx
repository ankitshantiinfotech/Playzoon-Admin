// ─── US-4.3.4 — Coach Professional Information Section ──────
// Specializations, bio, experience cards (add/remove/collapse),
// certifications, service area (map-like), preferred facilities,
// and minimum coaching hours.

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Briefcase,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MapPin,
  Building2,
  Clock,
  Search,
  CalendarIcon,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Target,
  Crosshair,
  Award,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Checkbox } from "../../../ui/checkbox";
import { Calendar } from "../../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { Slider } from "../../../ui/slider";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface ExperienceEntry {
  id: string;
  organization: string;
  role: string;
  startDate: Date | null;
  endDate: Date | null;
  isPresent: boolean;
  description: string;
  collapsed: boolean;
}

export interface ServiceArea {
  latitude: string;
  longitude: string;
  radiusKm: number;
  locationName: string;
}

export interface CoachProfessionalState {
  specializations: string[];
  yearsOfExperience: string;
  bio: string;
  experiences: ExperienceEntry[];
  certificationNames: string[];
  serviceArea: ServiceArea;
  preferredFacilities: string[];
  minCoachingHours: number;
}

// ═══════════════════════════════════════════════════════════════
// Constants / Master Data
// ═══════════════════════════════════════════════════════════════

export const SPECIALIZATIONS = [
  "Personal Training",
  "Strength & Conditioning",
  "Yoga",
  "Pilates",
  "CrossFit",
  "Swimming",
  "Football",
  "Basketball",
  "Tennis",
  "Martial Arts",
  "Boxing",
  "Running & Athletics",
  "Cycling",
  "Dance Fitness",
  "HIIT",
  "Calisthenics",
  "Nutrition Coaching",
  "Weight Loss",
  "Bodybuilding",
  "Rehabilitation",
  "Kids Fitness",
  "Senior Fitness",
  "Prenatal/Postnatal",
  "Sports Psychology",
  "Golf",
  "Padel",
  "Cricket",
  "Volleyball",
  "Table Tennis",
] as const;

export const MOCK_FACILITIES = [
  { id: "fac-001", name: "Playzoon Sports Arena", status: "Active" as const },
  { id: "fac-002", name: "Elite Fitness Center", status: "Active" as const },
  { id: "fac-003", name: "Dubai Sports Complex", status: "Active" as const },
  { id: "fac-004", name: "Abu Dhabi Aquatics Club", status: "Active" as const },
  { id: "fac-005", name: "Sharjah Tennis Academy", status: "Active" as const },
  { id: "fac-006", name: "RAK Community Gym", status: "Inactive" as const },
  {
    id: "fac-007",
    name: "Ajman Multi-Sport Center",
    status: "Active" as const,
  },
  { id: "fac-008", name: "Al Ain Football Club", status: "Active" as const },
];

const ACTIVE_FACILITIES = MOCK_FACILITIES.filter((f) => f.status === "Active");

export const CERTIFICATION_OPTIONS = [
  "NASM Certified Personal Trainer",
  "ACE Personal Trainer Certification",
  "ISSA Certified Fitness Trainer",
  "NSCA Certified Strength & Conditioning Specialist",
  "Yoga Alliance RYT-200",
  "Yoga Alliance RYT-500",
  "Pilates Method Alliance Certified",
  "CrossFit Level 1 Trainer",
  "CrossFit Level 2 Trainer",
  "First Aid / CPR Certified",
  "Sports Nutrition Certification",
  "UAE Sports Council License",
  "REPS UAE Registered",
  "Other",
] as const;

const MIN_HOURS_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

// ═══════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════

export function createInitialProfessional(): CoachProfessionalState {
  return {
    specializations: [],
    yearsOfExperience: "",
    bio: "",
    experiences: [],
    certificationNames: [],
    serviceArea: {
      latitude: "25.2048",
      longitude: "55.2708",
      radiusKm: 15,
      locationName: "Dubai, UAE",
    },
    preferredFacilities: [],
    minCoachingHours: 1,
  };
}

// Pre-filled for FC-001
export function getMockProfessional(id: string): CoachProfessionalState {
  if (id === "FC-001") {
    return {
      specializations: ["Personal Training", "Strength & Conditioning", "HIIT"],
      yearsOfExperience: "8",
      bio: "Certified personal trainer with 8+ years of experience specializing in strength & conditioning, HIIT, and functional fitness. Passionate about helping clients achieve their fitness goals through personalized training programs.",
      experiences: [
        {
          id: "exp-1",
          organization: "Elite Fitness Center",
          role: "Senior Personal Trainer",
          startDate: new Date(2019, 0, 1),
          endDate: null,
          isPresent: true,
          description:
            "Leading personal training programs, managing a team of 5 junior trainers, and developing customized fitness plans for 30+ clients.",
          collapsed: false,
        },
        {
          id: "exp-2",
          organization: "Gold's Gym Dubai",
          role: "Personal Trainer",
          startDate: new Date(2016, 5, 1),
          endDate: new Date(2018, 11, 31),
          isPresent: false,
          description:
            "Provided one-on-one training sessions, group fitness classes, and nutritional guidance.",
          collapsed: true,
        },
      ],
      certificationNames: [
        "NASM Certified Personal Trainer",
        "CrossFit Level 1 Trainer",
        "First Aid / CPR Certified",
      ],
      serviceArea: {
        latitude: "25.2048",
        longitude: "55.2708",
        radiusKm: 20,
        locationName: "Dubai, UAE",
      },
      preferredFacilities: ["fac-001", "fac-002"],
      minCoachingHours: 2,
    };
  }
  if (id === "FC-002") {
    return {
      specializations: ["Yoga", "Pilates", "Prenatal/Postnatal"],
      yearsOfExperience: "5",
      bio: "Certified yoga instructor with deep expertise in Hatha and Vinyasa styles. Special focus on prenatal and postnatal wellness programs.",
      experiences: [
        {
          id: "exp-1",
          organization: "Zen Yoga Studio",
          role: "Lead Yoga Instructor",
          startDate: new Date(2021, 2, 1),
          endDate: null,
          isPresent: true,
          description:
            "Teaching daily yoga classes, workshops, and teacher training programs.",
          collapsed: false,
        },
      ],
      certificationNames: [
        "Yoga Alliance RYT-500",
        "Pilates Method Alliance Certified",
      ],
      serviceArea: {
        latitude: "25.2048",
        longitude: "55.2708",
        radiusKm: 10,
        locationName: "Dubai Marina",
      },
      preferredFacilities: ["fac-003"],
      minCoachingHours: 1,
    };
  }
  return createInitialProfessional();
}

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════

export type ProfessionalErrors = Partial<Record<string, string>>;

export function validateProfessional(
  state: CoachProfessionalState,
): ProfessionalErrors {
  const errors: ProfessionalErrors = {};
  if (state.specializations.length === 0)
    errors.specializations = "At least one specialization is required";
  if (!state.yearsOfExperience.trim())
    errors.yearsOfExperience = "Years of experience is required";
  else if (
    isNaN(Number(state.yearsOfExperience)) ||
    Number(state.yearsOfExperience) < 0
  )
    errors.yearsOfExperience = "Must be a valid number";
  if (!state.bio.trim()) errors.bio = "Bio is required";
  else if (state.bio.trim().length < 20)
    errors.bio = "Bio must be at least 20 characters";

  // Experience cross-validation
  state.experiences.forEach((exp, i) => {
    if (!exp.organization.trim())
      errors[`exp-${i}-org`] = "Organization is required";
    if (!exp.role.trim()) errors[`exp-${i}-role`] = "Role is required";
    if (!exp.startDate) errors[`exp-${i}-start`] = "Start date is required";
    if (!exp.isPresent && !exp.endDate)
      errors[`exp-${i}-end`] = "End date is required";
    if (
      exp.startDate &&
      exp.endDate &&
      !exp.isPresent &&
      exp.endDate < exp.startDate
    ) {
      errors[`exp-${i}-end`] = "End date must be after start date";
    }
  });

  return errors;
}

// ═══════════════════════════════════════════════════════════════
// Helper: genId
// ═══════════════════════════════════════════════════════════════

function genId() {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ═══════════════════════════════════════════════════════════════
// Multi-select with tags (for specializations & certs)
// ═══════════════════════════════════════════════════════════════

function TagMultiSelect({
  label,
  icon,
  values,
  options,
  placeholder,
  onChange,
  error,
  required,
}: {
  label: string;
  icon: React.ReactNode;
  values: string[];
  options: readonly string[];
  placeholder: string;
  onChange: (vals: string[]) => void;
  error?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        (!search.trim() || o.toLowerCase().includes(q)) && !values.includes(o),
    );
  }, [search, options, values]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative space-y-1.5">
      <Label className="text-sm text-[#374151] flex items-center gap-1.5">
        {icon} {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full min-h-[36px] px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-gray-50 transition-colors text-left",
          error && "border-red-300 ring-1 ring-red-200",
          open && !error && "ring-2 ring-[#003B95]/20 border-[#003B95]",
        )}
      >
        <span className={values.length ? "text-[#111827]" : "text-[#9CA3AF]"}>
          {values.length ? `${values.length} selected` : placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge
              key={v}
              variant="outline"
              className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 gap-1"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="hover:bg-blue-100 rounded-full p-0.5 -mr-1"
                aria-label={`Remove ${v}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {open && (
        <div className="absolute z-50 top-[calc(100%-8px)] left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-2 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-[#003B95]/30"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-44">
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange([...values, opt]);
                  setSearch("");
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                {opt}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                {values.length === options.length
                  ? "All options selected"
                  : "No results found"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Facility Multi-Select (active only)
// ═══════════════════════════════════════════════════════════════

function FacilityMultiSelect({
  values,
  onChange,
}: {
  values: string[];
  onChange: (vals: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ACTIVE_FACILITIES.filter(
      (f) => !search.trim() || f.name.toLowerCase().includes(q),
    );
  }, [search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (id: string) => {
    if (values.includes(id)) onChange(values.filter((v) => v !== id));
    else onChange([...values, id]);
  };

  return (
    <div ref={ref} className="relative space-y-1.5">
      <Label className="text-sm text-[#374151] flex items-center gap-1.5">
        <Building2 className="h-4 w-4 text-indigo-500" /> Preferred Facilities
      </Label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full min-h-[36px] px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-gray-50 transition-colors text-left",
          open && "ring-2 ring-[#003B95]/20 border-[#003B95]",
        )}
      >
        <span className={values.length ? "text-[#111827]" : "text-[#9CA3AF]"}>
          {values.length
            ? `${values.length} facilit${values.length === 1 ? "y" : "ies"} selected`
            : "Select active facilities"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      </button>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((id) => {
            const fac = ACTIVE_FACILITIES.find((f) => f.id === id);
            return fac ? (
              <Badge
                key={id}
                variant="outline"
                className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200 gap-1"
              >
                <Building2 className="h-2.5 w-2.5" />
                {fac.name}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((v) => v !== id))}
                  className="hover:bg-indigo-100 rounded-full p-0.5 -mr-1"
                  aria-label={`Remove ${fac.name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
      <p className="text-[10px] text-[#9CA3AF]">
        Only active facilities are shown.
      </p>
      {open && (
        <div className="absolute z-50 top-[calc(100%-32px)] left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search facilities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-2 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-[#003B95]/30"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-44">
            {filtered.map((fac) => (
              <button
                key={fac.id}
                type="button"
                onClick={() => toggle(fac.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                  values.includes(fac.id) && "bg-indigo-50",
                )}
              >
                <Checkbox
                  checked={values.includes(fac.id)}
                  className="h-3.5 w-3.5 pointer-events-none"
                  tabIndex={-1}
                />
                <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="flex-1 text-left">{fac.name}</span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-600 border-emerald-200"
                >
                  Active
                </Badge>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                No facilities found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Experience Card (collapsible)
// ═══════════════════════════════════════════════════════════════

function ExperienceCard({
  entry,
  index,
  errors,
  onUpdate,
  onRemove,
  onToggleCollapse,
}: {
  entry: ExperienceEntry;
  index: number;
  errors: ProfessionalErrors;
  onUpdate: (id: string, updates: Partial<ExperienceEntry>) => void;
  onRemove: (id: string) => void;
  onToggleCollapse: (id: string) => void;
}) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const hasErrors = [
    errors[`exp-${index}-org`],
    errors[`exp-${index}-role`],
    errors[`exp-${index}-start`],
    errors[`exp-${index}-end`],
  ].some(Boolean);

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-colors",
        hasErrors ? "border-red-200" : "border-gray-200",
      )}
    >
      {/* Collapse header */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50/80 transition-colors",
          hasErrors ? "bg-red-50/30" : "bg-gray-50/50",
        )}
        onClick={() => onToggleCollapse(entry.id)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-md shrink-0",
              hasErrors ? "bg-red-100" : "bg-blue-50",
            )}
          >
            <Briefcase
              className={cn(
                "h-3.5 w-3.5",
                hasErrors ? "text-red-500" : "text-blue-500",
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-[#111827] truncate">
              {entry.role || entry.organization
                ? `${entry.role || "Role"} — ${entry.organization || "Organization"}`
                : `Experience ${index + 1}`}
            </p>
            <p className="text-[10px] text-[#9CA3AF]">
              {entry.startDate ? format(entry.startDate, "MMM yyyy") : "Start"}{" "}
              –{" "}
              {entry.isPresent
                ? "Present"
                : entry.endDate
                  ? format(entry.endDate, "MMM yyyy")
                  : "End"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasErrors && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(entry.id);
            }}
            className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove experience"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {entry.collapsed ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expandable body */}
      {!entry.collapsed && (
        <div className="px-4 py-4 space-y-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Organization */}
            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151]">
                Organization <span className="text-red-500">*</span>
              </Label>
              <Input
                value={entry.organization}
                onChange={(e) =>
                  onUpdate(entry.id, { organization: e.target.value })
                }
                placeholder="Company / Organization name"
                className={cn(
                  "h-10",
                  errors[`exp-${index}-org`] &&
                    "border-red-300 ring-1 ring-red-200",
                )}
              />
              {errors[`exp-${index}-org`] && (
                <p className="text-xs text-red-500">
                  {errors[`exp-${index}-org`]}
                </p>
              )}
            </div>
            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151]">
                Role / Position <span className="text-red-500">*</span>
              </Label>
              <Input
                value={entry.role}
                onChange={(e) => onUpdate(entry.id, { role: e.target.value })}
                placeholder="e.g., Personal Trainer"
                className={cn(
                  "h-10",
                  errors[`exp-${index}-role`] &&
                    "border-red-300 ring-1 ring-red-200",
                )}
              />
              {errors[`exp-${index}-role`] && (
                <p className="text-xs text-red-500">
                  {errors[`exp-${index}-role`]}
                </p>
              )}
            </div>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151]">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full h-10 justify-start text-left text-sm",
                      !entry.startDate && "text-[#9CA3AF]",
                      errors[`exp-${index}-start`] &&
                        "border-red-300 ring-1 ring-red-200",
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-2 text-gray-400" />
                    {entry.startDate
                      ? format(entry.startDate, "MMM yyyy")
                      : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={entry.startDate ?? undefined}
                    onSelect={(date) => {
                      onUpdate(entry.id, { startDate: date ?? null });
                      setStartOpen(false);
                    }}
                    disabled={(date) => date > new Date()}
                    defaultMonth={entry.startDate ?? new Date(2020, 0, 1)}
                    captionLayout="dropdown-buttons"
                    fromYear={1990}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
              {errors[`exp-${index}-start`] && (
                <p className="text-xs text-red-500">
                  {errors[`exp-${index}-start`]}
                </p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151]">
                End Date{" "}
                {!entry.isPresent && <span className="text-red-500">*</span>}
              </Label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={entry.isPresent}
                    className={cn(
                      "w-full h-10 justify-start text-left text-sm",
                      entry.isPresent && "opacity-50",
                      !entry.endDate && !entry.isPresent && "text-[#9CA3AF]",
                      errors[`exp-${index}-end`] &&
                        "border-red-300 ring-1 ring-red-200",
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-2 text-gray-400" />
                    {entry.isPresent
                      ? "Present"
                      : entry.endDate
                        ? format(entry.endDate, "MMM yyyy")
                        : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={entry.endDate ?? undefined}
                    onSelect={(date) => {
                      onUpdate(entry.id, { endDate: date ?? null });
                      setEndOpen(false);
                    }}
                    disabled={(date) =>
                      date > new Date() ||
                      (entry.startDate ? date < entry.startDate : false)
                    }
                    defaultMonth={entry.endDate ?? new Date()}
                    captionLayout="dropdown-buttons"
                    fromYear={1990}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
              {errors[`exp-${index}-end`] && (
                <p className="text-xs text-red-500">
                  {errors[`exp-${index}-end`]}
                </p>
              )}
              {/* Present checkbox */}
              <div className="flex items-center gap-2 mt-1">
                <Checkbox
                  id={`present-${entry.id}`}
                  checked={entry.isPresent}
                  onCheckedChange={(checked) => {
                    onUpdate(entry.id, {
                      isPresent: !!checked,
                      endDate: checked ? null : entry.endDate,
                    });
                  }}
                  className="h-3.5 w-3.5"
                />
                <label
                  htmlFor={`present-${entry.id}`}
                  className="text-xs text-[#6B7280] cursor-pointer"
                >
                  I currently work here
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#374151]">Description</Label>
            <textarea
              value={entry.description}
              onChange={(e) =>
                onUpdate(entry.id, { description: e.target.value })
              }
              placeholder="Describe responsibilities and achievements..."
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#003B95]/20 focus:border-[#003B95]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Service Area Map-Like Picker
// ═══════════════════════════════════════════════════════════════

function ServiceAreaPicker({
  area,
  onChange,
}: {
  area: ServiceArea;
  onChange: (updates: Partial<ServiceArea>) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm text-[#374151] flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-rose-500" /> Service Area
      </Label>

      {/* Map visualization (CSS-based since we can't use Google Maps) */}
      <div className="relative rounded-lg border overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 h-48">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        {/* Center pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          {/* Radius circle */}
          <div
            className="absolute rounded-full border-2 border-[#003B95]/30 bg-[#003B95]/10"
            style={{
              width: `${Math.min(area.radiusKm * 6, 180)}px`,
              height: `${Math.min(area.radiusKm * 6, 180)}px`,
              top: `50%`,
              left: `50%`,
              transform: "translate(-50%, -50%)",
            }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <MapPin className="h-7 w-7 text-[#003B95] drop-shadow-md" />
            <div className="mt-1 px-2 py-0.5 bg-white/90 rounded text-[10px] text-[#374151] shadow-sm whitespace-nowrap">
              {area.locationName || "Selected Location"}
            </div>
          </div>
        </div>
        {/* Coordinate display */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-[9px] text-white/80 font-mono">
          {area.latitude}, {area.longitude}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Location name */}
        <div className="space-y-1">
          <Label className="text-xs text-[#6B7280]">Location Name</Label>
          <Input
            value={area.locationName}
            onChange={(e) => onChange({ locationName: e.target.value })}
            placeholder="e.g., Dubai Marina"
            className="h-8 text-xs"
          />
        </div>
        {/* Lat */}
        <div className="space-y-1">
          <Label className="text-xs text-[#6B7280]">Latitude</Label>
          <Input
            value={area.latitude}
            onChange={(e) =>
              onChange({ latitude: e.target.value.replace(/[^0-9.\-]/g, "") })
            }
            placeholder="25.2048"
            className="h-8 text-xs font-mono"
          />
        </div>
        {/* Lng */}
        <div className="space-y-1">
          <Label className="text-xs text-[#6B7280]">Longitude</Label>
          <Input
            value={area.longitude}
            onChange={(e) =>
              onChange({ longitude: e.target.value.replace(/[^0-9.\-]/g, "") })
            }
            placeholder="55.2708"
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>

      {/* Radius slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-[#6B7280] flex items-center gap-1">
            <Crosshair className="h-3 w-3" /> Service Radius
          </Label>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 text-[#003B95]"
          >
            {area.radiusKm} km
          </Badge>
        </div>
        <Slider
          min={1}
          max={50}
          step={1}
          value={[area.radiusKm]}
          onValueChange={([v]) => onChange({ radiusKm: v })}
        />
        <div className="flex justify-between text-[9px] text-[#9CA3AF]">
          <span>1 km</span>
          <span>25 km</span>
          <span>50 km</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CoachProfessionalSection({
  professional,
  setProfessional,
  errors,
  onDirty,
}: {
  professional: CoachProfessionalState;
  setProfessional: React.Dispatch<React.SetStateAction<CoachProfessionalState>>;
  errors: ProfessionalErrors;
  onDirty: () => void;
}) {
  // ── Experience handlers ───────────────────────────────
  const addExperience = useCallback(() => {
    setProfessional((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: genId(),
          organization: "",
          role: "",
          startDate: null,
          endDate: null,
          isPresent: false,
          description: "",
          collapsed: false,
        },
      ],
    }));
    onDirty();
  }, [setProfessional, onDirty]);

  const updateExperience = useCallback(
    (id: string, updates: Partial<ExperienceEntry>) => {
      setProfessional((prev) => ({
        ...prev,
        experiences: prev.experiences.map((e) =>
          e.id === id ? { ...e, ...updates } : e,
        ),
      }));
      onDirty();
    },
    [setProfessional, onDirty],
  );

  const removeExperience = useCallback(
    (id: string) => {
      setProfessional((prev) => ({
        ...prev,
        experiences: prev.experiences.filter((e) => e.id !== id),
      }));
      onDirty();
      toast.success("Experience entry removed.");
    },
    [setProfessional, onDirty],
  );

  const toggleCollapse = useCallback(
    (id: string) => {
      setProfessional((prev) => ({
        ...prev,
        experiences: prev.experiences.map((e) =>
          e.id === id ? { ...e, collapsed: !e.collapsed } : e,
        ),
      }));
    },
    [setProfessional],
  );

  // ── Field updater ─────────────────────────────────────
  const update = useCallback(
    <K extends keyof CoachProfessionalState>(
      field: K,
      value: CoachProfessionalState[K],
    ) => {
      setProfessional((prev) => ({ ...prev, [field]: value }));
      onDirty();
    },
    [setProfessional, onDirty],
  );

  const bioCharCount = professional.bio.length;

  // ═══════════════════════════════════════════════════════
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50/50">
        <h2 className="text-sm text-[#111827] flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[#003B95]" />
          Professional Information
        </h2>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Specializations, experience, certifications, and service area details.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Specializations ─────────────────────────── */}
        <TagMultiSelect
          label="Specializations"
          icon={<Target className="h-4 w-4 text-amber-500" />}
          values={professional.specializations}
          options={SPECIALIZATIONS}
          placeholder="Select specializations"
          onChange={(v) => update("specializations", v)}
          error={errors.specializations}
          required
        />

        {/* ── Years of Experience + Bio ───────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-[#374151]">
              Years of Experience <span className="text-red-500">*</span>
            </Label>
            <Input
              value={professional.yearsOfExperience}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                update("yearsOfExperience", v);
              }}
              placeholder="e.g., 5"
              maxLength={3}
              className={cn(
                "h-10",
                errors.yearsOfExperience &&
                  "border-red-300 ring-1 ring-red-200",
              )}
            />
            {errors.yearsOfExperience && (
              <p className="text-xs text-red-500">{errors.yearsOfExperience}</p>
            )}
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-[#374151]">
                Bio / About <span className="text-red-500">*</span>
              </Label>
              <span
                className={cn(
                  "text-[10px]",
                  bioCharCount < 20 ? "text-red-400" : "text-[#9CA3AF]",
                )}
              >
                {bioCharCount} chars
              </span>
            </div>
            <textarea
              value={professional.bio}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="Write a brief professional bio about the coach..."
              rows={3}
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#003B95]/20 focus:border-[#003B95]",
                errors.bio && "border-red-300 ring-1 ring-red-200",
              )}
            />
            {errors.bio && <p className="text-xs text-red-500">{errors.bio}</p>}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* ── Experience Cards ─────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-[#374151] flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-blue-500" /> Work Experience
            </Label>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 text-gray-500"
            >
              {professional.experiences.length} entr
              {professional.experiences.length === 1 ? "y" : "ies"}
            </Badge>
          </div>

          {professional.experiences.length === 0 && (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Briefcase className="h-6 w-6 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-[#9CA3AF]">
                No experience entries yet.
              </p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                Click the button below to add work experience.
              </p>
            </div>
          )}

          {professional.experiences.map((exp, i) => (
            <ExperienceCard
              key={exp.id}
              entry={exp}
              index={i}
              errors={errors}
              onUpdate={updateExperience}
              onRemove={removeExperience}
              onToggleCollapse={toggleCollapse}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={addExperience}
          >
            <Plus className="h-3 w-3" /> Add Experience
          </Button>
        </div>

        <hr className="border-gray-100" />

        {/* ── Certifications ──────────────────────────── */}
        <TagMultiSelect
          label="Certifications"
          icon={<Award className="h-4 w-4 text-emerald-500" />}
          values={professional.certificationNames}
          options={CERTIFICATION_OPTIONS}
          placeholder="Select certifications"
          onChange={(v) => update("certificationNames", v)}
        />

        <hr className="border-gray-100" />

        {/* ── Service Area ────────────────────────────── */}
        <ServiceAreaPicker
          area={professional.serviceArea}
          onChange={(updates) => {
            setProfessional((prev) => ({
              ...prev,
              serviceArea: { ...prev.serviceArea, ...updates },
            }));
            onDirty();
          }}
        />

        <hr className="border-gray-100" />

        {/* ── Preferred Facilities ─────────────────────── */}
        <FacilityMultiSelect
          values={professional.preferredFacilities}
          onChange={(v) => update("preferredFacilities", v)}
        />

        <hr className="border-gray-100" />

        {/* ── Minimum Coaching Hours ──────────────────── */}
        <div className="space-y-1.5">
          <Label className="text-sm text-[#374151] flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-orange-500" /> Minimum Coaching Hours
          </Label>
          <div className="relative">
            <select
              value={professional.minCoachingHours}
              onChange={(e) =>
                update("minCoachingHours", Number(e.target.value))
              }
              className="w-full h-10 pl-3 pr-8 text-sm border rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#003B95]/20 focus:border-[#003B95] cursor-pointer"
            >
              {MIN_HOURS_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h} hour{h !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-[10px] text-[#9CA3AF]">
            Minimum number of coaching hours per booking (1–10).
          </p>
        </div>
      </div>
    </div>
  );
}
