import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { toast } from "sonner";
import { AdminUser, AdminRole } from "./types";

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminToEdit?: AdminUser | null;
  onSave: (admin: Omit<AdminUser, 'id' | 'lastLogin'>) => void;
  roles: AdminRole[];
  existingEmails: string[];
}

export function AddAdminModal({ isOpen, onClose, adminToEdit, onSave, roles, existingEmails }: AddAdminModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  useEffect(() => {
    if (isOpen) {
      if (adminToEdit) {
        setName(adminToEdit.name);
        setEmail(adminToEdit.email);
        setRoleId(adminToEdit.roleId);
        setStatus(adminToEdit.status);
      } else {
        setName("");
        setEmail("");
        setRoleId("");
        setStatus("active");
      }
    }
  }, [isOpen, adminToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !roleId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!adminToEdit && existingEmails.includes(email)) {
      toast.error("Email is already registered");
      return;
    }

    onSave({
      name,
      email,
      roleId,
      status
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{adminToEdit ? "Edit Administrator" : "Add New Administrator"}</DialogTitle>
          <DialogDescription>
            {adminToEdit ? "Update admin details and permissions." : "Create a new admin account with specific role access."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@playzoon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!adminToEdit} // Prevent changing email for security/simplicity
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(val: "active" | "inactive") => setStatus(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">{adminToEdit ? "Save Changes" : "Create Admin"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
