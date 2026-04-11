import { useState, useMemo, useCallback, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  MoreHorizontal,
  X,
  Home,
  Briefcase,
  CreditCard,
  Package,
  MapPin,
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
  AlertCircle,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
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
import { ADDRESS_TYPE_OPTIONS } from "./constants";
import type { PlayerAddress } from "./player-detail-data";

// ─── Types ───────────────────────────────────────────────────
type BannerType = "success" | "error" | "info" | "warning";
type SortField = "city" | "country" | "lastUpdated";
type SortDir = "asc" | "desc";

const BANNER_STYLES: Record<
  BannerType,
  { bg: string; border: string; text: string; icon: React.ElementType }
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

const TYPE_ICONS: Record<string, React.ElementType> = {
  home: Home,
  work: Briefcase,
  billing: CreditCard,
  shipping: Package,
  other: MapPin,
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

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
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <p id={id} className="text-[11px] text-gray-500 mt-1 leading-relaxed">
      {children}
    </p>
  );
}

// ─── Props ───────────────────────────────────────────────────
interface AddressesTabProps {
  playerId: string;
  addresses: PlayerAddress[];
  setAddresses: React.Dispatch<React.SetStateAction<PlayerAddress[]>>;
  playerName: string;
  countries: { id: string; name_en: string }[];
  isLoading?: boolean;
}

export function AddressesTab({
  playerId,
  addresses,
  setAddresses,
  playerName,
  countries,
  isLoading: isParentLoading,
}: AddressesTabProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Sync loading state
  useEffect(() => {
    if (isParentLoading !== undefined) setIsLoading(isParentLoading);
  }, [isParentLoading]);

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

  const sortedAddresses = useMemo(() => {
    if (!sortField) return addresses;
    return [...addresses].sort((a, b) => {
      let cmp = 0;
      if (sortField === "city") cmp = a.city.localeCompare(b.city);
      else if (sortField === "country")
        cmp = a.country.localeCompare(b.country);
      else if (sortField === "lastUpdated")
        cmp = a.lastUpdated.getTime() - b.lastUpdated.getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [addresses, sortField, sortDir]);

  // ── Pagination ────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sortedAddresses.length / pageSize));
  const pagedAddresses = sortedAddresses.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset page when data changes
  useEffect(() => {
    setPage(1);
  }, [addresses.length, pageSize]);

  // ── Address Modal ─────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerAddress | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cities would ideally be fetched based on country selection
  const [cities, setCities] = useState<{ id: string; name_en: string }[]>([]);

  const emptyAddr = {
    label: "home",
    street_name: "",
    building_number: "",
    apartment_floor: "",
    city_name: "",
    city_id: "",
    state: "",
    postal_code: "",
    country_id: "",
    is_default: false,
    latitude: 0,
    longitude: 0,
  };
  const [form, setForm] = useState(emptyAddr);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openAdd = () => {
    setEditing(null);
    setForm(emptyAddr);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (addr: PlayerAddress) => {
    setEditing(addr);
    // Note: We need to map raw API fields here if those were stored in the component state
    // For now, we assume the parent maps them correctly or we use the 'addr' as is.
    // However, the PlayerAddress interface doesn't have building_number etc.
    // We should probably rely on the parent state for the most up-to-date mapping.

    // Fallback/Draft mapping if addr is from the legacy interface:
    setForm({
      label: (addr as any).label || addr.addressType.toLowerCase() || "home",
      street_name:
        (addr as any).street_name ||
        addr.addressLine1.split(" ").slice(1).join(" ") ||
        "",
      building_number:
        (addr as any).building_number || addr.addressLine1.split(" ")[0] || "",
      apartment_floor: (addr as any).apartment_floor || addr.addressLine2 || "",
      city_name: addr.city,
      city_id: (addr as any).city_id || "",
      state: addr.state || "",
      postal_code: addr.postalCode || "",
      country_id: (addr as any).country_id || "",
      is_default: addr.isDefault,
      latitude: (addr as any).latitude || 0,
      longitude: (addr as any).longitude || 0,
    });
    setErrors({});
    setModalOpen(true);
  };

  // Fetch cities when country changes
  useEffect(() => {
    if (form.country_id) {
      adminService
        .listMasterData("cities", {
          country_id: form.country_id,
          status: "active",
          limit: 200,
        })
        .then((res) => setCities(res.data?.items || []))
        .catch(() => setCities([]));
    } else {
      setCities([]);
    }
  }, [form.country_id]);

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case "street_name":
        if (!String(value).trim()) return "Street name is required.";
        return "";
      case "building_number":
        return !String(value).trim() ? "Bldg # is required." : "";
      case "city_id":
        return !value ? "City is required." : "";
      case "country_id":
        return !value ? "Country is required." : "";
      default:
        return "";
    }
  };

  const handleBlur = (field: string) => {
    const val = (form as Record<string, unknown>)[field];
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
    ["street_name", "building_number", "city_id", "country_id"].forEach((f) => {
      const val = (form as Record<string, unknown>)[f];
      const err = validateField(f, val);
      if (err) e[f] = err;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isFormValid = useMemo(() => {
    return (
      form.street_name.trim() &&
      form.building_number.trim() &&
      form.city_id &&
      form.country_id
    );
  }, [form]);

  const handleSave = async () => {
    if (!validateAll()) return;
    setIsSaving(true);
    try {
      let res;
      if (editing) {
        res = await adminService.updatePlayerAddress(
          playerId,
          editing.id,
          form,
        );
        toast.success("Address updated successfully.");
      } else {
        res = await adminService.addPlayerAddress(playerId, form);
        toast.success("Address added successfully.");
      }

      // Update local state by mapping the backend response to PlayerAddress shape
      const backendAddr = res.data || res;
      const mapped: PlayerAddress = {
        id: backendAddr.id,
        addressType:
          backendAddr.label.charAt(0).toUpperCase() +
          backendAddr.label.slice(1),
        addressLine1: `${backendAddr.building_number} ${backendAddr.street_name}`,
        addressLine2: backendAddr.apartment_floor || "",
        city: backendAddr.city_name,
        state: backendAddr.state || "",
        postalCode: backendAddr.postal_code || "",
        country: backendAddr.country_name,
        isDefault: backendAddr.is_default,
        lastUpdated: new Date(
          backendAddr.updated_at || backendAddr.created_at || Date.now(),
        ),
      };
      // Keep extra fields for future editing
      (mapped as any).country_id = backendAddr.country_id;
      (mapped as any).city_id = backendAddr.city_id;
      (mapped as any).label = backendAddr.label;
      (mapped as any).street_name = backendAddr.street_name;
      (mapped as any).building_number = backendAddr.building_number;
      (mapped as any).apartment_floor = backendAddr.apartment_floor;

      if (editing) {
        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editing.id) return mapped;
            if (mapped.isDefault) return { ...a, isDefault: false };
            return a;
          }),
        );
      } else {
        if (mapped.isDefault) {
          setAddresses((prev) => [
            ...prev.map((a) => ({ ...a, isDefault: false })),
            mapped,
          ]);
        } else {
          setAddresses((prev) => [...prev, mapped]);
        }
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save address.");
      showBanner("error", err.message || "Failed to save address.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deletingAddr = deleteId
    ? addresses.find((a) => a.id === deleteId)
    : null;
  const isDeletingDefault = deletingAddr?.isDefault ?? false;

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminService.deletePlayerAddress(playerId, deleteId);
      setAddresses((prev) => prev.filter((a) => a.id !== deleteId));
      setDeleteId(null);
      toast.success("Address deleted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address.");
    }
  };

  // ── Set Default ───────────────────────────────────────
  const handleSetDefault = async (addrId: string) => {
    try {
      await adminService.updatePlayerAddress(playerId, addrId, {
        is_default: true,
      });
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === addrId })),
      );
      toast.success("Default address updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to set default address.");
    }
  };

  // ── Sort Header Helper ────────────────────────────────
  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={cn(
        "px-4 cursor-pointer select-none hover:bg-gray-100/50 transition-colors",
        className,
      )}
    >
      <button
        onClick={() => handleSort(field)}
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

  // ── FormField Helper ──────────────────────────────────
  const FormField = ({
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
    children: React.ReactNode;
  }) => (
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

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* ── Inline Banner ──────────────────────────────── */}
      {banner.visible && (
        <div
          role={banner.type === "error" ? "alert" : "status"}
          aria-live={banner.type === "error" ? "assertive" : "polite"}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border",
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
            className="p-1 rounded hover:bg-black/5"
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
              Addresses
            </h2>
            <Badge
              variant="outline"
              className="text-[11px] bg-gray-50 text-gray-600 border-gray-200"
            >
              {addresses.length}
            </Badge>
          </div>
          <Button
            size="sm"
            onClick={openAdd}
            disabled={isLoading}
            className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Add New
          </Button>
        </div>

        {/* ── Loading State ────────────────────────────── */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2 border-b last:border-0 border-gray-50"
              >
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-4 w-40 flex-1" />
                <Skeleton className="h-4 w-24 hidden md:block" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : addresses.length > 0 ? (
          <>
            {/* ── Desktop Table ──────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <caption className="sr-only">
                  Addresses for {playerName}
                </caption>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Type
                    </TableHead>
                    <TableHead className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Address
                    </TableHead>
                    <SortableHeader
                      field="city"
                      className="text-[11px] font-bold uppercase tracking-wider text-gray-500"
                    >
                      City
                    </SortableHeader>
                    <SortableHeader
                      field="country"
                      className="hidden xl:table-cell text-[11px] font-bold uppercase tracking-wider text-gray-500"
                    >
                      Country
                    </SortableHeader>
                    <TableHead className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Default
                    </TableHead>
                    <SortableHeader
                      field="lastUpdated"
                      className="text-[11px] font-bold uppercase tracking-wider text-gray-500"
                    >
                      Updated
                    </SortableHeader>
                    <TableHead className="px-5 py-3 w-10 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedAddresses.map((addr) => {
                    const TypeIcon =
                      TYPE_ICONS[addr.addressType.toLowerCase()] || MapPin;
                    return (
                      <TableRow
                        key={addr.id}
                        className="group hover:bg-blue-50/20 transition-colors border-b last:border-0 border-gray-50"
                      >
                        <TableCell className="px-5 py-4">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium py-0 h-5 gap-1 capitalize"
                          >
                            <TypeIcon className="h-3 w-3" />
                            {addr.addressType}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 max-w-[280px]">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {addr.addressLine1}
                            </span>
                            {addr.addressLine2 && (
                              <span className="text-xs text-gray-500 truncate">
                                {addr.addressLine2}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-700">
                          {addr.city}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-600 hidden xl:table-cell">
                          {addr.country}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {addr.isDefault ? (
                            <Badge
                              className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] h-5 py-0 shadow-none"
                              variant="outline"
                            >
                              <Star className="h-2.5 w-2.5 mr-1 fill-blue-500" />{" "}
                              Default
                            </Badge>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                            {formatDistanceToNow(addr.lastUpdated, {
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
                                aria-label="Address actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openEdit(addr)}>
                                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                                Details
                              </DropdownMenuItem>
                              {!addr.isDefault && (
                                <DropdownMenuItem
                                  onClick={() => handleSetDefault(addr.id)}
                                >
                                  <Star className="h-3.5 w-3.5 mr-2" /> Make
                                  Default
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteId(addr.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
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
              {pagedAddresses.map((addr) => {
                const TypeIcon =
                  TYPE_ICONS[addr.addressType.toLowerCase()] || MapPin;
                return (
                  <div
                    key={addr.id}
                    className="p-4 space-y-3 group active:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 py-0 gap-1 capitalize"
                        >
                          <TypeIcon className="h-3 w-3" />
                          {addr.addressType}
                        </Badge>
                        {addr.isDefault && (
                          <Badge
                            className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] h-5 py-0"
                            variant="outline"
                          >
                            <Star className="h-2.5 w-2.5 mr-1 fill-blue-500 shadow-none" />{" "}
                            Default
                          </Badge>
                        )}
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
                          <DropdownMenuItem onClick={() => openEdit(addr)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          {!addr.isDefault && (
                            <DropdownMenuItem
                              onClick={() => handleSetDefault(addr.id)}
                            >
                              <Star className="h-3.5 w-3.5 mr-2" /> Set Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteId(addr.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">
                        {addr.addressLine1}
                      </p>
                      {addr.addressLine2 && (
                        <p className="text-xs text-gray-500">
                          {addr.addressLine2}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      {addr.city}, {addr.state ? `${addr.state} ` : ""}
                      {addr.postalCode ? `${addr.postalCode}, ` : ""}
                      {addr.country}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Last updated{" "}
                      {formatDistanceToNow(addr.lastUpdated, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ─────────────────────────── */}
            {addresses.length > 5 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t bg-gray-50/30 gap-4">
                <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                  <span>Display:</span>
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
                    Showing{" "}
                    {Math.min(
                      (page - 1) * pageSize + 1,
                      sortedAddresses.length,
                    )}{" "}
                    to {Math.min(page * pageSize, sortedAddresses.length)} of{" "}
                    {sortedAddresses.length}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                    )
                    .map((p, idx, arr) => {
                      const showEllipsis = idx > 0 && p !== arr[idx - 1] + 1;
                      return (
                        <div key={p} className="flex items-center gap-1.5">
                          {showEllipsis && (
                            <span className="text-gray-400 px-1 text-xs">
                              ...
                            </span>
                          )}
                          <Button
                            variant={p === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p)}
                            className={cn(
                              "h-8 w-8 p-0 text-xs font-semibold rounded-md shadow-sm",
                              p === page
                                ? "bg-[#003B95] border-[#003B95] hover:bg-[#002a6b]"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50",
                            )}
                          >
                            {p}
                          </Button>
                        </div>
                      );
                    })}
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
              <MapPin className="h-8 w-8 text-gray-200" />
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-1">
              No addresses found
            </h3>
            <p className="text-sm text-gray-500 max-w-[280px] mx-auto mb-6">
              You haven't added any addresses for {playerName} yet. Add a home
              or office location or billing address.
            </p>
            <Button
              size="sm"
              onClick={openAdd}
              className="bg-[#003B95] hover:bg-[#002a6b] gap-2 shadow-md"
            >
              <Plus className="h-4 w-4" /> Add First Address
            </Button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          Address Form Modal
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
              {editing ? "Update Address" : "New Address"}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-xs mt-1.5 opacity-90 leading-relaxed max-w-sm">
              Please enter the correct location details. Default addresses are
              used for priority booking and primary billing.
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
            {/* Row 1: Type & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                id="addrType"
                label="Address Category"
                required
                error={errors.label}
              >
                <Select
                  value={form.label}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, label: v }));
                    setErrors((e) => {
                      const n = { ...e };
                      delete n.label;
                      return n;
                    });
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="addrType"
                    className={cn("h-10", errors.label && "border-red-400")}
                  >
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                id="addrCountry"
                label="Country"
                required
                error={errors.country_id}
              >
                <Select
                  value={form.country_id}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, country_id: v }));
                    setErrors((e) => {
                      const n = { ...e };
                      delete n.country_id;
                      return n;
                    });
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="addrCountry"
                    className={cn(
                      "h-10",
                      errors.country_id && "border-red-400",
                    )}
                  >
                    <SelectValue placeholder="Where do they live?" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Row 2: Building & Street */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                id="bldgNum"
                label="Building / Villa #"
                required
                error={errors.building_number}
              >
                <Input
                  id="bldgNum"
                  placeholder="e.g. 502"
                  value={form.building_number}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, building_number: e.target.value }));
                    setErrors((prev) => {
                      const n = { ...prev };
                      delete n.building_number;
                      return n;
                    });
                  }}
                  onBlur={() => handleBlur("building_number")}
                  disabled={isSaving}
                  className={cn(
                    "h-10",
                    errors.building_number && "border-red-400",
                  )}
                />
              </FormField>
              <FormField
                id="streetName"
                label="Street Name"
                required
                error={errors.street_name}
              >
                <Input
                  id="streetName"
                  placeholder="e.g. King Fahd Rd"
                  value={form.street_name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, street_name: e.target.value }));
                    setErrors((prev) => {
                      const n = { ...prev };
                      delete n.street_name;
                      return n;
                    });
                  }}
                  onBlur={() => handleBlur("street_name")}
                  disabled={isSaving}
                  className={cn("h-10", errors.street_name && "border-red-400")}
                />
              </FormField>
            </div>

            {/* Row 3: Floor / Apt */}
            <FormField
              id="addrFloor"
              label="Apartment / Office / Floor"
              help="Optional extra details"
            >
              <Input
                id="addrFloor"
                placeholder="e.g. 4th Floor, Suite 10"
                value={form.apartment_floor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, apartment_floor: e.target.value }))
                }
                disabled={isSaving}
                className="h-10"
              />
            </FormField>

            {/* Row 4: City & State & Postal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <FormField
                id="addrCity"
                label="City"
                required
                error={errors.city_id}
              >
                <Select
                  value={form.city_id}
                  onValueChange={(id) =>
                    setForm((f) => ({ ...f, city_id: id }))
                  }
                  disabled={isSaving || cities.length === 0}
                >
                  <SelectTrigger
                    className={cn("h-10", errors.city_id && "border-red-400")}
                  >
                    <SelectValue
                      placeholder={
                        cities.length === 0 ? "Select country first" : "City"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="addrState" label="State/Region">
                <Input
                  id="addrState"
                  placeholder="Optional"
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                  disabled={isSaving}
                  className="h-10"
                />
              </FormField>
              <FormField id="addrPostal" label="Postal Code">
                <Input
                  id="addrPostal"
                  placeholder="00000"
                  value={form.postal_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, postal_code: e.target.value }))
                  }
                  disabled={isSaving}
                  className="h-10"
                />
              </FormField>
            </div>

            {/* Row 5: Coordinates (Hidden/Internal usually, but for Demo) */}
            <div className="grid grid-cols-2 gap-5 p-4 rounded-xl bg-blue-50/10 border border-blue-50">
              <div className="space-y-1">
                <Label className="text-[10px] text-blue-800/60 uppercase font-bold tracking-wider">
                  Latitude
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      latitude: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-blue-800/60 uppercase font-bold tracking-wider">
                  Longitude
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      longitude: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-1">
              <Checkbox
                id="addrDefault"
                checked={form.is_default}
                onCheckedChange={(c) =>
                  setForm((f) => ({ ...f, is_default: !!c }))
                }
                disabled={isSaving}
                className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-[#003B95] transition-colors"
              />
              <Label
                htmlFor="addrDefault"
                className="cursor-pointer text-sm font-medium text-gray-700 select-none"
              >
                Mark as primary address
              </Label>
            </div>
          </div>

          <div className="px-6 py-5 border-t bg-gray-50/50 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
              className="text-gray-500 hover:text-gray-800 font-medium h-10 px-6"
            >
              Skip
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
              className="bg-[#003B95] hover:bg-[#002a6b] font-semibold h-11 px-8 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                </>
              ) : editing ? (
                "Update details"
              ) : (
                "Add address"
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
                Remove address?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 leading-relaxed text-sm">
                Deleting this address will remove it from {playerName}'s
                profile. This cannot be reversed.
                {isDeletingDefault && (
                  <span className="block mt-2 font-semibold text-amber-600">
                    Warning: This is the primary address.
                  </span>
                )}
              </AlertDialogDescription>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-3">
            <AlertDialogCancel className="w-full sm:w-auto mt-0 border-0 bg-transparent text-gray-500 font-semibold hover:bg-gray-100 hover:text-gray-900">
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
