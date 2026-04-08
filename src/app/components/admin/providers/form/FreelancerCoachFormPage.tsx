// ─── US-4.2.1 — Freelancer Coach Create/Edit Form ────────────
// Personal Information section with image cropper, all 9 fields.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { format, differenceInYears } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  X,
  Camera,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarIcon,
  Search,
  ChevronDown,
  User,
  Save,
  ShieldCheck,
  Lock,
  Unlock,
  GraduationCap,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import ImageCropper from "../../../ImageCropper";
import { CROP_PRESETS } from "../../../../../lib/cropPresets";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Skeleton } from "../../../ui/skeleton";
import { Calendar } from "../../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { RadioGroup, RadioGroupItem } from "../../../ui/radio-group";
import { Slider } from "../../../ui/slider";
import { Switch } from "../../../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../ui/dialog";
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
  COUNTRY_CODES,
  GENDERS,
  NATIONALITIES,
  LANGUAGES,
  INITIAL_COACH_FORM,
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTO_SIZE,
  formatFileSize,
  checkEmailDuplicate,
  validateFirstName,
  validateLastName,
  validateDOB,
  validateGender,
  validateEmail,
  validateMobileNumber,
  validateNationality,
  getCoachDetail,
  type CoachFormState,
  type CoachFieldErrors,
  type CoachTouchedFields,
  type Gender,
} from "./coach-form-data";
import {
  CoachMediaSection,
  INITIAL_MEDIA_STATE,
  type CoachMediaState,
} from "./CoachMediaSection";
import {
  CoachAvailabilitySection,
  createInitialAvailability,
  type CoachAvailabilityState,
} from "./CoachAvailabilitySection";
import {
  CoachProfessionalSection,
  createInitialProfessional,
  getMockProfessional,
  validateProfessional,
  type CoachProfessionalState,
  type ProfessionalErrors,
} from "./CoachProfessionalSection";

// ═══════════════════════════════════════════════════════════════
// Email check state
// ═══════════════════════════════��═══════════════════════════════

type EmailCheckState = "idle" | "checking" | "unique" | "duplicate";

// ═══════════════════════════════════════════════════════════════
// Country Code Dropdown (reusable from facility form pattern)
// ═══════════════════════════════════════════════════════════════

function CountryCodeDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected =
    COUNTRY_CODES.find((c) => c.code === value) ?? COUNTRY_CODES[0];

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.toLowerCase();
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.iso.toLowerCase().includes(q),
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 h-10 px-2.5 border rounded-md text-sm bg-white hover:bg-gray-50 transition-colors min-w-[110px]",
          open && "ring-2 ring-[#003B95]/20 border-[#003B95]",
        )}
      >
        <span>{selected.flag}</span>
        <span className="text-[#374151]">{selected.code}</span>
        <ChevronDown className="h-3 w-3 text-gray-400 ml-auto" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-2 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-[#003B95]/30"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
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
                No countries found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Searchable Single-Select Dropdown (Nationality)
// ═══════════════════════════════════════════════════════════════

function SearchableDropdown({
  label,
  value,
  options,
  placeholder,
  onChange,
  error,
  required,
}: {
  label: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (val: string) => void;
  error?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return [...options];
    const q = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [search, options]);

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
      <Label className="text-sm text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full h-10 px-3 border rounded-md text-sm bg-white hover:bg-gray-50 transition-colors text-left",
          error && "border-red-300 ring-1 ring-red-200",
          open && !error && "ring-2 ring-[#003B95]/20 border-[#003B95]",
        )}
      >
        <span className={value ? "text-[#111827]" : "text-[#9CA3AF]"}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
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
                  onChange(opt);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                  opt === value && "bg-blue-50 text-[#003B95]",
                )}
              >
                {opt}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                No results found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Multi-Select Dropdown with Tags (Languages)
// ═══════════════════════════════════════════════════════════════

function MultiSelectTags({
  label,
  values,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  options: readonly string[];
  placeholder: string;
  onChange: (vals: string[]) => void;
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
      <Label className="text-sm text-[#374151]">{label}</Label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full min-h-[36px] px-3 py-1.5 border rounded-md text-sm bg-white hover:bg-gray-50 transition-colors text-left",
          open && "ring-2 ring-[#003B95]/20 border-[#003B95]",
        )}
      >
        <span className={values.length ? "text-[#111827]" : "text-[#9CA3AF]"}>
          {values.length ? `${values.length} selected` : placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      </button>
      {/* Tags */}
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
        <div className="absolute z-50 top-[calc(100%_-_20px)] left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search languages..."
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
                  ? "All languages selected"
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
// Image Cropper — replaced inline ImageCropperModal with shared
// ImageCropper component from @/app/components/ImageCropper
// ═══════════════════════════════════════════════════════════════

interface _CropperState_UNUSED {
  zoom: number; // 1 – 3
  rotation: number; // degrees
  panX: number;
  panY: number;
}

function ImageCropperModal({
  open,
  imageSrc,
  onCrop,
  onCancel,
}: {
  open: boolean;
  imageSrc: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<CropperState>({
    zoom: 1,
    rotation: 0,
    panX: 0,
    panY: 0,
  });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Load image
  useEffect(() => {
    if (!open || !imageSrc) return;
    setLoaded(false);
    setState({ zoom: 1, rotation: 0, panX: 0, panY: 0 });
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.src = imageSrc;
  }, [open, imageSrc]);

  // Draw to canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !loaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2 + state.panX, size / 2 + state.panY);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.zoom, state.zoom);

    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    // Draw circular crop overlay
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [loaded, state]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: state.panX,
      panY: state.panY,
    };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setState((s) => ({
      ...s,
      panX: dragStart.current.panX + dx,
      panY: dragStart.current.panY + dy,
    }));
  };
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDragging.current = true;
    const t = e.touches[0];
    dragStart.current = {
      x: t.clientX,
      y: t.clientY,
      panX: state.panX,
      panY: state.panY,
    };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.x;
    const dy = t.clientY - dragStart.current.y;
    setState((s) => ({
      ...s,
      panX: dragStart.current.panX + dx,
      panY: dragStart.current.panY + dy,
    }));
  };

  // Crop & export
  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const outSize = 400; // output resolution
    const offscreen = document.createElement("canvas");
    offscreen.width = outSize;
    offscreen.height = outSize;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Apply transforms matching the preview (scaled from 300 → outSize)
    const scaleFactor = outSize / 300;
    ctx.translate(
      outSize / 2 + state.panX * scaleFactor,
      outSize / 2 + state.panY * scaleFactor,
    );
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.zoom, state.zoom);

    const scale = Math.max(300 / img.width, 300 / img.height);
    const w = img.width * scale * scaleFactor;
    const h = img.height * scale * scaleFactor;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);

    const dataUrl = offscreen.toDataURL("image/png");
    onCrop(dataUrl);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4" /> Crop Profile Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas preview */}
          <div
            ref={previewRef}
            className="relative mx-auto w-[300px] h-[300px] bg-gray-900 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => {
              isDragging.current = false;
            }}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {/* Zoom */}
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-gray-400 shrink-0" />
              <Slider
                min={100}
                max={300}
                step={5}
                value={[state.zoom * 100]}
                onValueChange={([v]) =>
                  setState((s) => ({ ...s, zoom: v / 100 }))
                }
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 w-10 text-right">
                {Math.round(state.zoom * 100)}%
              </span>
            </div>

            {/* Rotate */}
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setState((s) => ({ ...s, rotation: s.rotation - 90 }))
                }
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" /> -90
              </Button>
              <span className="text-xs text-gray-500 min-w-[50px] text-center">
                {state.rotation}deg
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setState((s) => ({ ...s, rotation: s.rotation + 90 }))
                }
                className="gap-1.5 text-xs"
              >
                <RotateCw className="h-3.5 w-3.5" /> +90
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCrop}
            disabled={!loaded}
            className="bg-[#003B95] hover:bg-[#002d73] text-white gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Crop & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN FORM COMPONENT
// ═══════════════════════════════════════════════════════════════

export function FreelancerCoachFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // ── Form state ────────────────────────────────────────
  const [form, setForm] = useState<CoachFormState>(INITIAL_COACH_FORM);
  const [errors, setErrors] = useState<CoachFieldErrors>({});
  const [touched, setTouched] = useState<CoachTouchedFields>({});
  const [isDirty, setIsDirty] = useState(false);

  // ── Loading ───────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // ── Email async check ─────────────────────────────────
  const [emailCheckState, setEmailCheckState] =
    useState<EmailCheckState>("idle");
  const emailCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialEmailRef = useRef<string>("");

  // ── Image cropper ─────────────────────────────────────
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Unsaved changes dialog ────────────────────────────
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);

  // ── DOB popover ───────────────────────────────────────
  const [dobOpen, setDobOpen] = useState(false);

  // ── Lock account confirmation dialog (US-4.3.1) ───────
  const [showLockDialog, setShowLockDialog] = useState(false);

  // ── Media state (US-4.3.2) ────────────────────────────
  const [media, setMedia] = useState<CoachMediaState>(INITIAL_MEDIA_STATE);

  // ── Availability state (US-4.3.3) ─────────────────────
  const [availability, setAvailability] = useState<CoachAvailabilityState>(
    createInitialAvailability(),
  );

  // ── Professional state (US-4.3.4) ─────────────────────
  const [professional, setProfessional] = useState<CoachProfessionalState>(
    createInitialProfessional(),
  );
  const [professionalErrors, setProfessionalErrors] =
    useState<ProfessionalErrors>({});

  // ── Load edit data (wired to real API) ────────────────
  useEffect(() => {
    if (!isEditMode || !id) return;
    setIsLoading(true);
    let cancelled = false;
    import("@/services/admin.service").then(({ adminService }) => {
      adminService
        .getProvider(id)
        .then((res: Record<string, unknown>) => {
          if (cancelled) return;
          const p =
            (res as Record<string, unknown>)?.data ||
            (res as Record<string, unknown>)?.provider ||
            res;
          if (!p || !(p as Record<string, unknown>).id) {
            toast.error("Coach not found");
            navigate("/providers");
            setIsLoading(false);
            return;
          }
          const pr = p as Record<string, unknown>;
          const mobile = String(pr.mobile || pr.phone || "");
          const cc = String(pr.country_code || "+971");
          const mobileNum = mobile.replace(cc, "").trim();

          const formData: CoachFormState = {
            firstName: String(pr.first_name || pr.first_name_en || ""),
            lastName: String(pr.last_name || pr.last_name_en || ""),
            email: String(pr.email || ""),
            countryCode: cc,
            mobile: mobileNum,
            gender: String(pr.gender || ""),
            dob: pr.date_of_birth ? String(pr.date_of_birth) : "",
            nationality: String(pr.nationality || ""),
            city: String(pr.city || ""),
            aboutMe: String(pr.about || pr.bio || ""),
          };
          setForm(formData);
          initialEmailRef.current = formData.email;
          setIsLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            toast.error("Failed to load coach data");
            navigate("/providers");
            setIsLoading(false);
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, navigate]);

  // ── Field updater ─────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof CoachFormState>(field: K, value: CoachFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    [],
  );

  // ── Touch handler ─────────────────────────────────────
  const touchField = useCallback((field: keyof CoachFormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // ── Validate single field ─────────────────────────────
  const validateField = useCallback(
    (field: keyof CoachFormState, value: unknown): string | null => {
      switch (field) {
        case "firstName":
          return validateFirstName(value as string);
        case "lastName":
          return validateLastName(value as string);
        case "dob":
          return validateDOB(value as Date | null);
        case "gender":
          return validateGender(value as string);
        case "email":
          return validateEmail(value as string);
        case "mobileNumber":
          return validateMobileNumber(value as string);
        case "nationality":
          return validateNationality(value as string);
        default:
          return null;
      }
    },
    [],
  );

  // ── Validate on blur ──────────────────────────────────
  const handleBlur = useCallback(
    (field: keyof CoachFormState) => {
      touchField(field);
      const err = validateField(field, form[field]);
      setErrors((prev) => {
        if (err) return { ...prev, [field]: err };
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [form, touchField, validateField],
  );

  // ── Email async uniqueness check ──────────────────────
  useEffect(() => {
    if (emailCheckRef.current) clearTimeout(emailCheckRef.current);

    const trimmed = form.email.trim();
    // Skip if email is the same as initial (edit mode)
    if (
      isEditMode &&
      trimmed.toLowerCase() === initialEmailRef.current.toLowerCase()
    ) {
      setEmailCheckState("idle");
      return;
    }

    const formatErr = validateEmail(trimmed);
    if (formatErr || !trimmed) {
      setEmailCheckState("idle");
      return;
    }

    setEmailCheckState("checking");
    emailCheckRef.current = setTimeout(async () => {
      const isDuplicate = await checkEmailDuplicate(trimmed);
      setEmailCheckState(isDuplicate ? "duplicate" : "unique");
      if (isDuplicate) {
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered",
        }));
      }
    }, 600);

    return () => {
      if (emailCheckRef.current) clearTimeout(emailCheckRef.current);
    };
  }, [form.email, isEditMode]);

  // ── Image upload handler ──────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input for re-selection
    e.target.value = "";

    // Validate type
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed.");
      return;
    }
    // Validate size
    if (file.size > MAX_PHOTO_SIZE) {
      toast.error(`Image must be under ${formatFileSize(MAX_PHOTO_SIZE)}.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (_blob: Blob, previewUrl: string) => {
    updateField("profileImage", previewUrl);
    setCropperOpen(false);
    setRawImageSrc("");
  };

  const handleRemoveImage = () => {
    updateField("profileImage", null);
  };

  // ── Validate all fields ───────────────────────────────
  const validateAll = useCallback((): boolean => {
    const fields: (keyof CoachFormState)[] = [
      "firstName",
      "lastName",
      "dob",
      "gender",
      "email",
      "mobileNumber",
      "nationality",
    ];
    const newErrors: CoachFieldErrors = {};
    const newTouched: CoachTouchedFields = {};
    let valid = true;

    for (const f of fields) {
      newTouched[f] = true;
      const err = validateField(f, form[f]);
      if (err) {
        newErrors[f] = err;
        valid = false;
      }
    }

    // Check email uniqueness
    if (emailCheckState === "duplicate") {
      newErrors.email = "This email is already registered";
      valid = false;
    }

    setErrors(newErrors);
    setTouched(newTouched);

    // Validate professional section
    const profErrors = validateProfessional(professional);
    setProfessionalErrors(profErrors);
    if (Object.keys(profErrors).length > 0) valid = false;

    return valid;
  }, [form, emailCheckState, validateField, professional]);

  // ── Submit handler ────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fix the errors before submitting.");
      // Auto-scroll to the first section with errors (Scenario 7)
      const firstErrorSection =
        Object.keys(errors).length > 0
          ? "sec-personal"
          : Object.keys(professionalErrors).length > 0
            ? "sec-professional"
            : null;
      if (firstErrorSection) {
        setTimeout(() => {
          document
            .getElementById(firstErrorSection)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
      return;
    }
    if (emailCheckState === "checking") {
      toast.info("Please wait for the email check to complete.");
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSaving(false);
    setIsDirty(false);
    toast.success(
      isEditMode ? "Coach updated successfully" : "Coach created successfully",
    );
    navigate("/providers?tab=coach");
  };

  // ── Navigation guard ──────────────────────────────────
  const handleBack = () => {
    if (isDirty) {
      setPendingNavPath("/providers?tab=coach");
      setShowLeaveDialog(true);
    } else {
      navigate("/providers?tab=coach");
    }
  };

  const confirmLeave = () => {
    setShowLeaveDialog(false);
    if (pendingNavPath) navigate(pendingNavPath);
  };

  // ── Age display helper ────────────────────────────────
  const ageDisplay = form.dob
    ? `${differenceInYears(new Date(), form.dob)} years old`
    : null;

  // ── Loading skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-9 rounded" />
          <Skeleton className="h-7 w-64" />
        </div>
        <div className="bg-white border rounded-xl p-6 space-y-6">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-9 shrink-0"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl text-[#111827] tracking-tight">
              {isEditMode ? "Edit Freelancer Coach" : "Create Freelancer Coach"}
            </h1>
            {isEditMode && id && (
              <p className="text-xs text-[#6B7280] mt-0.5">ID: {id}</p>
            )}
          </div>
        </div>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-[#003B95] hover:bg-[#002d73] text-white gap-1.5"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />{" "}
              {isEditMode ? "Update Coach" : "Create Coach"}
            </>
          )}
        </Button>
      </div>

      {/* ── Section Navigation Bar ────────────────────── */}
      <div className="sticky top-0 z-40 -mx-1 px-1">
        <div className="bg-white/95 backdrop-blur-sm border rounded-lg px-2 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-hide shadow-sm">
          {[
            {
              id: "sec-personal",
              label: "Personal",
              icon: <User className="h-3 w-3" />,
              hasError: Object.keys(errors).length > 0,
            },
            {
              id: "sec-professional",
              label: "Professional",
              icon: <GraduationCap className="h-3 w-3" />,
              hasError: Object.keys(professionalErrors).length > 0,
            },
            {
              id: "sec-status",
              label: "Status",
              icon: <ShieldCheck className="h-3 w-3" />,
              hasError: false,
            },
            {
              id: "sec-media",
              label: "Media",
              icon: <Upload className="h-3 w-3" />,
              hasError: false,
            },
            {
              id: "sec-availability",
              label: "Availability",
              icon: <CalendarIcon className="h-3 w-3" />,
              hasError: false,
            },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                document
                  .getElementById(sec.id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors",
                "hover:bg-gray-100 text-[#374151]",
                sec.hasError && "text-red-600",
              )}
            >
              {sec.icon}
              {sec.label}
              {sec.hasError && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          Section 1: Personal Information
          ════════════���══════════════════════════════════════ */}
      <div
        id="sec-personal"
        className="bg-white border rounded-xl overflow-hidden scroll-mt-16"
      >
        <div className="px-6 py-4 border-b bg-gray-50/50">
          <h2 className="text-sm text-[#111827] flex items-center gap-2">
            <User className="h-4 w-4 text-[#003B95]" />
            Personal Information
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Enter the coach's personal details and profile image.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Profile Image ─────────────────────────── */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {form.profileImage ? (
                <img
                  src={form.profileImage}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
                {form.profileImage ? "Change" : "Upload Photo"}
              </Button>
              {form.profileImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" /> Remove
                </Button>
              )}
            </div>
            <p className="text-[10px] text-[#9CA3AF]">
              JPG or PNG, max 5MB. 1:1 aspect ratio recommended.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* ── Name Fields ───────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-sm text-[#374151]">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                onBlur={() => handleBlur("firstName")}
                placeholder="Enter first name"
                maxLength={100}
                className={cn(
                  "h-10",
                  touched.firstName &&
                    errors.firstName &&
                    "border-red-300 ring-1 ring-red-200",
                )}
              />
              {touched.firstName && errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-sm text-[#374151]">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                onBlur={() => handleBlur("lastName")}
                placeholder="Enter last name"
                maxLength={100}
                className={cn(
                  "h-10",
                  touched.lastName &&
                    errors.lastName &&
                    "border-red-300 ring-1 ring-red-200",
                )}
              />
              {touched.lastName && errors.lastName && (
                <p className="text-xs text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* ── DOB & Gender ──────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* DOB */}
            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151]">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Popover open={dobOpen} onOpenChange={setDobOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full h-10 justify-start text-left text-sm",
                      !form.dob && "text-[#9CA3AF]",
                      touched.dob &&
                        errors.dob &&
                        "border-red-300 ring-1 ring-red-200",
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-2 text-gray-400 ml-auto" />
                    {form.dob
                      ? format(form.dob, "dd/MM/yyyy")
                      : "Select date of birth"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.dob ?? undefined}
                    onSelect={(date) => {
                      updateField("dob", date ?? null);
                      setDobOpen(false);
                      // Immediate validation
                      const err = validateDOB(date ?? null);
                      setTouched((p) => ({ ...p, dob: true }));
                      setErrors((p) =>
                        err
                          ? { ...p, dob: err }
                          : (() => {
                              const n = { ...p };
                              delete n.dob;
                              return n;
                            })(),
                      );
                    }}
                    disabled={(date) => date > new Date()}
                    defaultMonth={form.dob ?? new Date(2000, 0, 1)}
                    captionLayout="dropdown-buttons"
                    fromYear={1940}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
              {touched.dob && errors.dob ? (
                <p className="text-xs text-red-500">{errors.dob}</p>
              ) : ageDisplay ? (
                <p className="text-xs text-[#6B7280]">{ageDisplay}</p>
              ) : null}
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151]">
                Gender <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={form.gender}
                onValueChange={(v) => {
                  updateField("gender", v as Gender);
                  setTouched((p) => ({ ...p, gender: true }));
                  setErrors((p) => {
                    const n = { ...p };
                    delete n.gender;
                    return n;
                  });
                }}
                className="flex items-center gap-4 h-10 pt-1"
              >
                {GENDERS.map((g) => (
                  <div key={g} className="flex items-center gap-1.5">
                    <RadioGroupItem value={g} id={`gender-${g}`} />
                    <Label
                      htmlFor={`gender-${g}`}
                      className="text-sm text-[#374151] cursor-pointer"
                    >
                      {g}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {touched.gender && errors.gender && (
                <p className="text-xs text-red-500">{errors.gender}</p>
              )}
            </div>
          </div>

          {/* ── Email ────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-[#374151]">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="coach@example.com"
                className={cn(
                  "h-10 pr-9",
                  touched.email &&
                    errors.email &&
                    "border-red-300 ring-1 ring-red-200",
                  emailCheckState === "unique" &&
                    "border-emerald-300 ring-1 ring-emerald-200",
                )}
              />
              {/* Async check indicator */}
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {emailCheckState === "checking" && (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                )}
                {emailCheckState === "unique" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                {emailCheckState === "duplicate" && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            {touched.email && errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
            {emailCheckState === "unique" && (
              <p className="text-xs text-emerald-600">Email is available</p>
            )}
          </div>

          {/* ── Mobile Number ─────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#374151]">
              Mobile Number <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <CountryCodeDropdown
                value={form.countryCode}
                onChange={(v) => updateField("countryCode", v)}
              />
              <Input
                value={form.mobileNumber}
                onChange={(e) => {
                  // Only allow digits
                  const v = e.target.value.replace(/\D/g, "");
                  updateField("mobileNumber", v);
                }}
                onBlur={() => handleBlur("mobileNumber")}
                placeholder="50 123 4567"
                maxLength={15}
                className={cn(
                  "h-10 flex-1",
                  touched.mobileNumber &&
                    errors.mobileNumber &&
                    "border-red-300 ring-1 ring-red-200",
                )}
              />
            </div>
            {touched.mobileNumber && errors.mobileNumber && (
              <p className="text-xs text-red-500">{errors.mobileNumber}</p>
            )}
          </div>

          {/* ── Nationality ───────────────────────────── */}
          <SearchableDropdown
            label="Nationality"
            value={form.nationality}
            options={NATIONALITIES}
            placeholder="Select nationality"
            required
            error={touched.nationality ? errors.nationality : undefined}
            onChange={(v) => {
              updateField("nationality", v);
              setTouched((p) => ({ ...p, nationality: true }));
              setErrors((p) => {
                const n = { ...p };
                delete n.nationality;
                return n;
              });
            }}
          />

          {/* ── Languages ─────────────────────────────── */}
          <MultiSelectTags
            label="Languages"
            values={form.languages}
            options={LANGUAGES}
            placeholder="Select languages"
            onChange={(v) => updateField("languages", v)}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          Section 2: Professional Information (US-4.3.4)
          ═══════════════════════════════════════════════════ */}
      <div id="sec-professional" className="scroll-mt-16">
        <CoachProfessionalSection
          professional={professional}
          setProfessional={setProfessional}
          onDirty={() => setIsDirty(true)}
          errors={professionalErrors}
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          Section 3: Status & Verification (US-4.3.1)
          ═══════════════════════════════════════════════════ */}
      <div
        id="sec-status"
        className="bg-white border rounded-xl overflow-hidden scroll-mt-16"
      >
        <div className="px-6 py-4 border-b bg-gray-50/50">
          <h2 className="text-sm text-[#111827] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#003B95]" />
            Status & Verification
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            View verification status and control account &amp; platform access.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Verification Status (read-only badge) ──── */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#374151]">
              Verification Status
            </Label>
            <div className="flex items-center gap-3">
              {form.verificationStatus === "Pending" && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800 border-amber-200 text-xs px-3 py-1 gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Pending
                </Badge>
              )}
              {form.verificationStatus === "Approved" && (
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-1 gap-1.5"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Approved
                </Badge>
              )}
              {form.verificationStatus === "Rejected" && (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 border-red-200 text-xs px-3 py-1 gap-1.5"
                >
                  <XCircle className="h-3 w-3" />
                  Rejected
                </Badge>
              )}
              <span className="text-[11px] text-[#9CA3AF]">
                This field is managed through the onboarding approval workflow.
              </span>
            </div>
          </div>

          {/* ── Account Status (Locked/Unlocked toggle) ── */}
          <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg border bg-gray-50/50">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                  form.accountStatus === "Locked"
                    ? "bg-red-100"
                    : "bg-emerald-100",
                )}
              >
                {form.accountStatus === "Locked" ? (
                  <Lock className="h-4 w-4 text-red-600" />
                ) : (
                  <Unlock className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[#111827]">Account Status</p>
                <p className="text-xs text-[#6B7280]">
                  {form.accountStatus === "Locked"
                    ? "Account is locked. Coach cannot log in."
                    : "Account is unlocked and accessible."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "text-xs",
                  form.accountStatus === "Locked"
                    ? "text-red-600"
                    : "text-emerald-600",
                )}
              >
                {form.accountStatus}
              </span>
              <Switch
                checked={form.accountStatus === "Unlocked"}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    // Locking requires confirmation
                    setShowLockDialog(true);
                  } else {
                    updateField("accountStatus", "Unlocked");
                    toast.success("Account unlocked.");
                  }
                }}
                aria-label="Toggle account status"
              />
            </div>
          </div>

          {/* ── Platform Status (Active/Inactive toggle) ── */}
          <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg border bg-gray-50/50">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                  form.platformStatus === "Active"
                    ? "bg-emerald-100"
                    : "bg-gray-100",
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    form.platformStatus === "Active"
                      ? "bg-emerald-500"
                      : "bg-gray-400",
                  )}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[#111827]">Platform Status</p>
                <p className="text-xs text-[#6B7280]">
                  {form.platformStatus === "Active"
                    ? "Coach is visible and bookable on the platform."
                    : "Coach is hidden from the platform."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "text-xs",
                  form.platformStatus === "Active"
                    ? "text-emerald-600"
                    : "text-gray-500",
                )}
              >
                {form.platformStatus}
              </span>
              <Switch
                checked={form.platformStatus === "Active"}
                onCheckedChange={(checked) => {
                  updateField(
                    "platformStatus",
                    checked ? "Active" : "Inactive",
                  );
                  toast.success(
                    checked
                      ? "Coach is now active on the platform."
                      : "Coach is now inactive.",
                  );
                }}
                aria-label="Toggle platform status"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          Section 4: Media (US-4.3.2)
          ═══════════════════════════════════════════════════ */}
      <div id="sec-media" className="scroll-mt-16">
        <CoachMediaSection
          media={media}
          setMedia={setMedia}
          onDirty={() => setIsDirty(true)}
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          Section 5: Availability & Cost (US-4.3.3)
          ═══════════════════════════════════════════════════ */}
      <div id="sec-availability" className="scroll-mt-16">
        <CoachAvailabilitySection
          availability={availability}
          setAvailability={setAvailability}
          onDirty={() => setIsDirty(true)}
        />
      </div>

      {/* ── Sticky bottom bar (mobile-friendly) ──────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-[#003B95] hover:bg-[#002d73] text-white gap-1.5"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />{" "}
              {isEditMode ? "Update Coach" : "Create Coach"}
            </>
          )}
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════
          Image Cropper (shared component)
          ═══════════════════════════════════════════════════ */}
      <ImageCropper
        open={cropperOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCropperOpen(false);
            setRawImageSrc("");
          }
        }}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
        {...CROP_PRESETS.coachProfile}
      />

      {/* ═══════════════════════════════════════════════════
          Lock Account Confirmation Dialog (US-4.3.1)
          ═══════════════════════════════════════════════════ */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-red-500" /> Lock Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to lock this coach's account? They will be
              unable to log in until the account is unlocked again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                updateField("accountStatus", "Locked");
                setShowLockDialog(false);
                toast.success("Account locked.");
              }}
              className="bg-red-600 hover:bg-red-700 gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" /> Lock Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════
          Unsaved Changes Dialog
          ═══════════════════════════════════════════════════ */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              className="bg-red-600 hover:bg-red-700"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
