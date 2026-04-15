import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  EXPORT_FORMAT_OPTIONS,
  type ExportFormat,
} from "@/lib/exportDownload";

interface SimpleExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Called with selected format; should run export and throw on failure */
  onDownload: (format: ExportFormat) => void | Promise<void>;
}

export function SimpleExportModal({
  open,
  onOpenChange,
  title,
  description = "Choose a file format and download.",
  onDownload,
}: SimpleExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await onDownload(format);
      toast.success("Download started");
      onOpenChange(false);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Export failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label>Format</Label>
          <RadioGroup
            value={format}
            onValueChange={(v) => setFormat(v as ExportFormat)}
            className="grid grid-cols-2 gap-2"
          >
            {EXPORT_FORMAT_OPTIONS.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <RadioGroupItem value={opt.id} id={`fmt-${opt.id}`} />
                <Label htmlFor={`fmt-${opt.id}`} className="cursor-pointer text-sm font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#003B95] hover:bg-[#002a6b] gap-2"
            onClick={() => void handleDownload()}
            disabled={loading}
          >
            {loading ? (
              "Working…"
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
