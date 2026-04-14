import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File as FileIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarIcon,
  Search,
  ChevronDown,
  User,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import ImageCropper from "../../../ImageCropper";
import { CROP_PRESETS } from "../../../../../lib/cropPresets";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Skeleton } from "../../../ui/skeleton";
import { Progress } from "../../../ui/progress";
import { Calendar } from "../../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
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
import { getTrainingProviderDetail } from "../detail/training-provider-detail-data";
import { AdminProviderCompleteProfilePage } from "../AdminProviderCompleteProfilePage";
import {
  COUNTRY_CODES,
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_EXTENSIONS,
  ACCEPTED_PHOTO_TYPES,
  MAX_DOC_SIZE,
  MAX_PHOTO_SIZE,
  type UploadedFile,
  checkEmailDuplicate,
  validateClubName,
  validateName,
  validateEmail,
  validateMobileNumber,
  validateLandline,
  validateDateOfIncorporation,
  formatFileSize,
} from "./training-provider-form-data";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface FormState {
  clubName: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  mobileNumber: string;
  dateOfIncorporation: Date | null;
  landline: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;
type TouchedFields = Partial<Record<keyof FormState, boolean>>;

type EmailCheckState = "idle" | "checking" | "unique" | "duplicate";

// ═══════════════════════════════════════════════════════════════
// File type → icon helper
// ═══════════════════════════════════════════════════════════════

function docIcon(type: string) {
  if (type.includes("pdf"))
    return <FileText className="h-4 w-4 text-red-500" />;
  if (type.includes("image"))
    return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (type.includes("sheet") || type.includes("excel"))
    return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
  if (type.includes("word") || type.includes("doc"))
    return <FileIcon className="h-4 w-4 text-blue-400" />;
  return <FileIcon className="h-4 w-4 text-gray-400" />;
}

// ═══════════════════════════════════════════════════════════════
// Country Code Dropdown
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
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setSearch("");
        }}
        className="flex items-center gap-1.5 h-10 px-2.5 border border-gray-200 rounded-lg bg-white text-sm hover:bg-gray-50 transition-colors min-w-[120px]"
        aria-label="Select country code"
        aria-expanded={open}
      >
        <span className="text-base">{selected.flag}</span>
        <span className="text-[#111827]">{selected.code}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-gray-400 ml-auto transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full h-8 pl-8 pr-3 text-sm border border-gray-200 rounded-md outline-none focus:border-[#003B95] focus:ring-1 focus:ring-[#003B95]/20"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-44">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">
                No results
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.iso}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#003B95]/5 transition-colors text-left",
                    c.code === value && "bg-[#003B95]/5",
                  )}
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="text-[#111827] truncate flex-1">
                    {c.name}
                  </span>
                  <span className="text-gray-400 text-xs">{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Form Page
// ═══════════════════════════════════════════════════════════════

export function TrainingProviderFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // ── Loading state for edit mode ─────────────────────────────
  const [loading, setLoading] = useState(isEditMode);
  const [notFound, setNotFound] = useState(false);

  // ── Form state ──────────────────────────────────────────────
  const [form, setForm] = useState<FormState>({
    clubName: "",
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+971",
    mobileNumber: "",
    dateOfIncorporation: null,
    landline: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [emailCheckState, setEmailCheckState] =
    useState<EmailCheckState>("idle");
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<UploadedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Image cropper state ─────────────────────────────────
  const [cropRawSrc, setCropRawSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // ── Refs ────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const initialFormRef = useRef<string>("");
  const emailCheckAbort = useRef<AbortController | null>(null);

  // ── Load edit data (wired to real API) ──────────────────────
  useEffect(() => {
    if (!isEditMode || !id) return;
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
            setNotFound(true);
            setLoading(false);
            return;
          }
          const pr = p as Record<string, unknown>;
          const mobile = String(pr.mobile || pr.phone || "");
          const cc = String(pr.country_code || "+971");
          const mobileNum = mobile.replace(cc, "").trim();

          const formData: FormState = {
            clubName: String(pr.business_name || pr.club_name || ""),
            firstName: String(pr.first_name || pr.first_name_en || ""),
            lastName: String(pr.last_name || pr.last_name_en || ""),
            email: String(pr.email || ""),
            countryCode: cc,
            mobileNumber: mobileNum,
            dateOfIncorporation: pr.date_of_incorporation
              ? new Date(String(pr.date_of_incorporation))
              : null,
            landline: String(pr.landline || ""),
          };

          setForm(formData);
          initialFormRef.current = JSON.stringify(formData);
          setEmailCheckState("unique");
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [id, isEditMode]);

  // ── Track dirty state ───────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const currentStr = JSON.stringify(form);
    const dirty = isEditMode
      ? currentStr !== initialFormRef.current
      : Object.values(form).some((v) =>
          typeof v === "string" ? v.trim() !== "" : v !== null,
        ) || documents.length > 0;
    setIsDirty(dirty);
  }, [form, documents, loading, isEditMode]);

  // ── Browser beforeunload for unsaved changes ────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Update field ────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing again
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  // ── Validate single field ──────────────────────────────────
  const validateField = useCallback(
    (field: keyof FormState, value: unknown): string | null => {
      switch (field) {
        case "clubName":
          return validateClubName(value as string);
        case "firstName":
          return validateName(value as string, "First Name");
        case "lastName":
          return validateName(value as string, "Last Name");
        case "email":
          return validateEmail(value as string);
        case "mobileNumber":
          return validateMobileNumber(value as string);
        case "landline":
          return validateLandline(value as string);
        case "dateOfIncorporation":
          return validateDateOfIncorporation(value as Date | null);
        default:
          return null;
      }
    },
    [],
  );

  // ── On blur handler ─────────────────────────────────────────
  const handleBlur = useCallback(
    (field: keyof FormState) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validateField(field, form[field]);
      setErrors((prev) => ({ ...prev, [field]: error ?? undefined }));

      // Async email check
      if (field === "email" && !error) {
        // Cancel any pending check
        if (emailCheckAbort.current) emailCheckAbort.current.abort();
        const controller = new AbortController();
        emailCheckAbort.current = controller;

        setEmailCheckState("checking");
        checkEmailDuplicate(form.email).then((isDuplicate) => {
          if (controller.signal.aborted) return;
          if (isDuplicate) {
            setEmailCheckState("duplicate");
            setErrors((prev) => ({
              ...prev,
              email: "Email already registered",
            }));
          } else {
            setEmailCheckState("unique");
          }
        });
      }
    },
    [form, validateField],
  );

  // ── Validate all fields ─────────────────────────────────────
  const validateAll = useCallback((): boolean => {
    const fields: (keyof FormState)[] = [
      "clubName",
      "firstName",
      "lastName",
      "email",
      "mobileNumber",
      "dateOfIncorporation",
      "landline",
    ];

    const newErrors: FieldErrors = {};
    const newTouched: TouchedFields = {};

    fields.forEach((field) => {
      newTouched[field] = true;
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    });

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [form, validateField]);

  // ── Check if form is submittable ────────────────────────────
  const isFormValid = useMemo(() => {
    const requiredFields: (keyof FormState)[] = [
      "clubName",
      "firstName",
      "lastName",
      "email",
      "mobileNumber",
      "dateOfIncorporation",
    ];

    const allFilled = requiredFields.every((f) => {
      const val = form[f];
      if (val === null) return false;
      if (typeof val === "string") return val.trim() !== "";
      return true;
    });

    const noErrors = Object.values(errors).every((e) => !e);
    const emailOk =
      emailCheckState === "unique" ||
      (isEditMode && emailCheckState === "idle");
    const docsOk =
      isEditMode ||
      documents.filter((d) => d.status === "complete").length >= 1;
    const allUploaded = documents.every((d) => d.status !== "uploading");

    return (
      allFilled && noErrors && emailOk && docsOk && allUploaded && !submitting
    );
  }, [form, errors, emailCheckState, documents, submitting, isEditMode]);

  // ═══════════════════════════════════════════════════════════
  // File Upload Handlers
  // ═══════════════════════════════════════════════════════════

  const processDocumentFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      // Validate type
      if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
        toast.error(
          "Unsupported file format. Accepted: PDF, PNG, JPEG, DOC, XLS.",
        );
        return;
      }
      // Validate size
      if (file.size > MAX_DOC_SIZE) {
        toast.error(`File exceeds 10MB: ${file.name}`);
        return;
      }

      const fileId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: "uploading",
      };

      setDocuments((prev) => [...prev, newFile]);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5 + Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === fileId
                ? { ...d, progress: 100, status: "complete" as const }
                : d,
            ),
          );
        } else {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === fileId ? { ...d, progress: Math.round(progress) } : d,
            ),
          );
        }
      }, 200);
    });
  }, []);

  const removeDocument = useCallback((fileId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== fileId));
  }, []);

  const processProfilePhoto = useCallback((file: File) => {
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      toast.error("Only JPG and PNG formats are accepted for profile photos.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      toast.error("Profile photo exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropRawSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePhotoCropComplete = useCallback(
    (_blob: Blob, previewUrl: string) => {
      const fileId = `photo-${Date.now()}`;
      setProfilePhoto({
        id: fileId,
        name: "profile-cropped.jpg",
        size: 0,
        type: "image/jpeg",
        progress: 0,
        status: "uploading",
        previewUrl,
      });

      // Simulate upload
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10 + Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setProfilePhoto((prev) =>
            prev
              ? { ...prev, progress: 100, status: "complete" as const }
              : null,
          );
        } else {
          setProfilePhoto((prev) =>
            prev ? { ...prev, progress: Math.round(progress) } : null,
          );
        }
      }, 200);
    },
    [],
  );

  // ── Drag & Drop ─────────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processDocumentFiles(e.dataTransfer.files);
      }
    },
    [processDocumentFiles],
  );

  // ═══════════════════════════════════════════════════════════
  // Submit
  // ═══════════════════════════════════════════════════════════

  const handleSubmit = useCallback(async () => {
    if (!validateAll()) return;
    if (emailCheckState === "duplicate") return;

    setSubmitting(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));

    setSubmitting(false);
    setIsDirty(false);

    if (isEditMode) {
      toast.success("Changes saved successfully.");
      navigate(`/providers/${id}`);
    } else {
      toast.success("Training provider created successfully.");
      navigate("/providers");
    }
  }, [validateAll, emailCheckState, isEditMode, navigate, id]);

  // ── Cancel ──────────────────────────────────────────────────
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setCancelDialogOpen(true);
    } else {
      navigate("/providers");
    }
  }, [isDirty, isEditMode, navigate, id]);

  const confirmCancel = useCallback(() => {
    setCancelDialogOpen(false);
    setIsDirty(false);
    navigate("/providers");
  }, [isEditMode, navigate, id]);

  // ═══════════════════════════════════════════════════════════
  // Loading skeleton
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div
        className="space-y-6 p-6 max-w-4xl mx-auto"
        aria-busy="true"
        aria-label="Loading form"
      >
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Not Found ───────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
        <h2 className="text-lg text-[#111827] mb-1">Provider Not Found</h2>
        <p className="text-sm text-gray-500 mb-4">
          The training provider you're looking for does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate("/providers")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Providers
        </Button>
      </div>
    );
  }

  if (isEditMode) {
    return <AdminProviderCompleteProfilePage variant="onboarding" />;
  }

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  const completedDocs = documents.filter((d) => d.status === "complete").length;
  const docsValid = isEditMode || completedDocs >= 1;

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen pb-24">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-9 shrink-0"
          onClick={handleCancel}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl text-[#111827]">
            {isEditMode ? "Edit Training Provider" : "Create Training Provider"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditMode
              ? "Update the training provider's information below."
              : "Fill in the details below to register a new training provider."}
          </p>
        </div>
      </div>

      {/* ── Form Card ────────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
        className="max-w-4xl"
      >
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {/* ─────── Section: Profile Photo ─────────────────── */}
          <div className="p-6">
            <h2 className="text-sm text-gray-500 mb-4 flex items-center gap-2">
              <Camera className="h-4 w-4" /> Profile Photo
              <Badge
                variant="outline"
                className="text-[10px] text-gray-400 border-gray-200 ml-1"
              >
                Optional
              </Badge>
            </h2>

            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="relative w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {profilePhoto?.previewUrl ? (
                  <img
                    src={profilePhoto.previewUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-gray-300" />
                )}
                {profilePhoto?.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      processProfilePhoto(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {profilePhoto ? "Replace" : "Upload Photo"}
                  </Button>
                  {profilePhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setProfilePhoto(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  JPG or PNG. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* ─────── Section: Basic Information ─────────────── */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm text-gray-500 mb-1">Basic Information</h2>

            {/* Club / Institute Name */}
            <div className="space-y-1.5">
              <Label htmlFor="clubName" className="text-xs text-gray-600">
                Club/Institute Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clubName"
                value={form.clubName}
                onChange={(e) => updateField("clubName", e.target.value)}
                onBlur={() => handleBlur("clubName")}
                placeholder="e.g. Dubai Elite Sports Academy"
                maxLength={200}
                className={cn(
                  "h-10 text-sm",
                  touched.clubName &&
                    errors.clubName &&
                    "border-red-400 focus-visible:ring-red-200",
                )}
                aria-invalid={!!(touched.clubName && errors.clubName)}
                aria-describedby={
                  touched.clubName && errors.clubName
                    ? "clubName-error"
                    : undefined
                }
              />
              <div className="flex justify-between">
                {touched.clubName && errors.clubName ? (
                  <p id="clubName-error" className="text-[11px] text-red-500">
                    {errors.clubName}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-gray-400">
                  {form.clubName.length}/200
                </span>
              </div>
            </div>

            {/* First / Last name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs text-gray-600">
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
                    "h-10 text-sm",
                    touched.firstName &&
                      errors.firstName &&
                      "border-red-400 focus-visible:ring-red-200",
                  )}
                  aria-invalid={!!(touched.firstName && errors.firstName)}
                  aria-describedby={
                    touched.firstName && errors.firstName
                      ? "firstName-error"
                      : undefined
                  }
                />
                {touched.firstName && errors.firstName && (
                  <p id="firstName-error" className="text-[11px] text-red-500">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs text-gray-600">
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
                    "h-10 text-sm",
                    touched.lastName &&
                      errors.lastName &&
                      "border-red-400 focus-visible:ring-red-200",
                  )}
                  aria-invalid={!!(touched.lastName && errors.lastName)}
                  aria-describedby={
                    touched.lastName && errors.lastName
                      ? "lastName-error"
                      : undefined
                  }
                />
                {touched.lastName && errors.lastName && (
                  <p id="lastName-error" className="text-[11px] text-red-500">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-gray-600">
                E-mail ID <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    updateField("email", e.target.value);
                    if (emailCheckState !== "idle") setEmailCheckState("idle");
                  }}
                  onBlur={() => handleBlur("email")}
                  placeholder="provider@example.ae"
                  className={cn(
                    "h-10 text-sm pr-10",
                    touched.email &&
                      errors.email &&
                      "border-red-400 focus-visible:ring-red-200",
                    emailCheckState === "unique" &&
                      "border-emerald-400 focus-visible:ring-emerald-200",
                  )}
                  aria-invalid={!!(touched.email && errors.email)}
                  aria-describedby="email-status"
                />
                {/* Status icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailCheckState === "checking" && (
                    <Loader2
                      className="h-4 w-4 text-gray-400 animate-spin"
                      aria-label="Checking email"
                    />
                  )}
                  {emailCheckState === "unique" && (
                    <CheckCircle2
                      className="h-4 w-4 text-emerald-500"
                      aria-label="Email is unique"
                    />
                  )}
                  {emailCheckState === "duplicate" && (
                    <XCircle
                      className="h-4 w-4 text-red-500"
                      aria-label="Email already registered"
                    />
                  )}
                </div>
              </div>
              {touched.email && errors.email && (
                <p id="email-status" className="text-[11px] text-red-500">
                  {errors.email}
                </p>
              )}
              {emailCheckState === "unique" && !errors.email && (
                <p id="email-status" className="text-[11px] text-emerald-600">
                  Email is available
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <Label htmlFor="mobileNumber" className="text-xs text-gray-600">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <CountryCodeDropdown
                  value={form.countryCode}
                  onChange={(code) => updateField("countryCode", code)}
                />
                <Input
                  id="mobileNumber"
                  value={form.mobileNumber}
                  onChange={(e) => {
                    // Allow digits, spaces, and dashes only
                    const val = e.target.value.replace(/[^\d\s\-]/g, "");
                    updateField("mobileNumber", val);
                  }}
                  onBlur={() => handleBlur("mobileNumber")}
                  placeholder="50 123 4567"
                  className={cn(
                    "h-10 text-sm flex-1",
                    touched.mobileNumber &&
                      errors.mobileNumber &&
                      "border-red-400 focus-visible:ring-red-200",
                  )}
                  aria-invalid={!!(touched.mobileNumber && errors.mobileNumber)}
                  aria-describedby={
                    touched.mobileNumber && errors.mobileNumber
                      ? "mobile-error"
                      : undefined
                  }
                />
              </div>
              {touched.mobileNumber && errors.mobileNumber ? (
                <p id="mobile-error" className="text-[11px] text-red-500">
                  {errors.mobileNumber}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400">
                  7-15 digits. Format: 50 123 4567
                </p>
              )}
            </div>

            {/* Date of Incorporation */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">
                Date of Incorporation <span className="text-red-500">*</span>
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left h-10 text-sm",
                      !form.dateOfIncorporation && "text-gray-400",
                      touched.dateOfIncorporation &&
                        errors.dateOfIncorporation &&
                        "border-red-400",
                    )}
                    aria-label="Select date of incorporation"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {form.dateOfIncorporation
                      ? format(form.dateOfIncorporation, "dd/MM/yyyy")
                      : "Select date..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.dateOfIncorporation ?? undefined}
                    onSelect={(date) => {
                      updateField("dateOfIncorporation", date ?? null);
                      setTouched((prev) => ({
                        ...prev,
                        dateOfIncorporation: true,
                      }));
                      setDatePickerOpen(false);
                      // Validate immediately
                      const err = validateDateOfIncorporation(date ?? null);
                      setErrors((prev) => ({
                        ...prev,
                        dateOfIncorporation: err ?? undefined,
                      }));
                    }}
                    disabled={{ after: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {touched.dateOfIncorporation && errors.dateOfIncorporation && (
                <p className="text-[11px] text-red-500">
                  {errors.dateOfIncorporation}
                </p>
              )}
            </div>

            {/* Landline */}
            <div className="space-y-1.5">
              <Label htmlFor="landline" className="text-xs text-gray-600">
                Landline Number
                <Badge
                  variant="outline"
                  className="text-[10px] text-gray-400 border-gray-200 ml-2"
                >
                  Optional
                </Badge>
              </Label>
              <Input
                id="landline"
                value={form.landline}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d\s\-+]/g, "");
                  updateField("landline", val);
                }}
                onBlur={() => handleBlur("landline")}
                placeholder="+971 4 300 0000"
                className={cn(
                  "h-10 text-sm",
                  touched.landline &&
                    errors.landline &&
                    "border-red-400 focus-visible:ring-red-200",
                )}
              />
              {touched.landline && errors.landline && (
                <p className="text-[11px] text-red-500">{errors.landline}</p>
              )}
            </div>
          </div>

          {/* ─────── Section: Official Documents ───────────── */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-gray-500 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Official Documents
                {!isEditMode && <span className="text-red-500">*</span>}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] border-gray-200",
                  !docsValid ? "text-red-500 border-red-200" : "text-gray-400",
                )}
              >
                {completedDocs} uploaded {!isEditMode && "(min 1 required)"}
              </Badge>
            </div>

            {/* Drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                dragOver
                  ? "border-[#003B95] bg-[#003B95]/5"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50/50",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  fileInputRef.current?.click();
              }}
              aria-label="Upload documents"
            >
              <Upload
                className={cn(
                  "h-8 w-8 mx-auto mb-3",
                  dragOver ? "text-[#003B95]" : "text-gray-300",
                )}
              />
              <p className="text-sm text-gray-600 mb-1">
                Drag files here or{" "}
                <span className="text-[#003B95] underline">
                  click to browse
                </span>
              </p>
              <p className="text-[11px] text-gray-400">
                Accepted: PDF, PNG, JPEG, DOC, XLS &bull; Max 10MB per file
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_DOC_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) processDocumentFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {/* File list */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    {docIcon(file.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#111827] truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                        {file.status === "uploading" && (
                          <span className="text-[11px] text-[#003B95]">
                            {file.progress}%
                          </span>
                        )}
                        {file.status === "complete" && (
                          <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Uploaded
                          </span>
                        )}
                      </div>
                      {file.status === "uploading" && (
                        <Progress
                          value={file.progress}
                          className="h-1.5 mt-1"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(file.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─────── Action Buttons (sticky bottom) ──────────── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#003B95] hover:bg-[#002d73] text-white min-w-[140px]"
              disabled={!isFormValid}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* ── Cancel Confirmation Dialog ────────────────────────── */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Leave anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmCancel}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Image Cropper ───────────────────────────────────── */}
      <ImageCropper
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropRawSrc}
        onCropComplete={handlePhotoCropComplete}
        {...CROP_PRESETS.trainingImage}
      />
    </div>
  );
}
