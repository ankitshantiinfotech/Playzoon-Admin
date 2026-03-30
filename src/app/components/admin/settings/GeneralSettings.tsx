import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";

const generalSettingsSchema = z.object({
  platformNameEn: z.string().min(1, "Platform Name (EN) is required"),
  platformNameAr: z.string().min(1, "Platform Name (AR) is required"),
  defaultCurrency: z.string(),
  defaultLanguage: z.string(),
  supportEmail: z.string().email("Invalid email address"),
  supportPhone: z.string().min(1, "Support phone is required"),
  facebookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  youtubeUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  tiktokUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  iosAppUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  androidAppUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

export function GeneralSettings() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<GeneralSettingsValues | null>(null);

  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      platformNameEn: "Playzoon",
      platformNameAr: "بلاي زون",
      defaultCurrency: "SAR",
      defaultLanguage: "en",
      supportEmail: "support@playzoon.com",
      supportPhone: "+966 50 000 0000",
      facebookUrl: "",
      instagramUrl: "",
      twitterUrl: "",
      youtubeUrl: "",
      tiktokUrl: "",
      iosAppUrl: "",
      androidAppUrl: "",
    },
  });

  const onSubmit = (data: GeneralSettingsValues) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (pendingData) {
      console.log("Saving:", pendingData);
      toast.success("General settings saved successfully");
      setPendingData(null);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
        <p className="text-muted-foreground">Manage basic platform information and contact details.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Platform Information</CardTitle>
            <CardDescription>Basic details about the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformNameEn">Platform Name (EN)</Label>
                <Input id="platformNameEn" {...form.register("platformNameEn")} />
                {form.formState.errors.platformNameEn && (
                  <p className="text-sm text-red-500">{form.formState.errors.platformNameEn.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="platformNameAr" className="text-right block" style={{ direction: "rtl" }}>Platform Name (AR)</Label>
                <Input id="platformNameAr" {...form.register("platformNameAr")} dir="rtl" />
                {form.formState.errors.platformNameAr && (
                  <p className="text-sm text-red-500">{form.formState.errors.platformNameAr.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select
                  defaultValue={form.getValues("defaultCurrency")}
                  onValueChange={(value) => form.setValue("defaultCurrency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {["SAR", "AED", "QAR", "BHD", "USD", "EUR"].map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select
                  defaultValue={form.getValues("defaultLanguage")}
                  onValueChange={(value) => form.setValue("defaultLanguage", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Support channels for users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input id="supportEmail" type="email" {...form.register("supportEmail")} />
                {form.formState.errors.supportEmail && (
                  <p className="text-sm text-red-500">{form.formState.errors.supportEmail.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input id="supportPhone" {...form.register("supportPhone")} />
                {form.formState.errors.supportPhone && (
                  <p className="text-sm text-red-500">{form.formState.errors.supportPhone.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>Links to your social media profiles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input id="facebookUrl" placeholder="https://facebook.com/..." {...form.register("facebookUrl")} />
                {form.formState.errors.facebookUrl && (
                  <p className="text-sm text-red-500">{form.formState.errors.facebookUrl.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input id="instagramUrl" placeholder="https://instagram.com/..." {...form.register("instagramUrl")} />
                {form.formState.errors.instagramUrl && (
                  <p className="text-sm text-red-500">{form.formState.errors.instagramUrl.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterUrl">Twitter URL</Label>
                <Input id="twitterUrl" placeholder="https://twitter.com/..." {...form.register("twitterUrl")} />
                {form.formState.errors.twitterUrl && (
                  <p className="text-sm text-red-500">{form.formState.errors.twitterUrl.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube URL</Label>
                <Input id="youtubeUrl" placeholder="https://youtube.com/..." {...form.register("youtubeUrl")} />
                {form.formState.errors.youtubeUrl && (
                  <p className="text-sm text-red-500">{form.formState.errors.youtubeUrl.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktokUrl">TikTok URL</Label>
                <Input id="tiktokUrl" placeholder="https://tiktok.com/..." {...form.register("tiktokUrl")} />
                {form.formState.errors.tiktokUrl && (
                  <p className="text-sm text-red-500">{form.formState.errors.tiktokUrl.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>App Store Links</CardTitle>
            <CardDescription>Links to download the mobile apps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iosAppUrl">iOS App Store URL</Label>
                <Input id="iosAppUrl" placeholder="https://apps.apple.com/..." {...form.register("iosAppUrl")} />
                {form.formState.errors.iosAppUrl && (
                  <p className="text-sm text-red-500">{form.formState.errors.iosAppUrl.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="androidAppUrl">Google Play URL</Label>
                <Input id="androidAppUrl" placeholder="https://play.google.com/..." {...form.register("androidAppUrl")} />
                {form.formState.errors.androidAppUrl && (
                  <p className="text-sm text-red-500">{form.formState.errors.androidAppUrl.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-[#003B95] hover:bg-[#002a6b]">
            Save General Settings
          </Button>
        </div>
      </form>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save General Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the platform configuration. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} className="bg-[#003B95] hover:bg-[#002a6b]">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
