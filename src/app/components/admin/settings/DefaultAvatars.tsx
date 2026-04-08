// ─── Default Profile Pictures Section ────────────────────────────────────────
// Gender-specific default profile pictures for players.
// Renders as a Card section within PlatformSettingsPage.

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Upload,
  User,
  Trash2,
  ImageIcon,
  AlertCircle,
  CheckCircle2,
  UserCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";

// ─── Types ──────────────────────────────────────────────────

interface AvatarState {
  currentUrl: string | null;
  pendingFile: File | null;
  pendingPreview: string | null;
  removed: boolean;
  error: string | null;
}

type GenderKey = "male" | "female" | "ratherNotSay";

// ─── Constants ──────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_SIZE_LABEL = "2MB";

const GENDER_CONFIG: {
  key: GenderKey;
  label: string;
  subtitle: string;
  accentColor: string;
  iconColor: string;
}[] = [
  {
    key: "male",
    label: "Male",
    subtitle: "Shown when a male player has no photo",
    accentColor: "bg-[#003B95]",
    iconColor: "text-[#003B95]",
  },
  {
    key: "female",
    label: "Female",
    subtitle: "Shown when a female player has no photo",
    accentColor: "bg-pink-500",
    iconColor: "text-pink-500",
  },
  {
    key: "ratherNotSay",
    label: "Rather Not Say",
    subtitle: "Shown when gender is not specified",
    accentColor: "bg-gray-500",
    iconColor: "text-gray-500",
  },
];

// ─── Placeholder SVG Avatar ─────────────────────────────────

function PlaceholderAvatar({ gender }: { gender: GenderKey }) {
  const bgColor =
    gender === "male" ? "#E0ECFF" : gender === "female" ? "#FCE4EC" : "#F3F4F6";
  const iconColor =
    gender === "male" ? "#003B95" : gender === "female" ? "#EC407A" : "#6B7280";

  return (
    <div
      className="w-full h-full flex items-center justify-center rounded-full"
      style={{ backgroundColor: bgColor }}
    >
      <User className="h-12 w-12" style={{ color: iconColor }} />
    </div>
  );
}

// ─── Single Avatar Upload Card ──────────────────────────────

function AvatarUploadArea({
  genderKey,
  config,
  state,
  onFileSelect,
  onRemovePending,
  onRemoveCurrent,
}: {
  genderKey: GenderKey;
  config: (typeof GENDER_CONFIG)[number];
  state: AvatarState;
  onFileSelect: (file: File) => void;
  onRemovePending: () => void;
  onRemoveCurrent: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayUrl = state.removed
    ? null
    : state.pendingPreview || state.currentUrl;
  const hasPending = state.pendingFile !== null || state.removed;

  return (
    <div className="flex flex-col items-center text-center space-y-4 p-5 rounded-xl border border-gray-200 bg-white">
      {/* Top accent bar */}
      <div
        className={cn(
          "h-1 w-full rounded-t-xl -mt-5 -mx-5",
          config.accentColor,
        )}
        style={{
          width: "calc(100% + 2.5rem)",
          marginLeft: "-1.25rem",
          marginRight: "-1.25rem",
          marginTop: "-1.25rem",
          borderTopLeftRadius: "0.75rem",
          borderTopRightRadius: "0.75rem",
        }}
      />

      {/* Label */}
      <div className="space-y-0.5 pt-1">
        <div className="flex items-center justify-center gap-2">
          <UserCircle className={cn("h-4 w-4", config.iconColor)} />
          <h3 className="text-sm font-medium text-gray-900">{config.label}</h3>
        </div>
        <p className="text-[11px] text-gray-400">{config.subtitle}</p>
      </div>

      {/* Avatar Preview */}
      <div className="relative">
        <div
          className={cn(
            "w-[100px] h-[100px] rounded-full overflow-hidden border-4 transition-colors",
            hasPending ? "border-[#003B95]/30" : "border-gray-100",
          )}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={`${config.label} preview`}
              className="w-full h-full object-cover"
            />
          ) : (
            <PlaceholderAvatar gender={genderKey} />
          )}
        </div>
        {hasPending && (
          <div className="absolute -top-1 -right-1">
            <span className="flex h-5 w-5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#003B95]/30 animate-ping" />
              <span className="relative inline-flex h-5 w-5 rounded-full bg-[#003B95] items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Pending file info */}
      {state.pendingFile && (
        <div className="flex items-center gap-2 rounded-lg bg-[#003B95]/5 border border-[#003B95]/15 px-3 py-2 w-full">
          <ImageIcon className="h-3.5 w-3.5 text-[#003B95] shrink-0" />
          <span className="text-xs text-[#003B95] truncate flex-1">
            {state.pendingFile.name}
          </span>
          <button
            onClick={onRemovePending}
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-1.5 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          className="gap-2 w-full"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
        {(displayUrl || state.pendingFile) && (
          <button
            onClick={state.pendingFile ? onRemovePending : onRemoveCurrent}
            className="text-xs text-red-500 hover:text-red-700 transition-colors underline underline-offset-2"
          >
            Remove
          </button>
        )}
        <p className="text-[10px] text-gray-400">
          JPEG/PNG, max {MAX_SIZE_LABEL}
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function DefaultProfilePictures({
  onChangeDetected,
}: {
  onChangeDetected?: (hasChanges: boolean) => void;
}) {
  const [avatars, setAvatars] = useState<Record<GenderKey, AvatarState>>({
    male: {
      currentUrl: null,
      pendingFile: null,
      pendingPreview: null,
      removed: false,
      error: null,
    },
    female: {
      currentUrl: null,
      pendingFile: null,
      pendingPreview: null,
      removed: false,
      error: null,
    },
    ratherNotSay: {
      currentUrl: null,
      pendingFile: null,
      pendingPreview: null,
      removed: false,
      error: null,
    },
  });

  const updateAvatar = (key: GenderKey, update: Partial<AvatarState>) => {
    setAvatars((prev) => {
      const next = { ...prev, [key]: { ...prev[key], ...update } };
      const hasChanges = Object.values(next).some(
        (s) => s.pendingFile !== null || s.removed,
      );
      onChangeDetected?.(hasChanges);
      return next;
    });
  };

  const validateAndSetFile = (key: GenderKey, file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      updateAvatar(key, {
        pendingFile: null,
        pendingPreview: null,
        removed: false,
        error: "Only JPEG/PNG files are allowed.",
      });
      toast.error("Only JPEG/PNG files are allowed.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      updateAvatar(key, {
        pendingFile: null,
        pendingPreview: null,
        removed: false,
        error: `File size must be under ${MAX_SIZE_LABEL}.`,
      });
      toast.error(`File size must be under ${MAX_SIZE_LABEL}.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      updateAvatar(key, {
        pendingFile: file,
        pendingPreview: e.target?.result as string,
        removed: false,
        error: null,
      });
    };
    reader.readAsDataURL(file);
  };

  const removePending = (key: GenderKey) => {
    updateAvatar(key, {
      pendingFile: null,
      pendingPreview: null,
      removed: false,
      error: null,
    });
  };

  const removeCurrent = (key: GenderKey) => {
    updateAvatar(key, {
      currentUrl: null,
      pendingFile: null,
      pendingPreview: null,
      removed: true,
      error: null,
    });
  };

  /** Called by PlatformSettingsPage when user clicks Save. */
  const saveAvatars = () => {
    setAvatars((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next) as GenderKey[]) {
        const s = next[key];
        if (s.pendingPreview) {
          next[key] = {
            ...s,
            currentUrl: s.pendingPreview,
            pendingFile: null,
            pendingPreview: null,
            removed: false,
            error: null,
          };
        } else if (s.removed) {
          next[key] = {
            ...s,
            currentUrl: null,
            pendingFile: null,
            pendingPreview: null,
            removed: false,
            error: null,
          };
        }
      }
      onChangeDetected?.(false);
      return next;
    });
  };

  // Expose save externally via a ref-like pattern — for simplicity, store on window
  // Actually, we just render this inline so the parent can track via onChangeDetected
  // and call save via a simpler approach. We'll use the parent's save bar.

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-9 rounded-lg bg-violet-100">
            <UserCircle className="h-4.5 w-4.5 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-base">
              Default Profile Pictures
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Set gender-specific default profile pictures for players
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Three upload areas side by side */}
        <div className="grid grid-cols-3 gap-4">
          {GENDER_CONFIG.map((config) => (
            <AvatarUploadArea
              key={config.key}
              genderKey={config.key}
              config={config}
              state={avatars[config.key]}
              onFileSelect={(file) => validateAndSetFile(config.key, file)}
              onRemovePending={() => removePending(config.key)}
              onRemoveCurrent={() => removeCurrent(config.key)}
            />
          ))}
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            These will be used as default profile pictures based on gender
            selected by the player. &apos;Rather Not Say&apos; is also used when
            no gender is selected or no image is uploaded.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Re-export for backward compat
export { DefaultProfilePictures as DefaultAvatars };
