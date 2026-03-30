// ─── US-3.1.1 — Facility Provider Data Table ────────────────
// Renders a 9-column data table specific to Facility Providers
// with all required columns, badges, mailto links, and actions.

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
import type { ServiceProvider, FacilitySortField, SortDir } from "../provider-data";
import { useChatContext } from "../../communication/ChatContext";

// ─── Props ───────────────────────────────────────────────────
interface FacilityProviderTableProps {
  providers: ServiceProvider[];
  sortField: FacilitySortField;
  sortDir: SortDir;
  onSort: (field: FacilitySortField) => void;
  processingRowId: string | null;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: (provider: ServiceProvider) => void;
  onReject: (provider: ServiceProvider) => void;
  onDelete: (provider: ServiceProvider) => void;
  // Selection (US-5.5.2)
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  bulkProcessing?: boolean;
}

// ─── Truncated text with tooltip ─────────────────────────────
function TruncatedCell({ text, maxLength, className, children }: {
  text: string; maxLength: number; className?: string; children?: React.ReactNode;
}) {
  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? text.slice(0, maxLength) + "..." : text;

  if (!isTruncated) {
    return <span className={className}>{children ?? text}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("cursor-default", className)}>{children ?? displayText}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

// ─── Email with mailto + truncation ──────────────────────────
function EmailCell({ email }: { email: string }) {
  const maxLength = 25;
  const isTruncated = email.length > maxLength;
  const displayText = isTruncated ? email.slice(0, maxLength) + "..." : email;

  const link = (
    <a
      href={`mailto:${email}`}
      className="text-[#003B95] hover:underline text-sm"
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
function VerificationBadge({ status }: { status: ServiceProvider["verificationStatus"] }) {
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
function AccountStatusBadge({ status }: { status: ServiceProvider["accountStatus"] }) {
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
function PlatformStatusBadge({ status }: { status: ServiceProvider["platformStatus"] }) {
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
export function FacilityProviderTable({
  providers,
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
}: FacilityProviderTableProps) {
  const navigate = useNavigate();
  const { chatEnabled: globalChatEnabled, openChat, unreadCounts } = useChatContext();

  // Selection helpers
  const hasSelection = selectedIds && selectedIds.size > 0;
  const allPageSelected = providers.length > 0 && providers.every(p => selectedIds?.has(p.id));
  const somePageSelected = hasSelection && providers.some(p => selectedIds?.has(p.id)) && !allPageSelected;

  // ── Sortable header helper ──────────────────────────────
  const SortableHeader = ({ field, children, className }: {
    field: FacilitySortField; children: React.ReactNode; className?: string;
  }) => (
    <TableHead className={cn("px-5 cursor-pointer select-none hover:bg-gray-100/50 transition-colors", className)}>
      <button
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 w-full text-xs"
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

  // ── Mobile card view (≤768px) ───────────────────────────
  const MobileCard = ({ provider }: { provider: ServiceProvider }) => (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <TruncatedCell
            text={provider.name}
            maxLength={30}
            className="text-sm text-[#111827]"
          />
          <div className="mt-1">
            <EmailCell email={provider.email} />
          </div>
        </div>
        <VerificationBadge status={provider.verificationStatus} />
      </div>

      {/* Detail rows */}
      <div className="grid grid-cols-2 gap-2 text-xs text-[#6B7280]">
        <div>
          <span className="text-[#9CA3AF]">Incorporation:</span>{" "}
          {provider.incorporationDate ? format(provider.incorporationDate, "dd/MM/yyyy") : "—"}
        </div>
        <div>
          <span className="text-[#9CA3AF]">Mobile:</span> {provider.mobile}
        </div>
        <div className="col-span-2">
          <span className="text-[#9CA3AF]">Person In Charge:</span>{" "}
          {provider.personInCharge ?? "—"}
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <AccountStatusBadge status={provider.accountStatus} />
        <PlatformStatusBadge status={provider.platformStatus} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1 border-t">
        {provider.verificationStatus === "Pending" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                  disabled={processingRowId === provider.id}
                  onClick={() => onApprove(provider)}
                  aria-label={`Approve ${provider.name}`}
                >
                  {processingRowId === provider.id && isApproving
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
                  disabled={processingRowId === provider.id}
                  onClick={() => onReject(provider)}
                  aria-label={`Reject ${provider.name}`}
                >
                  {processingRowId === provider.id && isRejecting
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
              onClick={() => { if (globalChatEnabled) openChat(provider.id, provider.name); }}
              aria-label={globalChatEnabled ? `Open chat with ${provider.name}` : "Chat is disabled"}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {globalChatEnabled && (unreadCounts[provider.id] || 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] leading-none">
                  {unreadCounts[provider.id]}
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
              onClick={() => navigate(`/providers/facility/${provider.id}`)}
              aria-label={`View ${provider.name}`}
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
              onClick={() => navigate(`/providers/facility/${provider.id}/edit`)}
              aria-label={`Edit ${provider.name}`}
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
              onClick={() => onDelete(provider)}
              aria-label={`Delete ${provider.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile card layout ──────────────────────────── */}
      <div className="md:hidden p-4 space-y-3">
        {providers.map(provider => (
          <MobileCard key={provider.id} provider={provider} />
        ))}
      </div>

      {/* ── Desktop table layout ────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <caption className="sr-only">Facility providers list</caption>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              {/* Checkbox header (US-5.5.2) */}
              {onToggleSelectAll && (
                <TableHead className="px-3 w-10">
                  <Checkbox
                    checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                    onCheckedChange={() => onToggleSelectAll()}
                    disabled={bulkProcessing}
                    aria-label="Select all on this page"
                    className="data-[state=indeterminate]:bg-[#003B95] data-[state=indeterminate]:border-[#003B95]"
                  />
                </TableHead>
              )}
              {/* Col 1: Facility Name */}
              <SortableHeader field="name">Facility Name</SortableHeader>
              {/* Col 2: Incorporation Date */}
              <SortableHeader field="incorporationDate" className="hidden lg:table-cell">Incorporation Date</SortableHeader>
              {/* Col 3: Email ID */}
              <SortableHeader field="email">Email ID</SortableHeader>
              {/* Col 4: Mobile Number */}
              <TableHead className="px-5 hidden lg:table-cell text-xs">Mobile Number</TableHead>
              {/* Col 5: Person In Charge */}
              <SortableHeader field="personInCharge" className="hidden xl:table-cell">Person In Charge</SortableHeader>
              {/* Col 6: Verification Status */}
              <SortableHeader field="verificationStatus">Verification</SortableHeader>
              {/* Col 7: Account Status */}
              <TableHead className="px-5 hidden lg:table-cell text-xs">Account</TableHead>
              {/* Col 8: Platform Status */}
              <TableHead className="px-5 hidden xl:table-cell text-xs">Platform</TableHead>
              {/* Col 9: Actions */}
              <TableHead className="px-5 w-[160px]"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map(provider => (
              <TableRow
                key={provider.id}
                className={cn(
                  "group hover:bg-gray-50/50 transition-colors",
                  selectedIds?.has(provider.id) && "bg-blue-50/40",
                )}
              >
                {/* Row checkbox (US-5.5.2) */}
                {onToggleSelect && (
                  <TableCell className="px-3 w-10">
                    <Checkbox
                      checked={selectedIds?.has(provider.id) ?? false}
                      onCheckedChange={() => onToggleSelect(provider.id)}
                      disabled={bulkProcessing}
                      aria-label={`Select ${provider.name}`}
                    />
                  </TableCell>
                )}
                {/* Col 1: Facility Name */}
                <TableCell className="px-5">
                  <TruncatedCell
                    text={provider.name}
                    maxLength={30}
                    className="text-sm text-[#111827]"
                  />
                </TableCell>

                {/* Col 2: Incorporation Date (DD/MM/YYYY) */}
                <TableCell className="px-5 hidden lg:table-cell">
                  <span className="text-sm text-[#6B7280]">
                    {provider.incorporationDate
                      ? format(provider.incorporationDate, "dd/MM/yyyy")
                      : "—"}
                  </span>
                </TableCell>

                {/* Col 3: Email ID (mailto link) */}
                <TableCell className="px-5">
                  <div className="max-w-[180px] truncate">
                    <EmailCell email={provider.email} />
                  </div>
                </TableCell>

                {/* Col 4: Mobile Number (with country code) */}
                <TableCell className="px-5 hidden lg:table-cell">
                  <span className="text-sm text-[#6B7280] max-w-[180px] truncate block">
                    {provider.mobile}
                  </span>
                </TableCell>

                {/* Col 5: Person In Charge */}
                <TableCell className="px-5 hidden xl:table-cell">
                  <TruncatedCell
                    text={provider.personInCharge ?? "—"}
                    maxLength={25}
                    className="text-sm text-[#6B7280]"
                  />
                </TableCell>

                {/* Col 6: Verification Status */}
                <TableCell className="px-5">
                  <VerificationBadge status={provider.verificationStatus} />
                </TableCell>

                {/* Col 7: Account Status */}
                <TableCell className="px-5 hidden lg:table-cell">
                  <AccountStatusBadge status={provider.accountStatus} />
                </TableCell>

                {/* Col 8: Platform Status */}
                <TableCell className="px-5 hidden xl:table-cell">
                  <PlatformStatusBadge status={provider.platformStatus} />
                </TableCell>

                {/* Col 9: Actions */}
                <TableCell className="px-5">
                  <div className="flex items-center gap-1">
                    {/* Approve / Reject (Pending only) */}
                    {provider.verificationStatus === "Pending" && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                              disabled={processingRowId === provider.id}
                              onClick={() => onApprove(provider)}
                              aria-label={`Approve ${provider.name}`}
                            >
                              {processingRowId === provider.id && isApproving
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
                              disabled={processingRowId === provider.id}
                              onClick={() => onReject(provider)}
                              aria-label={`Reject ${provider.name}`}
                            >
                              {processingRowId === provider.id && isRejecting
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Ban className="h-3.5 w-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reject</TooltipContent>
                        </Tooltip>
                        <div className="w-px h-4 bg-gray-200 mx-0.5" />
                      </>
                    )}

                    {/* Open Chat */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className={cn("h-7 w-7 relative", !globalChatEnabled && "opacity-40 cursor-not-allowed")}
                          disabled={!globalChatEnabled}
                          onClick={() => { if (globalChatEnabled) openChat(provider.id, provider.name); }}
                          aria-label={globalChatEnabled ? `Open chat with ${provider.name}` : "Chat is disabled"}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {globalChatEnabled && (unreadCounts[provider.id] || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] leading-none">
                              {unreadCounts[provider.id]}
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
                          onClick={() => navigate(`/providers/facility/${provider.id}`)}
                          aria-label={`View ${provider.name}`}
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
                          onClick={() => navigate(`/providers/facility/${provider.id}/edit`)}
                          aria-label={`Edit ${provider.name}`}
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
                          onClick={() => onDelete(provider)}
                          aria-label={`Delete ${provider.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}