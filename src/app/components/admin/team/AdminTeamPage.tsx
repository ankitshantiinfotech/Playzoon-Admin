import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { toast } from "sonner";
import { 
  AdminUser, 
  AdminRole, 
  AdminStatus
} from "./types";
import { AdminStatsDisplay } from "./AdminStatsDisplay";
import { AdminTable } from "./AdminTable";
import { AddAdminModal } from "./AddAdminModal";
import { RoleManagementModal } from "./RoleManagementModal";
import { RolesList } from "./RolesList";

// MOCK DATA
const INITIAL_ROLES: AdminRole[] = [
  {
    id: "r1",
    name: "Super Admin",
    color: "purple",
    permissions: {
      "Dashboard": { view: true, edit: true, active: true, lock: true },
      "Master Data": { view: true, edit: true, active: true, lock: true },
      "Service Providers": { view: true, edit: true, active: true, lock: true },
      "Users": { view: true, edit: true, active: true, lock: true },
      "Bookings": { view: true, edit: true, active: true, lock: true },
      "Settings": { view: true, edit: true, active: true, lock: true },
    }
  },
  {
    id: "r2",
    name: "Support Agent",
    color: "blue",
    permissions: {
      "Dashboard": { view: true, edit: false, active: false, lock: false },
      "Service Providers": { view: true, edit: true, active: true, lock: false },
      "Users": { view: true, edit: true, active: false, lock: false },
      "Bookings": { view: true, edit: true, active: false, lock: false },
      "Settings": { view: true, edit: false, active: false, lock: false },
    }
  },
  {
    id: "r3",
    name: "Auditor",
    color: "orange",
    permissions: {
      "Dashboard": { view: true, edit: false, active: false, lock: false },
      "Master Data": { view: true, edit: false, active: false, lock: false },
      "Service Providers": { view: true, edit: false, active: false, lock: false },
      "Users": { view: true, edit: false, active: false, lock: false },
      "Bookings": { view: true, edit: false, active: false, lock: false },
      "Settings": { view: true, edit: false, active: false, lock: false },
    }
  }
];

const INITIAL_ADMINS: AdminUser[] = [
  {
    id: "u1",
    name: "Admin User",
    email: "admin@playzoon.com",
    roleId: "r1",
    status: "active",
    lastLogin: new Date().toISOString(),
  },
  {
    id: "u2",
    name: "Sarah Support",
    email: "sarah@playzoon.com",
    roleId: "r2",
    status: "active",
    lastLogin: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "u3",
    name: "John Inactive",
    email: "john@playzoon.com",
    roleId: "r3",
    status: "inactive",
    lastLogin: new Date(Date.now() - 86400000 * 30).toISOString(),
  }
];

export function AdminTeamPage() {
  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [roles, setRoles] = useState<AdminRole[]>(INITIAL_ROLES);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("members");
  
  // Modal States
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);

  // Derived State
  const stats = useMemo(() => ({
    total: admins.length,
    active: admins.filter(a => a.status === "active").length,
    inactive: admins.filter(a => a.status === "inactive").length,
  }), [admins]);

  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => 
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [admins, searchQuery]);

  // Handlers
  const handleSaveAdmin = (adminData: Omit<AdminUser, 'id' | 'lastLogin'>) => {
    if (editingAdmin) {
      setAdmins(prev => prev.map(a => a.id === editingAdmin.id ? { ...a, ...adminData } : a));
      toast.success("Admin updated successfully");
    } else {
      const newAdmin: AdminUser = {
        ...adminData,
        id: Math.random().toString(36).substr(2, 9),
        lastLogin: new Date().toISOString() // In a real app, this would be null until first login
      };
      setAdmins(prev => [...prev, newAdmin]);
      toast.success("Sub-admin created successfully");
    }
    setEditingAdmin(null);
  };

  const handleSaveRole = (role: AdminRole) => {
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? role : r));
      toast.success("Role updated successfully");
    } else {
      setRoles(prev => [...prev, role]);
      toast.success("Role created successfully");
    }
    setEditingRole(null);
  };

  const handleToggleStatus = (admin: AdminUser) => {
    const newStatus: AdminStatus = admin.status === "active" ? "inactive" : "active";
    setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, status: newStatus } : a));
    toast.info(`Admin ${admin.name} is now ${newStatus}`);
  };

  const handleDeleteAdmin = (admin: AdminUser) => {
    if (confirm(`Are you sure you want to delete ${admin.name}?`)) {
      setAdmins(prev => prev.filter(a => a.id !== admin.id));
      toast.success("Admin deleted");
    }
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setIsAddAdminOpen(true);
  };

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Team Management</h1>
        <p className="text-gray-500 mt-2">Manage administrators, roles, and permissions.</p>
      </div>

      <AdminStatsDisplay stats={stats} />

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search admins by name or email..."
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => { setEditingAdmin(null); setIsAddAdminOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </div>

          <AdminTable 
            admins={filteredAdmins} 
            roles={roles}
            onEdit={handleEditAdmin}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteAdmin}
          />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <RolesList 
            roles={roles} 
            onEditRole={(role) => {
              setEditingRole(role);
              setIsRoleModalOpen(true);
            }} 
            onCreateRole={() => {
              setEditingRole(null);
              setIsRoleModalOpen(true);
            }} 
          />
        </TabsContent>
      </Tabs>

      <AddAdminModal
        isOpen={isAddAdminOpen}
        onClose={() => { setIsAddAdminOpen(false); setEditingAdmin(null); }}
        adminToEdit={editingAdmin}
        onSave={handleSaveAdmin}
        roles={roles}
        existingEmails={admins.map(a => a.email)}
      />

      <RoleManagementModal
        isOpen={isRoleModalOpen}
        onClose={() => { setIsRoleModalOpen(false); setEditingRole(null); }}
        roleToEdit={editingRole}
        onSave={handleSaveRole}
      />
    </div>
  );
}
