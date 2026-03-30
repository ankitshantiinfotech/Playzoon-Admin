// ─── US-102 Refund Dialog ─────────────────────────────────────────────────────
// BR-001: Refunds to Original Payment Method take 3-7 business days.
// BR-002: Refunds to Player Wallet are credited immediately.
// BR-003: Total refunds cannot exceed original transaction amount.
// BR-004: All refunds are logged in audit trail.

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { PaymentTransaction, RefundDestination } from "./types";
import {
  Wallet, CreditCard, AlertCircle, Info, CheckCircle, Loader2, RotateCcw,
} from "lucide-react";
import { cn } from "../../ui/utils";

interface RefundDialogProps {
  open: boolean;
  transaction: PaymentTransaction;
  onClose: () => void;
  onConfirm: (data: { amount: number; destination: RefundDestination; reason: string }) => void;
}

export function RefundDialog({ open, transaction, onClose, onConfirm }: RefundDialogProps) {
  const maxRefundable = transaction.amount - transaction.totalRefunded;

  const [amount, setAmount]           = useState(maxRefundable.toString());
  const [destination, setDestination] = useState<RefundDestination>("Player Wallet");
  const [reason, setReason]           = useState("");
  const [errors, setErrors]           = useState<{ amount?: string; reason?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone]               = useState(false);

  const validate = () => {
    const errs: { amount?: string; reason?: string } = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = "Please enter a valid refund amount.";
    } else if (parsedAmount > maxRefundable) {
      // BR-003
      errs.amount = `Refund cannot exceed the original transaction amount of AED ${maxRefundable.toFixed(2)}.`;
    }
    if (reason.trim().length < 10) {
      errs.reason = "Reason must be at least 10 characters.";
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    setDone(true);
    await new Promise((r) => setTimeout(r, 800));
    onConfirm({ amount: parseFloat(amount), destination, reason: reason.trim() });
    handleClose();
  };

  const handleClose = () => {
    setAmount(maxRefundable.toString());
    setDestination("Player Wallet");
    setReason("");
    setErrors({});
    setIsSubmitting(false);
    setDone(false);
    onClose();
  };

  const isWallet = destination === "Player Wallet";
  const parsedAmt = parseFloat(amount) || 0;
  const isPartial = parsedAmt < maxRefundable && parsedAmt > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-100">
              <RotateCcw className="h-4 w-4 text-violet-600" />
            </div>
            Initiate Refund
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Transaction <span className="font-mono text-gray-700">{transaction.id}</span> — Original: <span className="text-gray-700">AED {transaction.amount.toFixed(2)}</span>
            {transaction.totalRefunded > 0 && (
              <span className="text-amber-600"> (AED {transaction.totalRefunded.toFixed(2)} already refunded)</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Refund amount */}
          <div>
            <label className="block text-xs text-gray-700 mb-1.5">
              Refund Amount (AED) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">AED</span>
              <input
                type="number"
                min="0.01"
                max={maxRefundable}
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: undefined })); }}
                className={cn(
                  "w-full pl-11 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2",
                  errors.amount
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-200 focus:ring-[#003B95]/20 focus:border-[#003B95]",
                )}
                placeholder={`Max: AED ${maxRefundable.toFixed(2)}`}
              />
            </div>
            {errors.amount && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                <AlertCircle className="h-3 w-3 shrink-0" /> {errors.amount}
              </p>
            )}
            {isPartial && !errors.amount && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <Info className="h-3 w-3" /> Partial refund — AED {(maxRefundable - parsedAmt).toFixed(2)} will remain non-refunded.
              </p>
            )}
            <div className="mt-1.5 flex gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmount(((maxRefundable * pct) / 100).toFixed(2))}
                  className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:border-[#003B95] hover:text-[#003B95] transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Refund destination */}
          <div>
            <label className="block text-xs text-gray-700 mb-1.5">
              Refund Destination <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["Player Wallet", "Original Payment Method"] as RefundDestination[]).map((dest) => {
                const active = destination === dest;
                const Icon = dest === "Player Wallet" ? Wallet : CreditCard;
                return (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setDestination(dest)}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-lg border-2 text-left transition-all",
                      active
                        ? "border-[#003B95] bg-blue-50/50"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", active ? "text-[#003B95]" : "text-gray-400")} />
                    <div>
                      <p className={cn("text-xs leading-none mb-1", active ? "text-[#003B95]" : "text-gray-600")}>
                        {dest}
                      </p>
                      <p className="text-[10px] text-gray-400 leading-tight">
                        {dest === "Player Wallet" ? "Immediate (BR-002)" : "3–7 business days (BR-001)"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BR notice */}
          <div className={cn(
            "flex items-start gap-2 rounded-lg p-3 text-xs border",
            isWallet
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-blue-50 border-blue-100 text-blue-700",
          )}>
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {isWallet
              ? "AED will be credited to the player's Playzoon wallet immediately upon confirmation."
              : "The payment gateway will initiate the refund. It may take 3–7 business days to appear on the player's card statement."}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs text-gray-700 mb-1.5">
              Reason for Refund <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: undefined })); }}
              rows={3}
              placeholder="Describe the reason for this refund (min. 10 characters)..."
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2",
                errors.reason
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-200 focus:ring-[#003B95]/20 focus:border-[#003B95]",
              )}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.reason
                ? <p className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" />{errors.reason}</p>
                : <span />
              }
              <span className={cn("text-[10px]", reason.length < 10 ? "text-gray-400" : "text-emerald-600")}>
                {reason.length}/10+
              </span>
            </div>
          </div>

          {/* BR-004 notice */}
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Info className="h-3 w-3" /> BR-004: This refund will be recorded in the platform audit trail.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || done}
            className="bg-violet-600 hover:bg-violet-700 text-white min-w-[140px] gap-1.5"
          >
            {isSubmitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…</>
              : done
              ? <><CheckCircle className="h-3.5 w-3.5" /> Refund Initiated</>
              : "Confirm Refund"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
