// ─── SCR-ADM-026: Facility Detail (Admin View) ───────────────────
// Full read-only detail of a single facility.
// Media gallery full-width, then two-column layout:
//   Left (60%): Facility info, Courts, Operating Hours, Exceptions, Pricing,
//               Cancellation Policy, Rules
//   Right (40%): Provider, Stats, Earning Preview
// Audit trail full-width collapsible at bottom.
// This screen is entirely read-only (US-132 AC#3).

import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Star,
  Building2,
  Clock,
  Banknote,
  ShieldCheck,
  TrendingUp,
  Info,
  CalendarDays,
  Mail,
  Phone,
  ExternalLink,
  Image as ImageIcon,
  Play,
  X,
  LayoutGrid,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import {
  Facility,
  FacilityStatus,
  CourtStatus,
  PromotionStatus,
} from "./types";
import { MOCK_FACILITIES } from "./mockData";

// ─── Card Wrapper ────────────────────────────────────────────

function Card({
  icon: Icon,
  title,
  children,
  ariaLabel,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  ariaLabel?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
      role="region"
      aria-label={ariaLabel || title}
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#003B95]/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-[#003B95]" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        </div>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-gray-900">
        {value || <span className="text-gray-300">--</span>}
      </span>
    </div>
  );
}

// ─── Badges ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: FacilityStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border",
        status === "Active"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-gray-100 text-gray-500 border-gray-200",
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          status === "Active" ? "bg-emerald-500" : "bg-gray-400",
        )}
      />
      {status}
    </span>
  );
}

function PromotionBadge({ status }: { status: PromotionStatus }) {
  if (status !== "Promoted") return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200">
      <Star className="w-3 h-3" /> Promoted
    </span>
  );
}

function CourtStatusBadge({ status }: { status: CourtStatus }) {
  const s: Record<CourtStatus, string> = {
    Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Under Maintenance": "bg-amber-50 text-amber-700 border-amber-200",
    Disabled: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
        s[status],
      )}
    >
      {status === "Under Maintenance" && (
        <AlertTriangle className="w-2.5 h-2.5" />
      )}
      {status}
    </span>
  );
}

// ─── Star Rating ────────────────────────────────────────────

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200 fill-gray-200",
          )}
        />
      ))}
    </div>
  );
}

// ─── Media Gallery ──────────────────────────────────────────

function MediaGallery({ media }: { media: Facility["media"] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (media.length === 0) {
    return (
      <div
        role="region"
        aria-label="Facility Media Gallery"
        className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-gray-400"
      >
        <ImageIcon className="w-10 h-10 mb-2 text-gray-300" />
        <p className="text-sm">No media uploaded for this facility.</p>
      </div>
    );
  }

  const current = media[activeIdx];
  const isVideo = current?.type === "video";

  const prev = () => setActiveIdx((i) => (i === 0 ? media.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === media.length - 1 ? 0 : i + 1));

  return (
    <div
      role="region"
      aria-label="Facility Media Gallery"
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Main image */}
      <div className="relative bg-gray-900" style={{ height: 360 }}>
        {isVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <Play className="w-12 h-12 mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-60">Video Player</p>
            </div>
          </div>
        ) : (
          <img
            src={current.url}
            alt={
              current.caption ||
              `Facility image ${activeIdx + 1} of ${media.length}`
            }
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          />
        )}

        {/* Navigation arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg">
          {activeIdx + 1} / {media.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="px-4 py-3 flex gap-2 overflow-x-auto bg-gray-50 border-t border-gray-100">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all",
                i === activeIdx
                  ? "border-[#003B95] ring-1 ring-[#003B95]/30"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
              aria-label={`View image ${i + 1}`}
            >
              {m.type === "video" ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
              ) : (
                <img
                  src={m.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && !isVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={current.url}
            alt={current.caption || "Facility image (zoomed)"}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {media.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg">
            Image {activeIdx + 1} of {media.length}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Map Thumbnail ──────────────────────────────────────────

function MapThumbnail({ lat, lon }: { lat: number; lon: number }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.015}%2C${lat - 0.015}%2C${lon + 0.015}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lon}`;
  const googleUrl = `https://www.google.com/maps?q=${lat},${lon}`;

  return (
    <div className="space-y-2">
      <div
        className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
        style={{ height: 200 }}
        role="img"
        aria-label="Facility location on map"
      >
        <iframe
          src={mapUrl}
          title="Facility Location Map"
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
      <a
        href={googleUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-xs text-[#003B95] hover:underline w-fit"
      >
        <ExternalLink className="w-3 h-3" /> Open in Google Maps
      </a>
    </div>
  );
}

// ─── Currency formatter ─────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Days of week ───────────────────────────────────────────

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// ─── Main Component ─────────────────────────────────────────

interface Props {
  facilityId: string;
  onBack: () => void;
}

export function FacilityDetailPage({ facilityId, onBack }: Props) {
  const facility =
    MOCK_FACILITIES.find((f) => f.id === facilityId) ?? MOCK_FACILITIES[0];
  const [auditOpen, setAuditOpen] = useState(true);

  const f = facility;

  return (
    <div
      className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen"
      role="main"
      aria-label="Facility Detail"
    >
      {/* ── Breadcrumb ── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-gray-400"
      >
        <span className="hover:text-[#003B95] cursor-pointer">Dashboard</span>
        <ChevronRight className="w-3 h-3" />
        <button onClick={onBack} className="hover:text-[#003B95]">
          Facilities
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium">{f.name}</span>
      </nav>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="w-9 h-10 flex items-center justify-center rounded-xl border border-gray-300 bg-white hover:bg-gray-50 shrink-0 text-gray-600 shadow-sm mt-0.5"
            aria-label="Back to facilities"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{f.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {f.facilityType}
              </span>
              <StatusBadge status={f.status} />
              <PromotionBadge status={f.promotionStatus} />
            </div>
          </div>
        </div>

        {/* Facility ID */}
        <div className="text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm shrink-0 font-mono">
          {f.id}
        </div>
      </div>

      {/* Inactive banner */}
      {f.status === "Inactive" && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <Info className="w-4 h-4 shrink-0" />
          This facility is currently inactive and hidden from player-facing
          listings.
        </div>
      )}

      {/* ── Media Gallery ── */}
      <MediaGallery media={f.media} />

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-5 gap-5">
        {/* ─── LEFT COLUMN (60%) ─── */}
        <div className="col-span-3 space-y-5">
          {/* Facility Information Card */}
          <Card
            icon={Building2}
            title="Facility Information"
            ariaLabel="Facility Information"
          >
            <div className="grid grid-cols-3 gap-5">
              <InfoRow label="Type" value={f.facilityType} />
              <InfoRow
                label="Sports"
                value={
                  <div className="flex flex-wrap gap-1">
                    {f.sports.map((s) => (
                      <span
                        key={s.sport}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {s.sport}
                      </span>
                    ))}
                  </div>
                }
              />
              <InfoRow label="Location" value={`${f.city}, ${f.country}`} />
              <div className="col-span-3">
                <InfoRow
                  label="Full Address"
                  value={
                    <span className="text-sm text-gray-700">
                      {f.addressLine1}
                      {f.addressLine2 ? `, ${f.addressLine2}` : ""}, {f.area},{" "}
                      {f.city}, {f.country}
                    </span>
                  }
                />
              </div>
              <div className="col-span-3">
                <MapThumbnail lat={f.latitude} lon={f.longitude} />
              </div>
              <InfoRow
                label="Contact Phone"
                value={
                  <span className="flex items-center gap-1 text-sm">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {f.contactPhone}
                  </span>
                }
              />
              <InfoRow
                label="Contact Email"
                value={
                  <span className="flex items-center gap-1 text-sm">
                    <Mail className="w-3 h-3 text-gray-400" />
                    {f.contactEmail}
                  </span>
                }
              />
              <InfoRow
                label="Created"
                value={format(new Date(f.createdAt), "dd MMM yyyy")}
              />
              <div className="col-span-3">
                <InfoRow
                  label="Description"
                  value={
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {f.description}
                    </p>
                  }
                />
              </div>
            </div>
          </Card>

          {/* Courts & Sub-Facilities Card */}
          <Card
            icon={LayoutGrid}
            title={`Courts & Sub-Facilities (${f.courts.length})`}
            ariaLabel="Courts and Sub-Facilities"
            badge={
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                {f.courts.length}
              </span>
            }
          >
            {f.courts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No courts or sub-facilities configured.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table
                  className="w-full text-sm"
                  role="table"
                  aria-label="Courts and Sub-Facilities"
                >
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {[
                        "#",
                        "Court Name",
                        "Sport",
                        "Type",
                        "Capacity",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {f.courts.map((court, idx) => (
                      <tr key={court.id} className="hover:bg-gray-50/60">
                        <td className="px-3 py-3 text-gray-500 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {court.name}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {court.sport}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {court.isIndoor ? "Indoor" : "Outdoor"}
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums text-gray-700">
                          {court.capacity}
                        </td>
                        <td className="px-3 py-3">
                          <CourtStatusBadge status={court.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Operating Hours Card */}
          <Card
            icon={Clock}
            title="Operating Hours"
            ariaLabel="Operating Hours"
          >
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Day", "Open", "Close", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {DAYS_OF_WEEK.map((day) => {
                    const hours = f.operatingHours[day];
                    return (
                      <tr
                        key={day}
                        className={cn(
                          "hover:bg-gray-50/60",
                          hours.closed && "bg-gray-50/50",
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {day}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          {hours.closed ? "Closed" : hours.open}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          {hours.closed ? "Closed" : hours.close}
                        </td>
                        <td className="px-4 py-3">
                          {hours.closed ? (
                            <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                              Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Open
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Exception Dates Card */}
          <Card
            icon={CalendarDays}
            title="Exception Dates"
            ariaLabel="Exception Dates"
            badge={
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                {f.exceptionDates.length}
              </span>
            }
          >
            {f.exceptionDates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No exception dates configured.
              </p>
            ) : (
              <div className="space-y-3">
                {f.exceptionDates.map((exc) => (
                  <div
                    key={exc.id}
                    className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          {format(new Date(exc.date), "dd MMM yyyy")}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            exc.isFullDay
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-amber-100 text-amber-700 border border-amber-300",
                          )}
                        >
                          {exc.isFullDay ? "Full Day" : "Partial"}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {exc.reason}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Affects: {exc.affectedCourts}
                      </p>
                      {!exc.isFullDay && exc.startTime && exc.endTime && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Modified hours: {exc.startTime} - {exc.endTime}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pricing Card */}
          <Card icon={Banknote} title="Pricing" ariaLabel="Pricing">
            {f.pricing.length === 0 && f.subscriptionPlans.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Pricing not yet configured by the provider.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Per Session Pricing */}
                {f.pricing.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                      Per Session Pricing
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            {[
                              "Court",
                              "Slot Duration",
                              "Base Price",
                              "Peak Price",
                              "Off-Peak Price",
                              "Weekend Price",
                              "Peak Hours",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {f.pricing.map((pr) => (
                            <tr
                              key={pr.courtId}
                              className="hover:bg-gray-50/60"
                            >
                              <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                                {pr.courtName}
                              </td>
                              <td className="px-3 py-3 text-gray-600">
                                {pr.slotDuration} min
                              </td>
                              <td className="px-3 py-3 font-semibold text-gray-900 tabular-nums">
                                {pr.basePrice != null
                                  ? `${pr.currency} ${fmt(pr.basePrice)}`
                                  : "--"}
                              </td>
                              <td className="px-3 py-3 font-semibold text-amber-700 tabular-nums">
                                {pr.currency} {fmt(pr.peakPrice)}
                              </td>
                              <td className="px-3 py-3 font-semibold text-gray-700 tabular-nums">
                                {pr.currency} {fmt(pr.offPeakPrice)}
                              </td>
                              <td className="px-3 py-3 font-semibold text-gray-700 tabular-nums">
                                {pr.currency} {fmt(pr.weekendPrice)}
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-500 font-mono">
                                {pr.peakHoursStart && pr.peakHoursEnd
                                  ? `${pr.peakHoursStart} - ${pr.peakHoursEnd}`
                                  : "--"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Subscription Plans */}
                {f.subscriptionPlans.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                      Subscription Plans ({f.subscriptionPlans.length})
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            {[
                              "Plan Name",
                              "Type",
                              "Duration",
                              "Sessions",
                              "Price",
                              "Auto-Renew",
                              "Subscribers",
                              "Status",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {f.subscriptionPlans.map((plan) => (
                            <tr key={plan.id} className="hover:bg-gray-50/60">
                              <td className="px-3 py-3 font-medium text-gray-900">
                                {plan.planName}
                              </td>
                              <td className="px-3 py-3 text-gray-600">
                                {plan.planType}
                              </td>
                              <td className="px-3 py-3 text-gray-600">
                                {plan.duration}
                              </td>
                              <td className="px-3 py-3 text-center tabular-nums text-gray-700">
                                {plan.sessionsIncluded === "Unlimited"
                                  ? "Unlimited"
                                  : plan.sessionsIncluded}
                              </td>
                              <td className="px-3 py-3 font-bold text-gray-900 tabular-nums">
                                {plan.currency} {fmt(plan.price)}
                              </td>
                              <td className="px-3 py-3 text-center text-xs">
                                {plan.autoRenew ? (
                                  <span className="text-emerald-600 font-medium">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center tabular-nums font-semibold text-gray-900">
                                {plan.activeSubscribers}
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={cn(
                                    "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                                    plan.status === "Active"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-gray-100 text-gray-500",
                                  )}
                                >
                                  {plan.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Cancellation Policy Card */}
          <Card
            icon={ShieldCheck}
            title="Cancellation Policy"
            ariaLabel="Cancellation Policy"
          >
            {f.cancellationPolicy.tiers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Default platform cancellation policy applies.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Policy:{" "}
                  <strong className="text-gray-700">
                    {f.cancellationPolicy.policyName}
                  </strong>
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          Window
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          Refund
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {f.cancellationPolicy.tiers.map((tier, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">
                            {tier.window}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "font-bold tabular-nums",
                                tier.refundPercent === 100
                                  ? "text-emerald-600"
                                  : tier.refundPercent === 0
                                    ? "text-red-600"
                                    : "text-amber-600",
                              )}
                            >
                              {tier.refundPercent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400">
                  Platform fee refundable:{" "}
                  <strong className="text-gray-600">
                    {f.cancellationPolicy.platformFeeRefundable ? "Yes" : "No"}
                  </strong>
                </p>
              </div>
            )}
          </Card>

          {/* Facility Rules Card */}
          <Card icon={FileText} title="Rules" ariaLabel="Facility Rules">
            {f.facilityRules.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No facility-specific rules set.
              </p>
            ) : (
              <ul className="space-y-2">
                {f.facilityRules.map((rule, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ─── RIGHT COLUMN (40%) ─── */}
        <div className="col-span-2 space-y-5">
          {/* Provider Card */}
          <Card
            icon={Building2}
            title="Provider"
            ariaLabel="Provider Information"
          >
            <div className="space-y-3">
              <div>
                <span
                  className="text-sm font-semibold text-[#003B95] cursor-pointer hover:underline"
                  aria-label={`View provider profile for ${f.provider.name}`}
                >
                  {f.provider.name}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {f.provider.type}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <InfoRow
                  label="Provider ID"
                  value={
                    <span className="font-mono text-xs">{f.provider.id}</span>
                  }
                />
                <InfoRow
                  label="Person in Charge"
                  value={f.provider.personInCharge}
                />
                <InfoRow
                  label="PIC Contact"
                  value={
                    <span className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {f.provider.picContact}
                    </span>
                  }
                />
                <InfoRow
                  label="Email"
                  value={
                    <span className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3 text-gray-400" />
                      {f.provider.email}
                    </span>
                  }
                />
                <InfoRow
                  label="Phone"
                  value={
                    <span className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {f.provider.phone}
                    </span>
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        f.provider.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : f.provider.status === "Suspended"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {f.provider.status}
                    </span>
                  }
                />
              </div>
            </div>
          </Card>

          {/* Stats Card */}
          <Card
            icon={TrendingUp}
            title="Statistics"
            ariaLabel="Facility Statistics"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  Total Bookings
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {f.earnings.totalBookings}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  Active Bookings
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {f.earnings.activeBookings}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  Average Rating
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating rating={f.averageRating} />
                  <span className="text-sm font-bold text-gray-900">
                    {f.averageRating.toFixed(1)}
                  </span>
                </div>
                <p
                  className="text-[10px] text-gray-400 mt-0.5"
                  aria-label={`Rated ${f.averageRating} out of 5 stars based on ${f.totalReviews} reviews`}
                >
                  {f.totalReviews} review{f.totalReviews !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  Total Reviews
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {f.totalReviews}
                </p>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  Total Revenue
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {f.earnings.currency} {fmt(f.earnings.totalRevenue)}
                </p>
              </div>
            </div>
          </Card>

          {/* Earning Preview Card */}
          <Card
            icon={Banknote}
            title="Earning Preview"
            ariaLabel="Earning Preview"
          >
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 text-gray-700">
                        Gross (per session)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        {f.earnings.currency} {fmt(f.earnings.grossPerSession)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700">
                        Commission ({f.earnings.commissionPct}%)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600 tabular-nums">
                        - {f.earnings.currency}{" "}
                        {fmt(f.earnings.commissionAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700">
                        After Commission
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        {f.earnings.currency} {fmt(f.earnings.afterCommission)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700">
                        Tax ({f.earnings.taxPct}% of post-commission)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600 tabular-nums">
                        - {f.earnings.currency} {fmt(f.earnings.taxAmount)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td className="px-4 py-3 font-bold text-gray-900">
                        Net Payout
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 tabular-nums text-base">
                        {f.earnings.currency} {fmt(f.earnings.netPayout)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-400 italic">
                Preview based on current rates. Actual booking rates locked at
                booking time (Rule 69).
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Audit Trail (Full Width, Collapsible) ── */}
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        role="region"
        aria-label="Audit Trail"
      >
        <button
          onClick={() => setAuditOpen((o) => !o)}
          className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#003B95]/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[#003B95]" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Audit Trail</h2>
          </div>
          {auditOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {auditOpen && (
          <div className="p-5">
            {f.auditTrail.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No audit trail entries.
              </p>
            ) : (
              <div className="space-y-3">
                {f.auditTrail.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="text-xs text-gray-400 font-mono whitespace-nowrap w-40 shrink-0">
                      {format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm")}{" "}
                      UTC
                    </span>
                    <span className="text-gray-700 flex-1">{entry.event}</span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {entry.actor}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
