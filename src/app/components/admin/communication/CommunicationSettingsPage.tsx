import type React from "react";
import { toast } from "sonner";
import {
  MessageCircle,
  WifiOff,
  Info,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Send,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Switch } from "../../ui/switch";
import { Badge } from "../../ui/badge";
import { Label } from "../../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { useChatContext } from "./ChatContext";

// ─── Setting Row Component ───────────────────────────────────

function SettingRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  disabledTooltip,
  statusLabel,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  disabledTooltip?: string;
  statusLabel?: { text: string; variant: "on" | "off" };
}) {
  const switchEl = (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "data-[state=checked]:bg-[#003B95]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    />
  );

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-5 rounded-xl border transition-all",
        disabled
          ? "bg-gray-50/80 border-gray-200 opacity-75"
          : "bg-white border-gray-200 hover:border-gray-300",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          checked && !disabled
            ? "bg-[#003B95]/10 text-[#003B95]"
            : "bg-gray-100 text-gray-400",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-[#111827] cursor-default">
            {label}
          </Label>
          {statusLabel && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-5",
                statusLabel.variant === "on"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-500 border-gray-200",
              )}
            >
              {statusLabel.text}
            </Badge>
          )}
        </div>
        <p className="text-xs text-[#6B7280] leading-relaxed">{description}</p>
      </div>

      <div className="shrink-0 pt-1">
        {disabled && disabledTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>{switchEl}</span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              {disabledTooltip}
            </TooltipContent>
          </Tooltip>
        ) : (
          switchEl
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Communication Settings Page
// ═══════════════════════════════════════════════════════════════

export function CommunicationSettingsPage() {
  const {
    chatEnabled,
    setChatEnabled,
    offlineMessagesEnabled,
    setOfflineMessagesEnabled,
    isAdminOnline,
    setIsAdminOnline,
    totalUnread,
  } = useChatContext();

  // ── Handlers ───────────────────────────────────
  const handleChatToggle = (v: boolean) => {
    setChatEnabled(v);
    toast(
      v
        ? "Admin chat with providers enabled"
        : "Admin chat with providers disabled",
      {
        icon: v ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ),
        duration: 3000,
      },
    );
  };

  const handleOfflineToggle = (v: boolean) => {
    setOfflineMessagesEnabled(v);
    toast(v ? "Offline messages enabled" : "Offline messages disabled", {
      icon: v ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <Info className="h-4 w-4 text-blue-500" />
      ),
      duration: 3000,
    });
  };

  const handleOnlineToggle = (v: boolean) => {
    setIsAdminOnline(v);
    toast(v ? "Admin status set to Online" : "Admin status set to Offline", {
      icon: v ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-gray-500" />
      ),
      duration: 3000,
    });
  };

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* ── Page Header ─────────────────────────────── */}
      <div>
        <h1 className="text-2xl text-[#111827] tracking-tight">
          Communication Settings
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Manage admin-to-provider chat features and messaging availability.
        </p>
      </div>

      {/* ── Chat Settings Card ────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5" />
          Chat Configuration
        </h2>

        {/* Admin Chat Toggle */}
        <SettingRow
          icon={MessageCircle}
          label="Admin Chat with Providers"
          description="When enabled, the 'Open Chat' action button appears on all provider listings and allows real-time messaging between admin and providers."
          checked={chatEnabled}
          onCheckedChange={handleChatToggle}
          statusLabel={{
            text: chatEnabled ? "Enabled" : "Disabled",
            variant: chatEnabled ? "on" : "off",
          }}
        />

        {/* Offline Messages Toggle */}
        <SettingRow
          icon={WifiOff}
          label="Allow Offline Messages"
          description="When enabled, providers can leave messages even when the admin is offline. Messages will be queued and delivered when admin comes back online."
          checked={offlineMessagesEnabled}
          onCheckedChange={handleOfflineToggle}
          disabled={!chatEnabled}
          disabledTooltip="Enable Admin Chat first"
          statusLabel={{
            text: !chatEnabled
              ? "Requires Chat"
              : offlineMessagesEnabled
                ? "On"
                : "Off",
            variant: offlineMessagesEnabled && chatEnabled ? "on" : "off",
          }}
        />
      </div>

      {/* ── Admin Status Card ─────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5" />
          Admin Status
        </h2>

        <SettingRow
          icon={Monitor}
          label="Online Status"
          description="Toggle your online/offline status. When offline, providers will see a grey indicator. If 'Allow Offline Messages' is disabled, providers won't be able to send messages."
          checked={isAdminOnline}
          onCheckedChange={handleOnlineToggle}
          statusLabel={{
            text: isAdminOnline ? "Online" : "Offline",
            variant: isAdminOnline ? "on" : "off",
          }}
        />
      </div>

      {/* ── Status Summary Card ───────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50/50">
          <h2 className="text-sm text-[#111827] flex items-center gap-2">
            <Info className="h-4 w-4 text-[#003B95]" />
            Current Status Summary
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Chat Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  chatEnabled ? "bg-emerald-500" : "bg-gray-300",
                )}
              />
              <div>
                <p className="text-xs text-[#6B7280]">Chat</p>
                <p className="text-sm text-[#111827]">
                  {chatEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>

            {/* Offline Messages */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  chatEnabled && offlineMessagesEnabled
                    ? "bg-emerald-500"
                    : "bg-gray-300",
                )}
              />
              <div>
                <p className="text-xs text-[#6B7280]">Offline Messages</p>
                <p className="text-sm text-[#111827]">
                  {!chatEnabled
                    ? "N/A"
                    : offlineMessagesEnabled
                      ? "Allowed"
                      : "Blocked"}
                </p>
              </div>
            </div>

            {/* Admin Online */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  isAdminOnline ? "bg-emerald-500" : "bg-gray-300",
                )}
              />
              <div>
                <p className="text-xs text-[#6B7280]">Admin Status</p>
                <p className="text-sm text-[#111827]">
                  {isAdminOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </div>

          {/* Unread count */}
          {totalUnread > 0 && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
              <MessageCircle className="h-4 w-4 text-[#003B95]" />
              <p className="text-xs text-[#003B95]">
                You have <span className="font-medium">{totalUnread}</span>{" "}
                unread message{totalUnread !== 1 ? "s" : ""} from providers
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Provider-Side Preview ─────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          Provider-Side Preview
        </h2>

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50/50">
            <p className="text-xs text-[#6B7280]">
              This is what providers see in their chat interface based on
              current settings:
            </p>
          </div>
          <div className="p-5">
            {!chatEnabled ? (
              /* Chat completely disabled */
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-100 border border-gray-200">
                <MessageCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Chat is unavailable</p>
                  <p className="text-xs text-gray-400">
                    The admin has disabled the chat feature. Please try again
                    later.
                  </p>
                </div>
              </div>
            ) : !isAdminOnline && !offlineMessagesEnabled ? (
              /* Admin offline + no offline messages */
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm text-amber-700">
                      Admin is currently offline. Messaging is unavailable.
                    </p>
                    <p className="text-xs text-amber-500 mt-0.5">
                      Please try again when the admin is online.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-100/80 rounded-lg z-10 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Input disabled</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-50 p-2">
                    <div className="flex-1 h-10 px-3 rounded-lg border bg-gray-50 flex items-center text-sm text-gray-400">
                      Type a message...
                    </div>
                    <div className="h-10 w-9 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Send className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat available */
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm text-emerald-700">
                    Chat is available
                    {!isAdminOnline && " (offline messages allowed)"}
                  </p>
                  <p className="text-xs text-emerald-500 mt-0.5">
                    {isAdminOnline
                      ? "Providers can send and receive messages in real-time."
                      : "Providers can leave messages that will be delivered when admin comes online."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
