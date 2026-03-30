import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Button } from "../../ui/button";
import { MoreHorizontal, Edit, Lock, Unlock, Trash2 } from "lucide-react";
import { AdminUser, AdminRole } from "./types";
import { Badge } from "../../ui/badge";
import { format } from "date-fns";
import { RoleBadge } from "./RoleBadge";

interface AdminTableProps {
  admins: AdminUser[];
  roles: AdminRole[];
  onEdit: (admin: AdminUser) => void;
  onToggleStatus: (admin: AdminUser) => void;
  onDelete: (admin: AdminUser) => void;
}

export function AdminTable({ admins, roles, onEdit, onToggleStatus, onDelete }: AdminTableProps) {
  const getRole = (roleId: string) => roles.find((r) => r.id === roleId);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No admins found.
              </TableCell>
            </TableRow>
          ) : (
            admins.map((admin) => {
              const role = getRole(admin.roleId);
              return (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <RoleBadge 
                      name={role?.name || "Unknown"} 
                      color={role?.color || "gray"} 
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={admin.status === "active" ? "default" : "secondary"}
                      className={
                        admin.status === "active"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      }
                    >
                      {admin.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {admin.lastLogin ? format(new Date(admin.lastLogin), "PPP p") : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(admin)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(admin)}>
                          {admin.status === "active" ? (
                            <>
                              <Lock className="mr-2 h-4 w-4" /> Deactivate
                            </>
                          ) : (
                            <>
                              <Unlock className="mr-2 h-4 w-4" /> Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(admin)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
