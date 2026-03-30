import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Search, Trash2, Plus, Building2, MapPin,
  Calendar, AlertTriangle, X, Eye, Dumbbell,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Badge } from "../../../ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "../../../ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../../ui/alert-dialog";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "../../../ui/sheet";
import type { AssignedFacility } from "./training-provider-detail-data";
import { getAvailableFacilities, type FacilityOption } from "./training-provider-detail-data";

// ─── Props ───────────────────────────────────────────────────

interface FacilityAssignmentProps {
  assignedFacilities: AssignedFacility[];
  providerName: string;
  onAssign: (facility: AssignedFacility) => void;
  onRemove: (facilityId: string) => void;
}

// ─── Status badge styles ─────────────────────────────────────

const STATUS_STYLES = {
  Active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  Inactive: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200", dot: "bg-gray-400" },
};

// ═══════════════════════════════════════════════════════════════
// Facility Assignment Section
// ═══════════════════════════════════════════════════════════════

export function FacilityAssignment({
  assignedFacilities,
  providerName,
  onAssign,
  onRemove,
}: FacilityAssignmentProps) {
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [sheetSearch, setSheetSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<AssignedFacility | null>(null);
  const [viewTarget, setViewTarget] = useState<AssignedFacility | null>(null);

  const assignedIds = useMemo(
    () => assignedFacilities.map(f => f.id),
    [assignedFacilities]
  );

  const availableFacilities = useMemo(
    () => getAvailableFacilities(assignedIds),
    [assignedIds]
  );

  const filteredSheetOptions = useMemo(() => {
    if (!sheetSearch.trim()) return availableFacilities;
    const q = sheetSearch.toLowerCase();
    return availableFacilities.filter(
      f => f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q)
    );
  }, [availableFacilities, sheetSearch]);

  const handleAssign = (facility: FacilityOption) => {
    onAssign({
      id: facility.id,
      name: facility.name,
      location: facility.location,
      sportsAvailable: facility.sportsAvailable,
      status: "Active",
      assignedAt: new Date(),
    });
    toast.success(`${facility.name} assigned successfully`);
  };

  const handleConfirmRemove = () => {
    if (!removeTarget) return;
    onRemove(removeTarget.id);
    toast.success(`${removeTarget.name} unassigned from ${providerName}`);
    setRemoveTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* ── Top Bar with Assign Button ────────────── */}
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          className="bg-[#003B95] hover:bg-[#002d73] text-white gap-1.5"
          onClick={() => { setAssignSheetOpen(true); setSheetSearch(""); }}
        >
          <Plus className="h-4 w-4" />
          Assign Facility
        </Button>
      </div>

      {/* ── Assigned Facilities Table ──────────────── */}
      {assignedFacilities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
          <Building2 className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No facilities assigned</p>
          <p className="text-xs text-gray-400 mt-1">
            Click &quot;Assign Facility&quot; to assign facilities to this provider
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="px-4 text-xs text-gray-500">Facility Name</TableHead>
                <TableHead className="px-4 text-xs text-gray-500 hidden sm:table-cell">Location</TableHead>
                <TableHead className="px-4 text-xs text-gray-500 hidden md:table-cell">Sports Available</TableHead>
                <TableHead className="px-4 text-xs text-gray-500 hidden lg:table-cell">Status</TableHead>
                <TableHead className="px-4 text-xs text-gray-500 hidden lg:table-cell">Assigned Date</TableHead>
                <TableHead className="px-4 text-xs text-gray-500 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedFacilities.map(facility => {
                const s = STATUS_STYLES[facility.status];
                return (
                  <TableRow key={facility.id} className="hover:bg-gray-50/50">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-[#003B95]" />
                        </div>
                        <span className="text-sm text-[#111827] font-medium">{facility.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-xs text-gray-500 hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {facility.location}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {facility.sportsAvailable.map(sport => (
                          <Badge
                            key={sport}
                            variant="outline"
                            className="text-[10px] text-gray-600 border-gray-200 bg-gray-50"
                          >
                            {sport}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] gap-1 border", s.bg, s.text, s.border)}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                        {facility.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-xs text-gray-500 hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {format(facility.assignedAt, "dd MMM yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#003B95] hover:text-[#002d73] hover:bg-blue-50"
                          onClick={() => setViewTarget(facility)}
                          aria-label={`View ${facility.name}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setRemoveTarget(facility)}
                          aria-label={`Unassign ${facility.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Assign Facility Sheet ──────────────────── */}
      <Sheet open={assignSheetOpen} onOpenChange={setAssignSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg w-full">
          <SheetHeader>
            <SheetTitle>Assign Facility</SheetTitle>
            <SheetDescription>
              Search and select a facility to assign to this training provider.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4 flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or location..."
                value={sheetSearch}
                onChange={e => setSheetSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-white border-gray-200"
                aria-label="Search facilities"
              />
              {sheetSearch && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setSheetSearch("")}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            <div className="text-xs text-gray-400">
              {filteredSheetOptions.length} facilit{filteredSheetOptions.length === 1 ? "y" : "ies"} available
            </div>

            {/* Facility list */}
            <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-2">
              {filteredSheetOptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Building2 className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    {availableFacilities.length === 0
                      ? "All facilities are already assigned"
                      : "No facilities match your search"
                    }
                  </p>
                </div>
              ) : (
                filteredSheetOptions.map(facility => (
                  <div
                    key={facility.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#003B95]/30 hover:bg-[#003B95]/[0.02] transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="h-4 w-4 text-[#003B95]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#111827]">{facility.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-500 truncate">{facility.location}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {facility.sportsAvailable.map(sport => (
                          <Badge
                            key={sport}
                            variant="outline"
                            className="text-[10px] text-gray-600 border-gray-200 bg-gray-50"
                          >
                            {sport}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#003B95] hover:bg-[#002d73] text-white gap-1 shrink-0 mt-0.5"
                      onClick={() => handleAssign(facility)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Assign
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── View Facility Dialog ───────────────────── */}
      <Dialog open={!!viewTarget} onOpenChange={open => { if (!open) setViewTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#003B95]" />
              Facility Details
            </DialogTitle>
            <DialogDescription>
              Details for the assigned facility.
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Facility Name</p>
                  <p className="text-sm text-[#111827] mt-0.5">{viewTarget.name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Facility ID</p>
                  <p className="text-sm text-[#111827] mt-0.5 font-mono">{viewTarget.id}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Location</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <p className="text-sm text-[#111827]">{viewTarget.location}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Status</p>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] gap-1 border",
                        STATUS_STYLES[viewTarget.status].bg,
                        STATUS_STYLES[viewTarget.status].text,
                        STATUS_STYLES[viewTarget.status].border,
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_STYLES[viewTarget.status].dot)} />
                      {viewTarget.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Assigned Date</p>
                  <p className="text-sm text-[#111827] mt-0.5">{format(viewTarget.assignedAt, "dd MMM yyyy")}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">Sports Available</p>
                <div className="flex flex-wrap gap-1.5">
                  {viewTarget.sportsAvailable.map(sport => (
                    <Badge
                      key={sport}
                      variant="outline"
                      className="text-xs text-gray-600 border-gray-200 bg-gray-50 gap-1"
                    >
                      <Dumbbell className="h-3 w-3 text-gray-400" />
                      {sport}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Unassign Confirmation Modal ────────────── */}
      <AlertDialog open={!!removeTarget} onOpenChange={open => { if (!open) setRemoveTarget(null); }}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Unassign Facility
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unassign{" "}
              <span className="font-medium text-[#111827]">{removeTarget?.name}</span>{" "}
              from{" "}
              <span className="font-medium text-[#111827]">{providerName}</span>?
              This action can be reversed by re-assigning later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmRemove}
            >
              Unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
