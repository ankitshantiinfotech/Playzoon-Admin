import { useState } from "react";
import { Bell, UserCog, Shield, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import { AdminNotificationPreferences } from "./AdminNotificationPreferences";
import { AdminAccountSettings } from "./AdminAccountSettings";

// ─── Tabs ─────────────────────────────────────────────────────

type SettingsTab = "notifications" | "account";

interface Tab {
  id: SettingsTab;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badgeColor: string;
}

const TABS: Tab[] = [
  {
    id:          "notifications",
    label:       "Notification Settings",
    description: "Personal alert preferences across Push, Email, and In-App channels.",
    icon:        Bell,
    color:       "text-blue-600",
    badgeColor:  "bg-blue-600",
  },
  {
    id:          "account",
    label:       "Account Settings",
    description: "Password, email, 2FA, active sessions, and admin profile.",
    icon:        UserCog,
    color:       "text-violet-600",
    badgeColor:  "bg-violet-600",
  },
];

// ─── Main Page ────────────────────────────────────────────────

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications");

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <span>Admin Portal</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">Admin Settings</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal notification preferences and account security for the Playzoon Admin portal.
          </p>
        </div>

        {/* ── Layout: sidebar tabs + content ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Sidebar */}
          <nav className="lg:w-64 shrink-0 w-full">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">My Settings</p>
              </div>
              {/* Tab items */}
              <div className="p-2 space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                      activeTab === tab.id
                        ? "bg-[#003B95] text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      activeTab === tab.id ? "bg-white/20" : "bg-gray-100")}>
                      <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white" : tab.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold truncate", activeTab === tab.id ? "text-white" : "text-gray-800")}>
                        {tab.label}
                      </p>
                      <p className={cn("text-[11px] truncate mt-0.5", activeTab === tab.id ? "text-blue-100" : "text-gray-400")}>
                        {tab.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Help info */}
              <div className="mx-3 mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-semibold text-amber-800">Security Reminder</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      2FA is mandatory. Never share your Admin credentials. Log out of inactive sessions regularly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 w-full min-w-0">
            {activeTab === "notifications" && <AdminNotificationPreferences />}
            {activeTab === "account"       && <AdminAccountSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
