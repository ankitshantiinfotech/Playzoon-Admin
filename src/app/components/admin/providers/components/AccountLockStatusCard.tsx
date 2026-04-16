// ─── US-5.1.1 — Account Lock Status Display & Unlock Controls ──
// Reusable component for all provider detail views.
// Shows lock/unlock badge, lock detail info (when locked),
// unlock button with confirmation modal, and success toast.

import { useState } from "react";
import { format } from "date-fns";
import {
  Lock, Unlock, Clock, User, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../../ui/alert-dialog";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface AccountLockInfo {
  accountStatus: "Locked" | "Unlocked";
  lockedAt?: Date;
  lockedBy?: string;
}

interface AccountLockStatusCardProps {
  /** Provider display name (shown in confirmation modal) */
  providerName: string;
  /** Current lock info */
  lockInfo: AccountLockInfo;
  /** Called after unlock is confirmed — parent should update state (may be async / API) */
  onUnlock: () => void | Promise<void>;
  /** Optional: show as a compact inline badge (for list views) */
  compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Compact badge (for list view reuse)
// ═══════════════════════════════════════════════════════════════

export function AccountStatusBadge({
  status,
  className,
}: {
  status: "Locked" | "Unlocked";
  className?: string;
}) {
  if (status === "Locked") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-red-100 text-red-800 border-red-200 text-[11px] gap-1",
          className,
        )}
      >
        <Lock className="h-2.5 w-2.5" /> Locked
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1",
        className,
      )}
    >
      <Unlock className="h-2.5 w-2.5" /> Unlocked
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════
// Full card (for detail views)
// ═══════════════════════════════════════════════════════════════

export function AccountLockStatusCard({
  providerName,
  lockInfo,
  onUnlock,
  compact = false,
}: AccountLockStatusCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const isLocked = lockInfo.accountStatus === "Locked";

  // ── Handle unlock with optimistic UI ──────────────────
  const handleConfirmUnlock = async () => {
    setIsUnlocking(true);
    try {
      await Promise.resolve(onUnlock());
      setShowConfirm(false);
    } catch {
      toast.error("Could not unlock account. Please try again.");
    } finally {
      setIsUnlocking(false);
    }
  };

  // ── Compact mode (just the badge) ─────────────────────
  if (compact) {
    return <AccountStatusBadge status={lockInfo.accountStatus} />;
  }

  // ── Full detail card ──────────────────────────────────
  return (
    <>
      <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">
          Account Status
        </p>

        {/* ── Badge row ──────────────────────────────── */}
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Badge
              variant="outline"
              className="text-xs bg-red-50 text-red-600 border-red-200 gap-1.5"
            >
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5"
            >
              <Unlock className="h-3 w-3" />
              Unlocked
            </Badge>
          )}
        </div>

        {/* ── Lock detail info (only when Locked) ────── */}
        {isLocked && (
          <div className="mt-3 space-y-1.5">
            {lockInfo.lockedAt && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                Locked on {format(lockInfo.lockedAt, "dd/MM/yyyy HH:mm")}
              </p>
            )}
            {lockInfo.lockedBy && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <User className="h-3 w-3 text-gray-400 shrink-0" />
                By {lockInfo.lockedBy}
              </p>
            )}

            {/* ── Unlock button ──────────────────────── */}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
              onClick={() => setShowConfirm(true)}
            >
              <Unlock className="h-3 w-3" />
              Unlock Account
            </Button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          Unlock Confirmation Modal
          ═══════════════════════════════════════════════════ */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100">
                <Unlock className="h-4 w-4 text-emerald-600" />
              </div>
              Unlock Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B7280]">
              Unlock the account for <span className="text-[#111827]">{providerName}</span>?
              {lockInfo.lockedAt && (
                <span className="block mt-2 text-xs text-gray-400">
                  This account was locked on {format(lockInfo.lockedAt, "dd/MM/yyyy 'at' HH:mm")}
                  {lockInfo.lockedBy ? ` by ${lockInfo.lockedBy}` : ""}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // prevent auto-close; we manage it
                handleConfirmUnlock();
              }}
              disabled={isUnlocking}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5" />
                  Unlock
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}