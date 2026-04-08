// ─── SCR-ADM-022: Tournament Detail (Admin View) ────────────────────────────
// Read-only comprehensive detail view of a single tournament. Shows config,
// host, facility, schedule, rules, attendee list, payment info, status
// timeline, and audit trail.

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Trophy,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Wallet,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import type { Tournament, TournamentStatus, TournamentAttendee } from "./types";
import { generateMockTournaments } from "./mockData";

// ─── Badge Styles ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<TournamentStatus, string> = {
  Tentative: "bg-sky-100 text-sky-700 border-sky-200",
  Confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Full: "bg-amber-100 text-amber-700 border-amber-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
  Completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Expired: "bg-gray-100 text-gray-500 border-gray-200",
};

const PAYMENT_BADGE: Record<string, string> = {
  Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Refunded: "bg-sky-100 text-sky-700 border-sky-200",
};

const ATTENDEE_STATUS_BADGE: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Withdrawn: "bg-amber-100 text-amber-700 border-amber-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return format(parseISO(iso), "dd MMM yyyy");
}
function fmtDateTime(iso: string) {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm");
}
function fmtCurrency(amount: number) {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}

// ─── Cached tournaments ──────────────────────────────────────────────────────
const ALL_TOURNAMENTS = generateMockTournaments(50);

// ─── Main Component ──────────────────────────────────────────────────────────

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const tournament = ALL_TOURNAMENTS.find((t) => t.id === id) ?? null;

  // ── Audit trail collapse ──
  const [auditExpanded, setAuditExpanded] = useState(true);

  // ── Attendee table pagination ──
  const ATTENDEE_PAGE_SIZE = 20;
  const [attendeePage, setAttendeePage] = useState(1);

  // ── Attendee sort ──
  const [attendeeSortKey, setAttendeeSortKey] =
    useState<string>("registrationDate");
  const [attendeeSortDir, setAttendeeSortDir] = useState<"asc" | "desc">(
    "desc",
  );

  // ── 404 State ──
  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <Trophy className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">
            Tournament Not Found
          </h1>
          <p className="text-sm text-[#6B7280] max-w-sm">
            The tournament ID does not exist or has been removed.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/tournaments")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  const isFree = tournament.financials.feeType === "Free";

  // ── Attendee sorting and pagination ──
  const sortedAttendees = [...tournament.attendees].sort((a, b) => {
    let av: string | number, bv: string | number;
    switch (attendeeSortKey) {
      case "playerName":
        av = a.playerName;
        bv = b.playerName;
        break;
      case "age":
        av = a.age;
        bv = b.age;
        break;
      case "gender":
        av = a.gender;
        bv = b.gender;
        break;
      case "registrationDate":
        av = a.registrationDate;
        bv = b.registrationDate;
        break;
      case "bookingId":
        av = a.bookingId;
        bv = b.bookingId;
        break;
      case "paymentStatus":
        av = a.paymentStatus;
        bv = b.paymentStatus;
        break;
      case "attendeeStatus":
        av = a.attendeeStatus;
        bv = b.attendeeStatus;
        break;
      default:
        av = a.registrationDate;
        bv = b.registrationDate;
    }
    if (av < bv) return attendeeSortDir === "asc" ? -1 : 1;
    if (av > bv) return attendeeSortDir === "asc" ? 1 : -1;
    return 0;
  });

  const attendeeTotalPages = Math.max(
    1,
    Math.ceil(sortedAttendees.length / ATTENDEE_PAGE_SIZE),
  );
  const paginatedAttendees = sortedAttendees.slice(
    (attendeePage - 1) * ATTENDEE_PAGE_SIZE,
    attendeePage * ATTENDEE_PAGE_SIZE,
  );

  const handleAttendeeSort = (key: string) => {
    if (attendeeSortKey === key) {
      setAttendeeSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setAttendeeSortKey(key);
      setAttendeeSortDir("asc");
    }
    setAttendeePage(1);
  };

  return (
    <TooltipProvider>
      <div
        className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen"
        role="main"
        aria-label="Tournament Detail"
      >
        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280]">
          <span
            className="hover:text-[#003B95] cursor-pointer"
            onClick={() => navigate("/")}
          >
            Dashboard
          </span>
          <span className="mx-2">/</span>
          <span
            className="hover:text-[#003B95] cursor-pointer"
            onClick={() => navigate("/tournaments")}
          >
            Tournaments
          </span>
          <span className="mx-2">/</span>
          <span className="text-[#111827] font-medium">{tournament.name}</span>
        </nav>

        {/* ── Hero Image ── */}
        <div
          className="w-full h-[300px] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center"
          role="img"
          aria-label={
            tournament.image
              ? `Tournament image for ${tournament.name}`
              : `Sport icon for ${tournament.sport}`
          }
        >
          {tournament.image ? (
            <img
              src={tournament.image}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <Trophy className="w-16 h-16" />
              <span className="text-sm font-medium">{tournament.sport}</span>
            </div>
          )}
        </div>

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">
              {tournament.name}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge
                variant="outline"
                className="border text-xs font-medium bg-blue-50 text-blue-700 border-blue-200"
              >
                {tournament.sport}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border text-xs font-medium",
                  STATUS_BADGE[tournament.status],
                )}
              >
                {tournament.status}
              </Badge>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold text-[#111827]">
              {tournament.registrationCount} / {tournament.maxPlayers}
            </p>
            <p className="text-xs text-[#6B7280]">players registered</p>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-5 gap-6">
          {/* ── Left Column (60%) ── */}
          <div className="col-span-3 space-y-6">
            {/* Tournament Configuration Card */}
            <Card
              title="Tournament Details"
              icon={<Trophy className="w-4 h-4" />}
              ariaLabel="Tournament Details"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoField label="Sport">{tournament.sport}</InfoField>
                <InfoField label="Level">{tournament.level}</InfoField>
                <InfoField label="Age Range">{tournament.ageRange}</InfoField>
                <InfoField label="Gender">{tournament.gender}</InfoField>
                <InfoField label="Equipment">{tournament.equipment}</InfoField>
                <InfoField label="Min Players">
                  {tournament.minPlayers}
                </InfoField>
                <InfoField label="Max Players">
                  {tournament.maxPlayers}
                </InfoField>
                <InfoField label="Tournament Type">
                  {tournament.tournamentType}
                </InfoField>
                <InfoField label="Booking Type">
                  {tournament.bookingType}
                </InfoField>
                <InfoField label="Price Range">
                  {tournament.priceRange}
                </InfoField>
              </div>
            </Card>

            {/* Schedule Card */}
            <Card
              title="Schedule"
              icon={<Calendar className="w-4 h-4" />}
              ariaLabel="Tournament Schedule"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoField label="Date">
                  {fmtDate(tournament.date)} (UTC)
                </InfoField>
                <InfoField label="Start Time">
                  {tournament.startTime} UTC
                </InfoField>
                <InfoField label="End Time">{tournament.endTime} UTC</InfoField>
                <InfoField label="Duration">{tournament.duration}</InfoField>
                {tournament.registrationDeadline && (
                  <InfoField label="Registration Deadline">
                    {fmtDateTime(tournament.registrationDeadline)} UTC
                  </InfoField>
                )}
              </div>
            </Card>

            {/* Rules & Notes Card */}
            <Card
              title="Rules & Notes"
              icon={<FileText className="w-4 h-4" />}
              ariaLabel="Rules and Notes"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                    Organizer Notes
                  </p>
                  <p className="text-sm text-[#111827] whitespace-pre-wrap">
                    {tournament.organizerNotes}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                    Special Rules
                  </p>
                  <p className="text-sm text-[#111827] whitespace-pre-wrap">
                    {tournament.specialRules}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Right Column (40%) ── */}
          <div className="col-span-2 space-y-6">
            {/* Host Information Card */}
            <Card
              title="Host Information"
              icon={<User className="w-4 h-4" />}
              ariaLabel="Host Information"
            >
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#003B95] hover:underline cursor-pointer">
                  {tournament.host.name}
                </p>
                <p className="text-xs text-[#6B7280]">
                  ID: {tournament.host.id}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-[#6B7280]">
                    <Mail className="w-3.5 h-3.5" /> {tournament.host.email}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#6B7280]">
                    <Phone className="w-3.5 h-3.5" /> {tournament.host.phone}
                  </div>
                </div>
              </div>
            </Card>

            {/* Facility Information Card */}
            <Card
              title="Facility"
              icon={<Building2 className="w-4 h-4" />}
              ariaLabel="Facility Information"
            >
              <div className="space-y-3 text-sm">
                <InfoField label="Facility Name">
                  <span className="text-[#003B95] font-medium hover:underline cursor-pointer">
                    {tournament.facility.name}
                  </span>
                </InfoField>
                <InfoField label="Location">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                    {tournament.facility.location}
                  </span>
                </InfoField>
                <InfoField label="Court">{tournament.facility.court}</InfoField>
              </div>
            </Card>

            {/* Payment Information Card */}
            <Card
              title="Payment"
              icon={<CreditCard className="w-4 h-4" />}
              ariaLabel="Payment Information"
            >
              {isFree ? (
                <p className="text-sm text-[#6B7280]">
                  Free Tournament — No Payment Required
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  <InfoField label="Fee Type">
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Paid
                    </Badge>
                  </InfoField>
                  <InfoField label="Entry Fee">
                    {fmtCurrency(tournament.financials.entryFee)}
                  </InfoField>
                  <InfoField label="Payment Method">
                    {tournament.financials.paymentMethod}
                  </InfoField>
                  <InfoField label="Total Collected">
                    <span className="font-semibold text-emerald-700">
                      {fmtCurrency(tournament.financials.totalCollected)}
                    </span>
                  </InfoField>
                  {tournament.financials.totalRefunded > 0 && (
                    <InfoField label="Total Refunded">
                      <span className="font-semibold text-red-600">
                        {fmtCurrency(tournament.financials.totalRefunded)}
                      </span>
                    </InfoField>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ── Attendee List (Full Width) ── */}
        <Card
          title={`Registered Players (${tournament.registrationCount})`}
          icon={<Users className="w-4 h-4" />}
          ariaLabel="Registered Players"
        >
          {tournament.attendees.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Users className="w-10 h-10 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">
                No Players Registered
              </p>
              <p className="text-xs text-[#6B7280]">
                No players have registered for this tournament yet.
              </p>
            </div>
          ) : (
            <>
              <div
                className="overflow-x-auto"
                role="table"
                aria-label="Registered Players"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold text-gray-500 w-[50px]">
                        #
                      </TableHead>
                      <AttSortHead
                        col="playerName"
                        label="Player Name"
                        sortKey={attendeeSortKey}
                        sortDir={attendeeSortDir}
                        onSort={handleAttendeeSort}
                      />
                      <AttSortHead
                        col="age"
                        label="Age"
                        sortKey={attendeeSortKey}
                        sortDir={attendeeSortDir}
                        onSort={handleAttendeeSort}
                        className="w-[60px]"
                      />
                      <AttSortHead
                        col="gender"
                        label="Gender"
                        sortKey={attendeeSortKey}
                        sortDir={attendeeSortDir}
                        onSort={handleAttendeeSort}
                        className="w-[80px]"
                      />
                      <AttSortHead
                        col="registrationDate"
                        label="Registration Date"
                        sortKey={attendeeSortKey}
                        sortDir={attendeeSortDir}
                        onSort={handleAttendeeSort}
                      />
                      <AttSortHead
                        col="bookingId"
                        label="Booking ID"
                        sortKey={attendeeSortKey}
                        sortDir={attendeeSortDir}
                        onSort={handleAttendeeSort}
                      />
                      <AttSortHead
                        col="paymentStatus"
                        label="Payment Status"
                        sortKey={attendeeSortKey}
                        sortDir={attendeeSortDir}
                        onSort={handleAttendeeSort}
                      />
                      <AttSortHead
                        col="attendeeStatus"
                        label="Status"
                        sortKey={attendeeSortKey}
                        sortDir={attendeeSortDir}
                        onSort={handleAttendeeSort}
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAttendees.map((att, idx) => (
                      <TableRow
                        key={att.id}
                        className={cn(
                          idx % 2 === 1 && "bg-gray-50/40",
                          "hover:bg-blue-50/30",
                        )}
                      >
                        <TableCell className="text-xs text-[#6B7280]">
                          {(attendeePage - 1) * ATTENDEE_PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell>
                          <span
                            className="text-sm font-medium text-[#003B95] hover:underline cursor-pointer"
                            onClick={() => {
                              /* navigate to player detail */
                            }}
                          >
                            {att.playerName}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-[#111827]">
                          {att.age}
                        </TableCell>
                        <TableCell className="text-sm text-[#111827]">
                          {att.gender}
                        </TableCell>
                        <TableCell className="text-sm text-[#111827] whitespace-nowrap">
                          {fmtDateTime(att.registrationDate)}
                        </TableCell>
                        <TableCell>
                          <span
                            className="text-xs font-mono text-[#003B95] hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/bookings/${att.bookingId}`);
                            }}
                          >
                            {att.bookingId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium border",
                              PAYMENT_BADGE[att.paymentStatus],
                            )}
                          >
                            {att.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium border",
                              ATTENDEE_STATUS_BADGE[att.attendeeStatus],
                            )}
                          >
                            {att.attendeeStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Attendee Pagination */}
              {attendeeTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm text-[#6B7280] mt-3">
                  <span>
                    Showing {(attendeePage - 1) * ATTENDEE_PAGE_SIZE + 1}–
                    {Math.min(
                      attendeePage * ATTENDEE_PAGE_SIZE,
                      sortedAttendees.length,
                    )}{" "}
                    of {sortedAttendees.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={attendeePage === 1}
                      onClick={() => setAttendeePage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs px-2">
                      Page {attendeePage} of {attendeeTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={attendeePage === attendeeTotalPages}
                      onClick={() => setAttendeePage((p) => p + 1)}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ── Status Timeline ── */}
        <Card
          title="Status Timeline"
          icon={<Clock className="w-4 h-4" />}
          ariaLabel="Tournament Status Timeline"
        >
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {tournament.timeline.map((event, idx) => {
              const isLast = idx === tournament.timeline.length - 1;
              return (
                <div key={idx} className="flex items-start min-w-[140px]">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                        isLast
                          ? "bg-[#003B95] border-[#003B95] text-white"
                          : "bg-emerald-500 border-emerald-500 text-white",
                      )}
                    >
                      {idx + 1}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs font-semibold text-[#111827]">
                        {event.status}
                      </p>
                      <p className="text-[10px] text-[#6B7280]">
                        {fmtDateTime(event.timestamp)}
                      </p>
                      <p className="text-[10px] text-[#6B7280]">
                        {event.actor}
                      </p>
                      {event.note && (
                        <p className="text-[10px] text-[#6B7280] italic">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isLast && (
                    <div className="h-[2px] bg-emerald-300 flex-1 mt-4 min-w-[20px]" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Audit Trail ── */}
        <div
          className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          role="region"
          aria-label="Audit Trail"
        >
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setAuditExpanded((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6B7280]" />
              <span className="text-sm font-semibold text-[#111827]">
                Audit Trail
              </span>
              <Badge variant="secondary" className="text-xs">
                {tournament.auditTrail.length}
              </Badge>
            </div>
            {auditExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#6B7280]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6B7280]" />
            )}
          </button>
          {auditExpanded && (
            <div className="px-5 pb-4 space-y-3">
              {[...tournament.auditTrail].reverse().map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#003B95] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-[#111827]">
                        {entry.event}
                      </p>
                      <span className="text-xs text-[#6B7280] whitespace-nowrap">
                        {fmtDateTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      By: {entry.actor}
                      {entry.details && ` — ${entry.details}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Helper Sub-components ───────────────────────────────────────────────────

function Card({
  title,
  icon,
  children,
  ariaLabel,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl"
      role="region"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <span className="text-[#6B7280]">{icon}</span>
        <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-xs text-[#6B7280] uppercase tracking-wide block mb-0.5">
        {label}
      </span>
      <span className="text-sm text-[#111827]">{children}</span>
    </div>
  );
}

function AttSortHead({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  col: string;
  label: string;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (k: string) => void;
  className?: string;
}) {
  const isActive = sortKey === col;
  return (
    <TableHead
      className={cn(
        "text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap",
        className,
      )}
      onClick={() => onSort(col)}
      aria-sort={
        isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      {label}
      {isActive ? (
        sortDir === "asc" ? (
          <ArrowUp className="w-3 h-3 ml-1 text-[#003B95] inline" />
        ) : (
          <ArrowDown className="w-3 h-3 ml-1 text-[#003B95] inline" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400 inline" />
      )}
    </TableHead>
  );
}
