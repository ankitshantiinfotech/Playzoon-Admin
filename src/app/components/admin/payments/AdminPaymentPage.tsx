// ─── US-102 Payment Management Page ──────────────────────────────────────────
// BR-001: Card refunds take 3–7 business days.
// BR-002: Wallet refunds are immediate.
// BR-003: Total refunds cannot exceed original amount.
// BR-004: All refund operations logged in audit trail.
// BR-005: Mark as Resolved — no financial action.

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CreditCard, Info } from "lucide-react";
import { PaymentTransaction, RefundDestination } from "./types";
import { generateMockPayments } from "./mockData";
import { PaymentStats } from "./PaymentStats";
import { PaymentTable } from "./PaymentTable";
import { PaymentDetails } from "./PaymentDetails";
import { RefundDialog } from "./RefundDialog";
import { MarkResolvedDialog } from "./MarkResolvedDialog";

export function AdminPaymentPage() {
  // ── Data state ────────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(
    () => generateMockPayments(),
  );

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedTxn,    setSelectedTxn]    = useState<PaymentTransaction | null>(null);
  const [refundOpen,     setRefundOpen]     = useState(false);
  const [resolveOpen,    setResolveOpen]    = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateTxn = useCallback((id: string, updater: (t: PaymentTransaction) => PaymentTransaction) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? updater(t) : t));
    setSelectedTxn((prev) => prev?.id === id ? updater(prev) : prev);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleRefund = useCallback((data: { amount: number; destination: RefundDestination; reason: string }) => {
    if (!selectedTxn) return;
    const isWallet  = data.destination === "Player Wallet";
    const newStatus = isWallet ? "Refunded" : "Refund Initiated";
    const newRecord = {
      id: `REF-${Date.now()}`,
      amount: data.amount,
      destination: data.destination,
      reason: data.reason,
      processedBy: "Admin Mohammed Al-Sayed",
      processedAt: new Date().toISOString(),
      status: (isWallet ? "Completed" : "Initiated") as "Completed" | "Initiated" | "Failed",
    };

    updateTxn(selectedTxn.id, (t) => ({
      ...t,
      status: newStatus,
      refundHistory: [...t.refundHistory, newRecord],
      totalRefunded: t.totalRefunded + data.amount,
      // BR-004: note added automatically
      adminNotes: [
        ...t.adminNotes,
        {
          id: `NOTE-${Date.now()}`,
          note: `Refund of AED ${data.amount.toFixed(2)} to ${data.destination} initiated. Reason: ${data.reason}`,
          addedBy: "System (Audit — BR-004)",
          addedAt: new Date().toISOString(),
        },
      ],
    }));

    // BR-002 immediate / BR-001 delayed toast
    if (isWallet) {
      toast.success(`AED ${data.amount.toFixed(2)} credited to player wallet immediately`, {
        description: `${selectedTxn.id} · BR-002: Wallet refunds are instant`,
        duration: 5000,
      });
    } else {
      toast.info(`Refund of AED ${data.amount.toFixed(2)} initiated with payment gateway`, {
        description: "BR-001: Will appear on card within 3–7 business days",
        duration: 6000,
      });
    }
    setRefundOpen(false);
  }, [selectedTxn, updateTxn]);

  const handleMarkResolved = useCallback((reason: string) => {
    if (!selectedTxn) return;
    // BR-005: no financial action
    updateTxn(selectedTxn.id, (t) => ({
      ...t,
      status: "Resolved",
      resolution: {
        reason,
        resolvedBy: "Admin Mohammed Al-Sayed",
        resolvedAt: new Date().toISOString(),
      },
      adminNotes: [
        ...t.adminNotes,
        {
          id: `NOTE-${Date.now()}`,
          note: `Transaction marked as resolved (no financial action — BR-005). Reason: ${reason}`,
          addedBy: "System (Audit — BR-005)",
          addedAt: new Date().toISOString(),
        },
      ],
    }));
    toast.success("Transaction marked as resolved", {
      description: "BR-005: No financial action taken — recorded for audit trail",
      duration: 5000,
    });
    setResolveOpen(false);
  }, [selectedTxn, updateTxn]);

  const handleAddNote = useCallback((note: string) => {
    if (!selectedTxn) return;
    updateTxn(selectedTxn.id, (t) => ({
      ...t,
      adminNotes: [
        ...t.adminNotes,
        {
          id: `NOTE-${Date.now()}`,
          note,
          addedBy: "Admin Mohammed Al-Sayed",
          addedAt: new Date().toISOString(),
        },
      ],
    }));
    toast.success("Note added to transaction");
  }, [selectedTxn, updateTxn]);

  return (
    <div className="flex flex-col h-full gap-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl text-gray-900 flex items-center gap-2.5">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#003B95]/10">
              <CreditCard className="h-5 w-5 text-[#003B95]" />
            </div>
            Payment Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View all platform transactions, process refunds, and resolve payment disputes. BR-003: read-only except refund and resolution actions.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>Last sync: {format(new Date(), "MMM d, h:mm a")}</span>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <PaymentStats transactions={transactions} />

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <PaymentTable transactions={transactions} onViewDetails={setSelectedTxn} />
      </div>

      {/* ── Detail side panel ─────────────────────────────────────────────── */}
      {selectedTxn && (
        <PaymentDetails
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onInitiateRefund={() => setRefundOpen(true)}
          onMarkResolved={() => setResolveOpen(true)}
          onAddNote={handleAddNote}
        />
      )}

      {/* ── Refund dialog ──────────────────────────────────────────────────── */}
      {selectedTxn && (
        <RefundDialog
          open={refundOpen}
          transaction={selectedTxn}
          onClose={() => setRefundOpen(false)}
          onConfirm={handleRefund}
        />
      )}

      {/* ── Mark as Resolved dialog ────────────────────────────────────────── */}
      {selectedTxn && (
        <MarkResolvedDialog
          open={resolveOpen}
          transaction={selectedTxn}
          onClose={() => setResolveOpen(false)}
          onConfirm={handleMarkResolved}
        />
      )}
    </div>
  );
}
