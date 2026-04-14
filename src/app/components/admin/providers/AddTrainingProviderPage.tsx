import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "../../ui/utils";
import MobileNumber from "../../ui/MobileNumber";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../ui/breadcrumb";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  clubName: string;
}

const INITIAL_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phoneE164: "",
  clubName: "",
};

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
    <p id={id} role="alert" className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function HelperText({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p id={id} className="text-[11px] text-[#9CA3AF] mt-1">
      {children}
    </p>
  );
}

export function AddTrainingProviderPage() {
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

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
    clubName: useRef<HTMLInputElement>(null),
  };
  const phoneWrapRef = useRef<HTMLDivElement>(null);

  const trimmedValue = (s: string) => s.trim().replace(/\s+/g, " ");

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

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
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) error = "Please enter a valid email address.";
        break;
      }
      case "phone": {
        const v = form.phoneE164.trim();
        if (!v) error = "Mobile number is required.";
        else if (!isValidPhoneNumber(v)) error = "Please enter a valid mobile number.";
        break;
      }
      case "clubName": {
        const v = trimmedValue(form.clubName);
        if (!v) error = "Club name is required.";
        else if (v.length > 200) error = "Club name is too long (max 200).";
        break;
      }
    }
    if (showInline && error) setErrors((prev) => ({ ...prev, [field]: error! }));
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
    const fields = ["firstName", "lastName", "email", "phone", "clubName"];
    const newErrors: Record<string, string> = {};
    for (const f of fields) {
      const err = validateField(f, false);
      if (err) newErrors[f] = err;
    }
    setErrors(newErrors);
    const firstErr = fields.find((f) => newErrors[f]);
    if (firstErr === "phone") {
      phoneWrapRef.current?.querySelector<HTMLInputElement>(".PhoneInputInput")?.focus();
    } else if (firstErr && fieldRefs[firstErr]?.current) {
      fieldRefs[firstErr].current?.focus();
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      showBanner("error", "We couldn't create the provider. Please review the errors and try again.");
      return;
    }
    setIsSubmitting(true);
    setBanner((b) => ({ ...b, visible: false }));
    try {
      const parsedPhone = parsePhoneNumber(form.phoneE164.trim());
      if (!parsedPhone) {
        setErrors((prev) => ({ ...prev, phone: "Invalid phone number." }));
        phoneWrapRef.current?.querySelector<HTMLInputElement>(".PhoneInputInput")?.focus();
        setIsSubmitting(false);
        return;
      }
      await adminService.createProvider({
        first_name: trimmedValue(form.firstName),
        last_name: trimmedValue(form.lastName),
        email: form.email.trim().toLowerCase(),
        country_code: `+${parsedPhone.countryCallingCode}`,
        mobile: parsedPhone.nationalNumber,
        provider_type: "training_provider",
        club_name: trimmedValue(form.clubName),
      });

      setIsDirty(false);
      showBanner(
        "success",
        `Training provider created. A password setup email has been sent to ${form.email.trim()}.`,
      );
      toast.success("Training provider created successfully.");
      setTimeout(() => navigate("/providers"), 800);
    } catch (err: unknown) {
      const resp = (
        err as { response?: { data?: { message?: string; error?: { code?: string; details?: unknown } } } }
      )?.response?.data;
      const errorCode = resp?.error?.code;
      const errorMessage = resp?.message || "Failed to create provider.";

      if (errorCode === "EMAIL_ALREADY_EXISTS") {
        setErrors((prev) => ({ ...prev, email: errorMessage }));
        fieldRefs.email.current?.focus();
      } else if (errorCode === "MOBILE_ALREADY_EXISTS") {
        setErrors((prev) => ({ ...prev, phone: errorMessage }));
        phoneWrapRef.current?.querySelector<HTMLInputElement>(".PhoneInputInput")?.focus();
      }

      const details = resp?.error?.details;
      if (details && Array.isArray(details) && details.length > 0) {
        const fieldMessages = (details as { field?: string; message?: string }[]).map(
          (d) => `${d.field || "Error"}: ${d.message || "Invalid value"}`,
        );
        showBanner("error", fieldMessages.join(". "));
        fieldMessages.forEach((m) => toast.error(m));
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
    else navigate("/providers");
  };

  const handleDiscard = () => {
    setDiscardDialogOpen(false);
    setIsDirty(false);
    navigate("/providers");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      (e.target as HTMLInputElement).form?.requestSubmit();
    }
  };

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
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
              onClick={() => (isDirty ? setDiscardDialogOpen(true) : navigate("/providers"))}
            >
              Service Providers
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[#111827]">Add Training Provider</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleCancel}
          aria-label="Back to providers"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 ref={titleRef} tabIndex={-1} className="text-2xl tracking-tight text-[#111827] outline-none">
          Add Training Provider
        </h1>
      </div>

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
            type="button"
            onClick={() => setBanner((b) => ({ ...b, visible: false }))}
            className="p-1 rounded hover:bg-black/5"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tp-firstName" className="text-sm text-[#374151]">
                First Name<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                ref={fieldRefs.firstName}
                id="tp-firstName"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                onBlur={() => handleBlur("firstName")}
                maxLength={55}
                aria-required
                aria-invalid={!!errors.firstName}
                disabled={isSubmitting}
                className={cn(errors.firstName && "border-red-400")}
              />
              {errors.firstName && <FieldError id="err-tp-firstName" message={errors.firstName} />}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tp-lastName" className="text-sm text-[#374151]">
                Last Name<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                ref={fieldRefs.lastName}
                id="tp-lastName"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                onBlur={() => handleBlur("lastName")}
                maxLength={55}
                aria-required
                aria-invalid={!!errors.lastName}
                disabled={isSubmitting}
                className={cn(errors.lastName && "border-red-400")}
              />
              {errors.lastName && <FieldError id="err-tp-lastName" message={errors.lastName} />}
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="tp-email" className="text-sm text-[#374151]">
                Email<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                ref={fieldRefs.email}
                id="tp-email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                aria-required
                aria-invalid={!!errors.email}
                disabled={isSubmitting}
                className={cn(errors.email && "border-red-400")}
              />
              {errors.email ? (
                <FieldError id="err-tp-email" message={errors.email} />
              ) : (
                <HelperText id="hint-tp-email">Will be normalized to lowercase.</HelperText>
              )}
            </div>

            <div className="space-y-1.5 lg:col-span-2" ref={phoneWrapRef}>
              <Label htmlFor="tp-phone" className="text-sm text-[#374151]">
                Mobile Number<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <MobileNumber
                value={form.phoneE164}
                onChange={(v) => updateField("phoneE164", v)}
                onBlur={() => handleBlur("phone")}
                disabled={isSubmitting}
                error={!!errors.phone}
              />
              {errors.phone && <FieldError id="err-tp-phone" message={errors.phone} />}
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="tp-clubName" className="text-sm text-[#374151]">
                Club Name<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                ref={fieldRefs.clubName}
                id="tp-clubName"
                placeholder="Club or organization name"
                value={form.clubName}
                onChange={(e) => updateField("clubName", e.target.value)}
                onBlur={() => handleBlur("clubName")}
                maxLength={205}
                aria-required
                aria-invalid={!!errors.clubName}
                disabled={isSubmitting}
                className={cn(errors.clubName && "border-red-400")}
              />
              {errors.clubName && <FieldError id="err-tp-clubName" message={errors.clubName} />}
            </div>
          </div>

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
              {isSubmitting ? "Creating…" : "Save"}
            </Button>
          </div>
        </form>
      </div>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you leave now, your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on page</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} className="bg-red-600 hover:bg-red-700">
              Discard &amp; leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
