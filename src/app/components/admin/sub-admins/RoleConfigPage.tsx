// ─── SCR-ADM-040: Role Configuration (Create / Edit) ─────────────────────────
// Granular module-level permissions for admin panel roles.
// 13 modules, each with specific permission actions.
// Colour swatch selector, collapsible module sections, global select all.

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Lock,
  Save,
  AlertTriangle,
  X,
  Shield,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import type { Role, RoleFormData, RolePermissions } from "./types";
import {
  PERMISSION_MODULES,
  ROLE_COLOURS,
  EMPTY_ROLE_FORM,
  countPermissions,
  totalAvailablePermissions,
} from "./types";
import { MOCK_ROLES } from "./mockData";

// ─── Validation ─────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string;
  description?: string;
  colourId?: string;
  permissions?: string;
}

function validateRoleForm(
  form: RoleFormData,
  existingNames: string[],
  editingName?: string,
): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Role name is required.";
  } else if (form.name.trim().length < 2) {
    errors.name = "Role name must be at least 2 characters.";
  } else if (form.name.trim().length > 100) {
    errors.name = "Role name must not exceed 100 characters.";
  } else {
    const isDuplicate = existingNames.some(
      (n) =>
        n.toLowerCase() === form.name.trim().toLowerCase() &&
        n.toLowerCase() !== editingName?.toLowerCase(),
    );
    if (isDuplicate) errors.name = "A role with this name already exists.";
  }

  if (form.description.length > 500) {
    errors.description = "Description must not exceed 500 characters.";
  }

  if (!form.colourId) {
    errors.colourId = "Please select a colour for this role.";
  }

  const totalPerms = countPermissions(form.permissions);
  if (totalPerms === 0) {
    errors.permissions = "At least one permission must be selected.";
  }

  return errors;
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function RoleConfigPage() {
  const { id: roleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(roleId);

  // ── Data ──
  const [roles] = useState<Role[]>(MOCK_ROLES);
  const existingRole = useMemo(
    () => (roleId ? roles.find((r) => r.id === roleId) : undefined),
    [roleId, roles],
  );

  // ── Form State ──
  const [form, setForm] = useState<RoleFormData>(EMPTY_ROLE_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialFormJson, setInitialFormJson] = useState("");

  // ── Collapsible modules ──
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );

  // ── Confirm modals ──
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // ── Load existing role data ──
  useEffect(() => {
    if (isEditMode && existingRole) {
      const loadedForm: RoleFormData = {
        name: existingRole.name,
        description: existingRole.description,
        colourId: existingRole.colourId,
        permissions: { ...existingRole.permissions },
      };
      setForm(loadedForm);
      setInitialFormJson(JSON.stringify(loadedForm));
      // Expand modules that have permissions
      const expandedSet = new Set<string>();
      for (const moduleId of Object.keys(existingRole.permissions)) {
        if (existingRole.permissions[moduleId]?.length > 0) {
          expandedSet.add(moduleId);
        }
      }
      setExpandedModules(expandedSet);
    } else if (isEditMode && !existingRole) {
      toast.error("Role not found.");
      navigate("/sub-admins");
    } else {
      setInitialFormJson(JSON.stringify(EMPTY_ROLE_FORM));
    }
  }, [isEditMode, existingRole, navigate]);

  // ── Track changes ──
  useEffect(() => {
    if (initialFormJson) {
      setHasChanges(JSON.stringify(form) !== initialFormJson);
    }
  }, [form, initialFormJson]);

  // ── Permission helpers ──
  const totalSelected = useMemo(
    () => countPermissions(form.permissions),
    [form.permissions],
  );
  const totalAvailable = useMemo(() => totalAvailablePermissions(), []);

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function getModulePermissions(moduleId: string): string[] {
    return form.permissions[moduleId] ?? [];
  }

  function togglePermission(moduleId: string, permission: string) {
    setForm((prev) => {
      const currentPerms = prev.permissions[moduleId] ?? [];
      const newPerms = currentPerms.includes(permission)
        ? currentPerms.filter((p) => p !== permission)
        : [...currentPerms, permission];
      const newPermissions = { ...prev.permissions };
      if (newPerms.length === 0) {
        delete newPermissions[moduleId];
      } else {
        newPermissions[moduleId] = newPerms;
      }
      return { ...prev, permissions: newPermissions };
    });
  }

  function toggleModuleAll(moduleId: string) {
    const module = PERMISSION_MODULES.find((m) => m.moduleId === moduleId);
    if (!module) return;
    const currentPerms = form.permissions[moduleId] ?? [];
    const allSelected = currentPerms.length === module.permissions.length;

    setForm((prev) => {
      const newPermissions = { ...prev.permissions };
      if (allSelected) {
        delete newPermissions[moduleId];
      } else {
        newPermissions[moduleId] = [...module.permissions];
      }
      return { ...prev, permissions: newPermissions };
    });
  }

  function toggleGlobalAll() {
    const allSelected = totalSelected === totalAvailable;
    setForm((prev) => {
      if (allSelected) {
        return { ...prev, permissions: {} };
      }
      const newPermissions: RolePermissions = {};
      for (const module of PERMISSION_MODULES) {
        newPermissions[module.moduleId] = [...module.permissions];
      }
      return { ...prev, permissions: newPermissions };
    });
  }

  function getModuleCheckState(moduleId: string): boolean | "indeterminate" {
    const module = PERMISSION_MODULES.find((m) => m.moduleId === moduleId);
    if (!module) return false;
    const currentPerms = form.permissions[moduleId] ?? [];
    if (currentPerms.length === 0) return false;
    if (currentPerms.length === module.permissions.length) return true;
    return "indeterminate";
  }

  function getGlobalCheckState(): boolean | "indeterminate" {
    if (totalSelected === 0) return false;
    if (totalSelected === totalAvailable) return true;
    return "indeterminate";
  }

  // ── Cancel / Save handlers ──
  function handleCancel() {
    if (hasChanges) {
      setShowCancelConfirm(true);
    } else {
      navigate("/sub-admins");
    }
  }

  function confirmCancel() {
    setShowCancelConfirm(false);
    navigate("/sub-admins");
  }

  async function handleSave() {
    const existingNames = roles.map((r) => r.name);
    const editingName = isEditMode ? existingRole?.name : undefined;

    const errs = validateRoleForm(form, existingNames, editingName);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    // If edit mode with assigned sub-admins, show confirmation
    if (isEditMode && existingRole && existingRole.subAdminCount > 0) {
      setShowSaveConfirm(true);
      return;
    }

    await performSave();
  }

  async function performSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);

    if (isEditMode) {
      const affected = existingRole?.subAdminCount ?? 0;
      if (affected > 0) {
        toast.success(
          `Role updated successfully. ${affected} affected sub-admin${affected !== 1 ? "s" : ""} have been logged out.`,
        );
      } else {
        toast.success("Role updated successfully.");
      }
    } else {
      toast.success("Role created successfully.");
    }

    navigate("/sub-admins");
  }

  async function confirmSave() {
    setShowSaveConfirm(false);
    await performSave();
  }

  // ── Breadcrumb ──
  const breadcrumbTitle = isEditMode
    ? `Edit Role: ${existingRole?.name ?? ""}`
    : "Create Role";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 p-6">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-10 w-9 p-0 flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="min-w-0">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="mb-1">
                <ol className="flex items-center gap-1.5 text-sm">
                  <li>
                    <button
                      onClick={handleCancel}
                      className="text-gray-500 hover:text-[#003B95] transition-colors"
                    >
                      Sub-Admin Management
                    </button>
                  </li>
                  <li className="text-gray-400">/</li>
                  <li>
                    <button
                      onClick={handleCancel}
                      className="text-gray-500 hover:text-[#003B95] transition-colors"
                    >
                      Roles
                    </button>
                  </li>
                  <li className="text-gray-400">/</li>
                  <li
                    className="text-gray-900 font-medium truncate max-w-[200px]"
                    aria-current="page"
                  >
                    {breadcrumbTitle}
                  </li>
                </ol>
              </nav>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900 truncate">
                  {breadcrumbTitle}
                </h1>
                {hasChanges && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
                    title="Unsaved changes"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || (isEditMode && !hasChanges)}
              className="bg-[#003B95] hover:bg-[#002d73] text-white min-w-[120px]"
              aria-label="Save role"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={15} className="mr-2" />
                  Save Role
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Role Details Card ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Row 1: Name + Colour */}
            <div className="grid grid-cols-2 gap-6">
              {/* Role Name */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter role name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={cn(errors.name && "border-red-400")}
                  maxLength={100}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Colour Swatch Selector */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Role Colour <span className="text-red-500">*</span>
                </Label>
                <div
                  className="flex flex-wrap gap-2.5 pt-1"
                  role="radiogroup"
                  aria-label="Select role colour"
                >
                  {ROLE_COLOURS.map((colour) => {
                    const isSelected = form.colourId === colour.id;
                    return (
                      <Tooltip key={colour.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={colour.name}
                            onClick={() =>
                              setForm((f) => ({ ...f, colourId: colour.id }))
                            }
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                              isSelected &&
                                "ring-2 ring-offset-2 ring-gray-400 scale-110",
                            )}
                            style={{ backgroundColor: colour.hex }}
                          >
                            {isSelected && (
                              <Check
                                size={14}
                                className="text-white drop-shadow-sm"
                              />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{colour.name}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
                {errors.colourId && (
                  <p className="text-xs text-red-500">{errors.colourId}</p>
                )}
              </div>
            </div>

            {/* Row 2: Description (full width) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                placeholder="Enter role description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className={cn(errors.description && "border-red-400")}
                maxLength={500}
                rows={3}
              />
              <div className="flex items-center justify-between">
                {errors.description ? (
                  <p className="text-xs text-red-500">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  {form.description.length}/500
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Permission Matrix ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield size={18} className="text-[#003B95]" />
                Module Permissions
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalSelected} of {totalAvailable} permissions selected
              </p>
            </div>
            {/* Global Select All */}
            <div className="flex items-center gap-2.5">
              <Checkbox
                checked={getGlobalCheckState()}
                onCheckedChange={toggleGlobalAll}
                aria-label="Select all permissions"
              />
              <Label
                className="text-sm font-medium text-gray-700 cursor-pointer"
                onClick={toggleGlobalAll}
              >
                Select All Permissions
              </Label>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {errors.permissions && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-3">
                <AlertTriangle
                  size={15}
                  className="text-red-500 flex-shrink-0"
                />
                <p className="text-sm text-red-600">{errors.permissions}</p>
              </div>
            )}

            {PERMISSION_MODULES.map((module) => {
              const isExpanded = expandedModules.has(module.moduleId);
              const modulePerms = getModulePermissions(module.moduleId);
              const checkState = getModuleCheckState(module.moduleId);
              const selectedCount = modulePerms.length;
              const totalCount = module.permissions.length;

              return (
                <div
                  key={module.moduleId}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                  role="group"
                  aria-label={`${module.moduleName} permissions`}
                >
                  {/* Module header */}
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                      isExpanded ? "bg-gray-50" : "hover:bg-gray-50/60",
                    )}
                    onClick={() => toggleModule(module.moduleId)}
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      className="flex-shrink-0 text-gray-500"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>

                    <div
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModuleAll(module.moduleId);
                      }}
                    >
                      <Checkbox
                        checked={checkState}
                        onCheckedChange={() => toggleModuleAll(module.moduleId)}
                        aria-label={`Select all ${module.moduleName} permissions`}
                      />
                    </div>

                    <span className="text-sm font-medium text-gray-800 flex-1">
                      {module.moduleName}
                    </span>

                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {selectedCount}/{totalCount} selected
                    </Badge>
                  </div>

                  {/* Module permissions (expanded) */}
                  {isExpanded && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-white">
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {module.permissions.map((perm) => {
                          const isChecked = modulePerms.includes(perm);
                          return (
                            <label
                              key={perm}
                              className={cn(
                                "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors",
                                isChecked
                                  ? "border-blue-300 bg-blue-50/50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() =>
                                  togglePermission(module.moduleId, perm)
                                }
                                aria-label={perm}
                              />
                              <span className="text-sm text-gray-700">
                                {perm}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── Sticky Footer (for scrolled state) ── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-end gap-3 z-10">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (isEditMode && !hasChanges)}
            className="bg-[#003B95] hover:bg-[#002d73] text-white min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={15} className="mr-2" />
                Save Role
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Confirm Cancel Modal ── */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={18} className="text-amber-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription>
              You have unsaved changes. Discard changes and leave?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
            >
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Save (edit mode, forced logout) Modal ── */}
      <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={18} className="text-amber-500" />
              Confirm Role Update
            </DialogTitle>
            <DialogDescription>
              Updating this role will force{" "}
              <span className="font-medium">
                {existingRole?.subAdminCount ?? 0} sub-admin
                {(existingRole?.subAdminCount ?? 0) !== 1 ? "s" : ""}
              </span>{" "}
              to log out immediately. Continue?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-700">
              All sub-admins assigned to the{" "}
              <span className="font-medium">{existingRole?.name}</span> role
              will have their sessions invalidated and will need to log in again
              with the updated permissions.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSaveConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmSave}
              disabled={saving}
              className="bg-[#003B95] hover:bg-[#002d73] text-white min-w-[130px]"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin mr-2" />
              ) : (
                <Save size={15} className="mr-2" />
              )}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
