// ─── US-5.5.2 — Bulk Action Bar ──────────────────────────────
// Shows selection counter, bulk action dropdown, and confirmation
// modals with progress bar for large batches.

import { useState, useCallback, useMemo } from "react";
import {
  ChevronDown, CheckCircle2, Ban, Lock, Unlock,
  ToggleLeft, ToggleRight, Loader2, AlertTriangle,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Progress } from "../../../ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import { Textarea } from "../../../ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "../../../ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../../ui/alert-dialog";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type BulkActionType =
  | "approve"
  | "reject"
  | "lock"
  | "unlock"
  | "activate"
  | "deactivate";

interface ProviderLike {
  id: string;
  name: string;
  verificationStatus: "Pending" | "Approved" | "Rejected";
  accountStatus: "Locked" | "Unlocked";
  platformStatus: "Active" | "Inactive";
}

export interface BulkActionResult {
  processed: number;
  skipped: number;
  total: number;
  skipReason?: string;
}

// ═══════════════════════════════════════════════════════════════
// Action config
// ═══════════════════════════════════════════════════════════════

interface ActionConfig {
  key: BulkActionType;
  label: string;
  icon: React.ElementType;
  color: string;
  confirmTitle: string;
  confirmVerb: string;
  isDanger: boolean;
  /** Which items should be skipped? Return skip reason or null */
  skipCheck: (p: ProviderLike) => string | null;
}

const BULK_ACTIONS: ActionConfig[] = [
  {
    key: "approve", label: "Approve", icon: CheckCircle2,
    color: "text-emerald-600", confirmTitle: "Approve",
    confirmVerb: "approve", isDanger: false,
    skipCheck: (p) => p.verificationStatus !== "Pending" ? `already ${p.verificationStatus.toLowerCase()}` : null,
  },
  {
    key: "reject", label: "Reject Verification", icon: Ban,
    color: "text-red-500", confirmTitle: "Reject",
    confirmVerb: "reject verification for", isDanger: true,
    skipCheck: (p) => p.verificationStatus !== "Pending" ? `already ${p.verificationStatus.toLowerCase()}` : null,
  },
  {
    key: "lock", label: "Lock", icon: Lock,
    color: "text-red-500", confirmTitle: "Lock",
    confirmVerb: "lock", isDanger: true,
    skipCheck: (p) => p.accountStatus === "Locked" ? "already locked" : null,
  },
  {
    key: "unlock", label: "Unlock", icon: Unlock,
    color: "text-emerald-600", confirmTitle: "Unlock",
    confirmVerb: "unlock", isDanger: false,
    skipCheck: (p) => p.accountStatus === "Unlocked" ? "already unlocked" : null,
  },
  {
    key: "activate", label: "Activate", icon: ToggleRight,
    color: "text-emerald-600", confirmTitle: "Activate",
    confirmVerb: "activate", isDanger: false,
    skipCheck: (p) => p.platformStatus === "Active" ? "already active" : null,
  },
  {
    key: "deactivate", label: "Deactivate", icon: ToggleLeft,
    color: "text-gray-500", confirmTitle: "Deactivate",
    confirmVerb: "deactivate", isDanger: true,
    skipCheck: (p) => p.platformStatus === "Inactive" ? "already inactive" : null,
  },
];

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════

interface BulkActionBarProps {
  selectedIds: Set<string>;
  /** All items currently in the data set (for skip checks) */
  allItems: ProviderLike[];
  /** Called to apply the bulk action — parent does the actual state mutation */
  onBulkAction: (
    action: BulkActionType,
    ids: string[],
    rejectionReason?: string,
    onProgress?: (processed: number, total: number) => void,
  ) => Promise<BulkActionResult>;
  /** Called after bulk action completes to clear selection */
  onClearSelection: () => void;
  /** Is bulk processing in progress? */
  disabled?: boolean;
  /** Hide specific actions (e.g. lock on Training Provider list — system locks via OTP) */
  excludedBulkActions?: BulkActionType[];
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export function BulkActionBar({
  selectedIds,
  allItems,
  onBulkAction,
  onClearSelection,
  disabled = false,
  excludedBulkActions = [],
}: BulkActionBarProps) {
  const count = selectedIds.size;

  const visibleActions = useMemo(() => {
    const ex = new Set(excludedBulkActions);
    return BULK_ACTIONS.filter((a) => !ex.has(a.key));
  }, [excludedBulkActions]);

  // ── Modal state ───────────────────────────────────
  const [pendingAction, setPendingAction] = useState<ActionConfig | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // ── Processing state ──────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  // ── Skip preview ──────────────────────────────────
  const getSkipPreview = useCallback((action: ActionConfig): { processable: string[]; skipped: number; skipReason: string } => {
    const selectedItems = allItems.filter(item => selectedIds.has(item.id));
    let skipped = 0;
    let skipReason = "";
    const processable: string[] = [];

    selectedItems.forEach(item => {
      const reason = action.skipCheck(item);
      if (reason) {
        skipped++;
        skipReason = reason;
      } else {
        processable.push(item.id);
      }
    });

    return { processable, skipped, skipReason };
  }, [allItems, selectedIds]);

  // ── Handle action selection ───────────────────────
  const handleActionSelect = (action: ActionConfig) => {
    setPendingAction(action);
    if (action.key === "reject") {
      setRejectReason("");
      setShowRejectModal(true);
    } else {
      setShowConfirm(true);
    }
  };

  // ── Execute bulk action ───────────────────────────
  const executeBulkAction = useCallback(async (reason?: string) => {
    if (!pendingAction) return;

    const ids = Array.from(selectedIds);
    const isLarge = ids.length > 50;

    setIsProcessing(true);
    if (isLarge) {
      setShowProgress(true);
      setProgressValue(0);
      setProgressTotal(ids.length);
    }

    setShowConfirm(false);
    setShowRejectModal(false);

    try {
      const result = await onBulkAction(
        pendingAction.key,
        ids,
        reason,
        isLarge ? (processed, total) => {
          setProgressValue(processed);
          setProgressTotal(total);
        } : undefined,
      );

      // Show result toast
      if (result.skipped === 0) {
        toast.success(
          `${result.processed} of ${result.total} provider${result.total !== 1 ? "s" : ""} ${pendingAction.confirmVerb}${pendingAction.confirmVerb.endsWith("e") ? "d" : "ed"}.`,
          { duration: 5000 },
        );
      } else {
        toast.warning(
          `${result.processed} of ${result.total} ${pendingAction.confirmVerb}${pendingAction.confirmVerb.endsWith("e") ? "d" : "ed"}. ${result.skipped} skipped (${result.skipReason || "already processed"}).`,
          { duration: 7000 },
        );
      }

      onClearSelection();
    } catch {
      toast.error("Bulk action failed. Please try again.", { duration: 5000 });
    } finally {
      setIsProcessing(false);
      setShowProgress(false);
      setPendingAction(null);
    }
  }, [pendingAction, selectedIds, onBulkAction, onClearSelection]);

  // ── Reject reason validation ──────────────────────
  const reasonValid = rejectReason.trim().length >= 10 && rejectReason.trim().length <= 1000;

  if (count === 0 && !isProcessing) return null;

  const preview = pendingAction ? getSkipPreview(pendingAction) : null;

  return (
    <>
      {/* ── Bulk Action Bar ──────────────────────────── */}
      <div className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-2.5 border-b transition-colors",
        isProcessing ? "bg-blue-50/50" : "bg-blue-50/30",
      )}>
        {/* Progress bar overlay for large batches */}
        {showProgress && (
          <div className="w-full space-y-1.5">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-[#003B95] animate-spin shrink-0" />
              <span className="text-xs text-[#003B95]">
                Processing… {progressValue} of {progressTotal} complete
              </span>
            </div>
            <Progress
              value={progressTotal > 0 ? (progressValue / progressTotal) * 100 : 0}
              className="h-2"
            />
          </div>
        )}

        {/* Normal bar content */}
        {!showProgress && (
          <>
            <div className="flex items-center gap-2 flex-1">
              <Badge
                variant="outline"
                className="bg-[#003B95]/10 text-[#003B95] border-[#003B95]/20 text-xs px-2.5 py-0.5"
              >
                {count}
              </Badge>
              <span className="text-xs text-[#374151]">
                provider{count !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
              >
                Clear
              </button>
            </div>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs shrink-0"
                      disabled={count === 0 || disabled}
                    >
                      Bulk Actions
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {count === 0 && (
                  <TooltipContent>Select providers first.</TooltipContent>
                )}
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                {visibleActions.map((action, i) => {
                  const Icon = action.icon;
                  const prev = i > 0 ? visibleActions[i - 1] : null;
                  const showSep =
                    action.key === "lock" ||
                    action.key === "activate" ||
                    (action.key === "unlock" && prev?.key !== "lock");
                  return (
                    <div key={action.key}>
                      {showSep && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={() => handleActionSelect(action)}
                        className={cn("gap-2 text-xs cursor-pointer", action.color)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {action.label}
                      </DropdownMenuItem>
                    </div>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* ── Confirmation Modal (non-reject actions) ──── */}
      <AlertDialog open={showConfirm} onOpenChange={(o) => { if (!o && !isProcessing) { setShowConfirm(false); setPendingAction(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingAction?.isDanger && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              Confirm Bulk Action
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  You are about to <strong>{pendingAction?.confirmVerb}</strong>{" "}
                  <strong>{count}</strong> provider{count !== 1 ? "s" : ""}. Continue?
                </p>
                {preview && preview.skipped > 0 && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      {preview.skipped} provider{preview.skipped !== 1 ? "s" : ""} will be skipped ({preview.skipReason}).
                      {preview.processable.length > 0 && ` ${preview.processable.length} will be processed.`}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeBulkAction()}
              disabled={isProcessing || (preview?.processable.length === 0)}
              className={cn(
                "gap-1.5",
                pendingAction?.isDanger ? "bg-red-600 hover:bg-red-700" : "bg-[#003B95] hover:bg-[#002d73]",
              )}
            >
              {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {pendingAction?.confirmTitle}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject Reason Modal ──────────────────────── */}
      <AlertDialog open={showRejectModal} onOpenChange={(o) => { if (!o && !isProcessing) { setShowRejectModal(false); setPendingAction(null); } }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reject {count} Provider{count !== 1 ? "s" : ""}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Provide a reason for rejecting these providers. This reason will be applied to all selected providers.
                </p>
                {preview && preview.skipped > 0 && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      {preview.skipped} provider{preview.skipped !== 1 ? "s" : ""} will be skipped ({preview.skipReason}).
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter rejection reason (min 10 characters)…"
                    rows={4}
                    maxLength={1000}
                    className="resize-none text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-[10px]",
                      rejectReason.trim().length > 0 && rejectReason.trim().length < 10
                        ? "text-red-500"
                        : "text-gray-400",
                    )}>
                      {rejectReason.trim().length < 10 && rejectReason.trim().length > 0
                        ? `${10 - rejectReason.trim().length} more characters required`
                        : "Minimum 10 characters"}
                    </p>
                    <p className="text-[10px] text-gray-400 tabular-nums">
                      {rejectReason.length}/1000
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeBulkAction(rejectReason.trim())}
              disabled={isProcessing || !reasonValid || (preview?.processable.length === 0)}
              className="bg-red-600 hover:bg-red-700 gap-1.5"
            >
              {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}