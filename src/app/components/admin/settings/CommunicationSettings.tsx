import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "../../ui/switch";
import { Info, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 pr-4">
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function CommunicationSettings() {
  const [providerAdminChat, setProviderAdminChat] = useState(true);
  const [offlineMessages, setOfflineMessages] = useState(true);
  const [moderationMode, setModerationMode] = useState(false);
  const [rateLimiting, setRateLimiting] = useState(true);
  const [maxMessageLength, setMaxMessageLength] = useState(2000);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Communication settings updated successfully.");
    }, 800);
  };

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Communication Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage chat features, messaging policies, and moderation controls.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 p-6 space-y-2">
        <ToggleRow
          label="Enable Provider ↔ Admin Chat"
          description="Allow providers to send chat messages to platform administrators. When OFF, providers see 'Admin chat is currently disabled'."
          checked={providerAdminChat}
          onChange={setProviderAdminChat}
        />

        <ToggleRow
          label="Enable Offline Messages"
          description="Allow messages to be sent when the recipient is offline. They will receive the message when they next come online."
          checked={offlineMessages}
          onChange={setOfflineMessages}
        />

        <ToggleRow
          label="Chat Moderation Mode"
          description="When enabled, all chat messages are logged and visible to admin in Chat Management for review. No messages are blocked automatically."
          checked={moderationMode}
          onChange={setModerationMode}
        />

        <ToggleRow
          label="Chat Rate Limiting"
          description="Prevent spam by limiting users to 30 messages per minute."
          checked={rateLimiting}
          onChange={setRateLimiting}
        />

        <div className="flex items-center justify-between py-4">
          <div className="flex-1 pr-4">
            <h3 className="text-sm font-medium text-gray-900">
              Max Message Length
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Maximum characters allowed per chat message.
            </p>
          </div>
          <div className="w-32">
            <input
              type="number"
              min={100}
              max={10000}
              value={maxMessageLength}
              onChange={(e) =>
                setMaxMessageLength(parseInt(e.target.value) || 0)
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-4 rounded-md border border-blue-100">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>
          Changes to communication settings take effect immediately for new
          messages.
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Communication Settings"}
        </button>
      </div>
    </div>
  );
}
