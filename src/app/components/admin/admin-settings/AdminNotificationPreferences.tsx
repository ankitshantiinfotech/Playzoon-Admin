import { useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Save,
  Lock,
  Info,
  ShieldAlert,
  Banknote,
  BookOpen,
  FileText,
  HeadphonesIcon,
  Users,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";

// ─── Types ───────────────────────────────────────────────────

type Channel = "push" | "email" | "inApp";

interface NotifEvent {
  id: string;
  name: string;
  description: string;
  push: boolean;
  email: boolean;
  inApp: boolean;
  /** All channels forced ON — BR-127-01 (System Error) */
  allForced?: boolean;
  /** In-App forced ON — BR-127-02 (Financial Events) */
  inAppForced?: boolean;
}

interface NotifGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  events: NotifEvent[];
}

// ─── Initial data ────────────────────────────────────────────

const INITIAL_GROUPS: NotifGroup[] = [
  {
    id: "provider",
    label: "Provider Events",
    icon: Users,
    color: "text-violet-600 bg-violet-50",
    events: [
      {
        id: "new_provider_registration",
        name: "New Provider Registration Pending Approval",
        description:
          "A new provider has submitted their registration and is awaiting Admin approval.",
        push: true,
        email: true,
        inApp: true,
      },
      {
        id: "provider_account_suspended",
        name: "Provider Account Suspended",
        description:
          "A provider account has been suspended by the system or another Admin.",
        push: true,
        email: true,
        inApp: true,
      },
      {
        id: "provider_bank_submitted",
        name: "Provider Bank Account Submitted for Verification",
        description:
          "A provider has submitted new bank account details requiring Admin verification.",
        push: true,
        email: false,
        inApp: true,
      },
    ],
  },
  {
    id: "booking",
    label: "Booking Events",
    icon: BookOpen,
    color: "text-blue-600 bg-blue-50",
    events: [
      {
        id: "booking_dispute_flagged",
        name: "Booking Dispute Flagged",
        description:
          "A booking has been flagged as disputed by a player or provider.",
        push: true,
        email: true,
        inApp: true,
      },
      {
        id: "unusual_booking_activity",
        name: "Unusual Booking Activity Detected",
        description:
          "The fraud detection system has flagged unusual booking patterns.",
        push: true,
        email: true,
        inApp: true,
      },
    ],
  },
  {
    id: "financial",
    label: "Financial Events",
    icon: Banknote,
    color: "text-emerald-600 bg-emerald-50",
    events: [
      {
        id: "high_value_payout",
        name: "High-Value Payout Request",
        description:
          "A payout request exceeding the threshold amount has been submitted.",
        push: true,
        email: true,
        inApp: true,
        inAppForced: true,
      },
      {
        id: "payout_batch_failed",
        name: "Payout Batch Failed",
        description: "A scheduled payout batch has failed to process.",
        push: true,
        email: true,
        inApp: true,
        inAppForced: true,
      },
    ],
  },
  {
    id: "content",
    label: "Content Events",
    icon: FileText,
    color: "text-amber-600 bg-amber-50",
    events: [
      {
        id: "new_promoted_listing",
        name: "New Promoted Listing Request",
        description: "A provider has requested a promoted / featured listing.",
        push: false,
        email: true,
        inApp: true,
      },
      {
        id: "new_review_flagged",
        name: "New Review Flagged",
        description: "A submitted review has been flagged for moderation.",
        push: true,
        email: false,
        inApp: true,
      },
      {
        id: "cms_update_required",
        name: "New CMS Update Required",
        description:
          "A CMS content item is awaiting Admin review or publication.",
        push: false,
        email: true,
        inApp: false,
      },
    ],
  },
  {
    id: "support",
    label: "Support Events",
    icon: HeadphonesIcon,
    color: "text-sky-600 bg-sky-50",
    events: [
      {
        id: "new_enquiry_received",
        name: "New Contact Us Enquiry Received",
        description:
          "A new enquiry has been submitted via the Contact Us form.",
        push: true,
        email: true,
        inApp: true,
      },
      {
        id: "enquiry_escalated",
        name: "Enquiry Escalated to Me",
        description:
          "An enquiry has been escalated and assigned to your account.",
        push: true,
        email: true,
        inApp: true,
      },
    ],
  },
  {
    id: "system",
    label: "System Events",
    icon: ShieldAlert,
    color: "text-red-600 bg-red-50",
    events: [
      {
        id: "system_error_critical",
        name: "System Error / Critical Alert",
        description:
          "Server errors, database failures, security incidents. Cannot be disabled (BR-127-01).",
        push: true,
        email: true,
        inApp: true,
        allForced: true,
      },
      {
        id: "platform_maintenance",
        name: "Platform Maintenance Scheduled",
        description:
          "An upcoming maintenance window has been scheduled for the platform.",
        push: true,
        email: true,
        inApp: false,
      },
    ],
  },
  {
    id: "subadmin",
    label: "Sub-Admin Events",
    icon: Users,
    color: "text-purple-600 bg-purple-50",
    events: [
      {
        id: "sub_admin_created",
        name: "Sub-Admin Account Created",
        description:
          "A new Sub-Admin account has been created on the platform.",
        push: false,
        email: true,
        inApp: true,
      },
      {
        id: "sub_admin_modified",
        name: "Sub-Admin Account Modified",
        description:
          "A Sub-Admin account has been modified (role, permissions).",
        push: false,
        email: true,
        inApp: true,
      },
      {
        id: "sub_admin_deleted",
        name: "Sub-Admin Account Deleted",
        description: "A Sub-Admin account has been removed from the platform.",
        push: true,
        email: true,
        inApp: true,
      },
    ],
  },
];

// ─── Channel Header ──────────────────────────────────────────

function ChannelHeader({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center",
          color,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

// ─── Locked Toggle ────────────────────────────────────────────

function LockedToggle({ reason }: { reason: string }) {
  return (
    <div className="relative group inline-flex">
      <Switch
        checked
        disabled
        className="data-[state=checked]:bg-gray-300 opacity-60 cursor-not-allowed"
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-52">
        <div className="bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 text-center shadow-lg">
          <Lock className="w-3 h-3 mx-auto mb-1 text-gray-400" />
          {reason}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────

export function AdminNotificationPreferences() {
  const [groups, setGroups] = useState<NotifGroup[]>(INITIAL_GROUPS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleEvent = (groupId: string, eventId: string, channel: Channel) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          events: g.events.map((e) => {
            if (e.id !== eventId) return e;
            // BR-127-01: System error — all locked
            if (e.allForced) return e;
            // BR-127-02: Financial inApp — locked
            if (channel === "inApp" && e.inAppForced) return e;
            return { ...e, [channel]: !e[channel] };
          }),
        };
      }),
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setHasChanges(false);
    toast.success("Notification preferences saved successfully.");
  };

  const handleReset = () => {
    setGroups(INITIAL_GROUPS);
    setHasChanges(false);
    toast.info("Preferences reset to defaults.");
  };

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            My Notification Preferences
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Control which events trigger notifications for your Admin account,
            and via which channels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-500"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2 bg-[#003B95] hover:bg-[#002a6b]"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <span className="font-medium text-gray-700">Channel key:</span>
        <span className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-blue-500" /> Push Notification
        </span>
        <span className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-emerald-500" /> Email
        </span>
        <span className="flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-violet-500" /> In-App
        </span>
        <span className="flex items-center gap-1.5 ml-auto">
          <Lock className="w-3.5 h-3.5 text-gray-400" /> Cannot be disabled
        </span>
      </div>

      {/* Groups */}
      <div className="space-y-5">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            {/* Group header */}
            <div
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 bg-gray-50/60",
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  group.color,
                )}
              >
                <group.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {group.label}
              </span>
              <span className="text-xs text-gray-400 ml-1">
                ({group.events.length} event
                {group.events.length !== 1 ? "s" : ""})
              </span>
            </div>

            {/* Events table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide w-full">
                      Event
                    </th>
                    <th className="px-5 py-2.5 w-20">
                      <ChannelHeader
                        icon={Smartphone}
                        label="Push"
                        color="bg-blue-50 text-blue-500"
                      />
                    </th>
                    <th className="px-5 py-2.5 w-20">
                      <ChannelHeader
                        icon={Mail}
                        label="Email"
                        color="bg-emerald-50 text-emerald-500"
                      />
                    </th>
                    <th className="px-5 py-2.5 w-20">
                      <ChannelHeader
                        icon={Monitor}
                        label="In-App"
                        color="bg-violet-50 text-violet-500"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {group.events.map((event) => (
                    <tr
                      key={event.id}
                      className={cn(
                        "hover:bg-gray-50/40 transition-colors",
                        event.allForced && "bg-red-50/20",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {event.allForced && (
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          )}
                          {event.inAppForced && !event.allForced && (
                            <Lock className="w-3 h-3 text-amber-400 shrink-0 mt-1" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {event.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {event.description}
                            </p>
                            {event.allForced && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded mt-1">
                                <Lock className="w-2.5 h-2.5" /> Cannot be
                                disabled — BR-127-01
                              </span>
                            )}
                            {event.inAppForced && !event.allForced && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded mt-1">
                                <Lock className="w-2.5 h-2.5" /> In-App always
                                ON — BR-127-02
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Push */}
                      <td className="px-5 py-3 text-center">
                        {event.allForced ? (
                          <LockedToggle reason="Critical system alerts cannot be disabled" />
                        ) : (
                          <Switch
                            checked={event.push}
                            onCheckedChange={() =>
                              toggleEvent(group.id, event.id, "push")
                            }
                            className="data-[state=checked]:bg-[#003B95]"
                          />
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3 text-center">
                        {event.allForced ? (
                          <LockedToggle reason="Critical system alerts cannot be disabled" />
                        ) : (
                          <Switch
                            checked={event.email}
                            onCheckedChange={() =>
                              toggleEvent(group.id, event.id, "email")
                            }
                            className="data-[state=checked]:bg-[#003B95]"
                          />
                        )}
                      </td>

                      {/* In-App */}
                      <td className="px-5 py-3 text-center">
                        {event.allForced ? (
                          <LockedToggle reason="Critical system alerts cannot be disabled" />
                        ) : event.inAppForced ? (
                          <LockedToggle reason="Financial alerts In-App cannot be disabled — BR-127-02" />
                        ) : (
                          <Switch
                            checked={event.inApp}
                            onCheckedChange={() =>
                              toggleEvent(group.id, event.id, "inApp")
                            }
                            className="data-[state=checked]:bg-[#003B95]"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save bar */}
      {hasChanges && (
        <div className="sticky bottom-0 flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-lg">
          <p className="text-sm text-amber-700 flex items-center gap-2">
            <Info className="w-4 h-4" /> You have unsaved notification
            preference changes.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Discard
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-[#003B95] hover:bg-[#002a6b]"
            >
              <Save className="w-4 h-4" /> Save Preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
