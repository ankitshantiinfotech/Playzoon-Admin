import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Textarea } from "../../../ui/textarea";
import { Label } from "../../../ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../../../ui/dialog";
import type { ServiceProvider } from "../provider-data";

// ═══════════════════════════════════════════════════════════════
// Approve Confirmation Modal
// ═══════════════════════════════════════════════════════════════

interface ApproveModalProps {
  provider: ServiceProvider | null;
  open: boolean;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ApproveConfirmModal({
  provider,
  open,
  isProcessing,
  onConfirm,
  onCancel,
}: ApproveModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the Confirm button when modal opens
  useEffect(() => {
    if (open) {
      // Small delay to wait for animation
      const t = setTimeout(() => confirmRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isProcessing) onCancel();
      }}
    >
      <DialogContent
        className="sm:max-w-[440px]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isProcessing) {
            e.preventDefault();
            onConfirm();
          }
        }}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <DialogTitle className="text-center">Approve Provider</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to approve{" "}
            <span className="text-[#111827]">{provider?.name}</span>?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isProcessing ? "Approving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════
// Reject Modal with Rejection Reason
// ═══════════════════════════════════════════════════════════════

interface RejectModalProps {
  provider: ServiceProvider | null;
  open: boolean;
  isProcessing: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 1000;

function validateReason(value: string): { valid: boolean; error: string } {
  const trimmed = value.trim();
  if (value.length === 0) {
    return { valid: false, error: "" }; // No error shown for empty
  }
  // Whitespace-only / only special chars check
  if (trimmed.length === 0 || !/[a-zA-Z0-9\u0600-\u06FF]/.test(trimmed)) {
    return { valid: false, error: "Reason must contain meaningful text" };
  }
  if (trimmed.length < MIN_REASON_LENGTH) {
    return { valid: false, error: "Minimum 10 characters required" };
  }
  return { valid: true, error: "" };
}

export function RejectReasonModal({
  provider,
  open,
  isProcessing,
  onConfirm,
  onCancel,
}: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validation = validateReason(reason);
  const charCount = reason.trim().length;
  const showError = touched && !validation.valid && validation.error !== "";
  const isConfirmDisabled = !validation.valid || isProcessing;

  // Reset state when modal opens / closes
  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
      const t = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleConfirm = useCallback(() => {
    if (isConfirmDisabled) return;
    onConfirm(reason.trim());
  }, [isConfirmDisabled, reason, onConfirm]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isProcessing) onCancel();
      }}
    >
      <DialogContent
        className="sm:max-w-[480px]"
        onKeyDown={(e) => {
          // Enter + Ctrl/Cmd to submit from textarea
          if ((e.key === "Enter" && (e.ctrlKey || e.metaKey)) && !isConfirmDisabled) {
            e.preventDefault();
            handleConfirm();
          }
        }}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <DialogTitle className="text-center">Reject Provider</DialogTitle>
          <DialogDescription className="text-center">
            Rejecting{" "}
            <span className="text-[#111827]">{provider?.name}</span>.
            Please provide a reason below.
          </DialogDescription>
        </DialogHeader>

        {/* ── Rejection Reason Field ─────────────────────── */}
        <div className="space-y-2 mt-1">
          <Label htmlFor="rejection-reason" className="text-sm text-[#374151]">
            Rejection Reason <span className="text-red-500">*</span>
          </Label>
          <Textarea
            ref={textareaRef}
            id="rejection-reason"
            value={reason}
            onChange={(e) => {
              if (e.target.value.length <= MAX_REASON_LENGTH) {
                setReason(e.target.value);
              }
            }}
            onBlur={() => setTouched(true)}
            placeholder="Enter the reason for rejection (minimum 10 characters)"
            className={cn(
              "min-h-[100px]",
              showError && "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-200"
            )}
            aria-invalid={showError}
            aria-describedby="rejection-reason-helper"
            disabled={isProcessing}
          />

          {/* Helper row: error text + char counter */}
          <div className="flex items-start justify-between gap-2">
            <div id="rejection-reason-helper" className="flex-1 min-h-[18px]">
              {showError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {validation.error}
                </p>
              )}
            </div>
            <span
              className={cn(
                "text-xs shrink-0 tabular-nums",
                charCount < MIN_REASON_LENGTH ? "text-red-500" : "text-emerald-600"
              )}
            >
              {charCount} / {MAX_REASON_LENGTH}
            </span>
          </div>
        </div>

        <DialogFooter className="mt-1 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white gap-1.5 disabled:opacity-50"
          >
            {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isProcessing ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}