import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { differenceInYears, isAfter, format } from "date-fns";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import {
  ArrowLeft,
  Loader2,
  CalendarIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  X,
  Upload,
  User,
} from "lucide-react";
import { cn } from "../../ui/utils";
import ImageCropper from "../../ImageCropper";
import { CROP_PRESETS } from "../../../../lib/cropPresets";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../ui/breadcrumb";
import { GENDER_OPTIONS, COUNTRIES } from "./player-detail-data";
import type { PlayerStatus } from "./player-data";

// ─── Types ───────────────────────────────────────────────────

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date | undefined;
  gender: string;
  nationality: string;
  initialStatus: PlayerStatus;
}

const INITIAL_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: undefined,
  gender: "",
  nationality: "",
  initialStatus: "Active",
};

const STATUS_OPTIONS: { value: PlayerStatus; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Locked", label: "Locked" },
];

// Email duplicate check is handled server-side during creation
// Valid profile picture formats (AC-PM-027)
const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];

// ─── Banner ──────────────────────────────────────────────────

type BannerType = "success" | "error" | "info" | "warning";
interface BannerState {
  type: BannerType;
  message: string;
  visible: boolean;
}

const BANNER_STYLES: Record<
  BannerType,
  { bg: string; border: string; text: string; icon: React.ElementType }
> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: XCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: Info,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: AlertTriangle,
  },
};

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1 text-xs text-red-600 mt-1"
    >
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function HelperText({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <p id={id} className="text-[11px] text-[#9CA3AF] mt-1">
      {children}
    </p>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function CreatePlayerPage() {
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [dobOpen, setDobOpen] = useState(false);
  const [countries, setCountries] = useState<{ id: string; name_en: string }[]>(
    [],
  );

  useEffect(() => {
    adminService
      .listMasterData("countries", { limit: 200, status: "active" })
      .then((res: any) => {
        if (res?.data?.items) setCountries(res.data.items);
      });
  }, []);

  // ── Profile picture state (AC-PM-027) ───────────────────
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [pictureError, setPictureError] = useState("");
  const pictureInputRef = useRef<HTMLInputElement>(null);

  // ── Image cropper state ─────────────────────────────────
  const [cropRawSrc, setCropRawSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  const [banner, setBanner] = useState<BannerState>({
    type: "info",
    message: "",
    visible: false,
  });
  const showBanner = useCallback((type: BannerType, message: string) => {
    setBanner({ type, message, visible: true });
    if (type === "success" || type === "info")
      setTimeout(() => setBanner((b) => ({ ...b, visible: false })), 6000);
  }, []);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const fieldRefs: Record<string, React.RefObject<HTMLInputElement | null>> = {
    firstName: useRef<HTMLInputElement>(null),
    lastName: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
  };

  const trimmedValue = (s: string) => s.trim().replace(/\s+/g, " ");

  const updateField = (
    field: keyof FormData,
    value: string | Date | undefined | PlayerStatus,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  // ── Profile picture handler (AC-PM-027) ─────────────────
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPictureError("");
    if (!file) return;
    e.target.value = "";
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setPictureError("Please upload a valid image file (JPG, PNG, GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPictureError("File size must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropRawSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePictureCropComplete = (blob: Blob, previewUrl: string) => {
    const croppedFile = new File([blob], "profile-cropped.jpg", {
      type: "image/jpeg",
    });
    setProfilePicture(croppedFile);
    setProfilePicturePreview(previewUrl);
    setIsDirty(true);
  };

  const removePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
    setPictureError("");
    if (pictureInputRef.current) pictureInputRef.current.value = "";
  };

  // ── Validation ──────────────────────────────────────────
  const validateField = (field: string, showInline = true): string | null => {
    let error: string | null = null;
    switch (field) {
      case "firstName": {
        const v = trimmedValue(form.firstName);
        if (!v) error = "First name is required.";
        else if (v.length > 50) error = "First name is too long (max 50).";
        break;
      }
      case "lastName": {
        const v = trimmedValue(form.lastName);
        if (!v) error = "Last name is required.";
        else if (v.length > 50) error = "Last name is too long (max 50).";
        break;
      }
      case "email": {
        const v = form.email.trim().toLowerCase();
        if (!v) error = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
          error = "Please enter a valid email address."; // AC-PM-024
        // Duplicate email check handled server-side
        break;
      }
      case "phone": {
        const v = form.phone.trim();
        if (!v)
          error = "Mobile number is required."; // AC-PM-023
        else if (!/^[+\d\s\-()]+$/.test(v))
          error = "Please enter a valid mobile number."; // AC-PM-025
        break;
      }
      case "gender": {
        if (!form.gender) error = "Gender is required."; // AC-PM-023
        break;
      }
      case "nationality": {
        if (!form.nationality) error = "Nationality is required."; // AC-PM-023
        break;
      }
      case "dateOfBirth": {
        if (form.dateOfBirth) {
          if (isAfter(form.dateOfBirth, new Date()))
            error = "Date of birth cannot be in the future."; // AC-PM-026
          else if (differenceInYears(new Date(), form.dateOfBirth) < 13)
            error = "Player must be at least 13 years old.";
        }
        break;
      }
    }
    if (showInline && error)
      setErrors((prev) => ({ ...prev, [field]: error! }));
    else if (showInline && !error)
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    return error;
  };

  const handleBlur = (field: string) => validateField(field);

  const validateAll = (): boolean => {
    const fields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "gender",
      "nationality",
      "dateOfBirth",
    ];
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      const err = validateField(field, false);
      if (err) newErrors[field] = err;
    }
    setErrors(newErrors);
    const firstErr = fields.find((f) => newErrors[f]);
    if (firstErr && fieldRefs[firstErr]?.current)
      fieldRefs[firstErr].current?.focus();
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      showBanner(
        "error",
        "We couldn't create the player. Please review the errors and try again.",
      );
      return;
    }
    setIsSubmitting(true);
    setBanner((b) => ({ ...b, visible: false }));
    try {
      const payload: Record<string, unknown> = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        mobile: form.phone,
        gender: form.gender || undefined,
        date_of_birth: form.dateOfBirth
          ? format(form.dateOfBirth, "yyyy-MM-dd")
          : undefined,
        nationality_id: form.nationality || undefined,
      };
      const result = await adminService.createPlayer(payload);
      const newId = result.id || result.player?.id;
      setIsDirty(false);
      showBanner(
        "success",
        `Player created. A password setup email has been sent to ${form.email}.`,
      );
      toast.success("Player created successfully.");
      if (newId) setTimeout(() => navigate(`/players/${newId}`), 1000);
    } catch (err: any) {
      const resp = err?.response?.data;
      const errorCode = resp?.error?.code;
      const errorMessage = resp?.message || "Failed to create player.";

      if (errorCode === "EMAIL_ALREADY_EXISTS") {
        setErrors((prev) => ({ ...prev, email: errorMessage }));
        fieldRefs.email.current?.focus();
      } else if (errorCode === "MOBILE_ALREADY_EXISTS") {
        setErrors((prev) => ({ ...prev, phone: errorMessage }));
        fieldRefs.phone.current?.focus();
      }

      const details = resp?.error?.details;
      if (details && Array.isArray(details) && details.length > 0) {
        const fieldMessages = details.map(
          (d: { field?: string; message?: string }) =>
            `${d.field || "Error"}: ${d.message || "Invalid value"}`,
        );
        showBanner("error", fieldMessages.join(". "));
        fieldMessages.forEach((m: string) => toast.error(m));
      } else {
        showBanner("error", errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) setDiscardDialogOpen(true);
    else navigate("/players");
  };

  const handleDiscard = () => {
    setDiscardDialogOpen(false);
    setIsDirty(false);
    navigate("/players");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      (e.target as HTMLInputElement).form?.requestSubmit();
    }
  };

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer hover:text-[#003B95] text-[#6B7280]"
              onClick={() => navigate("/")}
            >
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer hover:text-[#003B95] text-[#6B7280]"
              onClick={() =>
                isDirty ? setDiscardDialogOpen(true) : navigate("/players")
              }
            >
              Players
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[#111827]">
              Create New Player
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleCancel}
          aria-label="Back to Players"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-2xl tracking-tight text-[#111827] outline-none"
        >
          Create New Player
        </h1>
      </div>

      {/* Banner */}
      {banner.visible && (
        <div
          role={banner.type === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border",
            BANNER_STYLES[banner.type].bg,
            BANNER_STYLES[banner.type].border,
            BANNER_STYLES[banner.type].text,
          )}
        >
          {(() => {
            const Icon = BANNER_STYLES[banner.type].icon;
            return <Icon className="h-4 w-4 shrink-0" />;
          })()}
          <p className="text-sm flex-1">{banner.message}</p>
          <button
            onClick={() => setBanner((b) => ({ ...b, visible: false }))}
            className="p-1 rounded hover:bg-black/5"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          noValidate
          className="p-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
            {/* ── Profile Picture (AC-PM-013, AC-PM-027) ─────── */}
            <div className="lg:col-span-2 space-y-1.5">
              <Label className="text-sm text-[#374151]">
                Profile Picture{" "}
                <span className="text-[#9CA3AF]">(optional)</span>
              </Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    ref={pictureInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    id="profile-picture"
                    onChange={handlePictureChange}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => pictureInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      <Upload className="h-3 w-3" />
                      {profilePicture ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {profilePicture && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-500 hover:text-red-700"
                        onClick={removePicture}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {pictureError ? (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {pictureError}
                    </p>
                  ) : (
                    <HelperText>JPG, PNG, or GIF only. Max 5 MB.</HelperText>
                  )}
                </div>
              </div>
            </div>

            {/* First Name */}
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-sm text-[#374151]">
                First Name<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                ref={fieldRefs.firstName as React.RefObject<HTMLInputElement>}
                id="firstName"
                placeholder="Jordan"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                onBlur={() => handleBlur("firstName")}
                maxLength={55}
                aria-required="true"
                aria-invalid={!!errors.firstName}
                disabled={isSubmitting}
                className={cn(errors.firstName && "border-red-400")}
              />
              {errors.firstName && (
                <FieldError id="err-firstName" message={errors.firstName} />
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-sm text-[#374151]">
                Last Name<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                ref={fieldRefs.lastName as React.RefObject<HTMLInputElement>}
                id="lastName"
                placeholder="Parker"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                onBlur={() => handleBlur("lastName")}
                maxLength={55}
                aria-required="true"
                aria-invalid={!!errors.lastName}
                disabled={isSubmitting}
                className={cn(errors.lastName && "border-red-400")}
              />
              {errors.lastName && (
                <FieldError id="err-lastName" message={errors.lastName} />
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-[#374151]">
                Email<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                ref={fieldRefs.email as React.RefObject<HTMLInputElement>}
                id="email"
                type="email"
                placeholder="jordan.parker@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                aria-required="true"
                aria-invalid={!!errors.email}
                disabled={isSubmitting}
                className={cn(errors.email && "border-red-400")}
              />
              {errors.email ? (
                <FieldError id="err-email" message={errors.email} />
              ) : (
                <HelperText id="hint-email">
                  Will be normalized to lowercase.
                </HelperText>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm text-[#374151]">
                Mobile Number<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                ref={fieldRefs.phone as React.RefObject<HTMLInputElement>}
                id="phone"
                placeholder="+1 415 555 0137"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                onBlur={() => handleBlur("phone")}
                aria-required="true"
                aria-invalid={!!errors.phone}
                disabled={isSubmitting}
                className={cn(errors.phone && "border-red-400")}
              />
              {errors.phone && (
                <FieldError id="err-phone" message={errors.phone} />
              )}
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-sm text-[#374151]">
                Gender<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Select
                value={form.gender.toLowerCase()}
                onValueChange={(v) => {
                  updateField("gender", v);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="gender"
                  className={cn("h-10", errors.gender && "border-red-400")}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g.toLowerCase()}>
                      {g.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && (
                <FieldError id="err-gender" message={errors.gender} />
              )}
            </div>

            {/* Nationality */}
            <div className="space-y-1.5">
              <Label htmlFor="nationality" className="text-sm text-[#374151]">
                Nationality<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Select
                value={form.nationality.toLowerCase()}
                onValueChange={(v) => {
                  updateField("nationality", v);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="nationality"
                  className={cn("h-10", errors.nationality && "border-red-400")}
                >
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nationality && (
                <FieldError id="err-nationality" message={errors.nationality} />
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151]">Date of Birth</Label>
              <Popover open={dobOpen} onOpenChange={setDobOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isSubmitting}
                    className={cn(
                      "w-full justify-start gap-2 text-sm h-10",
                      !form.dateOfBirth && "text-muted-foreground",
                      errors.dateOfBirth && "border-red-400",
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {form.dateOfBirth
                      ? format(form.dateOfBirth, "MMM d, yyyy")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.dateOfBirth}
                    onSelect={(d) => {
                      updateField("dateOfBirth", d);
                      setDobOpen(false);
                      setTimeout(() => handleBlur("dateOfBirth"), 0);
                    }}
                    disabled={(d) => isAfter(d, new Date())}
                    defaultMonth={form.dateOfBirth || new Date(2000, 0)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth ? (
                <FieldError id="err-dob" message={errors.dateOfBirth} />
              ) : (
                <HelperText id="hint-dob">
                  Player must be at least 13 years old.
                </HelperText>
              )}
            </div>

            {/* Initial Status */}
            <div className="space-y-1.5">
              <Label htmlFor="initialStatus" className="text-sm text-[#374151]">
                Initial Status
              </Label>
              <Select
                value={form.initialStatus.toLowerCase()}
                onValueChange={(v) =>
                  updateField("initialStatus", v as PlayerStatus)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="initialStatus" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value.toLowerCase()}>
                      {s.label.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <HelperText>Initial status at account creation.</HelperText>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="sm:w-auto w-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#003B95] hover:bg-[#002a6b] gap-2 sm:w-auto w-full"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating Player…" : "Save"}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Image Cropper ───────────────────────────────────── */}
      <ImageCropper
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropRawSrc}
        onCropComplete={handlePictureCropComplete}
        {...CROP_PRESETS.profilePhoto}
      />

      {/* Discard Dialog */}
      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you leave now, your progress will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on page</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-red-600 hover:bg-red-700"
            >
              Discard &amp; leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
