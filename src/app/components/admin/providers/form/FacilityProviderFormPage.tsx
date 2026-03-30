import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft, Upload, X, FileText, Image as ImageIcon,
  FileSpreadsheet, File as FileIcon, CheckCircle2,
  XCircle, Loader2, CalendarIcon, Search, ChevronDown,
  AlertTriangle, Building2, Globe, Clock, Info,
  ShieldCheck, Lock, Unlock, ClipboardList, Hash, CalendarClock,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Skeleton } from "../../../ui/skeleton";
import { Progress } from "../../../ui/progress";
import { Calendar } from "../../../ui/calendar";
import { Textarea } from "../../../ui/textarea";
import { Switch } from "../../../ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../../ui/alert-dialog";
import {
  COUNTRY_CODES,
  ACCEPTED_DOC_TYPES, ACCEPTED_DOC_EXTENSIONS,
  MAX_DOC_SIZE,
  checkEmailDuplicate,
  validateFacilityName, validateEmail, validateMobileNumber,
  validatePersonInCharge, validateDesignation,
  validateLandline, validateDateOfIncorporation,
  validateWebsite, formatFileSize,
  getFacilityProviderDetail, generateProviderId,
  validateAboutFacility, validateFacilityRules,
  validateCancellationPolicy, validateTimeRange,
  getWorkingDaysWarning, TIME_SLOTS, WEEKDAYS,
  validateProviderId, validateRegistrationNumber,
  validateTaxId, validateBusinessLicense,
  type FacilityFormState, type FacilityFieldErrors, type FacilityTouchedFields,
  type UploadedFile, type Weekday,
} from "./facility-provider-form-data";

// ═══════════════════════════════════════════════════════════════
// Email check state type
// ═══════════════════════════════════════════════════════════════

type EmailCheckState = "idle" | "checking" | "unique" | "duplicate";

// ═══════════════════════════════════════════════════════════════
// File type → icon helper
// ═══════════════════════════════════════════════════════════════

function docIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
  if (type.includes("image")) return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (type.includes("sheet") || type.includes("excel")) return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
  if (type.includes("word") || type.includes("doc")) return <FileIcon className="h-4 w-4 text-blue-400" />;
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

  const selected = COUNTRY_CODES.find(c => c.code === value) ?? COUNTRY_CODES[0];

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.toLowerCase();
    return COUNTRY_CODES.filter(
      c => c.name.toLowerCase().includes(q) || c.code.includes(q) || c.iso.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        className="flex items-center gap-1.5 h-9 px-2.5 border border-gray-200 rounded-lg bg-white text-sm hover:bg-gray-50 transition-colors min-w-[120px]"
        aria-label="Select country code"
        aria-expanded={open}
      >
        <span className="text-base">{selected.flag}</span>
        <span className="text-[#111827]">{selected.code}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 ml-auto transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full h-8 pl-8 pr-3 text-sm border border-gray-200 rounded-md outline-none focus:border-[#003B95] focus:ring-1 focus:ring-[#003B95]/20"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-44">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">No results</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c.iso}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#003B95]/5 transition-colors text-left",
                    c.code === value && "bg-[#003B95]/5"
                  )}
                  onClick={() => { onChange(c.code); setOpen(false); }}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="text-[#111827] truncate flex-1">{c.name}</span>
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
// Main Facility Provider Form Page
// ═══════════════════════════════════════════════════════════════

export function FacilityProviderFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // ── Loading state for edit mode ─────────────────────────────
  const [loading, setLoading] = useState(isEditMode);
  const [notFound, setNotFound] = useState(false);

  // ── Form state ──────────────────────────────────────────────
  const [form, setForm] = useState<FacilityFormState>({
    facilityName: "",
    incorporationDate: null,
    email: "",
    countryCode: "+971",
    mobileNumber: "",
    personInCharge: "",
    designation: "",
    landline: "",
    website: "",
    aboutFacility: "",
    openingTime: "",
    closingTime: "",
    workingDays: [],
    facilityRules: "",
    cancellationPolicy: "",
    // ── Status & Verification (US-3.2.3) ──
    verificationStatus: "Pending",
    accountStatus: "Unlocked",
    platformStatus: "Inactive",
    // ── Additional Information (US-3.2.4) ──
    providerId: generateProviderId(), // auto-generated for new providers
    registrationNumber: "",
    taxId: "",
    businessLicense: "",
    createdAt: null, // auto-set on creation, null until submitted
  });

  const [errors, setErrors] = useState<FacilityFieldErrors>({});
  const [touched, setTouched] = useState<FacilityTouchedFields>({});
  const [emailCheckState, setEmailCheckState] = useState<EmailCheckState>("idle");
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // ── Lock confirmation modal (US-3.2.3) ──────────────────────
  const [lockDialogOpen, setLockDialogOpen] = useState(false);

  // ── Refs ────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialFormRef = useRef<string>("");
  const emailCheckAbort = useRef<AbortController | null>(null);

  // ── Load edit data ──────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !id) return;
    const timer = setTimeout(() => {
      const detail = getFacilityProviderDetail(id);
      if (!detail) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const mobileMatch = detail.mobile.match(/^(\+\d+)\s+(.+)$/);
      const countryCode = mobileMatch ? mobileMatch[1] : "+971";
      const mobileNum = mobileMatch ? mobileMatch[2] : detail.mobile;

      const formData: FacilityFormState = {
        facilityName: detail.facilityName,
        incorporationDate: detail.incorporationDate,
        email: detail.email,
        countryCode,
        mobileNumber: mobileNum,
        personInCharge: detail.personInCharge,
        designation: detail.designation,
        landline: detail.landline,
        website: detail.website,
        aboutFacility: detail.aboutFacility,
        openingTime: detail.openingTime,
        closingTime: detail.closingTime,
        workingDays: detail.workingDays,
        facilityRules: detail.facilityRules,
        cancellationPolicy: detail.cancellationPolicy,
        // ── Status & Verification (US-3.2.3) ──
        verificationStatus: detail.verificationStatus as "Pending" | "Approved" | "Rejected",
        accountStatus: detail.accountStatus as "Locked" | "Unlocked",
        platformStatus: detail.platformStatus as "Active" | "Inactive",
        // ── Additional Information (US-3.2.4) ──
        providerId: detail.providerId,
        registrationNumber: detail.registrationNumber,
        taxId: detail.taxId,
        businessLicense: detail.businessLicense,
        createdAt: detail.createdAt,
      };

      setForm(formData);
      initialFormRef.current = JSON.stringify({
        ...formData,
        incorporationDate: formData.incorporationDate?.toISOString() ?? null,
        createdAt: formData.createdAt?.toISOString() ?? null,
      });

      // Pre-load documents for edit (mock)
      if (detail.verificationStatus === "Approved") {
        setDocuments([
          {
            id: "doc-existing-1",
            name: "Trade License.pdf",
            size: 2516582,
            type: "application/pdf",
            progress: 100,
            status: "complete" as const,
          },
          {
            id: "doc-existing-2",
            name: "Facility Registration.pdf",
            size: 1153434,
            type: "application/pdf",
            progress: 100,
            status: "complete" as const,
          },
        ]);
      }

      setEmailCheckState("unique"); // Existing = unique for this record
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [id, isEditMode]);

  // ── Track dirty state ───────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const currentStr = JSON.stringify({
      ...form,
      incorporationDate: form.incorporationDate?.toISOString() ?? null,
      createdAt: form.createdAt?.toISOString() ?? null,
    });
    const dirty = isEditMode
      ? currentStr !== initialFormRef.current
      : (() => {
          // Exclude status/read-only/auto-generated fields from dirty check in create mode
          const { verificationStatus: _v, accountStatus: _a, platformStatus: _p, providerId: _pid, createdAt: _ca, ...rest } = form;
          return Object.values(rest).some(v => {
            if (typeof v === "string") return v.trim() !== "";
            if (Array.isArray(v)) return v.length > 0;
            return v !== null;
          }) || documents.length > 0;
        })();
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

  // ── Update field ──────────────────────────��─────────────────
  const updateField = useCallback(<K extends keyof FacilityFormState>(field: K, value: FacilityFormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing again
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // ── Validate single field ──────────────────────────────────
  const validateField = useCallback((field: keyof FacilityFormState | "timeRange", value: unknown): string | null => {
    switch (field) {
      case "facilityName": return validateFacilityName(value as string);
      case "incorporationDate": return validateDateOfIncorporation(value as Date | null);
      case "email": return validateEmail(value as string);
      case "mobileNumber": return validateMobileNumber(value as string);
      case "personInCharge": return validatePersonInCharge(value as string);
      case "designation": return validateDesignation(value as string);
      case "landline": return validateLandline(value as string);
      case "website": return validateWebsite(value as string);
      case "aboutFacility": return validateAboutFacility(value as string);
      case "facilityRules": return validateFacilityRules(value as string);
      case "cancellationPolicy": return validateCancellationPolicy(value as string);
      case "providerId": return validateProviderId(value as string);
      case "registrationNumber": return validateRegistrationNumber(value as string);
      case "taxId": return validateTaxId(value as string);
      case "businessLicense": return validateBusinessLicense(value as string);
      default: return null;
    }
  }, []);

  // ── On blur handler ─────────────────────────────────────────
  const handleBlur = useCallback((field: keyof FacilityFormState | "timeRange") => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Cross-field time validation
    if (field === "openingTime" || field === "closingTime") {
      const timeErr = validateTimeRange(
        field === "openingTime" ? (form[field] as string) : form.openingTime,
        field === "closingTime" ? (form[field] as string) : form.closingTime
      );
      setErrors(prev => ({ ...prev, timeRange: timeErr ?? undefined }));
      setTouched(prev => ({ ...prev, timeRange: true }));
      return;
    }

    if (field === "timeRange") return; // handled above

    const error = validateField(field, form[field as keyof FacilityFormState]);
    setErrors(prev => ({ ...prev, [field]: error ?? undefined }));

    // Async email check
    if (field === "email" && !error) {
      if (emailCheckAbort.current) emailCheckAbort.current.abort();
      const controller = new AbortController();
      emailCheckAbort.current = controller;

      setEmailCheckState("checking");
      checkEmailDuplicate(form.email).then(isDuplicate => {
        if (controller.signal.aborted) return;
        if (isDuplicate) {
          setEmailCheckState("duplicate");
          setErrors(prev => ({ ...prev, email: "Email already registered" }));
        } else {
          setEmailCheckState("unique");
        }
      });
    }
  }, [form, validateField]);

  // ── Validate all fields ─────────────────────────────────────
  const validateAll = useCallback((): boolean => {
    const fields: (keyof FacilityFormState)[] = [
      "facilityName", "incorporationDate", "email",
      "mobileNumber", "personInCharge", "designation",
      "landline", "website",
      "aboutFacility", "facilityRules", "cancellationPolicy",
      "providerId", "registrationNumber", "taxId", "businessLicense",
    ];

    const newErrors: FacilityFieldErrors = {};
    const newTouched: FacilityTouchedFields = {};

    fields.forEach(field => {
      newTouched[field] = true;
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    });

    // Cross-field time validation
    const timeErr = validateTimeRange(form.openingTime, form.closingTime);
    if (timeErr) {
      newErrors.timeRange = timeErr;
      newTouched.timeRange = true;
    }

    setTouched(prev => ({ ...prev, ...newTouched }));
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [form, validateField]);

  // ── Check if form is submittable ────────────────────────────
  const isFormValid = useMemo(() => {
    const requiredFields: (keyof FacilityFormState)[] = [
      "facilityName", "incorporationDate", "email", "mobileNumber", "personInCharge",
    ];

    const allFilled = requiredFields.every(f => {
      const val = form[f];
      if (val === null) return false;
      if (typeof val === "string") return val.trim() !== "";
      return true;
    });

    const noErrors = Object.values(errors).every(e => !e);
    const emailOk = emailCheckState === "unique" || (isEditMode && emailCheckState === "idle");
    const allUploaded = documents.every(d => d.status !== "uploading");

    return allFilled && noErrors && emailOk && allUploaded && !submitting;
  }, [form, errors, emailCheckState, documents, submitting, isEditMode]);

  // ═══════════════════════════════════════════════════════════
  // File Upload Handlers
  // ═══════════════════════════════════════════════════════════

  const processDocumentFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);

    fileArray.forEach(file => {
      if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
        toast.error("Unsupported format. Accepted: PDF, PNG, JPEG, DOC, XLS.");
        return;
      }
      if (file.size > MAX_DOC_SIZE) {
        toast.error("File exceeds maximum 10MB.");
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

      setDocuments(prev => [...prev, newFile]);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5 + Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setDocuments(prev =>
            prev.map(d => d.id === fileId ? { ...d, progress: 100, status: "complete" as const } : d)
          );
        } else {
          setDocuments(prev =>
            prev.map(d => d.id === fileId ? { ...d, progress: Math.round(progress) } : d)
          );
        }
      }, 200);
    });
  }, []);

  const removeDocument = useCallback((fileId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== fileId));
  }, []);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processDocumentFiles(e.dataTransfer.files);
    }
  }, [processDocumentFiles]);

  // ═══════════════════════════════════════════════════════════
  // Submit
  // ═══════════════════════════════════════════════════════════

  const handleSubmit = useCallback(async () => {
    if (!validateAll()) return;
    if (emailCheckState === "duplicate") return;

    setSubmitting(true);

    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));

    setSubmitting(false);
    setIsDirty(false);

    if (isEditMode) {
      toast.success("Facility provider updated successfully.");
      navigate(`/providers/facility/${id}`);
    } else {
      toast.success("Facility provider created successfully.");
      navigate("/providers");
    }
  }, [validateAll, emailCheckState, isEditMode, navigate, id]);

  // ── Cancel ──────────────────────────────────────────────────
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setCancelDialogOpen(true);
    } else {
      navigate(isEditMode ? `/providers/facility/${id}` : "/providers");
    }
  }, [isDirty, isEditMode, navigate, id]);

  const confirmCancel = useCallback(() => {
    setCancelDialogOpen(false);
    setIsDirty(false);
    navigate(isEditMode ? `/providers/facility/${id}` : "/providers");
  }, [isEditMode, navigate, id]);

  // ═══════════════════════════════════════════════════════════
  // Loading skeleton
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto" aria-busy="true" aria-label="Loading form">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
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
        <p className="text-sm text-gray-500 mb-4">The facility provider you're looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/providers")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Providers
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  const completedDocs = documents.filter(d => d.status === "complete").length;

  return (
    <div className="space-y-6 pb-24">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleCancel}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl text-[#111827] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#003B95]" />
            {isEditMode ? "Edit Facility Provider" : "Create Facility Provider"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditMode
              ? "Update the facility provider's information below."
              : "Fill in the details below to register a new facility provider."}
          </p>
        </div>
      </div>

      {/* ── Form Card ────────────────────────────────────────── */}
      <form
        onSubmit={e => { e.preventDefault(); handleSubmit(); }}
        noValidate
        className="max-w-4xl"
      >
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

          {/* ─────── Section: Basic Information ─────────────── */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Basic Information
            </h2>

            {/* Facility Name */}
            <div className="space-y-1.5">
              <Label htmlFor="facilityName" className="text-xs text-gray-600">
                Facility Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="facilityName"
                value={form.facilityName}
                onChange={e => updateField("facilityName", e.target.value)}
                onBlur={() => handleBlur("facilityName")}
                placeholder="e.g. Al Hamra Sports Complex"
                maxLength={200}
                className={cn(
                  "h-9 text-sm",
                  touched.facilityName && errors.facilityName && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.facilityName && errors.facilityName)}
                aria-describedby={touched.facilityName && errors.facilityName ? "facilityName-error" : undefined}
              />
              <div className="flex justify-between">
                {touched.facilityName && errors.facilityName ? (
                  <p id="facilityName-error" className="text-[11px] text-red-500">{errors.facilityName}</p>
                ) : <span />}
                <span className="text-[11px] text-gray-400">{form.facilityName.length}/200</span>
              </div>
            </div>

            {/* Incorporation Date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">
                Incorporation Date <span className="text-red-500">*</span>
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left h-9 text-sm",
                      !form.incorporationDate && "text-gray-400",
                      touched.incorporationDate && errors.incorporationDate && "border-red-400"
                    )}
                    aria-label="Select incorporation date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {form.incorporationDate
                      ? format(form.incorporationDate, "dd/MM/yyyy")
                      : "Select date..."
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.incorporationDate ?? undefined}
                    onSelect={(date) => {
                      updateField("incorporationDate", date ?? null);
                      setTouched(prev => ({ ...prev, incorporationDate: true }));
                      setDatePickerOpen(false);
                      const err = validateDateOfIncorporation(date ?? null);
                      setErrors(prev => ({ ...prev, incorporationDate: err ?? undefined }));
                    }}
                    disabled={{ after: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {touched.incorporationDate && errors.incorporationDate && (
                <p className="text-[11px] text-red-500">{errors.incorporationDate}</p>
              )}
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
                  onChange={e => {
                    updateField("email", e.target.value);
                    if (emailCheckState !== "idle") setEmailCheckState("idle");
                  }}
                  onBlur={() => handleBlur("email")}
                  placeholder="facility@example.ae"
                  className={cn(
                    "h-9 text-sm pr-10",
                    touched.email && errors.email && "border-red-400 focus-visible:ring-red-200",
                    emailCheckState === "unique" && "border-emerald-400 focus-visible:ring-emerald-200"
                  )}
                  aria-invalid={!!(touched.email && errors.email)}
                  aria-describedby="email-status"
                />
                {/* Status icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailCheckState === "checking" && (
                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" aria-label="Checking email" />
                  )}
                  {emailCheckState === "unique" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Email is unique" />
                  )}
                  {emailCheckState === "duplicate" && (
                    <XCircle className="h-4 w-4 text-red-500" aria-label="Email already registered" />
                  )}
                </div>
              </div>
              {touched.email && errors.email && (
                <p id="email-status" className="text-[11px] text-red-500">{errors.email}</p>
              )}
              {emailCheckState === "unique" && !errors.email && (
                <p id="email-status" className="text-[11px] text-emerald-600">Email is available</p>
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
                  onChange={code => updateField("countryCode", code)}
                />
                <Input
                  id="mobileNumber"
                  value={form.mobileNumber}
                  onChange={e => {
                    const val = e.target.value.replace(/[^\d\s\-]/g, "");
                    updateField("mobileNumber", val);
                  }}
                  onBlur={() => handleBlur("mobileNumber")}
                  placeholder="50 123 4567"
                  className={cn(
                    "h-9 text-sm flex-1",
                    touched.mobileNumber && errors.mobileNumber && "border-red-400 focus-visible:ring-red-200"
                  )}
                  aria-invalid={!!(touched.mobileNumber && errors.mobileNumber)}
                  aria-describedby={touched.mobileNumber && errors.mobileNumber ? "mobile-error" : undefined}
                />
              </div>
              {touched.mobileNumber && errors.mobileNumber ? (
                <p id="mobile-error" className="text-[11px] text-red-500">{errors.mobileNumber}</p>
              ) : (
                <p className="text-[11px] text-gray-400">7-15 digits. Format: 50 123 4567</p>
              )}
            </div>

            {/* Person In Charge */}
            <div className="space-y-1.5">
              <Label htmlFor="personInCharge" className="text-xs text-gray-600">
                Person In Charge <span className="text-red-500">*</span>
              </Label>
              <Input
                id="personInCharge"
                value={form.personInCharge}
                onChange={e => updateField("personInCharge", e.target.value)}
                onBlur={() => handleBlur("personInCharge")}
                placeholder="e.g. Ahmed Al Mansouri"
                maxLength={150}
                className={cn(
                  "h-9 text-sm",
                  touched.personInCharge && errors.personInCharge && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.personInCharge && errors.personInCharge)}
                aria-describedby={touched.personInCharge && errors.personInCharge ? "personInCharge-error" : undefined}
              />
              <div className="flex justify-between">
                {touched.personInCharge && errors.personInCharge ? (
                  <p id="personInCharge-error" className="text-[11px] text-red-500">{errors.personInCharge}</p>
                ) : <span />}
                <span className="text-[11px] text-gray-400">{form.personInCharge.length}/150</span>
              </div>
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <Label htmlFor="designation" className="text-xs text-gray-600">
                Designation
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <Input
                id="designation"
                value={form.designation}
                onChange={e => updateField("designation", e.target.value)}
                onBlur={() => handleBlur("designation")}
                placeholder="e.g. General Manager"
                maxLength={100}
                className={cn(
                  "h-9 text-sm",
                  touched.designation && errors.designation && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.designation && errors.designation)}
                aria-describedby={touched.designation && errors.designation ? "designation-error" : undefined}
              />
              <div className="flex justify-between">
                {touched.designation && errors.designation ? (
                  <p id="designation-error" className="text-[11px] text-red-500">{errors.designation}</p>
                ) : <span />}
                <span className="text-[11px] text-gray-400">{form.designation.length}/100</span>
              </div>
            </div>

            {/* Landline Number */}
            <div className="space-y-1.5">
              <Label htmlFor="landline" className="text-xs text-gray-600">
                Landline Number
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <Input
                id="landline"
                value={form.landline}
                onChange={e => {
                  const val = e.target.value.replace(/[^\d\s\-+]/g, "");
                  updateField("landline", val);
                }}
                onBlur={() => handleBlur("landline")}
                placeholder="+971 4 300 0000"
                className={cn(
                  "h-9 text-sm",
                  touched.landline && errors.landline && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.landline && errors.landline)}
                aria-describedby={touched.landline && errors.landline ? "landline-error" : undefined}
              />
              {touched.landline && errors.landline ? (
                <p id="landline-error" className="text-[11px] text-red-500">{errors.landline}</p>
              ) : (
                <p className="text-[11px] text-gray-400">7-15 digits. Numeric only.</p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-xs text-gray-600">
                Website
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={e => updateField("website", e.target.value)}
                  onBlur={() => handleBlur("website")}
                  placeholder="https://..."
                  className={cn(
                    "h-9 text-sm pl-9",
                    touched.website && errors.website && "border-red-400 focus-visible:ring-red-200",
                    touched.website && !errors.website && form.website.trim() && "border-emerald-400"
                  )}
                  aria-invalid={!!(touched.website && errors.website)}
                  aria-describedby={touched.website && errors.website ? "website-error" : undefined}
                />
              </div>
              {touched.website && errors.website ? (
                <p id="website-error" className="text-[11px] text-red-500">{errors.website}</p>
              ) : (
                <p className="text-[11px] text-gray-400">Must start with http:// or https://</p>
              )}
            </div>
          </div>

          {/* ─────── Section 2: Facility Details (US-3.2.2) ── */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Facility Details
            </h2>

            {/* About the Facility */}
            <div className="space-y-1.5">
              <Label htmlFor="aboutFacility" className="text-xs text-gray-600">
                About the Facility
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <Textarea
                id="aboutFacility"
                value={form.aboutFacility}
                onChange={e => updateField("aboutFacility", e.target.value)}
                onBlur={() => handleBlur("aboutFacility")}
                placeholder="Describe your facility, amenities, and unique features..."
                maxLength={5000}
                className={cn(
                  "min-h-[120px] text-sm",
                  touched.aboutFacility && errors.aboutFacility && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.aboutFacility && errors.aboutFacility)}
                aria-describedby={touched.aboutFacility && errors.aboutFacility ? "aboutFacility-error" : "aboutFacility-count"}
              />
              <div className="flex justify-between">
                {touched.aboutFacility && errors.aboutFacility ? (
                  <p id="aboutFacility-error" className="text-[11px] text-red-500">{errors.aboutFacility}</p>
                ) : <span />}
                <span id="aboutFacility-count" className={cn(
                  "text-[11px]",
                  form.aboutFacility.length > 4800 ? "text-amber-500" : "text-gray-400"
                )}>
                  {form.aboutFacility.length}/5,000
                </span>
              </div>
            </div>

            {/* Opening & Closing Time — side by side */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opening Time */}
                <div className="space-y-1.5">
                  <Label htmlFor="openingTime" className="text-xs text-gray-600">
                    Opening Time
                    <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        id="openingTime"
                        className={cn(
                          "w-full justify-start text-left h-9 text-sm",
                          !form.openingTime && "text-gray-400",
                          errors.timeRange && touched.timeRange && "border-red-400"
                        )}
                        aria-label="Select opening time"
                      >
                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                        {form.openingTime || "Select time..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0" align="start">
                      <div className="max-h-60 overflow-y-auto">
                        {TIME_SLOTS.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm hover:bg-[#003B95]/5 transition-colors",
                              slot === form.openingTime && "bg-[#003B95]/10 text-[#003B95]"
                            )}
                            onClick={() => {
                              updateField("openingTime", slot);
                              const timeErr = validateTimeRange(slot, form.closingTime);
                              setErrors(prev => ({ ...prev, timeRange: timeErr ?? undefined }));
                              setTouched(prev => ({ ...prev, openingTime: true, timeRange: true }));
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Closing Time */}
                <div className="space-y-1.5">
                  <Label htmlFor="closingTime" className="text-xs text-gray-600">
                    Closing Time
                    <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        id="closingTime"
                        className={cn(
                          "w-full justify-start text-left h-9 text-sm",
                          !form.closingTime && "text-gray-400",
                          errors.timeRange && touched.timeRange && "border-red-400"
                        )}
                        aria-label="Select closing time"
                      >
                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                        {form.closingTime || "Select time..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0" align="start">
                      <div className="max-h-60 overflow-y-auto">
                        {TIME_SLOTS.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm hover:bg-[#003B95]/5 transition-colors",
                              slot === form.closingTime && "bg-[#003B95]/10 text-[#003B95]"
                            )}
                            onClick={() => {
                              updateField("closingTime", slot);
                              const timeErr = validateTimeRange(form.openingTime, slot);
                              setErrors(prev => ({ ...prev, timeRange: timeErr ?? undefined }));
                              setTouched(prev => ({ ...prev, closingTime: true, timeRange: true }));
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* Cross-field time error */}
              {touched.timeRange && errors.timeRange && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.timeRange}
                </p>
              )}
            </div>

            {/* Working Days */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">
                  Working Days
                  <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-[11px] text-[#003B95] hover:underline"
                    onClick={() => updateField("workingDays", [...WEEKDAYS])}
                  >
                    Select All
                  </button>
                  <span className="text-gray-300 text-[11px]">|</span>
                  <button
                    type="button"
                    className="text-[11px] text-gray-500 hover:underline"
                    onClick={() => updateField("workingDays", [])}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => {
                  const isSelected = form.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newDays = isSelected
                          ? form.workingDays.filter(d => d !== day)
                          : [...form.workingDays, day];
                        updateField("workingDays", newDays as Weekday[]);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors",
                        isSelected
                          ? "bg-[#003B95] text-white border-[#003B95]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      )}
                      aria-pressed={isSelected}
                      aria-label={`${day} ${isSelected ? "selected" : "not selected"}`}
                    >
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {day}
                    </button>
                  );
                })}
              </div>
              {/* Soft warning */}
              {(() => {
                const warning = getWorkingDaysWarning(form.openingTime, form.closingTime, form.workingDays);
                return warning ? (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0" />
                    {warning}
                  </p>
                ) : null;
              })()}
            </div>

            {/* Facility Rules */}
            <div className="space-y-1.5">
              <Label htmlFor="facilityRules" className="text-xs text-gray-600">
                Facility Rules
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <Textarea
                id="facilityRules"
                value={form.facilityRules}
                onChange={e => updateField("facilityRules", e.target.value)}
                onBlur={() => handleBlur("facilityRules")}
                placeholder="List any facility rules, e.g. dress code, equipment handling..."
                maxLength={5000}
                className={cn(
                  "min-h-[100px] text-sm",
                  touched.facilityRules && errors.facilityRules && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.facilityRules && errors.facilityRules)}
                aria-describedby={touched.facilityRules && errors.facilityRules ? "facilityRules-error" : "facilityRules-count"}
              />
              <div className="flex justify-between">
                {touched.facilityRules && errors.facilityRules ? (
                  <p id="facilityRules-error" className="text-[11px] text-red-500">{errors.facilityRules}</p>
                ) : <span />}
                <span id="facilityRules-count" className={cn(
                  "text-[11px]",
                  form.facilityRules.length > 4800 ? "text-amber-500" : "text-gray-400"
                )}>
                  {form.facilityRules.length}/5,000
                </span>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="space-y-1.5">
              <Label htmlFor="cancellationPolicy" className="text-xs text-gray-600">
                Cancellation Policy
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <Textarea
                id="cancellationPolicy"
                value={form.cancellationPolicy}
                onChange={e => updateField("cancellationPolicy", e.target.value)}
                onBlur={() => handleBlur("cancellationPolicy")}
                placeholder="Describe the cancellation and refund policy..."
                maxLength={5000}
                className={cn(
                  "min-h-[100px] text-sm",
                  touched.cancellationPolicy && errors.cancellationPolicy && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.cancellationPolicy && errors.cancellationPolicy)}
                aria-describedby={touched.cancellationPolicy && errors.cancellationPolicy ? "cancellationPolicy-error" : "cancellationPolicy-count"}
              />
              <div className="flex justify-between">
                {touched.cancellationPolicy && errors.cancellationPolicy ? (
                  <p id="cancellationPolicy-error" className="text-[11px] text-red-500">{errors.cancellationPolicy}</p>
                ) : <span />}
                <span id="cancellationPolicy-count" className={cn(
                  "text-[11px]",
                  form.cancellationPolicy.length > 4800 ? "text-amber-500" : "text-gray-400"
                )}>
                  {form.cancellationPolicy.length}/5,000
                </span>
              </div>
            </div>
          </div>

          {/* ─────── Section 3: Status & Verification (US-3.2.3) ── */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Status & Verification
            </h2>

            {/* Verification Status — read-only badge */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">
                Verification Status <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Badge
                  className={cn(
                    "text-xs px-3 py-1 border",
                    form.verificationStatus === "Pending" && "bg-amber-50 text-amber-700 border-amber-200",
                    form.verificationStatus === "Approved" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                    form.verificationStatus === "Rejected" && "bg-red-50 text-red-700 border-red-200",
                  )}
                  aria-label={`Verification status: ${form.verificationStatus}`}
                >
                  <span className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full mr-1.5",
                    form.verificationStatus === "Pending" && "bg-amber-500",
                    form.verificationStatus === "Approved" && "bg-emerald-500",
                    form.verificationStatus === "Rejected" && "bg-red-500",
                  )} />
                  {form.verificationStatus}
                </Badge>
                <span className="text-[11px] text-gray-400 italic">
                  {isEditMode
                    ? "Changed only via approval workflow or bulk action."
                    : "Automatically set to Pending on creation."}
                </span>
              </div>
            </div>

            {/* Account Status — toggle switch */}
            <div className="space-y-1.5">
              <Label htmlFor="accountStatus" className="text-xs text-gray-600">
                Account Status <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-4 py-1.5">
                <div className="flex items-center gap-3">
                  <Switch
                    id="accountStatus"
                    checked={form.accountStatus === "Unlocked"}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        // Trying to Lock → show confirmation
                        setLockDialogOpen(true);
                      } else {
                        // Unlocking → immediate
                        updateField("accountStatus", "Unlocked");
                        toast.success("Account status set to Unlocked.");
                      }
                    }}
                    className={cn(
                      form.accountStatus === "Unlocked"
                        ? "data-[state=checked]:bg-emerald-500"
                        : "data-[state=unchecked]:bg-red-400"
                    )}
                    aria-label={`Account is ${form.accountStatus}`}
                  />
                  <div className="flex items-center gap-2">
                    {form.accountStatus === "Unlocked" ? (
                      <Unlock className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn(
                      "text-sm",
                      form.accountStatus === "Unlocked" ? "text-emerald-700" : "text-red-600"
                    )}>
                      {form.accountStatus}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Locking an account will prevent the provider from accessing the platform.
              </p>
            </div>

            {/* Platform Status — toggle switch */}
            <div className="space-y-1.5">
              <Label htmlFor="platformStatus" className="text-xs text-gray-600">
                Platform Status <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-4 py-1.5">
                <div className="flex items-center gap-3">
                  <Switch
                    id="platformStatus"
                    checked={form.platformStatus === "Active"}
                    onCheckedChange={(checked) => {
                      const newStatus = checked ? "Active" : "Inactive";
                      updateField("platformStatus", newStatus);
                      toast.info(`Platform status set to ${newStatus}.`);
                    }}
                    className={cn(
                      form.platformStatus === "Active"
                        ? "data-[state=checked]:bg-emerald-500"
                        : "data-[state=unchecked]:bg-gray-400"
                    )}
                    aria-label={`Platform is ${form.platformStatus}`}
                  />
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      form.platformStatus === "Active" ? "bg-emerald-500" : "bg-gray-400"
                    )} />
                    <span className={cn(
                      "text-sm",
                      form.platformStatus === "Active" ? "text-emerald-700" : "text-gray-500"
                    )}>
                      {form.platformStatus}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Inactive providers will not be visible on the platform.
              </p>
            </div>
          </div>

          {/* ─────── Section 4: Additional Information (US-3.2.4) ── */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Additional Information
            </h2>

            {/* Provider ID */}
            <div className="space-y-1.5">
              <Label htmlFor="providerId" className="text-xs text-gray-600">
                Provider ID
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="providerId"
                  value={form.providerId}
                  onChange={e => updateField("providerId", e.target.value)}
                  onBlur={() => handleBlur("providerId")}
                  placeholder="e.g. FP-1234"
                  maxLength={50}
                  className={cn(
                    "h-9 text-sm pl-9",
                    touched.providerId && errors.providerId && "border-red-400 focus-visible:ring-red-200"
                  )}
                  aria-invalid={!!(touched.providerId && errors.providerId)}
                  aria-describedby={touched.providerId && errors.providerId ? "providerId-error" : "providerId-hint"}
                />
              </div>
              <div className="flex justify-between">
                {touched.providerId && errors.providerId ? (
                  <p id="providerId-error" className="text-[11px] text-red-500">{errors.providerId}</p>
                ) : (
                  <p id="providerId-hint" className="text-[11px] text-gray-400">
                    {isEditMode ? "Alphanumeric. Max 50 characters." : "Auto-generated. You may edit if needed."}
                  </p>
                )}
                <span className="text-[11px] text-gray-400">{form.providerId.length}/50</span>
              </div>
            </div>

            {/* Registration Number */}
            <div className="space-y-1.5">
              <Label htmlFor="registrationNumber" className="text-xs text-gray-600">
                Registration Number
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <Input
                id="registrationNumber"
                value={form.registrationNumber}
                onChange={e => updateField("registrationNumber", e.target.value)}
                onBlur={() => handleBlur("registrationNumber")}
                placeholder="e.g. REG-2024-00142"
                maxLength={50}
                className={cn(
                  "h-9 text-sm",
                  touched.registrationNumber && errors.registrationNumber && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.registrationNumber && errors.registrationNumber)}
                aria-describedby={touched.registrationNumber && errors.registrationNumber ? "registrationNumber-error" : undefined}
              />
              <div className="flex justify-between">
                {touched.registrationNumber && errors.registrationNumber ? (
                  <p id="registrationNumber-error" className="text-[11px] text-red-500">{errors.registrationNumber}</p>
                ) : <span />}
                <span className="text-[11px] text-gray-400">{form.registrationNumber.length}/50</span>
              </div>
            </div>

            {/* Tax ID */}
            <div className="space-y-1.5">
              <Label htmlFor="taxId" className="text-xs text-gray-600">
                Tax ID
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <Input
                id="taxId"
                value={form.taxId}
                onChange={e => updateField("taxId", e.target.value)}
                onBlur={() => handleBlur("taxId")}
                placeholder="e.g. TAX-AE-78291"
                maxLength={50}
                className={cn(
                  "h-9 text-sm",
                  touched.taxId && errors.taxId && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.taxId && errors.taxId)}
                aria-describedby={touched.taxId && errors.taxId ? "taxId-error" : undefined}
              />
              <div className="flex justify-between">
                {touched.taxId && errors.taxId ? (
                  <p id="taxId-error" className="text-[11px] text-red-500">{errors.taxId}</p>
                ) : <span />}
                <span className="text-[11px] text-gray-400">{form.taxId.length}/50</span>
              </div>
            </div>

            {/* Business License */}
            <div className="space-y-1.5">
              <Label htmlFor="businessLicense" className="text-xs text-gray-600">
                Business License
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 ml-2">Optional</Badge>
              </Label>
              <Input
                id="businessLicense"
                value={form.businessLicense}
                onChange={e => updateField("businessLicense", e.target.value)}
                onBlur={() => handleBlur("businessLicense")}
                placeholder="e.g. BL-DXB-2024-0891"
                maxLength={100}
                className={cn(
                  "h-9 text-sm",
                  touched.businessLicense && errors.businessLicense && "border-red-400 focus-visible:ring-red-200"
                )}
                aria-invalid={!!(touched.businessLicense && errors.businessLicense)}
                aria-describedby={touched.businessLicense && errors.businessLicense ? "businessLicense-error" : undefined}
              />
              <div className="flex justify-between">
                {touched.businessLicense && errors.businessLicense ? (
                  <p id="businessLicense-error" className="text-[11px] text-red-500">{errors.businessLicense}</p>
                ) : <span />}
                <span className="text-[11px] text-gray-400">{form.businessLicense.length}/100</span>
              </div>
            </div>

            {/* Created At — read-only */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Created At <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                {form.createdAt ? (
                  <div
                    className="h-9 px-3 flex items-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed select-none w-full"
                    aria-label={`Created at: ${format(form.createdAt, "dd/MM/yyyy HH:mm:ss")}`}
                    title="System-generated — not editable"
                  >
                    {format(form.createdAt, "dd/MM/yyyy HH:mm:ss")}
                  </div>
                ) : (
                  <div
                    className="h-9 px-3 flex items-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 text-sm text-gray-400 italic w-full"
                    aria-label="Created at: will be auto-generated on creation"
                  >
                    Will be auto-generated on creation
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                System-generated timestamp. This field cannot be edited.
              </p>
            </div>
          </div>

          {/* ─────── Section 5: Documents (US-3.2.5) ─────────── */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-gray-500 flex items-center gap-2">
                <Upload className="h-4 w-4" /> Documents
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200">Optional</Badge>
              </h2>
              {completedDocs > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-gray-200 text-gray-400"
                >
                  {completedDocs} uploaded
                </Badge>
              )}
            </div>

            {/* Drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                dragOver
                  ? "border-[#003B95] bg-[#003B95]/5"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              aria-label="Upload documents — drag files here or click to browse"
            >
              <Upload className={cn("h-8 w-8 mx-auto mb-3", dragOver ? "text-[#003B95]" : "text-gray-300")} />
              <p className="text-sm text-gray-600 mb-1">
                Drag files here or <span className="text-[#003B95] underline">click to browse</span>
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
              onChange={e => {
                if (e.target.files) processDocumentFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {/* File list */}
            {documents.length > 0 ? (
              <div className="space-y-2" role="list" aria-label="Uploaded documents">
                {documents.map(file => (
                  <div
                    key={file.id}
                    role="listitem"
                    className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    {docIcon(file.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#111827] truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">{formatFileSize(file.size)}</span>
                        {file.status === "uploading" && (
                          <span className="text-[11px] text-[#003B95]">{file.progress}%</span>
                        )}
                        {file.status === "complete" && (
                          <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Uploaded
                          </span>
                        )}
                      </div>
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="h-1.5 mt-1" />
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
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <FileText className="h-6 w-6 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No documents uploaded yet.</p>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  Upload supporting documents such as trade licenses, registrations, or certifications.
                </p>
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
              ) : (
                isEditMode ? "Save Changes" : "Create Facility Provider"
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

      {/* ── Lock Account Confirmation Dialog (US-3.2.3) ──────── */}
      <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              Lock this account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Locking this account will prevent the provider from accessing the platform.
              This action can be reversed by unlocking the account later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                updateField("accountStatus", "Locked");
                setLockDialogOpen(false);
                toast.warning("Account status set to Locked.");
              }}
            >
              <Lock className="h-4 w-4 mr-2" />
              Lock Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}