import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  type Dispatch,
  type ElementType,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  formatDistanceToNow,
  format,
  differenceInYears,
  isAfter,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  X,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCircle2,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import { adminService } from "../../../../services/admin.service";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Skeleton } from "../../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import type { PlayerDependent } from "./player-detail-data";

/** Same as web AddEditDependantPage / profile API: male, female only. */
const DEPENDANT_GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

const NAME_REGEX = /^[\p{L}\s'\-]+$/u;
const MAX_NAME_LENGTH = 50;
const DOB_MIN_YEAR = 1940;

// ─── Types ───────────────────────────────────────────────────
type BannerType = "success" | "error" | "info" | "warning";
type SortField = "name" | "relationship" | "lastUpdated";
type SortDir = "asc" | "desc";

const BANNER_STYLES: Record<
  BannerType,
  { bg: string; border: string; text: string; icon: ElementType }
> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: XCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: Info,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: AlertTriangle,
  },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function getAge(dob: string): number | null {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return differenceInYears(new Date(), d);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1 text-xs text-red-600 mt-1"
    >
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function HelperText({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <p id={id} className="text-[11px] text-gray-500 mt-1 leading-relaxed">
      {children}
    </p>
  );
}

function FormField({
  id,
  label,
  required,
  error,
  help,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-[#374151]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <FieldError id={`${id}-error`} message={error} />}
      {help && !error && <HelperText id={`${id}-help`}>{help}</HelperText>}
    </div>
  );
}

function SortableHeader({
  field,
  sortField,
  sortDir,
  onSort,
  children,
  className,
}: {
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableHead
      className={cn(
        "px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:bg-gray-100/50 transition-colors",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 w-full"
        aria-label={`Sort by ${field}`}
      >
        {children}
        {sortField === field ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-[#003B95]" />
          ) : (
            <ArrowDown className="h-3 w-3 text-[#003B95]" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-gray-300" />
        )}
      </button>
    </TableHead>
  );
}

// ─── Props ───────────────────────────────────────────────────
interface DependentsTabProps {
  playerId: string;
  dependents: PlayerDependent[];
  setDependents: Dispatch<SetStateAction<PlayerDependent[]>>;
  playerName: string;
  isLoading?: boolean;
}

export function DependentsTab({
  playerId,
  dependents,
  setDependents,
  playerName,
  isLoading: isParentLoading,
}: DependentsTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [relationTypes, setRelationTypes] = useState<
    { id: string; name_en: string; label?: string }[]
  >([]);

  // Sync loading state
  useEffect(() => {
    if (isParentLoading !== undefined) setIsLoading(isParentLoading);
  }, [isParentLoading]);

  // Fetch relations on mount
  useEffect(() => {
    adminService
      .listMasterData("relation_types", { status: "active", limit: 100 })
      .then((res) => setRelationTypes(res.data?.items || []))
      .catch(() => setRelationTypes([]));
  }, []);

  // ── Inline banner ─────────────────────────────────────
  const [banner, setBanner] = useState<{
    type: BannerType;
    message: string;
    visible: boolean;
  }>({
    type: "info",
    message: "",
    visible: false,
  });
  const showBanner = useCallback((type: BannerType, message: string) => {
    setBanner({ type, message, visible: true });
    if (type !== "error")
      setTimeout(() => setBanner((b) => ({ ...b, visible: false })), 5000);
  }, []);

  // ── Sorting ───────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedDependents = useMemo(() => {
    if (!sortField) return dependents;
    return [...dependents].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")
        cmp = `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        );
      else if (sortField === "relationship")
        cmp = a.relationship.localeCompare(b.relationship);
      else if (sortField === "lastUpdated")
        cmp = a.lastUpdated.getTime() - b.lastUpdated.getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [dependents, sortField, sortDir]);

  // ── Pagination ────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sortedDependents.length / pageSize));
  const pagedDependents = sortedDependents.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [dependents.length, pageSize]);

  // ── Dependent Modal ───────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerDependent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dobOpen, setDobOpen] = useState(false);

  const emptyDep = {
    first_name_en: "",
    last_name_en: "",
    relation_type_id: "",
    gender: "" as string,
    dob: "",
  };
  const [form, setForm] = useState(emptyDep);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openAdd = () => {
    setEditing(null);
    setForm(emptyDep);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (dep: PlayerDependent) => {
    setEditing(dep);
    setForm({
      first_name_en: dep.firstName,
      last_name_en: dep.lastName,
      relation_type_id:
        dep.relation_type_id ||
        relationTypes.find((r) => r.name_en === dep.relationship)?.id ||
        "",
      gender: dep.gender || "",
      dob: dep.dateOfBirth,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "first_name_en": {
        const t = value.trim();
        if (!t) return "First name is required.";
        if (!NAME_REGEX.test(t))
          return "First name can only contain letters and spaces.";
        if (t.length > MAX_NAME_LENGTH)
          return "First name cannot exceed 50 characters.";
        return "";
      }
      case "last_name_en": {
        const t = value.trim();
        if (!t) return "Last name is required.";
        if (!NAME_REGEX.test(t))
          return "Last name can only contain letters and spaces.";
        if (t.length > MAX_NAME_LENGTH)
          return "Last name cannot exceed 50 characters.";
        return "";
      }
      case "relation_type_id":
        return !value ? "Please select a relation." : "";
      case "gender":
        return !value ? "Please select a gender." : "";
      case "dob": {
        if (!value) return "Date of birth is required.";
        const d = parseISO(value);
        if (!isValid(d)) return "Please select a valid date.";
        const today = startOfDay(new Date());
        if (isAfter(startOfDay(d), today))
          return "Date of birth cannot be in the future.";
        if (d.getFullYear() < DOB_MIN_YEAR)
          return `Date of birth must be ${DOB_MIN_YEAR} or later.`;
        return "";
      }
      default:
        return "";
    }
  };

  const handleBlur = (field: string) => {
    const val = (form as Record<string, unknown>)[field] as string;
    const err = validateField(field, val);
    setErrors((prev) => {
      if (err) return { ...prev, [field]: err };
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  const validateAll = (): boolean => {
    const e: Record<string, string> = {};
    ["first_name_en", "last_name_en", "relation_type_id", "gender", "dob"].forEach(
      (f) => {
        const val = (form as Record<string, unknown>)[f] as string;
        const err = validateField(f, val);
        if (err) e[f] = err;
      },
    );
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isFormValid = useMemo(() => {
    if (
      !form.first_name_en.trim() ||
      !form.last_name_en.trim() ||
      !form.relation_type_id ||
      !form.gender ||
      !form.dob
    ) {
      return false;
    }
    const d = parseISO(form.dob);
    if (!isValid(d)) return false;
    if (isAfter(startOfDay(d), startOfDay(new Date()))) return false;
    if (d.getFullYear() < DOB_MIN_YEAR) return false;
    return true;
  }, [form]);

  const handleSave = async () => {
    if (!validateAll()) return;
    setIsSaving(true);
    try {
      const payload = {
        first_name: form.first_name_en.trim(),
        last_name: form.last_name_en.trim(),
        date_of_birth: form.dob,
        gender: form.gender,
        relation_type_id: form.relation_type_id,
      };
      let res;
      if (editing) {
        res = await adminService.updatePlayerDependant(
          playerId,
          editing.id,
          payload,
        );
        toast.success("Dependent updated.");
      } else {
        res = await adminService.addPlayerDependant(playerId, payload);
        toast.success("Dependent added.");
      }

      const envelope = res as Record<string, unknown>;
      const backendDep = (envelope?.data ?? envelope) as Record<string, unknown>;
      const relId = String(backendDep.relation_type_id ?? "");
      const mapped: PlayerDependent = {
        id: String(backendDep.id ?? ""),
        firstName: String(backendDep.first_name ?? backendDep.first_name_en ?? ""),
        lastName: String(backendDep.last_name ?? backendDep.last_name_en ?? ""),
        relationship:
          relationTypes.find((r) => r.id === relId)?.name_en ||
          String(backendDep.relation_type_label ?? "Dependent"),
        relation_type_id: relId,
        gender: String(backendDep.gender ?? ""),
        dateOfBirth: String(
          backendDep.date_of_birth ?? backendDep.dob ?? form.dob,
        ),
        lastUpdated: new Date(
          String(backendDep.updated_at ?? backendDep.created_at ?? Date.now()),
        ),
      };

      if (editing) {
        setDependents((prev) =>
          prev.map((d) => (d.id === editing.id ? mapped : d)),
        );
      } else {
        setDependents((prev) => [...prev, mapped]);
      }
      setModalOpen(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save dependent.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminService.deletePlayerDependant(playerId, deleteId);
      setDependents((prev) => prev.filter((d) => d.id !== deleteId));
      setDeleteId(null);
      toast.success("Dependent deleted.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete dependent.");
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* ── Inline Banner ──────────────────────────────── */}
      {banner.visible && (
        <div
          role={banner.type === "error" ? "alert" : "status"}
          aria-live={banner.type === "error" ? "assertive" : "polite"}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-sm",
            BANNER_STYLES[banner.type].bg,
            BANNER_STYLES[banner.type].border,
            BANNER_STYLES[banner.type].text,
          )}
        >
          {(() => {
            const Icon = BANNER_STYLES[banner.type].icon;
            return <Icon className="h-4 w-4 shrink-0" />;
          })()}
          <p className="text-sm flex-1">{banner.message}</p>
          <button
            onClick={() => setBanner((b) => ({ ...b, visible: false }))}
            className="p-1 rounded hover:bg-black/5 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Main Card ──────────────────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[#111827] font-semibold text-base">
              Dependents
            </h2>
            <Badge
              variant="outline"
              className="text-[11px] bg-gray-50 text-gray-600 border-gray-200"
            >
              {dependents.length}
            </Badge>
          </div>
          {dependents.length > 0 && (
            <Button
              size="sm"
              onClick={openAdd}
              disabled={isLoading}
              className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add Dependent
            </Button>
          )}
        </div>

        {/* ── Loading State ────────────────────────────── */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-3 border-b last:border-0 border-gray-50"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-4 w-20 hidden md:block" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : dependents.length > 0 ? (
          <>
            {/* ── Desktop Table ──────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <caption className="sr-only">
                  Dependents for {playerName}
                </caption>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <SortableHeader
                      field="name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    >
                      Full Name
                    </SortableHeader>
                    <SortableHeader
                      field="relationship"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    >
                      Relationship
                    </SortableHeader>
                    <TableHead className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                      Age / DOB
                    </TableHead>
                    <SortableHeader
                      field="lastUpdated"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    >
                      Updated
                    </SortableHeader>
                    <TableHead className="px-5 py-3 w-10 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedDependents.map((dep) => {
                    const age = getAge(dep.dateOfBirth);
                    return (
                      <TableRow
                        key={dep.id}
                        className="group hover:bg-blue-50/20 transition-colors border-b last:border-0 border-gray-50"
                      >
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#003B95] font-bold text-xs">
                              {dep.firstName[0]}
                              {dep.lastName[0]}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {dep.firstName} {dep.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 py-0 font-medium bg-gray-50 text-gray-600 border-gray-200"
                          >
                            {dep.relationship}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700">
                              {age !== null ? `${age} yrs` : "—"}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {dep.dateOfBirth}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                            {formatDistanceToNow(dep.lastUpdated, {
                              addSuffix: true,
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                aria-label="Actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openEdit(dep)}>
                                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                                Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteId(dep.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ── Mobile Card View ───────────────────── */}
            <div className="md:hidden divide-y divide-gray-50">
              {pagedDependents.map((dep) => {
                const age = getAge(dep.dateOfBirth);
                return (
                  <div key={dep.id} className="p-4 space-y-3 active:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#003B95] font-bold text-xs uppercase">
                          {dep.firstName[0]}
                          {dep.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {dep.firstName} {dep.lastName}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 py-0 w-fit"
                          >
                            {dep.relationship}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(dep)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteId(dep.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-500">
                        DOB:{" "}
                        <span className="text-gray-900 font-medium">
                          {dep.dateOfBirth}
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Age:{" "}
                        <span className="text-gray-900 font-medium">
                          {age} yrs
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Updated{" "}
                      {formatDistanceToNow(dep.lastUpdated, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ─────────────────────────── */}
            {dependents.length > 5 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t bg-gray-50/30 gap-4">
                <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                  <span>Show:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v))}
                  >
                    <SelectTrigger className="h-7 w-16 text-[11px] shadow-none bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="hidden sm:inline">
                    {Math.min((page - 1) * pageSize + 1, dependents.length)}–
                    {Math.min(page * pageSize, dependents.length)} of{" "}
                    {dependents.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-8 w-8 p-0 rounded-md shadow-sm border-gray-200"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </Button>
                  <div className="flex items-center text-xs font-bold text-gray-900 px-2">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 w-8 p-0 rounded-md shadow-sm border-gray-200"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Empty State ─────────────────────────────── */
          <div className="text-center py-20 px-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
              <Users className="h-8 w-8 text-gray-200" />
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-1">
              No dependents added
            </h3>
            <p className="text-sm text-gray-500 max-w-[280px] mx-auto mb-6 leading-relaxed">
              Add family members to this player's profile to track bookings and
              eligibility.
            </p>
            <Button
              size="sm"
              onClick={openAdd}
              className="bg-[#003B95] hover:bg-[#002a6b] gap-2 shadow-md"
            >
              <Plus className="h-4 w-4" /> Add Dependent
            </Button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          Dependent Form Modal
          ══════════════════════════════════════════════════ */}
      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          if (!isSaving) setModalOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 rounded-2xl border-0 shadow-2xl">
          <div className="bg-[#003B95] px-6 py-8 text-white relative">
            <DialogTitle className="text-xl font-bold">
              {editing ? "Update Profile" : "Register Dependent"}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-xs mt-1.5 opacity-90 leading-relaxed max-w-sm">
              Dependent data is used for booking eligibility verification.
              Ensure the date of birth is accurate.
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="px-6 py-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {/* Row 1: Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                id="depFirst"
                label="First Name"
                required
                error={errors.first_name_en}
              >
                <Input
                  id="depFirst"
                  placeholder="Jane"
                  maxLength={MAX_NAME_LENGTH}
                  value={form.first_name_en}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, first_name_en: e.target.value }));
                    setErrors((prev) => {
                      const n = { ...prev };
                      delete n.first_name_en;
                      return n;
                    });
                  }}
                  onBlur={() => handleBlur("first_name_en")}
                  disabled={isSaving}
                  className={cn(
                    "h-10",
                    errors.first_name_en && "border-red-400",
                  )}
                />
              </FormField>
              <FormField
                id="depLast"
                label="Last Name"
                required
                error={errors.last_name_en}
              >
                <Input
                  id="depLast"
                  placeholder="Doe"
                  maxLength={MAX_NAME_LENGTH}
                  value={form.last_name_en}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, last_name_en: e.target.value }));
                    setErrors((prev) => {
                      const n = { ...prev };
                      delete n.last_name_en;
                      return n;
                    });
                  }}
                  onBlur={() => handleBlur("last_name_en")}
                  disabled={isSaving}
                  className={cn(
                    "h-10",
                    errors.last_name_en && "border-red-400",
                  )}
                />
              </FormField>
            </div>

            {/* Row 2: Relation & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                id="depRel"
                label="Relationship"
                required
                error={errors.relation_type_id}
              >
                <Select
                  value={form.relation_type_id}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, relation_type_id: v }));
                    setErrors((e) => {
                      const n = { ...e };
                      delete n.relation_type_id;
                      return n;
                    });
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="depRel"
                    className={cn(
                      "h-10",
                      errors.relation_type_id && "border-red-400",
                    )}
                  >
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationTypes.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">
                        {r.label ?? r.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                id="depGender"
                label="Gender"
                required
                error={errors.gender}
              >
                <Select
                  value={form.gender || undefined}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, gender: v }));
                    setErrors((e) => {
                      const n = { ...e };
                      delete n.gender;
                      return n;
                    });
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="depGender"
                    className={cn(
                      "h-10",
                      errors.gender && "border-red-400",
                    )}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPENDANT_GENDER_OPTIONS.map((g) => (
                      <SelectItem
                        key={g.value}
                        value={g.value}
                        className="text-xs"
                      >
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Row 3: DOB (aligned with web dependant form — no extra contact fields) */}
            <div className="grid grid-cols-1 gap-5">
              <FormField
                id="depDob"
                label="Date of Birth"
                required
                error={errors.dob}
              >
                <Popover open={dobOpen} onOpenChange={setDobOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isSaving}
                      className={cn(
                        "w-full justify-start gap-2 text-sm h-10 font-normal",
                        !form.dob && "text-muted-foreground",
                        errors.dob && "border-red-400",
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      {form.dob
                        ? format(new Date(form.dob), "PPP")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      fromYear={DOB_MIN_YEAR}
                      toYear={new Date().getFullYear()}
                      selected={form.dob ? new Date(form.dob) : undefined}
                      onSelect={(d) => {
                        if (d) {
                          const formatted = format(d, "yyyy-MM-dd");
                          setForm((f) => ({ ...f, dob: formatted }));
                          // Validate with the selected value here — do not call handleBlur("dob");
                          // deferred blur reads stale form state before setForm commits.
                          const err = validateField("dob", formatted);
                          setErrors((prev) => {
                            const n = { ...prev };
                            if (err) n.dob = err;
                            else delete n.dob;
                            return n;
                          });
                        }
                        setDobOpen(false);
                      }}
                      disabled={(d) =>
                        isAfter(d, new Date()) ||
                        d.getFullYear() < DOB_MIN_YEAR
                      }
                      defaultMonth={
                        form.dob ? new Date(form.dob) : new Date(2000, 0)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormField>
            </div>
          </div>

          <div className="px-6 py-5 border-t bg-gray-50/50 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
              className="text-gray-500 font-medium h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
              className="bg-[#003B95] hover:bg-[#002a6b] font-semibold h-10 px-8 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                </>
              ) : editing ? (
                "Update details"
              ) : (
                "Register Dependent"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────── */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl p-0 overflow-hidden sm:max-w-md">
          <div className="p-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                Remove dependent?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 leading-relaxed text-sm">
                This will remove the dependent's record from {playerName}'s
                profile. All historical linkages will be preserved for audit
                purposes.
              </AlertDialogDescription>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-3">
            <AlertDialogCancel className="w-full sm:w-auto mt-0 border-0 bg-transparent text-gray-500 font-semibold hover:bg-gray-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-10 shadow-lg shadow-red-200"
            >
              Yes, delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
