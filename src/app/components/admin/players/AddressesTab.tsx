import { useState, useMemo, useCallback, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Star, MoreHorizontal, X, Home, Briefcase,
  CreditCard, Package, MapPin, ArrowUpDown, ArrowUp, ArrowDown,
  CheckCircle2, XCircle, Info, AlertTriangle, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
import { Skeleton } from "../../ui/skeleton";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import {
  COUNTRIES, ADDRESS_TYPE_OPTIONS,
  type PlayerAddress,
} from "./player-detail-data";

// ─── Types ───────────────────────────────────────────────────
type BannerType = "success" | "error" | "info" | "warning";
type SortField = "city" | "country" | "lastUpdated";
type SortDir = "asc" | "desc";

const BANNER_STYLES: Record<BannerType, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: CheckCircle2 },
  error:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     icon: XCircle },
  info:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    icon: Info },
  warning: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   icon: AlertTriangle },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  Home: Home, Work: Briefcase, Billing: CreditCard, Shipping: Package, Other: MapPin,
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// ─── State label by country ──────────────────────────────────
function getStateLabel(country: string): string {
  if (country === "United States") return "State";
  if (country === "Canada") return "Province";
  if (country === "United Kingdom") return "County";
  if (country === "United Arab Emirates" || country === "Saudi Arabia") return "Region";
  if (country === "Australia") return "State/Territory";
  if (country === "Japan" || country === "South Korea" || country === "China") return "Prefecture/Province";
  return "State / Province";
}

// ─── Props ───────────────────────────────────────────────────
interface AddressesTabProps {
  addresses: PlayerAddress[];
  setAddresses: React.Dispatch<React.SetStateAction<PlayerAddress[]>>;
  playerName: string;
}

export function AddressesTab({ addresses, setAddresses, playerName }: AddressesTabProps) {
  // ── Loading simulation ────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // ── Inline banner ─────────────────────────────────────
  const [banner, setBanner] = useState<{ type: BannerType; message: string; visible: boolean }>({
    type: "info", message: "", visible: false,
  });
  const showBanner = useCallback((type: BannerType, message: string) => {
    setBanner({ type, message, visible: true });
    if (type !== "error") setTimeout(() => setBanner(b => ({ ...b, visible: false })), 5000);
  }, []);

  // ── Sorting ───────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
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
      else if (sortField === "country") cmp = a.country.localeCompare(b.country);
      else if (sortField === "lastUpdated") cmp = a.lastUpdated.getTime() - b.lastUpdated.getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [addresses, sortField, sortDir]);

  // ── Pagination ────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sortedAddresses.length / pageSize));
  const pagedAddresses = sortedAddresses.slice((page - 1) * pageSize, page * pageSize);

  // Reset page when data changes
  useEffect(() => { setPage(1); }, [addresses.length, pageSize]);

  // ── Address Modal ─────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerAddress | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyAddr = {
    addressType: "", addressLine1: "", addressLine2: "",
    city: "", state: "", postalCode: "", country: "", isDefault: false,
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
    setForm({
      addressType: addr.addressType, addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2, city: addr.city, state: addr.state,
      postalCode: addr.postalCode, country: addr.country, isDefault: addr.isDefault,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "addressLine1":
        if (!value.trim()) return "Address Line 1 is required (max 100 chars).";
        if (value.length > 100) return "Max 100 characters.";
        return "";
      case "addressLine2":
        if (value.length > 100) return "Max 100 characters.";
        return "";
      case "city":
        return !value.trim() ? "City is required." : "";
      case "state":
        return !value.trim() ? `${getStateLabel(form.country)} is required.` : "";
      case "postalCode":
        if (!value.trim()) return "Enter a valid postal code.";
        return "";
      case "country":
        return !value ? "Country is required." : "";
      case "addressType":
        return !value ? "Address type is required." : "";
      default:
        return "";
    }
  };

  const handleBlur = (field: string) => {
    const val = (form as Record<string, unknown>)[field] as string;
    const err = validateField(field, val);
    setErrors(prev => {
      if (err) return { ...prev, [field]: err };
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  const validateAll = (): boolean => {
    const e: Record<string, string> = {};
    const fields = ["addressLine1", "city", "state", "postalCode", "country", "addressType"];
    fields.forEach(f => {
      const val = (form as Record<string, unknown>)[f] as string;
      const err = validateField(f, val);
      if (err) e[f] = err;
    });
    if (form.addressLine2.length > 100) e.addressLine2 = "Max 100 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isFormValid = useMemo(() => {
    return form.addressLine1.trim() && form.city.trim() && form.state.trim()
      && form.postalCode.trim() && form.country && form.addressType
      && form.addressLine1.length <= 100 && form.addressLine2.length <= 100;
  }, [form]);

  const handleSave = async () => {
    if (!validateAll()) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    if (editing) {
      setAddresses(prev => prev.map(a => {
        if (a.id === editing.id) return { ...a, ...form, lastUpdated: new Date() };
        if (form.isDefault) return { ...a, isDefault: false };
        return a;
      }));
      showBanner("success", "Address saved");
      toast.success("Address updated.");
    } else {
      const newAddr: PlayerAddress = {
        ...form,
        id: `addr-${Date.now()}`,
        lastUpdated: new Date(),
      };
      if (newAddr.isDefault) {
        setAddresses(prev => [...prev.map(a => ({ ...a, isDefault: false })), newAddr]);
      } else {
        setAddresses(prev => [...prev, newAddr]);
      }
      showBanner("success", "Address saved");
      toast.success("Address saved.");
    }
    setIsSaving(false);
    setModalOpen(false);
  };

  // ── Delete ────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deletingAddr = deleteId ? addresses.find(a => a.id === deleteId) : null;
  const isDeletingDefault = deletingAddr?.isDefault ?? false;
  const otherAddresses = addresses.filter(a => a.id !== deleteId);

  const handleDelete = () => {
    if (deleteId) {
      setAddresses(prev => prev.filter(a => a.id !== deleteId));
      setDeleteId(null);
      showBanner("success", "Address deleted");
      toast.success("Address deleted.");
    }
  };

  // ── Set Default ───────────────────────────────────────
  const handleSetDefault = (addrId: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addrId })));
    showBanner("info", "Default address updated");
    toast.success("Default address updated.");
  };

  // ── Sort Header Helper ────────────────────────────────
  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead className={cn("px-4 cursor-pointer select-none hover:bg-gray-100/50 transition-colors", className)}>
      <button
        onClick={() => handleSort(field)}
        className="inline-flex items-center gap-1 w-full"
        aria-label={`Sort by ${field}`}
      >
        {children}
        {sortField === field ? (
          sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-[#003B95]" /> : <ArrowDown className="h-3 w-3 text-[#003B95]" />
        ) : (
          <ArrowUpDown className="h-3 w-3 text-gray-300" />
        )}
      </button>
    </TableHead>
  );

  // ── FormField Helper ──────────────────────────────────
  const FormField = ({ id, label, required, error, help, children }: {
    id: string; label: string; required?: boolean; error?: string; help?: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500" role="alert" id={`${id}-error`}>{error}</p>}
      {help && !error && <p className="text-[11px] text-gray-400" id={`${id}-help`}>{help}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Inline Banner ──────────────────────────────── */}
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

      {/* ── Main Card ──────────────────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[#111827]">Addresses</h2>
            <Badge variant="outline" className="text-[11px] bg-gray-50 text-gray-600 border-gray-200">
              {addresses.length}
            </Badge>
          </div>
          <Button size="sm" onClick={openAdd} disabled={isLoading} className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Address
          </Button>
        </div>

        {/* ── Loading State ────────────────────────────── */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24 hidden md:block" />
                <Skeleton className="h-4 w-16 hidden lg:block" />
                <Skeleton className="h-4 w-16 hidden lg:block" />
                <Skeleton className="h-4 w-20 hidden xl:block" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            ))}
          </div>
        ) : addresses.length > 0 ? (
          <>
            {/* ── Desktop Table ──────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <caption className="sr-only">Addresses for {playerName}</caption>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="px-4">Type</TableHead>
                    <TableHead className="px-4">Address</TableHead>
                    <SortableHeader field="city">City</SortableHeader>
                    <TableHead className="px-4 hidden lg:table-cell">State</TableHead>
                    <TableHead className="px-4 hidden lg:table-cell">Postal Code</TableHead>
                    <SortableHeader field="country" className="hidden xl:table-cell">Country</SortableHeader>
                    <TableHead className="px-4">Default</TableHead>
                    <SortableHeader field="lastUpdated">Updated</SortableHeader>
                    <TableHead className="px-4 w-10"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedAddresses.map(addr => {
                    const TypeIcon = TYPE_ICONS[addr.addressType] || MapPin;
                    return (
                      <TableRow key={addr.id} className="group hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-4">
                          <Badge variant="outline" className="text-[11px] gap-1">
                            <TypeIcon className="h-3 w-3" />
                            {addr.addressType}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 text-sm text-[#374151] max-w-[220px]">
                          <span className="truncate block">
                            {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 text-sm text-[#374151]">{addr.city}</TableCell>
                        <TableCell className="px-4 text-sm text-[#374151] hidden lg:table-cell">{addr.state}</TableCell>
                        <TableCell className="px-4 text-xs text-[#6B7280] hidden lg:table-cell">{addr.postalCode}</TableCell>
                        <TableCell className="px-4 text-xs text-[#6B7280] hidden xl:table-cell">{addr.country}</TableCell>
                        <TableCell className="px-4">
                          {addr.isDefault ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] cursor-default" variant="outline">
                                  <Star className="h-2.5 w-2.5 mr-1 fill-emerald-500" /> Default
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>This is the default address</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-[#9CA3AF] text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-[#6B7280] cursor-default">
                                {formatDistanceToNow(addr.lastUpdated, { addSuffix: true })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{format(addr.lastUpdated, "yyyy-MM-dd HH:mm 'UTC'")}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label={`Actions for ${addr.addressType} address for ${playerName}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(addr)}>
                                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                              </DropdownMenuItem>
                              {!addr.isDefault ? (
                                <DropdownMenuItem onClick={() => handleSetDefault(addr.id)}>
                                  <Star className="h-3.5 w-3.5 mr-2" /> Set Default
                                </DropdownMenuItem>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuItem disabled className="opacity-50">
                                      <Star className="h-3.5 w-3.5 mr-2 fill-current" /> Set Default
                                    </DropdownMenuItem>
                                  </TooltipTrigger>
                                  <TooltipContent>Already default</TooltipContent>
                                </Tooltip>
                              )}
                              <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(addr.id)}>
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
            <div className="md:hidden divide-y">
              {pagedAddresses.map(addr => {
                const TypeIcon = TYPE_ICONS[addr.addressType] || MapPin;
                return (
                  <div key={addr.id} className="p-4 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[11px] gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {addr.addressType}
                        </Badge>
                        {addr.isDefault && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]" variant="outline">
                            <Star className="h-2.5 w-2.5 mr-1 fill-emerald-500" /> Default
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            aria-label={`Actions for ${addr.addressType} address`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(addr)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          {!addr.isDefault && (
                            <DropdownMenuItem onClick={() => handleSetDefault(addr.id)}>
                              <Star className="h-3.5 w-3.5 mr-2" /> Set Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(addr.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-[#374151]">
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Updated {formatDistanceToNow(addr.lastUpdated, { addSuffix: true })}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ─────────────────────────── */}
            {addresses.length > 10 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-gray-50/50 gap-3">
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <span>Rows per page:</span>
                  <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                    <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="ml-2">
                    {Math.min((page - 1) * pageSize + 1, sortedAddresses.length)}–{Math.min(page * pageSize, sortedAddresses.length)} of {sortedAddresses.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)} className="h-7 w-7 p-0">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm"
                      onClick={() => setPage(p)}
                      className={cn("h-7 w-7 p-0 text-xs", p === page && "bg-[#003B95] hover:bg-[#002a6b]")}>
                      {p}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)} className="h-7 w-7 p-0">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Empty State ─────────────────────────────── */
          <div className="text-center py-16 space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
              <MapPin className="h-7 w-7 text-gray-300" />
            </div>
            {/* AC-PM-031 */}
            <p className="text-sm text-[#374151]">No saved addresses.</p>
            <p className="text-xs text-[#9CA3AF]">Add a home or work address for this player.</p>
            <Button size="sm" onClick={openAdd} className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5 mt-2">
              <Plus className="h-3.5 w-3.5" /> Add Address
            </Button>
          </div>
        )}
      </div>

      {/* ── Sticky Mobile CTA ──────────────────────────── */}
      {!isLoading && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-30">
          <Button onClick={openAdd} className="w-full bg-[#003B95] hover:bg-[#002a6b] gap-1.5">
            <Plus className="h-4 w-4" /> Add Address
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          Address Form Modal
          ══════════════════════════════════════════════════ */}
      <Dialog open={modalOpen} onOpenChange={o => { if (!isSaving) setModalOpen(o); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Address" : "Add Address"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the address details below." : "Add a new address for this player."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="addrType" label="Address Type" required error={errors.addressType}>
                <Select value={form.addressType}
                  onValueChange={v => { setForm(f => ({ ...f, addressType: v })); setErrors(e => { const n = { ...e }; delete n.addressType; return n; }); }}
                  disabled={isSaving}>
                  <SelectTrigger id="addrType" className={cn(errors.addressType && "border-red-400")}
                    aria-invalid={!!errors.addressType} aria-describedby={errors.addressType ? "addrType-error" : undefined}
                    onBlur={() => handleBlur("addressType")}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="addrCountry" label="Country" required error={errors.country}>
                <Select value={form.country}
                  onValueChange={v => { setForm(f => ({ ...f, country: v })); setErrors(e => { const n = { ...e }; delete n.country; return n; }); }}
                  disabled={isSaving}>
                  <SelectTrigger id="addrCountry" className={cn(errors.country && "border-red-400")}
                    aria-invalid={!!errors.country} aria-describedby={errors.country ? "addrCountry-error" : undefined}
                    onBlur={() => handleBlur("country")}>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField id="addrLine1" label="Address Line 1" required error={errors.addressLine1} help="Max 100 characters">
              <Input id="addrLine1" placeholder="500 Market St"
                value={form.addressLine1} maxLength={101}
                onChange={e => { setForm(f => ({ ...f, addressLine1: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.addressLine1; return n; }); }}
                onBlur={() => handleBlur("addressLine1")}
                disabled={isSaving}
                aria-invalid={!!errors.addressLine1} aria-describedby={errors.addressLine1 ? "addrLine1-error" : "addrLine1-help"}
                className={cn(errors.addressLine1 && "border-red-400")} />
            </FormField>
            <FormField id="addrLine2" label="Address Line 2" error={errors.addressLine2} help="Apt, suite, etc. (optional) — Max 100 characters">
              <Input id="addrLine2" placeholder="Apt, suite, etc. (optional)"
                value={form.addressLine2} maxLength={101}
                onChange={e => { setForm(f => ({ ...f, addressLine2: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.addressLine2; return n; }); }}
                onBlur={() => handleBlur("addressLine2")}
                disabled={isSaving}
                aria-describedby={errors.addressLine2 ? "addrLine2-error" : "addrLine2-help"}
                className={cn(errors.addressLine2 && "border-red-400")} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField id="addrCity" label="City" required error={errors.city}>
                <Input id="addrCity" placeholder="San Francisco" value={form.city}
                  onChange={e => { setForm(f => ({ ...f, city: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.city; return n; }); }}
                  onBlur={() => handleBlur("city")}
                  disabled={isSaving}
                  aria-invalid={!!errors.city} aria-describedby={errors.city ? "addrCity-error" : undefined}
                  className={cn(errors.city && "border-red-400")} />
              </FormField>
              <FormField id="addrState" label={getStateLabel(form.country)} required error={errors.state}>
                <Input id="addrState" placeholder="CA" value={form.state}
                  onChange={e => { setForm(f => ({ ...f, state: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.state; return n; }); }}
                  onBlur={() => handleBlur("state")}
                  disabled={isSaving}
                  aria-invalid={!!errors.state} aria-describedby={errors.state ? "addrState-error" : undefined}
                  className={cn(errors.state && "border-red-400")} />
              </FormField>
              <FormField id="addrPostal" label="Postal Code" required error={errors.postalCode}>
                <Input id="addrPostal" placeholder="94105" value={form.postalCode}
                  onChange={e => { setForm(f => ({ ...f, postalCode: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.postalCode; return n; }); }}
                  onBlur={() => handleBlur("postalCode")}
                  disabled={isSaving}
                  aria-invalid={!!errors.postalCode} aria-describedby={errors.postalCode ? "addrPostal-error" : undefined}
                  className={cn(errors.postalCode && "border-red-400")} />
              </FormField>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox id="addrDefault"
                checked={form.isDefault}
                onCheckedChange={c => setForm(f => ({ ...f, isDefault: !!c }))}
                disabled={isSaving} />
              <Label htmlFor="addrDefault" className="cursor-pointer text-sm">Set as default</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isFormValid || isSaving} className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this address?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">This action cannot be undone.</span>
              {isDeletingDefault && otherAddresses.length > 0 && (
                <span className="block text-amber-600">
                  This is your default address. Consider setting another address as default first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
