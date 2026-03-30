// ─── Start of Week Management ────────────────────────────────────────────────
// Configure the start of week per country for booking calendars.
// Table with inline edit via modal, status filter, export dropdown.

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search,
  Pencil,
  Download,
  ArrowUpDown,
  X,
  Calendar,
  Info,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  FileDown,
  Database,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import type { StartOfWeekEntry, DayOfWeek } from "./types";
import { DAYS_OF_WEEK } from "./types";
import { INITIAL_START_OF_WEEK_DATA } from "./mockData";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type SortField = "country" | "startOfWeek" | "isActive" | "createdAt" | "updatedAt";
type StatusFilter = "all" | "active" | "inactive";

// ─── Edit Modal ─────────────────────────────────────────────────────────────

function EditStartOfWeekModal({
  open,
  onClose,
  entry,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  entry: StartOfWeekEntry;
  onSave: (id: string, day: DayOfWeek) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(entry.startOfWeek);

  function handleSubmit() {
    onSave(entry.id, selectedDay);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Start of Week</DialogTitle>
          <DialogDescription>
            Update the start of week for {entry.country}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input
              value={`${entry.country} (${entry.countryCode})`}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="start-day">Start of Week <span className="text-red-500">*</span></Label>
            <Select value={selectedDay} onValueChange={(v) => setSelectedDay(v as DayOfWeek)}>
              <SelectTrigger className="h-9 text-sm" id="start-day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-[#003B95] hover:bg-[#002a6b]">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Export Format Icons ────────────────────────────────────────────────────

const EXPORT_FORMATS = [
  { key: "txt", label: "TXT", icon: FileText },
  { key: "xls", label: "XLS", icon: FileSpreadsheet },
  { key: "csv", label: "CSV", icon: FileDown },
  { key: "pdf", label: "PDF", icon: File },
  { key: "sql", label: "SQL", icon: Database },
] as const;

// ─── Main Page ──────────────────────────────────────────────────────────────

export function StartOfWeekPage() {
  const [entries, setEntries] = useState<StartOfWeekEntry[]>(INITIAL_START_OF_WEEK_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("country");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StartOfWeekEntry | null>(null);

  // ─── Derived Data ──────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = [...entries];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.country.toLowerCase().includes(q) ||
          e.countryCode.toLowerCase().includes(q) ||
          e.startOfWeek.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((e) => e.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((e) => !e.isActive);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | boolean;
      let bVal: string | boolean;

      switch (sortField) {
        case "country":
          aVal = a.country;
          bVal = b.country;
          break;
        case "startOfWeek":
          aVal = a.startOfWeek;
          bVal = b.startOfWeek;
          break;
        case "isActive":
          aVal = a.isActive;
          bVal = b.isActive;
          break;
        case "createdAt":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        case "updatedAt":
          aVal = a.updatedAt;
          bVal = b.updatedAt;
          break;
        default:
          aVal = a.country;
          bVal = b.country;
      }

      if (typeof aVal === "boolean") {
        return sortDir === "asc" ? (aVal ? 1 : -1) : aVal ? -1 : 1;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [entries, search, statusFilter, sortField, sortDir]);

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ─── Actions ───────────────────────────────────────────────

  function openEdit(entry: StartOfWeekEntry) {
    setEditingEntry(entry);
    setEditModalOpen(true);
  }

  function handleSaveEdit(id: string, day: DayOfWeek) {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, startOfWeek: day, updatedAt: new Date().toISOString().split("T")[0] }
          : e
      )
    );
    toast.success("Start of week updated successfully.");
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleExport(format: string) {
    toast.success(`Export as ${format.toUpperCase()} started. File will be downloaded shortly.`);
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header + breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <span>Admin</span>
          <span>/</span>
          <span>Configuration</span>
          <span>/</span>
          <span className="text-gray-700">Start of Week</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Start of Week Management</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Configure the start of week per country for booking calendars
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search countries..."
              className="pl-9 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-9">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {EXPORT_FORMATS.map((fmt) => (
              <DropdownMenuItem
                key={fmt.key}
                onClick={() => handleExport(fmt.key)}
                className="gap-2"
              >
                <fmt.icon className="h-3.5 w-3.5" />
                Export as {fmt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          If not set for a country, the system defaults to Monday.
        </span>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("country")}>
                <div className="flex items-center gap-1">
                  Country
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("startOfWeek")}>
                <div className="flex items-center gap-1">
                  Current Start of Week
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("isActive")}>
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                <div className="flex items-center gap-1">
                  Creation Date
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("updatedAt")}>
                <div className="flex items-center gap-1">
                  Updated Date
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-10 w-10 text-gray-200" />
                    <p className="text-sm font-medium text-gray-900">No entries found</p>
                    <p className="text-xs text-gray-500">
                      {search || statusFilter !== "all"
                        ? "Try adjusting your search or filters."
                        : "No start of week configurations available."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{entry.country}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                        {entry.countryCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm text-gray-700">{entry.startOfWeek}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px]",
                        entry.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      )}
                    >
                      {entry.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(entry.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(entry.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-[#003B95]"
                      onClick={() => openEdit(entry)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalEntries > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalEntries)} of {totalEntries}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <Button
                  key={pg}
                  variant={pg === page ? "default" : "outline"}
                  size="icon"
                  className={cn("h-8 w-8 text-xs", pg === page && "bg-[#003B95] hover:bg-[#002a6b]")}
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingEntry && (
        <EditStartOfWeekModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          entry={editingEntry}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
