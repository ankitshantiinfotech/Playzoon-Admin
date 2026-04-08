// ─── SCR-ADM-039: Sub-Admin & Roles List ─────────────────────────────────────
// Central management hub for sub-admin accounts and custom roles.
// Two tabs: "Sub-Admins" (default) | "Roles".
// Stats cards for Total / Active / Inactive.
// Right-side drawer for Create / Edit sub-admin.
// Bulk actions, export, pagination, confirm modals.

import {
  useState,
  useMemo,
  useEffect,
  type ReactNode,
  type ElementType,
} from "react";
import { useNavigate } from "react-router";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  UserCog,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  MailCheck,
  Users,
  UserCheck,
  UserX,
  Filter,
  Loader2,
  Check,
  Settings,
  MoreHorizontal,
  Download,
  ShieldCheck,
  ShieldOff,
  Phone,
  Globe,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../../ui/sheet";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Checkbox } from "../../ui/checkbox";
import type {
  SubAdmin,
  SubAdminStatus,
  SubAdminFormData,
  Role,
  ExportFormat,
} from "./types";
import {
  EMPTY_SUB_ADMIN_FORM,
  COUNTRY_CODE_OPTIONS,
  NATIONALITY_OPTIONS,
  COUNTRY_OPTIONS,
  EXPORT_FORMATS,
  statusColor,
  countPermissions,
} from "./types";
import { MOCK_SUB_ADMINS, MOCK_ROLES } from "./mockData";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return `sa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function fmtDateTime(iso: string) {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm");
}

function fmtRelative(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ElementType;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          bg,
        )}
      >
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Form Field Wrapper ─────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateSubAdminForm(
  form: SubAdminFormData,
  existingEmails: string[],
  editingEmail?: string,
): Record<string, string> {
  const errs: Record<string, string> = {};

  if (!form.fullName.trim()) {
    errs.fullName = "Full name is required.";
  } else if (form.fullName.trim().length < 2) {
    errs.fullName = "Full name must be at least 2 characters.";
  } else if (form.fullName.trim().length > 100) {
    errs.fullName = "Full name must not exceed 100 characters.";
  }

  if (!form.email.trim()) {
    errs.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errs.email = "Please enter a valid email address.";
  } else {
    const isDuplicate = existingEmails.some(
      (e) =>
        e.toLowerCase() === form.email.trim().toLowerCase() &&
        e.toLowerCase() !== editingEmail?.toLowerCase(),
    );
    if (isDuplicate)
      errs.email = "This email is already registered to another admin account.";
  }

  if (!form.mobile.trim()) {
    errs.mobile = "Mobile number is required.";
  } else if (!/^\d{6,15}$/.test(form.mobile.trim())) {
    errs.mobile = "Please enter a valid mobile number with country code.";
  }

  if (!form.roleId) {
    errs.roleId = "Please select a role.";
  }

  return errs;
}

// ─── Sort helpers ───────────────────────────────────────────────────────────

type SubAdminSortField =
  | "fullName"
  | "email"
  | "mobile"
  | "roleName"
  | "nationality"
  | "country"
  | "status"
  | "lastLogin";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return (
      <span className="inline-block w-3 h-3 text-gray-300">
        <svg viewBox="0 0 12 12" fill="none" className="w-full h-full">
          <path d="M6 2l3 3H3l3-3z" fill="currentColor" />
          <path d="M6 10L3 7h6l-3 3z" fill="currentColor" />
        </svg>
      </span>
    );
  return dir === "asc" ? (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className="inline-block w-3 h-3 text-[#003B95]"
    >
      <path d="M6 2l3 4H3l3-4z" fill="currentColor" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className="inline-block w-3 h-3 text-[#003B95]"
    >
      <path d="M6 10L3 6h6L6 10z" fill="currentColor" />
    </svg>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────

function PaginationControl({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{totalItems} total items</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[90px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft size={14} />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && (arr[i - 1] as number) + 1 < p) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="px-1 text-gray-400 text-sm"
              >
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p as number)}
                className={cn(
                  "h-8 w-8 p-0 text-xs",
                  p === page && "bg-[#003B95]",
                )}
              >
                {p}
              </Button>
            ),
          )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type Tab = "sub-admins" | "roles";

type DrawerState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; subAdmin: SubAdmin };

type ConfirmModal =
  | { type: "none" }
  | { type: "deactivate"; subAdmin: SubAdmin }
  | { type: "activate"; subAdmin: SubAdmin }
  | { type: "delete-sub-admin"; subAdmin: SubAdmin }
  | { type: "delete-role"; role: Role }
  | { type: "resend"; subAdmin: SubAdmin }
  | { type: "bulk-activate"; ids: string[] }
  | { type: "bulk-deactivate"; ids: string[] }
  | { type: "bulk-delete"; ids: string[] };

export function SubAdminsPage() {
  const navigate = useNavigate();

  // ── Data ──
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>(MOCK_SUB_ADMINS);
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);

  // ── UI State ──
  const [tab, setTab] = useState<Tab>("sub-admins");
  const [drawer, setDrawer] = useState<DrawerState>({ type: "closed" });
  const [modal, setModal] = useState<ConfirmModal>({ type: "none" });

  // ── Sub-Admin Filters ──
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SubAdminStatus | "All">(
    "All",
  );
  const [sortField, setSortField] = useState<SubAdminSortField>("fullName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Roles pagination ──
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesPageSize, setRolesPageSize] = useState(10);

  // ── Drawer form ──
  const [form, setForm] = useState<SubAdminFormData>(EMPTY_SUB_ADMIN_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // ── Confirm modal loading ──
  const [confirming, setConfirming] = useState(false);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = subAdmins.length;
    const active = subAdmins.filter((s) => s.status === "Active").length;
    const inactive = subAdmins.filter((s) => s.status === "Inactive").length;
    return { total, active, inactive };
  }, [subAdmins]);

  // ── Active roles for form dropdown ──
  const activeRoles = useMemo(
    () => roles.filter((r) => r.status === "Active"),
    [roles],
  );

  // ── Filtered + sorted sub-admins ──
  const filteredSubAdmins = useMemo(() => {
    let list = [...subAdmins];
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.roleName.toLowerCase().includes(q),
      );
    }
    if (filterStatus !== "All") {
      list = list.filter((s) => s.status === filterStatus);
    }
    list.sort((a, b) => {
      const valA = (a[sortField] ?? "").toString();
      const valB = (b[sortField] ?? "").toString();
      const cmp = valA.localeCompare(valB);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [subAdmins, search, filterStatus, sortField, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubAdmins.length / pageSize),
  );
  const pagedSubAdmins = filteredSubAdmins.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, filterStatus, sortField, sortDir, pageSize]);

  // ── Roles list ──
  const rolesTotalPages = Math.max(1, Math.ceil(roles.length / rolesPageSize));
  const pagedRoles = roles.slice(
    (rolesPage - 1) * rolesPageSize,
    rolesPage * rolesPageSize,
  );

  // ── Sort handler ──
  function handleSort(field: SubAdminSortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  // ── Selection helpers ──
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === pagedSubAdmins.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedSubAdmins.map((s) => s.id)));
    }
  }

  const allPageSelected =
    pagedSubAdmins.length > 0 && selectedIds.size === pagedSubAdmins.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < pagedSubAdmins.length;

  // ── Drawer open helpers ──
  function openCreate() {
    setForm(EMPTY_SUB_ADMIN_FORM);
    setFormErrors({});
    setDrawer({ type: "create" });
  }

  function openEdit(sa: SubAdmin) {
    setForm({
      fullName: sa.fullName,
      email: sa.email,
      mobile: sa.mobile,
      countryCode: sa.countryCode,
      roleId: sa.roleId,
      nationality: sa.nationality,
      country: sa.country,
      status: sa.status,
    });
    setFormErrors({});
    setDrawer({ type: "edit", subAdmin: sa });
  }

  function closeDrawer() {
    setDrawer({ type: "closed" });
  }

  // ── Save sub-admin ──
  async function handleSave() {
    const existingEmails = subAdmins.map((s) => s.email);
    const editingEmail =
      drawer.type === "edit" ? drawer.subAdmin.email : undefined;

    const errs = validateSubAdminForm(form, existingEmails, editingEmail);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));

    const selectedRole = roles.find((r) => r.id === form.roleId);

    if (drawer.type === "create") {
      const newSA: SubAdmin = {
        id: generateId(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        countryCode: form.countryCode,
        roleId: form.roleId,
        roleName: selectedRole?.name ?? "",
        roleColourHex: selectedRole?.colourHex ?? "#64748B",
        nationality: form.nationality,
        country: form.country,
        status: form.status,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
      };
      setSubAdmins((prev) => [newSA, ...prev]);
      // Update role sub-admin count
      if (selectedRole) {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === selectedRole.id
              ? { ...r, subAdminCount: r.subAdminCount + 1 }
              : r,
          ),
        );
      }
      toast.success(
        "Sub-admin created successfully. An email invite has been sent.",
      );
    } else if (drawer.type === "edit") {
      const original = drawer.subAdmin;
      setSubAdmins((prev) =>
        prev.map((s) =>
          s.id === original.id
            ? {
                ...s,
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                mobile: form.mobile.trim(),
                countryCode: form.countryCode,
                roleId: form.roleId,
                roleName: selectedRole?.name ?? s.roleName,
                roleColourHex: selectedRole?.colourHex ?? s.roleColourHex,
                nationality: form.nationality,
                country: form.country,
                status: form.status,
              }
            : s,
        ),
      );
      toast.success("Sub-admin updated successfully.");
    }

    setSaving(false);
    closeDrawer();
  }

  // ── Confirm actions ──
  async function handleConfirm() {
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 700));

    switch (modal.type) {
      case "activate": {
        const { subAdmin } = modal;
        setSubAdmins((prev) =>
          prev.map((s) =>
            s.id === subAdmin.id ? { ...s, status: "Active" } : s,
          ),
        );
        toast.success("Sub-admin activated.");
        break;
      }
      case "deactivate": {
        const { subAdmin } = modal;
        setSubAdmins((prev) =>
          prev.map((s) =>
            s.id === subAdmin.id ? { ...s, status: "Inactive" } : s,
          ),
        );
        toast.success("Sub-admin deactivated and logged out.");
        break;
      }
      case "delete-sub-admin": {
        const { subAdmin } = modal;
        setSubAdmins((prev) => prev.filter((s) => s.id !== subAdmin.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(subAdmin.id);
          return next;
        });
        toast.success("Sub-admin deleted.");
        break;
      }
      case "delete-role": {
        const { role } = modal;
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
        // Deactivate sub-admins with this role
        if (role.subAdminCount > 0) {
          setSubAdmins((prev) =>
            prev.map((s) =>
              s.roleId === role.id ? { ...s, status: "Inactive" } : s,
            ),
          );
        }
        toast.success(
          "Role deleted. All assigned sub-admins have been deactivated.",
        );
        break;
      }
      case "resend": {
        const { subAdmin } = modal;
        toast.success(`Email invite resent successfully.`);
        break;
      }
      case "bulk-activate": {
        const { ids } = modal;
        setSubAdmins((prev) =>
          prev.map((s) =>
            ids.includes(s.id) ? { ...s, status: "Active" } : s,
          ),
        );
        setSelectedIds(new Set());
        toast.success(`${ids.length} sub-admins activated successfully.`);
        break;
      }
      case "bulk-deactivate": {
        const { ids } = modal;
        setSubAdmins((prev) =>
          prev.map((s) =>
            ids.includes(s.id) ? { ...s, status: "Inactive" } : s,
          ),
        );
        setSelectedIds(new Set());
        toast.success(`${ids.length} sub-admins deactivated successfully.`);
        break;
      }
      case "bulk-delete": {
        const { ids } = modal;
        setSubAdmins((prev) => prev.filter((s) => !ids.includes(s.id)));
        setSelectedIds(new Set());
        toast.success(`${ids.length} sub-admins deleted successfully.`);
        break;
      }
    }

    setConfirming(false);
    setModal({ type: "none" });
  }

  // ── Export handler ──
  function handleExport(fmt: ExportFormat) {
    toast.info(`Export file is being generated. Download will start shortly.`);
  }

  // ── Initials helper ──
  function initials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 p-6">
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-10 rounded-lg bg-[#003B95]/10 flex items-center justify-center">
                <UserCog size={19} className="text-[#003B95]" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Sub-Admin Management
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-[46px]">
              Manage sub-admin accounts and configure custom roles with granular
              permissions.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => navigate("/sub-admins/roles/new")}
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              Create Role
            </Button>
            <Button
              onClick={openCreate}
              className="flex items-center gap-2 bg-[#003B95] hover:bg-[#002d73] text-white"
              aria-label="Create new sub-admin"
            >
              <Plus size={16} />
              Create Sub-Admin
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Total Sub-Admins"
            value={stats.total}
            icon={Users}
            color="text-[#003B95]"
            bg="bg-[#003B95]/10"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={UserCheck}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatCard
            label="Inactive"
            value={stats.inactive}
            icon={UserX}
            color="text-gray-500"
            bg="bg-gray-100"
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-200 gap-1" role="tablist">
          {[
            { id: "sub-admins" as const, label: "Sub-Admins" },
            { id: "roles" as const, label: "Roles" },
          ].map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setSelectedIds(new Set());
              }}
              className={cn(
                "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === t.id
                  ? "border-[#003B95] text-[#003B95]"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB: Sub-Admins
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "sub-admins" && (
          <div
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            role="tabpanel"
            aria-labelledby="sub-admins-tab"
          >
            {/* Bulk Action Toolbar */}
            {selectedIds.size > 0 && (
              <div
                className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100"
                aria-live="polite"
              >
                <span className="text-sm font-medium text-blue-800">
                  {selectedIds.size} row{selectedIds.size !== 1 ? "s" : ""}{" "}
                  selected
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() =>
                      setModal({
                        type: "bulk-activate",
                        ids: Array.from(selectedIds),
                      })
                    }
                  >
                    <ShieldCheck size={13} className="mr-1" />
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() =>
                      setModal({
                        type: "bulk-deactivate",
                        ids: Array.from(selectedIds),
                      })
                    }
                  >
                    <ShieldOff size={13} className="mr-1" />
                    Deactivate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() =>
                      setModal({
                        type: "bulk-delete",
                        ids: Array.from(selectedIds),
                      })
                    }
                  >
                    <Trash2 size={13} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Filter / Search bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
              <div className="relative flex-1 min-w-[240px]" role="search">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="Search by name, email, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  aria-label="Search sub-admins"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <Select
                value={filterStatus}
                onValueChange={(v) =>
                  setFilterStatus(v as SubAdminStatus | "All")
                }
              >
                <SelectTrigger
                  className="h-10 w-[140px] text-sm"
                  aria-label="Filter by status"
                >
                  <Filter size={13} className="mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {(search || filterStatus !== "All") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setFilterStatus("All");
                  }}
                  className="h-10 text-sm text-gray-500"
                >
                  <X size={13} className="mr-1" />
                  Clear
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {filteredSubAdmins.length} result
                  {filteredSubAdmins.length !== 1 ? "s" : ""}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 text-sm text-gray-600"
                    >
                      <Download size={14} className="mr-1.5" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {EXPORT_FORMATS.map((fmt) => (
                      <DropdownMenuItem
                        key={fmt}
                        onClick={() => handleExport(fmt)}
                      >
                        {fmt}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* DataTable */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          allPageSelected
                            ? true
                            : someSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all rows"
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("fullName")}
                    >
                      <span className="flex items-center gap-1">
                        Name{" "}
                        <SortIcon
                          active={sortField === "fullName"}
                          dir={sortDir}
                        />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("email")}
                    >
                      <span className="flex items-center gap-1">
                        Email{" "}
                        <SortIcon
                          active={sortField === "email"}
                          dir={sortDir}
                        />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("mobile")}
                    >
                      <span className="flex items-center gap-1">
                        Mobile{" "}
                        <SortIcon
                          active={sortField === "mobile"}
                          dir={sortDir}
                        />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("roleName")}
                    >
                      <span className="flex items-center gap-1">
                        Role{" "}
                        <SortIcon
                          active={sortField === "roleName"}
                          dir={sortDir}
                        />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("nationality")}
                    >
                      <span className="flex items-center gap-1">
                        Nationality{" "}
                        <SortIcon
                          active={sortField === "nationality"}
                          dir={sortDir}
                        />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("country")}
                    >
                      <span className="flex items-center gap-1">
                        Country{" "}
                        <SortIcon
                          active={sortField === "country"}
                          dir={sortDir}
                        />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("status")}
                    >
                      <span className="flex items-center gap-1">
                        Status{" "}
                        <SortIcon
                          active={sortField === "status"}
                          dir={sortDir}
                        />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("lastLogin")}
                    >
                      <span className="flex items-center gap-1">
                        Last Login{" "}
                        <SortIcon
                          active={sortField === "lastLogin"}
                          dir={sortDir}
                        />
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedSubAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users size={28} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-700 font-medium">
                              No Sub-Admins Found
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              Create your first sub-admin to delegate admin
                              responsibilities.
                            </p>
                          </div>
                          <Button
                            onClick={openCreate}
                            className="mt-2 bg-[#003B95] hover:bg-[#002d73] text-white"
                          >
                            <Plus size={15} className="mr-1.5" />
                            Create Sub-Admin
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedSubAdmins.map((sa) => (
                      <TableRow
                        key={sa.id}
                        className={cn(
                          "hover:bg-gray-50/60 transition-colors",
                          selectedIds.has(sa.id) && "bg-blue-50/50",
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(sa.id)}
                            onCheckedChange={() => toggleSelect(sa.id)}
                            aria-label={`Select ${sa.fullName}`}
                          />
                        </TableCell>
                        {/* Name */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#003B95]/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-[#003B95] select-none">
                                {initials(sa.fullName)}
                              </span>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm font-medium text-gray-900 truncate max-w-[160px] cursor-default">
                                  {sa.fullName}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{sa.fullName}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        {/* Email */}
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {sa.email}
                          </span>
                        </TableCell>
                        {/* Mobile */}
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {sa.countryCode} {sa.mobile}
                          </span>
                        </TableCell>
                        {/* Role with colour dot */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: sa.roleColourHex }}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-gray-700 truncate max-w-[120px] cursor-default">
                                  {sa.roleName}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{sa.roleName}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        {/* Nationality */}
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {sa.nationality || "—"}
                          </span>
                        </TableCell>
                        {/* Country */}
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {sa.country || "—"}
                          </span>
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              statusColor(sa.status),
                            )}
                          >
                            {sa.status}
                          </span>
                        </TableCell>
                        {/* Last Login */}
                        <TableCell>
                          {sa.lastLogin ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-gray-500 cursor-default">
                                  {fmtRelative(sa.lastLogin)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {fmtDateTime(sa.lastLogin)} UTC
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Never
                            </span>
                          )}
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-500"
                                aria-haspopup="true"
                              >
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              <DropdownMenuItem onClick={() => openEdit(sa)}>
                                <Edit2 size={14} className="mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {sa.status === "Active" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setModal({
                                      type: "deactivate",
                                      subAdmin: sa,
                                    })
                                  }
                                >
                                  <ShieldOff size={14} className="mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setModal({ type: "activate", subAdmin: sa })
                                  }
                                >
                                  <ShieldCheck size={14} className="mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {sa.mustChangePassword && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setModal({ type: "resend", subAdmin: sa })
                                  }
                                >
                                  <MailCheck size={14} className="mr-2" />
                                  Resend Invite
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setModal({
                                    type: "delete-sub-admin",
                                    subAdmin: sa,
                                  })
                                }
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredSubAdmins.length > 0 && (
              <PaginationControl
                page={page}
                totalPages={totalPages}
                totalItems={filteredSubAdmins.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: Roles
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "roles" && (
          <div
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            role="tabpanel"
            aria-labelledby="roles-tab"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[40px]">Colour</TableHead>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">
                      Sub-Admins Assigned
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Settings size={28} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-700 font-medium">
                              No Roles Defined
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              Create a custom role to assign permissions.
                            </p>
                          </div>
                          <Button
                            onClick={() => navigate("/sub-admins/roles/new")}
                            className="mt-2 bg-[#003B95] hover:bg-[#002d73] text-white"
                          >
                            <Plus size={15} className="mr-1.5" />
                            Create Role
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedRoles.map((role) => (
                      <TableRow
                        key={role.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        {/* Colour dot */}
                        <TableCell>
                          <span
                            className="w-4 h-4 rounded-full inline-block"
                            style={{ backgroundColor: role.colourHex }}
                          />
                        </TableCell>
                        {/* Role Name */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium text-gray-900 truncate max-w-[180px] cursor-default">
                                {role.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{role.name}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        {/* Description */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-gray-600 truncate max-w-[260px] block cursor-default">
                                {role.description || "—"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {role.description}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        {/* Sub-Admin Count */}
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {role.subAdminCount}
                          </Badge>
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              statusColor(role.status),
                            )}
                          >
                            {role.status}
                          </span>
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-500"
                              >
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[140px]"
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/sub-admins/roles/${role.id}/edit`)
                                }
                              >
                                <Edit2 size={14} className="mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setModal({ type: "delete-role", role })
                                }
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {roles.length > 0 && (
              <PaginationControl
                page={rolesPage}
                totalPages={rolesTotalPages}
                totalItems={roles.length}
                pageSize={rolesPageSize}
                onPageChange={setRolesPage}
                onPageSizeChange={(s) => {
                  setRolesPageSize(s);
                  setRolesPage(1);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          RIGHT-SIDE DRAWER: Create / Edit Sub-Admin
      ════════════════════════════════════════════════════════════════════ */}
      <Sheet
        open={drawer.type !== "closed"}
        onOpenChange={(o) => !o && closeDrawer()}
      >
        <SheetContent
          className="w-[480px] sm:max-w-[480px] overflow-y-auto"
          side="right"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          <SheetHeader>
            <SheetTitle id="drawer-title" className="flex items-center gap-2">
              <UserCog size={18} className="text-[#003B95]" />
              {drawer.type === "create" ? "Create Sub-Admin" : "Edit Sub-Admin"}
            </SheetTitle>
            <SheetDescription>
              {drawer.type === "create"
                ? "Create a new team member account. An invitation email with a temporary password will be sent automatically."
                : "Update the sub-admin's profile, role, or status."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-6 px-1">
            {/* Full Name */}
            <Field label="Full Name" required error={formErrors.fullName}>
              <Input
                placeholder="Enter full name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className={cn(formErrors.fullName && "border-red-400")}
                maxLength={100}
                aria-required="true"
              />
            </Field>

            {/* Email */}
            <Field label="Email" required error={formErrors.email}>
              <Input
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className={cn(formErrors.email && "border-red-400")}
                maxLength={254}
                aria-required="true"
              />
            </Field>

            {/* Mobile */}
            <Field label="Mobile" required error={formErrors.mobile}>
              <div className="flex gap-2">
                <Select
                  value={form.countryCode}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, countryCode: v }))
                  }
                >
                  <SelectTrigger className="w-[120px] text-sm flex-shrink-0">
                    <Phone size={13} className="mr-1 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.code} value={opt.code}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={form.mobile}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      mobile: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className={cn(
                    "flex-1",
                    formErrors.mobile && "border-red-400",
                  )}
                  maxLength={15}
                  aria-required="true"
                />
              </div>
            </Field>

            {/* Role */}
            <Field label="Role" required error={formErrors.roleId}>
              {activeRoles.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    No active roles available. Please create a role first.
                  </p>
                </div>
              ) : (
                <Select
                  value={form.roleId}
                  onValueChange={(v) => setForm((f) => ({ ...f, roleId: v }))}
                >
                  <SelectTrigger
                    className={cn(
                      "text-sm",
                      formErrors.roleId && "border-red-400",
                    )}
                    aria-required="true"
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: role.colourHex }}
                          />
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>

            {/* Nationality */}
            <Field label="Nationality">
              <Select
                value={form.nationality || "__none__"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    nationality: v === "__none__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger className="text-sm">
                  <Globe size={13} className="mr-1 text-gray-400" />
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-gray-400">Select nationality</span>
                  </SelectItem>
                  {NATIONALITY_OPTIONS.map((nat) => (
                    <SelectItem key={nat} value={nat}>
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Country */}
            <Field label="Country">
              <Select
                value={form.country || "__none__"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, country: v === "__none__" ? "" : v }))
                }
              >
                <SelectTrigger className="text-sm">
                  <Globe size={13} className="mr-1 text-gray-400" />
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-gray-400">Select country</span>
                  </SelectItem>
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Status toggle */}
            <div className="flex items-center justify-between py-2 px-1">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Status
                </Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  {form.status === "Active"
                    ? "Sub-admin can log in"
                    : "Sub-admin cannot log in"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    form.status === "Active"
                      ? "text-emerald-600"
                      : "text-gray-400",
                  )}
                >
                  {form.status}
                </span>
                <Switch
                  checked={form.status === "Active"}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({
                      ...f,
                      status: checked ? "Active" : "Inactive",
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <SheetFooter className="gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={closeDrawer} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || activeRoles.length === 0}
              className="bg-[#003B95] hover:bg-[#002d73] text-white min-w-[140px]"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin mr-2" />
              ) : (
                <Check size={15} className="mr-2" />
              )}
              {drawer.type === "create"
                ? "Create & Send Invite"
                : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ════════════════════════════════════════════════════════════════════
          CONFIRM MODALS
      ════════════════════════════════════════════════════════════════════ */}

      {/* Deactivate sub-admin */}
      <Dialog
        open={modal.type === "deactivate"}
        onOpenChange={(o) => !o && setModal({ type: "none" })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <ShieldOff size={18} className="text-amber-600" />
              Deactivate Sub-Admin
            </DialogTitle>
            <DialogDescription>
              Deactivating this sub-admin will log them out immediately.
              Continue?
            </DialogDescription>
          </DialogHeader>
          {modal.type === "deactivate" && (
            <p className="text-sm text-gray-600 py-2">
              <span className="font-medium">{modal.subAdmin.fullName}</span>{" "}
              will lose access to the admin panel immediately.
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModal({ type: "none" })}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={confirming}
              className="min-w-[120px]"
            >
              {confirming && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate sub-admin */}
      <Dialog
        open={modal.type === "activate"}
        onOpenChange={(o) => !o && setModal({ type: "none" })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck size={18} className="text-emerald-600" />
              Activate Sub-Admin
            </DialogTitle>
            <DialogDescription>
              This sub-admin will be able to log in immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModal({ type: "none" })}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[110px]"
            >
              {confirming && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete sub-admin */}
      <Dialog
        open={modal.type === "delete-sub-admin"}
        onOpenChange={(o) => !o && setModal({ type: "none" })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 size={18} className="text-red-600" />
              Delete Sub-Admin
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sub-admin? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {modal.type === "delete-sub-admin" && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">{modal.subAdmin.fullName}</span> (
                {modal.subAdmin.email}) will be permanently removed.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModal({ type: "none" })}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={confirming}
              className="min-w-[100px]"
            >
              {confirming && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete role */}
      <Dialog
        open={modal.type === "delete-role"}
        onOpenChange={(o) => !o && setModal({ type: "none" })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 size={18} className="text-red-600" />
              Delete Role
            </DialogTitle>
            <DialogDescription>
              {modal.type === "delete-role" && modal.role.subAdminCount > 0
                ? `Deleting this role will deactivate ${modal.role.subAdminCount} sub-admin${modal.role.subAdminCount !== 1 ? "s" : ""} who have this role. They will be logged out immediately. Continue?`
                : "Are you sure you want to delete this role? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          {modal.type === "delete-role" && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">
                Role: <span className="font-medium">{modal.role.name}</span>
                {modal.role.subAdminCount > 0 && (
                  <span>
                    {" "}
                    ({modal.role.subAdminCount} assigned sub-admin
                    {modal.role.subAdminCount !== 1 ? "s" : ""} will be
                    deactivated)
                  </span>
                )}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModal({ type: "none" })}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={confirming}
              className="min-w-[100px]"
            >
              {confirming && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend invite */}
      <Dialog
        open={modal.type === "resend"}
        onOpenChange={(o) => !o && setModal({ type: "none" })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailCheck size={18} className="text-[#003B95]" />
              Resend Invitation
            </DialogTitle>
            <DialogDescription>
              {modal.type === "resend" && (
                <>
                  A new invitation email will be sent to{" "}
                  <span className="font-medium">{modal.subAdmin.email}</span>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModal({ type: "none" })}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="bg-[#003B95] hover:bg-[#002d73] text-white min-w-[130px]"
            >
              {confirming && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Resend Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk activate */}
      <Dialog
        open={modal.type === "bulk-activate"}
        onOpenChange={(o) => !o && setModal({ type: "none" })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Activate</DialogTitle>
            <DialogDescription>
              {modal.type === "bulk-activate" &&
                `Activate ${modal.ids.length} selected sub-admin${modal.ids.length !== 1 ? "s" : ""}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModal({ type: "none" })}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
            >
              {confirming && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk deactivate */}
      <Dialog
        open={modal.type === "bulk-deactivate"}
        onOpenChange={(o) => !o && setModal({ type: "none" })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Deactivate</DialogTitle>
            <DialogDescription>
              {modal.type === "bulk-deactivate" &&
                `Deactivate ${modal.ids.length} selected sub-admin${modal.ids.length !== 1 ? "s" : ""}? They will be logged out immediately.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModal({ type: "none" })}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={confirming}
              className="min-w-[110px]"
            >
              {confirming && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete */}
      <Dialog
        open={modal.type === "bulk-delete"}
        onOpenChange={(o) => !o && setModal({ type: "none" })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-700">
              Confirm Bulk Delete
            </DialogTitle>
            <DialogDescription>
              {modal.type === "bulk-delete" &&
                `Delete ${modal.ids.length} selected sub-admin${modal.ids.length !== 1 ? "s" : ""}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModal({ type: "none" })}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={confirming}
              className="min-w-[100px]"
            >
              {confirming && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
