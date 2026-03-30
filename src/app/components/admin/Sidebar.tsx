import {
  LayoutDashboard,
  Database,
  Users,
  Calendar,
  Settings,
  LogOut,
  X,
  Briefcase,
  Building2,
  Dumbbell,
  Trophy,
  Wallet,
  CreditCard,
  MessageSquare,
  Bell,
  BellRing,
  MessageCircle,
  TrendingUp,
  BarChart2,
  RefreshCw,
  FileText,
  UserCog,
  HelpCircle,
  ClipboardList,
  Banknote,
  Radio,
  Percent,
  Globe,
  ImageIcon,
  ShieldOff,
  LayoutList,
  BadgeCheck,
  SlidersHorizontal,
  Activity,
  PieChart,
  Scale,
  GraduationCap,
  Mail,
  BellDot,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { cn } from "../../lib/utils";
import { useAdminAuthStore } from "@/stores/admin-auth.store";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/players", icon: Users, label: "Players" },
  { path: "/providers", icon: Briefcase, label: "Providers" },
  { path: "/coaches", icon: GraduationCap, label: "Coaches" },
  { path: "/facilities", icon: Building2, label: "Facilities" },
  { path: "/trainings", icon: Dumbbell, label: "Trainings" },
  { path: "/listings", icon: LayoutList, label: "Listings" },
  { path: "/bookings", icon: Calendar, label: "Bookings" },
  { path: "/tournaments", icon: Trophy, label: "Tournaments" },
  { path: "/reviews", icon: MessageSquare, label: "Reviews" },
  { path: "/enquiries", icon: HelpCircle, label: "Contact Enquiries" },
  { path: "/master-data", icon: Database, label: "Master Data" },
  { path: "/cms", icon: FileText, label: "CMS" },
  { path: "/promotions", icon: TrendingUp, label: "Promotions" },
  { path: "/commissions", icon: Percent, label: "Commissions" },
  { path: "/wallets", icon: Wallet, label: "Wallets" },
  { path: "/payouts", icon: Banknote, label: "Payouts" },
  { path: "/financial-dashboard", icon: PieChart, label: "Financial Dashboard" },
  { path: "/reconciliation", icon: Scale, label: "Reconciliation" },
  { path: "/bank-verification", icon: BadgeCheck, label: "Bank Verification" },
  { path: "/payments", icon: CreditCard, label: "Payments" },
  { path: "/cancellation-policies", icon: ShieldOff, label: "Cancellation" },
  { path: "/sub-admins", icon: UserCog, label: "Sub-Admins" },
  { path: "/audit-trail", icon: ClipboardList, label: "Audit Trail" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
  { path: "/notification-centre", icon: BellRing, label: "Notification Centre" },
  { path: "/email-templates", icon: Mail, label: "Email Templates" },
  { path: "/notification-settings", icon: BellDot, label: "Notification Settings" },
  { path: "/banners", icon: ImageIcon, label: "App Banners" },
  { path: "/settings", icon: Settings, label: "Platform Settings" },
  { path: "/countries", icon: Globe, label: "Country Management" },
  { path: "/reports", icon: BarChart2, label: "Reports" },
  { path: "/refresh-log", icon: RefreshCw, label: "Refresh Log" },
  { path: "/track-activities", icon: Activity, label: "Track Activities" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/communication", icon: Radio, label: "Comm Settings" },
  { path: "/admin-settings", icon: SlidersHorizontal, label: "My Settings" },
];

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const navigate = useNavigate();
  const logout = useAdminAuthStore((s) => s.logout);
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-30 h-screen w-64 bg-[#1B2A4A] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex-none h-16 flex items-center justify-between px-6 border-b border-white/10">
          <span className="text-xl tracking-tight">Playzoon</span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0 custom-scrollbar">
          <nav className="space-y-0.5 px-3">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors w-full relative",
                    isActive
                      ? "bg-[#003B95]/20 text-white border-l-[3px] border-[#003B95] ml-0 pl-[13px]"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                <item.icon size={18} className="flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer (Sign Out) */}
        <div className="flex-none p-3 border-t border-white/10">
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}