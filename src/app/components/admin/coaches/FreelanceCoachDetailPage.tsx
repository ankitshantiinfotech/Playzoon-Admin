// ─── SCR-ADM-028: Coach Detail (Admin Operations View) ──────────────────────
// Comprehensive read-only detail of a single freelance coach: personal details,
// professional details, availability, pricing, stats, wallet, verification docs,
// media gallery, recent bookings, reviews, and audit trail.

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { format, differenceInYears } from "date-fns";
import {
  ArrowLeft, Star, ChevronDown, ChevronUp,
  User, Calendar, Globe, Languages, FileText,
  Award, Clock, CreditCard, Wallet, ShieldCheck,
  ShieldX, AlertTriangle, ExternalLink, Image, Video,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  MOCK_FREELANCER_COACHES, getCoachFullName,
  type FreelancerCoach,
} from "../providers/components/freelancer-coach-data";

// ─── Mock extended data for Coach Detail ────────────────────────────────────

interface CoachDetail {
  // Inherited from base
  base: FreelancerCoach;
  // Personal
  languages: string[];
  bio: string;
  // Professional
  sports: { name: string; proficiency: string }[];
  specialities: string[];
  experience: number;
  qualifications: { name: string; issuingBody: string; year: number }[];
  // Availability
  availability: { day: string; available: boolean; start?: string; end?: string; maxSessions?: number }[];
  // Pricing
  pricing: {
    perSession: number;
    sessionDuration: number;
    package5?: number;
    package10?: number;
    trialSession?: number | "Free";
  } | null;
  // Stats
  stats: {
    totalBookings: number;
    activeBookings: number;
    completedSessions: number;
    cancellationRate: number;
    avgRating: number;
    totalReviews: number;
    totalEarnings: number;
  };
  // Wallet
  wallet: {
    currentBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    pendingPayout: number;
    payoutStatus: "No Pending Payout" | "Payout Requested" | "Processing";
  };
  // Verification docs
  verificationDocs: {
    docType: string;
    fileName: string;
    submittedDate: Date;
    status: "Approved" | "Rejected" | "Pending Review";
    reviewedBy?: string;
    rejectionReason?: string;
  }[];
  // Media
  media: {
    photos: { id: string; url: string; name: string }[];
    videos: { id: string; url: string; name: string }[];
    certificates: { id: string; url: string; name: string }[];
  };
  // Recent bookings
  recentBookings: {
    bookingId: string;
    playerName: string;
    bookingDate: Date;
    duration: number;
    amount: number;
    status: "Completed" | "Upcoming" | "Cancelled" | "Ongoing";
  }[];
  // Reviews
  reviews: {
    id: string;
    reviewerName: string;
    rating: number;
    text: string;
    date: Date;
  }[];
  ratingBreakdown: { stars: number; count: number }[];
  // Audit trail
  auditTrail: {
    id: string;
    timestamp: Date;
    event: string;
    actor: string;
    details?: string;
  }[];
}

function buildMockDetail(c: FreelancerCoach): CoachDetail {
  const hash = c.id.charCodeAt(c.id.length - 1) + c.id.charCodeAt(c.id.length - 2);
  const isApproved = c.verificationStatus === "Approved";
  const totalBookings = isApproved ? (hash % 80) + 10 : 0;
  const rating = isApproved ? Math.round((3.5 + (hash % 15) / 10) * 10) / 10 : 0;
  const totalReviews = isApproved ? hash % 50 + 1 : 0;
  const totalEarnings = isApproved ? totalBookings * (80 + hash % 120) : 0;

  return {
    base: c,
    languages: ["Arabic", "English", ...(hash % 3 === 0 ? ["Hindi"] : [])],
    bio: `Experienced ${c.specialization.toLowerCase()} coach with a passion for developing athletes at all levels. Specializes in technique improvement and competitive preparation. Committed to helping players achieve their full potential through personalized training programs.`,
    sports: [
      { name: c.specialization, proficiency: "Expert" },
      ...(hash % 3 === 0 ? [{ name: "Fitness & Conditioning", proficiency: "Intermediate" }] : []),
    ],
    specialities: [
      c.specialization === "Football" ? "Tactical Coaching" : c.specialization === "Tennis" ? "Serve Improvement" : "General Training",
      ...(hash % 4 === 0 ? ["Youth Development"] : []),
      ...(hash % 5 === 0 ? ["Competition Prep"] : []),
    ],
    experience: Math.max(1, (hash % 15) + 1),
    qualifications: isApproved ? [
      { name: `${c.specialization} Coaching Certificate`, issuingBody: "National Sports Authority", year: 2020 },
      ...(hash % 3 === 0 ? [{ name: "First Aid Level 2", issuingBody: "Red Crescent", year: 2021 }] : []),
    ] : [],
    availability: [
      { day: "Monday", available: true, start: "08:00", end: "18:00", maxSessions: 5 },
      { day: "Tuesday", available: true, start: "08:00", end: "18:00", maxSessions: 5 },
      { day: "Wednesday", available: hash % 2 === 0, start: hash % 2 === 0 ? "09:00" : undefined, end: hash % 2 === 0 ? "17:00" : undefined, maxSessions: hash % 2 === 0 ? 4 : undefined },
      { day: "Thursday", available: true, start: "08:00", end: "18:00", maxSessions: 5 },
      { day: "Friday", available: false },
      { day: "Saturday", available: true, start: "10:00", end: "16:00", maxSessions: 3 },
      { day: "Sunday", available: true, start: "10:00", end: "16:00", maxSessions: 3 },
    ],
    pricing: isApproved ? {
      perSession: 100 + hash % 150,
      sessionDuration: 60,
      package5: (100 + hash % 150) * 4.5,
      package10: (100 + hash % 150) * 8,
      trialSession: hash % 3 === 0 ? "Free" : 50,
    } : null,
    stats: {
      totalBookings,
      activeBookings: isApproved ? Math.min(totalBookings, hash % 5) : 0,
      completedSessions: isApproved ? totalBookings - (hash % 5) : 0,
      cancellationRate: isApproved ? Math.round((hash % 8) * 10) / 10 : 0,
      avgRating: rating,
      totalReviews,
      totalEarnings,
    },
    wallet: {
      currentBalance: isApproved ? Math.round((hash % 20) * 100 * 100) / 100 : 0,
      totalEarned: totalEarnings,
      totalWithdrawn: isApproved ? Math.round(totalEarnings * 0.7 * 100) / 100 : 0,
      pendingPayout: isApproved && hash % 4 === 0 ? Math.round((hash % 10) * 50 * 100) / 100 : 0,
      payoutStatus: isApproved && hash % 4 === 0 ? "Payout Requested" : "No Pending Payout",
    },
    verificationDocs: [
      {
        docType: "ID Document",
        fileName: `${c.firstName.toLowerCase()}_id_doc.pdf`,
        submittedDate: new Date(c.createdAt.getTime() + 86400000),
        status: isApproved ? "Approved" : c.verificationStatus === "Pending" ? "Pending Review" : "Rejected",
        reviewedBy: isApproved ? "Super Admin" : undefined,
        rejectionReason: c.verificationStatus === "Rejected" ? c.rejectionReason : undefined,
      },
      {
        docType: "Coaching Certificate",
        fileName: `${c.firstName.toLowerCase()}_coaching_cert.pdf`,
        submittedDate: new Date(c.createdAt.getTime() + 86400000 * 2),
        status: isApproved ? "Approved" : c.verificationStatus === "Pending" ? "Pending Review" : "Rejected",
        reviewedBy: isApproved ? "Super Admin" : undefined,
      },
    ],
    media: {
      photos: isApproved ? [
        { id: "p1", url: "#", name: "Training session 1" },
        { id: "p2", url: "#", name: "Training session 2" },
        { id: "p3", url: "#", name: "Facility photo" },
      ] : [],
      videos: isApproved && hash % 2 === 0 ? [
        { id: "v1", url: "#", name: "Introduction video" },
      ] : [],
      certificates: isApproved ? [
        { id: "c1", url: "#", name: "Coaching cert" },
      ] : [],
    },
    recentBookings: isApproved ? Array.from({ length: Math.min(5, totalBookings) }, (_, i) => ({
      bookingId: `BK-${1000 + i}`,
      playerName: ["Mohammed Ali", "Sarah Ahmed", "Khalid Omar", "Fatima Noor", "Deleted User"][i % 5],
      bookingDate: new Date(Date.now() - (i + 1) * 86400000 * 3),
      duration: 60,
      amount: 100 + hash % 150,
      status: (["Completed", "Upcoming", "Completed", "Cancelled", "Completed"] as const)[i % 5],
    })) : [],
    reviews: isApproved ? Array.from({ length: Math.min(5, totalReviews) }, (_, i) => ({
      id: `rev-${i}`,
      reviewerName: ["Mohammed Ali", "Sarah Ahmed", "Khalid Omar", "Fatima Noor", "Deleted User"][i % 5],
      rating: Math.min(5, Math.max(1, rating - (i % 3 === 0 ? 1 : 0) + (i % 2 === 0 ? 0.5 : 0))),
      text: `Great coaching experience. Very professional and knowledgeable. Highly recommend for anyone looking to improve their ${c.specialization.toLowerCase()} skills. The sessions are well-structured and focused.`,
      date: new Date(Date.now() - (i + 1) * 86400000 * 5),
    })) : [],
    ratingBreakdown: [
      { stars: 5, count: isApproved ? Math.ceil(totalReviews * 0.5) : 0 },
      { stars: 4, count: isApproved ? Math.ceil(totalReviews * 0.25) : 0 },
      { stars: 3, count: isApproved ? Math.ceil(totalReviews * 0.15) : 0 },
      { stars: 2, count: isApproved ? Math.ceil(totalReviews * 0.07) : 0 },
      { stars: 1, count: isApproved ? Math.ceil(totalReviews * 0.03) : 0 },
    ],
    auditTrail: [
      { id: "at-1", timestamp: c.createdAt, event: "Coach registered", actor: "System", details: "Self-registration via provider portal" },
      { id: "at-2", timestamp: new Date(c.createdAt.getTime() + 86400000), event: "Verification documents submitted", actor: getCoachFullName(c) },
      ...(c.verificationStatus === "Approved" ? [
        { id: "at-3", timestamp: new Date(c.createdAt.getTime() + 86400000 * 3), event: "Profile approved", actor: "Super Admin" },
        { id: "at-4", timestamp: new Date(c.createdAt.getTime() + 86400000 * 3), event: "Status changed to Active", actor: "System" },
      ] : []),
      ...(c.verificationStatus === "Rejected" ? [
        { id: "at-3", timestamp: new Date(c.createdAt.getTime() + 86400000 * 3), event: "Profile rejected", actor: "Super Admin", details: c.rejectionReason },
      ] : []),
      ...(c.accountStatus === "Locked" ? [
        { id: "at-5", timestamp: c.lockedAt ?? new Date(), event: "Account locked", actor: c.lockedBy ?? "System" },
      ] : []),
    ],
  };
}

// ─── Currency formatter ─────────────────────────────────────────────────────

function fmtCurrency(amount: number): string {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}

// ─── Card Component ─────────────────────────────────────────────────────────

function Card({ title, icon, children, ariaLabel }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; ariaLabel: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl" role="region" aria-label={ariaLabel}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <span className="text-[#6B7280]">{icon}</span>
        <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ─── Info Field ─────────────────────────────────────────────────────────────

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-[#111827]">{children}</dd>
    </div>
  );
}

// ─── Rating Stars ───────────────────────────────────────────────────────────

function RatingDisplay({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  if (reviewCount === 0) {
    return (
      <span className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="text-sm text-[#9CA3AF] ml-1">0 stars (0 reviews)</span>
      </span>
    );
  }
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`Rated ${rating} out of 5 stars based on ${reviewCount} reviews`}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />;
        if (i === full && half) {
          return (
            <span key={i} className="relative inline-block w-4 h-4">
              <Star className="w-4 h-4 text-gray-300 absolute inset-0" />
              <span className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </span>
            </span>
          );
        }
        return <Star key={i} className="w-4 h-4 text-gray-300" />;
      })}
      <span className="text-sm font-semibold text-[#111827] ml-1">{rating.toFixed(1)}</span>
      <span className="text-xs text-[#6B7280]">({reviewCount} reviews)</span>
    </span>
  );
}

// ─── Badge helpers ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Inactive: "bg-gray-100 text-gray-600 border-gray-200",
  Locked: "bg-red-100 text-red-800 border-red-200",
};

const VER_STYLES: Record<string, string> = {
  Verified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Unverified: "bg-gray-100 text-gray-600 border-gray-200",
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Upcoming: "bg-sky-100 text-sky-700 border-sky-200",
  Ongoing: "bg-amber-100 text-amber-700 border-amber-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
};

const DOC_STATUS_STYLES: Record<string, string> = {
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  "Pending Review": "bg-amber-100 text-amber-800 border-amber-200",
};

const PAYOUT_STATUS_STYLES: Record<string, string> = {
  "No Pending Payout": "bg-gray-100 text-gray-600 border-gray-200",
  "Payout Requested": "bg-blue-100 text-blue-700 border-blue-200",
  Processing: "bg-amber-100 text-amber-700 border-amber-200",
};

// ─── Main Component ─────────────────────────────────────────────────────────

export function FreelanceCoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const coachBase = MOCK_FREELANCER_COACHES.find(c => c.id === id);
  const [mediaTab, setMediaTab] = useState<"photos" | "videos" | "certificates">("photos");
  const [auditExpanded, setAuditExpanded] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  // ── 404 State ──
  if (!coachBase) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">Coach Not Found</h1>
          <p className="text-sm text-[#6B7280] max-w-sm">
            The coach you are looking for does not exist or the ID may be invalid.
          </p>
          <Button variant="outline" onClick={() => navigate("/coaches")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Coaches
          </Button>
        </div>
      </div>
    );
  }

  const detail = buildMockDetail(coachBase);
  const c = detail.base;
  const fullName = getCoachFullName(c);
  const age = differenceInYears(new Date(), c.dob);

  const verStatusLabel = c.verificationStatus === "Approved" ? "Verified" : c.verificationStatus === "Pending" ? "Pending" : "Unverified";
  const statusLabel = c.accountStatus === "Locked" ? "Locked" : c.platformStatus;

  const toggleReview = (id: string) => {
    setExpandedReviews(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]" role="main" aria-label="Coach Detail">

      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280]">
        <span className="hover:text-[#003B95] cursor-pointer" onClick={() => navigate("/")}>Dashboard</span>
        <span className="mx-2">/</span>
        <span className="hover:text-[#003B95] cursor-pointer" onClick={() => navigate("/coaches")}>Coaches</span>
        <span className="mx-2">/</span>
        <span className="text-[#111827] font-medium">{fullName}</span>
      </nav>

      {/* ── Profile Header ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#003B95]/10 flex items-center justify-center text-[#003B95] text-2xl font-bold shrink-0"
            role="img" aria-label={`Initials for ${fullName}`}>
            {c.firstName[0]}{c.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-[#111827]">{fullName}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className={cn("text-xs border", STATUS_STYLES[statusLabel])}>
                    {statusLabel}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs border gap-1", VER_STYLES[verStatusLabel])}>
                    {verStatusLabel === "Verified" && <ShieldCheck className="w-3 h-3" />}
                    {verStatusLabel === "Unverified" && <ShieldX className="w-3 h-3" />}
                    {verStatusLabel === "Pending" && <Clock className="w-3 h-3" />}
                    {verStatusLabel}
                  </Badge>
                </div>
                {/* Sport chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {detail.sports.map(s => (
                    <Badge key={s.name} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {s.name}
                    </Badge>
                  ))}
                  {detail.specialities.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs bg-gray-50 text-gray-600 border border-gray-200">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 text-[#003B95] hover:text-[#002d73]"
                aria-label="Edit coach profile in Provider Management"
                onClick={() => navigate(`/providers/coach/${c.id}/edit`)}>
                <ExternalLink className="h-3.5 w-3.5" /> Edit in Provider Management
              </Button>
            </div>
          </div>
        </div>

        {/* Inactive/Locked banners */}
        {c.platformStatus === "Inactive" && c.accountStatus !== "Locked" && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
            This coach is currently inactive and hidden from player-facing listings.
          </div>
        )}
        {c.accountStatus === "Locked" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            This coach account is locked.{c.lockedBy && ` Locked by ${c.lockedBy}.`}
          </div>
        )}
      </div>

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-5 gap-6">
        {/* ── Left Column (60%) ── */}
        <div className="col-span-3 space-y-6">

          {/* Personal Details */}
          <Card title="Personal Details" icon={<User className="w-4 h-4" />} ariaLabel="Personal Details">
            <dl className="grid grid-cols-2 gap-4">
              <InfoField label="Full Name">{fullName}</InfoField>
              <InfoField label="Date of Birth">{format(c.dob, "dd MMM yyyy")} ({age} years)</InfoField>
              <InfoField label="Gender">{c.gender}</InfoField>
              <InfoField label="Nationality">{c.nationality}</InfoField>
              <InfoField label="Languages">{detail.languages.join(", ")}</InfoField>
            </dl>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <dt className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">About Me / Bio</dt>
              <dd className="text-sm text-[#374151] leading-relaxed">
                {detail.bio || "No bio provided."}
              </dd>
            </div>
          </Card>

          {/* Professional Details */}
          <Card title="Professional Details" icon={<Award className="w-4 h-4" />} ariaLabel="Professional Details">
            <dl className="grid grid-cols-2 gap-4">
              <InfoField label="Sports">
                <div className="space-y-1">
                  {detail.sports.map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span>{s.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{s.proficiency}</Badge>
                    </div>
                  ))}
                </div>
              </InfoField>
              <InfoField label="Specialities">
                {detail.specialities.join(", ")}
              </InfoField>
              <InfoField label="Experience">{detail.experience} years of coaching experience</InfoField>
            </dl>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <dt className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Qualifications</dt>
              {detail.qualifications.length > 0 ? (
                <div className="space-y-2">
                  {detail.qualifications.map((q, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <Award className="w-4 h-4 text-[#6B7280] shrink-0" />
                      <div>
                        <span className="font-medium text-[#111827]">{q.name}</span>
                        <span className="text-[#6B7280]"> -- {q.issuingBody}, {q.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <dd className="text-sm text-[#9CA3AF]">No qualifications listed.</dd>
              )}
            </div>
          </Card>

          {/* Availability */}
          <Card title="Availability" icon={<Calendar className="w-4 h-4" />} ariaLabel="Availability Schedule">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[#6B7280] uppercase border-b">
                    <th className="text-left py-2 pr-4">Day</th>
                    <th className="text-left py-2 pr-4">Available</th>
                    <th className="text-left py-2 pr-4">Start</th>
                    <th className="text-left py-2 pr-4">End</th>
                    <th className="text-left py-2">Max Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detail.availability.map(a => (
                    <tr key={a.day}>
                      <td className="py-2 pr-4 font-medium text-[#111827]">{a.day}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className={cn("text-xs border",
                          a.available ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"
                        )}>
                          {a.available ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-[#6B7280]">{a.available ? `${a.start} UTC` : "--"}</td>
                      <td className="py-2 pr-4 text-[#6B7280]">{a.available ? `${a.end} UTC` : "--"}</td>
                      <td className="py-2 text-[#6B7280]">{a.available ? a.maxSessions : "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pricing */}
          <Card title="Pricing" icon={<CreditCard className="w-4 h-4" />} ariaLabel="Pricing">
            {detail.pricing ? (
              <dl className="grid grid-cols-2 gap-4">
                <InfoField label="Per Session Rate">{fmtCurrency(detail.pricing.perSession)} / session</InfoField>
                <InfoField label="Session Duration">{detail.pricing.sessionDuration} minutes</InfoField>
                {detail.pricing.package5 && (
                  <InfoField label="5-Session Package">{fmtCurrency(detail.pricing.package5)}</InfoField>
                )}
                {detail.pricing.package10 && (
                  <InfoField label="10-Session Package">{fmtCurrency(detail.pricing.package10)}</InfoField>
                )}
                <InfoField label="Trial Session">
                  {detail.pricing.trialSession === "Free" ? "Free Trial Available" : detail.pricing.trialSession ? fmtCurrency(detail.pricing.trialSession) : "Not offered"}
                </InfoField>
              </dl>
            ) : (
              <p className="text-sm text-[#9CA3AF]">Pricing not yet configured.</p>
            )}
          </Card>
        </div>

        {/* ── Right Column (40%) ── */}
        <div className="col-span-2 space-y-6">

          {/* Stats Summary */}
          <Card title="Statistics" icon={<Star className="w-4 h-4" />} ariaLabel="Coach Statistics">
            <dl className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[#6B7280]">Total Bookings</dt>
                <dd className="font-semibold text-[#111827]">{detail.stats.totalBookings}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[#6B7280]">Active Bookings</dt>
                <dd className="font-semibold text-[#111827]">{detail.stats.activeBookings}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[#6B7280]">Completed Sessions</dt>
                <dd className="font-semibold text-[#111827]">{detail.stats.completedSessions}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[#6B7280]">Cancellation Rate</dt>
                <dd className="font-semibold text-[#111827]">{detail.stats.cancellationRate}%</dd>
              </div>
              <div className="border-t pt-3 mt-3">
                <dt className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">Average Rating</dt>
                <dd><RatingDisplay rating={detail.stats.avgRating} reviewCount={detail.stats.totalReviews} /></dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[#6B7280]">Total Reviews</dt>
                <dd className="font-semibold text-[#111827]">{detail.stats.totalReviews}</dd>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <dt className="text-[#6B7280]">Total Earnings</dt>
                <dd className="font-semibold text-emerald-700">{fmtCurrency(detail.stats.totalEarnings)}</dd>
              </div>
            </dl>
          </Card>

          {/* Wallet Summary */}
          <Card title="Wallet Summary" icon={<Wallet className="w-4 h-4" />} ariaLabel="Wallet Summary">
            <dl className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[#6B7280]">Current Balance</dt>
                <dd className="font-semibold text-[#111827]">{fmtCurrency(detail.wallet.currentBalance)}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[#6B7280]">Total Earned</dt>
                <dd className="font-semibold text-[#111827]">{fmtCurrency(detail.wallet.totalEarned)}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[#6B7280]">Total Withdrawn</dt>
                <dd className="font-semibold text-[#111827]">{fmtCurrency(detail.wallet.totalWithdrawn)}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[#6B7280]">Pending Payout</dt>
                <dd className="font-semibold text-[#111827]">{fmtCurrency(detail.wallet.pendingPayout)}</dd>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <dt className="text-[#6B7280]">Payout Status</dt>
                <dd>
                  <Badge variant="outline" className={cn("text-xs border", PAYOUT_STATUS_STYLES[detail.wallet.payoutStatus])}>
                    {detail.wallet.payoutStatus}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          {/* Verification Documents */}
          <Card title="Verification Documents" icon={<FileText className="w-4 h-4" />} ariaLabel="Verification Documents">
            {detail.verificationDocs.length > 0 ? (
              <div className="space-y-3">
                {detail.verificationDocs.map((doc, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{doc.docType}</p>
                        <p className="text-xs text-[#6B7280]">{doc.fileName}</p>
                        <p className="text-xs text-[#6B7280]">Submitted: {format(doc.submittedDate, "dd MMM yyyy")}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-xs border shrink-0", DOC_STATUS_STYLES[doc.status])}>
                        {doc.status}
                      </Badge>
                    </div>
                    {doc.reviewedBy && (
                      <p className="text-xs text-[#6B7280]">Reviewed by: {doc.reviewedBy}</p>
                    )}
                    {doc.rejectionReason && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
                        Reason: {doc.rejectionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF]">No verification documents submitted.</p>
            )}
          </Card>
        </div>
      </div>

      {/* ── Full Width Sections ── */}

      {/* Media Gallery */}
      <Card title="Media" icon={<Image className="w-4 h-4" />} ariaLabel="Coach Media">
        {(detail.media.photos.length + detail.media.videos.length + detail.media.certificates.length) > 0 ? (
          <div>
            {/* Tabs */}
            <div className="flex gap-4 mb-4 border-b" role="tablist">
              {([
                { key: "photos" as const, label: `Photos (${detail.media.photos.length}/10)`, icon: Image },
                { key: "videos" as const, label: `Videos (${detail.media.videos.length}/3)`, icon: Video },
                { key: "certificates" as const, label: `Certificates (${detail.media.certificates.length}/5)`, icon: FileText },
              ]).map(tab => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={mediaTab === tab.key}
                  onClick={() => setMediaTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 pb-2 px-1 text-sm font-medium border-b-2 transition-colors",
                    mediaTab === tab.key
                      ? "border-[#003B95] text-[#003B95]"
                      : "border-transparent text-[#6B7280] hover:text-[#111827]"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Content */}
            <div role="tabpanel" className="grid grid-cols-4 gap-3">
              {mediaTab === "photos" && (detail.media.photos.length > 0 ? detail.media.photos.map(p => (
                <div key={p.id} className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-300" />
                </div>
              )) : <p className="col-span-4 text-sm text-[#9CA3AF]">No photos uploaded.</p>)}
              {mediaTab === "videos" && (detail.media.videos.length > 0 ? detail.media.videos.map(v => (
                <div key={v.id} className="aspect-video bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center col-span-2">
                  <Video className="w-8 h-8 text-gray-300" />
                </div>
              )) : <p className="col-span-4 text-sm text-[#9CA3AF]">No videos uploaded.</p>)}
              {mediaTab === "certificates" && (detail.media.certificates.length > 0 ? detail.media.certificates.map(cert => (
                <div key={cert.id} className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
              )) : <p className="col-span-4 text-sm text-[#9CA3AF]">No certificates uploaded.</p>)}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#9CA3AF]">No media uploaded.</p>
        )}
      </Card>

      {/* Recent Bookings */}
      <Card title={`Recent Bookings (${detail.recentBookings.length})`} icon={<CreditCard className="w-4 h-4" />} ariaLabel="Recent Bookings">
        {detail.recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Recent Bookings">
              <thead>
                <tr className="text-xs text-[#6B7280] uppercase border-b">
                  <th className="text-left py-2 pr-4 w-[120px]">Booking ID</th>
                  <th className="text-left py-2 pr-4 w-[150px]">Player</th>
                  <th className="text-left py-2 pr-4 w-[140px]">Date</th>
                  <th className="text-left py-2 pr-4 w-[80px]">Duration</th>
                  <th className="text-left py-2 pr-4 w-[100px]">Amount</th>
                  <th className="text-left py-2 w-[110px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.recentBookings.map(b => (
                  <tr key={b.bookingId} className="hover:bg-gray-50/50">
                    <td className="py-2 pr-4">
                      <span className="text-[#003B95] font-medium hover:underline cursor-pointer text-xs"
                        onClick={() => navigate(`/bookings/${b.bookingId}`)}>
                        {b.bookingId}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-[#111827]">
                      {b.playerName === "Deleted User" ? <span className="text-[#9CA3AF] italic">Deleted User</span> : b.playerName}
                    </td>
                    <td className="py-2 pr-4 text-[#6B7280] text-xs">{format(b.bookingDate, "dd MMM yyyy, HH:mm")} UTC</td>
                    <td className="py-2 pr-4 text-[#6B7280]">{b.duration} min</td>
                    <td className="py-2 pr-4 text-[#111827]">{fmtCurrency(b.amount)}</td>
                    <td className="py-2">
                      <Badge variant="outline" className={cn("text-xs border", BOOKING_STATUS_STYLES[b.status])}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#111827]">No Bookings Yet</p>
            <p className="text-xs text-[#6B7280] mt-1">This coach has not received any bookings.</p>
          </div>
        )}
      </Card>

      {/* Reviews Summary */}
      <Card title={`Reviews (${detail.stats.totalReviews})`} icon={<Star className="w-4 h-4" />} ariaLabel="Reviews Summary">
        {detail.stats.totalReviews > 0 ? (
          <div className="space-y-6">
            {/* Rating breakdown */}
            <div className="space-y-2">
              {detail.ratingBreakdown.map(r => {
                const pct = detail.stats.totalReviews > 0 ? (r.count / detail.stats.totalReviews) * 100 : 0;
                return (
                  <div key={r.stars} className="flex items-center gap-3">
                    <span className="text-xs text-[#6B7280] w-12">{r.stars} star</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-[#6B7280] w-16 text-right">{r.count} ({Math.round(pct)}%)</span>
                  </div>
                );
              })}
            </div>

            {/* Recent reviews */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-xs text-[#6B7280] uppercase tracking-wide">Recent Reviews</h4>
              {detail.reviews.map(rev => {
                const isExpanded = expandedReviews.has(rev.id);
                const isLong = rev.text.length > 200;
                const displayText = isLong && !isExpanded ? rev.text.slice(0, 200) + "..." : rev.text;
                return (
                  <div key={rev.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#111827]">
                        {rev.reviewerName === "Deleted User" ? <span className="text-[#9CA3AF] italic">Deleted User</span> : rev.reviewerName}
                      </span>
                      <span className="text-xs text-[#6B7280]">{format(rev.date, "dd MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn("w-3.5 h-3.5", i < Math.round(rev.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
                      ))}
                      <span className="text-xs text-[#111827] ml-1 font-medium">{rev.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed">{displayText}</p>
                    {isLong && (
                      <button onClick={() => toggleReview(rev.id)} className="text-xs text-[#003B95] hover:underline">
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                );
              })}
              <button className="text-xs text-[#003B95] hover:underline font-medium">
                View All Reviews
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-[#9CA3AF]">No reviews yet.</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 5 }, (_, i) => <Star key={i} className="w-4 h-4 text-gray-300" />)}
            </div>
          </div>
        )}
      </Card>

      {/* Audit Trail */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" role="region" aria-label="Audit Trail">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setAuditExpanded(v => !v)}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#6B7280]" />
            <span className="text-sm font-semibold text-[#111827]">Audit Trail</span>
            <Badge variant="secondary" className="text-xs">{detail.auditTrail.length}</Badge>
          </div>
          {auditExpanded ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
        </button>
        {auditExpanded && (
          <div className="px-5 pb-4 space-y-3">
            {[...detail.auditTrail].reverse().map(entry => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-[#003B95] mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-[#111827]">{entry.event}</p>
                    <span className="text-xs text-[#6B7280] whitespace-nowrap">{format(entry.timestamp, "dd MMM yyyy, HH:mm")} UTC</span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    By: {entry.actor}
                    {entry.details && ` -- ${entry.details}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
