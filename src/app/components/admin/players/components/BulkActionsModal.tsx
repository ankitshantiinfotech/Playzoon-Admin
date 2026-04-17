import { useState } from "react";
import { toast } from "sonner";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Textarea } from "../../../ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { Calendar } from "../../../ui/calendar";
import { CalendarIcon, AlertTriangle, Trash2 } from "lucide-react";
import { format, isBefore, startOfToday } from "date-fns";
import type { PlayerStatus } from "../player-data";

// ─── Types ───────────────────────────────────────────────────

type ActionType = "change_status" | "send_notification" | "delete";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  preselectedAction?: ActionType;
  onConfirm: (result: BulkActionResult) => void;
}

export interface BulkActionResult {
  type: ActionType;
  // Change status fields
  newStatus?: PlayerStatus;
  reason?: string;
  lockUntil?: Date;
  notifyPlayer?: boolean;
  // Send notification fields
  subject?: string;
  body?: string;
  includeDependents?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export function BulkActionsModal({ open, onOpenChange, selectedCount, preselectedAction, onConfirm }: Props) {
  const [actionType, setActionType] = useState<ActionType>(preselectedAction || "change_status");
  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus | "">("");
  const [reason, setReason] = useState("");
  const [lockUntil, setLockUntil] = useState<Date | undefined>(undefined);
  const [notifyPlayer, setNotifyPlayer] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [includeDependents, setIncludeDependents] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setSelectedStatus("");
    setReason("");
    setLockUntil(undefined);
    setNotifyPlayer(true);
    setSubject("");
    setBody("");
    setIncludeDependents(false);
    setDeleteConfirm("");
    setErrors({});
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (actionType === "change_status") {
      if (!selectedStatus) e.selectedStatus = "Please select a status.";
      if (selectedStatus === "Inactive" && !reason.trim()) {
        e.reason = "Reason is required for Inactive status.";
      }
      if (reason.length > 500) e.reason = "Reason must be 500 characters or less.";
    }

    if (actionType === "send_notification") {
      if (!subject.trim()) e.subject = "Subject is required.";
      if (subject.length > 120) e.subject = "Subject must be 120 characters or less.";
      if (!body.trim()) e.body = "Message body is required.";
      if (body.length > 2000) e.body = "Message must be 2000 characters or less.";
    }

    if (actionType === "delete") {
      if (deleteConfirm !== "DELETE") e.deleteConfirm = `Type DELETE to confirm.`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const result: BulkActionResult = { type: actionType };

    if (actionType === "change_status") {
      result.newStatus = selectedStatus as PlayerStatus;
      result.reason = reason;
      result.lockUntil = lockUntil;
      result.notifyPlayer = notifyPlayer;
    } else if (actionType === "send_notification") {
      result.subject = subject;
      result.body = body;
      result.includeDependents = includeDependents;
    }

    onConfirm(result);
    resetForm();
    onOpenChange(false);
  };

  const needsReason = selectedStatus === "Inactive";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Action — {selectedCount} Player{selectedCount !== 1 && "s"}</DialogTitle>
          <DialogDescription>
            Change the status of the selected players.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* ── Change Status Fields ─────────────────────── */}
          {actionType === "change_status" && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="bulk-status">New Status <span className="text-red-500">*</span></Label>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as PlayerStatus)}>
                  <SelectTrigger id="bulk-status" className={cn(errors.selectedStatus && "border-red-400")}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Unlocked">Unlocked</SelectItem>
                  </SelectContent>
                </Select>
                {errors.selectedStatus && <p className="text-xs text-red-500">{errors.selectedStatus}</p>}
              </div>

              {needsReason && (
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-reason">
                    Reason <span className="text-red-500">*</span>
                    <span className="text-[11px] text-gray-400 ml-2">{reason.length}/500</span>
                  </Label>
                  <Textarea
                    id="bulk-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a reason for this status change…"
                    rows={3}
                    className={cn(errors.reason && "border-red-400")}
                  />
                  {errors.reason && <p className="text-xs text-red-500">{errors.reason}</p>}
                </div>
              )}

              {selectedCount > 50 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">You are about to update {selectedCount} accounts. This action will be queued and processed in the background.</p>
                </div>
              )}
            </div>
          )}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#003B95] hover:bg-[#002a6b]"
          >
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}