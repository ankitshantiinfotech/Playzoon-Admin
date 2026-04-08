import type React from "react";
import { useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  Mail,
  Phone,
  Award,
  Calendar,
  AlertTriangle,
  Search,
  X,
  Upload,
  ChevronDown,
  ChevronRight,
  Globe,
  Languages,
  Briefcase,
  GraduationCap,
  Tag,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../ui/utils";
import ImageCropper from "../../../ImageCropper";
import { CROP_PRESETS } from "../../../../../lib/cropPresets";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import { Badge } from "../../../ui/badge";
import { Label } from "../../../ui/label";
import { Switch } from "../../../ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";
import { Calendar as CalendarUI } from "../../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { ScrollArea } from "../../../ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../../../ui/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import type {
  ProviderCoach,
  CoachStatus,
  CoachGender,
  CoachQualification,
  CoachExperience,
} from "./training-provider-detail-data";

// ─── Constants ────────────────────────────────────────────────

const SPORTS_OPTIONS = [
  "Football",
  "Basketball",
  "Tennis",
  "Swimming",
  "Padel",
  "Volleyball",
  "Cricket",
  "Martial Arts",
  "Gymnastics",
  "Yoga",
  "CrossFit",
  "Cycling",
  "Boxing",
  "Track & Field",
  "Diving",
];

const NATIONALITY_OPTIONS = [
  "Saudi",
  "Emirati",
  "Bahraini",
  "Qatari",
  "Kuwaiti",
  "Egyptian",
  "Jordanian",
  "Lebanese",
  "Indian",
  "Pakistani",
  "British",
  "American",
  "Canadian",
  "Australian",
  "Filipino",
  "Sudanese",
  "Moroccan",
  "Tunisian",
  "Iraqi",
  "Omani",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Arabic",
  "French",
  "Spanish",
  "Urdu",
  "Hindi",
  "Tagalog",
  "Bengali",
  "Portuguese",
  "German",
  "Mandarin",
  "Japanese",
  "Korean",
  "Turkish",
  "Persian",
];

// ─── Props ───────────────────────────────────────────────────

interface CoachManagementProps {
  coaches: ProviderCoach[];
  onAdd: (coach: ProviderCoach) => void;
  onUpdate: (coach: ProviderCoach) => void;
  onDelete: (coachId: string) => void;
  providerId: string;
}

// ─── Status Badge ────────────────────────────────────────────

const STATUS_COLORS: Record<
  CoachStatus,
  { bg: string; text: string; dot: string }
> = {
  Active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Inactive: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  Suspended: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

function CoachStatusBadge({ status }: { status: CoachStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] border-0 gap-1.5", c.bg, c.text)}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {status}
    </Badge>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

function getFullName(coach: ProviderCoach): string {
  return `${coach.firstName} ${coach.lastName}`.trim();
}

// ─── Form Data Types ────────────────────────────────────────

interface CoachFormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date | undefined;
  gender: CoachGender | "";
  mobile: string;
  profilePictureUrl: string;
  sports: string[];
  description: string;
  nationality: string;
  languages: string[];
  qualifications: CoachQualification[];
  experiences: CoachExperience[];
  specialities: string[];
  skills: string[];
  areaOfExpertise: string[];
  status: CoachStatus;
}

const EMPTY_FORM: CoachFormData = {
  firstName: "",
  lastName: "",
  email: "",
  dateOfBirth: undefined,
  gender: "",
  mobile: "",
  profilePictureUrl: "",
  sports: [],
  description: "",
  nationality: "",
  languages: [],
  qualifications: [],
  experiences: [],
  specialities: [],
  skills: [],
  areaOfExpertise: [],
  status: "Active",
};

function coachToFormData(coach: ProviderCoach): CoachFormData {
  return {
    firstName: coach.firstName,
    lastName: coach.lastName,
    email: coach.email,
    dateOfBirth: coach.dateOfBirth,
    gender: coach.gender || "",
    mobile: coach.mobile,
    profilePictureUrl: coach.profilePictureUrl || "",
    sports: [...coach.sports],
    description: coach.description,
    nationality: coach.nationality || "",
    languages: [...coach.languages],
    qualifications: coach.qualifications.map((q) => ({ ...q })),
    experiences: coach.experiences.map((e) => ({ ...e })),
    specialities: [...coach.specialities],
    skills: [...coach.skills],
    areaOfExpertise: [...coach.areaOfExpertise],
    status: coach.status,
  };
}

// ─── Date Picker Field ──────────────────────────────────────

function DatePickerField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-500">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-10 text-sm justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-400",
            )}
          >
            <Calendar className="mr-2 h-3.5 w-3.5 ml-auto" />
            {value ? format(value, "dd/MM/yyyy") : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarUI
            mode="single"
            selected={value}
            onSelect={(d) => {
              onChange(d);
              setOpen(false);
            }}
            initialFocus
            captionLayout="dropdown-buttons"
            fromYear={1950}
            toYear={2030}
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Multi-Select Chips ──────────────────────────────────────

function MultiSelectChips({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-500">{label}</Label>
      <div
        className={cn(
          "flex flex-wrap gap-1.5 p-2 border rounded-md min-h-[36px]",
          error && "border-red-400",
        )}
      >
        {options.map((opt) => {
          const selected = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                if (selected) onChange(value.filter((v) => v !== opt));
                else onChange([...value, opt]);
              }}
              className={cn(
                "px-2 py-0.5 rounded-full text-xs border transition-colors",
                selected
                  ? "bg-[#003B95] text-white border-[#003B95]"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Multi-Select Dropdown ───────────────────────────────────

function MultiSelectDropdown({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Select...",
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-500">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full h-auto min-h-[36px] text-sm justify-between text-left font-normal",
              !value.length && "text-muted-foreground",
              error && "border-red-400",
            )}
          >
            <span className="flex flex-wrap gap-1 flex-1">
              {value.length === 0
                ? placeholder
                : value.map((v) => (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="text-[10px] gap-1"
                    >
                      {v}
                      <X
                        className="h-2.5 w-2.5 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(value.filter((x) => x !== v));
                        }}
                      />
                    </Badge>
                  ))}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-1"
          align="start"
        >
          <ScrollArea className="max-h-48">
            {options.map((opt) => {
              const selected = value.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  className={cn(
                    "w-full text-left text-sm px-3 py-1.5 rounded hover:bg-gray-50 transition-colors",
                    selected && "bg-[#003B95]/5 text-[#003B95] font-medium",
                  )}
                  onClick={() => {
                    if (selected) onChange(value.filter((v) => v !== opt));
                    else onChange([...value, opt]);
                  }}
                >
                  {opt}
                  {selected && (
                    <span className="float-right text-[#003B95]">&#10003;</span>
                  )}
                </button>
              );
            })}
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Tag Input ───────────────────────────────────────────────

function TagInput({
  label,
  value,
  onChange,
  placeholder = "Type and press Enter",
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [inputVal, setInputVal] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputVal.trim();
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setInputVal("");
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="flex flex-wrap gap-1.5 p-2 border rounded-md min-h-[36px]">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px] gap-1">
            {tag}
            <X
              className="h-2.5 w-2.5 cursor-pointer"
              onClick={() => onChange(value.filter((t) => t !== tag))}
            />
          </Badge>
        ))}
        <input
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder:text-gray-400"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
        />
      </div>
    </div>
  );
}

// ─── Collapsible Form Section ────────────────────────────────

function FormSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <Icon className="h-4 w-4 text-[#003B95]" />
        <span className="text-sm font-medium text-[#111827] flex-1">
          {title}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Coach Form Sheet ────────────────────────────────────────

function CoachFormSheet({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData: CoachFormData;
  onSubmit: (data: CoachFormData) => void;
}) {
  const [form, setForm] = useState<CoachFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Image cropper state ─────────────────────────────────
  const [cropRawSrc, setCropRawSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(initialData);
      setErrors({});
    }
    onOpenChange(v);
  };

  const update = <K extends keyof CoachFormData>(
    key: K,
    val: CoachFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (form.sports.length === 0) errs.sports = "Select at least one sport";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
    handleOpenChange(false);
  };

  // ── Qualification helpers ──
  const addQualification = () => {
    const newQ: CoachQualification = {
      id: `Q-${Date.now()}`,
      title: "",
      description: "",
    };
    update("qualifications", [...form.qualifications, newQ]);
  };
  const updateQualification = (
    id: string,
    field: "title" | "description",
    val: string,
  ) => {
    update(
      "qualifications",
      form.qualifications.map((q) =>
        q.id === id ? { ...q, [field]: val } : q,
      ),
    );
  };
  const removeQualification = (id: string) => {
    update(
      "qualifications",
      form.qualifications.filter((q) => q.id !== id),
    );
  };

  // ── Experience helpers ──
  const addExperience = () => {
    const newE: CoachExperience = {
      id: `E-${Date.now()}`,
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
    };
    update("experiences", [...form.experiences, newE]);
  };
  const updateExperience = (
    id: string,
    field: keyof CoachExperience,
    val: string | Date,
  ) => {
    update(
      "experiences",
      form.experiences.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    );
  };
  const removeExperience = (id: string) => {
    update(
      "experiences",
      form.experiences.filter((e) => e.id !== id),
    );
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-lg">
            {mode === "add" ? (
              <UserPlus className="h-5 w-5 text-[#003B95]" />
            ) : (
              <Pencil className="h-5 w-5 text-[#003B95]" />
            )}
            {mode === "add" ? "Add Coach" : "Edit Coach"}
          </SheetTitle>
          <SheetDescription>
            {mode === "add"
              ? "Add a new coach to this training provider."
              : "Update the coach's information."}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 py-5 space-y-5">
            {/* ── Basic Info ─────────────────────────────── */}
            <FormSection title="Basic Information" icon={UserPlus} defaultOpen>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* First Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      First Name *
                    </Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                      placeholder="First name"
                      className={cn(
                        "h-10 text-sm",
                        errors.firstName &&
                          "border-red-400 focus-visible:ring-red-200",
                      )}
                    />
                    {errors.firstName && (
                      <p className="text-[11px] text-red-500">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  {/* Last Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Last Name *</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                      placeholder="Last name"
                      className={cn(
                        "h-10 text-sm",
                        errors.lastName &&
                          "border-red-400 focus-visible:ring-red-200",
                      )}
                    />
                    {errors.lastName && (
                      <p className="text-[11px] text-red-500">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Email ID</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="coach@example.ae"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date of Birth */}
                  <DatePickerField
                    label="Date of Birth"
                    value={form.dateOfBirth}
                    onChange={(d) => update("dateOfBirth", d)}
                  />
                  {/* Gender */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Gender</Label>
                    <Select
                      value={form.gender}
                      onValueChange={(v) => update("gender", v as CoachGender)}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Mobile Number</Label>
                  <Input
                    value={form.mobile}
                    onChange={(e) => update("mobile", e.target.value)}
                    placeholder="+971 50 000 0000"
                    className="h-10 text-sm"
                  />
                </div>

                {/* Profile Picture */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">
                    Profile Picture
                  </Label>
                  <div className="flex items-center gap-3">
                    {form.profilePictureUrl ? (
                      <Avatar className="h-14 w-14 rounded-lg">
                        <AvatarImage
                          src={form.profilePictureUrl}
                          className="rounded-lg"
                        />
                        <AvatarFallback className="rounded-lg bg-[#003B95]/10 text-[#003B95] text-sm">
                          {getInitials(form.firstName, form.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-14 w-14 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                        <ImageIcon className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                        <Upload className="h-3 w-3" />
                        Upload Image
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            e.target.value = "";
                            const reader = new FileReader();
                            reader.onload = () => {
                              setCropRawSrc(reader.result as string);
                              setCropOpen(true);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {form.profilePictureUrl && (
                        <button
                          type="button"
                          className="ml-2 text-xs text-red-500 hover:text-red-700"
                          onClick={() => update("profilePictureUrl", "")}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            {/* ── Professional ─────────────────────────── */}
            <FormSection
              title="Professional Information"
              icon={Briefcase}
              defaultOpen
            >
              <div className="space-y-4">
                {/* Sports */}
                <MultiSelectChips
                  label="Sports *"
                  options={SPORTS_OPTIONS}
                  value={form.sports}
                  onChange={(v) => update("sports", v)}
                  error={errors.sports}
                />

                {/* Description / About */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">
                    Description / About
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 500)
                        update("description", e.target.value);
                    }}
                    placeholder="Tell us about this coach..."
                    className="text-sm min-h-[80px]"
                    rows={3}
                  />
                  <p className="text-[10px] text-gray-400 text-right">
                    {form.description.length}/500
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Nationality */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Nationality</Label>
                    <Select
                      value={form.nationality}
                      onValueChange={(v) => update("nationality", v)}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {NATIONALITY_OPTIONS.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Languages */}
                  <MultiSelectDropdown
                    label="Languages"
                    options={LANGUAGE_OPTIONS}
                    value={form.languages}
                    onChange={(v) => update("languages", v)}
                    placeholder="Select languages..."
                  />
                </div>
              </div>
            </FormSection>

            {/* ── Qualifications ────────────────────────── */}
            <FormSection
              title="Qualifications"
              icon={GraduationCap}
              defaultOpen={false}
            >
              <div className="space-y-3">
                {form.qualifications.map((q, idx) => (
                  <div
                    key={q.id}
                    className="relative p-3 border border-gray-100 rounded-lg bg-gray-50/50"
                  >
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                      onClick={() => removeQualification(q.id)}
                      aria-label={`Remove qualification ${idx + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="space-y-2 pr-6">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-400">
                          Title
                        </Label>
                        <Input
                          value={q.title}
                          onChange={(e) =>
                            updateQualification(q.id, "title", e.target.value)
                          }
                          placeholder="Qualification title"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-400">
                          Description
                        </Label>
                        <Textarea
                          value={q.description}
                          onChange={(e) =>
                            updateQualification(
                              q.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Description of qualification"
                          className="text-sm min-h-[50px]"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={addQualification}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Qualification
                </Button>
              </div>
            </FormSection>

            {/* ── Experience ────────────────────────────── */}
            <FormSection
              title="Experience"
              icon={Briefcase}
              defaultOpen={false}
            >
              <div className="space-y-3">
                {form.experiences.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="relative p-3 border border-gray-100 rounded-lg bg-gray-50/50"
                  >
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                      onClick={() => removeExperience(exp.id)}
                      aria-label={`Remove experience ${idx + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="space-y-2 pr-6">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-400">
                          Title
                        </Label>
                        <Input
                          value={exp.title}
                          onChange={(e) =>
                            updateExperience(exp.id, "title", e.target.value)
                          }
                          placeholder="Experience title"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-400">
                          Description
                        </Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) =>
                            updateExperience(
                              exp.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Description of experience"
                          className="text-sm min-h-[50px]"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-400">
                            Start Date
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-8 text-xs justify-start"
                              >
                                <Calendar className="mr-1.5 h-3 w-3" />
                                {format(exp.startDate, "dd/MM/yyyy")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <CalendarUI
                                mode="single"
                                selected={exp.startDate}
                                onSelect={(d) =>
                                  d && updateExperience(exp.id, "startDate", d)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-400">
                            End Date
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-8 text-xs justify-start"
                              >
                                <Calendar className="mr-1.5 h-3 w-3" />
                                {format(exp.endDate, "dd/MM/yyyy")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <CalendarUI
                                mode="single"
                                selected={exp.endDate}
                                onSelect={(d) =>
                                  d && updateExperience(exp.id, "endDate", d)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-400">
                          Certificate
                        </Label>
                        <div className="flex items-center gap-2">
                          {exp.certificateFileName ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] gap-1"
                            >
                              {exp.certificateFileName}
                              <X
                                className="h-2.5 w-2.5 cursor-pointer"
                                onClick={() =>
                                  updateExperience(
                                    exp.id,
                                    "certificateFileName",
                                    "",
                                  )
                                }
                              />
                            </Badge>
                          ) : (
                            <label className="inline-flex items-center gap-1 px-2 py-1 text-[10px] border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                              <Upload className="h-2.5 w-2.5" />
                              Upload Certificate
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file)
                                    updateExperience(
                                      exp.id,
                                      "certificateFileName",
                                      file.name,
                                    );
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={addExperience}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Experience
                </Button>
              </div>
            </FormSection>

            {/* ── Tags ──────────────────────────────────── */}
            <FormSection title="Tags" icon={Tag} defaultOpen={false}>
              <div className="space-y-4">
                <TagInput
                  label="Specialities"
                  value={form.specialities}
                  onChange={(v) => update("specialities", v)}
                  placeholder="Type a speciality and press Enter"
                />
                <TagInput
                  label="Skills"
                  value={form.skills}
                  onChange={(v) => update("skills", v)}
                  placeholder="Type a skill and press Enter"
                />
                <TagInput
                  label="Area of Expertise"
                  value={form.areaOfExpertise}
                  onChange={(v) => update("areaOfExpertise", v)}
                  placeholder="Type an area and press Enter"
                />
              </div>
            </FormSection>

            {/* ── Status ────────────────────────────────── */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-[#111827]">Status</p>
                <p className="text-xs text-gray-400">
                  {form.status === "Active"
                    ? "Coach is active and visible"
                    : "Coach is inactive"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{form.status}</span>
                <Switch
                  checked={form.status === "Active"}
                  onCheckedChange={(checked) =>
                    update("status", checked ? "Active" : "Inactive")
                  }
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t border-gray-100 shrink-0">
          <div className="flex gap-3 w-full justify-end">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#003B95] hover:bg-[#002d73] text-white"
              onClick={handleSubmit}
            >
              {mode === "add" ? "Add Coach" : "Save Changes"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>

      {/* ── Image Cropper ───────────────────────────────────── */}
      <ImageCropper
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropRawSrc}
        onCropComplete={(_blob: Blob, previewUrl: string) => {
          update("profilePictureUrl", previewUrl);
        }}
        {...CROP_PRESETS.coachProfile}
      />
    </Sheet>
  );
}

// ─── View Coach Dialog ───────────────────────────────────────

function CoachViewDialog({
  open,
  onOpenChange,
  coach,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach: ProviderCoach | null;
}) {
  if (!coach) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Coach Profile</DialogTitle>
          <DialogDescription>
            Detailed information about this coach.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto pr-2">
          <div className="space-y-5 py-2">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-xl">
                {coach.profilePictureUrl && (
                  <AvatarImage
                    src={coach.profilePictureUrl}
                    className="rounded-xl"
                  />
                )}
                <AvatarFallback className="rounded-xl bg-[#003B95]/10 text-[#003B95] text-lg">
                  {getInitials(coach.firstName, coach.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-medium text-[#111827]">
                  {getFullName(coach)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <CoachStatusBadge status={coach.status} />
                  {coach.gender && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-gray-500"
                    >
                      {coach.gender}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Email:</span>
                <a
                  href={`mailto:${coach.email}`}
                  className="text-sm text-[#003B95] hover:underline truncate"
                >
                  {coach.email || "N/A"}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Mobile:</span>
                <span className="text-sm text-[#111827]">
                  {coach.mobile || "N/A"}
                </span>
              </div>
              {coach.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">DOB:</span>
                  <span className="text-sm text-[#111827]">
                    {format(coach.dateOfBirth, "dd/MM/yyyy")}
                  </span>
                </div>
              )}
              {coach.nationality && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">Nationality:</span>
                  <span className="text-sm text-[#111827]">
                    {coach.nationality}
                  </span>
                </div>
              )}
              {coach.languages.length > 0 && (
                <div className="flex items-start gap-2 col-span-2">
                  <Languages className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                  <span className="text-xs text-gray-500">Languages:</span>
                  <span className="text-sm text-[#111827]">
                    {coach.languages.join(", ")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Joined:</span>
                <span className="text-sm text-[#111827]">
                  {format(coach.joinedAt, "dd/MM/yyyy")}
                </span>
              </div>
            </div>

            {/* Sports */}
            {coach.sports.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">
                  Sports
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {coach.sports.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {coach.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">About</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {coach.description}
                </p>
              </div>
            )}

            {/* Qualifications */}
            {coach.qualifications.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Qualifications
                </p>
                <div className="space-y-2">
                  {coach.qualifications.map((q) => (
                    <div
                      key={q.id}
                      className="p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <p className="text-sm font-medium text-[#111827]">
                        {q.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {q.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {coach.experiences.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Experience
                </p>
                <div className="space-y-2">
                  {coach.experiences.map((e) => (
                    <div
                      key={e.id}
                      className="p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <p className="text-sm font-medium text-[#111827]">
                        {e.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {e.description}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {format(e.startDate, "MMM yyyy")} -{" "}
                        {format(e.endDate, "MMM yyyy")}
                        {e.certificateFileName && (
                          <span className="ml-2 text-[#003B95]">
                            {e.certificateFileName}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {(coach.specialities.length > 0 ||
              coach.skills.length > 0 ||
              coach.areaOfExpertise.length > 0) && (
              <div className="space-y-2">
                {coach.specialities.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Specialities
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {coach.specialities.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {coach.skills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {coach.skills.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {coach.areaOfExpertise.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Area of Expertise
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {coach.areaOfExpertise.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════
// Coach Management Section
// ═══════════════════════════════════════════════════════════════

export function CoachManagement({
  coaches,
  onAdd,
  onUpdate,
  onDelete,
  providerId,
}: CoachManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editCoach, setEditCoach] = useState<ProviderCoach | null>(null);
  const [viewCoach, setViewCoach] = useState<ProviderCoach | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProviderCoach | null>(null);

  const filteredCoaches = searchQuery.trim()
    ? coaches.filter((c) => {
        const q = searchQuery.toLowerCase();
        const name = getFullName(c).toLowerCase();
        return (
          name.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.sports.some((s) => s.toLowerCase().includes(q))
        );
      })
    : coaches;

  const handleAddSubmit = useCallback(
    (data: CoachFormData) => {
      const newCoach: ProviderCoach = {
        id: `${providerId}-PCH-${Date.now()}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobile: data.mobile,
        dateOfBirth: data.dateOfBirth,
        gender: (data.gender as CoachGender) || undefined,
        profilePictureUrl: data.profilePictureUrl || undefined,
        sports: data.sports,
        description: data.description,
        nationality: data.nationality || undefined,
        languages: data.languages,
        qualifications: data.qualifications,
        experiences: data.experiences,
        specialities: data.specialities,
        skills: data.skills,
        areaOfExpertise: data.areaOfExpertise,
        status: data.status,
        joinedAt: new Date(),
        assignedTrainings: 0,
      };
      onAdd(newCoach);
      toast.success(`${data.firstName} ${data.lastName} added as coach`);
    },
    [onAdd, providerId],
  );

  const handleEditSubmit = useCallback(
    (data: CoachFormData) => {
      if (!editCoach) return;
      const updated: ProviderCoach = {
        ...editCoach,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobile: data.mobile,
        dateOfBirth: data.dateOfBirth,
        gender: (data.gender as CoachGender) || undefined,
        profilePictureUrl: data.profilePictureUrl || undefined,
        sports: data.sports,
        description: data.description,
        nationality: data.nationality || undefined,
        languages: data.languages,
        qualifications: data.qualifications,
        experiences: data.experiences,
        specialities: data.specialities,
        skills: data.skills,
        areaOfExpertise: data.areaOfExpertise,
        status: data.status,
      };
      onUpdate(updated);
      toast.success(`${data.firstName} ${data.lastName} updated successfully`);
      setEditCoach(null);
    },
    [editCoach, onUpdate],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;

    // Check if coach is assigned to trainings
    if (deleteTarget.assignedTrainings && deleteTarget.assignedTrainings > 0) {
      // This case is caught before reaching here via the dialog UI
      return;
    }

    onDelete(deleteTarget.id);
    toast.success(`${getFullName(deleteTarget)} removed`);
    setDeleteTarget(null);
  }, [deleteTarget, onDelete]);

  const isCoachAssigned =
    deleteTarget?.assignedTrainings && deleteTarget.assignedTrainings > 0;

  return (
    <div className="space-y-4">
      {/* ── Header Row ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {coaches.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search coaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm bg-white border-gray-200"
              aria-label="Search coaches"
            />
          </div>
        )}
        <Button
          className="bg-[#003B95] hover:bg-[#002d73] text-white text-sm h-10 shrink-0"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Coach
        </Button>
      </div>

      {/* ── Table or Empty State ────────────────────── */}
      {coaches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
          <Users className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No coaches assigned</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Add Coach" to assign coaches to this provider
          </p>
          <Button
            className="mt-4 bg-[#003B95] hover:bg-[#002d73] text-white text-sm h-10"
            onClick={() => setAddOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Coach
          </Button>
        </div>
      ) : filteredCoaches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 bg-gray-50/50 rounded-lg border border-gray-200">
          <Search className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            No coaches match "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="px-4 text-xs text-gray-500">
                  Name
                </TableHead>
                <TableHead className="px-4 text-xs text-gray-500 hidden md:table-cell">
                  Email
                </TableHead>
                <TableHead className="px-4 text-xs text-gray-500 hidden lg:table-cell">
                  Sports
                </TableHead>
                <TableHead className="px-4 text-xs text-gray-500 hidden lg:table-cell">
                  Gender
                </TableHead>
                <TableHead className="px-4 text-xs text-gray-500">
                  Status
                </TableHead>
                <TableHead className="px-4 text-xs text-gray-500 text-center w-28">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoaches.map((coach) => (
                <TableRow key={coach.id} className="hover:bg-gray-50/50">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        {coach.profilePictureUrl && (
                          <AvatarImage src={coach.profilePictureUrl} />
                        )}
                        <AvatarFallback className="bg-[#003B95]/10 text-[#003B95] text-[10px]">
                          {getInitials(coach.firstName, coach.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm text-[#111827] truncate">
                          {getFullName(coach)}
                        </p>
                        <p className="text-[11px] text-gray-400 md:hidden truncate">
                          {coach.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-xs text-gray-500 hidden md:table-cell">
                    <a
                      href={`mailto:${coach.email}`}
                      className="hover:text-[#003B95]"
                    >
                      {coach.email}
                    </a>
                  </TableCell>
                  <TableCell className="px-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {coach.sports.slice(0, 2).map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {s}
                        </Badge>
                      ))}
                      {coach.sports.length > 2 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-gray-500"
                        >
                          +{coach.sports.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-xs text-gray-500 hidden lg:table-cell">
                    {coach.gender || "N/A"}
                  </TableCell>
                  <TableCell className="px-4">
                    <CoachStatusBadge status={coach.status} />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewCoach(coach)}
                        aria-label={`View ${getFullName(coach)}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditCoach(coach)}
                        aria-label={`Edit ${getFullName(coach)}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(coach)}
                        aria-label={`Delete ${getFullName(coach)}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Add Coach Sheet ──────────────────────── */}
      <CoachFormSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        initialData={EMPTY_FORM}
        onSubmit={handleAddSubmit}
      />

      {/* ── Edit Coach Sheet ─────────────────────── */}
      {editCoach && (
        <CoachFormSheet
          open={!!editCoach}
          onOpenChange={(open) => {
            if (!open) setEditCoach(null);
          }}
          mode="edit"
          initialData={coachToFormData(editCoach)}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* ── View Coach Dialog ─────────────────────── */}
      <CoachViewDialog
        open={!!viewCoach}
        onOpenChange={(open) => {
          if (!open) setViewCoach(null);
        }}
        coach={viewCoach}
      />

      {/* ── Delete Confirmation ───────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  isCoachAssigned ? "text-amber-500" : "text-red-500",
                )}
              />
              {isCoachAssigned ? "Cannot Remove Coach" : "Remove Coach"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isCoachAssigned ? (
                <>
                  <span className="text-[#111827] font-medium">
                    {deleteTarget && getFullName(deleteTarget)}
                  </span>{" "}
                  is currently assigned to{" "}
                  <span className="text-[#111827] font-medium">
                    {deleteTarget?.assignedTrainings} training(s)
                  </span>
                  . You must unassign the coach from all trainings before
                  removing them.
                </>
              ) : (
                <>
                  Are you sure you want to remove{" "}
                  <span className="text-[#111827] font-medium">
                    {deleteTarget && getFullName(deleteTarget)}
                  </span>{" "}
                  from this training provider? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!isCoachAssigned && (
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
              >
                Remove Coach
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
