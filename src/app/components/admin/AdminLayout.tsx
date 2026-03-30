import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Menu, Shield } from "lucide-react";
import { ChatProvider } from "./communication/ChatContext";
import { ChatPanel } from "./communication/ChatPanel";
import { NotificationProvider } from "./notification-centre/NotificationContext";
import { NotificationBell } from "./notification-centre/NotificationBell";

export function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NotificationProvider>
      <ChatProvider>
        <div className="flex h-screen bg-[#F9FAFB] text-[#111827] overflow-hidden">
          <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

          <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">

            {/* ── Top header bar (all screen sizes) ── */}
            <header className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 lg:px-6 shrink-0">
              {/* Left — mobile hamburger + logo */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <Menu size={20} />
                </button>
                <span className="lg:hidden text-lg tracking-tight text-[#111827] font-semibold">
                  Playzoon Admin
                </span>
                {/* Desktop: subtle breadcrumb placeholder */}
                <span className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400">
                  <Shield className="w-3.5 h-3.5 text-[#003B95]" />
                  Admin Portal
                </span>
              </div>

              {/* Right — notification bell + admin chip */}
              <div className="flex items-center gap-2">
                {/* BR-130-05: live badge via context */}
                <NotificationBell />

                {/* Admin identity chip */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 ml-1">
                  <div className="w-7 h-7 rounded-full bg-[#003B95] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    SA
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold text-gray-800 leading-none">Super Admin</p>
                    <p className="text-[10px] text-gray-400 leading-none mt-0.5">admin@playzoon.com</p>
                  </div>
                </div>
              </div>
            </header>

            {/* ── Page content ── */}
            <div className="flex-1 overflow-auto min-w-0">
              <Outlet />
            </div>
          </main>

          {/* Global Chat Panel */}
          <ChatPanel />
        </div>
      </ChatProvider>
    </NotificationProvider>
  );
}
