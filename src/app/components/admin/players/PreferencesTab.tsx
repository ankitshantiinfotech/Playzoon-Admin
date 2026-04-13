"use client";

import React, { useState, useEffect } from "react";
import { adminService } from "@/services/admin.service";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import {
  Bell,
  Shield,
  Globe,
  Save,
  RefreshCw,
  Smartphone,
  Mail,
  Layout,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NotificationSetting {
  event_type: string;
  push: boolean;
  email: boolean;
  in_app: boolean;
  is_customized: boolean;
}

interface PreferencesData {
  language: string;
  privacy: "public" | "friends" | "private";
  notifications: NotificationSetting[];
}

interface PreferencesTabProps {
  playerId: string;
  isLoading?: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  booking_confirmed: "Booking Confirmed",
  booking_cancelled: "Booking Cancelled",
  booking_reminder: "Booking Reminder",
  payment_success: "Payment Successful",
  payment_failed: "Payment Failed",
  tournament_joined: "Tournament Joined",
  tournament_cancelled: "Tournament Cancelled",
  tournament_completed: "Tournament Completed",
  friend_request: "Friend Request",
  chat_message: "Chat Message",
  wallet_credited: "Wallet Credited",
  wallet_debited: "Wallet Debited",
  account_locked: "Account Security Alert",
  password_changed: "Password Change Notification",
};

export const PreferencesTab: React.FC<PreferencesTabProps> = ({ playerId }) => {
  const [data, setData] = useState<PreferencesData | null>(null);
  const [initialData, setInitialData] = useState<PreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getPlayerPreferences(playerId);
      setData(res.data);
      setInitialData(JSON.parse(JSON.stringify(res.data)));
    } catch (err) {
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, [playerId]);

  const handleUpdateNotif = (
    eventType: string,
    channel: "push" | "email" | "in_app",
    val: boolean,
  ) => {
    if (!data) return;
    const nextNotifs = data.notifications.map((n) =>
      n.event_type === eventType ? { ...n, [channel]: val } : n,
    );
    setData({ ...data, notifications: nextNotifs });
  };

  const handleSave = async () => {
    if (!data) return;
    try {
      setSaving(true);
      await adminService.updatePlayerPreferences(playerId, data);
      setInitialData(JSON.parse(JSON.stringify(data)));
      toast.success("Preferences updated successfully");
    } catch (err) {
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(data) !== JSON.stringify(initialData);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/50 border border-dashed rounded-xl">
        <RefreshCw className="h-8 w-8 text-[#003B95] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">
          Loading player preferences...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">
            Account Preferences
          </h2>
          <p className="text-gray-500">
            Manage notification channels, privacy visibility, and localization.
          </p>
        </div>
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#003B95] hover:bg-[#002a6b] text-white shadow-lg shadow-blue-900/10 px-6"
              >
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save All Changes
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Localization & Privacy Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
                <Globe className="h-5 w-5 text-[#003B95]" />
              </div>
              <CardTitle className="text-lg">Localization</CardTitle>
              <CardDescription>Preferred interface language.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>System Language</Label>
                <Select
                  value={data.language}
                  onValueChange={(val) => setData({ ...data, language: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English (US)</SelectItem>
                    <SelectItem value="ar">Arabic (العربية)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-2">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Privacy Visibility</CardTitle>
              <CardDescription>
                Control who can see this player's profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Profile View</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {data.privacy} Mode
                    </p>
                  </div>
                  <Select
                    value={data.privacy}
                    onValueChange={(val: any) =>
                      setData({ ...data, privacy: val })
                    }
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Changing this will affect how the player appears in global
                    search and friend lists.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Card */}
        <Card className="md:col-span-2 border-none shadow-sm ring-1 ring-gray-200">
          <CardHeader className="border-b bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bell className="h-5 w-5 text-[#003B95]" />
              </div>
              <div className="space-y-1">
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Fine-tune how the player receives different types of alerts.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <div className="col-span-6">Event Type</div>
                <div className="col-span-2 text-center">Push</div>
                <div className="col-span-2 text-center">Email</div>
                <div className="col-span-2 text-center">In-App</div>
              </div>

              {/* Rows */}
              {data.notifications.map((notif) => (
                <div
                  key={notif.event_type}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/30 transition-colors"
                >
                  <div className="col-span-6 space-y-0.5">
                    <p className="text-sm font-semibold text-gray-900">
                      {EVENT_LABELS[notif.event_type] || notif.event_type}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 font-normal capitalize"
                      >
                        {notif.event_type.split("_")[0]}
                      </Badge>
                      {notif.is_customized && (
                        <span className="text-[10px] text-[#003B95] font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Adjusted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={notif.push}
                      onCheckedChange={(val) =>
                        handleUpdateNotif(notif.event_type, "push", val)
                      }
                      className="data-[state=checked]:bg-[#003B95]"
                    />
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={notif.email}
                      onCheckedChange={(val) =>
                        handleUpdateNotif(notif.event_type, "email", val)
                      }
                      className="data-[state=checked]:bg-[#003B95]"
                    />
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={notif.in_app}
                      onCheckedChange={(val) =>
                        handleUpdateNotif(notif.event_type, "in_app", val)
                      }
                      className="data-[state=checked]:bg-[#003B95]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-6 border-t bg-gray-50/20 text-xs text-gray-500 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Smartphone className="h-3 w-3" /> Mobile Push
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email Alerts
            </div>
            <div className="flex items-center gap-1.5">
              <Layout className="h-3 w-3" /> Dashboard Feed
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
