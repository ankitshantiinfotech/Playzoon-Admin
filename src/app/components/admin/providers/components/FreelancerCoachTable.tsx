// ─── US-4.1.1 — Freelancer Coach Data Table ─────────────────
// Renders a 13-column data table for freelancer coaches
// with sticky first (Name) & last (Actions) columns,
// horizontal scroll, color-coded badges, and full actions.

import { useNavigate } from "react-router";
import { format } from "date-fns";
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  MessageCircle, Eye, Pencil, Trash2,
  Lock, Unlock, Loader2,
  Check, Ban,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import { Checkbox } from "../../../ui/checkbox";
import { useChatContext } from "../../communication/ChatContext";
import {
  type FreelancerCoach, type CoachSortField,
  getCoachFullName, getCoachLocation,
} from "./freelancer-coach-data";
import type { SortDir } from "../provider-data";

// ─── Props ───────────────────────────────────────────────────

interface FreelancerCoachTableProps {
  coaches: FreelancerCoach[];
  sortField: CoachSortField;
  sortDir: SortDir;
  onSort: (field: CoachSortField) => void;
  processingRowId: string | null;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: (coach: FreelancerCoach) => void;
  onReject: (coach: FreelancerCoach) => void;
  onDelete: (coach: FreelancerCoach) => void;
  // Selection (US-5.5.2)
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  bulkProcessing?: boolean;
}

// ─── Truncated text with tooltip ─────────────────────────────

function TruncatedCell({ text, maxLength, className }: {
  text: string; maxLength: number; className?: string;
}) {
  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? text.slice(0, maxLength) + "..." : text;

  if (!isTruncated) {
    return <span className={className}>{text}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("cursor-default", className)}>{displayText}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

// ─── Email with mailto + truncation ──────────────────────────

function EmailCell({ email }: { email: string }) {
  const maxLength = 22;
  const isTruncated = email.length > maxLength;
  const displayText = isTruncated ? email.slice(0, maxLength) + "..." : email;

  const link = (
    <a
      href={`mailto:${email}`}
      className="text-[#003B95] hover:underline text-xs"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Send email to ${email}`}
    >
      {displayText}
    </a>
  );

  if (!isTruncated) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent className="max-w-xs">{email}</TooltipContent>
    </Tooltip>
  );
}

// ─── Verification badge ──────────────────────────────────────

function VerificationBadge({ status }: { status: FreelancerCoach["verificationStatus"] }) {
  const styles = {
    Pending:  "bg-amber-100 text-amber-800 border-amber-200",
    Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <Badge variant="outline" className={cn("text-[11px]", styles[status])}>
      {status}
    </Badge>
  );
}

// ─── Account status badge ────────────────────────────────────

function AccountStatusBadge({ status }: { status: FreelancerCoach["accountStatus"] }) {
  if (status === "Locked") {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-[11px] gap-1">
        <Lock className="h-2.5 w-2.5" /> Locked
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1">
      <Unlock className="h-2.5 w-2.5" /> Unlocked
    </Badge>
  );
}

// ─── Platform status badge ───────────────────────────────────

function PlatformStatusBadge({ status }: { status: FreelancerCoach["platformStatus"] }) {
  if (status === "Active") {
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]">
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-[11px]">
        Inactive
      </Badge>
    );
}

// ─── Main Component ──────────────────────────────────────────

export function FreelancerCoachTable({
  coaches,
  sortField,
  sortDir,
  onSort,
  processingRowId,
  isApproving,
  isRejecting,
  onApprove,
  onReject,
  onDelete,
  // Selection (US-5.5.2)
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  bulkProcessing,
}: FreelancerCoachTableProps) {
  const navigate = useNavigate();
  const { chatEnabled: globalChatEnabled, openChat, unreadCounts } = useChatContext();

  // Selection helpers (US-5.5.2)
  const hasSelection = selectedIds && selectedIds.size > 0;
  const allPageSelected = coaches.length > 0 && coaches.every(c => selectedIds?.has(c.id));
  const somePageSelected = hasSelection && coaches.some(c => selectedIds?.has(c.id)) && !allPageSelected;

  // ── Sortable header helper ──────────────────────────────
  const SortableHeader = ({ field, children, className }: {
    field: CoachSortField; children: React.ReactNode; className?: string;
  }) => (
    <TableHead
      className={cn(
        "px-3 cursor-pointer select-none hover:bg-gray-100/50 transition-colors whitespace-nowrap",
        className,
      )}
    >
      <button
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 w-full"
        aria-label={`Sort by ${field}`}
      >
        {children}
        {sortField === field ? (
          sortDir === "asc"
            ? <ArrowUp className="h-3 w-3 text-[#003B95]" />
            : <ArrowDown className="h-3 w-3 text-[#003B95]" />
        ) : (
          <ArrowUpDown className="h-3 w-3 text-gray-300" />
        )}
      </button>
    </TableHead>
  );

  // ── Non-sortable header helper ──────────────────────────
  const StaticHeader = ({ children, className }: {
    children: React.ReactNode; className?: string;
  }) => (
    <TableHead className={cn("px-3 whitespace-nowrap", className)}>
      {children}
    </TableHead>
  );

  // ── Mobile card view (< md) ─────────────────────────────
  const MobileCard = ({ coach }: { coach: FreelancerCoach }) => {
    const fullName = getCoachFullName(coach);
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <TruncatedCell text={fullName} maxLength={30} className="text-sm text-[#111827]" />
            <div className="mt-1"><EmailCell email={coach.email} /></div>
          </div>
          <VerificationBadge status={coach.verificationStatus} />
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[#6B7280]">
          <div>
            <span className="text-[#9CA3AF]">Mobile:</span> {coach.mobile}
          </div>
          <div>
            <span className="text-[#9CA3AF]">Gender:</span> {coach.gender}
          </div>
          <div>
            <span className="text-[#9CA3AF]">DOB:</span> {format(coach.dob, "dd/MM/yyyy")}
          </div>
          <div>
            <span className="text-[#9CA3AF]">Nationality:</span> {coach.nationality}
          </div>
          <div className="col-span-2">
            <span className="text-[#9CA3AF]">Location:</span> {getCoachLocation(coach)}
          </div>
          <div className="col-span-2">
            <span className="text-[#9CA3AF]">Specialization:</span> {coach.specialization}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <AccountStatusBadge status={coach.accountStatus} />
          <PlatformStatusBadge status={coach.platformStatus} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1 border-t">
          {coach.verificationStatus === "Pending" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                    disabled={processingRowId === coach.id}
                    onClick={() => onApprove(coach)}
                    aria-label={`Approve ${fullName}`}
                  >
                    {processingRowId === coach.id && isApproving
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Check className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Approve</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={processingRowId === coach.id}
                    onClick={() => onReject(coach)}
                    aria-label={`Reject ${fullName}`}
                  >
                    {processingRowId === coach.id && isRejecting
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Ban className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reject</TooltipContent>
              </Tooltip>
              <div className="w-px h-4 bg-gray-200 mx-0.5" />
            </>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className={cn("h-7 w-7 relative", !globalChatEnabled && "opacity-40 cursor-not-allowed")}
                disabled={!globalChatEnabled}
                onClick={() => { if (globalChatEnabled) openChat(coach.id, fullName); }}
                aria-label={globalChatEnabled ? `Open chat with ${fullName}` : "Chat is disabled"}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {globalChatEnabled && (unreadCounts[coach.id] || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] leading-none">
                    {unreadCounts[coach.id]}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{globalChatEnabled ? "Open Chat" : "Chat is disabled"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => navigate(`/providers/coach/${coach.id}`)}
                aria-label={`View ${fullName}`}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => navigate(`/providers/coach/${coach.id}/edit`)}
                aria-label={`Edit ${fullName}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(coach)}
                aria-label={`Delete ${fullName}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── Mobile card layout ──────────────────────────── */}
      <div className="md:hidden p-4 space-y-3">
        {coaches.map(coach => (
          <MobileCard key={coach.id} coach={coach} />
        ))}
      </div>

      {/* ── Desktop table (horizontal scroll, sticky cols) ── */}
      <div className="hidden md:block overflow-x-auto">
        <Table className="min-w-[1400px]">
          <caption className="sr-only">Freelancer coaches list</caption>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              {/* Checkbox header (US-5.5.2) */}
              {onToggleSelectAll && (
                <TableHead className="px-3 w-10 sticky left-0 z-20 bg-gray-50">
                  <Checkbox
                    checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                    onCheckedChange={() => onToggleSelectAll()}
                    disabled={bulkProcessing}
                    aria-label="Select all on this page"
                    className="data-[state=indeterminate]:bg-[#003B95] data-[state=indeterminate]:border-[#003B95]"
                  />
                </TableHead>
              )}
              {/* Col 1: Coach Name — sticky left */}
              <SortableHeader
                field="name"
                className={cn("sticky z-10 bg-gray-50 min-w-[180px] border-r border-gray-100", onToggleSelectAll ? "left-10" : "left-0")}
              >
                Coach Name
              </SortableHeader>

              {/* Col 2: Email */}
              <SortableHeader field="email" className="min-w-[170px]">Email</SortableHeader>

              {/* Col 3: Mobile */}
              <StaticHeader className="min-w-[140px]">Mobile</StaticHeader>

              {/* Col 4: Gender */}
              <StaticHeader className="min-w-[100px]">Gender</StaticHeader>

              {/* Col 5: Nationality */}
              <SortableHeader field="nationality" className="min-w-[110px]">Nationality</SortableHeader>

              {/* Col 6: DOB */}
              <SortableHeader field="dob" className="min-w-[110px]">DOB</SortableHeader>

              {/* Col 7: Location */}
              <StaticHeader className="min-w-[140px]">Location</StaticHeader>

              {/* Col 8: Specialization */}
              <SortableHeader field="specialization" className="min-w-[140px]">Specialization</SortableHeader>

              {/* Col 9: Verification Status */}
              <SortableHeader field="verificationStatus" className="min-w-[120px]">Verification</SortableHeader>

              {/* Col 10: Account Status */}
              <StaticHeader className="min-w-[110px]">Account</StaticHeader>

              {/* Col 11: Platform Status */}
              <StaticHeader className="min-w-[100px]">Platform</StaticHeader>

              {/* Col 12: Created Date */}
              <SortableHeader field="createdAt" className="min-w-[110px]">Created</SortableHeader>

              {/* Col 13: Actions — sticky right */}
              <TableHead
                className="px-3 min-w-[160px] sticky right-0 z-10 bg-gray-50 border-l border-gray-100"
              >
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {coaches.map(coach => {
              const fullName = getCoachFullName(coach);
              const location = getCoachLocation(coach);
              const isProcessing = processingRowId === coach.id;

              return (
                <TableRow
                  key={coach.id}
                  className={cn(
                    "group hover:bg-gray-50/50 transition-colors",
                    selectedIds?.has(coach.id) && "bg-blue-50/40",
                  )}
                >
                  {/* Row checkbox (US-5.5.2) */}
                  {onToggleSelect && (
                    <TableCell className="px-3 w-10 sticky left-0 z-10 bg-white group-hover:bg-gray-50/50 transition-colors">
                      <Checkbox
                        checked={selectedIds?.has(coach.id) ?? false}
                        onCheckedChange={() => onToggleSelect(coach.id)}
                        disabled={bulkProcessing}
                        aria-label={`Select ${fullName}`}
                      />
                    </TableCell>
                  )}
                  {/* Col 1: Coach Name (sticky) */}
                  <TableCell className={cn("px-3 sticky z-10 bg-white group-hover:bg-gray-50/50 transition-colors border-r border-gray-50", onToggleSelect ? "left-10" : "left-0")}>
                    <TruncatedCell text={fullName} maxLength={24} className="text-sm text-[#111827]" />
                  </TableCell>

                  {/* Col 2: Email (mailto) */}
                  <TableCell className="px-3">
                    <EmailCell email={coach.email} />
                  </TableCell>

                  {/* Col 3: Mobile */}
                  <TableCell className="px-3 text-xs text-[#6B7280] whitespace-nowrap">
                    {coach.mobile}
                  </TableCell>

                  {/* Col 4: Gender */}
                  <TableCell className="px-3 text-xs text-[#6B7280]">
                    {coach.gender}
                  </TableCell>

                  {/* Col 5: Nationality */}
                  <TableCell className="px-3 text-xs text-[#6B7280]">
                    {coach.nationality}
                  </TableCell>

                  {/* Col 6: DOB */}
                  <TableCell className="px-3 text-xs text-[#6B7280] whitespace-nowrap">
                    {format(coach.dob, "dd/MM/yyyy")}
                  </TableCell>

                  {/* Col 7: Location */}
                  <TableCell className="px-3">
                    <TruncatedCell text={location} maxLength={20} className="text-xs text-[#6B7280]" />
                  </TableCell>

                  {/* Col 8: Specialization */}
                  <TableCell className="px-3">
                    <Badge variant="outline" className="text-[11px] bg-blue-50 text-blue-700 border-blue-200">
                      {coach.specialization}
                    </Badge>
                  </TableCell>

                  {/* Col 9: Verification Status */}
                  <TableCell className="px-3">
                    <VerificationBadge status={coach.verificationStatus} />
                  </TableCell>

                  {/* Col 10: Account Status */}
                  <TableCell className="px-3">
                    <AccountStatusBadge status={coach.accountStatus} />
                  </TableCell>

                  {/* Col 11: Platform Status */}
                  <TableCell className="px-3">
                    <PlatformStatusBadge status={coach.platformStatus} />
                  </TableCell>

                  {/* Col 12: Created Date */}
                  <TableCell className="px-3 text-xs text-[#6B7280] whitespace-nowrap">
                    {format(coach.createdAt, "dd/MM/yyyy")}
                  </TableCell>

                  {/* Col 13: Actions (sticky right) */}
                  <TableCell className="px-3 sticky right-0 z-10 bg-white group-hover:bg-gray-50/50 transition-colors border-l border-gray-50">
                    <div className="flex items-center gap-0.5">
                      {/* Approve / Reject (Pending only) */}
                      {coach.verificationStatus === "Pending" && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                disabled={isProcessing}
                                onClick={() => onApprove(coach)}
                                aria-label={`Approve ${fullName}`}
                              >
                                {isProcessing && isApproving
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Check className="h-3.5 w-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Approve</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={isProcessing}
                                onClick={() => onReject(coach)}
                                aria-label={`Reject ${fullName}`}
                              >
                                {isProcessing && isRejecting
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Ban className="h-3.5 w-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reject</TooltipContent>
                          </Tooltip>
                          <div className="w-px h-4 bg-gray-200 mx-0.5" />
                        </>
                      )}

                      {/* Chat (conditional on global toggle) */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            className={cn(
                              "h-7 w-7 relative",
                              !globalChatEnabled && "opacity-40 cursor-not-allowed",
                            )}
                            disabled={!globalChatEnabled}
                            onClick={() => { if (globalChatEnabled) openChat(coach.id, fullName); }}
                            aria-label={globalChatEnabled ? `Open chat with ${fullName}` : "Chat is disabled"}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {globalChatEnabled && (unreadCounts[coach.id] || 0) > 0 && (
                              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] leading-none">
                                {unreadCounts[coach.id]}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{globalChatEnabled ? "Open Chat" : "Chat is disabled"}</TooltipContent>
                      </Tooltip>

                      {/* View */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => navigate(`/providers/coach/${coach.id}`)}
                            aria-label={`View ${fullName}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>

                      {/* Edit */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => navigate(`/providers/coach/${coach.id}/edit`)}
                            aria-label={`Edit ${fullName}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>

                      {/* Delete */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDelete(coach)}
                            aria-label={`Delete ${fullName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}