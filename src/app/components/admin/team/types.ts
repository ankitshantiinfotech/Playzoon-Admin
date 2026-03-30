export type AdminStatus = 'active' | 'inactive';

export interface AdminRole {
  id: string;
  name: string;
  color: string; // hex code or tailwind class
  permissions: Record<string, ModulePermissions>;
}

export interface ModulePermissions {
  view: boolean;
  edit: boolean;
  active: boolean; // Can activate/deactivate
  lock: boolean; // Can lock/unlock
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: AdminStatus;
  lastLogin: string; // ISO date string
  avatarUrl?: string;
}

export interface AdminStats {
  total: number;
  active: number;
  inactive: number;
}
