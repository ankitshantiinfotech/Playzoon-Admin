import {
  getTrainingProviderDetail,
  type TrainingProviderDetail,
  type AssignedFacility,
  type FacilityRequest,
  type ProviderCoach,
} from "./training-provider-detail-data";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  PhoneCall,
  Calendar,
  Building2,
  Users,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Maximize2,
  FileSpreadsheet,
  File as FileIcon,
  ImageIcon,
  User,
  Clock,
  ClipboardList,
  CreditCard,
  Inbox,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Skeleton } from "../../../ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import { DocumentLightbox } from "./DocumentLightbox";
import { FacilityAssignment } from "./FacilityAssignment";
import { FacilityRequests } from "./FacilityRequests";
import { CoachManagement } from "./CoachManagement";
import { AccountLockStatusCard } from "../components/AccountLockStatusCard";
import { adminService } from "@/services/admin.service";
import { BankDetailsCard } from "../components/BankDetailsCard";
import { ProviderAuditTrailTable } from "../components/ProviderAuditTrailTable";

// ─── Verification badge ──────────────────────────────────────

const VERIFICATION_STYLES = {
  Pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  Approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Rejected: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

function VerificationBadge({ status }: { status: string }) {
  const s =
    VERIFICATION_STYLES[status as keyof typeof VERIFICATION_STYLES] ||
    VERIFICATION_STYLES.Pending;
  return (
    <Badge
      variant="outline"
      className={cn("text-xs gap-1.5 border", s.bg, s.text, s.border)}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {status}
    </Badge>
  );
}

// ─── Document file icon ──────────────────────────────────────

function DocIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "pdf":
      return <FileText className={cn("text-red-500", className)} />;
    case "image":
      return <ImageIcon className={cn("text-blue-500", className)} />;
    case "xls":
      return <FileSpreadsheet className={cn("text-emerald-500", className)} />;
    case "doc":
      return <FileIcon className={cn("text-blue-400", className)} />;
    default:
      return <FileIcon className={cn("text-gray-400", className)} />;
  }
}

// ─── Collapsible Section ─────────────────────────────────────

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  badge,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-lg bg-[#003B95]/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-[#003B95]" />
        </div>
        <span className="text-sm text-[#111827] flex-1">{title}</span>
        {badge}
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

// ─── Profile Field ───────────────────────────────────────────

function ProfileField({
  icon: Icon,
  label,
  value,
  href,
  type,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined;
  href?: string;
  type?: "email" | "phone";
}) {
  if (!value) return null;

  const content = href ? (
    <a
      href={href}
      className="text-sm text-[#003B95] hover:underline break-all"
      target={type === "email" ? undefined : undefined}
    >
      {value}
    </a>
  ) : (
    <span className="text-sm text-[#111827] break-all">{value}</span>
  );

  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        {content}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-9 rounded-lg" />
        <Skeleton className="h-6 w-64" />
      </div>
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Training Provider Detail Page
// ═══════════════════════════════════════════════════════════════

// ─── Detail Tab config (SCR-ADM-007) ────────────────────────

type ProviderDetailTab =
  | "profile"
  | "documents"
  | "account"
  | "bank"
  | "facilities"
  | "coaches"
  | "audit";

const PROVIDER_DETAIL_TABS: {
  key: ProviderDetailTab;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "profile", label: "Profile Information", icon: User },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "account", label: "Account & Verification", icon: ShieldCheck },
  { key: "bank", label: "Bank Details", icon: CreditCard },
  { key: "facilities", label: "Assigned Facilities", icon: Building2 },
  { key: "coaches", label: "Coach Profiles", icon: Users },
  { key: "audit", label: "Audit Trail", icon: ClipboardList },
];

export function TrainingProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<TrainingProviderDetail | null>(null);
  const [activeDetailTab, setActiveDetailTab] =
    useState<ProviderDetailTab>("profile");

  // Reset to profile tab if current tab is hidden for pending providers
  useEffect(() => {
    if (provider && provider.verificationStatus === "Pending") {
      const hiddenTabs: ProviderDetailTab[] = ["bank", "facilities", "coaches"];
      if (hiddenTabs.includes(activeDetailTab)) {
        setActiveDetailTab("profile");
      }
    }
  }, [provider, activeDetailTab]);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      if (id) {
        const data = getTrainingProviderDetail(id);
        setProvider(data);
      }
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [id]);

  // ── Facility handlers ────────────────────────
  const handleAssignFacility = useCallback((facility: AssignedFacility) => {
    setProvider((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assignedFacilities: [...prev.assignedFacilities, facility],
      };
    });
  }, []);

  const handleRemoveFacility = useCallback((facilityId: string) => {
    setProvider((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assignedFacilities: prev.assignedFacilities.filter(
          (f) => f.id !== facilityId,
        ),
      };
    });
  }, []);

  // ── Facility request handlers ─────────────────
  const handleUpdateFacilityRequest = useCallback(
    (updated: FacilityRequest) => {
      setProvider((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          facilityRequests: prev.facilityRequests.map((r) =>
            r.id === updated.id ? updated : r,
          ),
        };
      });
    },
    [],
  );

  // ── Coach handlers ───────────────────────────
  const handleAddCoach = useCallback((coach: ProviderCoach) => {
    setProvider((prev) => {
      if (!prev) return prev;
      return { ...prev, coaches: [...prev.coaches, coach] };
    });
  }, []);

  const handleUpdateCoach = useCallback((updated: ProviderCoach) => {
    setProvider((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        coaches: prev.coaches.map((c) => (c.id === updated.id ? updated : c)),
      };
    });
  }, []);

  const handleDeleteCoach = useCallback((coachId: string) => {
    setProvider((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        coaches: prev.coaches.filter((c) => c.id !== coachId),
      };
    });
  }, []);

  // ── Open lightbox ────────────────────────────
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // ── Unlock handler ───────────────────────────
  const handleUnlock = async () => {
    if (!provider) return;
    await adminService.updateProvider(provider.id, { is_locked: false });
    setProvider((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        accountStatus: "Unlocked",
        lockedAt: undefined,
        lockedBy: undefined,
      };
    });
  };

  // ── Loading / Not found ──────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <DetailSkeleton />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <Users className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg text-gray-500">Provider not found</p>
          <p className="text-sm text-gray-400 mt-1">
            The provider with ID "{id}" does not exist.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => navigate("/providers")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Providers
          </Button>
        </div>
      </div>
    );
  }

  const isLocked = provider.accountStatus === "Locked";
  const hasLandline = !!provider.landline;
  const isPending = provider.verificationStatus === "Pending";

  // Tabs hidden during onboarding (Pending status)
  const ONBOARDING_HIDDEN_TABS: Set<ProviderDetailTab> = new Set([
    "bank",
    "facilities",
    "coaches",
  ]);
  const visibleTabs = isPending
    ? PROVIDER_DETAIL_TABS.filter((tab) => !ONBOARDING_HIDDEN_TABS.has(tab.key))
    : PROVIDER_DETAIL_TABS;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Back Navigation ────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-9 shrink-0"
          onClick={() => navigate("/providers")}
          aria-label="Back to providers list"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="text-xl text-[#111827] tracking-tight truncate max-w-lg">
                  {provider.clubName}
                </h1>
              </TooltipTrigger>
              {provider.clubName.length > 50 && (
                <TooltipContent side="bottom" className="max-w-sm">
                  {provider.clubName}
                </TooltipContent>
              )}
            </Tooltip>
            <VerificationBadge status={provider.verificationStatus} />
            <Badge
              variant="outline"
              className="text-[10px] text-gray-500 border-gray-200"
            >
              {provider.id}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Training Provider &middot; Registered{" "}
            {format(provider.createdAt, "dd MMM yyyy")}
          </p>
        </div>
      </div>

      {/* ── Tab Bar (SCR-ADM-007) ────────────────────── */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav
          className="-mb-px flex space-x-6 min-w-max"
          aria-label="Provider detail tabs"
        >
          {visibleTabs.map((tab) => {
            const isActive = activeDetailTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveDetailTab(tab.key)}
                className={cn(
                  "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2",
                  isActive
                    ? "border-[#003B95] text-[#003B95]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab Content ──────────────────────────────── */}

      {activeDetailTab === "profile" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <Avatar className="h-20 w-20 rounded-2xl">
                {provider.profilePhotoUrl ? (
                  <AvatarImage
                    src={provider.profilePhotoUrl}
                    alt={provider.firstName}
                    className="rounded-2xl"
                  />
                ) : null}
                <AvatarFallback className="rounded-2xl bg-[#003B95]/10 text-[#003B95] text-xl">
                  {provider.firstName[0]}
                  {provider.lastName[0] || ""}
                </AvatarFallback>
              </Avatar>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  provider.platformStatus === "Active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-500 border-gray-200",
                )}
              >
                {provider.platformStatus}
              </Badge>
            </div>

            {/* Fields Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 min-w-0">
              <ProfileField
                icon={User}
                label="First Name"
                value={provider.firstName}
              />
              <ProfileField
                icon={User}
                label="Last Name"
                value={provider.lastName}
              />
              <ProfileField
                icon={Mail}
                label="Email"
                value={provider.email}
                href={`mailto:${provider.email}`}
                type="email"
              />
              <ProfileField
                icon={Phone}
                label="Mobile Number"
                value={provider.mobile}
                href={`tel:${provider.mobile}`}
                type="phone"
              />
              <ProfileField
                icon={Calendar}
                label="Date of Incorporation"
                value={format(provider.dateOfIncorporation, "dd/MM/yyyy")}
              />
              {hasLandline && (
                <ProfileField
                  icon={PhoneCall}
                  label="Landline"
                  value={provider.landline}
                  href={`tel:${provider.landline}`}
                  type="phone"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {activeDetailTab === "documents" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#111827]">
              Official Documents
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] text-gray-500 border-gray-200"
            >
              {provider.documents.length} file
              {provider.documents.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {provider.documents.map((doc, idx) => (
              <div
                key={doc.id}
                className="group relative flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-[#003B95]/30 hover:bg-[#003B95]/[0.02] transition-all"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    doc.fileType === "pdf"
                      ? "bg-red-50"
                      : doc.fileType === "image"
                        ? "bg-blue-50"
                        : doc.fileType === "xls"
                          ? "bg-emerald-50"
                          : "bg-gray-50",
                  )}
                >
                  <DocIcon type={doc.fileType} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#111827] truncate">{doc.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {doc.size} &middot; {format(doc.uploadedAt, "dd MMM yyyy")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                  onClick={() => openLightbox(idx)}
                  aria-label={`View ${doc.name} full screen`}
                >
                  <Maximize2 className="h-3.5 w-3.5 text-[#003B95]" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeDetailTab === "account" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">
                Verification Status
              </p>
              <VerificationBadge status={provider.verificationStatus} />
              {provider.verificationStatus === "Rejected" && (
                <p className="text-xs text-red-500 mt-2">
                  This provider's application has been rejected.
                </p>
              )}
            </div>
            <AccountLockStatusCard
              providerName={provider.clubName}
              lockInfo={{
                accountStatus: provider.accountStatus,
                lockedAt: provider.lockedAt,
                lockedBy: provider.lockedBy,
              }}
              onUnlock={handleUnlock}
            />
            <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">
                Platform Status
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  provider.platformStatus === "Active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-500 border-gray-200",
                )}
              >
                {provider.platformStatus}
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">
                Created
              </p>
              <p className="text-sm text-[#111827]">
                {format(provider.createdAt, "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeDetailTab === "bank" && (
        <BankDetailsCard bankAccount={provider.bankDetails} />
      )}

      {activeDetailTab === "facilities" && (
        <div className="space-y-6">
          {/* Assigned Facilities */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#111827]">
                Assigned Facilities
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] text-gray-500 border-gray-200"
              >
                {provider.assignedFacilities.length}
              </Badge>
            </div>
            <FacilityAssignment
              assignedFacilities={provider.assignedFacilities}
              providerName={provider.clubName}
              onAssign={handleAssignFacility}
              onRemove={handleRemoveFacility}
            />
          </div>

          {/* Facility Requests */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[#111827]">
                  Facility Requests
                </h3>
                {provider.facilityRequests.filter((r) => r.status === "Pending")
                  .length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {
                      provider.facilityRequests.filter(
                        (r) => r.status === "Pending",
                      ).length
                    }{" "}
                    pending
                  </Badge>
                )}
              </div>
              <Badge
                variant="outline"
                className="text-[10px] text-gray-500 border-gray-200"
              >
                {provider.facilityRequests.length}
              </Badge>
            </div>
            <FacilityRequests
              facilityRequests={provider.facilityRequests}
              onUpdateRequest={handleUpdateFacilityRequest}
            />
          </div>
        </div>
      )}

      {activeDetailTab === "coaches" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#111827]">
              Coach Profiles
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] text-gray-500 border-gray-200"
            >
              {provider.coaches.length}
            </Badge>
          </div>
          <CoachManagement
            coaches={provider.coaches}
            onAdd={handleAddCoach}
            onUpdate={handleUpdateCoach}
            onDelete={handleDeleteCoach}
            providerId={provider.id}
          />
        </div>
      )}

      {activeDetailTab === "audit" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <ProviderAuditTrailTable
            providerId={provider.id}
            title="Change History"
            compact
          />
        </div>
      )}

      {/* ── Document Lightbox ─────────────────────── */}
      <DocumentLightbox
        documents={provider.documents}
        activeIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onChangeIndex={setLightboxIndex}
      />
    </div>
  );
}
