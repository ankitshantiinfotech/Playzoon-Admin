import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { format, differenceInYears, isBefore, startOfToday, isAfter } from "date-fns";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import {
  ArrowLeft, Copy, Check, Lock, Mail, Phone, Calendar,
  Shield, Search, X, RefreshCw,
  CheckCircle2, XCircle, Info, AlertTriangle, Eye, Upload, User, MapPin, Globe, Bell,
  Briefcase, Heart, Languages, Lock as LockIcon, Unlock,
  CreditCard, Wallet, Trophy, Users, ChevronUp, ChevronDown, Pencil,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
import { Textarea } from "../../ui/textarea";
import { Separator } from "../../ui/separator";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../../ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar as CalendarPicker } from "../../ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { StatusPill } from "./components/StatusPill";
import { AddressesTab } from "./AddressesTab";
import { DependentsTab } from "./DependentsTab";
import type { PlayerStatus } from "./player-data";
import {
  getPlayerDetail, getPlayerAddresses, getPlayerDependents, getDetailAuditEvents,
  getPlayerSavedCards, getPlayerBookings, getPlayerWalletTransactions,
  getPlayerTournaments, getPlayerFriends,
  GENDER_OPTIONS, COUNTRIES,
  type PlayerDetail, type PlayerAddress, type PlayerDependent, type DetailAuditEvent,
  type SavedCard, type PlayerBooking, type WalletTransaction,
  type PlayerTournament, type PlayerFriend,
} from "./player-detail-data";

// ─── Banner ──────────────────────────────────────────────────
type BannerType = "success" | "error" | "info" | "warning";
interface BannerState { type: BannerType; message: string; visible: boolean; }
const BANNER_STYLES: Record<BannerType, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: CheckCircle2 },
  error:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     icon: XCircle },
  info:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    icon: Info },
  warning: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   icon: AlertTriangle },
};

// ─── Main Component ──────────────────────────────────────────
export function PlayerDetailPage() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = routeId || "P-104392";

  // ── Player state ──────────────────────────────────────
  const [player, setPlayer] = useState<PlayerDetail>(() => getPlayerDetail(id));
  const [addresses, setAddresses] = useState<PlayerAddress[]>(() => getPlayerAddresses(id));
  const [dependents, setDependents] = useState<PlayerDependent[]>(() => getPlayerDependents(id));
  const [auditEvents, setAuditEvents] = useState<DetailAuditEvent[]>(() => getDetailAuditEvents(id));
  const [savedCards] = useState<SavedCard[]>(() => getPlayerSavedCards(id));
  const [bookings] = useState<PlayerBooking[]>(() => getPlayerBookings(id));
  const [walletTransactions] = useState<WalletTransaction[]>(() => getPlayerWalletTransactions(id));
  const [tournaments] = useState<PlayerTournament[]>(() => getPlayerTournaments(id));
  const [friends] = useState<PlayerFriend[]>(() => getPlayerFriends(id));
  const [isLoadingApi, setIsLoadingApi] = useState(true);

  // Fetch from real API and merge with detail data
  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.getPlayer(id);
        // adminService returns r.data = { success, data: { player fields }, message }
        const data = res?.data || res;
        if (!data || !data.id) throw new Error('Player not found');
        // Map API response to PlayerDetail shape, merging with defaults
        setPlayer((prev) => ({
          ...prev,
          id: data.id || prev.id,
          firstName: data.first_name || data.first_name_en || prev.firstName,
          lastName: data.last_name || data.last_name_en || prev.lastName,
          email: data.email || prev.email,
          phone: data.phone || data.mobile || prev.phone,
          gender: data.gender || prev.gender,
          dateOfBirth: data.date_of_birth || prev.dateOfBirth,
          nationality: data.nationality?.name_en || data.nationality || prev.nationality,
          status: (data.status === "active" ? "Active" : data.status === "locked" ? "Locked" : "Inactive") as PlayerStatus,
          avatarUrl: data.avatar_url || data.profile_photo_url || prev.avatarUrl,
          bio: data.bio || prev.bio,
          createdAt: data.created_at ? new Date(data.created_at) : prev.createdAt,
          lastActiveAt: data.last_login_at ? new Date(data.last_login_at) : prev.lastActiveAt,
          walletBalance: data.wallet_balance != null ? parseFloat(data.wallet_balance) : prev.walletBalance,
        }));

        // Load dependants from API
        if (data.dependants && Array.isArray(data.dependants) && data.dependants.length > 0) {
          setDependents(data.dependants.map((d: Record<string, unknown>) => ({
            id: String(d.id || ''),
            firstName: String(d.first_name_en || ''),
            lastName: String(d.last_name_en || ''),
            relationship: String(d.relationship || d.relation_type_id || 'Child'),
            dateOfBirth: String(d.dob || ''),
            email: String(d.email || ''),
            phone: String(d.phone || ''),
            notes: String(d.notes || ''),
            lastUpdated: d.updated_at ? new Date(String(d.updated_at)) : new Date(),
          })));
        }

        // Load addresses from API
        if (data.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
          setAddresses(data.addresses.map((a: Record<string, unknown>) => ({
            id: String(a.id || ''),
            addressType: String(a.label || 'home'),
            addressLine1: `${a.building_number || ''} ${a.street_name || ''}`.trim(),
            addressLine2: String(a.apartment_floor || ''),
            city: String(a.city_name || ''),
            state: '',
            postalCode: '',
            country: String(a.country_name || ''),
            isDefault: Boolean(a.is_default),
            lastUpdated: a.updated_at ? new Date(String(a.updated_at)) : new Date(),
          })));
        }

        // Load audit trail from API
        if (data.recent_audit_trail && Array.isArray(data.recent_audit_trail) && data.recent_audit_trail.length > 0) {
          setAuditEvents(data.recent_audit_trail.map((a: Record<string, unknown>) => ({
            id: String(a.id || ''),
            timestamp: a.created_at ? new Date(String(a.created_at)) : new Date(),
            actor: String(a.actor_name || 'System'),
            actorRole: 'Admin',
            module: 'Players',
            action: String(a.action || ''),
            target: String(a.description || ''),
            result: 'Success' as const,
            metadata: String(a.changes || ''),
          })));
        }
      } catch (err) {
        console.error("Failed to load player from API:", err);
      } finally {
        setIsLoadingApi(false);
      }
    })();
  }, [id]);
  const [banner, setBanner] = useState<BannerState>({ type: "info", message: "", visible: false });
  const [activeTab, setActiveTab] = useState("personal-info");
  const [copied, setCopied] = useState<string | null>(null);

  // ── Sports Interests Edit State ─────────────────────
  const ALL_SPORTS = ["Football", "Basketball", "Tennis", "Padel", "Swimming", "Cricket"];
  const [sportsEditOpen, setSportsEditOpen] = useState(false);
  const [editingSports, setEditingSports] = useState<string[]>([]);

  const openSportsEdit = () => {
    setEditingSports([...player.interestedSports]);
    setSportsEditOpen(true);
  };

  const toggleSport = (sport: string) => {
    setEditingSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  const handleSaveSports = () => {
    setPlayer(prev => ({ ...prev, interestedSports: editingSports }));
    setSportsEditOpen(false);
    toast.success("Sports interests updated successfully.");
  };

  const showBanner = useCallback((type: BannerType, message: string) => {
    setBanner({ type, message, visible: true });
    if (type !== "error") setTimeout(() => setBanner(b => ({ ...b, visible: false })), 5000);
  }, []);

  // Show locked warning
  useEffect(() => {
    if (player.status === "Locked") {
      const past = player.lockedUntil && isBefore(new Date(player.lockedUntil), startOfToday());
      if (past) showBanner("warning", "Lock end date has passed. Consider returning the account to Active.");
      else showBanner("warning", "This account is locked. Limited actions are available.");
    }
  }, [player.status, player.lockedUntil, showBanner]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 1500);
  };

  // ── Profile Form State ────────────────────────────────
  const [formData, setFormData] = useState({
    firstName: player.firstName,
    lastName: player.lastName,
    email: player.email,
    phone: player.phone,
    dateOfBirth: player.dateOfBirth,
    gender: player.gender,
    username: player.username,
    notes: player.notes,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form data when player state updates from API
  useEffect(() => {
    if (!isLoadingApi) {
      setFormData({
        firstName: player.firstName,
        lastName: player.lastName,
        email: player.email,
        phone: player.phone,
        dateOfBirth: player.dateOfBirth,
        gender: player.gender,
        username: player.username,
        notes: player.notes,
      });
    }
  }, [isLoadingApi, player.firstName, player.lastName, player.email]); // eslint-disable-line

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateProfile = () => {
    const e: Record<string, string> = {};
    if (!formData.firstName.trim()) e.firstName = "First name is required.";
    else if (formData.firstName.length > 50) e.firstName = "Max 50 characters.";
    if (!formData.lastName.trim()) e.lastName = "Last name is required.";
    else if (formData.lastName.length > 50) e.lastName = "Max 50 characters.";
    if (!formData.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Invalid email format.";
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      if (isNaN(dob.getTime())) e.dateOfBirth = "Invalid date.";
      else if (isAfter(dob, new Date())) e.dateOfBirth = "Must be a past date.";
      else if (differenceInYears(new Date(), dob) < 13) e.dateOfBirth = "Player must be at least 13 years old.";
    }
    if (formData.username && (formData.username.length < 3 || formData.username.length > 30)) {
      e.username = "Username must be 3–30 characters.";
    } else if (formData.username && !/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      e.username = "Only letters, numbers, . _ - allowed.";
    }
    if (formData.notes.length > 1000) e.notes = "Max 1000 characters.";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setIsSaving(true);
    try {
      await adminService.updatePlayer(id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        mobile: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth || undefined,
        notes: formData.notes || undefined,
      });
    } catch (err: any) {
      setIsSaving(false);
      const msg = err?.response?.data?.message || "Failed to update player.";
      showBanner("error", msg);
      return;
    }

    // AC-PM-015: Generate field-level audit trail entries
    const fieldLabels: Record<string, string> = {
      firstName: "First Name", lastName: "Last Name", email: "Email",
      phone: "Phone", dateOfBirth: "Date of Birth", gender: "Gender",
      username: "Username", notes: "Notes",
    };
    const now = new Date();
    const newAuditEntries: DetailAuditEvent[] = [];
    (Object.keys(formData) as Array<keyof typeof formData>).forEach(field => {
      const oldVal = player[field as keyof typeof player];
      const newVal = formData[field];
      if (oldVal !== newVal) {
        newAuditEntries.push({
          id: `AE-${Date.now()}-${field}`,
          timestamp: now,
          actor: "Admin",
          actorRole: "Admin",
          module: "Players",
          action: "Update",
          target: `${player.firstName} ${player.lastName} (#${player.id})`,
          targetId: player.id,
          result: "Success",
          metadata: {
            field: fieldLabels[field] || field,
            before: oldVal,
            after: newVal,
          },
        });
      }
    });

    if (newAuditEntries.length > 0) {
      setAuditEvents(prev => [...newAuditEntries, ...prev]);
    }

    setPlayer(prev => ({ ...prev, ...formData }));
    setIsSaving(false);
    setIsDirty(false);
    showBanner("success", "Profile updated successfully.");
  };

  const handleCancelProfile = () => {
    setFormData({
      firstName: player.firstName, lastName: player.lastName,
      email: player.email, phone: player.phone,
      dateOfBirth: player.dateOfBirth, gender: player.gender,
      username: player.username, notes: player.notes,
    });
    setIsDirty(false);
    setFormErrors({});
  };

  // ── Status Change Modal ───────────────────────────────
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState<PlayerStatus>(player.status);
  const [statusReason, setStatusReason] = useState("");
  const [statusLockUntil, setStatusLockUntil] = useState<Date | undefined>(
    player.lockedUntil ? new Date(player.lockedUntil) : undefined
  );
  const [statusNotify, setStatusNotify] = useState(true);
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});

  const openStatusModal = (newStatus: PlayerStatus) => {
    setStatusDraft(newStatus);
    setStatusReason("");
    setStatusLockUntil(newStatus === "Locked" && player.lockedUntil ? new Date(player.lockedUntil) : undefined);
    setStatusNotify(true);
    setStatusErrors({});
    setStatusModalOpen(true);
  };

  const validateStatusChange = () => {
    const e: Record<string, string> = {};
    if ((statusDraft === "Inactive" || statusDraft === "Locked") && !statusReason.trim()) {
      e.reason = "Reason is required.";
    }
    if (statusReason.length > 500) e.reason = "Max 500 characters.";
    if (statusDraft === "Locked") {
      if (!statusLockUntil) e.lockUntil = "Lock until date is required.";
      else if (isBefore(statusLockUntil, startOfToday())) e.lockUntil = "Must be a future date.";
    }
    setStatusErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirmStatusChange = async () => {
    if (!validateStatusChange()) return;
    try {
      const payload: Record<string, unknown> = {
        status: statusDraft.toLowerCase(),
      };
      if (statusDraft === "Locked") {
        payload.is_locked = true;
        payload.lock_reason = statusReason;
      } else if (statusDraft === "Active" && player.status === "Locked") {
        payload.is_locked = false;
      }
      await adminService.updatePlayer(id, payload);
      setPlayer(prev => ({
        ...prev,
        status: statusDraft,
        lockedUntil: statusDraft === "Locked" && statusLockUntil
          ? format(statusLockUntil, "yyyy-MM-dd") : undefined,
      }));
      setStatusModalOpen(false);
      showBanner("success", `Status changed to ${statusDraft}.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to change status.";
      showBanner("error", msg);
      setStatusModalOpen(false);
    }
  };

  // ── Unsaved changes guard ─────────────────────────────
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    if (isDirty && tab !== activeTab) {
      setPendingTab(tab);
      setDiscardDialogOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const confirmDiscard = () => {
    handleCancelProfile();
    if (pendingTab) setActiveTab(pendingTab);
    setPendingTab(null);
    setDiscardDialogOpen(false);
  };

  // (Address/Dependent logic is now in AddressesTab/DependentsTab components)

  // ── Audit Tab State ───────────────────────────────────
  const [auditSearch, setAuditSearch] = useState("");
  const [auditAction, setAuditAction] = useState("all");
  const [auditActor, setAuditActor] = useState("all");
  const [auditResult, setAuditResult] = useState("all");
  const [auditPage, setAuditPage] = useState(1);
  const auditPageSize = 25;
  const [auditDetailEvent, setAuditDetailEvent] = useState<DetailAuditEvent | null>(null);
  const [autoRefresh, setAutoRefresh] = useState("off");

  const filteredAudit = useMemo(() => {
    return auditEvents.filter(e => {
      if (auditSearch) {
        const q = auditSearch.toLowerCase();
        if (!e.actor.toLowerCase().includes(q) && !e.action.toLowerCase().includes(q)
          && !e.target.toLowerCase().includes(q) && !JSON.stringify(e.metadata).toLowerCase().includes(q)) return false;
      }
      if (auditAction !== "all" && e.action !== auditAction) return false;
      if (auditActor !== "all" && e.actorRole !== auditActor) return false;
      if (auditResult !== "all" && e.result !== auditResult) return false;
      return true;
    });
  }, [auditEvents, auditSearch, auditAction, auditActor, auditResult]);

  const auditPaged = filteredAudit.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize);
  const auditTotalPages = Math.max(1, Math.ceil(filteredAudit.length / auditPageSize));

  const auditActions = useMemo(() => [...new Set(auditEvents.map(e => e.action))], [auditEvents]);
  const auditActorRoles = useMemo(() => [...new Set(auditEvents.map(e => e.actorRole))], [auditEvents]);

  const clearAuditFilters = () => {
    setAuditSearch(""); setAuditAction("all"); setAuditActor("all"); setAuditResult("all");
    setAuditPage(1);
  };

  const hasAuditFilters = auditSearch || auditAction !== "all" || auditActor !== "all" || auditResult !== "all";

  // ── Bookings Tab State ──────────────────────────────────
  const [bookingSortField, setBookingSortField] = useState<"dateTime" | "amount">("dateTime");
  const [bookingSortDir, setBookingSortDir] = useState<"asc" | "desc">("desc");
  const [bookingPage, setBookingPage] = useState(1);
  const bookingPageSize = 5;

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      if (bookingSortField === "dateTime") {
        return bookingSortDir === "asc"
          ? a.dateTime.getTime() - b.dateTime.getTime()
          : b.dateTime.getTime() - a.dateTime.getTime();
      }
      return bookingSortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
    });
  }, [bookings, bookingSortField, bookingSortDir]);

  const pagedBookings = sortedBookings.slice(
    (bookingPage - 1) * bookingPageSize,
    bookingPage * bookingPageSize
  );
  const bookingTotalPages = Math.max(1, Math.ceil(sortedBookings.length / bookingPageSize));

  const toggleBookingSort = (field: "dateTime" | "amount") => {
    if (bookingSortField === field) {
      setBookingSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setBookingSortField(field);
      setBookingSortDir("desc");
    }
    setBookingPage(1);
  };

  // ── Compute age ───────────────────────────────────────
  const playerAge = player.dateOfBirth
    ? differenceInYears(new Date(), new Date(player.dateOfBirth))
    : null;

  // ── Field helper component ────────────────────────────
  const FormField = ({ id, label, required, error, children }: {
    id: string; label: string; required?: boolean; error?: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 bg-[#F9FAFB] min-h-screen space-y-5 pb-24 md:pb-8">
      {/* ── Banner ────────────────────────────────────────── */}
      {banner.visible && (
        <div
          role={banner.type === "error" ? "alert" : "status"}
          aria-live={banner.type === "error" ? "assertive" : "polite"}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border",
            BANNER_STYLES[banner.type].bg, BANNER_STYLES[banner.type].border, BANNER_STYLES[banner.type].text
          )}
        >
          {(() => { const Icon = BANNER_STYLES[banner.type].icon; return <Icon className="h-4 w-4 shrink-0" />; })()}
          <p className="text-sm flex-1">{banner.message}</p>
          <button onClick={() => setBanner(b => ({ ...b, visible: false }))} className="p-1 rounded hover:bg-black/5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate("/players")}
          className="inline-flex items-center gap-1.5 text-sm text-[#003B95] hover:underline w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Players
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl text-[#111827] tracking-tight">
                Player: {player.firstName} {player.lastName} <span className="text-[#9CA3AF]">&#183; #{player.id}</span>
              </h1>
              <div className="flex items-center gap-2">
                <StatusPill status={player.status} />
                {player.status === "Locked" && player.lockedUntil && (
                  <span className="text-[11px] text-red-600 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    until {player.lockedUntil}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-[#6B7280] mt-1">
              {player.email} &#183; {player.phone || "—"}
            </p>
          </div>

          {/* Status Control */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-[#6B7280]">Account Status:</span>
              </TooltipTrigger>
              <TooltipContent>Change account status. Locked prevents sign-in until the specified date.</TooltipContent>
            </Tooltip>
            <div className="flex gap-1 flex-wrap">
              {/* AC-PM-018: Show dedicated Unlock button when player is Locked */}
              {player.status === "Locked" && (
                <button
                  onClick={() => openStatusModal("Active")}
                  className="px-3 py-1.5 rounded-lg text-xs border transition-colors bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                >
                  <Unlock className="h-3 w-3" />
                  Unlock
                </button>
              )}
              {(["Active", "Inactive", "Locked"] as PlayerStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { if (s !== player.status) openStatusModal(s); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                    player.status === s
                      ? s === "Active" ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                        : s === "Locked" ? "bg-red-100 border-red-300 text-red-800"
                        : "bg-gray-200 border-gray-300 text-gray-800"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-white border overflow-x-auto">
          <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
          <TabsTrigger value="sports-interests">Sports Interests</TabsTrigger>
          <TabsTrigger value="dependants">Dependants</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="saved-cards">Saved Cards</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════
            TAB: PERSONAL INFO (formerly Overview)
            ════════════════════════════════════════════════════ */}
        <TabsContent value="personal-info" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── Left: Profile Form ─────────────────────── */}
            <div className="lg:col-span-8 bg-white border rounded-xl p-6 space-y-5">
              <h2 className="text-[#111827]">Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField id="firstName" label="First Name" required error={formErrors.firstName}>
                  <Input id="firstName" placeholder="e.g., Jane" value={formData.firstName}
                    onChange={e => updateField("firstName", e.target.value)}
                    disabled={isSaving} className={cn(formErrors.firstName && "border-red-400")} />
                </FormField>
                <FormField id="lastName" label="Last Name" required error={formErrors.lastName}>
                  <Input id="lastName" placeholder="e.g., Doe" value={formData.lastName}
                    onChange={e => updateField("lastName", e.target.value)}
                    disabled={isSaving} className={cn(formErrors.lastName && "border-red-400")} />
                </FormField>
                <FormField id="email" label="Email" required error={formErrors.email}>
                  <Input id="email" type="email" placeholder="e.g., jane.doe@email.com" value={formData.email}
                    onChange={e => updateField("email", e.target.value)}
                    disabled={isSaving} className={cn(formErrors.email && "border-red-400")} />
                </FormField>
                <FormField id="phone" label="Phone" error={formErrors.phone}>
                  <Input id="phone" placeholder="+1 415 555 0123" value={formData.phone}
                    onChange={e => updateField("phone", e.target.value)} disabled={isSaving} />
                </FormField>
                <FormField id="dateOfBirth" label="Date of Birth" error={formErrors.dateOfBirth}>
                  <Input id="dateOfBirth" type="date" placeholder="YYYY-MM-DD" value={formData.dateOfBirth}
                    onChange={e => updateField("dateOfBirth", e.target.value)}
                    disabled={isSaving} className={cn(formErrors.dateOfBirth && "border-red-400")} />
                </FormField>
                <FormField id="gender" label="Gender">
                  <Select value={formData.gender} onValueChange={v => updateField("gender", v)} disabled={isSaving}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField id="username" label="Username" error={formErrors.username}>
                  <Input id="username" placeholder="3–30 chars; letters, numbers, . _ -" value={formData.username}
                    onChange={e => updateField("username", e.target.value)}
                    disabled={isSaving} className={cn(formErrors.username && "border-red-400")} />
                </FormField>
                <FormField id="initialStatus" label="Initial Status">
                  <Input id="initialStatus" value={player.status} disabled
                    className="bg-gray-50 text-gray-500 cursor-not-allowed" />
                </FormField>
              </div>
              <FormField id="notes" label="Notes" error={formErrors.notes}>
                <div className="relative">
                  <Textarea id="notes" placeholder="Internal admin notes (max 1000 chars)."
                    value={formData.notes} onChange={e => updateField("notes", e.target.value)}
                    disabled={isSaving} rows={3} className={cn(formErrors.notes && "border-red-400")} />
                  <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">{formData.notes.length}/1000</span>
                </div>
              </FormField>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={handleCancelProfile} disabled={!isDirty || isSaving}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={!isDirty || isSaving}
                  className="bg-[#003B95] hover:bg-[#002a6b] gap-2">
                  {isSaving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* ── Right: Overview Card ────────────────────── */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[#003B95]/10 text-[#003B95] text-sm">
                      {player.firstName[0]}{player.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-[#111827]">{player.firstName} {player.lastName}</p>
                    <p className="text-[11px] text-[#9CA3AF] font-mono">{player.id}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280] flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => copyToClipboard(player.email, "email")}
                          className="text-[#111827] hover:text-[#003B95] flex items-center gap-1 text-xs">
                          {player.email}
                          {copied === "email" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-gray-300" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{copied === "email" ? "Copied" : "Copy to clipboard"}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280] flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</span>
                    {player.phone ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => copyToClipboard(player.phone, "phone")}
                            className="text-[#111827] hover:text-[#003B95] flex items-center gap-1 text-xs">
                            {player.phone}
                            {copied === "phone" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-gray-300" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{copied === "phone" ? "Copied" : "Copy to clipboard"}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-[#9CA3AF] text-xs italic">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280] flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Status</span>
                    <StatusPill status={player.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280] flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> DOB</span>
                    <span className="text-xs text-[#111827]">
                      {player.dateOfBirth || "—"}
                      {playerAge !== null && <span className="text-[#9CA3AF] ml-1">({playerAge}y)</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* AC-PM-014: Additional player info (read-only) */}
              <div className="bg-white border rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Player Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#6B7280] flex items-center gap-1.5 shrink-0"><Globe className="h-3.5 w-3.5" /> Nationality</span>
                    <span className="text-xs text-[#111827] text-right">{player.nationality || "—"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#6B7280] flex items-center gap-1.5 shrink-0"><Briefcase className="h-3.5 w-3.5" /> Occupation</span>
                    <span className="text-xs text-[#111827] text-right">{player.occupation || "—"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#6B7280] flex items-center gap-1.5 shrink-0"><Languages className="h-3.5 w-3.5" /> Language</span>
                    <span className="text-xs text-[#111827]">{player.preferredLanguage || "—"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#6B7280] flex items-center gap-1.5 shrink-0"><Calendar className="h-3.5 w-3.5" /> Registered</span>
                    <span className="text-xs text-[#111827]">{format(player.createdAt, "dd MMM yyyy")}</span>
                  </div>
                  {player.bio && (
                    <div className="pt-1 border-t border-gray-100">
                      <p className="text-[10px] text-[#9CA3AF] uppercase font-semibold mb-1">Bio</p>
                      <p className="text-xs text-[#374151] leading-relaxed">{player.bio}</p>
                    </div>
                  )}
                  {player.interestedSports && player.interestedSports.length > 0 && (
                    <div className="pt-1 border-t border-gray-100">
                      <p className="text-[10px] text-[#9CA3AF] uppercase font-semibold mb-1.5 flex items-center gap-1">
                        <Heart className="h-3 w-3" /> Interested Sports
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {player.interestedSports.map(s => (
                          <span key={s} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-md">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification & Privacy Settings */}
              {player.notificationSettings && (
                <div className="bg-white border rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-[#374151] uppercase tracking-wide flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5" /> Notification Settings
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Email: Booking Confirmation", val: player.notificationSettings.emailBookingConfirm },
                      { label: "Email: Cancellation",         val: player.notificationSettings.emailCancellation },
                      { label: "Email: Promotions",           val: player.notificationSettings.emailPromotions },
                      { label: "Push: Reminders",             val: player.notificationSettings.pushReminders },
                      { label: "Push: Session Updates",       val: player.notificationSettings.pushSessionUpdates },
                      { label: "SMS Alerts",                  val: player.notificationSettings.smsAlerts },
                    ].map(n => (
                      <div key={n.label} className="flex items-center justify-between">
                        <span className="text-[11px] text-[#6B7280]">{n.label}</span>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          n.val ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400")}>
                          {n.val ? "On" : "Off"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {player.privacySettings && (
                <div className="bg-white border rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-[#374151] uppercase tracking-wide flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Privacy Settings
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Profile Visible",         val: player.privacySettings.profileVisible },
                      { label: "Show Activity History",   val: player.privacySettings.showActivityHistory },
                      { label: "Allow Friend Requests",   val: player.privacySettings.allowFriendRequests },
                      { label: "Share with Coaches",      val: player.privacySettings.shareWithCoaches },
                    ].map(n => (
                      <div key={n.label} className="flex items-center justify-between">
                        <span className="text-[11px] text-[#6B7280]">{n.label}</span>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          n.val ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400")}>
                          {n.val ? "Yes" : "No"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB: SPORTS INTERESTS
            ════════════════════════════════════════════════════ */}
        <TabsContent value="sports-interests" className="mt-4">
          <div className="bg-white border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[#111827]">Sports Interests</h2>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={openSportsEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
            {player.interestedSports && player.interestedSports.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {player.interestedSports.map((sport) => {
                    const colors: Record<string, string> = {
                      Football: "bg-green-50 text-green-700 border-green-200",
                      Basketball: "bg-orange-50 text-orange-700 border-orange-200",
                      Tennis: "bg-yellow-50 text-yellow-700 border-yellow-200",
                      Padel: "bg-purple-50 text-purple-700 border-purple-200",
                      Swimming: "bg-blue-50 text-blue-700 border-blue-200",
                      Cricket: "bg-red-50 text-red-700 border-red-200",
                    };
                    return (
                      <span
                        key={sport}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border",
                          colors[sport] || "bg-gray-50 text-gray-700 border-gray-200"
                        )}
                      >
                        <Heart className="h-3.5 w-3.5" />
                        {sport}
                      </span>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Heart className="h-10 w-10 text-gray-200 mx-auto" />
                <p className="text-sm text-[#374151]">No sports interests selected.</p>
              </div>
            )}
          </div>

          {/* Sports Interests Edit Dialog */}
          <Dialog open={sportsEditOpen} onOpenChange={setSportsEditOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Sports Interests</DialogTitle>
                <DialogDescription>Select the sports this player is interested in.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-4">
                {ALL_SPORTS.map((sport) => (
                  <label
                    key={sport}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors",
                      editingSports.includes(sport)
                        ? "border-[#003B95] bg-blue-50/50"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Checkbox
                      checked={editingSports.includes(sport)}
                      onCheckedChange={() => toggleSport(sport)}
                    />
                    <span className="text-sm text-[#374151]">{sport}</span>
                  </label>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSportsEditOpen(false)}>Cancel</Button>
                <Button className="bg-[#003B95] hover:bg-[#002a6b]" onClick={handleSaveSports}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB: ADDRESSES
            ════════════════════════════════════════════════════ */}
        <TabsContent value="addresses" className="mt-4">
          <AddressesTab
            addresses={addresses}
            setAddresses={setAddresses}
            playerName={`${player.firstName} ${player.lastName}`}
          />
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB: DEPENDANTS
            ════════════════════════════════════════════════════ */}
        <TabsContent value="dependants" className="mt-4">
          <DependentsTab
            dependents={dependents}
            setDependents={setDependents}
            playerName={`${player.firstName} ${player.lastName}`}
          />
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB: SAVED CARDS
            ════════════════════════════════════════════════════ */}
        <TabsContent value="saved-cards" className="mt-4">
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-[#111827]">Saved Cards</h2>
            </div>
            {savedCards.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="px-4">Card Brand</TableHead>
                      <TableHead className="px-4">Last 4 Digits</TableHead>
                      <TableHead className="px-4">Expiry</TableHead>
                      <TableHead className="px-4">Default</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedCards.map(card => (
                      <TableRow key={card.id}>
                        <TableCell className="px-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-[#6B7280]" />
                            <span className="text-sm text-[#111827] font-medium">{card.brand}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4">
                          <span className="text-sm text-[#374151] font-mono">•••• {card.last4}</span>
                        </TableCell>
                        <TableCell className="px-4">
                          <span className="text-sm text-[#374151]">{card.expiry}</span>
                        </TableCell>
                        <TableCell className="px-4">
                          {card.isDefault ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Default</Badge>
                          ) : (
                            <span className="text-xs text-[#9CA3AF]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <CreditCard className="h-10 w-10 text-gray-200 mx-auto" />
                <p className="text-sm text-[#374151]">No saved cards.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB: BOOKINGS
            ════════════════════════════════════════════════════ */}
        <TabsContent value="bookings" className="mt-4">
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-[#111827]">Bookings</h2>
            </div>
            {sortedBookings.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead className="px-4">Booking ID</TableHead>
                        <TableHead className="px-4">Type</TableHead>
                        <TableHead className="px-4">Entity Name</TableHead>
                        <TableHead className="px-4">
                          <button
                            onClick={() => toggleBookingSort("dateTime")}
                            className="flex items-center gap-1 hover:text-[#111827]"
                          >
                            Date/Time
                            {bookingSortField === "dateTime" ? (
                              bookingSortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-gray-300" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="px-4">Status</TableHead>
                        <TableHead className="px-4">
                          <button
                            onClick={() => toggleBookingSort("amount")}
                            className="flex items-center gap-1 hover:text-[#111827]"
                          >
                            Amount (SAR)
                            {bookingSortField === "amount" ? (
                              bookingSortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-gray-300" />
                            )}
                          </button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedBookings.map(booking => (
                        <TableRow key={booking.id} className="hover:bg-gray-50/50">
                          <TableCell className="px-4">
                            <Link to={`/bookings/${booking.id}`} className="text-sm text-[#003B95] hover:underline font-medium">
                              {booking.id}
                            </Link>
                          </TableCell>
                          <TableCell className="px-4">
                            <Badge variant="outline" className="text-[10px]">{booking.type}</Badge>
                          </TableCell>
                          <TableCell className="px-4">
                            <span className="text-sm text-[#374151] max-w-[200px] truncate block">{booking.entityName}</span>
                          </TableCell>
                          <TableCell className="px-4">
                            <p className="text-xs text-[#374151]">{format(booking.dateTime, "MMM d, yyyy")}</p>
                            <p className="text-[10px] text-[#9CA3AF]">{format(booking.dateTime, "HH:mm")}</p>
                          </TableCell>
                          <TableCell className="px-4">
                            <Badge variant="outline" className={cn("text-[10px]",
                              booking.status === "Confirmed" ? "bg-blue-50 text-blue-700 border-blue-200"
                              : booking.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : booking.status === "Cancelled" ? "bg-red-50 text-red-700 border-red-200"
                              : booking.status === "No-Show" ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                            )}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4">
                            <span className="text-sm text-[#111827] font-medium">{booking.amount.toLocaleString()} SAR</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
                  <span className="text-xs text-[#6B7280]">
                    Showing {Math.min((bookingPage - 1) * bookingPageSize + 1, sortedBookings.length)}–{Math.min(bookingPage * bookingPageSize, sortedBookings.length)} of {sortedBookings.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled={bookingPage <= 1}
                      onClick={() => setBookingPage(p => p - 1)} className="h-7 w-7 p-0">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: bookingTotalPages }, (_, i) => i + 1).map(p => (
                      <Button key={p} variant={p === bookingPage ? "default" : "outline"} size="sm"
                        onClick={() => setBookingPage(p)}
                        className={cn("h-7 w-7 p-0 text-xs", p === bookingPage && "bg-[#003B95] hover:bg-[#002a6b]")}>
                        {p}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" disabled={bookingPage >= bookingTotalPages}
                      onClick={() => setBookingPage(p => p + 1)} className="h-7 w-7 p-0">
                      <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Calendar className="h-10 w-10 text-gray-200 mx-auto" />
                <p className="text-sm text-[#374151]">No bookings found for this player.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB: WALLET
            ════════════════════════════════════════════════════ */}
        <TabsContent value="wallet" className="mt-4 space-y-4">
          {/* Balance Card */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#003B95]/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[#003B95]" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide font-semibold">Current Balance</p>
                <p className="text-2xl text-[#111827] tracking-tight">
                  {player.walletBalance.toLocaleString("en-SA", { minimumFractionDigits: 2 })} <span className="text-sm text-[#6B7280]">SAR</span>
                </p>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-[#111827]">Transactions</h2>
            </div>
            {walletTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="px-4">Transaction ID</TableHead>
                      <TableHead className="px-4">Type</TableHead>
                      <TableHead className="px-4">Amount (SAR)</TableHead>
                      <TableHead className="px-4">Description</TableHead>
                      <TableHead className="px-4">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletTransactions.map(txn => (
                      <TableRow key={txn.id}>
                        <TableCell className="px-4">
                          <span className="text-sm text-[#374151] font-mono">{txn.id}</span>
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge variant="outline" className={cn("text-[10px]",
                            txn.type === "Credit"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4">
                          <span className={cn("text-sm font-medium",
                            txn.type === "Credit" ? "text-emerald-600" : "text-red-600"
                          )}>
                            {txn.type === "Credit" ? "+" : "−"}{txn.amount.toLocaleString()} SAR
                          </span>
                        </TableCell>
                        <TableCell className="px-4">
                          <span className="text-sm text-[#374151] max-w-[260px] truncate block">{txn.description}</span>
                        </TableCell>
                        <TableCell className="px-4">
                          <p className="text-xs text-[#374151]">{format(txn.date, "MMM d, yyyy")}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{format(txn.date, "HH:mm")}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Wallet className="h-10 w-10 text-gray-200 mx-auto" />
                <p className="text-sm text-[#374151]">No wallet transactions.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB: TOURNAMENTS
            ════════════════════════════════════════════════════ */}
        <TabsContent value="tournaments" className="mt-4">
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-[#111827]">Tournament History</h2>
            </div>
            {tournaments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="px-4">Tournament Name</TableHead>
                      <TableHead className="px-4">Sport</TableHead>
                      <TableHead className="px-4">Date</TableHead>
                      <TableHead className="px-4">Status</TableHead>
                      <TableHead className="px-4">Team/Solo</TableHead>
                      <TableHead className="px-4">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournaments.map(t => (
                      <TableRow key={t.id} className="cursor-pointer hover:bg-gray-50/50">
                        <TableCell className="px-4">
                          <span className="text-sm text-[#003B95] font-medium">{t.name}</span>
                        </TableCell>
                        <TableCell className="px-4">
                          <span className="text-sm text-[#374151]">{t.sport}</span>
                        </TableCell>
                        <TableCell className="px-4">
                          <span className="text-xs text-[#374151]">{format(t.date, "MMM d, yyyy")}</span>
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge variant="outline" className={cn("text-[10px]",
                            t.status === "Upcoming" ? "bg-blue-50 text-blue-700 border-blue-200"
                            : t.status === "In Progress" ? "bg-amber-50 text-amber-700 border-amber-200"
                            : t.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge variant="outline" className={cn("text-[10px]",
                            t.teamOrSolo === "Team"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          )}>
                            {t.teamOrSolo}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4">
                          <span className="text-sm text-[#374151]">{t.result}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Trophy className="h-10 w-10 text-gray-200 mx-auto" />
                <p className="text-sm text-[#374151]">No tournament history.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB: FRIENDS
            ════════════════════════════════════════════════════ */}
        <TabsContent value="friends" className="mt-4">
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-[#111827]">Friends</h2>
            </div>
            {friends.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="px-4">Friend Name</TableHead>
                      <TableHead className="px-4">Status</TableHead>
                      <TableHead className="px-4">Added Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {friends.map(friend => (
                      <TableRow key={friend.id} className="hover:bg-gray-50/50">
                        <TableCell className="px-4">
                          <Link
                            to={`/players/${friend.playerId}`}
                            className="text-sm text-[#003B95] hover:underline font-medium flex items-center gap-2"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[9px] bg-[#003B95]/10 text-[#003B95]">
                                {friend.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            {friend.name}
                          </Link>
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge variant="outline" className={cn("text-[10px]",
                            friend.status === "Accepted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {friend.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4">
                          <span className="text-xs text-[#374151]">{format(friend.addedDate, "MMM d, yyyy")}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Users className="h-10 w-10 text-gray-200 mx-auto" />
                <p className="text-sm text-[#374151]">No friends.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB: AUDIT TRAIL
            ════════════════════════════════════════════════════ */}
        <TabsContent value="audit" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="bg-white border rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search events (Max 200 chars)" value={auditSearch}
                  onChange={e => { if (e.target.value.length <= 200) setAuditSearch(e.target.value); }}
                  onKeyDown={e => e.key === "Enter" && setAuditPage(1)}
                  className="pl-9" />
              </div>
              <Select value={auditAction} onValueChange={v => { setAuditAction(v); setAuditPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Action" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {auditActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={auditActor} onValueChange={v => { setAuditActor(v); setAuditPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Actor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actors</SelectItem>
                  {auditActorRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={auditResult} onValueChange={v => { setAuditResult(v); setAuditPage(1); }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Result" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasAuditFilters && (
                  <button onClick={clearAuditFilters} className="text-xs text-red-500 hover:underline">Clear all</button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span>Auto-refresh:</span>
                <Select value={autoRefresh} onValueChange={setAutoRefresh}>
                  <SelectTrigger className="h-7 w-20 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="30s">30s</SelectItem>
                    <SelectItem value="1m">1m</SelectItem>
                    <SelectItem value="5m">5m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-white border rounded-xl overflow-hidden">
            {filteredAudit.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead className="px-4">Timestamp</TableHead>
                        <TableHead className="px-4">Actor</TableHead>
                        <TableHead className="px-4 hidden md:table-cell">Module</TableHead>
                        <TableHead className="px-4">Action</TableHead>
                        <TableHead className="px-4 hidden lg:table-cell">Target</TableHead>
                        <TableHead className="px-4">Result</TableHead>
                        <TableHead className="px-4 hidden xl:table-cell">Metadata</TableHead>
                        <TableHead className="px-4 w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditPaged.map(event => (
                        <TableRow key={event.id} className="group cursor-pointer hover:bg-gray-50/50"
                          onClick={() => setAuditDetailEvent(event)}>
                          <TableCell className="px-4">
                            <p className="text-xs text-[#374151]">{format(event.timestamp, "MMM d, yyyy")}</p>
                            <p className="text-[10px] text-[#9CA3AF]">{format(event.timestamp, "HH:mm:ss")}</p>
                          </TableCell>
                          <TableCell className="px-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[9px] bg-[#003B95]/10 text-[#003B95]">
                                  {event.actor.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs text-[#111827]">{event.actor}</p>
                                <p className="text-[10px] text-[#9CA3AF]">{event.actorRole}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 text-xs text-[#6B7280] hidden md:table-cell">{event.module}</TableCell>
                          <TableCell className="px-4">
                            <Badge variant="outline" className="text-[10px]">{event.action}</Badge>
                          </TableCell>
                          <TableCell className="px-4 text-xs text-[#374151] hidden lg:table-cell max-w-[160px] truncate">{event.target}</TableCell>
                          <TableCell className="px-4">
                            <Badge variant="outline" className={cn("text-[10px]",
                              event.result === "Success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            )}>{event.result}</Badge>
                          </TableCell>
                          <TableCell className="px-4 hidden xl:table-cell">
                            <code className="text-[10px] text-[#6B7280] block max-w-[180px] truncate">
                              {JSON.stringify(event.metadata)}
                            </code>
                          </TableCell>
                          <TableCell className="px-4">
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={e => { e.stopPropagation(); setAuditDetailEvent(event); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
                  <span className="text-xs text-[#6B7280]">
                    Showing {Math.min((auditPage - 1) * auditPageSize + 1, filteredAudit.length)}–{Math.min(auditPage * auditPageSize, filteredAudit.length)} of {filteredAudit.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled={auditPage <= 1}
                      onClick={() => setAuditPage(p => p - 1)} className="h-7 w-7 p-0">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: auditTotalPages }, (_, i) => i + 1).map(p => (
                      <Button key={p} variant={p === auditPage ? "default" : "outline"} size="sm"
                        onClick={() => setAuditPage(p)}
                        className={cn("h-7 w-7 p-0 text-xs", p === auditPage && "bg-[#003B95] hover:bg-[#002a6b]")}>
                        {p}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" disabled={auditPage >= auditTotalPages}
                      onClick={() => setAuditPage(p => p + 1)} className="h-7 w-7 p-0">
                      <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Search className="h-10 w-10 text-gray-200 mx-auto" />
                <p className="text-sm text-[#374151]">
                  {/* AC-PM-032 */}
                  {hasAuditFilters ? "No events match your filters." : "No audit history available."}
                </p>
                {hasAuditFilters && (
                  <Button variant="outline" size="sm" onClick={clearAuditFilters}>Reset Filters</Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ══════════════════════════════════════════════════════
          MODALS
          ══════════════════════════════════════════════════════ */}

      {/* ── Status Change Modal ───────────────────────────── */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {/* AC-PM-016/017/018: Context-specific title */}
              {statusDraft === "Active" && player.status === "Locked"
                ? "Are you sure you want to unlock this player's account?"
                : statusDraft === "Active"
                ? "Are you sure you want to activate this player?"
                : statusDraft === "Inactive"
                ? "Are you sure you want to deactivate this player?"
                : "Change Account Status"}
            </DialogTitle>
            <DialogDescription>
              {statusDraft === "Active" && player.status === "Locked"
                ? `${player.firstName} ${player.lastName}'s account will be unlocked and they will regain access.`
                : statusDraft === "Active"
                ? `${player.firstName} ${player.lastName} will be reactivated and can access Playzoon.`
                : statusDraft === "Inactive"
                ? `${player.firstName} ${player.lastName} will be deactivated and cannot access Playzoon.`
                : `Update the status for ${player.firstName} ${player.lastName} (#{player.id}).`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Status <span className="text-red-500">*</span></Label>
              <RadioGroup value={statusDraft} onValueChange={v => setStatusDraft(v as PlayerStatus)}>
                {(["Active", "Inactive", "Locked"] as PlayerStatus[]).map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <RadioGroupItem value={s} id={`st-${s}`} />
                    <Label htmlFor={`st-${s}`} className="cursor-pointer text-sm">{s}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {(statusDraft === "Inactive" || statusDraft === "Locked") && (
              <div className="space-y-1.5">
                <Label htmlFor="st-reason">
                  Reason <span className="text-red-500">*</span>
                  <span className="text-[11px] text-gray-400 ml-2">{statusReason.length}/500</span>
                </Label>
                <Textarea id="st-reason" placeholder="Provide context for this status change."
                  value={statusReason} onChange={e => setStatusReason(e.target.value)} rows={3}
                  className={cn(statusErrors.reason && "border-red-400")} />
                {statusErrors.reason && <p className="text-xs text-red-500">{statusErrors.reason}</p>}
              </div>
            )}
            {statusDraft === "Locked" && (
              <div className="space-y-1.5">
                <Label>Lock Until <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start gap-2 text-sm",
                      !statusLockUntil && "text-muted-foreground", statusErrors.lockUntil && "border-red-400")}>
                      <Calendar className="h-3.5 w-3.5" />
                      {statusLockUntil ? format(statusLockUntil, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={statusLockUntil}
                      onSelect={setStatusLockUntil} initialFocus
                      disabled={d => isBefore(d, startOfToday())} />
                  </PopoverContent>
                </Popover>
                {statusErrors.lockUntil && <p className="text-xs text-red-500">{statusErrors.lockUntil}</p>}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox id="st-notify" checked={statusNotify} onCheckedChange={c => setStatusNotify(!!c)} />
              <Label htmlFor="st-notify" className="cursor-pointer text-sm">Notify Player by Email</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmStatusChange} className={cn(
              statusDraft === "Locked" ? "bg-red-600 hover:bg-red-700"
              : statusDraft === "Inactive" ? "bg-gray-700 hover:bg-gray-800"
              : "bg-[#003B95] hover:bg-[#002a6b]"
            )}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Discard Unsaved Changes Dialog ────────────────── */}
      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>Discard your changes or stay on this tab?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTab(null)}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="bg-red-600 hover:bg-red-700">Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Audit Event Detail Modal ──────────────────────── */}
      <Dialog open={!!auditDetailEvent} onOpenChange={o => { if (!o) setAuditDetailEvent(null); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
          {auditDetailEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm">
                  Audit Event Detail
                  <Badge variant="outline" className="text-[10px]">{auditDetailEvent.action}</Badge>
                  <Badge variant="outline" className={cn("text-[10px]",
                    auditDetailEvent.result === "Success"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  )}>{auditDetailEvent.result}</Badge>
                </DialogTitle>
                <DialogDescription>{auditDetailEvent.id}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-gray-400">Timestamp:</span> <span className="text-[#374151]">{format(auditDetailEvent.timestamp, "MMM d, yyyy HH:mm:ss")}</span></div>
                  <div><span className="text-gray-400">Actor:</span> <span className="text-[#374151]">{auditDetailEvent.actor} ({auditDetailEvent.actorRole})</span></div>
                  <div><span className="text-gray-400">Module:</span> <span className="text-[#374151]">{auditDetailEvent.module}</span></div>
                  <div><span className="text-gray-400">Action:</span> <span className="text-[#374151]">{auditDetailEvent.action}</span></div>
                  <div><span className="text-gray-400">Target:</span> <span className="text-[#374151]">{auditDetailEvent.target}</span></div>
                  <div><span className="text-gray-400">Result:</span> <span className="text-[#374151]">{auditDetailEvent.result}</span></div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Full JSON Payload</p>
                  <div className="relative">
                    <pre className="bg-gray-50 border rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all text-[#374151] max-h-[240px] overflow-y-auto">
                      {JSON.stringify(auditDetailEvent, null, 2)}
                    </pre>
                    <Button variant="outline" size="sm" className="absolute top-2 right-2 h-6 text-[10px] gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(auditDetailEvent, null, 2));
                        toast.success("Copied to clipboard");
                      }}>
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}