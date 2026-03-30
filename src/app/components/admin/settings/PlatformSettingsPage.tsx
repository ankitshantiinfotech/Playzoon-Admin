// ─── SCR-ADM-033: Platform Settings Management ─────────────────────────────
// Single scrollable page with vertically stacked settings sections.
// Sticky save bar appears when any setting is modified.
// All settings are key-value pairs with immediate effect upon saving.

import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  RefreshCcw,
  Banknote,
  MessageSquare,
  ShieldAlert,
  Settings,
  ExternalLink,
  Save,
  Undo2,
  Info,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Badge } from "../../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
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
import type {
  PlatformSettings,
  PenaltyType,
  PayoutDurationType,
  CancellationWindow,
} from "./types";
import { DefaultProfilePictures } from "./DefaultAvatars";

// ─── Default / Saved settings (mock) ────────────────────────────────────────

const SAVED_SETTINGS: PlatformSettings = {
  fpPromotedRefresh: 5,
  fpStandardRefresh: 3,
  tpPromotedRefresh: 5,
  tpStandardRefresh: 3,
  coachPromotedRefresh: 4,
  coachStandardRefresh: 2,

  minPayoutAmount: 100,
  payoutCycleDuration: 7,
  payoutCycleDurationType: "Days",

  adminProviderChat: true,
  offlineMessages: true,

  cancellationWindow: "24",
  penaltyValue: 50,
  penaltyType: "fixed",

  maxSubAdminsPerProvider: 5,
};

const CANCELLATION_WINDOW_OPTIONS: { value: CancellationWindow; label: string }[] = [
  { value: "12", label: "12 Hours" },
  { value: "24", label: "24 Hours" },
  { value: "48", label: "48 Hours" },
  { value: "72", label: "3 Days" },
  { value: "120", label: "5 Days" },
  { value: "168", label: "7 Days" },
  { value: "240", label: "10 Days" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getChangedSettings(
  current: PlatformSettings,
  saved: PlatformSettings
): { key: string; label: string; oldValue: string; newValue: string }[] {
  const changes: { key: string; label: string; oldValue: string; newValue: string }[] = [];
  const labels: Record<string, string> = {
    fpPromotedRefresh: "FP Promoted Refresh Count",
    fpStandardRefresh: "FP Standard Refresh Count",
    tpPromotedRefresh: "TP Promoted Refresh Count",
    tpStandardRefresh: "TP Standard Refresh Count",
    coachPromotedRefresh: "Coach Promoted Refresh Count",
    coachStandardRefresh: "Coach Standard Refresh Count",
    minPayoutAmount: "Min Payout Amount",
    payoutCycleDuration: "Payout Cycle Duration",
    payoutCycleDurationType: "Payout Cycle Duration Type",
    adminProviderChat: "Admin-Provider Chat",
    offlineMessages: "Offline Messages",
    cancellationWindow: "Cancellation Window",
    penaltyValue: "Penalty Amount",
    penaltyType: "Penalty Type",
    maxSubAdminsPerProvider: "Max Sub-Admins Per Provider",
  };

  for (const key of Object.keys(saved) as (keyof PlatformSettings)[]) {
    if (current[key] !== saved[key]) {
      const format = (v: unknown) => {
        if (typeof v === "boolean") return v ? "Enabled" : "Disabled";
        if (key === "penaltyType") return v === "fixed" ? "Fixed Amount (SAR)" : "Percentage (%)";
        if (key === "cancellationWindow") {
          const opt = CANCELLATION_WINDOW_OPTIONS.find((o) => o.value === v);
          return opt?.label ?? String(v);
        }
        if (key === "minPayoutAmount" || key === "penaltyValue") return `${v} SAR`;
        return String(v);
      };
      changes.push({
        key,
        label: labels[key] || key,
        oldValue: format(saved[key]),
        newValue: format(current[key]),
      });
    }
  }
  return changes;
}

// ─── Section Components ─────────────────────────────────────────────────────

function RefreshCountField({
  label,
  value,
  onChange,
  hasWarning,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hasWarning: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-gray-700">{label}</Label>
      <Input
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className={cn("h-9 text-sm", hasWarning && "border-amber-400")}
      />
      {value === 0 && (
        <p className="text-[11px] text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Setting to 0 means no refreshes allowed for this provider type.
        </p>
      )}
      {value > 100 && (
        <p className="text-[11px] text-red-500">Refresh count cannot exceed 100.</p>
      )}
      {value < 0 && (
        <p className="text-[11px] text-red-500">Refresh count cannot be negative.</p>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({ ...SAVED_SETTINGS });
  const [savedSettings] = useState<PlatformSettings>({ ...SAVED_SETTINGS });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const changes = useMemo(
    () => getChangedSettings(settings, savedSettings),
    [settings, savedSettings]
  );
  const hasChanges = changes.length > 0;

  const update = useCallback(<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  function handleSave() {
    // Check if any changes are "critical" (penalty, communication toggles)
    const criticalKeys = ["penaltyValue", "penaltyType", "cancellationWindow", "adminProviderChat", "offlineMessages"];
    const hasCritical = changes.some((c) => criticalKeys.includes(c.key));
    if (hasCritical) {
      setConfirmOpen(true);
    } else {
      doSave();
    }
  }

  function doSave() {
    setIsSaving(true);
    setConfirmOpen(false);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Platform settings saved successfully. Changes are effective immediately.");
    }, 600);
  }

  function handleDiscard() {
    setSettings({ ...savedSettings });
    setDiscardConfirmOpen(false);
    toast.info("All unsaved changes have been discarded.");
  }

  // Penalty type change: reset value when switching
  function handlePenaltyTypeChange(type: PenaltyType) {
    update("penaltyType", type);
    update("penaltyValue", 0);
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Page header + breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <span>Admin</span>
          <span>/</span>
          <span>Configuration</span>
          <span>/</span>
          <span className="text-gray-700">Settings</span>
        </div>
        <h1 className="text-2xl font-bold text-[#111827]">Platform Settings</h1>
        <p className="text-sm text-[#6B7280] mt-1">Configure platform-wide operational settings.</p>
      </div>

      {/* Settings sections */}
      <div className="max-w-[800px] space-y-6">
        {/* ─── Section 1: Refresh Counts ─────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-100">
                <RefreshCcw className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Refresh Counts</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Configure daily refresh limits per provider type and promotion status. Counts reset at 00:00 UTC daily (Rule 18).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <RefreshCountField
                label="Facility Provider - Promoted"
                value={settings.fpPromotedRefresh}
                onChange={(v) => update("fpPromotedRefresh", v)}
                hasWarning={settings.fpPromotedRefresh === 0}
              />
              <RefreshCountField
                label="Facility Provider - Standard"
                value={settings.fpStandardRefresh}
                onChange={(v) => update("fpStandardRefresh", v)}
                hasWarning={settings.fpStandardRefresh === 0}
              />
              <RefreshCountField
                label="Training Provider - Promoted"
                value={settings.tpPromotedRefresh}
                onChange={(v) => update("tpPromotedRefresh", v)}
                hasWarning={settings.tpPromotedRefresh === 0}
              />
              <RefreshCountField
                label="Training Provider - Standard"
                value={settings.tpStandardRefresh}
                onChange={(v) => update("tpStandardRefresh", v)}
                hasWarning={settings.tpStandardRefresh === 0}
              />
              <RefreshCountField
                label="Coach - Promoted"
                value={settings.coachPromotedRefresh}
                onChange={(v) => update("coachPromotedRefresh", v)}
                hasWarning={settings.coachPromotedRefresh === 0}
              />
              <RefreshCountField
                label="Coach - Standard"
                value={settings.coachStandardRefresh}
                onChange={(v) => update("coachStandardRefresh", v)}
                hasWarning={settings.coachStandardRefresh === 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 2: Payout Configuration ───────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-100">
                <Banknote className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">Payout Configuration</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Configure minimum payout threshold and cycle duration.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Minimum Payout Amount</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settings.minPayoutAmount}
                    onChange={(e) => update("minPayoutAmount", parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">SAR</span>
                </div>
                <p className="text-[11px] text-gray-400">Providers cannot request payouts below this amount (Rule 19).</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Payout Cycle Duration</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={settings.payoutCycleDuration}
                    onChange={(e) => update("payoutCycleDuration", parseInt(e.target.value) || 1)}
                    className="h-9 text-sm flex-1"
                  />
                  <Select value={settings.payoutCycleDurationType} onValueChange={(v) => update("payoutCycleDurationType", v as PayoutDurationType)}>
                    <SelectTrigger className="h-9 w-[120px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Days">Days</SelectItem>
                      <SelectItem value="Weeks">Weeks</SelectItem>
                      <SelectItem value="Months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 3: Communication Settings ─────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-purple-100">
                <MessageSquare className="h-4.5 w-4.5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Communication Settings</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Configure chat and messaging features between admin and providers.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex-1 pr-6">
                <Label htmlFor="toggle-chat" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Enable Admin-Provider Chat
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  When enabled, providers can initiate chat with admin support (Rule 6, F10.4).
                </p>
              </div>
              <Switch
                id="toggle-chat"
                checked={settings.adminProviderChat}
                onCheckedChange={(v) => update("adminProviderChat", v)}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex-1 pr-6">
                <Label htmlFor="toggle-offline" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Enable Offline Messages
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  When enabled, messages sent to offline users are stored and delivered when they come online (F10.8).
                </p>
              </div>
              <Switch
                id="toggle-offline"
                checked={settings.offlineMessages}
                onCheckedChange={(v) => update("offlineMessages", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 4: Provider Cancellation Policy ───────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-red-100">
                <ShieldAlert className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base">Provider Cancellation Policy</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Configure the penalty applied when providers cancel bookings within the cancellation window.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Cancellation Window</Label>
                <Select value={settings.cancellationWindow} onValueChange={(v) => update("cancellationWindow", v as CancellationWindow)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select window" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_WINDOW_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-gray-400">Time before booking start when cancellation triggers a penalty.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Penalty Amount</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    max={settings.penaltyType === "percentage" ? 100 : undefined}
                    value={settings.penaltyValue}
                    onChange={(e) => update("penaltyValue", parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {settings.penaltyType === "fixed" ? "SAR" : "%"}
                  </span>
                </div>
                {settings.penaltyType === "percentage" && settings.penaltyValue > 100 && (
                  <p className="text-[11px] text-red-500">Penalty percentage cannot exceed 100%.</p>
                )}
              </div>
            </div>

            {/* Penalty type toggle */}
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Penalty Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePenaltyTypeChange("fixed")}
                  className={cn(
                    "flex items-center justify-center rounded-lg border-2 py-2.5 text-sm transition-all",
                    settings.penaltyType === "fixed"
                      ? "border-[#003B95] bg-[#003B95]/5 text-[#003B95] font-medium"
                      : "border-gray-200 text-gray-500 hover:border-gray-300",
                  )}
                >
                  Fixed Amount (SAR)
                </button>
                <button
                  type="button"
                  onClick={() => handlePenaltyTypeChange("percentage")}
                  className={cn(
                    "flex items-center justify-center rounded-lg border-2 py-2.5 text-sm transition-all",
                    settings.penaltyType === "percentage"
                      ? "border-[#003B95] bg-[#003B95]/5 text-[#003B95] font-medium"
                      : "border-gray-200 text-gray-500 hover:border-gray-300",
                  )}
                >
                  Percentage (%)
                </button>
              </div>
            </div>

            {/* Negative balance note */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                If a provider&apos;s wallet goes negative after a cancellation penalty, the negative balance will be adjusted from future earnings.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 5: General Configuration ──────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gray-100">
                <Settings className="h-4.5 w-4.5 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-base">General Configuration</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Configure system-wide operational parameters.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Max Sub-Admins Per Provider</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={settings.maxSubAdminsPerProvider}
                  onChange={(e) => update("maxSubAdminsPerProvider", parseInt(e.target.value) || 1)}
                  className="h-9 text-sm"
                />
                <p className="text-[11px] text-gray-400">Maximum number of sub-admin accounts a provider can create.</p>
                {settings.maxSubAdminsPerProvider < 1 && (
                  <p className="text-[11px] text-red-500">Must allow at least 1 sub-admin.</p>
                )}
                {settings.maxSubAdminsPerProvider > 50 && (
                  <p className="text-[11px] text-red-500">Cannot exceed 50 sub-admins per provider.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Base Currency</Label>
                <Input
                  value="SAR (Saudi Riyal)"
                  disabled
                  className="h-9 text-sm bg-gray-50 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400">Currency cannot be changed after launch.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Currency conversion rates are fetched once daily and stored in the database.
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 6: Default Profile Pictures ─────────────── */}
        <DefaultProfilePictures />

        {/* ─── Commission & Tax Link Card ────────────────────── */}
        <Card className="border-dashed">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Commission & Tax Configuration</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage commission rates, tax deductions, and payout durations per provider type.
                </p>
              </div>
              <Button variant="outline" asChild className="gap-1.5">
                <Link to="/commissions">
                  Go to Commission Configuration
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Sticky Save Bar ─────────────────────────────────── */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg">
          <div className="max-w-[1200px] mx-auto px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {changes.length} setting{changes.length !== 1 ? "s" : ""} modified
              </Badge>
              <span className="text-xs text-gray-500">Changes will take effect immediately after saving.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setDiscardConfirmOpen(true)}
                disabled={isSaving}
                className="gap-1.5"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Discard Changes
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5"
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm Modal (critical changes) ────────────────── */}
      <AlertDialog open={confirmOpen} onOpenChange={(v) => { if (!v && !isSaving) setConfirmOpen(false); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Confirm Settings Change?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p className="text-gray-500">The following settings will be updated:</p>
                <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {changes.map((c) => (
                    <div key={c.key} className="px-3 py-2 flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-medium">{c.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 line-through">{c.oldValue}</span>
                        <span className="text-gray-400">&rarr;</span>
                        <span className="text-[#003B95] font-medium">{c.newValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doSave} disabled={isSaving} className="bg-[#003B95] hover:bg-[#002a6b]">
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Discard Confirm ─────────────────────────────────── */}
      <AlertDialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Discard all unsaved changes? This will revert all settings to their last saved values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
