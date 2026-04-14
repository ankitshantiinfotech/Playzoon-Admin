import React, { useState, useCallback, useMemo, useEffect } from "react";
import { CreditCard, Loader2, Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "../../../../services/admin.service";
import {
  formatCardNumberInput,
  getCvvMaxLength,
  inferBrandFromPan,
} from "../../../../lib/payment-card";
import {
  computePaymentCardErrors,
  brandLabelToProvider,
  type CardFormState,
  type PaymentMethodForValidation,
} from "../../../../lib/payment-card-errors";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import type { SavedCard } from "./player-detail-data";

interface SavedCardsTabProps {
  playerId: string;
  cards: SavedCard[];
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

function cardsToValidationMethods(list: SavedCard[]): PaymentMethodForValidation[] {
  return list.map((c) => ({
    id: c.id,
    last4: c.last4,
    provider: brandLabelToProvider(c.brand),
    paymentType: "card",
  }));
}

export function SavedCardsTab({
  playerId,
  cards,
  onRefresh,
  isLoading: parentLoading,
}: SavedCardsTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [defaultingId, setDefaultingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SavedCard | null>(null);

  const [cardForm, setCardForm] = useState<CardFormState>({
    cardNumber: "",
    cardholderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const [cardFormErrors, setCardFormErrors] = useState<Record<string, string>>({});

  const validationMethods = useMemo(() => cardsToValidationMethods(cards), [cards]);

  const expiryYearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 16 }, (_, i) => y + i);
  }, []);

  const expiryMonthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const v = String(m).padStart(2, "0");
        return { value: v, label: v };
      }),
    [],
  );

  const validateCardForm = useCallback(() => {
    const errors = computePaymentCardErrors(cardForm, validationMethods);
    setCardFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [cardForm, validationMethods]);

  useEffect(() => {
    if (!showAdd) return;
    setCardFormErrors((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const full = computePaymentCardErrors(cardForm, validationMethods);
      const next: Record<string, string> = {};
      for (const k of Object.keys(prev)) {
        if (full[k]) next[k] = full[k];
      }
      const sameLen = Object.keys(prev).length === Object.keys(next).length;
      const same =
        sameLen && Object.keys(prev).every((k) => prev[k] === next[k]);
      if (same) return prev;
      return next;
    });
  }, [cardForm, validationMethods, showAdd]);

  const handleAddCard = async () => {
    if (!validateCardForm()) return;
    setAdding(true);
    try {
      const expiryMonth = parseInt(cardForm.expiryMonth, 10);
      const expiryYear = parseInt(cardForm.expiryYear, 10);
      await adminService.addPlayerPaymentMethod(playerId, {
        card_number: cardForm.cardNumber.replace(/\s+/g, ""),
        cardholder_name: cardForm.cardholderName.trim(),
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        cvv: cardForm.cvv.replace(/\D/g, ""),
      });
      toast.success("Payment method added.");
      setShowAdd(false);
      setCardForm({
        cardNumber: "",
        cardholderName: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
      });
      setCardFormErrors({});
      await onRefresh();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add card.";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleSetDefault = async (paymentId: string) => {
    setDefaultingId(paymentId);
    try {
      await adminService.setPlayerDefaultPaymentMethod(playerId, paymentId);
      toast.success("Default payment method updated.");
      await onRefresh();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update default.";
      toast.error(msg);
    } finally {
      setDefaultingId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemovingId(removeTarget.id);
    try {
      await adminService.removePlayerPaymentMethod(playerId, removeTarget.id);
      toast.success("Payment method removed.");
      setRemoveTarget(null);
      await onRefresh();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to remove card.";
      toast.error(msg);
    } finally {
      setRemovingId(null);
    }
  };

  function getRemoveTooltip(card: SavedCard): string {
    if (!card.isDefault) return "";
    if (cards.length === 1) {
      return "You cannot remove the default payment method. Please add another method and set it as default first.";
    }
    return "You cannot remove the default payment method. Please set another method as default first.";
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-[#111827] font-semibold text-base">Saved Cards</h2>
          {cards.length > 0 && (
            <Button
              size="sm"
              onClick={() => setShowAdd(true)}
              disabled={parentLoading}
              className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add Card
            </Button>
          )}
        </div>

        {parentLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : cards.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="px-4 w-[72px]">S.No</TableHead>
                  <TableHead className="px-4">Card Brand</TableHead>
                  <TableHead className="px-4">Last 4 Digits</TableHead>
                  <TableHead className="px-4">Expiry</TableHead>
                  <TableHead className="px-4">Default</TableHead>
                  <TableHead className="px-4 w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card, index) => (
                  <TableRow key={card.id}>
                    <TableCell className="px-4 text-xs text-[#6B7280] font-mono">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#6B7280]" />
                        <span className="text-sm text-[#111827] font-medium">
                          {card.brand}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm">
                      •••• {card.last4}
                    </TableCell>
                    <TableCell className="px-4 text-sm">{card.expiry}</TableCell>
                    <TableCell className="px-4">
                      {card.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                          Default
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={defaultingId === card.id}
                          onClick={() => handleSetDefault(card.id)}
                        >
                          {defaultingId === card.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Star className="h-3 w-3 mr-1" /> Set default
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600"
                              disabled={removingId === card.id || card.isDefault}
                              onClick={() => {
                                if (card.isDefault) return;
                                setRemoveTarget(card);
                              }}
                              aria-label="Remove card"
                            >
                              {removingId === card.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {card.isDefault && (
                          <TooltipContent>{getRemoveTooltip(card)}</TooltipContent>
                        )}
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-16 px-6 space-y-4">
            <CreditCard className="h-10 w-10 text-gray-200 mx-auto" />
            <p className="text-sm text-[#374151]">No saved cards.</p>
            <Button
              size="sm"
              onClick={() => setShowAdd(true)}
              className="bg-[#003B95] hover:bg-[#002a6b] gap-2"
            >
              <Plus className="h-4 w-4" /> Add Card
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          setShowAdd(open);
          if (!open) {
            setCardForm({
              cardNumber: "",
              cardholderName: "",
              expiryMonth: "",
              expiryYear: "",
              cvv: "",
            });
            setCardFormErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method for this player (same validation as the player app).
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              void handleAddCard();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-cardNumber">Card Number</Label>
              <Input
                id="admin-cardNumber"
                name="admin-card-number"
                autoComplete="off"
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                value={cardForm.cardNumber}
                onChange={(e) => {
                  const formatted = formatCardNumberInput(e.target.value);
                  setCardForm((prev) => ({ ...prev, cardNumber: formatted }));
                }}
                className={cn(
                  "font-mono tracking-tight",
                  cardFormErrors.cardNumber ? "border-red-500" : "",
                )}
              />
              {cardFormErrors.cardNumber && (
                <p className="text-sm text-red-500">{cardFormErrors.cardNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-cardholderName">Cardholder Name</Label>
              <Input
                id="admin-cardholderName"
                name="admin-cardholder-name"
                autoComplete="off"
                placeholder="John Doe"
                value={cardForm.cardholderName}
                onChange={(e) =>
                  setCardForm((prev) => ({
                    ...prev,
                    cardholderName: e.target.value,
                  }))
                }
                className={cn(cardFormErrors.cardholderName ? "border-red-500" : "")}
              />
              {cardFormErrors.cardholderName && (
                <p className="text-sm text-red-500">{cardFormErrors.cardholderName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={cardForm.expiryMonth || undefined}
                  onValueChange={(v) =>
                    setCardForm((prev) => ({ ...prev, expiryMonth: v }))
                  }
                >
                  <SelectTrigger
                    className={cn(cardFormErrors.expiry ? "border-red-500" : "")}
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {expiryMonthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={cardForm.expiryYear || undefined}
                  onValueChange={(v) =>
                    setCardForm((prev) => ({ ...prev, expiryYear: v }))
                  }
                >
                  <SelectTrigger
                    className={cn(cardFormErrors.expiry ? "border-red-500" : "")}
                  >
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {expiryYearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {cardFormErrors.expiry && (
                <p className="text-sm text-red-500">{cardFormErrors.expiry}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-cvv">CVV</Label>
              <Input
                id="admin-cvv"
                name="admin-card-cvv"
                autoComplete="off"
                inputMode="numeric"
                placeholder={
                  getCvvMaxLength(
                    inferBrandFromPan(cardForm.cardNumber.replace(/\D/g, "")),
                  ) === 4
                    ? "1234"
                    : "123"
                }
                value={cardForm.cvv}
                maxLength={getCvvMaxLength(
                  inferBrandFromPan(cardForm.cardNumber.replace(/\D/g, "")),
                )}
                onChange={(e) => {
                  const max = getCvvMaxLength(
                    inferBrandFromPan(cardForm.cardNumber.replace(/\D/g, "")),
                  );
                  const only = e.target.value.replace(/\D/g, "").slice(0, max);
                  setCardForm((prev) => ({ ...prev, cvv: only }));
                }}
                className={cn("font-mono", cardFormErrors.cvv ? "border-red-500" : "")}
              />
              {cardFormErrors.cvv && (
                <p className="text-sm text-red-500">{cardFormErrors.cvv}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={adding}
                className="bg-[#003B95] hover:bg-[#002a6b]"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Adding…
                  </>
                ) : (
                  "Add Card"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the saved card from this player&apos;s account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void confirmRemove()}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
