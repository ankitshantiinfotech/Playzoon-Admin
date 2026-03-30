// ─── SCR-ADM-032: Commission CRUD Form ───────────────────────────────────────
// Create or edit commission rules. Multi-dimensional matrix:
// Provider Type × Service Type × Provider × Country → Commission/Tax/Payout.
// Changes apply to future bookings only (Rule 69 / GAP-018).

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Info,
  X,
  Loader2,
  Save,
  AlertTriangle,
  Search,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import type {
  CommissionRule,
  CommissionFormData,
  ProviderType,
  ServiceType,
  DurationType,
} from "./types";
import {
  PROVIDER_TYPES,
  SERVICE_TYPES,
  DURATION_TYPES,
  EMPTY_FORM,
  MOCK_PROVIDERS,
  COUNTRY_OPTIONS,
} from "./types";
import { MOCK_COMMISSION_RULES } from "./mockData";

// ─── Validation helpers ──────────────────────────────────────────────────────

interface FormErrors {
  providerType?: string;
  serviceType?: string;
  commissionRate?: string;
  taxRate?: string;
  payoutDuration?: string;
  durationType?: string;
}

function validateForm(form: CommissionFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.providerType) {
    errors.providerType = "Provider type is required.";
  }
  if (!form.serviceType) {
    errors.serviceType = "Service type is required.";
  }

  // Commission rate
  if (!form.commissionRate && form.commissionRate !== "0") {
    errors.commissionRate = "Commission rate is required.";
  } else {
    const rate = parseFloat(form.commissionRate);
    if (isNaN(rate)) {
      errors.commissionRate = "Enter a valid number with up to 2 decimal places.";
    } else if (rate < 0) {
      errors.commissionRate = "Commission rate cannot be negative.";
    } else if (rate > 100) {
      errors.commissionRate = "Commission rate cannot exceed 100%.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.commissionRate)) {
      errors.commissionRate = "Enter a valid number with up to 2 decimal places.";
    }
  }

  // Tax rate
  if (!form.taxRate && form.taxRate !== "0") {
    errors.taxRate = "Tax deduction rate is required.";
  } else {
    const rate = parseFloat(form.taxRate);
    if (isNaN(rate)) {
      errors.taxRate = "Enter a valid number with up to 2 decimal places.";
    } else if (rate < 0) {
      errors.taxRate = "Tax deduction rate cannot be negative.";
    } else if (rate > 100) {
      errors.taxRate = "Tax deduction rate cannot exceed 100%.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.taxRate)) {
      errors.taxRate = "Enter a valid number with up to 2 decimal places.";
    }
  }

  // Payout duration
  if (!form.payoutDuration) {
    errors.payoutDuration = "Payout duration is required.";
  } else {
    const dur = parseFloat(form.payoutDuration);
    if (!Number.isInteger(dur)) {
      errors.payoutDuration = "Payout duration must be a whole number.";
    } else if (dur < 1) {
      errors.payoutDuration = "Payout duration must be at least 1.";
    }
  }

  if (!form.durationType) {
    errors.durationType = "Duration type is required.";
  }

  return errors;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CommissionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Load existing rule in edit mode
  const existingRule = useMemo(
    () => (id ? MOCK_COMMISSION_RULES.find((r) => r.id === id) ?? null : null),
    [id]
  );

  // Form state
  const [form, setForm] = useState<CommissionFormData>(() => {
    if (existingRule) {
      return {
        providerType: existingRule.providerType,
        serviceType: existingRule.serviceType,
        providerName: existingRule.providerName,
        providerId: existingRule.providerId,
        country: existingRule.country,
        countryCode: existingRule.countryCode,
        commissionRate: existingRule.commissionRate.toFixed(2),
        taxRate: existingRule.taxRate.toFixed(2),
        payoutDuration: String(existingRule.payoutDuration),
        durationType: existingRule.durationType,
        status: existingRule.status,
      };
    }
    return { ...EMPTY_FORM };
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [infoBannerVisible, setInfoBannerVisible] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Check for 404 in edit mode
  useEffect(() => {
    if (isEditMode && !existingRule) {
      setNotFound(true);
    }
  }, [isEditMode, existingRule]);

  // Filtered providers based on selected type
  const filteredProviders = useMemo(() => {
    if (!form.providerType) return [];
    let providers = MOCK_PROVIDERS.filter((p) => p.type === form.providerType);
    if (providerSearch.trim()) {
      const q = providerSearch.toLowerCase();
      providers = providers.filter((p) => p.name.toLowerCase().includes(q));
    }
    return providers;
  }, [form.providerType, providerSearch]);

  // Check for duplicate rule
  useEffect(() => {
    if (!form.providerType || !form.serviceType) {
      setDuplicateWarning(false);
      return;
    }
    const exists = MOCK_COMMISSION_RULES.some(
      (r) =>
        r.providerType === form.providerType &&
        r.serviceType === form.serviceType &&
        r.providerName === form.providerName &&
        r.country === form.country &&
        (!isEditMode || r.id !== id)
    );
    setDuplicateWarning(exists);
  }, [form.providerType, form.serviceType, form.providerName, form.country, isEditMode, id]);

  // Update form field
  const updateField = useCallback(
    <K extends keyof CommissionFormData>(key: K, value: CommissionFormData[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        // Reset provider when type changes
        if (key === "providerType" && value !== prev.providerType) {
          next.providerName = "All Providers";
          next.providerId = null;
        }
        return next;
      });
      setIsDirty(true);
      setTouched((prev) => new Set(prev).add(key));
    },
    []
  );

  // Handle blur for validation
  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => new Set(prev).add(field));
      const formErrors = validateForm(form);
      setErrors(formErrors);
    },
    [form]
  );

  // Navigate with unsaved changes check
  const navigateAway = useCallback(
    (path: string) => {
      if (isDirty) {
        setPendingNavigation(path);
        setShowUnsavedModal(true);
      } else {
        navigate(path);
      }
    },
    [isDirty, navigate]
  );

  // Handle save
  const handleSave = useCallback(() => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    // Mark all fields as touched
    setTouched(
      new Set([
        "providerType",
        "serviceType",
        "commissionRate",
        "taxRate",
        "payoutDuration",
        "durationType",
      ])
    );
    if (Object.keys(formErrors).length > 0) return;
    if (duplicateWarning) return;
    setShowConfirmModal(true);
  }, [form, duplicateWarning]);

  const handleConfirmSave = useCallback(() => {
    setShowConfirmModal(false);
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      toast.success(
        isEditMode
          ? "Commission rule updated successfully. Changes apply to future bookings only."
          : "Commission rule created successfully."
      );
      navigate("/commissions");
    }, 800);
  }, [isEditMode, navigate]);

  // 404 screen
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Commission rule not found.
        </h2>
        <Button
          variant="outline"
          onClick={() => navigate("/commissions")}
        >
          Back to List
        </Button>
      </div>
    );
  }

  const isFormValid =
    Object.keys(validateForm(form)).length === 0 && !duplicateWarning;

  // Build confirm modal summary
  const confirmSummary = {
    providerType: form.providerType || "—",
    serviceType: form.serviceType || "—",
    provider: form.providerName,
    country: form.country,
    commissionRate: form.commissionRate || "0",
    taxRate: form.taxRate || "0",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb + back */}
      <div>
        <nav className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
          <button
            onClick={() => navigateAway("/")}
            className="hover:text-[#003B95] cursor-pointer"
          >
            Admin
          </button>
          <span>/</span>
          <span className="text-gray-400">Configuration</span>
          <span>/</span>
          <button
            onClick={() => navigateAway("/commissions")}
            className="hover:text-[#003B95] cursor-pointer"
          >
            Commission
          </button>
          <span>/</span>
          <span className="text-gray-900">
            {isEditMode ? "Edit" : "Create"}
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigateAway("/commissions")}
            aria-label="Back to Commission Configuration list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-[#111827]">
            {isEditMode ? "Edit Commission Rule" : "Create Commission Rule"}
          </h1>
        </div>
      </div>

      {/* Info banner */}
      {infoBannerVisible && (
        <div
          className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800"
          role="status"
          aria-live="polite"
        >
          <Info className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
          <div className="flex-1">
            Commission and tax rates are locked at booking creation time.
            Changes apply to future bookings only.
          </div>
          <button
            onClick={() => setInfoBannerVisible(false)}
            className="text-blue-400 hover:text-blue-600 shrink-0"
            aria-label="Dismiss information banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Duplicate warning */}
      {duplicateWarning && (
        <div
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
          <div className="flex-1">
            A rule with this combination of Provider Type, Service Type,
            Provider, and Country already exists. Please edit the existing
            rule instead.
          </div>
        </div>
      )}

      {/* Form Card */}
      <form
        aria-label="Commission rule form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <Card className="max-w-[720px] mx-auto">
          <CardContent className="p-6 space-y-8">
            {/* Section: Provider & Service Configuration */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 border-b pb-2">
                Provider & Service Configuration
              </h2>

              {/* Provider Type */}
              <div className="space-y-1.5">
                <Label htmlFor="providerType">
                  Provider Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.providerType || undefined}
                  onValueChange={(v) =>
                    updateField("providerType", v as ProviderType)
                  }
                >
                  <SelectTrigger
                    id="providerType"
                    className={cn(
                      "h-10",
                      touched.has("providerType") && errors.providerType
                        ? "border-red-500"
                        : ""
                    )}
                    aria-required="true"
                    aria-invalid={
                      touched.has("providerType") && !!errors.providerType
                    }
                  >
                    <SelectValue placeholder="Select provider type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.has("providerType") && errors.providerType && (
                  <p className="text-xs text-red-500">{errors.providerType}</p>
                )}
              </div>

              {/* Service Type */}
              <div className="space-y-1.5">
                <Label htmlFor="serviceType">
                  Service Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.serviceType || undefined}
                  onValueChange={(v) =>
                    updateField("serviceType", v as ServiceType)
                  }
                >
                  <SelectTrigger
                    id="serviceType"
                    className={cn(
                      "h-10",
                      touched.has("serviceType") && errors.serviceType
                        ? "border-red-500"
                        : ""
                    )}
                    aria-required="true"
                    aria-invalid={
                      touched.has("serviceType") && !!errors.serviceType
                    }
                  >
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.has("serviceType") && errors.serviceType && (
                  <p className="text-xs text-red-500">{errors.serviceType}</p>
                )}
              </div>

              {/* Provider Name (searchable) */}
              <div className="space-y-1.5">
                <Label htmlFor="providerName">Provider Name</Label>
                <Select
                  value={
                    form.providerId
                      ? form.providerId
                      : "__all_providers__"
                  }
                  onValueChange={(v) => {
                    if (v === "__all_providers__") {
                      updateField("providerName", "All Providers");
                      setForm((prev) => ({ ...prev, providerId: null }));
                    } else {
                      const provider = MOCK_PROVIDERS.find((p) => p.id === v);
                      if (provider) {
                        updateField("providerName", provider.name);
                        setForm((prev) => ({ ...prev, providerId: provider.id }));
                      }
                    }
                    setIsDirty(true);
                  }}
                >
                  <SelectTrigger id="providerName" className="h-10">
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                          value={providerSearch}
                          onChange={(e) => setProviderSearch(e.target.value)}
                          placeholder="Search providers..."
                          className="h-8 pl-8 text-sm"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <SelectItem value="__all_providers__">
                      All Providers
                    </SelectItem>
                    {filteredProviders.length === 0 && form.providerType ? (
                      <div className="px-4 py-2 text-xs text-gray-500">
                        No providers found
                      </div>
                    ) : (
                      filteredProviders.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))
                    )}
                    {!form.providerType && (
                      <div className="px-4 py-2 text-xs text-gray-500">
                        No individual providers available for this type.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Leave as "All Providers" for a global rule.
                </p>
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={form.countryCode ?? "__all_countries__"}
                  onValueChange={(v) => {
                    if (v === "__all_countries__") {
                      updateField("country", "All Countries");
                      setForm((prev) => ({ ...prev, countryCode: null }));
                    } else {
                      const country = COUNTRY_OPTIONS.find((c) => c.code === v);
                      if (country) {
                        updateField("country", country.name);
                        setForm((prev) => ({
                          ...prev,
                          countryCode: country.code,
                        }));
                      }
                    }
                    setIsDirty(true);
                  }}
                >
                  <SelectTrigger id="country" className="h-10">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all_countries__">
                      All Countries
                    </SelectItem>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Leave as "All Countries" for a global rule.
                </p>
              </div>
            </div>

            {/* Section: Rate Configuration */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 border-b pb-2">
                Rate Configuration
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Commission Rate */}
                <div className="space-y-1.5">
                  <Label htmlFor="commissionRate">
                    Commission Rate (%)
                    <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="commissionRate"
                      type="text"
                      inputMode="decimal"
                      value={form.commissionRate}
                      onChange={(e) =>
                        updateField("commissionRate", e.target.value)
                      }
                      onBlur={() => handleBlur("commissionRate")}
                      placeholder="0.00"
                      className={cn(
                        "h-10 pr-8",
                        touched.has("commissionRate") && errors.commissionRate
                          ? "border-red-500"
                          : ""
                      )}
                      aria-required="true"
                      aria-invalid={
                        touched.has("commissionRate") &&
                        !!errors.commissionRate
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      %
                    </span>
                  </div>
                  {touched.has("commissionRate") && errors.commissionRate && (
                    <p className="text-xs text-red-500">
                      {errors.commissionRate}
                    </p>
                  )}
                  {form.commissionRate === "0" ||
                  form.commissionRate === "0.00" ? (
                    <p className="text-xs text-amber-600">
                      Setting commission to 0% means no platform commission for
                      this rule.
                    </p>
                  ) : null}
                </div>

                {/* Tax Rate */}
                <div className="space-y-1.5">
                  <Label htmlFor="taxRate">
                    Tax Deduction (%)
                    <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="taxRate"
                      type="text"
                      inputMode="decimal"
                      value={form.taxRate}
                      onChange={(e) =>
                        updateField("taxRate", e.target.value)
                      }
                      onBlur={() => handleBlur("taxRate")}
                      placeholder="0.00"
                      className={cn(
                        "h-10 pr-8",
                        touched.has("taxRate") && errors.taxRate
                          ? "border-red-500"
                          : ""
                      )}
                      aria-required="true"
                      aria-invalid={
                        touched.has("taxRate") && !!errors.taxRate
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      %
                    </span>
                  </div>
                  {touched.has("taxRate") && errors.taxRate && (
                    <p className="text-xs text-red-500">{errors.taxRate}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Tax is calculated on the post-commission amount.
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Payout Configuration */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 border-b pb-2">
                Payout Configuration
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Payout Duration */}
                <div className="space-y-1.5">
                  <Label htmlFor="payoutDuration">
                    Payout Duration
                    <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Input
                    id="payoutDuration"
                    type="text"
                    inputMode="numeric"
                    value={form.payoutDuration}
                    onChange={(e) =>
                      updateField("payoutDuration", e.target.value)
                    }
                    onBlur={() => handleBlur("payoutDuration")}
                    placeholder="1"
                    className={cn(
                      "h-10",
                      touched.has("payoutDuration") && errors.payoutDuration
                        ? "border-red-500"
                        : ""
                    )}
                    aria-required="true"
                    aria-invalid={
                      touched.has("payoutDuration") && !!errors.payoutDuration
                    }
                  />
                  {touched.has("payoutDuration") && errors.payoutDuration && (
                    <p className="text-xs text-red-500">
                      {errors.payoutDuration}
                    </p>
                  )}
                </div>

                {/* Duration Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="durationType">
                    Duration Type
                    <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Select
                    value={form.durationType || undefined}
                    onValueChange={(v) =>
                      updateField("durationType", v as DurationType)
                    }
                  >
                    <SelectTrigger
                      id="durationType"
                      className={cn(
                        "h-10",
                        touched.has("durationType") && errors.durationType
                          ? "border-red-500"
                          : ""
                      )}
                      aria-required="true"
                      aria-invalid={
                        touched.has("durationType") && !!errors.durationType
                      }
                    >
                      <SelectValue placeholder="Select duration type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched.has("durationType") && errors.durationType && (
                    <p className="text-xs text-red-500">
                      {errors.durationType}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Status */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 border-b pb-2">
                Status
              </h2>

              <div className="flex items-center gap-3">
                <Switch
                  id="status"
                  checked={form.status === "Active"}
                  onCheckedChange={(checked) =>
                    updateField("status", checked ? "Active" : "Inactive")
                  }
                  aria-label="Commission rule status"
                />
                <Label
                  htmlFor="status"
                  className={cn(
                    "text-sm font-medium",
                    form.status === "Active"
                      ? "text-emerald-700"
                      : "text-gray-500"
                  )}
                >
                  {form.status}
                </Label>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigateAway("/commissions")}
                aria-label="Cancel and return to commission list"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#003B95] hover:bg-[#002d73] text-white gap-2"
                disabled={!isFormValid || isSaving}
              >
                {isSaving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isSaving
                  ? "Saving..."
                  : isEditMode
                  ? "Save Changes"
                  : "Create Rule"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Confirm Save Modal */}
      <Dialog
        open={showConfirmModal}
        onOpenChange={(v) => {
          if (!v) setShowConfirmModal(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              Confirm Commission Rule{" "}
              {isEditMode ? "Update" : "Creation"}?
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              This will apply to all future bookings matching these criteria.
              Existing bookings retain their locked rates.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 border rounded-lg p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Provider Type</span>
              <span className="text-gray-900">
                {confirmSummary.providerType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Service Type</span>
              <span className="text-gray-900">
                {confirmSummary.serviceType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Provider</span>
              <span
                className={cn(
                  "text-gray-900",
                  confirmSummary.provider === "All Providers" &&
                    "italic text-gray-500"
                )}
              >
                {confirmSummary.provider}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Country</span>
              <span
                className={cn(
                  "text-gray-900",
                  confirmSummary.country === "All Countries" &&
                    "italic text-gray-500"
                )}
              >
                {confirmSummary.country}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Commission Rate</span>
              <span className="text-gray-900 tabular-nums">
                {confirmSummary.commissionRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax Rate</span>
              <span className="text-gray-900 tabular-nums">
                {confirmSummary.taxRate}%
              </span>
            </div>
            {isEditMode && existingRule && (
              <>
                {existingRule.commissionRate.toFixed(2) !==
                  form.commissionRate && (
                  <div className="flex justify-between text-amber-700 pt-2 border-t mt-2">
                    <span>Previous Commission Rate</span>
                    <span className="tabular-nums">
                      {existingRule.commissionRate.toFixed(2)}% &rarr;{" "}
                      {form.commissionRate}%
                    </span>
                  </div>
                )}
                {existingRule.taxRate.toFixed(2) !== form.taxRate && (
                  <div className="flex justify-between text-amber-700">
                    <span>Previous Tax Rate</span>
                    <span className="tabular-nums">
                      {existingRule.taxRate.toFixed(2)}% &rarr;{" "}
                      {form.taxRate}%
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#003B95] hover:bg-[#002d73] text-white"
              onClick={handleConfirmSave}
              disabled={isSaving}
            >
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Modal */}
      <Dialog
        open={showUnsavedModal}
        onOpenChange={(v) => {
          if (!v) {
            setShowUnsavedModal(false);
            setPendingNavigation(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              Unsaved Changes
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              You have unsaved changes. Are you sure you want to leave?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnsavedModal(false);
                setPendingNavigation(null);
              }}
            >
              Stay on Page
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowUnsavedModal(false);
                if (pendingNavigation) {
                  navigate(pendingNavigation);
                }
              }}
            >
              Leave Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
