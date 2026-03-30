import { useState } from "react";
import { format } from "date-fns";
import {
  FileText, MapPin, Calendar, CheckCircle2, XCircle,
  ExternalLink, Clock, AlertTriangle, Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Badge } from "../../../ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "../../../ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../../ui/alert-dialog";
import type { FacilityRequest, FacilityRequestStatus } from "./training-provider-detail-data";

// ─── Props ───────────────────────────────────────────────────

interface FacilityRequestsProps {
  facilityRequests: FacilityRequest[];
  onUpdateRequest: (updated: FacilityRequest) => void;
}

// ─── Status badge styles ─────────────────────────────────────

const REQUEST_STATUS_STYLES: Record<FacilityRequestStatus, {
  bg: string; text: string; border: string; dot: string;
}> = {
  Pending:  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  Approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  Rejected: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-500" },
};

// ═══════════════════════════════════════════════════════════════
// Facility Requests Section
// ═══════════════════════════════════════════════════════════════

export function FacilityRequests({
  facilityRequests,
  onUpdateRequest,
}: FacilityRequestsProps) {
  const [approveTarget, setApproveTarget] = useState<FacilityRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<FacilityRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = () => {
    if (!approveTarget) return;
    onUpdateRequest({
      ...approveTarget,
      status: "Approved",
      reviewedAt: new Date(),
    });
    toast.success(`Facility request for "${approveTarget.facilityName}" has been approved`);
    setApproveTarget(null);
  };

  const handleReject = () => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    onUpdateRequest({
      ...rejectTarget,
      status: "Rejected",
      reviewedAt: new Date(),
      rejectionReason: rejectionReason.trim(),
    });
    toast.success(`Facility request for "${rejectTarget.facilityName}" has been rejected`);
    setRejectTarget(null);
    setRejectionReason("");
  };

  const handleViewContract = (request: FacilityRequest) => {
    window.open(request.contractDocumentUrl, "_blank", "noopener,noreferrer");
  };

  if (facilityRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
        <Inbox className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-500">No facility requests</p>
        <p className="text-xs text-gray-400 mt-1">
          There are no facility access requests from this provider
        </p>
      </div>
    );
  }

  const pendingCount = facilityRequests.filter(r => r.status === "Pending").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3">
        {pendingCount > 0 && (
          <Badge variant="outline" className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3" />
            {pendingCount} pending review
          </Badge>
        )}
      </div>

      {/* Requests Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="px-4 text-xs text-gray-500">Facility Name</TableHead>
              <TableHead className="px-4 text-xs text-gray-500 hidden sm:table-cell">Location</TableHead>
              <TableHead className="px-4 text-xs text-gray-500 hidden md:table-cell">Contract</TableHead>
              <TableHead className="px-4 text-xs text-gray-500">Status</TableHead>
              <TableHead className="px-4 text-xs text-gray-500 hidden lg:table-cell">Requested Date</TableHead>
              <TableHead className="px-4 text-xs text-gray-500 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilityRequests.map(request => {
              const s = REQUEST_STATUS_STYLES[request.status];
              return (
                <TableRow key={request.id} className="hover:bg-gray-50/50">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5 text-[#003B95]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm text-[#111827] font-medium block truncate">
                          {request.facilityName}
                        </span>
                        {request.rejectionReason && (
                          <span className="text-[10px] text-red-500 block truncate mt-0.5">
                            Reason: {request.rejectionReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-xs text-gray-500 hidden sm:table-cell">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {request.location}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 hidden md:table-cell">
                    <button
                      onClick={() => handleViewContract(request)}
                      className="flex items-center gap-1.5 text-xs text-[#003B95] hover:underline"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{request.contractDocumentName}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </button>
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] gap-1 border", s.bg, s.text, s.border)}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-xs text-gray-500 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {format(request.requestedAt, "dd MMM yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center justify-center gap-1">
                      {request.status === "Pending" ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => setApproveTarget(request)}
                            aria-label={`Approve ${request.facilityName}`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => { setRejectTarget(request); setRejectionReason(""); }}
                            aria-label={`Reject ${request.facilityName}`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#003B95] hover:text-[#002d73] hover:bg-blue-50"
                        onClick={() => handleViewContract(request)}
                        aria-label={`View contract for ${request.facilityName}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Approve Confirmation Dialog ────────────── */}
      <AlertDialog open={!!approveTarget} onOpenChange={open => { if (!open) setApproveTarget(null); }}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Approve Facility Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the facility request for{" "}
              <span className="font-medium text-[#111827]">{approveTarget?.facilityName}</span>?
              The training provider will be notified of the approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApprove}
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject Dialog with Reason Input ───────── */}
      <Dialog open={!!rejectTarget} onOpenChange={open => { if (!open) { setRejectTarget(null); setRejectionReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Reject Facility Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the facility request for{" "}
              <span className="font-medium text-[#111827]">{rejectTarget?.facilityName}</span>.
              The training provider will be notified with this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="rejection-reason" className="text-sm font-medium text-[#111827]">
                Rejection Reason
              </label>
              <Input
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectionReason(""); }}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectionReason.trim()}
              onClick={handleReject}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
