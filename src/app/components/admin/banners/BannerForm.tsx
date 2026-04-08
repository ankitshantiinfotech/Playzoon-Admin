// ─── Banner Add / Edit Modal Form ─────────────────────────────

import { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertCircle,
  Type,
  MousePointerClick,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import ImageCropper from "../../ImageCropper";
import { CROP_PRESETS } from "../../../../lib/cropPresets";
import type { Banner, BannerFormData } from "./types";

interface BannerFormProps {
  initialData?: Banner;
  onSubmit: (data: BannerFormData) => void;
  onCancel: () => void;
}

export function BannerForm({
  initialData,
  onSubmit,
  onCancel,
}: BannerFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BannerFormData>({
    imageUrl: "",
    bannerText: "",
    buttonLabel: "",
    redirectUrl: "",
    status: "Active",
    sortOrder: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Image cropper state ─────────────────────────────────
  const [cropRawSrc, setCropRawSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        imageUrl: initialData.imageUrl,
        bannerText: initialData.bannerText,
        buttonLabel: initialData.buttonLabel,
        redirectUrl: initialData.redirectUrl,
        status: initialData.status,
        sortOrder: initialData.sortOrder,
      });
    }
    setErrors({});
  }, [initialData]);

  const patch = (p: Partial<BannerFormData>) =>
    setForm((prev) => ({ ...prev, ...p }));

  // ── Validation ───────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.imageUrl) e.imageUrl = "Banner image is required.";
    if (form.bannerText && form.bannerText.length > 200)
      e.bannerText = "Banner text must not exceed 200 characters.";
    if (form.buttonLabel && form.buttonLabel.length > 30)
      e.buttonLabel = "Button label must not exceed 30 characters.";
    if (form.redirectUrl && !/^(\/|https?:\/\/)/.test(form.redirectUrl))
      e.redirectUrl = "Must be a valid URL or path starting with / or http.";
    if (form.sortOrder < 1) e.sortOrder = "Sort order must be at least 1.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validate()) {
      onSubmit(form);
    } else {
      toast.error("Please fix the validation errors.");
    }
  };

  // ── Simulated file upload ─────────────────────────────────
  const simulateUpload = (file: File) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG and PNG files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must not exceed 5 MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const steps = [15, 35, 55, 75, 90, 100];
    let i = 0;
    const iv = setInterval(() => {
      setUploadProgress(steps[i]);
      i++;
      if (i >= steps.length) {
        clearInterval(iv);
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          // Use object URL for preview
          const url = URL.createObjectURL(file);
          patch({ imageUrl: url });
          setErrors((prev) => {
            const n = { ...prev };
            delete n.imageUrl;
            return n;
          });
          toast.success("Image uploaded successfully.");
        }, 300);
      }
    }, 160);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG and PNG files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must not exceed 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropRawSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerCropComplete = (_blob: Blob, previewUrl: string) => {
    patch({ imageUrl: previewUrl });
    setErrors((prev) => {
      const n = { ...prev };
      delete n.imageUrl;
      return n;
    });
    toast.success("Image cropped and ready.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {initialData ? "Edit Banner" : "Add New Banner"}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {initialData
                ? `Editing ${initialData.id}`
                : "Create a new homepage banner."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ─── Image Upload ──────────────────────────── */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700">
              Banner Image <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />

            {form.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[16/7] group">
                <img
                  src={form.imageUrl}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 bg-white/90 rounded-xl text-sm font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 hover:border-[#003B95] rounded-xl p-8 flex flex-col items-center gap-2 text-gray-500 hover:text-[#003B95] transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-sm font-medium">
                  Click to upload banner image
                </span>
                <span className="text-xs text-gray-400">
                  JPG or PNG — Max 5 MB — Recommended 1200x675 (16:9)
                </span>
              </button>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3 h-3" />
                    Uploading...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#003B95] rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            {errors.imageUrl && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.imageUrl}
              </p>
            )}
          </div>

          {/* ─── Banner Text ──────────────────────────── */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-gray-400" />
              Banner Text
            </label>
            <textarea
              value={form.bannerText}
              onChange={(e) => patch({ bannerText: e.target.value })}
              placeholder="Overlay text displayed on the banner..."
              maxLength={200}
              rows={2}
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-lg outline-none resize-none transition-colors",
                errors.bannerText
                  ? "border-red-400 bg-red-50/30 focus:border-red-500"
                  : "border-gray-300 focus:border-[#003B95]",
              )}
            />
            <div className="flex items-center justify-between">
              {errors.bannerText ? (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.bannerText}
                </p>
              ) : (
                <span />
              )}
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  form.bannerText.length > 180
                    ? "text-red-500"
                    : form.bannerText.length > 150
                      ? "text-amber-500"
                      : "text-gray-400",
                )}
              >
                {form.bannerText.length}/200
              </span>
            </div>
          </div>

          {/* ─── Button Label + Redirect URL ──────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-gray-400" />
                Button Label
              </label>
              <input
                type="text"
                value={form.buttonLabel}
                onChange={(e) => patch({ buttonLabel: e.target.value })}
                placeholder="e.g. Register Now"
                maxLength={30}
                className={cn(
                  "w-full h-10 px-3 text-sm border rounded-lg outline-none transition-colors",
                  errors.buttonLabel
                    ? "border-red-400 bg-red-50/30"
                    : "border-gray-300 focus:border-[#003B95]",
                )}
              />
              {errors.buttonLabel && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.buttonLabel}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                Button Redirect URL
              </label>
              <input
                type="text"
                value={form.redirectUrl}
                onChange={(e) => patch({ redirectUrl: e.target.value })}
                placeholder="e.g. /promotions/summer or https://..."
                className={cn(
                  "w-full h-10 px-3 text-sm border rounded-lg outline-none transition-colors font-mono text-xs",
                  errors.redirectUrl
                    ? "border-red-400 bg-red-50/30"
                    : "border-gray-300 focus:border-[#003B95]",
                )}
              />
              {errors.redirectUrl && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.redirectUrl}
                </p>
              )}
            </div>
          </div>

          {/* ─── Sort Order + Status ──────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-gray-400" />
                Sort Order
              </label>
              <input
                type="number"
                min={1}
                value={form.sortOrder}
                onChange={(e) =>
                  patch({ sortOrder: parseInt(e.target.value) || 1 })
                }
                className={cn(
                  "w-full h-10 px-3 text-sm border rounded-lg outline-none transition-colors tabular-nums",
                  errors.sortOrder
                    ? "border-red-400 bg-red-50/30"
                    : "border-gray-300 focus:border-[#003B95]",
                )}
              />
              {errors.sortOrder && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.sortOrder}
                </p>
              )}
              <p className="text-[11px] text-gray-400">
                Controls display order on homepage (lower = first).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">
                Status
              </label>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl h-10 box-content">
                <span className="text-sm text-gray-700">
                  {form.status === "Active" ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      Inactive
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.status === "Active"}
                  onClick={() =>
                    patch({
                      status: form.status === "Active" ? "Inactive" : "Active",
                    })
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    form.status === "Active" ? "bg-emerald-500" : "bg-gray-300",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
                      form.status === "Active"
                        ? "translate-x-6"
                        : "translate-x-1",
                    )}
                  />
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Inactive banners are hidden from the homepage.
              </p>
            </div>
          </div>

          {/* ─── Actions ─────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#003B95] text-white rounded-xl text-sm font-semibold hover:bg-[#002d75] transition-colors shadow-sm"
            >
              {initialData ? "Save Changes" : "Create Banner"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Image Cropper ───────────────────────────────────── */}
      <ImageCropper
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropRawSrc}
        onCropComplete={handleBannerCropComplete}
        {...CROP_PRESETS.banner}
      />
    </div>
  );
}
