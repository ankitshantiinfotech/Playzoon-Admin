import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Send,
  Building2,
  Globe,
  MapPin,
  FileText,
  Phone,
  Mail,
  User,
  Briefcase,
  Trophy,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Skeleton } from "../../../ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import {
  getProviderWithHistory,
  getRejectedProviderIds,
  type ServiceProvider,
  type FieldSnapshot,
} from "../provider-data";

// ─── Validation ──────────────────────────────────────────────

interface FieldError {
  providerName?: string;
  businessName?: string;
  email?: string;
  mobile?: string;
  city?: string;
  area?: string;
  licenseNumber?: string;
  description?: string;
  sportCategory?: string;
}

function validateForm(data: FieldSnapshot): {
  valid: boolean;
  errors: FieldError;
} {
  const errors: FieldError = {};
  if (!data.providerName.trim())
    errors.providerName = "Provider name is required";
  if (!data.businessName.trim())
    errors.businessName = "Business name is required";
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Invalid email format";
  }
  if (!data.mobile.trim()) {
    errors.mobile = "Mobile number is required";
  } else if (!/^\+?\d[\d\s-]{7,}$/.test(data.mobile.trim())) {
    errors.mobile = "Invalid mobile number";
  }
  if (!data.city.trim()) errors.city = "City is required";
  if (!data.area.trim()) errors.area = "Area is required";
  if (!data.licenseNumber.trim())
    errors.licenseNumber = "License number is required";
  if (!data.description.trim()) {
    errors.description = "Description is required";
  } else if (data.description.trim().length < 20) {
    errors.description = "Description must be at least 20 characters";
  }
  if (!data.sportCategory.trim())
    errors.sportCategory = "Sport category is required";
  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Form Field Component ────────────────────────────────────

function FormField({
  label,
  required,
  error,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Sport Categories ────────────────────────────────────────

const SPORT_OPTIONS = [
  "Football",
  "Tennis",
  "Swimming",
  "Basketball",
  "Padel",
  "Martial Arts",
  "Gymnastics",
  "Cycling",
  "Yoga",
  "CrossFit",
  "Running",
  "Boxing",
  "Volleyball",
  "Cricket",
  "Table Tennis",
];

const CITY_OPTIONS = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "RAK",
  "Fujairah",
  "Umm Al Quwain",
  "Al Ain",
];

// ═══════════════════════════════════════════════════════════════
// Provider Portal Page
// ═══════════════════════════════════════════════════════════════

export function ProviderPortalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [formData, setFormData] = useState<FieldSnapshot | null>(null);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const [successState, setSuccessState] = useState(false);

  const resubmitBtnRef = useRef<HTMLButtonElement>(null);

  // ── Demo provider picker (for rejected providers) ──────
  const rejectedProviders = useMemo(() => getRejectedProviderIds(), []);
  const selectedId = id || rejectedProviders[0]?.id || "";

  // ── Load provider data ─────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    setSuccessState(false);
    const t = setTimeout(() => {
      const p = getProviderWithHistory(selectedId);
      setProvider(p || null);
      if (p?.profileData) {
        setFormData({ ...p.profileData });
      }
      setErrors({});
      setTouched(new Set());
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [selectedId]);

  // ── Form handlers ──────────────────────────────────────
  const updateField = useCallback(
    (field: keyof FieldSnapshot, value: string) => {
      setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
      setTouched((prev) => new Set(prev).add(field));
    },
    [],
  );

  const handleBlur = useCallback(
    (field: keyof FieldSnapshot) => {
      setTouched((prev) => new Set(prev).add(field));
      if (formData) {
        const { errors: newErrors } = validateForm(formData);
        setErrors((prev) => ({
          ...prev,
          [field]: newErrors[field as keyof FieldError],
        }));
      }
    },
    [formData],
  );

  const isFormValid = useMemo(() => {
    if (!formData) return false;
    return validateForm(formData).valid;
  }, [formData]);

  // ── Re-Submit handler ──────────────────────────────────
  const handleReSubmit = useCallback(async () => {
    if (!formData || !provider) return;
    setIsSubmitting(true);
    setSubmitCooldown(true);

    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1200));

      // Update provider state to Pending
      setProvider((prev) =>
        prev
          ? {
              ...prev,
              verificationStatus: "Pending" as const,
              rejectionReason: undefined,
              resubmissionCount: (prev.resubmissionCount || 0) + 1,
            }
          : prev,
      );

      setShowConfirmModal(false);
      setSuccessState(true);
      toast.success("Your application has been re-submitted for review.", {
        duration: 5000,
      });
    } catch {
      toast.error("Failed to re-submit application. Please try again.", {
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
      // 5-second cooldown to prevent double-submit
      setTimeout(() => setSubmitCooldown(false), 5000);
    }
  }, [formData, provider]);

  const handleReSubmitClick = () => {
    if (!formData) return;
    const result = validateForm(formData);
    if (!result.valid) {
      setErrors(result.errors);
      // Mark all fields as touched
      setTouched(new Set(Object.keys(formData)));
      toast.error("Please fix the validation errors before re-submitting.");
      return;
    }
    setShowConfirmModal(true);
  };

  // ── Loading state ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  // ── Provider not found ─────────────────────────────────
  if (!provider || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-gray-300" />
          </div>
          <h1 className="text-xl text-[#111827]">Provider Not Found</h1>
          <p className="text-sm text-[#6B7280]">
            The provider you are looking for does not exist or has been removed.
          </p>
          <Button variant="outline" onClick={() => navigate("/providers")}>
            Back to Providers
          </Button>
        </div>
      </div>
    );
  }

  const isRejected = provider.verificationStatus === "Rejected";
  const isPending = provider.verificationStatus === "Pending";

  // ── Success State ──────────────────────────────────────
  if (successState) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/providers")}
          className="gap-1.5 text-[#6B7280] hover:text-[#111827] -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Providers
        </Button>

        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-5 max-w-lg">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl text-[#111827]">
              Application Re-Submitted
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Your application has been re-submitted for review. You will be
              notified once your application has been reviewed by our team.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-200"
              >
                Status: Pending Review
              </Badge>
              {(provider.resubmissionCount || 0) > 0 && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  Re-submitted {provider.resubmissionCount}{" "}
                  {provider.resubmissionCount === 1 ? "time" : "times"}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/providers")}
              className="mt-4"
            >
              Return to Providers List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/providers")}
            className="gap-1.5 text-[#6B7280] hover:text-[#111827] -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl text-[#111827] tracking-tight">
              Provider Portal
              <span className="text-xs text-[#9CA3AF] ml-2">(Simulation)</span>
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Viewing as:{" "}
              <span className="text-[#111827]">{provider.name}</span>
            </p>
          </div>
        </div>

        {/* Demo provider picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9CA3AF]">Switch provider:</span>
          <Select
            value={selectedId}
            onValueChange={(v) => navigate(`/provider-portal/${v}`)}
          >
            <SelectTrigger className="h-8 w-56 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rejectedProviders.map((rp) => (
                <SelectItem key={rp.id} value={rp.id} className="text-xs">
                  {rp.name} ({rp.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Rejection Reason Banner ───────────────────────── */}
      {isRejected && provider.rejectionReason && (
        <div
          role="alert"
          className="flex items-start gap-3 px-5 py-4 rounded-xl border-2 border-red-200 bg-red-50"
        >
          <div className="shrink-0 mt-0.5">
            <div className="w-9 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm text-red-800">
              Your application was rejected
            </p>
            <p className="text-sm text-red-700 leading-relaxed">
              <span className="text-red-800">Reason:</span>{" "}
              {provider.rejectionReason}
            </p>
            <p className="text-xs text-red-500 mt-2">
              Please review and correct your information below, then re-submit
              your application.
            </p>
          </div>
        </div>
      )}

      {/* ── Pending Status Banner ─────────────────────────── */}
      {isPending && !successState && (
        <div
          role="status"
          className="flex items-start gap-3 px-5 py-4 rounded-xl border-2 border-amber-200 bg-amber-50"
        >
          <div className="shrink-0 mt-0.5">
            <div className="w-9 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              Your application is pending review
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Your application is currently being reviewed. You cannot make
              changes until the review is complete.
            </p>
          </div>
        </div>
      )}

      {/* ── Editable Profile Form ─────────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#003B95]" />
              <h2 className="text-sm text-[#111827]">Application Details</h2>
            </div>
            <div className="flex items-center gap-2">
              {isRejected && (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 border-red-200 text-[11px]"
                >
                  Rejected
                </Badge>
              )}
              {isPending && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800 border-amber-200 text-[11px]"
                >
                  Pending Review
                </Badge>
              )}
              {provider.verificationStatus === "Approved" && (
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]"
                >
                  Approved
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* ── Section: Basic Information ─────────────── */}
          <div>
            <h3 className="text-xs text-[#9CA3AF] tracking-wider uppercase mb-4 flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Provider Name"
                required
                error={
                  touched.has("providerName") ? errors.providerName : undefined
                }
                htmlFor="providerName"
              >
                <Input
                  id="providerName"
                  value={formData.providerName}
                  onChange={(e) => updateField("providerName", e.target.value)}
                  onBlur={() => handleBlur("providerName")}
                  disabled={!isRejected}
                  className="h-10"
                />
              </FormField>

              <FormField
                label="Business / Entity Name"
                required
                error={
                  touched.has("businessName") ? errors.businessName : undefined
                }
                htmlFor="businessName"
              >
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) =>
                      updateField("businessName", e.target.value)
                    }
                    onBlur={() => handleBlur("businessName")}
                    disabled={!isRejected}
                    className="h-10 pl-9"
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* ── Section: Contact Details ───────────────── */}
          <div>
            <h3 className="text-xs text-[#9CA3AF] tracking-wider uppercase mb-4 flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email Address"
                required
                error={touched.has("email") ? errors.email : undefined}
                htmlFor="email"
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    disabled={!isRejected}
                    className="h-10 pl-9"
                  />
                </div>
              </FormField>

              <FormField
                label="Mobile Number"
                required
                error={touched.has("mobile") ? errors.mobile : undefined}
                htmlFor="mobile"
              >
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => updateField("mobile", e.target.value)}
                    onBlur={() => handleBlur("mobile")}
                    disabled={!isRejected}
                    className="h-10 pl-9"
                  />
                </div>
              </FormField>

              <FormField label="Website" htmlFor="website">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    value={formData.website || ""}
                    onChange={(e) => updateField("website", e.target.value)}
                    disabled={!isRejected}
                    className="h-10 pl-9"
                    placeholder="https://..."
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* ── Section: Location ──────────────────────── */}
          <div>
            <h3 className="text-xs text-[#9CA3AF] tracking-wider uppercase mb-4 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="City"
                required
                error={touched.has("city") ? errors.city : undefined}
                htmlFor="city"
              >
                <Select
                  value={formData.city}
                  onValueChange={(v) => updateField("city", v)}
                  disabled={!isRejected}
                >
                  <SelectTrigger id="city" className="h-10">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Area"
                required
                error={touched.has("area") ? errors.area : undefined}
                htmlFor="area"
              >
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => updateField("area", e.target.value)}
                  onBlur={() => handleBlur("area")}
                  disabled={!isRejected}
                  className="h-10"
                />
              </FormField>
            </div>
          </div>

          {/* ── Section: Business Details ──────────────── */}
          <div>
            <h3 className="text-xs text-[#9CA3AF] tracking-wider uppercase mb-4 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              Business Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="License Number"
                required
                error={
                  touched.has("licenseNumber")
                    ? errors.licenseNumber
                    : undefined
                }
                htmlFor="licenseNumber"
              >
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => updateField("licenseNumber", e.target.value)}
                  onBlur={() => handleBlur("licenseNumber")}
                  disabled={!isRejected}
                  className="h-10"
                />
              </FormField>

              <FormField
                label="Sport Category"
                required
                error={
                  touched.has("sportCategory")
                    ? errors.sportCategory
                    : undefined
                }
                htmlFor="sportCategory"
              >
                <div className="relative">
                  <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Select
                    value={formData.sportCategory}
                    onValueChange={(v) => updateField("sportCategory", v)}
                    disabled={!isRejected}
                  >
                    <SelectTrigger id="sportCategory" className="h-10 pl-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORT_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormField>
            </div>

            <div className="mt-4">
              <FormField
                label="Description"
                required
                error={
                  touched.has("description") ? errors.description : undefined
                }
                htmlFor="description"
              >
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  onBlur={() => handleBlur("description")}
                  disabled={!isRejected}
                  className="min-h-[100px]"
                  placeholder="Describe your services, facilities, and programs..."
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* ── Form Footer: Re-Submit Button ───────────────── */}
        {isRejected && (
          <div className="px-5 py-4 border-t bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-[#9CA3AF]">
              Review your details carefully, then click Re-Submit to send your
              updated application for review.
            </p>
            <Button
              ref={resubmitBtnRef}
              onClick={handleReSubmitClick}
              disabled={!isFormValid || submitCooldown}
              className="bg-[#003B95] hover:bg-[#002a6b] text-white gap-2 shrink-0"
            >
              {submitCooldown ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Re-Submit Application
            </Button>
          </div>
        )}
      </div>

      {/* ── Submission History (shown below the form) ──────── */}
      {provider.submissionHistory && provider.submissionHistory.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-[#111827] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#003B95]" />
                My Submission History
              </h2>
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-600 border-gray-200 text-[10px]"
              >
                {provider.submissionHistory.length}{" "}
                {provider.submissionHistory.length === 1
                  ? "submission"
                  : "submissions"}
              </Badge>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-0">
              {provider.submissionHistory.map((entry, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === provider.submissionHistory!.length - 1;
                const statusColors = {
                  Pending: "bg-amber-500",
                  Approved: "bg-emerald-500",
                  Rejected: "bg-red-500",
                };

                return (
                  <div key={entry.submissionNumber} className="flex gap-4">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0",
                          statusColors[entry.status],
                          isFirst && "ring-2 ring-offset-1 ring-gray-200",
                        )}
                      />
                      {!isLast && (
                        <div className="w-px flex-1 bg-gray-200 min-h-[40px]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn("pb-6 flex-1 -mt-1", isLast && "pb-0")}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-[#111827]">
                          Submission #{entry.submissionNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            entry.status === "Pending" &&
                              "bg-amber-100 text-amber-800 border-amber-200",
                            entry.status === "Approved" &&
                              "bg-emerald-100 text-emerald-800 border-emerald-200",
                            entry.status === "Rejected" &&
                              "bg-red-100 text-red-800 border-red-200",
                          )}
                        >
                          {entry.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        Submitted{" "}
                        {format(entry.submittedAt, "MMM dd, yyyy 'at' HH:mm")}
                        {entry.reviewedAt && (
                          <>
                            {" "}
                            &middot; Reviewed{" "}
                            {format(entry.reviewedAt, "MMM dd, yyyy")}
                          </>
                        )}
                      </p>
                      {entry.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded-md px-3 py-2 border border-red-100">
                          Reason: {entry.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          Re-Submit Confirmation Modal
          ══════════════════════════════════════════════════════ */}
      <Dialog
        open={showConfirmModal}
        onOpenChange={(o) => {
          if (!o && !isSubmitting) setShowConfirmModal(false);
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <Send className="h-5 w-5 text-[#003B95]" />
            </div>
            <DialogTitle className="text-center">
              Confirm Re-Submission
            </DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to re-submit your application with updated
              details?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none bg-[#003B95] hover:bg-[#002a6b] text-white gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
