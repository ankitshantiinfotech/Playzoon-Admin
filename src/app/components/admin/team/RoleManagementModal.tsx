import { useState, useEffect } from "react";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import { AdminRole, ModulePermissions } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { Badge } from "../../ui/badge";

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: AdminRole | null;
  onSave: (role: AdminRole) => void;
}

const MODULES = [
  "Dashboard",
  "Master Data",
  "Service Providers",
  "Users",
  "Bookings",
  "Settings"
];

const PERMISSIONS: Array<keyof ModulePermissions> = ["view", "edit", "active", "lock"];

const PERMISSION_LABELS: Record<keyof ModulePermissions, string> = {
  view: "View",
  edit: "Edit",
  active: "Activate/Deactivate",
  lock: "Lock/Unlock"
};

const defaultPermissions: ModulePermissions = {
  view: false,
  edit: false,
  active: false,
  lock: false
};

export function RoleManagementModal({ isOpen, onClose, roleToEdit, onSave }: RoleManagementModalProps) {
  const [roleName, setRoleName] = useState("");
  const [roleColor, setRoleColor] = useState("blue");
  const [permissions, setPermissions] = useState<Record<string, ModulePermissions>>({});

  useEffect(() => {
    if (isOpen) {
      if (roleToEdit) {
        setRoleName(roleToEdit.name);
        setRoleColor(roleToEdit.color);
        setPermissions(roleToEdit.permissions);
      } else {
        setRoleName("");
        setRoleColor("blue");
        const initialPermissions: Record<string, ModulePermissions> = {};
        MODULES.forEach(module => {
          initialPermissions[module] = { ...defaultPermissions };
        });
        setPermissions(initialPermissions);
      }
    }
  }, [isOpen, roleToEdit]);

  const handlePermissionChange = (module: string, permission: keyof ModulePermissions, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: checked
      }
    }));
  };

  const handleSelectAll = (module: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        view: checked,
        edit: checked,
        active: checked,
        lock: checked
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    const hasAnyPermission = Object.values(permissions).some(
      modulePerms => Object.values(modulePerms).some(p => p)
    );

    if (!hasAnyPermission) {
      toast.error("Select at least one permission");
      return;
    }

    onSave({
      id: roleToEdit?.id || Math.random().toString(36).substr(2, 9),
      name: roleName,
      color: roleColor,
      permissions
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{roleToEdit ? "Edit Role" : "Create New Role"}</DialogTitle>
          <DialogDescription>
            Configure granular permissions for each module.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g. Support Agent"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roleColor">Color Badge</Label>
              <div className="flex gap-2 mt-2">
                {["blue", "green", "purple", "orange", "gray"].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      roleColor === color ? "border-black ring-2 ring-offset-1 ring-black" : "border-transparent"
                    } bg-${color}-500`}
                    style={{ backgroundColor: `var(--color-${color}-500)` }} // Fallback/Helper if needed
                    onClick={() => setRoleColor(color)}
                  >
                    <div className={`w-full h-full rounded-full bg-${color}-500`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Module</TableHead>
                  {PERMISSIONS.map(perm => (
                    <TableHead key={perm} className="text-center">{PERMISSION_LABELS[perm]}</TableHead>
                  ))}
                  <TableHead className="text-center">Select All</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODULES.map(module => (
                  <TableRow key={module}>
                    <TableCell className="font-medium">{module}</TableCell>
                    {PERMISSIONS.map(perm => (
                      <TableCell key={perm} className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={permissions[module]?.[perm] || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(module, perm, checked as boolean)
                            }
                          />
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={Object.values(permissions[module] || {}).every(Boolean)}
                          onCheckedChange={(checked) => handleSelectAll(module, checked as boolean)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">{roleToEdit ? "Update Role" : "Create Role"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
