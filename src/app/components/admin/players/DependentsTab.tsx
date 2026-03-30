import { useState, useMemo, useCallback, useEffect } from "react";
import { formatDistanceToNow, format, differenceInYears, isAfter } from "date-fns";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, MoreHorizontal, X, Users, ArrowUpDown, ArrowUp, ArrowDown,
  CheckCircle2, XCircle, Info, AlertTriangle, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
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
  RELATIONSHIP_OPTIONS,
  type PlayerDependent,
} from "./player-detail-data";

// ─── Types ───────────────────────────────────────────────────
type BannerType = "success" | "error" | "info" | "warning";
type SortField = "name" | "relationship" | "lastUpdated";
type SortDir = "asc" | "desc";

const BANNER_STYLES: Record<BannerType, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: CheckCircle2 },
  error:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     icon: XCircle },
  info:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    icon: Info },
  warning: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   icon: AlertTriangle },
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

// ─── Props ───────────────────────────────────────────────────
interface DependentsTabProps {
  dependents: PlayerDependent[];
  setDependents: React.Dispatch<React.SetStateAction<PlayerDependent[]>>;
  playerName: string;
}

export function DependentsTab({ dependents, setDependents, playerName }: DependentsTabProps) {
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

  const sortedDependents = useMemo(() => {
    if (!sortField) return dependents;
    return [...dependents].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      else if (sortField === "relationship") cmp = a.relationship.localeCompare(b.relationship);
      else if (sortField === "lastUpdated") cmp = a.lastUpdated.getTime() - b.lastUpdated.getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [dependents, sortField, sortDir]);

  // ── Pagination ────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sortedDependents.length / pageSize));
  const pagedDependents = sortedDependents.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [dependents.length, pageSize]);

  // ── Dependent Modal ───────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerDependent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyDep = {
    firstName: "", lastName: "", relationship: "",
    dateOfBirth: "", email: "", phone: "", notes: "",
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
      firstName: dep.firstName, lastName: dep.lastName,
      relationship: dep.relationship, dateOfBirth: dep.dateOfBirth,
      email: dep.email, phone: dep.phone, notes: dep.notes,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "firstName":
        if (!value.trim()) return "First name is required.";
        if (value.length > 50) return "Max 50 characters.";
        return "";
      case "lastName":
        if (!value.trim()) return "Last name is required.";
        if (value.length > 50) return "Max 50 characters.";
        return "";
      case "relationship":
        return !value ? "Relationship is required." : "";
      case "dateOfBirth":
        if (!value) return "Date of birth is required.";
        const d = new Date(value);
        if (isNaN(d.getTime())) return "Invalid date.";
        if (isAfter(d, new Date())) return "Must be a past date.";
        return "";
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
        return "";
      case "notes":
        if (value.length > 500) return "Max 500 characters.";
        return "";
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
    ["firstName", "lastName", "relationship", "dateOfBirth"].forEach(f => {
      const val = (form as Record<string, unknown>)[f] as string;
      const err = validateField(f, val);
      if (err) e[f] = err;
    });
    if (form.email) {
      const emailErr = validateField("email", form.email);
      if (emailErr) e.email = emailErr;
    }
    if (form.notes.length > 500) e.notes = "Max 500 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isFormValid = useMemo(() => {
    return form.firstName.trim() && form.lastName.trim() && form.relationship
      && form.dateOfBirth && form.firstName.length <= 50 && form.lastName.length <= 50
      && form.notes.length <= 500
      && (!form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email));
  }, [form]);

  const handleSave = async () => {
    if (!validateAll()) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    if (editing) {
      setDependents(prev => prev.map(d =>
        d.id === editing.id ? { ...d, ...form, lastUpdated: new Date() } : d
      ));
      showBanner("success", "Dependent updated");
      toast.success("Dependent updated.");
    } else {
      setDependents(prev => [...prev, { ...form, id: `dep-${Date.now()}`, lastUpdated: new Date() }]);
      showBanner("success", "Dependent saved");
      toast.success("Dependent saved.");
    }
    setIsSaving(false);
    setModalOpen(false);
  };

  // ── Delete ────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      setDependents(prev => prev.filter(d => d.id !== deleteId));
      setDeleteId(null);
      showBanner("success", "Dependent deleted");
      toast.success("Dependent deleted.");
    }
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
            <h2 className="text-[#111827]">Dependents</h2>
            <Badge variant="outline" className="text-[11px] bg-gray-50 text-gray-600 border-gray-200">
              {dependents.length}
            </Badge>
          </div>
          <Button size="sm" onClick={openAdd} disabled={isLoading} className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Dependent
          </Button>
        </div>

        {/* ── Loading State ────────────────────────────── */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-4 w-20 hidden md:block" />
                <Skeleton className="h-4 w-32 hidden lg:block" />
                <Skeleton className="h-4 w-24 hidden lg:block" />
                <Skeleton className="h-4 w-28 hidden xl:block" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            ))}
          </div>
        ) : dependents.length > 0 ? (
          <>
            {/* ── Desktop Table ──────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <caption className="sr-only">Dependents for {playerName}</caption>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <SortableHeader field="name">Name</SortableHeader>
                    <SortableHeader field="relationship">Relationship</SortableHeader>
                    <TableHead className="px-4 hidden md:table-cell">Date of Birth</TableHead>
                    <TableHead className="px-4 hidden lg:table-cell">Email</TableHead>
                    <TableHead className="px-4 hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="px-4 hidden xl:table-cell">Notes</TableHead>
                    <SortableHeader field="lastUpdated">Updated</SortableHeader>
                    <TableHead className="px-4 w-10"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedDependents.map(dep => {
                    const age = getAge(dep.dateOfBirth);
                    return (
                      <TableRow key={dep.id} className="group hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-4 text-sm text-[#111827]">
                          {dep.firstName} {dep.lastName}
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge variant="outline" className="text-[11px]">{dep.relationship}</Badge>
                        </TableCell>
                        <TableCell className="px-4 hidden md:table-cell">
                          {dep.dateOfBirth ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-[#374151] cursor-default">
                                  {dep.dateOfBirth}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {age !== null ? `Age ${age}` : "Unknown age"}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-[#9CA3AF]">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 text-xs text-[#6B7280] hidden lg:table-cell">
                          {dep.email || "—"}
                        </TableCell>
                        <TableCell className="px-4 text-xs text-[#6B7280] hidden lg:table-cell">
                          {dep.phone || "—"}
                        </TableCell>
                        <TableCell className="px-4 hidden xl:table-cell">
                          {dep.notes ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-[#6B7280] cursor-default block max-w-[160px] truncate">
                                  {truncate(dep.notes, 40)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">{dep.notes}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-[#9CA3AF]">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-[#6B7280] cursor-default">
                                {formatDistanceToNow(dep.lastUpdated, { addSuffix: true })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{format(dep.lastUpdated, "yyyy-MM-dd HH:mm 'UTC'")}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label={`Actions for dependent ${dep.firstName} ${dep.lastName}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(dep)}>
                                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(dep.id)}>
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
              {pagedDependents.map(dep => {
                const age = getAge(dep.dateOfBirth);
                return (
                  <div key={dep.id} className="p-4 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#111827]">{dep.firstName} {dep.lastName}</span>
                        <Badge variant="outline" className="text-[11px]">{dep.relationship}</Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            aria-label={`Actions for ${dep.firstName} ${dep.lastName}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(dep)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(dep.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      DOB: {dep.dateOfBirth || "—"}
                      {age !== null && <span className="text-[#9CA3AF] ml-1">(Age {age})</span>}
                    </p>
                    {(dep.email || dep.phone) && (
                      <p className="text-xs text-[#6B7280]">
                        {dep.email && <span>{dep.email}</span>}
                        {dep.email && dep.phone && <span> · </span>}
                        {dep.phone && <span>{dep.phone}</span>}
                      </p>
                    )}
                    {dep.notes && (
                      <p className="text-xs text-[#9CA3AF] italic">
                        {truncate(dep.notes, 60)}
                      </p>
                    )}
                    <p className="text-[11px] text-[#9CA3AF]">
                      Updated {formatDistanceToNow(dep.lastUpdated, { addSuffix: true })}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ─────────────────────────── */}
            {dependents.length > 10 && (
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
                    {Math.min((page - 1) * pageSize + 1, sortedDependents.length)}–{Math.min(page * pageSize, sortedDependents.length)} of {sortedDependents.length}
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
              <Users className="h-7 w-7 text-gray-300" />
            </div>
            {/* AC-PM-030 */}
            <p className="text-sm text-[#374151]">No dependents added.</p>
            <p className="text-xs text-[#9CA3AF]">Track dependent info for bookings and eligibility.</p>
            <Button size="sm" onClick={openAdd} className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5 mt-2">
              <Plus className="h-3.5 w-3.5" /> Add Dependent
            </Button>
          </div>
        )}
      </div>

      {/* ── Sticky Mobile CTA ──────────────────────────── */}
      {!isLoading && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-30">
          <Button onClick={openAdd} className="w-full bg-[#003B95] hover:bg-[#002a6b] gap-1.5">
            <Plus className="h-4 w-4" /> Add Dependent
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          Dependent Form Modal
          ══════════════════════════════════════════════════ */}
      <Dialog open={modalOpen} onOpenChange={o => { if (!isSaving) setModalOpen(o); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Dependent" : "Add Dependent"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the dependent's information." : "Add a new dependent for this player."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="depFirst" label="First Name" required error={errors.firstName}>
                <Input id="depFirst" placeholder="Mia" maxLength={51}
                  value={form.firstName}
                  onChange={e => { setForm(f => ({ ...f, firstName: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.firstName; return n; }); }}
                  onBlur={() => handleBlur("firstName")}
                  disabled={isSaving}
                  aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? "depFirst-error" : undefined}
                  className={cn(errors.firstName && "border-red-400")} />
              </FormField>
              <FormField id="depLast" label="Last Name" required error={errors.lastName}>
                <Input id="depLast" placeholder="Alvarez" maxLength={51}
                  value={form.lastName}
                  onChange={e => { setForm(f => ({ ...f, lastName: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.lastName; return n; }); }}
                  onBlur={() => handleBlur("lastName")}
                  disabled={isSaving}
                  aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? "depLast-error" : undefined}
                  className={cn(errors.lastName && "border-red-400")} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="depRel" label="Relationship" required error={errors.relationship}>
                <Select value={form.relationship}
                  onValueChange={v => { setForm(f => ({ ...f, relationship: v })); setErrors(e => { const n = { ...e }; delete n.relationship; return n; }); }}
                  disabled={isSaving}>
                  <SelectTrigger id="depRel" className={cn(errors.relationship && "border-red-400")}
                    aria-invalid={!!errors.relationship} aria-describedby={errors.relationship ? "depRel-error" : undefined}
                    onBlur={() => handleBlur("relationship")}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="depDob" label="Date of Birth" required error={errors.dateOfBirth}>
                <Input id="depDob" type="date" placeholder="YYYY-MM-DD" value={form.dateOfBirth}
                  onChange={e => { setForm(f => ({ ...f, dateOfBirth: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.dateOfBirth; return n; }); }}
                  onBlur={() => handleBlur("dateOfBirth")}
                  max={format(new Date(), "yyyy-MM-dd")}
                  disabled={isSaving}
                  aria-invalid={!!errors.dateOfBirth} aria-describedby={errors.dateOfBirth ? "depDob-error" : undefined}
                  className={cn(errors.dateOfBirth && "border-red-400")} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="depEmail" label="Email" error={errors.email} help="Optional">
                <Input id="depEmail" type="email" placeholder="mia@example.com"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.email; return n; }); }}
                  onBlur={() => handleBlur("email")}
                  disabled={isSaving}
                  aria-invalid={!!errors.email} aria-describedby={errors.email ? "depEmail-error" : "depEmail-help"}
                  className={cn(errors.email && "border-red-400")} />
              </FormField>
              <FormField id="depPhone" label="Phone" help="Optional — e.g. +1 415 555 0199">
                <Input id="depPhone" placeholder="+1 415 555 0199"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  disabled={isSaving}
                  aria-describedby="depPhone-help" />
              </FormField>
            </div>
            <FormField id="depNotes" label="Notes" error={errors.notes} help="Medical or special notes (max 500 chars)">
              <div className="relative">
                <Textarea id="depNotes" placeholder="Medical or special notes (max 500 chars)"
                  value={form.notes} maxLength={501}
                  onChange={e => { setForm(f => ({ ...f, notes: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.notes; return n; }); }}
                  onBlur={() => handleBlur("notes")}
                  rows={2} disabled={isSaving}
                  aria-invalid={!!errors.notes} aria-describedby={errors.notes ? "depNotes-error" : "depNotes-help"}
                  className={cn(errors.notes && "border-red-400")} />
                <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">{form.notes.length}/500</span>
              </div>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isFormValid || isSaving} className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Dependent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this dependent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all stored details for this dependent. This action cannot be undone.
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
