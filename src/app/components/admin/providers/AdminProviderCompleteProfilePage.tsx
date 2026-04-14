import { useState, useRef, useEffect, useCallback } from "react";
import "react-phone-number-input/style.css";
import { format, isAfter, startOfDay } from "date-fns";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Upload,
  X,
  FileText,
  FileImage,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Check,
  ArrowLeft,
  Trash2,
  Building2,
  CheckCircle2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import { handleApiError, handleApiErrorWithDetails } from "@/lib/error-handler";
import api from "@/lib/api";
import { CROP_PRESETS } from "@/lib/cropPresets";
import ImageCropper from "../../ImageCropper";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { cn } from "../../ui/utils";
import MobileNumber from "../../ui/MobileNumber";
import { isLandlineInvalid } from "@/lib/landline";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "../../ui/dialog";

// ── Types ─────────────────────────────────────────────────
interface UploadedFile {
  id: string;
  /** Persisted row id from GET /profile/me official_documents — used for delete */
  serverId?: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  /** Set after successful save (multipart PUT or legacy /uploads). */
  uploadedUrl?: string;
  status: "uploading" | "complete" | "error";
  progress: number;
  errorMessage?: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  contactEmail: string;
  designation: string;
  contactMobile: string;
  landline: string;
  dateOfIncorporation: string;
  governmentId: UploadedFile[];
  drivingLicence: UploadedFile[];
  legalDocuments: UploadedFile[];
  leaseAgreement: UploadedFile[];
  profilePhoto: UploadedFile[];
}

interface FieldErrors {
  [key: string]: string;
}

/** Provider complete-profile document slots — maps to UserDocument.document_type */
type ProviderDocFormField =
  | "governmentId"
  | "drivingLicence"
  | "legalDocuments"
  | "leaseAgreement";

const PROVIDER_DOC_TYPE: Record<ProviderDocFormField, string> = {
  governmentId: "govt_id",
  drivingLicence: "driving_license",
  legalDocuments: "legal_doc",
  leaseAgreement: "lease_agreement",
};

function guessMimeFromFilename(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function mapOfficialDocRowToUploadedFile(d: {
  id: string;
  document_type?: string;
  file_name: string;
  file_url: string;
}): UploadedFile {
  const mime = guessMimeFromFilename(d.file_name);
  const isImg = mime.startsWith("image/");
  return {
    id: d.id,
    serverId: d.id,
    name: d.file_name,
    size: 0,
    type: mime,
    preview: isImg ? d.file_url : undefined,
    uploadedUrl: d.file_url,
    status: "complete",
    progress: 100,
  };
}

function mapOfficialDocsForField(
  list: Array<{
    id: string;
    document_type?: string;
    file_name: string;
    file_url: string;
  }>,
  docType: string,
): UploadedFile[] {
  return list
    .filter((d) => d.document_type === docType)
    .map(mapOfficialDocRowToUploadedFile);
}

/**
 * GET /profile/me sets `mobile` as country_code + national phone (see profile.service base.mobile).
 * Normalize to E.164 for `react-phone-number-input` / MobileNumber when `+` is missing or spaces differ.
 */
function contactMobileFromProfilePayload(p: Record<string, unknown>): string {
  const primary = String(p.mobile ?? p.phone ?? "").trim();
  const squeezed = primary.replace(/\s/g, "");
  if (!squeezed) return "";

  if (squeezed.startsWith("+")) {
    return squeezed;
  }

  const ccRaw = String(p.country_code ?? "").trim();
  const nationalDigits = squeezed.replace(/\D/g, "");
  if (!nationalDigits) return "";

  if (ccRaw) {
    const prefix = ccRaw.startsWith("+") ? ccRaw : `+${ccRaw.replace(/^\+/, "")}`;
    const ccDigits = prefix.replace(/\D/g, "");
    if (ccDigits && nationalDigits.startsWith(ccDigits) && nationalDigits.length > ccDigits.length) {
      return `+${nationalDigits}`;
    }
    return `${prefix}${nationalDigits}`;
  }

  return `+${nationalDigits}`;
}

// ── Mock data (simulating auto-populated from signup) ──────
const MOCK_PROFILE = {
  contactEmail: "ahmed@sportzone.com",
  contactMobile: "+966501234567",
  status: "pending_completion" as "pending_completion" | "rejected",
  rejectionReason: "",
};

/** Aligned with backend `profile.validation.js` (NAME_REGEX, PHONE_REGEX, UUID) */
const PROVIDER_NAME_REGEX = /^[\p{L}\s'\-]+$/u;
const PROVIDER_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const DESIGNATION_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Maps Joi `field` paths from PUT /profile/provider to local form keys for inline errors */
const PROVIDER_API_FIELD_TO_FORM: Record<string, string> = {
  first_name: "firstName",
  last_name: "lastName",
  email: "contactEmail",
  mobile: "contactMobile",
  date_of_incorporation: "dateOfIncorporation",
  designation_id: "designation",
  landline: "landline",
};

function mapProviderApiFieldErrorsToForm(
  fieldErrors: Record<string, string>,
): FieldErrors {
  const out: FieldErrors = {};
  for (const [apiField, msg] of Object.entries(fieldErrors)) {
    const formKey = PROVIDER_API_FIELD_TO_FORM[apiField];
    if (formKey) out[formKey] = msg;
  }
  return out;
}

function scrollFormErrorIntoView(errMap: FieldErrors) {
  const firstErrorKey = Object.keys(errMap)[0];
  if (!firstErrorKey) return;
  const el = document.getElementById("field-" + firstErrorKey);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = el.querySelector("input");
    if (input) (input as HTMLInputElement).focus();
  }
}
const PROFILE_EMAIL_BRAND = "#003B95";
const INCORPORATION_CALENDAR_MIN_YEAR = 1800;

/** Local calendar date from YYYY-MM-DD (avoids UTC shift from parseISO). */
function dateFromYmd(value: string): Date | undefined {
  const s = (value || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(5, 7));
  const d = Number(s.slice(8, 10));
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return undefined;
  return dt;
}

/**
 * GET /profile/me returns resolvePhotoUrl(null) as a stock avatar when there is no logo.
 * Those URLs must not hydrate the business-logo uploader — show the empty placeholder instead.
 */
function isCustomBusinessLogoUrl(url: string): boolean {
  const u = (url || "").trim().toLowerCase();
  if (!u) return false;
  if (u.includes("placeholder")) return false;
  if (u.includes("/defaults/") || u.includes("defaults/")) return false;
  if (u.includes("avatar-neutral") || u.includes("avatar-male") || u.includes("avatar-female")) {
    return false;
  }
  return true;
}

// ── Helpers ───────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage;
  return FileText;
}

// ── Simple Progress Bar ───────────────────────────────────
function ProgressBar({ value, className }: { value: number; className?: string }) {
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div className={"relative h-2 w-full overflow-hidden rounded-full bg-neutral-200 " + (className || "")}>
      <div
        className="h-full min-w-0 bg-[#003B95] rounded-full transition-all duration-500 ease-out"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

// ── Field Error Component ─────────────────────────────────
function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-red-500 flex items-center gap-1 mt-1.5" role="alert">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  );
}

// ── File Uploader Component ───────────────────────────────
function FileUploader({
  label,
  hint,
  accept,
  maxSize,
  maxFiles,
  files,
  onFilesChange,
  error,
  errorId,
  showPreview,
  className = "",
  customUploadFile,
  onUploadError,
  uploadBusy,
  onRemoveFile,
}: {
  label: string;
  hint?: string;
  accept: string[];
  maxSize: number;
  maxFiles: number;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => void;
  error?: string;
  errorId?: string;
  showPreview?: boolean;
  className?: string;
  /** Same persistence path as business logo: PUT /profile/provider + official_documents */
  customUploadFile?: (file: File) => Promise<void>;
  onUploadError?: (error: unknown) => void;
  uploadBusy?: boolean;
  onRemoveFile?: (file: UploadedFile) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const acceptStr = accept.join(",");
  const acceptLabels = accept
    .map((a) => {
      if (a === "image/jpeg") return "JPEG";
      if (a === "image/png") return "PNG";
      if (a === "image/webp") return "WebP";
      if (a === "application/pdf") return "PDF";
      return a;
    })
    .join(", ");

  const validateFile = (file: File): string | null => {
    if (!accept.includes(file.type)) {
      if (accept.includes("image/webp")) return "Image must be JPEG, PNG, or WebP.";
      return "File must be JPEG, PNG, or PDF.";
    }
    if (file.size > maxSize) {
      const sizeMB = maxSize / (1024 * 1024);
      if (accept.includes("image/webp")) return "Image size exceeds " + sizeMB + "MB.";
      return "File size exceeds " + sizeMB + "MB.";
    }
    return null;
  };

  const processFiles = (fileList: FileList) => {
    const remainingSlots = maxFiles - files.length;
    const count = Math.min(fileList.length, remainingSlots);
    const newFiles: UploadedFile[] = [];
    const uploadTargets: { rawFile: File; id: string }[] = [];

    for (let i = 0; i < count; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }

      const uploaded: UploadedFile = {
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 10,
      };

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        const fileId = uploaded.id;
        reader.onload = () => {
          onFilesChange(
            [...files, ...newFiles].map((f) =>
              f.id === fileId ? { ...f, preview: reader.result as string } : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploaded);
      uploadTargets.push({ rawFile: file, id: uploaded.id });
    }

    if (newFiles.length === 0) return;

    const combined = [...files, ...newFiles];
    onFilesChange(combined);

    uploadTargets.forEach(async ({ rawFile, id: uploadId }) => {
      try {
        if (customUploadFile) {
          await customUploadFile(rawFile);
          onFilesChange((prev) =>
            prev.map((f) =>
              f.id === uploadId
                ? { ...f, progress: 100, status: "complete" as const, uploadedUrl: f.uploadedUrl || "saved" }
                : f,
            ),
          );
        } else {
          const uploadType = rawFile.type.startsWith("image/") ? "facility" : "document";
          const result = await uploadFile(rawFile, uploadType as "facility" | "document");
          onFilesChange((prev) =>
            prev.map((f) =>
              f.id === uploadId
                ? {
                    ...f,
                    progress: 100,
                    status: "complete" as const,
                    uploadedUrl: result.url,
                  }
                : f,
            ),
          );
        }
      } catch (error) {
        if (onUploadError) onUploadError(error);
        else handleApiError(error);
        onFilesChange((prev) => prev.filter((f) => f.id !== uploadId));
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (uploadBusy) return;
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadBusy) return;
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    if (onRemoveFile) await onRemoveFile(file);
    else onFilesChange(files.filter((f) => f.id !== fileId));
  };

  const canAddMore = files.length < maxFiles;

  return (
    <div className={"space-y-2 flex flex-col h-full " + (className || "")}>
      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          aria-label={"Upload " + label}
          className={
            "relative flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 " +
            (uploadBusy ? "opacity-60 pointer-events-none " : "") +
            (isDragOver
              ? "border-[#003B95] bg-[#003B95]/5"
              : error
                ? "border-red-300 bg-red-50/50 hover:border-red-400"
                : "border-neutral-300 bg-neutral-50/50 hover:border-[#003B95] hover:bg-[#003B95]/[0.02]")
          }
          onClick={() => !uploadBusy && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!uploadBusy) inputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
        >
          {uploadBusy && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70">
              <Loader2 className="h-8 w-8 animate-spin text-[#003B95]" aria-hidden />
            </div>
          )}
          <Upload className={"w-6 h-6 mx-auto mb-2 " + (isDragOver ? "text-[#003B95]" : "text-neutral-400")} />
          <p className="text-sm text-neutral-600 mb-1">
            <span className="text-[#003B95] font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-neutral-400">
            {acceptLabels} — Max {maxSize / (1024 * 1024)}MB
            {maxFiles > 1 ? " — Up to " + maxFiles + " files" : ""}
          </p>
          {hint && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
          <input
            ref={inputRef}
            type="file"
            accept={acceptStr}
            multiple={maxFiles > 1}
            className="hidden"
            disabled={!!uploadBusy}
            onChange={handleInputChange}
          />
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className={
                  "flex items-center gap-3 p-3 rounded-lg border transition-all " +
                  (file.status === "error"
                    ? "border-red-200 bg-red-50"
                    : file.status === "complete"
                      ? "border-green-200 bg-green-50/50"
                      : "border-neutral-200 bg-white")
                }
              >
                {(showPreview !== false && file.preview) ? (
                  <img src={file.preview} alt={file.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div
                    className={
                      "w-10 h-10 rounded-lg flex items-center justify-center " +
                      (file.status === "error"
                        ? "bg-red-100"
                        : file.status === "complete"
                          ? "bg-green-100"
                          : "bg-neutral-100")
                    }
                  >
                    <Icon
                      className={
                        "w-5 h-5 " +
                        (file.status === "error"
                          ? "text-red-500"
                          : file.status === "complete"
                            ? "text-green-600"
                            : "text-neutral-500")
                      }
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 truncate">{file.name}</p>
                  <p className="text-xs text-neutral-400">{formatFileSize(file.size)}</p>
                  {file.status === "error" && file.errorMessage && (
                    <p className="text-xs text-red-500 mt-0.5">{file.errorMessage}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {file.status === "complete" && <Check className="w-4 h-4 text-green-600" />}
                  <button
                    type="button"
                    onClick={() => void removeFile(file.id)}
                    className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FieldError message={error} id={errorId} />
    </div>
  );
}

// ── Profile Photo Uploader ────────────────────────────────
function ProfilePhotoUploader({
  files,
  error,
  errorId,
  onCropFinished,
  onLogoRemove,
  isPersistingLogo,
  persistProgress,
}: {
  files: UploadedFile[];
  error?: string;
  errorId?: string;
  /** After crop: persist logo like player profile (multipart PUT), then parent syncs preview from API. */
  onCropFinished: (blob: Blob, previewUrl: string) => Promise<void>;
  /** Remove logo (API clears server + S3 on complete-profile). */
  onLogoRemove: () => void | Promise<void>;
  isPersistingLogo?: boolean;
  persistProgress?: number;
}) {
  const { t: rawT } = useTranslation();
  const t = (k: string) => rawT(k, { defaultValue: k });
  const inputRef = useRef<HTMLInputElement>(null);
  const photo = files[0];
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error(t("toast.upload.formatImageAlt"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("toast.upload.sizeImage"));
      return;
    }

    setRawImageSrc(URL.createObjectURL(file));
    setCropOpen(true);
    e.target.value = "";
  };

  const handleCropComplete = async (blob: Blob, previewUrl: string) => {
    await onCropFinished(blob, previewUrl);
  };

  // Match PlayerProfileEditPage ProfilePhotoSection: 120px circle + overflow-hidden hides JPEG black corners from circular crop.
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-5">
        <div className="relative h-[120px] w-[120px] shrink-0">
          <div
            role="button"
            tabIndex={0}
            aria-label={t("providerCompleteProfile.uploadBusinessLogo")}
            className={
              "relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-full transition-[box-shadow] group " +
              (photo?.preview
                ? "border-4 border-white shadow-lg ring-1 ring-black/10 hover:ring-2 hover:ring-[#003B95]/40"
                : error
                  ? "border-2 border-dashed border-red-400 bg-red-50"
                  : "border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-[#003B95] hover:bg-[#003B95]/5")
            }
            onClick={() => !isPersistingLogo && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!isPersistingLogo) inputRef.current?.click();
              }
            }}
          >
            {photo?.preview ? (
              <>
                <img
                  src={photo.preview}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center px-2 text-center text-neutral-400 group-hover:text-[#003B95] transition-colors">
                <Building2 className="w-8 h-8 mb-1.5 shrink-0" />
                <span className="text-[10px] font-medium leading-tight">{t("providerCompleteProfile.uploadLogo")}</span>
              </div>
            )}
            {isPersistingLogo && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/50">
                <div className="h-14 w-14">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeDasharray={`${persistProgress ?? 0}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col gap-1.5 pt-2">
          <p className="text-sm font-medium text-neutral-900">{t("providerCompleteProfile.businessLogo")}</p>
          <p className="text-xs text-neutral-500 max-w-[200px] leading-relaxed">
            Upload a clear, high-resolution image of your company logo.
            <br />
            <span className="text-neutral-400 mt-1 block">{t("providerCompleteProfile.imageFormats")}</span>
          </p>
          {photo && (
            <button
              type="button"
              disabled={!!isPersistingLogo}
              onClick={onLogoRemove}
              className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5 transition-colors mt-1"
            >
              <Trash2 className="w-4 h-4" />
              Remove Logo
            </button>
          )}
        </div>
      </div>
      <FieldError message={error} id={errorId} />
      {rawImageSrc && (
        <ImageCropper
          open={cropOpen}
          onOpenChange={setCropOpen}
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
          {...CROP_PRESETS.profilePhoto}
        />
      )}
    </div>
  );
}

/**
 * One DOM instance of `children` (mobile collapsible + desktop static title).
 * Duplicating the same block under `md:hidden` and `hidden md:block` breaks Radix Popover / DayPicker
 * (two triggers, two portals, duplicate ids).
 */
function ResponsiveProfileSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen !== false);

  return (
    <div className="border-b border-neutral-200 last:border-b-0 md:border-0 md:last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="md:hidden w-full flex items-center justify-between py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-neutral-900">{title}</span>
        <svg
          className={
            "w-4 h-4 text-neutral-400 transition-transform duration-200 " +
            (isOpen ? "rotate-180" : "")
          }
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="hidden md:block text-lg font-semibold text-neutral-900 mb-6 pb-2 border-b border-neutral-200 w-full">
        {title}
      </div>
      <div
        className={cn(
          "space-y-6",
          isOpen ? "block pb-4 md:pb-0" : "hidden md:block",
        )}
      >
        <fieldset className="border-0 p-0 m-0 w-full">
          <legend className="sr-only">{title}</legend>
          {children}
        </fieldset>
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────
function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
  loading?: boolean;
}) {
  const variant = confirmVariant || "default";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl">
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
            className={
              "rounded-xl " + (variant === "default" ? "bg-[#003B95] hover:bg-[#002a6b] text-white" : "")
            }
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ProviderCompleteProfileVariant = "onboarding" | "postApproval";

// ── Main Component ────────────────────────────────────────
export function AdminProviderCompleteProfilePage({
  variant = "onboarding",
}: {
  variant?: ProviderCompleteProfileVariant;
} = {}) {
  const isPostApproval = variant === "postApproval";
  const { t: rawT, i18n } = useTranslation();
  const t = (key: string) => rawT(key, { defaultValue: key });
  const lang = i18n.language === "ar" ? "ar" : "en";
  const navigate = useNavigate();
  const { id: providerId } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!providerId) return;
    setStoreLoading(true);
    try {
      const res = await adminService.getProvider(providerId);
      const row =
        (res as Record<string, unknown>)?.data ??
        (res as Record<string, unknown>)?.provider ??
        res;
      const p = row as Record<string, unknown>;
      const cc = String(p.country_code ?? "").trim();
      const national = String(p.mobile ?? p.phone ?? "").trim();
      const mobileCombined =
        cc && national ? `${cc.startsWith("+") ? cc : `+${cc.replace(/^\+/, "")}`}${national}` : national;
      setProfile({
        ...p,
        mobile: mobileCombined || national,
        profile_photo_url: p.business_logo_url ?? p.profile_photo_url,
        avatar_url: p.business_logo_url ?? p.avatar_url,
        approval_status: p.profile_status ?? p.approval_status,
        official_documents: p.official_documents,
      });
    } catch {
      toast.error("Failed to load provider profile");
      navigate("/providers");
    } finally {
      setStoreLoading(false);
    }
  }, [providerId, navigate]);

  const updateProviderProfile = useCallback(
    async (
      payload: Record<string, unknown>,
      profilePhotoLogo?: File | Blob | null,
      options?: {
        onUploadProgress?: (percent: number) => void;
        officialDocuments?: { file: File; documentType: string }[];
        draft?: boolean;
      },
    ) => {
      if (!providerId) throw new Error("Missing provider id");
      const data = await adminService.putProviderProfile(
        providerId,
        payload,
        profilePhotoLogo ?? undefined,
        {
          ...options,
          draft: options?.draft === true,
        },
      );
      const inner =
        (data as Record<string, unknown>)?.data ??
        (data as Record<string, unknown>)?.provider ??
        data;
      const p = inner as Record<string, unknown>;
      const cc = String(p.country_code ?? "").trim();
      const national = String(p.mobile ?? p.phone ?? "").trim();
      const mobileCombined =
        cc && national ? `${cc.startsWith("+") ? cc : `+${cc.replace(/^\+/, "")}`}${national}` : national;
      const normalized = {
        ...p,
        mobile: mobileCombined || national,
        profile_photo_url: p.business_logo_url ?? p.profile_photo_url,
        avatar_url: p.business_logo_url ?? p.avatar_url,
        approval_status: p.profile_status ?? p.approval_status,
        official_documents: p.official_documents,
      };
      setProfile(normalized);
      return normalized;
    },
    [providerId],
  );

  const [profileStatus, setProfileStatus] = useState(MOCK_PROFILE.status);
  const [rejectionReason, setRejectionReason] = useState(MOCK_PROFILE.rejectionReason);

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    contactEmail: "",
    designation: "",
    contactMobile: "",
    landline: "",
    dateOfIncorporation: "",
    governmentId: [],
    drivingLicence: [],
    legalDocuments: [],
    leaseAgreement: [],
    profilePhoto: [],
  });

  const [emailVerified, setEmailVerified] = useState(true);
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState("");
  const [otpPreviousEmail, setOtpPreviousEmail] = useState("");
  const [emailBaseline, setEmailBaseline] = useState("");

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!profile) return;
    const p = profile as Record<string, unknown>;
    const fn = String(p.first_name || p.first_name_en || "").trim();
    const ln = String(p.last_name || p.last_name_en || "").trim();
    const avatarRaw =
      (typeof p.avatar_url === "string" && p.avatar_url) ||
      (typeof p.profile_photo_url === "string" && p.profile_photo_url) ||
      "";
    const avatar = String(avatarRaw).trim();
    const officialRaw = p.official_documents;
    const officialList = Array.isArray(officialRaw)
      ? (officialRaw as Array<{
          id: string;
          document_type?: string;
          file_name: string;
          file_url: string;
        }>)
      : null;

    setForm((prev) => ({
      ...prev,
      firstName: fn || prev.firstName,
      lastName: ln || prev.lastName,
      contactEmail: pendingVerifyEmail
        ? prev.contactEmail
        : String(p.email || prev.contactEmail),
      designation: typeof p.designation === "object" && p.designation
        ? String((p.designation as Record<string, unknown>).id || "")
        : String(p.designation_id || p.designation || ""),
      contactMobile: contactMobileFromProfilePayload(p) || prev.contactMobile,
      landline: String(p.landline || ""),
      dateOfIncorporation: p.date_of_incorporation
        ? String(p.date_of_incorporation).split("T")[0]
        : "",
      // GET /profile/me exposes logo as profile_photo_url (mapped to avatar_url in the store).
      // Skip stock default avatars so "no logo" shows the dashed placeholder (same as first visit).
      profilePhoto:
        prev.profilePhoto.length === 0 && isCustomBusinessLogoUrl(avatar)
          ? [
              {
                id: "server-profile-photo",
                name: "logo",
                size: 0,
                type: "image/jpeg",
                preview: avatar,
                status: "complete",
                progress: 100,
              },
            ]
          : prev.profilePhoto,
      ...(officialList
        ? {
            governmentId: mapOfficialDocsForField(officialList, PROVIDER_DOC_TYPE.governmentId),
            drivingLicence: mapOfficialDocsForField(officialList, PROVIDER_DOC_TYPE.drivingLicence),
            legalDocuments: mapOfficialDocsForField(officialList, PROVIDER_DOC_TYPE.legalDocuments),
            leaseAgreement: mapOfficialDocsForField(officialList, PROVIDER_DOC_TYPE.leaseAgreement),
          }
        : {}),
    }));
    if (!pendingVerifyEmail) {
      setEmailVerified(
        !!(p.email && (p as { email_verified?: boolean }).email_verified),
      );
    }
    if (p.approval_status === "rejected") {
      setProfileStatus("rejected");
      setRejectionReason(String((p as Record<string, unknown>).rejection_reason || ""));
    }
  }, [profile, pendingVerifyEmail]);

  useEffect(() => {
    if (!profile || pendingVerifyEmail) return;
    setEmailBaseline(String((profile as { email?: string | null }).email || ""));
  }, [profile, pendingVerifyEmail]);

  const normalizedFormEmail = form.contactEmail.trim().toLowerCase();
  const normalizedBaselineEmail = emailBaseline.trim().toLowerCase();
  const hasEmailChanged = normalizedFormEmail !== normalizedBaselineEmail;
  const isEmailActuallyChanged =
    !!normalizedFormEmail && normalizedFormEmail !== normalizedBaselineEmail;

  useEffect(() => {
    if (!hasEmailChanged && showEmailVerify) {
      setShowEmailVerify(false);
      setPendingVerifyEmail("");
      setOtpPreviousEmail("");
    }
  }, [hasEmailChanged, showEmailVerify]);

  // Fetch designations for dropdown
  const [designations, setDesignations] = useState<{ id: string; name_en: string; name_ar: string }[]>([]);
  useEffect(() => {
    api.get("/config/designations").then((res) => {
      const list = res?.data?.designations || res?.designations || [];
      if (Array.isArray(list)) setDesignations(list);
    }).catch(() => {});
  }, []);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isPersistingLogo, setIsPersistingLogo] = useState(false);
  const [logoPersistProgress, setLogoPersistProgress] = useState(0);
  const [docFieldBusy, setDocFieldBusy] = useState<ProviderDocFormField | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const statusBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profileStatus === "rejected" && statusBannerRef.current) {
      statusBannerRef.current.focus();
    }
  }, [profileStatus]);

  // Calculate completion percentage
  const calculateProgress = useCallback((): number => {
    const total = 9;
    let completed = 0;
    if (form.firstName.trim()) completed++;
    if (form.lastName.trim()) completed++;
    if (form.contactEmail.trim()) completed++;
    if (form.designation.trim()) completed++;
    if (form.contactMobile) completed++;
    if (form.dateOfIncorporation) completed++;
    if (form.governmentId.some((f) => f.status === "complete")) completed++;
    if (form.legalDocuments.some((f) => f.status === "complete")) completed++;
    if (form.profilePhoto.some((f) => f.status === "complete")) completed++;
    return Math.round((completed / total) * 100);
  }, [form]);

  const progress = calculateProgress();

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = t("settingsProfile.validation.firstNameRequired");
    } else if (!PROVIDER_NAME_REGEX.test(form.firstName)) {
      newErrors.firstName = t("settingsProfile.validation.firstNameLetters");
    } else if (form.firstName.length > 50) {
      newErrors.firstName = t("settingsProfile.validation.firstNameMax");
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = t("settingsProfile.validation.lastNameRequired");
    } else if (!PROVIDER_NAME_REGEX.test(form.lastName)) {
      newErrors.lastName = t("settingsProfile.validation.lastNameLetters");
    } else if (form.lastName.length > 50) {
      newErrors.lastName = t("settingsProfile.validation.lastNameMax");
    }

    if (!form.contactEmail.trim()) {
      newErrors.contactEmail = t("settingsProfile.validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      newErrors.contactEmail = t("settingsProfile.validation.emailInvalid");
    } else if (form.contactEmail.length > 254) {
      newErrors.contactEmail = t("settingsProfile.validation.emailMax");
    }

    if (!form.designation.trim()) {
      newErrors.designation = t("providerCompleteProfile.designationRequired");
    } else if (!DESIGNATION_UUID_REGEX.test(form.designation.trim())) {
      newErrors.designation = t("providerCompleteProfile.designationInvalid");
    }

    const normalizedMobile = form.contactMobile.replace(/\s/g, "");
    if (!normalizedMobile.trim()) {
      newErrors.contactMobile = t("settingsProfile.validation.mobileRequired");
    } else if (!PROVIDER_PHONE_REGEX.test(normalizedMobile)) {
      newErrors.contactMobile = t("settingsProfile.validation.mobileInvalid");
    }

    if (isLandlineInvalid(form.landline)) {
      newErrors.landline = t("providerCompleteProfile.landlineInvalid");
    }

    if (!form.dateOfIncorporation) {
      newErrors.dateOfIncorporation = t("providerCompleteProfile.dateOfIncorporationRequired");
    } else {
      const dateVal = dateFromYmd(form.dateOfIncorporation);
      if (
        !dateVal ||
        isAfter(startOfDay(dateVal), startOfDay(new Date()))
      ) {
        newErrors.dateOfIncorporation = t("providerCompleteProfile.dateMustBePast");
      }
    }

    if (!form.governmentId.some((f) => f.status === "complete")) {
      newErrors.governmentId = t("providerCompleteProfile.governmentIdRequired");
    }

    if (!form.legalDocuments.some((f) => f.status === "complete")) {
      newErrors.legalDocuments = t("providerCompleteProfile.legalDocumentRequired");
    }

    if (!form.profilePhoto.some((f) => f.status === "complete")) {
      newErrors.profilePhoto = t("providerCompleteProfile.profilePhotoRequired");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollFormErrorIntoView(newErrors);
    }

    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateFiles = useCallback(
    (
      field: string,
      newFiles: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[]),
    ) => {
      setForm((prev) => {
        const curr = prev[field as keyof FormState] as UploadedFile[];
        const next = typeof newFiles === "function" ? newFiles(curr) : newFiles;
        return { ...prev, [field]: next };
      });
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const buildProviderDraftPayload = useCallback(() => {
    const mobileNorm = form.contactMobile.replace(/\s/g, "");
    return {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.contactEmail.trim(),
      ...(mobileNorm ? { mobile: mobileNorm } : {}),
      landline: form.landline || null,
      date_of_incorporation: form.dateOfIncorporation || null,
      ...(form.designation ? { designation_id: form.designation } : {}),
    };
  }, [
    form.firstName,
    form.lastName,
    form.contactEmail,
    form.contactMobile,
    form.landline,
    form.dateOfIncorporation,
    form.designation,
  ]);

  /** Logo multipart PUT: omit empty strings so Joi does not reject; never tied to validateForm(). */
  const buildProviderLogoUploadPayload = useCallback(() => {
    const mobileNorm = form.contactMobile.replace(/\s/g, "");
    const payload: Record<string, string | boolean> = {};
    const fn = form.firstName.trim();
    const ln = form.lastName.trim();
    const em = form.contactEmail.trim();
    if (fn) payload.first_name = fn;
    if (ln) payload.last_name = ln;
    if (em) payload.email = em;
    if (mobileNorm) payload.mobile = mobileNorm;
    const land = form.landline?.trim();
    if (land) payload.landline = land;
    if (form.dateOfIncorporation) payload.date_of_incorporation = form.dateOfIncorporation;
    if (form.designation?.trim()) payload.designation_id = form.designation;
    if (Object.keys(payload).length === 0) {
      payload.submit_for_approval = false;
    }
    return payload;
  }, [
    form.firstName,
    form.lastName,
    form.contactEmail,
    form.contactMobile,
    form.landline,
    form.dateOfIncorporation,
    form.designation,
  ]);

  const handleProviderProfileApiError = useCallback((error: unknown) => {
    const result = handleApiErrorWithDetails(error);
    if (result.code === "EMAIL_TAKEN" || result.code === "EMAIL_ALREADY_EXISTS") {
      const mapped: FieldErrors = { contactEmail: result.message || "Email is already registered." };
      setErrors((prev) => ({ ...prev, ...mapped }));
      scrollFormErrorIntoView(mapped);
      return result.message;
    }
    if (result.code === "MOBILE_TAKEN" || result.code === "MOBILE_ALREADY_EXISTS") {
      const mapped: FieldErrors = { contactMobile: result.message || "Mobile is already registered." };
      setErrors((prev) => ({ ...prev, ...mapped }));
      scrollFormErrorIntoView(mapped);
      return result.message;
    }
    if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
      const mapped = mapProviderApiFieldErrorsToForm(result.fieldErrors);
      if (Object.keys(mapped).length > 0) {
        setErrors((prev) => ({ ...prev, ...mapped }));
        scrollFormErrorIntoView(mapped);
      }
    }
    return result.message;
  }, []);

  const wrapProviderDocUpload = useCallback(
    (field: ProviderDocFormField) => async (rawFile: File) => {
      setDocFieldBusy(field);
      try {
        await updateProviderProfile(buildProviderLogoUploadPayload(), null, {
          officialDocuments: [{ file: rawFile, documentType: PROVIDER_DOC_TYPE[field] }],
        });
      } finally {
        setDocFieldBusy(null);
      }
    },
    [updateProviderProfile, buildProviderLogoUploadPayload],
  );

  const removeProviderOfficialFile = useCallback(
    async (field: ProviderDocFormField, file: UploadedFile) => {
      try {
        if (file.serverId) {
          await updateProviderProfile({
            ...buildProviderLogoUploadPayload(),
            remove_document_ids: [file.serverId],
          } as Record<string, unknown>);
        } else {
          updateFiles(field, (prev) => prev.filter((f) => f.id !== file.id));
        }
      } catch (e) {
        handleProviderProfileApiError(e);
      }
    },
    [updateProviderProfile, buildProviderLogoUploadPayload, updateFiles, handleProviderProfileApiError],
  );

  const handleBusinessLogoCropFinished = useCallback(
    async (blob: Blob, previewUrl: string) => {
      const localId = generateId();
      setIsPersistingLogo(true);
      setLogoPersistProgress(0);
      updateFiles("profilePhoto", [
        {
          id: localId,
          name: "provider-logo.jpg",
          size: blob.size,
          type: "image/jpeg",
          preview: previewUrl,
          status: "uploading",
          progress: 0,
        },
      ]);
      try {
        const p = await updateProviderProfile(buildProviderLogoUploadPayload(), blob, {
          onUploadProgress: (p) => setLogoPersistProgress(p),
        });
        const url = String(p.avatar_url || p.profile_photo_url || "").trim();
        if (url) {
          updateFiles("profilePhoto", [
            {
              id: "server-profile-photo",
              name: "logo",
              size: blob.size,
              type: "image/jpeg",
              preview: url,
              status: "complete",
              progress: 100,
            },
          ]);
        } else {
          updateFiles("profilePhoto", [
            {
              id: localId,
              name: "provider-logo.jpg",
              size: blob.size,
              type: "image/jpeg",
              preview: previewUrl,
              status: "complete",
              progress: 100,
            },
          ]);
        }
        toast.success(t("providerCompleteProfile.logoSaved"));
      } catch (error) {
        handleProviderProfileApiError(error);
        updateFiles("profilePhoto", []);
      } finally {
        setIsPersistingLogo(false);
        setLogoPersistProgress(0);
      }
    },
    [
      buildProviderLogoUploadPayload,
      updateFiles,
      updateProviderProfile,
      t,
      handleProviderProfileApiError,
    ],
  );

  const handleLogoRemove = useCallback(async () => {
    setIsPersistingLogo(true);
    try {
      await updateProviderProfile({ remove_business_logo: true });
      updateFiles("profilePhoto", []);
      toast.success(t("providerCompleteProfile.logoRemoved"));
    } catch (error) {
      handleProviderProfileApiError(error);
    } finally {
      setIsPersistingLogo(false);
    }
  }, [updateFiles, updateProviderProfile, handleProviderProfileApiError]);

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateProviderProfile({
        ...buildProviderDraftPayload(),
        submit_for_approval: true,
      });
      setShowSubmitModal(false);
      toast.success(t("toast.common.submittedForReview"));
      if (providerId) navigate(`/providers/${providerId}`);
      setSubmitted(true);
    } catch (error) {
      handleProviderProfileApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await updateProviderProfile(buildProviderDraftPayload(), undefined, { draft: true });
      toast.success(t("toast.common.draftSaved"));
    } catch (error) {
      handleProviderProfileApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  /** Post-approval profile: same payload + validation as complete-profile, no submit-for-review. */
  const handlePostApprovalSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await updateProviderProfile(buildProviderDraftPayload());
      toast.success(t("providerCompleteProfile.profileSaved"));
    } catch (error) {
      handleProviderProfileApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Pending Approval View ───────────────────────────────
  if (submitted && !isPostApproval) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
          <div className="w-16 h-16 rounded-full bg-[#003B95]/10 flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-[#003B95]" />
          </div>
          <h1 className="text-neutral-900 mb-2">{t("providerCompleteProfile.pendingApproval")}</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Your business profile has been submitted for review. Our admin team will review your documents and notify
            you once your profile is approved.
          </p>
          <p className="text-xs text-neutral-400 mb-6">{t("providerCompleteProfile.usuallyTakes")}</p>
          <Button
            variant="outline"
            onClick={() => navigate("/providers")}
            className="rounded-xl"
          >
            Back to providers
          </Button>
        </div>
      </div>
    );
  }

  // ── Section Contents ────────────────────────────────────
  const primaryContactContent = (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div id="field-firstName">
          <Label htmlFor="firstName" className="mb-1.5">
            {t("auth.firstName")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder={t("auth.firstNamePlaceholder")}
            maxLength={50}
            aria-describedby={errors.firstName ? "err-firstName" : undefined}
            aria-invalid={!!errors.firstName}
            className={
              errors.firstName
                ? "border-red-400 focus-visible:ring-red-200 focus-visible:border-red-400"
                : ""
            }
          />
          <FieldError message={errors.firstName} id="err-firstName" />
        </div>
        <div id="field-lastName">
          <Label htmlFor="lastName" className="mb-1.5">
            {t("auth.lastName")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder={t("auth.lastNamePlaceholder")}
            maxLength={50}
            aria-describedby={errors.lastName ? "err-lastName" : undefined}
            aria-invalid={!!errors.lastName}
            className={
              errors.lastName
                ? "border-red-400 focus-visible:ring-red-200 focus-visible:border-red-400"
                : ""
            }
          />
          <FieldError message={errors.lastName} id="err-lastName" />
        </div>
      </div>

      <div id="field-contactEmail">
        <Label htmlFor="contactEmail" className="mb-1.5">
          {t("provider.edit.email")} <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={(e) => {
              const v = e.target.value;
              updateField("contactEmail", v);
              if (v !== emailBaseline) {
                setEmailVerified(false);
              }
              if (!v.trim() || v.trim().toLowerCase() === normalizedBaselineEmail) {
                const p = profile as { email?: string; email_verified?: boolean } | null;
                setEmailVerified(!!(p?.email && p.email_verified));
                setShowEmailVerify(false);
                setPendingVerifyEmail("");
                setOtpPreviousEmail("");
              }
            }}
            placeholder="e.g. ahmed@company.com"
            maxLength={254}
            aria-describedby={errors.contactEmail ? "err-contactEmail" : undefined}
            aria-invalid={!!errors.contactEmail}
            className={
              (errors.contactEmail
                ? "border-red-400 focus-visible:ring-red-200 focus-visible:border-red-400 "
                : "") + "pr-28"
            }
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {form.contactEmail.trim() ? (
              emailVerified ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {t("settingsProfile.verified")}
                </Badge>
              ) : (
                <div className="contents">
                </div>
              )
            ) : null}
          </div>
        </div>
        <FieldError message={errors.contactEmail} id="err-contactEmail" />
      </div>

      <div id="field-designation">
        <Label htmlFor="designation" className="mb-1.5">
          Designation / Job Title <span className="text-red-500">*</span>
        </Label>
        <select
          id="designation"
          value={form.designation}
          onChange={(e) => updateField("designation", e.target.value)}
          aria-describedby={errors.designation ? "err-designation" : undefined}
          aria-invalid={!!errors.designation}
          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.designation ? "border-red-400 focus-visible:ring-red-200 focus-visible:border-red-400" : "border-input"}`}
        >
          <option value="">Select designation...</option>
          {designations.map((d) => (
            <option key={d.id} value={d.id}>
              {lang === "ar" ? d.name_ar : d.name_en}
            </option>
          ))}
        </select>
        <FieldError message={errors.designation} id="err-designation" />
      </div>

      <div id="field-contactMobile">
        <Label htmlFor="contactMobile" className="mb-1.5">
          {t("settingsProfile.mobileNumber")} <span className="text-red-500">*</span>
        </Label>
        <MobileNumber
          value={form.contactMobile}
          onChange={(v) => updateField("contactMobile", v || "")}
          error={!!errors.contactMobile}
        />
        <FieldError message={errors.contactMobile} id="err-contactMobile" />
      </div>

      <div id="field-landline">
        <Label htmlFor="landline" className="mb-1.5">
          Landline Number <span className="text-neutral-400 text-xs font-normal">(Optional)</span>
        </Label>
        <Input
          id="landline"
          type="tel"
          value={form.landline}
          onChange={(e) => updateField("landline", e.target.value)}
          placeholder="e.g. +966 11 123 4567"
          aria-describedby={errors.landline ? "err-landline" : undefined}
          aria-invalid={!!errors.landline}
          className={errors.landline ? "border-red-400 focus-visible:ring-red-200 focus-visible:border-red-400" : ""}
        />
        <FieldError message={errors.landline} id="err-landline" />
      </div>

      <div id="field-dateOfIncorporation">
        <Label htmlFor="dateOfIncorporation" className="mb-1.5">
          {t("provider.edit.dateOfIncorporation")} <span className="text-red-500">*</span>
        </Label>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              id="dateOfIncorporation"
              type="button"
              variant="field"
              size="field"
              className={cn(
                "w-full justify-start text-left",
                form.dateOfIncorporation ? "text-neutral-800" : "text-neutral-400",
                errors.dateOfIncorporation &&
                  "border-red-500 ring-1 ring-red-500/20",
              )} 
              aria-invalid={!!errors.dateOfIncorporation}
              aria-describedby={
                errors.dateOfIncorporation ? "err-dateOfIncorporation" : undefined
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-neutral-400" />
              {form.dateOfIncorporation
                ? (() => {
                    const d = dateFromYmd(form.dateOfIncorporation);
                    return d ? format(d, "PPP") : t("provider.edit.selectDate");
                  })()
                : t("provider.edit.selectDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={dateFromYmd(form.dateOfIncorporation)}
              onSelect={(date) => {
                updateField(
                  "dateOfIncorporation",
                  date ? format(date, "yyyy-MM-dd") : "",
                );
                if (date) setDatePickerOpen(false);
              }}
              defaultMonth={
                dateFromYmd(form.dateOfIncorporation) ?? new Date(2000, 0, 1)
              }
              fromYear={INCORPORATION_CALENDAR_MIN_YEAR}
              toYear={new Date().getFullYear()}
              disabled={(date) => isAfter(date, new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <FieldError message={errors.dateOfIncorporation} id="err-dateOfIncorporation" />
      </div>
    </div>
  );

  const documentUploadsContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div id="field-governmentId" className="flex flex-col h-full">
          <div className="min-h-[2.5rem] flex items-end mb-2 shrink-0">
            <Label className="mb-0">
              Government ID <span className="text-red-500">*</span>
            </Label>
          </div>
          <FileUploader
            className="flex-1"
            label="Government ID"
            hint="Upload a clear copy of your government-issued ID."
            accept={["image/jpeg", "image/png", "application/pdf"]}
            maxSize={10 * 1024 * 1024}
            maxFiles={1}
            files={form.governmentId}
            onFilesChange={(f) => updateFiles("governmentId", f)}
            error={errors.governmentId}
            errorId="err-governmentId"
            customUploadFile={wrapProviderDocUpload("governmentId")}
            onUploadError={handleProviderProfileApiError}
            uploadBusy={docFieldBusy === "governmentId"}
            onRemoveFile={(file) => void removeProviderOfficialFile("governmentId", file)}
          />
        </div>

        <div id="field-drivingLicence" className="flex flex-col h-full">
          <div className="min-h-[2.5rem] flex items-end mb-2 shrink-0">
            <Label className="mb-0">
              Driving Licence <span className="text-neutral-400 text-xs font-normal">(Optional)</span>
            </Label>
          </div>
          <FileUploader
            className="flex-1"
            label="Driving Licence"
            hint="Upload a clear copy of your valid driving licence."
            accept={["image/jpeg", "image/png", "application/pdf"]}
            maxSize={10 * 1024 * 1024}
            maxFiles={1}
            files={form.drivingLicence}
            onFilesChange={(f) => updateFiles("drivingLicence", f)}
            customUploadFile={wrapProviderDocUpload("drivingLicence")}
            onUploadError={handleProviderProfileApiError}
            uploadBusy={docFieldBusy === "drivingLicence"}
            onRemoveFile={(file) => void removeProviderOfficialFile("drivingLicence", file)}
          />
        </div>

        <div id="field-legalDocuments" className="flex flex-col h-full">
          <div className="min-h-[2.5rem] flex items-end mb-2 shrink-0">
            <Label className="mb-0">
              Legal Documents <span className="text-red-500">*</span>
            </Label>
          </div>
          <FileUploader
            className="flex-1"
            label="Legal Documents"
            hint="Commercial registration, trade licence, etc."
            accept={["image/jpeg", "image/png", "application/pdf"]}
            maxSize={10 * 1024 * 1024}
            maxFiles={10}
            files={form.legalDocuments}
            onFilesChange={(f) => updateFiles("legalDocuments", f)}
            error={errors.legalDocuments}
            errorId="err-legalDocuments"
            customUploadFile={wrapProviderDocUpload("legalDocuments")}
            onUploadError={handleProviderProfileApiError}
            uploadBusy={docFieldBusy === "legalDocuments"}
            onRemoveFile={(file) => void removeProviderOfficialFile("legalDocuments", file)}
          />
        </div>

        <div id="field-leaseAgreement" className="flex flex-col h-full">
          <div className="min-h-[2.5rem] flex items-end mb-2 shrink-0">
            <Label className="mb-0">
              Lease / Rental Agreement <span className="text-neutral-400 text-xs font-normal">(Optional)</span>
            </Label>
          </div>
          <FileUploader
            className="flex-1"
            label="Lease Agreement"
            hint="Upload your current rental or lease agreement."
            accept={["image/jpeg", "image/png", "application/pdf"]}
            maxSize={10 * 1024 * 1024}
            maxFiles={1}
            files={form.leaseAgreement}
            onFilesChange={(f) => updateFiles("leaseAgreement", f)}
            customUploadFile={wrapProviderDocUpload("leaseAgreement")}
            onUploadError={handleProviderProfileApiError}
            uploadBusy={docFieldBusy === "leaseAgreement"}
            onRemoveFile={(file) => void removeProviderOfficialFile("leaseAgreement", file)}
          />
        </div>
      </div>
    </div>
  );

  const profilePhotoContent = (
    <div id="field-profilePhoto">
      <ProfilePhotoUploader
        files={form.profilePhoto}
        onCropFinished={handleBusinessLogoCropFinished}
        onLogoRemove={handleLogoRemove}
        isPersistingLogo={isPersistingLogo}
        persistProgress={logoPersistProgress}
        error={errors.profilePhoto}
        errorId="err-profilePhoto"
      />
    </div>
  );

  // ── Render ──────────────────────────────────────────────
  if (storeLoading && !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#003B95]" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className={isPostApproval ? "min-h-0 bg-[#f8f9fc]" : "min-h-screen bg-neutral-50"}>
      {/* Header bar with logout — onboarding / fullscreen flow only */}
      {!isPostApproval && (
        <header className="bg-white border-b border-neutral-100 sticky top-0 z-30">
          <div className="max-w-[780px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/providers")}
              className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to providers
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#003B95] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-neutral-900">Admin</span>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main
        className={
          isPostApproval
            ? "max-w-[720px] mx-auto px-4 sm:px-6 py-6 pb-16"
            : "max-w-[720px] mx-auto px-4 sm:px-6 py-10 pb-32"
        }
      >
        {/* Rejection banner */}
        {profileStatus === "rejected" && rejectionReason && (
          <div
            ref={statusBannerRef}
            role="alert"
            tabIndex={-1}
            className="mb-8 p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 flex gap-4 items-start shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">{t("providerCompleteProfile.profileNotApproved")}</p>
              <p className="text-sm text-amber-700 leading-relaxed">{rejectionReason}</p>
              <p className="text-xs font-medium text-amber-600 mt-2">{t("providerCompleteProfile.updateFlaggedFields")}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          ref={formRef}
          role="form"
          aria-label={t("providerCompleteProfile.completeServiceProviderProfile")}
          onSubmit={(e) => {
            e.preventDefault();
            if (isPostApproval) {
              void handlePostApprovalSave();
            } else {
              handleSubmit();
            }
          }}
          className="space-y-12"
        >
          {/* Single mount per section — duplicate trees break date Popover / DayPicker */}
          <div className="mt-8 md:mt-0 mb-6 md:mb-0 border-t border-b border-neutral-100 md:border-0 md:space-y-12">
            <ResponsiveProfileSection title="Profile Photo / Logo" defaultOpen>
              {profilePhotoContent}
            </ResponsiveProfileSection>
            <ResponsiveProfileSection title="Primary Contact Details" defaultOpen>
              {primaryContactContent}
            </ResponsiveProfileSection>
            <ResponsiveProfileSection title="Document Uploads" defaultOpen>
              {documentUploadsContent}
            </ResponsiveProfileSection>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-4 pt-8 mt-12 border-t border-neutral-100">
            {isPostApproval ? (
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl bg-[#003B95] hover:bg-[#002a6b] text-white shadow-sm disabled:opacity-50 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("providerCompleteProfile.saveProfileChanges")}
              </Button>
            ) : (
              <>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl bg-[#003B95] hover:bg-[#002a6b] text-white shadow-sm disabled:opacity-50 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("providerCompleteProfile.submitForReview")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={handleSaveDraft}
                  className="flex-1 h-12 rounded-xl border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-sm font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("providerCompleteProfile.saveDraft")}
                </Button>
              </>
            )}
          </div>
        </form>

        {/* Live region for draft save announcements */}
        <div aria-live="polite" className="sr-only" />
      </main>

      {/* Confirm Modals */}
      {!isPostApproval && (
        <ConfirmModal
          open={showSubmitModal}
          onOpenChange={setShowSubmitModal}
          title={t("providerCompleteProfile.submitProfileForReview")}
          description={t("providerCompleteProfile.submitConfirmDesc")}
          confirmLabel={t("providerCompleteProfile.submit")}
          onConfirm={confirmSubmit}
          loading={isSubmitting}
        />
      )}
    </div>
  );
}
