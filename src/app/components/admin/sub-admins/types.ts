// ─── SCR-ADM-039 / SCR-ADM-040 — Sub-Admin & Role Types ──────────────────────

export type SubAdminStatus = "Active" | "Inactive";

// ─── Permission Matrix (13 modules per US-128 AC#9) ─────────────────────────

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  permissions: string[];
}

export const PERMISSION_MODULES: ModulePermission[] = [
  {
    moduleId: "user-management",
    moduleName: "User Management",
    permissions: ["View", "Edit", "Active/Inactive", "Lock/Unlock"],
  },
  {
    moduleId: "provider-management",
    moduleName: "Provider Management",
    permissions: ["View", "Edit", "Add", "Active/Inactive", "Lock/Unlock", "Approve/Reject"],
  },
  {
    moduleId: "training-facility",
    moduleName: "Training & Facility Management",
    permissions: ["View", "Active/Inactive"],
  },
  {
    moduleId: "bookings-cancellations",
    moduleName: "Bookings & Cancellations",
    permissions: ["View", "Cancel"],
  },
  {
    moduleId: "wallet-payments",
    moduleName: "Wallet, Payments & Payouts",
    permissions: ["View Wallet", "View History", "Approve/Reject Payout", "Manual Adjust"],
  },
  {
    moduleId: "promotions-refresh",
    moduleName: "Promotions & Refresh",
    permissions: ["View", "Edit", "Add", "Delete Pricing"],
  },
  {
    moduleId: "reviews-ratings",
    moduleName: "Reviews & Ratings",
    permissions: ["View", "Hide/Unhide"],
  },
  {
    moduleId: "contact-support",
    moduleName: "Contact Us & Support",
    permissions: ["View", "Reply", "Resolve"],
  },
  {
    moduleId: "cms-notifications",
    moduleName: "CMS & Notifications",
    permissions: ["Banners", "FAQs", "Static Pages", "Manual Notifications", "View/Edit Settings"],
  },
  {
    moduleId: "reports-analytics",
    moduleName: "Reports & Analytics",
    permissions: ["View Dashboard", "View Reports", "Export"],
  },
  {
    moduleId: "country-module",
    moduleName: "Country Module Management",
    permissions: ["View", "Edit"],
  },
  {
    moduleId: "bank-accounts",
    moduleName: "Bank Account Details",
    permissions: ["View", "Approve/Reject"],
  },
  {
    moduleId: "request-facility",
    moduleName: "Request Facility",
    permissions: ["View", "Approve/Reject", "Remove Assigned"],
  },
];

// A role's permission data: module ID -> array of granted permission strings
export type RolePermissions = Record<string, string[]>;

// ─── Role Colour Swatches ───────────────────────────────────────────────────

export interface RoleColour {
  id: string;
  name: string;
  hex: string;
}

export const ROLE_COLOURS: RoleColour[] = [
  { id: "blue", name: "Blue", hex: "#3B82F6" },
  { id: "indigo", name: "Indigo", hex: "#6366F1" },
  { id: "violet", name: "Violet", hex: "#8B5CF6" },
  { id: "pink", name: "Pink", hex: "#EC4899" },
  { id: "red", name: "Red", hex: "#EF4444" },
  { id: "orange", name: "Orange", hex: "#F97316" },
  { id: "amber", name: "Amber", hex: "#F59E0B" },
  { id: "emerald", name: "Emerald", hex: "#10B981" },
  { id: "teal", name: "Teal", hex: "#14B8A6" },
  { id: "cyan", name: "Cyan", hex: "#06B6D4" },
  { id: "slate", name: "Slate", hex: "#64748B" },
  { id: "rose", name: "Rose", hex: "#F43F5E" },
];

// ─── Role Entity ────────────────────────────────────────────────────────────

export type RoleStatus = "Active" | "Inactive";

export interface Role {
  id: string;
  name: string;
  description: string;
  colourId: string;
  colourHex: string;
  permissions: RolePermissions;
  status: RoleStatus;
  subAdminCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Sub-Admin Entity (SCR-ADM-039) ─────────────────────────────────────────

export interface SubAdmin {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  countryCode: string;
  roleId: string;
  roleName: string;
  roleColourHex: string;
  nationality: string;
  country: string;
  status: SubAdminStatus;
  lastLogin?: string;       // ISO datetime (UTC)
  createdAt: string;        // ISO datetime
  mustChangePassword: boolean;
}

// ─── Sub-Admin Form (Create/Edit in drawer) ─────────────────────────────────

export interface SubAdminFormData {
  fullName: string;
  email: string;
  mobile: string;
  countryCode: string;
  roleId: string;
  nationality: string;
  country: string;
  status: SubAdminStatus;
}

export const EMPTY_SUB_ADMIN_FORM: SubAdminFormData = {
  fullName: "",
  email: "",
  mobile: "",
  countryCode: "+966",
  roleId: "",
  nationality: "",
  country: "",
  status: "Active",
};

// ─── Role Form (SCR-ADM-040) ────────────────────────────────────────────────

export interface RoleFormData {
  name: string;
  description: string;
  colourId: string;
  permissions: RolePermissions;
}

export const EMPTY_ROLE_FORM: RoleFormData = {
  name: "",
  description: "",
  colourId: "",
  permissions: {},
};

// ─── Status helpers ─────────────────────────────────────────────────────────

export function statusColor(status: SubAdminStatus | RoleStatus): string {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700";
    case "Inactive":
      return "bg-gray-100 text-gray-500";
  }
}

// ─── Country code options ───────────────────────────────────────────────────

export const COUNTRY_CODE_OPTIONS = [
  { code: "+966", label: "+966 (SA)" },
  { code: "+971", label: "+971 (AE)" },
  { code: "+974", label: "+974 (QA)" },
  { code: "+965", label: "+965 (KW)" },
  { code: "+973", label: "+973 (BH)" },
  { code: "+962", label: "+962 (JO)" },
  { code: "+20", label: "+20 (EG)" },
  { code: "+44", label: "+44 (GB)" },
  { code: "+1", label: "+1 (US)" },
] as const;

// ─── Nationality / Country lists ────────────────────────────────────────────

export const NATIONALITY_OPTIONS = [
  "Saudi",
  "Emirati",
  "Qatari",
  "Kuwaiti",
  "Bahraini",
  "Jordanian",
  "Egyptian",
  "British",
  "American",
  "Indian",
  "Pakistani",
  "Filipino",
] as const;

export const COUNTRY_OPTIONS = [
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Jordan",
  "Egypt",
  "United Kingdom",
  "United States",
] as const;

// ─── Export options ─────────────────────────────────────────────────────────

export const EXPORT_FORMATS = ["PDF", "XLS", "CSV", "TXT", "SQL"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

// ─── Helper: count total permissions in a RolePermissions ───────────────────

export function countPermissions(permissions: RolePermissions): number {
  return Object.values(permissions).reduce((sum, perms) => sum + perms.length, 0);
}

export function totalAvailablePermissions(): number {
  return PERMISSION_MODULES.reduce((sum, m) => sum + m.permissions.length, 0);
}
