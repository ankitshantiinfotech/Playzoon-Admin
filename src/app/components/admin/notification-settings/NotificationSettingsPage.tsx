// ─── SCR-ADM-046: Notification Settings Configuration ────────────────────────
// Configure default notification channel settings for every system-triggered
// event type. Per-event toggles for Push, Email, In-App channels.
// Global master toggle. Category accordion sections. Inline content editor.
// Batch save with unsaved-changes tracking.

import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  ChevronRight,
  ChevronDown,
  Save,
  Pencil,
  X,
  Loader2,
  AlertTriangle,
  Info,
  Mail,
  Smartphone,
  MessageSquare,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Switch } from "../../ui/switch";
import { Checkbox } from "../../ui/checkbox";
import {
  Card,
  CardContent,
} from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";
import type {
  NotificationEvent,
  NotificationCategory,
  ChannelToggles,
  EventContent,
} from "./types";
import {
  MOCK_NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES,
  CATEGORY_BADGE_COLORS,
} from "./types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ModifiedState {
  channels: Record<string, ChannelToggles>;
  content: Record<string, EventContent>;
}

// ─── Channel Icons ──────────────────────────────────────────────────────────

const CHANNEL_CONFIG = [
  { key: "push" as const, label: "Push", icon: Smartphone },
  { key: "email" as const, label: "Email", icon: Mail },
  { key: "inApp" as const, label: "In-App", icon: MessageSquare },
];

// ─── Category Event Count ───────────────────────────────────────────────────

function getCategoryEvents(
  events: NotificationEvent[],
  category: NotificationCategory
): NotificationEvent[] {
  return events.filter((e) => e.category === category);
}

// ─── Skeleton Loader ────────────────────────────────────────────────────────

function CategorySkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1" />
          <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export function NotificationSettingsPage() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<NotificationEvent[]>(MOCK_NOTIFICATION_EVENTS);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<NotificationCategory>>(
    new Set(["Player"])
  );
  const [expandedContentEditors, setExpandedContentEditors] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading] = useState(false);

  // Track modifications (channel changes + content changes)
  const [modifiedChannels, setModifiedChannels] = useState<Record<string, ChannelToggles>>({});
  const [modifiedContent, setModifiedContent] = useState<Record<string, EventContent>>({});

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // ─── Computed ─────────────────────────────────────────────────────────────

  const hasChanges = useMemo(
    () => Object.keys(modifiedChannels).length > 0 || Object.keys(modifiedContent).length > 0,
    [modifiedChannels, modifiedContent]
  );

  const changeCount = useMemo(
    () => new Set([...Object.keys(modifiedChannels), ...Object.keys(modifiedContent)]).size,
    [modifiedChannels, modifiedContent]
  );

  // Get the current effective channel values (original + overrides)
  const getEffectiveChannels = useCallback(
    (eventId: string): ChannelToggles => {
      if (modifiedChannels[eventId]) return modifiedChannels[eventId];
      const event = events.find((e) => e.id === eventId);
      return event?.channels ?? { push: false, email: false, inApp: false };
    },
    [events, modifiedChannels]
  );

  const getEffectiveContent = useCallback(
    (eventId: string): EventContent => {
      if (modifiedContent[eventId]) return modifiedContent[eventId];
      const event = events.find((e) => e.id === eventId);
      return event?.content ?? { titleEN: "", titleAR: "", descriptionEN: "", descriptionAR: "" };
    },
    [events, modifiedContent]
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const toggleCategory = useCallback((category: NotificationCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const toggleContentEditor = useCallback((eventId: string) => {
    setExpandedContentEditors((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }, []);

  const handleGlobalToggle = useCallback(
    (value: boolean) => {
      if (!value) {
        // Turning OFF requires confirmation
        setConfirmDialog({
          open: true,
          title: "Disable All Notifications?",
          description:
            "Disabling all notifications will suppress all system-triggered messages to all users. Are you sure?",
          onConfirm: () => {
            setGlobalEnabled(false);
            setConfirmDialog((p) => ({ ...p, open: false }));
          },
        });
      } else {
        setGlobalEnabled(true);
      }
    },
    []
  );

  const handleChannelToggle = useCallback(
    (eventId: string, channel: keyof ChannelToggles) => {
      const current = getEffectiveChannels(eventId);
      const updated = { ...current, [channel]: !current[channel] };

      // Check if updated matches original
      const original = events.find((e) => e.id === eventId)?.channels;
      if (
        original &&
        updated.push === original.push &&
        updated.email === original.email &&
        updated.inApp === original.inApp
      ) {
        // Revert to original — remove from modified
        setModifiedChannels((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
      } else {
        setModifiedChannels((prev) => ({ ...prev, [eventId]: updated }));
      }
    },
    [events, getEffectiveChannels]
  );

  const handleSelectAll = useCallback(
    (category: NotificationCategory, channel: keyof ChannelToggles, checked: boolean) => {
      const categoryEvents = getCategoryEvents(events, category);
      const updates: Record<string, ChannelToggles> = {};

      for (const evt of categoryEvents) {
        const current = getEffectiveChannels(evt.id);
        const updated = { ...current, [channel]: checked };

        const original = evt.channels;
        if (
          updated.push === original.push &&
          updated.email === original.email &&
          updated.inApp === original.inApp
        ) {
          // Back to original — remove from modified
          updates[evt.id] = updated; // We'll handle removal below
        } else {
          updates[evt.id] = updated;
        }
      }

      setModifiedChannels((prev) => {
        const next = { ...prev };
        for (const evt of categoryEvents) {
          const updated = updates[evt.id];
          const original = evt.channels;
          if (
            updated.push === original.push &&
            updated.email === original.email &&
            updated.inApp === original.inApp
          ) {
            delete next[evt.id];
          } else {
            next[evt.id] = updated;
          }
        }
        return next;
      });
    },
    [events, getEffectiveChannels]
  );

  const handleContentChange = useCallback(
    (eventId: string, field: keyof EventContent, value: string) => {
      const current = getEffectiveContent(eventId);
      const updated = { ...current, [field]: value };

      // Check if matches original
      const original = events.find((e) => e.id === eventId)?.content;
      if (
        original &&
        updated.titleEN === original.titleEN &&
        updated.titleAR === original.titleAR &&
        updated.descriptionEN === original.descriptionEN &&
        updated.descriptionAR === original.descriptionAR
      ) {
        setModifiedContent((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
      } else {
        setModifiedContent((prev) => ({ ...prev, [eventId]: updated }));
      }
    },
    [events, getEffectiveContent]
  );

  const handleSaveAll = useCallback(() => {
    // Validate modified content
    for (const [eventId, content] of Object.entries(modifiedContent)) {
      const evt = events.find((e) => e.id === eventId);
      if (!evt) continue;

      if (!content.titleEN.trim()) {
        toast.error(`English title is required for ${evt.name}.`);
        return;
      }
      if (content.titleEN.length > 200) {
        toast.error(`English title for ${evt.name} must not exceed 200 characters.`);
        return;
      }
      if (!content.titleAR.trim()) {
        toast.error(`Arabic title is required for ${evt.name}.`);
        return;
      }
      if (content.titleAR.length > 200) {
        toast.error(`Arabic title for ${evt.name} must not exceed 200 characters.`);
        return;
      }
      if (content.descriptionEN.length > 500) {
        toast.error(`English description for ${evt.name} must not exceed 500 characters.`);
        return;
      }
      if (content.descriptionAR.length > 500) {
        toast.error(`Arabic description for ${evt.name} must not exceed 500 characters.`);
        return;
      }
    }

    setIsSaving(true);
    setTimeout(() => {
      // Apply all changes
      setEvents((prev) =>
        prev.map((evt) => {
          let updated = evt;
          if (modifiedChannels[evt.id]) {
            updated = { ...updated, channels: modifiedChannels[evt.id] };
          }
          if (modifiedContent[evt.id]) {
            updated = { ...updated, content: modifiedContent[evt.id] };
          }
          return updated;
        })
      );
      setModifiedChannels({});
      setModifiedContent({});
      setIsSaving(false);
      toast.success("Notification settings saved successfully.");
    }, 1000);
  }, [events, modifiedChannels, modifiedContent]);

  const handleLoadDefaults = useCallback(() => {
    // Per US-138 AC#7: recommended defaults
    const updates: Record<string, ChannelToggles> = {};

    for (const evt of events) {
      let defaults: ChannelToggles;

      // Critical events: Push + Email + In-App ON
      if (
        evt.name.includes("Payment") ||
        evt.name.includes("Booking Confirmation") ||
        evt.name.includes("Payout") ||
        evt.name.includes("Refund") ||
        evt.name.includes("Receipt") ||
        evt.name.includes("Alert") ||
        evt.name.includes("Security") ||
        evt.name.includes("Suspended") ||
        evt.name.includes("Password Reset") ||
        evt.name.includes("Verification") ||
        evt.name.includes("Registration Approved") ||
        evt.name.includes("Registration Rejected")
      ) {
        defaults = { push: true, email: true, inApp: true };
      }
      // Social events: Push + In-App ON, Email OFF
      else if (
        evt.name.includes("Friend") ||
        evt.name.includes("Message") ||
        evt.name.includes("Chat") ||
        evt.name.includes("Review")
      ) {
        defaults = { push: true, email: false, inApp: true };
      }
      // Promotional events: In-App only
      else if (
        evt.name.includes("Promotion") ||
        evt.name.includes("Favourite")
      ) {
        defaults = { push: false, email: false, inApp: true };
      }
      // Everything else: Push + In-App
      else {
        defaults = { push: true, email: false, inApp: true };
      }

      if (
        defaults.push !== evt.channels.push ||
        defaults.email !== evt.channels.email ||
        defaults.inApp !== evt.channels.inApp
      ) {
        updates[evt.id] = defaults;
      }
    }

    setModifiedChannels((prev) => ({ ...prev, ...updates }));
    toast.success("Recommended defaults loaded. Click 'Save All Changes' to apply.");
  }, [events]);

  // ─── Select-All State Computation ─────────────────────────────────────────

  const getSelectAllState = useCallback(
    (category: NotificationCategory, channel: keyof ChannelToggles): "all" | "none" | "indeterminate" => {
      const categoryEvents = getCategoryEvents(events, category);
      let onCount = 0;
      for (const evt of categoryEvents) {
        if (getEffectiveChannels(evt.id)[channel]) onCount++;
      }
      if (onCount === 0) return "none";
      if (onCount === categoryEvents.length) return "all";
      return "indeterminate";
    },
    [events, getEffectiveChannels]
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
            <span>Admin Portal</span>
            <ChevronRight className="w-3 h-3" />
            <span>CMS &amp; Notifications</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">Notification Settings</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Notification Settings
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Configure default notification channels for all system-triggered events.
            Individual users can override these defaults in their personal preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
              {changeCount} unsaved {changeCount === 1 ? "change" : "changes"}
            </Badge>
          )}
          <Button
            onClick={handleSaveAll}
            disabled={isSaving || !hasChanges}
            className="gap-1.5 bg-[#003B95] hover:bg-[#002d73]"
            aria-label="Save all notification settings"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Global Controls Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                globalEnabled
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-red-100 text-red-500"
              )}
            >
              {globalEnabled ? (
                <Bell className="h-5 w-5" />
              ) : (
                <BellOff className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-semibold text-[#111827]">
                    Enable All Notifications
                  </Label>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5",
                      globalEnabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    )}
                  >
                    {globalEnabled ? "ON" : "OFF"}
                  </Badge>
                </div>
                <Switch
                  checked={globalEnabled}
                  onCheckedChange={handleGlobalToggle}
                  aria-label="Enable all notifications"
                  className={cn(
                    globalEnabled
                      ? "data-[state=checked]:bg-emerald-500"
                      : "data-[state=unchecked]:bg-red-400"
                  )}
                />
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                These settings control the default notification channels for all users.
                Individual users can override these defaults in their personal notification preferences.
              </p>
              <p className="text-[11px] text-[#6B7280] italic">
                Per platform policy: if channels are not configured for an event, all default to OFF for users.
              </p>
            </div>
          </div>

          {/* Global OFF Warning Banner */}
          {!globalEnabled && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                All system notifications are currently disabled globally.
              </p>
            </div>
          )}

          {/* Load Recommended Defaults */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadDefaults}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Load Recommended Defaults
            </Button>
            <span className="ml-2 text-[11px] text-gray-400">
              Pre-fills channels based on event criticality
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Category Accordion Sections */}
      {NOTIFICATION_CATEGORIES.map((category) => {
        const categoryEvents = getCategoryEvents(events, category);
        const isExpanded = expandedCategories.has(category);
        const badgeColors = CATEGORY_BADGE_COLORS[category];

        return (
          <Card key={category} className="border shadow-sm overflow-hidden">
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50/60 transition-colors"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-[#111827]">
                  {category} Notifications
                </h2>
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", badgeColors.bg, badgeColors.text)}
                >
                  {categoryEvents.length} events
                </Badge>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-500 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t">
                {isLoading ? (
                  <CategorySkeleton />
                ) : (
                  <>
                    {/* Select-All Header Row */}
                    <div className="flex items-center gap-4 px-5 py-3 bg-gray-50/80 border-b text-xs">
                      <div className="flex-1 font-medium text-gray-500 uppercase tracking-wide">
                        Event Name
                      </div>
                      {CHANNEL_CONFIG.map((ch) => {
                        const state = getSelectAllState(category, ch.key);
                        return (
                          <div key={ch.key} className="w-[72px] flex flex-col items-center gap-1">
                            <span className="text-gray-500 font-medium">All {ch.label}</span>
                            <Checkbox
                              checked={state === "all" ? true : state === "indeterminate" ? "indeterminate" : false}
                              onCheckedChange={(checked) =>
                                handleSelectAll(category, ch.key, !!checked)
                              }
                              disabled={!globalEnabled}
                              aria-label={`Enable all ${ch.label} notifications for ${category}`}
                              className={cn(
                                "data-[state=checked]:bg-[#003B95] data-[state=checked]:border-[#003B95]",
                                !globalEnabled && "opacity-50"
                              )}
                            />
                          </div>
                        );
                      })}
                      <div className="w-[100px]" />
                    </div>

                    {/* Event Rows */}
                    {categoryEvents.map((evt) => {
                      const channels = getEffectiveChannels(evt.id);
                      const content = getEffectiveContent(evt.id);
                      const isModified =
                        !!modifiedChannels[evt.id] || !!modifiedContent[evt.id];
                      const isContentOpen = expandedContentEditors.has(evt.id);
                      const emailNoTemplate =
                        channels.email && !evt.hasEmailTemplate;

                      return (
                        <div key={evt.id}>
                          <div
                            className={cn(
                              "flex items-center gap-4 px-5 py-3 border-b transition-colors",
                              isModified && "border-l-4 border-l-amber-400 bg-amber-50/30",
                              !isModified && "border-l-4 border-l-transparent"
                            )}
                          >
                            {/* Event Name */}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-[#111827] font-medium">
                                {evt.name}
                              </span>
                            </div>

                            {/* Channel Toggles */}
                            {CHANNEL_CONFIG.map((ch) => (
                              <div key={ch.key} className="w-[72px] flex justify-center">
                                <div className="flex items-center gap-1">
                                  {ch.key === "email" && emailNoTemplate && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs text-xs">
                                        Email template not configured for this event.
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {globalEnabled ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={channels[ch.key]}
                                            onCheckedChange={() =>
                                              handleChannelToggle(evt.id, ch.key)
                                            }
                                            aria-label={`${ch.label} notification for ${evt.name}`}
                                            className="data-[state=checked]:bg-[#003B95] scale-90"
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs">
                                        {ch.label}: {channels[ch.key] ? "ON" : "OFF"}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={channels[ch.key]}
                                            disabled
                                            aria-label={`${ch.label} notification for ${evt.name}`}
                                            aria-disabled="true"
                                            className="opacity-50 cursor-not-allowed scale-90"
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs">
                                        Global notifications are disabled.
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Edit Content Button */}
                            <div className="w-[100px] flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "gap-1 text-xs h-7",
                                  isContentOpen && "bg-gray-100"
                                )}
                                onClick={() => toggleContentEditor(evt.id)}
                                aria-expanded={isContentOpen}
                                aria-label={`Edit content for ${evt.name}`}
                              >
                                {isContentOpen ? (
                                  <>
                                    <X className="h-3 w-3" />
                                    Close
                                  </>
                                ) : (
                                  <>
                                    <Pencil className="h-3 w-3" />
                                    Edit Content
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Content Editor Inline Panel */}
                          {isContentOpen && (
                            <div
                              className={cn(
                                "px-5 py-4 bg-gray-50/60 border-b space-y-4",
                                isModified && "border-l-4 border-l-amber-400"
                              )}
                            >
                              <div className="grid grid-cols-2 gap-4">
                                {/* Title EN */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Title (EN)
                                  </Label>
                                  <Input
                                    placeholder="Enter notification title in English"
                                    value={content.titleEN}
                                    onChange={(e) =>
                                      handleContentChange(evt.id, "titleEN", e.target.value)
                                    }
                                    maxLength={200}
                                    className="h-8 text-sm bg-white"
                                    aria-required="true"
                                  />
                                  <span className="text-[10px] text-gray-400">
                                    {content.titleEN.length}/200
                                  </span>
                                </div>

                                {/* Title AR */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Title (AR)
                                  </Label>
                                  <Input
                                    placeholder="Enter notification title in Arabic"
                                    value={content.titleAR}
                                    onChange={(e) =>
                                      handleContentChange(evt.id, "titleAR", e.target.value)
                                    }
                                    maxLength={200}
                                    dir="rtl"
                                    lang="ar"
                                    className="h-8 text-sm bg-white"
                                    aria-required="true"
                                  />
                                  <span className="text-[10px] text-gray-400">
                                    {content.titleAR.length}/200
                                  </span>
                                </div>

                                {/* Description EN */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Description (EN)
                                  </Label>
                                  <Textarea
                                    placeholder="Enter notification description in English"
                                    value={content.descriptionEN}
                                    onChange={(e) =>
                                      handleContentChange(
                                        evt.id,
                                        "descriptionEN",
                                        e.target.value
                                      )
                                    }
                                    maxLength={500}
                                    rows={2}
                                    className="text-sm bg-white resize-none"
                                  />
                                  <span className="text-[10px] text-gray-400">
                                    {content.descriptionEN.length}/500
                                  </span>
                                </div>

                                {/* Description AR */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Description (AR)
                                  </Label>
                                  <Textarea
                                    placeholder="Enter notification description in Arabic"
                                    value={content.descriptionAR}
                                    onChange={(e) =>
                                      handleContentChange(
                                        evt.id,
                                        "descriptionAR",
                                        e.target.value
                                      )
                                    }
                                    maxLength={500}
                                    rows={2}
                                    dir="rtl"
                                    lang="ar"
                                    className="text-sm bg-white resize-none"
                                  />
                                  <span className="text-[10px] text-gray-400">
                                    {content.descriptionAR.length}/500
                                  </span>
                                </div>
                              </div>

                              {/* Edit Email Template Link */}
                              <div className="pt-2 border-t border-gray-200">
                                <Link
                                  to="/email-templates"
                                  className="inline-flex items-center gap-1.5 text-xs text-[#003B95] hover:underline font-medium"
                                  aria-label={`Edit email template for ${evt.name}`}
                                >
                                  <Mail className="h-3 w-3" />
                                  Edit Email Template
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Floating Save Button (visible when scrolled) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="gap-1.5 shadow-lg bg-[#003B95] hover:bg-[#002d73] px-5"
            aria-label="Save all notification settings"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save All Changes
            <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-[10px] h-5">
              {changeCount}
            </Badge>
          </Button>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog((p) => ({ ...p, open: false }));
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDialog((p) => ({ ...p, open: false }))}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={confirmDialog.onConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
