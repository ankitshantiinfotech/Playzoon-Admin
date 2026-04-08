import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  MapPin,
  Download,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Switch } from "../../ui/switch";
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
import type { Location } from "./types";
import { INITIAL_LOCATIONS } from "./mockData";

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Location Form Modal ────────────────────────────────────────────────────

function LocationFormModal({
  open,
  onClose,
  location,
  existingLocations,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  location: Location | null;
  existingLocations: Location[];
  onSave: (data: {
    name: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
  }) => void;
}) {
  const isEdit = !!location;
  const [name, setName] = useState(location?.name ?? "");
  const [latitude, setLatitude] = useState(
    location?.latitude?.toString() ?? "",
  );
  const [longitude, setLongitude] = useState(
    location?.longitude?.toString() ?? "",
  );
  const [isActive, setIsActive] = useState(location?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Location name is required.";
    else if (name.trim().length < 2)
      errs.name = "Location name must be at least 2 characters.";
    else if (
      existingLocations.some(
        (l) =>
          l.id !== location?.id &&
          l.name.toLowerCase() === name.trim().toLowerCase(),
      )
    )
      errs.name = "A location with this name already exists.";

    if (!latitude.trim()) errs.latitude = "Latitude is required.";
    else {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90)
        errs.latitude = "Latitude must be between -90 and 90.";
    }

    if (!longitude.trim()) errs.longitude = "Longitude is required.";
    else {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180)
        errs.longitude = "Longitude must be between -180 and 180.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      isActive,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Location" : "Add Location"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the location details."
              : "Add a new location to the platform."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="location-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder="Enter location name"
              maxLength={100}
              className={errors.name ? "border-red-400" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="location-lat">
                Latitude <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location-lat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => {
                  setLatitude(e.target.value);
                  setErrors((p) => ({ ...p, latitude: "" }));
                }}
                placeholder="e.g., 24.7136"
                className={errors.latitude ? "border-red-400" : ""}
              />
              {errors.latitude && (
                <p className="text-xs text-red-500">{errors.latitude}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location-lng">
                Longitude <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location-lng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => {
                  setLongitude(e.target.value);
                  setErrors((p) => ({ ...p, longitude: "" }));
                }}
                placeholder="e.g., 46.6753"
                className={errors.longitude ? "border-red-400" : ""}
              />
              {errors.longitude && (
                <p className="text-xs text-red-500">{errors.longitude}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="location-status" className="text-sm">
              Status
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {isActive ? "Active" : "Inactive"}
              </span>
              <Switch
                id="location-status"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#003B95] hover:bg-[#002a6b]"
          >
            {isEdit ? "Save Changes" : "Add Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function LocationMasterPage() {
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Location | null>(null);

  // ─── Derived ──────────────────────────────────────────────
  const filteredLocations = useMemo(() => {
    if (statusFilter === "all") return locations;
    return locations.filter((l) =>
      statusFilter === "active" ? l.isActive : !l.isActive,
    );
  }, [locations, statusFilter]);

  const totalItems = filteredLocations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLocations = filteredLocations.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // ─── CRUD ─────────────────────────────────────────────────

  function openAddLocation() {
    setEditingLocation(null);
    setModalOpen(true);
  }

  function openEditLocation(location: Location) {
    setEditingLocation(location);
    setModalOpen(true);
  }

  function handleSaveLocation(data: {
    name: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
  }) {
    const now = new Date().toISOString().split("T")[0];
    if (editingLocation) {
      setLocations((prev) =>
        prev.map((l) =>
          l.id === editingLocation.id
            ? {
                ...l,
                name: data.name,
                latitude: data.latitude,
                longitude: data.longitude,
                isActive: data.isActive,
                updatedAt: now,
              }
            : l,
        ),
      );
      toast.success("Location updated successfully.");
    } else {
      const newLocation: Location = {
        id: generateId(),
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        isActive: data.isActive,
        associatedFacilities: 0,
        createdAt: now,
        updatedAt: now,
      };
      setLocations((prev) => [...prev, newLocation]);
      toast.success("Location created successfully.");
    }
    setModalOpen(false);
  }

  function handleDeleteLocation() {
    if (!deleteConfirm) return;
    if (deleteConfirm.associatedFacilities > 0) {
      toast.error(
        `Cannot delete: location is associated with ${deleteConfirm.associatedFacilities} facilities`,
      );
      setDeleteConfirm(null);
      return;
    }
    setLocations((prev) => prev.filter((l) => l.id !== deleteConfirm.id));
    toast.success("Location deleted successfully.");
    setDeleteConfirm(null);
  }

  function handleExport(format: string) {
    toast.success(`Exported as ${format}`);
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Location Master</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage locations for the platform
          </p>
        </div>
        <Button
          onClick={openAddLocation}
          className="bg-[#003B95] hover:bg-[#002a6b] gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      {/* Filters & Export */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600 whitespace-nowrap">
                Status:
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as "all" | "active" | "inactive");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[140px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("TXT")}>
                Export as TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("XLS")}>
                Export as XLS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("CSV")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("PDF")}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("SQL")}>
                Export as SQL
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          {filteredLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MapPin className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-900">
                No Locations Found
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {statusFilter !== "all"
                  ? "Try changing the status filter."
                  : "Add your first location to get started."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Updated Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLocations.map((location, index) => (
                  <TableRow key={location.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-gray-500 text-sm">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {location.name}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                        {location.latitude.toFixed(4)},{" "}
                        {location.longitude.toFixed(4)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px]",
                          location.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200",
                        )}
                      >
                        {location.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(location.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(location.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-[#003B95]"
                          onClick={() => openEditLocation(location)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => setDeleteConfirm(location)}
                          aria-label={`Delete ${location.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
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
                Showing {(page - 1) * pageSize + 1}--
                {Math.min(page * pageSize, totalItems)} of {totalItems}
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
                  className={cn(
                    "h-8 w-8 text-xs",
                    pg === page && "bg-[#003B95] hover:bg-[#002a6b]",
                  )}
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

      {/* ─── Modals ──────────────────────────────────────────── */}

      {modalOpen && (
        <LocationFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          location={editingLocation}
          existingLocations={locations}
          onSave={handleSaveLocation}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(v) => {
          if (!v) setDeleteConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && deleteConfirm.associatedFacilities > 0
                ? `Cannot delete: location is associated with ${deleteConfirm.associatedFacilities} facilities`
                : `Are you sure you want to delete "${deleteConfirm?.name}"? This action is permanent.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteConfirm && deleteConfirm.associatedFacilities === 0 && (
              <AlertDialogAction
                onClick={handleDeleteLocation}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
