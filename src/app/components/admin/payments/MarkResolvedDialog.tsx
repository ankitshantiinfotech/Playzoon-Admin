// ─── US-102 Mark as Resolved Dialog ──────────────────────────────────────────
// BR-005: "Mark as Resolved" records resolution without any financial action.

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { PaymentTransaction } from "./types";
import { AlertCircle, CheckCircle2, Info, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "../../ui/utils";

interface MarkResolvedDialogProps {
  open: boolean;
  transaction: PaymentTransaction;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function MarkResolvedDialog({ open, transaction, onClose, onConfirm }: MarkResolvedDialogProps) {
  const [reason, setReason]             = useState("");
  const [error, setError]               = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone]                 = useState(false);

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      setError("Resolution reason must be at least 10 characters.");
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    setDone(true);
    await new Promise((r) => setTimeout(r, 700));
    onConfirm(reason.trim());
    handleClose();
  };

  const handleClose = () => {
    setReason("");
    setError(undefined);
    setIsSubmitting(false);
    setDone(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            Mark as Resolved
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Transaction <span className="font-mono text-gray-700">{transaction.id}</span> — AED {transaction.amount.toFixed(2)} — Failed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* BR-005 info */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 mb-0.5">BR-005 — No financial action</p>
              <p>This operation marks the transaction as resolved for record-keeping only. No money will be moved. Use this when the issue was resolved externally (e.g., via bank transfer or alternative means).</p>
            </div>
          </div>

          {/* Transaction summary */}
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 text-xs">
            <div className="text-gray-400">Transaction ID</div>
            <div className="font-mono text-gray-700 text-right">{transaction.id}</div>
            <div className="text-gray-400">Gateway Ref</div>
            <div className="font-mono text-gray-700 text-right">{transaction.gatewayReference}</div>
            <div className="text-gray-400">Player</div>
            <div className="text-gray-700 text-right">{transaction.player.name}</div>
            <div className="text-gray-400">Amount</div>
            <div className="text-red-500 text-right tabular-nums">AED {transaction.amount.toFixed(2)}</div>
            <div className="text-gray-400">Failure Code</div>
            <div className="text-gray-700 text-right text-[10px]">{transaction.gatewayResponseCode}</div>
          </div>

          {/* Resolution reason */}
          <div>
            <label className="block text-xs text-gray-700 mb-1.5">
              Resolution Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(undefined); }}
              rows={4}
              placeholder="Describe how this transaction was resolved externally (min. 10 characters)..."
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2",
                error
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-200 focus:ring-[#003B95]/20 focus:border-[#003B95]",
              )}
            />
            <div className="flex items-center justify-between mt-1">
              {error
                ? <p className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" />{error}</p>
                : <span />
              }
              <span className={cn("text-[10px]", reason.length < 10 ? "text-gray-400" : "text-emerald-600")}>
                {reason.length}/10+
              </span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Info className="h-3 w-3" /> This action will be recorded in the platform audit trail.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || done}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] gap-1.5"
          >
            {isSubmitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
              : done
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Resolved</>
              : "Mark as Resolved"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
