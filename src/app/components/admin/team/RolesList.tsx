import { Plus, Edit } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { AdminRole, ModulePermissions } from "./types";
import { RoleBadge } from "./RoleBadge";

interface RolesListProps {
  roles: AdminRole[];
  onEditRole: (role: AdminRole) => void;
  onCreateRole: () => void;
}

export function RolesList({ roles, onEditRole, onCreateRole }: RolesListProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Roles & Permissions</h2>
          <p className="text-gray-500 text-sm">Define what each role can access and modify.</p>
        </div>
        <Button onClick={onCreateRole}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${role.color}-500`} />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <RoleBadge name={role.name} color={role.color} />
                <Button variant="ghost" size="sm" onClick={() => onEditRole(role)}>
                  <Edit className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Access Overview</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(role.permissions).slice(0, 4).map(([module, perms]) => {
                    const count = Object.values(perms).filter(Boolean).length;
                    if (count === 0) return null;
                    return (
                      <span key={module} className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                        {module} ({count})
                      </span>
                    );
                  })}
                  {Object.keys(role.permissions).length > 4 && (
                    <span className="text-xs px-2 py-1 bg-gray-50 rounded text-gray-400">
                      +{Object.keys(role.permissions).length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
