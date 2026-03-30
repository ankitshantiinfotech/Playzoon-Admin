// ─── US-101 Reports (Admin) ───────────────────────────────────────────────────
// Four tabbed report views: Player · Booking · Payment · Earnings
// BR-001: Data read-only; no modification.
// BR-002: Export covers full selected period and filters.
// BR-003: Reports are real-time / near-real-time read.
// BR-004: Large exports (custom range > 90 days) delivered async via email.

import { useState, useMemo, useCallback } from "react";
import { format, subDays, differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  BarChart2,
  Users,
  Calendar,
  CreditCard,
  Banknote,
  Download,
  FileText,
  Filter,
  ChevronDown,
  CalendarIcon,
  X,
  Loader2,
  Info,
  Mail,
  CheckCircle,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Calendar as CalendarPicker } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
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
  DatePreset,
  CountryCode,
  ReportFilters,
  DATE_PRESETS,
  COUNTRY_OPTIONS,
} from "./types";
import { PlayerReportTab }  from "./PlayerReportTab";
import { BookingReportTab } from "./BookingReportTab";
import { PaymentReportTab } from "./PaymentReportTab";
import { EarningsReportTab } from "./EarningsReportTab";

// ─── Report tab config ────────────────────────────────────────────────────────

type ReportTab = "player" | "booking" | "payment" | "earnings";

const TABS: {
  id: ReportTab; label: string; icon: React.ElementType; color: string; bg: string;
}[] = [
  { id: "player",   label: "Player Report",   icon: Users,       color: "text-[#003B95]",  bg: "bg-blue-50"   },
  { id: "booking",  label: "Booking Report",  icon: Calendar,    color: "text-violet-600", bg: "bg-violet-50" },
  { id: "payment",  label: "Payment Report",  icon: CreditCard,  color: "text-emerald-600",bg: "bg-emerald-50"},
  { id: "earnings", label: "Earnings Report", icon: Banknote,    color: "text-amber-600",  bg: "bg-amber-50"  },
];

const TAB_LABELS: Record<ReportTab, string> = {
  player: "Player", booking: "Booking", payment: "Payment", earnings: "Earnings",
};

// ─── Date range picker helper ─────────────────────────────────────────────────

function makeDateRange(preset: DatePreset): { from: Date; to: Date } {
  const to = new Date();
  switch (preset) {
    case "7d":  return { from: subDays(to, 7),   to };
    case "30d": return { from: subDays(to, 30),  to };
    case "3m":  return { from: subDays(to, 90),  to };
    case "12m": return { from: subDays(to, 365), to };
    default:    return { from: subDays(to, 30),  to };
  }
}

// ─── BR-004 Async Export Dialog ───────────────────────────────────────────────

function AsyncExportDialog({
  open, format: exportFmt, report, onClose,
}: {
  open: boolean; format: "CSV" | "PDF"; report: string; onClose: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleConfirm = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setSending(false);
    toast.success("Export link will be emailed within 5 minutes.");
  };

  const handleClose = () => {
    setSent(false);
    setSending(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className={cn(
              "flex items-center justify-center h-8 w-8 rounded-lg",
              sent ? "bg-emerald-100" : "bg-blue-50",
            )}>
              {sent ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Mail className="h-4 w-4 text-[#003B95]" />}
            </div>
            {sent ? "Export Queued" : "Large Export — BR-004"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {sent
              ? "Your export has been queued. You'll receive an email with a download link within 5 minutes."
              : `The selected date range produces more than 100,000 rows. This ${exportFmt} export for the ${report} Report will be processed asynchronously and delivered to your registered admin email as a download link.`
            }
          </DialogDescription>
        </DialogHeader>

        {!sent && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            Estimated delivery: within 5 minutes. Large exports are logged in the Audit Trail.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{sent ? "Close" : "Cancel"}</Button>
          {!sent && (
            <Button
              onClick={handleConfirm}
              disabled={sending}
              className="bg-[#003B95] hover:bg-[#002d73] text-white min-w-[120px]"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send Link via Email"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Custom Date Range Popover ────────────────────────────────────────────────

function CustomDatePicker({
  from, to, onChange,
}: {
  from: Date; to: Date; onChange: (from: Date, to: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selFrom, setSelFrom] = useState<Date | undefined>(from);
  const [selTo,   setSelTo]   = useState<Date | undefined>(to);

  const handleApply = () => {
    if (selFrom && selTo) {
      onChange(selFrom, selTo);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-lg border text-xs transition-all",
          "border-gray-200 text-gray-600 bg-white hover:border-gray-300",
        )}>
          <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
          {format(from, "MMM d")} – {format(to, "MMM d, yyyy")}
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-4 w-auto">
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">From</p>
            <CalendarPicker
              mode="single"
              selected={selFrom}
              onSelect={setSelFrom}
              disabled={(d) => selTo ? d > selTo : false}
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">To</p>
            <CalendarPicker
              mode="single"
              selected={selTo}
              onSelect={setSelTo}
              disabled={(d) => selFrom ? d < selFrom : false}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3 border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!selFrom || !selTo}
            className="bg-[#003B95] hover:bg-[#002d73] text-white"
          >
            Apply Range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function AdminReportsPage() {
  const [activeTab, setActiveTab]       = useState<ReportTab>("player");
  const [preset, setPreset]             = useState<DatePreset>("30d");
  const [customFrom, setCustomFrom]     = useState<Date>(subDays(new Date(), 30));
  const [customTo,   setCustomTo]       = useState<Date>(new Date());
  const [country, setCountry]           = useState<CountryCode>("all");
  const [isExporting, setIsExporting]   = useState(false);
  const [asyncDialog, setAsyncDialog]   = useState<{ open: boolean; format: "CSV" | "PDF" }>({ open: false, format: "CSV" });

  const filters: ReportFilters = useMemo(() => {
    const range = preset === "custom" ? { from: customFrom, to: customTo } : makeDateRange(preset);
    return { preset, from: range.from, to: range.to, country };
  }, [preset, customFrom, customTo, country]);

  const isLargeExport = useMemo(() => {
    const days = differenceInDays(filters.to, filters.from);
    return days > 90;
  }, [filters]);

  const handleExport = useCallback(async (fmt: "CSV" | "PDF") => {
    // BR-004: large exports go async
    if (isLargeExport) {
      setAsyncDialog({ open: true, format: fmt });
      return;
    }

    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 1200));

    // Simulate file download
    const filename = `playzoon-${TAB_LABELS[activeTab].toLowerCase()}-report-${format(filters.from, "yyyy-MM-dd")}-to-${format(filters.to, "yyyy-MM-dd")}.${fmt.toLowerCase()}`;
    toast.success(
      `${TAB_LABELS[activeTab]} Report exported as ${fmt}`,
      { description: filename, duration: 4000 },
    );
    setIsExporting(false);
  }, [activeTab, filters, isLargeExport]);

  const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === country)?.label ?? "All Countries";

  return (
    <div className="space-y-0 flex flex-col h-full">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="px-0 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl text-gray-900 flex items-center gap-2.5">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#003B95]/10">
                <BarChart2 className="h-5 w-5 text-[#003B95]" />
              </div>
              Platform Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Detailed analytics across player activity, bookings, payments, and platform earnings. BR-003: read-only, near-real-time data.
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("CSV")}
              disabled={isExporting}
              className="gap-1.5 text-xs h-8"
            >
              {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("PDF")}
              disabled={isExporting}
              className="gap-1.5 text-xs h-8"
            >
              <FileText className="h-3 w-3" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tab selector ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all",
                active
                  ? cn("border-current bg-white shadow-sm", tab.color)
                  : "border-gray-200 text-gray-400 bg-white hover:border-gray-300 hover:text-gray-600",
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-9 w-9 rounded-lg shrink-0 transition-colors",
                active ? tab.bg : "bg-gray-100",
              )}>
                <Icon className={cn("h-4 w-4", active ? tab.color : "text-gray-400")} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-xs leading-none mb-0.5", active ? tab.color : "text-gray-400")}>
                  {tab.id === "player" ? "Player" : tab.id === "booking" ? "Booking" : tab.id === "payment" ? "Payment" : "Earnings"}
                </p>
                <p className={cn("text-sm leading-none", active ? "text-gray-900" : "text-gray-500")}>
                  Report
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3.5 bg-gray-50/95 backdrop-blur border-b border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date preset pills */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {DATE_PRESETS.filter((p) => p.value !== "custom").map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs transition-all",
                  preset === p.value
                    ? "bg-[#003B95] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                )}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setPreset("custom")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs transition-all",
                preset === "custom"
                  ? "bg-[#003B95] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              )}
            >
              Custom
            </button>
          </div>

          {/* Custom date picker — shown when preset = custom */}
          {preset === "custom" && (
            <CustomDatePicker
              from={customFrom}
              to={customTo}
              onChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
            />
          )}

          {/* Period display when not custom */}
          {preset !== "custom" && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 bg-white rounded-lg h-9 px-3">
              <CalendarIcon className="h-3 w-3" />
              {format(filters.from, "MMM d")} – {format(filters.to, "MMM d, yyyy")}
            </span>
          )}

          {/* Country filter */}
          <Select value={country} onValueChange={(v) => setCountry(v as CountryCode)}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <Filter className="h-3 w-3 text-gray-400 mr-1" />
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active filters display */}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {country !== "all" && (
              <Badge
                variant="outline"
                className="text-[11px] gap-1 border-blue-200 bg-blue-50 text-blue-700 cursor-pointer"
                onClick={() => setCountry("all")}
              >
                {countryLabel} <X className="h-2.5 w-2.5" />
              </Badge>
            )}
            {isLargeExport && (
              <Badge variant="outline" className="text-[11px] gap-1 border-amber-200 bg-amber-50 text-amber-700">
                <Info className="h-3 w-3" /> Large range — async export
              </Badge>
            )}
            {/* BR-002: Export note */}
            <span className="text-[10px] text-gray-400 hidden sm:block">
              BR-002: exports include all data for selected period
            </span>
          </div>
        </div>
      </div>

      {/* ── Active tab content ────────────────────────────────────────────── */}
      <div className="flex-1 pb-8">
        {activeTab === "player"   && <PlayerReportTab   filters={filters} />}
        {activeTab === "booking"  && <BookingReportTab  filters={filters} />}
        {activeTab === "payment"  && <PaymentReportTab  filters={filters} />}
        {activeTab === "earnings" && <EarningsReportTab filters={filters} />}
      </div>

      {/* ── BR-004 Async Export Dialog ────────────────────────────────────── */}
      <AsyncExportDialog
        open={asyncDialog.open}
        format={asyncDialog.format}
        report={TAB_LABELS[activeTab]}
        onClose={() => setAsyncDialog((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
