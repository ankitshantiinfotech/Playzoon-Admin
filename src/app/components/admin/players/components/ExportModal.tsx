import { useState } from "react";
import { toast } from "sonner";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Checkbox } from "../../../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../../../ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { Calendar } from "../../../ui/calendar";
import { CalendarIcon, Download, FileSpreadsheet } from "lucide-react";
import { format, isBefore } from "date-fns";
import { EXPORT_FIELDS } from "../player-data";

// ─── Types ───────────────────────────────────────────────────

type ExportScope = "current_view" | "all_matching" | "selected";
type ExportFormat = "csv" | "xlsx" | "json";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalFiltered: number;
  defaultScope?: ExportScope;
}

// ─── Component ───────────────────────────────────────────────

export function ExportModal({ open, onOpenChange, selectedCount, totalFiltered, defaultScope }: Props) {
  const [scope, setScope] = useState<ExportScope>(defaultScope || "current_view");
  const [selectedFields, setSelectedFields] = useState<string[]>(EXPORT_FIELDS.map((f) => f.value));
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [includeDeps, setIncludeDeps] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleField = (val: string) => {
    setSelectedFields((prev) =>
      prev.includes(val) ? prev.filter((f) => f !== val) : [...prev, val]
    );
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (selectedFields.length === 0) e.fields = "Select at least one field to export.";
    if (dateFrom && dateTo && isBefore(dateTo, dateFrom)) e.dateTo = "End date must be on or after start date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleExport = () => {
    if (!validate()) return;

    const count =
      scope === "selected" ? selectedCount :
      scope === "current_view" ? totalFiltered :
      totalFiltered;

    toast.success(
      count > 500
        ? `Export of ${count.toLocaleString()} players queued. We'll notify you when it's ready.`
        : `Exporting ${count.toLocaleString()} players as ${exportFormat.toUpperCase()}…`
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#003B95]" />
            Export Players
          </DialogTitle>
          <DialogDescription>Configure your export settings below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Scope */}
          <div className="space-y-3">
            <Label>Export Scope</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as ExportScope)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="current_view" id="exp-cv" />
                <Label htmlFor="exp-cv" className="cursor-pointer text-sm">
                  Current view with filters <span className="text-gray-400">({totalFiltered.toLocaleString()})</span>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="all_matching" id="exp-am" />
                <Label htmlFor="exp-am" className="cursor-pointer text-sm">
                  All matching players
                </Label>
              </div>
              {selectedCount > 0 && (
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="selected" id="exp-sel" />
                  <Label htmlFor="exp-sel" className="cursor-pointer text-sm">
                    Selected only <span className="text-gray-400">({selectedCount})</span>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Fields */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label>Fields to Export <span className="text-red-500">*</span></Label>
              <button
                type="button"
                className="text-[11px] text-[#003B95] hover:underline"
                onClick={() =>
                  setSelectedFields((prev) =>
                    prev.length === EXPORT_FIELDS.length ? [] : EXPORT_FIELDS.map((f) => f.value)
                  )
                }
              >
                {selectedFields.length === EXPORT_FIELDS.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_FIELDS.map((f) => (
                <div key={f.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`exp-f-${f.value}`}
                    checked={selectedFields.includes(f.value)}
                    onCheckedChange={() => toggleField(f.value)}
                  />
                  <Label htmlFor={`exp-f-${f.value}`} className="text-xs cursor-pointer">{f.label}</Label>
                </div>
              ))}
            </div>
            {errors.fields && <p className="text-xs text-red-500">{errors.fields}</p>}
          </div>

          {/* Date range (created) */}
          <div className="space-y-2">
            <Label>Created Date Range (optional)</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start gap-2 text-sm", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
              <span className="text-gray-300">→</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start gap-2 text-sm", !dateTo && "text-muted-foreground", errors.dateTo && "border-red-400")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            {errors.dateTo && <p className="text-xs text-red-500">{errors.dateTo}</p>}
          </div>

          {/* Format */}
          <div className="space-y-3">
            <Label>Format <span className="text-red-500">*</span></Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)} className="flex gap-4">
              {(["csv", "xlsx", "json"] as ExportFormat[]).map((f) => (
                <div key={f} className="flex items-center gap-1.5">
                  <RadioGroupItem value={f} id={`exp-fmt-${f}`} />
                  <Label htmlFor={`exp-fmt-${f}`} className="cursor-pointer text-sm uppercase">{f}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Include dependents */}
          <div className="flex items-center gap-2">
            <Checkbox id="exp-deps" checked={includeDeps} onCheckedChange={(c) => setIncludeDeps(!!c)} />
            <Label htmlFor="exp-deps" className="text-sm cursor-pointer">Include dependents data</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} className="bg-[#003B95] hover:bg-[#002a6b] gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
