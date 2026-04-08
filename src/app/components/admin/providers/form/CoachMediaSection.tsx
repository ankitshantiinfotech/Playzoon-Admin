// ─── US-4.3.2 — Coach Media Upload Section ──────────────────
// Experience Certificates, Supporting Documents, Photo Gallery,
// Video Upload, and YouTube Video URLs.

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  FileSpreadsheet,
  Film,
  Play,
  Plus,
  Link2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  GripVertical,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ImagePlus,
  Video,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import ImageCropper from "../../../ImageCropper";
import { CROP_PRESETS } from "../../../../../lib/cropPresets";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Progress } from "../../../ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number; // 0-100
  status: "uploading" | "complete" | "error";
  previewUrl?: string; // data URL for images/videos
  thumbnailUrl?: string; // auto-generated thumbnail for videos
}

interface YouTubeEntry {
  id: string;
  url: string;
  embedId: string | null;
  error: string | null;
}

export interface CoachMediaState {
  certificates: MediaFile[];
  documents: MediaFile[];
  photos: MediaFile[];
  videos: MediaFile[];
  youtubeUrls: YouTubeEntry[];
}

export const INITIAL_MEDIA_STATE: CoachMediaState = {
  certificates: [],
  documents: [],
  photos: [],
  videos: [],
  youtubeUrls: [],
};

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const CERT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const CERT_EXT = ".pdf,.png,.jpg,.jpeg,.doc,.docx";

const DOC_TYPES = [
  ...CERT_TYPES,
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const DOC_EXT = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx";

const PHOTO_TYPES = ["image/jpeg", "image/png"];
const PHOTO_EXT = ".jpg,.jpeg,.png";

const VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/avi",
];
const VIDEO_EXT = ".mp4,.mov,.avi";

const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type.includes("pdf"))
    return <FileText className="h-4 w-4 text-red-500" />;
  if (type.includes("image"))
    return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (type.includes("sheet") || type.includes("excel"))
    return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
  if (type.includes("word") || type.includes("doc"))
    return <FileIcon className="h-4 w-4 text-blue-400" />;
  if (type.includes("video"))
    return <Film className="h-4 w-4 text-purple-500" />;
  return <FileIcon className="h-4 w-4 text-gray-400" />;
}

function genId() {
  return `mf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// YouTube URL → embed ID
function extractYouTubeId(url: string): string | null {
  if (!url.trim()) return null;
  // youtube.com/watch?v=ID
  const match1 = url.match(/(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/);
  if (match1) return match1[1];
  // youtu.be/ID
  const match2 = url.match(/(?:youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (match2) return match2[1];
  // youtube.com/embed/ID
  const match3 = url.match(/(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  if (match3) return match3[1];
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Simulated upload progress
// ═══════════════════════════════════════════════════════════════

function useSimulatedUpload(
  setState: React.Dispatch<React.SetStateAction<CoachMediaState>>,
  field: keyof Pick<
    CoachMediaState,
    "certificates" | "documents" | "photos" | "videos"
  >,
) {
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map(),
  );

  const startUpload = useCallback(
    (file: MediaFile) => {
      const interval = setInterval(
        () => {
          setState((prev) => {
            const list = prev[field];
            const idx = list.findIndex((f) => f.id === file.id);
            if (idx === -1) {
              clearInterval(interval);
              return prev;
            }
            const item = list[idx];
            if (item.status !== "uploading") {
              clearInterval(interval);
              return prev;
            }
            const next = Math.min(item.progress + Math.random() * 18 + 5, 100);
            const done = next >= 100;
            const updated = [...list];
            updated[idx] = {
              ...item,
              progress: done ? 100 : Math.round(next),
              status: done ? "complete" : "uploading",
            };
            if (done) {
              clearInterval(interval);
              intervalsRef.current.delete(file.id);
            }
            return { ...prev, [field]: updated };
          });
        },
        200 + Math.random() * 300,
      );
      intervalsRef.current.set(file.id, interval);
    },
    [setState, field],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach((i) => clearInterval(i));
    };
  }, []);

  return startUpload;
}

// ═══════════════════════════════════════════════════════════════
// Drag-and-Drop Upload Zone (shared for certs & docs)
// ═══════════════════════════════════════════════════════════════

function DropZone({
  label,
  description,
  acceptedTypes,
  acceptExt,
  maxSize,
  maxSizeLabel,
  files,
  onAdd,
  onRemove,
  onView,
  icon,
}: {
  label: string;
  description: string;
  acceptedTypes: string[];
  acceptExt: string;
  maxSize: number;
  maxSizeLabel: string;
  files: MediaFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onView: (file: MediaFile) => void;
  icon: React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      const valid: File[] = [];
      for (const f of dropped) {
        if (!acceptedTypes.includes(f.type)) {
          toast.error(`"${f.name}" has an unsupported format.`);
          continue;
        }
        if (f.size > maxSize) {
          toast.error(`"${f.name}" exceeds ${maxSizeLabel}.`);
          continue;
        }
        valid.push(f);
      }
      if (valid.length) onAdd(valid);
    },
    [acceptedTypes, maxSize, maxSizeLabel, onAdd],
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    const valid: File[] = [];
    for (const f of selected) {
      if (!acceptedTypes.includes(f.type)) {
        toast.error(`"${f.name}" has an unsupported format.`);
        continue;
      }
      if (f.size > maxSize) {
        toast.error(`"${f.name}" exceeds ${maxSizeLabel}.`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length) onAdd(valid);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-[#374151] flex items-center gap-1.5">
          {icon} {label}
        </Label>
        {files.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 text-gray-500"
          >
            {files.length} file{files.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors",
          dragOver
            ? "border-[#003B95] bg-blue-50/50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/50",
        )}
      >
        <Upload className="h-5 w-5 text-gray-400 mx-auto mb-2" />
        <p className="text-xs text-[#374151]">
          Drag & drop files here, or{" "}
          <span className="text-[#003B95] underline">browse</span>
        </p>
        <p className="text-[10px] text-[#9CA3AF] mt-1">{description}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptExt}
        className="hidden"
        onChange={handleSelect}
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 px-3 py-2 bg-gray-50 border rounded-lg group"
            >
              {fileIcon(f.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#111827] truncate">{f.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#9CA3AF]">
                    {formatFileSize(f.size)}
                  </span>
                  {f.status === "uploading" && (
                    <span className="text-[10px] text-blue-600">
                      {f.progress}%
                    </span>
                  )}
                  {f.status === "complete" && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  )}
                  {f.status === "error" && (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                </div>
                {f.status === "uploading" && (
                  <Progress value={f.progress} className="h-1 mt-1" />
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {f.status === "complete" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(f);
                    }}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500"
                    aria-label={`View ${f.name}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(f.id);
                  }}
                  className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Photo Gallery Grid with Lightbox
// ═══════════════════════════════════════════════════════════════

function PhotoGallery({
  photos,
  onAdd,
  onRemove,
  onDirty,
}: {
  photos: MediaFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onDirty: () => void;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const completedPhotos = useMemo(
    () => photos.filter((p) => p.status === "complete" && p.previewUrl),
    [photos],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      const valid: File[] = [];
      for (const f of dropped) {
        if (!PHOTO_TYPES.includes(f.type)) {
          toast.error(`"${f.name}" is not a JPG/PNG image.`);
          continue;
        }
        if (f.size > MAX_PHOTO_SIZE) {
          toast.error(`"${f.name}" exceeds 5MB.`);
          continue;
        }
        valid.push(f);
      }
      if (valid.length) onAdd(valid);
    },
    [onAdd],
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    const valid: File[] = [];
    for (const f of selected) {
      if (!PHOTO_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" is not a JPG/PNG image.`);
        continue;
      }
      if (f.size > MAX_PHOTO_SIZE) {
        toast.error(`"${f.name}" exceeds 5MB.`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length) onAdd(valid);
  };

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-[#374151] flex items-center gap-1.5">
          <ImagePlus className="h-4 w-4 text-blue-500" /> Photo Gallery
        </Label>
        {photos.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 text-gray-500"
          >
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {photos.map((p, idx) => (
          <div
            key={p.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border group cursor-pointer"
            onClick={() =>
              p.status === "complete" &&
              p.previewUrl &&
              openLightbox(completedPhotos.indexOf(p))
            }
          >
            {p.previewUrl ? (
              <img
                src={p.previewUrl}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
              </div>
            )}
            {/* Upload progress overlay */}
            {p.status === "uploading" && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
                <span className="text-[10px] text-white">{p.progress}%</span>
              </div>
            )}
            {/* Hover overlay */}
            {p.status === "complete" && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(p.id);
                  }}
                  className="p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-white shadow"
                  aria-label={`Remove ${p.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add photo tile */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors gap-1",
            dragOver
              ? "border-[#003B95] bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
          )}
        >
          <Plus className="h-5 w-5 text-gray-400" />
          <span className="text-[10px] text-[#9CA3AF]">Add Photo</span>
        </div>
      </div>
      <p className="text-[10px] text-[#9CA3AF]">JPG or PNG, max 5MB each.</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={PHOTO_EXT}
        className="hidden"
        onChange={handleSelect}
      />

      {/* Lightbox */}
      {lightboxIdx !== null && completedPhotos.length > 0 && (
        <Dialog open onOpenChange={closeLightbox}>
          <DialogContent className="sm:max-w-3xl p-0 bg-black/95 border-0">
            <div className="relative flex items-center justify-center min-h-[400px] max-h-[80vh]">
              <img
                src={completedPhotos[lightboxIdx]?.previewUrl}
                alt={completedPhotos[lightboxIdx]?.name}
                className="max-w-full max-h-[80vh] object-contain"
              />
              {/* Nav arrows */}
              {completedPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIdx(
                        (lightboxIdx - 1 + completedPhotos.length) %
                          completedPhotos.length,
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIdx((lightboxIdx + 1) % completedPhotos.length)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full">
                <span className="text-xs text-white">
                  {lightboxIdx + 1} / {completedPhotos.length}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Video Upload Section
// ═══════════════════════════════════════════════════════════════

function VideoUploadSection({
  videos,
  onAdd,
  onRemove,
}: {
  videos: MediaFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      const valid: File[] = [];
      for (const f of dropped) {
        if (!VIDEO_TYPES.includes(f.type)) {
          toast.error(`"${f.name}" is not a supported video format.`);
          continue;
        }
        if (f.size > MAX_VIDEO_SIZE) {
          toast.error(`"${f.name}" exceeds 100MB.`);
          continue;
        }
        valid.push(f);
      }
      if (valid.length) onAdd(valid);
    },
    [onAdd],
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    const valid: File[] = [];
    for (const f of selected) {
      if (!VIDEO_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" is not a supported video format.`);
        continue;
      }
      if (f.size > MAX_VIDEO_SIZE) {
        toast.error(`"${f.name}" exceeds 100MB.`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length) onAdd(valid);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-[#374151] flex items-center gap-1.5">
          <Video className="h-4 w-4 text-purple-500" /> Video Upload
        </Label>
        {videos.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 text-gray-500"
          >
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors",
          dragOver
            ? "border-[#003B95] bg-blue-50/50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/50",
        )}
      >
        <Film className="h-5 w-5 text-gray-400 mx-auto mb-2" />
        <p className="text-xs text-[#374151]">
          Drag & drop videos, or{" "}
          <span className="text-[#003B95] underline">browse</span>
        </p>
        <p className="text-[10px] text-[#9CA3AF] mt-1">
          MP4, MOV, AVI. Max 100MB each.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={VIDEO_EXT}
        className="hidden"
        onChange={handleSelect}
      />

      {/* Video list */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videos.map((v) => (
            <div
              key={v.id}
              className="border rounded-lg overflow-hidden bg-gray-50 group"
            >
              {/* Thumbnail / Player */}
              <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                {v.previewUrl && playingId === v.id ? (
                  <video
                    src={v.previewUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onEnded={() => setPlayingId(null)}
                  />
                ) : v.previewUrl ? (
                  <>
                    <video
                      src={v.previewUrl}
                      className="w-full h-full object-contain"
                      muted
                    />
                    {v.status === "complete" && (
                      <button
                        type="button"
                        onClick={() => setPlayingId(v.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                        aria-label={`Play ${v.name}`}
                      >
                        <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="h-4 w-4 text-[#003B95] ml-0.5" />
                        </div>
                      </button>
                    )}
                  </>
                ) : (
                  <Film className="h-8 w-8 text-gray-600" />
                )}
                {/* Upload progress overlay */}
                {v.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                    <div className="w-3/4">
                      <Progress value={v.progress} className="h-1.5" />
                    </div>
                    <span className="text-xs text-white">
                      {v.progress}%
                      {v.size > 50 * 1024 * 1024 ? " (chunked)" : ""}
                    </span>
                  </div>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => {
                    onRemove(v.id);
                    if (playingId === v.id) setPlayingId(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${v.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Info bar */}
              <div className="px-3 py-2 flex items-center gap-2">
                <Film className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <p className="text-xs text-[#111827] truncate flex-1">
                  {v.name}
                </p>
                <span className="text-[10px] text-[#9CA3AF]">
                  {formatFileSize(v.size)}
                </span>
                {v.status === "complete" && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// YouTube URL Section
// ═══════════════════════════════════════════════════════════════

function YouTubeUrlSection({
  entries,
  onAdd,
  onUpdate,
  onRemove,
}: {
  entries: YouTubeEntry[];
  onAdd: () => void;
  onUpdate: (id: string, url: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-[#374151] flex items-center gap-1.5">
          <Link2 className="h-4 w-4 text-red-500" /> YouTube Video URLs
        </Label>
        {entries.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 text-gray-500"
          >
            {entries.length} link{entries.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {entries.map((entry) => (
        <div key={entry.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={entry.url}
                onChange={(e) => onUpdate(entry.id, e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={cn(
                  "h-10 pl-8 pr-8 text-sm",
                  entry.error && "border-red-300 ring-1 ring-red-200",
                  entry.embedId &&
                    !entry.error &&
                    "border-emerald-300 ring-1 ring-emerald-200",
                )}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {entry.embedId && !entry.error && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                )}
                {entry.error && (
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(entry.id)}
              className="p-2 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0"
              aria-label="Remove URL"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {entry.error && (
            <p className="text-xs text-red-500 pl-1">{entry.error}</p>
          )}
          {/* Embed preview */}
          {entry.embedId && !entry.error && (
            <div className="rounded-lg overflow-hidden border bg-black aspect-video max-w-md">
              <iframe
                src={`https://www.youtube.com/embed/${entry.embedId}`}
                title={`YouTube video ${entry.embedId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs gap-1.5"
        onClick={onAdd}
      >
        <Plus className="h-3 w-3" /> Add YouTube URL
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN MEDIA SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CoachMediaSection({
  media,
  setMedia,
  onDirty,
}: {
  media: CoachMediaState;
  setMedia: React.Dispatch<React.SetStateAction<CoachMediaState>>;
  onDirty: () => void;
}) {
  const startCertUpload = useSimulatedUpload(setMedia, "certificates");
  const startDocUpload = useSimulatedUpload(setMedia, "documents");
  const startPhotoUpload = useSimulatedUpload(setMedia, "photos");
  const startVideoUpload = useSimulatedUpload(setMedia, "videos");

  // ── Photo gallery cropper state (process one at a time) ──
  const [photoCropSrc, setPhotoCropSrc] = useState("");
  const [photoCropOpen, setPhotoCropOpen] = useState(false);
  const photoCropQueueRef = useRef<string[]>([]);

  const processNextPhotoCrop = useCallback(() => {
    if (photoCropQueueRef.current.length === 0) return;
    const nextSrc = photoCropQueueRef.current.shift()!;
    setPhotoCropSrc(nextSrc);
    setPhotoCropOpen(true);
  }, []);

  const handlePhotoCropComplete = useCallback(
    (blob: Blob, previewUrl: string) => {
      const croppedFile = new File([blob], `gallery-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const mf: MediaFile = {
        id: genId(),
        name: croppedFile.name,
        size: croppedFile.size,
        type: croppedFile.type,
        progress: 0,
        status: "uploading",
        previewUrl,
      };
      setMedia((prev) => ({ ...prev, photos: [...prev.photos, mf] }));
      startPhotoUpload(mf);
      onDirty();

      // Process next image in queue
      if (photoCropQueueRef.current.length > 0) {
        setTimeout(() => processNextPhotoCrop(), 200);
      }
    },
    [setMedia, startPhotoUpload, onDirty, processNextPhotoCrop],
  );

  // ── File → MediaFile converter ────────────────────────
  const createMediaFile = useCallback(
    (file: File): MediaFile => {
      const mf: MediaFile = {
        id: genId(),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: "uploading",
      };
      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setMedia((prev) => {
            const updateList = (list: MediaFile[]) =>
              list.map((f) =>
                f.id === mf.id
                  ? { ...f, previewUrl: reader.result as string }
                  : f,
              );
            return {
              ...prev,
              certificates: updateList(prev.certificates),
              documents: updateList(prev.documents),
              photos: updateList(prev.photos),
            };
          });
        };
        reader.readAsDataURL(file);
      }
      // Generate preview for videos
      if (file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        mf.previewUrl = url;
      }
      return mf;
    },
    [setMedia],
  );

  // ── Add handlers ──────────────────────────────────────
  const addCertificates = useCallback(
    (files: File[]) => {
      const mfs = files.map((f) => createMediaFile(f));
      setMedia((prev) => ({
        ...prev,
        certificates: [...prev.certificates, ...mfs],
      }));
      mfs.forEach(startCertUpload);
      onDirty();
    },
    [createMediaFile, setMedia, startCertUpload, onDirty],
  );

  const addDocuments = useCallback(
    (files: File[]) => {
      const mfs = files.map((f) => createMediaFile(f));
      setMedia((prev) => ({ ...prev, documents: [...prev.documents, ...mfs] }));
      mfs.forEach(startDocUpload);
      onDirty();
    },
    [createMediaFile, setMedia, startDocUpload, onDirty],
  );

  const addPhotos = useCallback(
    (files: File[]) => {
      // Queue each file for cropping (one at a time)
      let startedFirst = false;
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = () => {
          const src = reader.result as string;
          if (!startedFirst && !photoCropOpen) {
            startedFirst = true;
            setPhotoCropSrc(src);
            setPhotoCropOpen(true);
          } else {
            photoCropQueueRef.current.push(src);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [photoCropOpen],
  );

  const addVideos = useCallback(
    (files: File[]) => {
      const mfs = files.map((f) => createMediaFile(f));
      setMedia((prev) => ({ ...prev, videos: [...prev.videos, ...mfs] }));
      mfs.forEach(startVideoUpload);
      onDirty();
    },
    [createMediaFile, setMedia, startVideoUpload, onDirty],
  );

  // ── Remove handlers ───────────────────────────────────
  const removeCert = useCallback(
    (id: string) => {
      setMedia((prev) => ({
        ...prev,
        certificates: prev.certificates.filter((f) => f.id !== id),
      }));
      onDirty();
    },
    [setMedia, onDirty],
  );

  const removeDoc = useCallback(
    (id: string) => {
      setMedia((prev) => ({
        ...prev,
        documents: prev.documents.filter((f) => f.id !== id),
      }));
      onDirty();
    },
    [setMedia, onDirty],
  );

  const removePhoto = useCallback(
    (id: string) => {
      setMedia((prev) => ({
        ...prev,
        photos: prev.photos.filter((f) => f.id !== id),
      }));
      onDirty();
    },
    [setMedia, onDirty],
  );

  const removeVideo = useCallback(
    (id: string) => {
      setMedia((prev) => {
        const v = prev.videos.find((f) => f.id === id);
        if (v?.previewUrl && v.type.startsWith("video/"))
          URL.revokeObjectURL(v.previewUrl);
        return { ...prev, videos: prev.videos.filter((f) => f.id !== id) };
      });
      onDirty();
    },
    [setMedia, onDirty],
  );

  // ── View file handler (opens in new tab) ──────────────
  const viewFile = useCallback((file: MediaFile) => {
    if (file.previewUrl) {
      window.open(file.previewUrl, "_blank");
    } else {
      toast.info("Preview not available for this file type.");
    }
  }, []);

  // ── YouTube URL handlers ──────────────────────────────
  const addYouTubeEntry = useCallback(() => {
    setMedia((prev) => ({
      ...prev,
      youtubeUrls: [
        ...prev.youtubeUrls,
        { id: genId(), url: "", embedId: null, error: null },
      ],
    }));
    onDirty();
  }, [setMedia, onDirty]);

  const updateYouTubeEntry = useCallback(
    (id: string, url: string) => {
      setMedia((prev) => ({
        ...prev,
        youtubeUrls: prev.youtubeUrls.map((e) => {
          if (e.id !== id) return e;
          const trimmed = url.trim();
          if (!trimmed) return { ...e, url, embedId: null, error: null };
          const embedId = extractYouTubeId(trimmed);
          return {
            ...e,
            url,
            embedId,
            error: embedId ? null : "Please enter a valid YouTube URL",
          };
        }),
      }));
      onDirty();
    },
    [setMedia, onDirty],
  );

  const removeYouTubeEntry = useCallback(
    (id: string) => {
      setMedia((prev) => ({
        ...prev,
        youtubeUrls: prev.youtubeUrls.filter((e) => e.id !== id),
      }));
      onDirty();
    },
    [setMedia, onDirty],
  );

  // ═══════════════════════════════════════════════════════
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50/50">
        <h2 className="text-sm text-[#111827] flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-[#003B95]" />
          Media
        </h2>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Upload credentials, photos, videos, and link YouTube content.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* ── Experience Certificates ─────────────────── */}
        <DropZone
          label="Experience Certificates"
          description="PDF, PNG, JPEG, DOC. Max 10MB each."
          acceptedTypes={CERT_TYPES}
          acceptExt={CERT_EXT}
          maxSize={MAX_DOC_SIZE}
          maxSizeLabel="10MB"
          files={media.certificates}
          onAdd={addCertificates}
          onRemove={removeCert}
          onView={viewFile}
          icon={<FileText className="h-4 w-4 text-amber-500" />}
        />

        <hr className="border-gray-100" />

        {/* ── Supporting Documents ────────────────────── */}
        <DropZone
          label="Supporting Documents"
          description="PDF, PNG, JPEG, DOC, XLS. Max 10MB each."
          acceptedTypes={DOC_TYPES}
          acceptExt={DOC_EXT}
          maxSize={MAX_DOC_SIZE}
          maxSizeLabel="10MB"
          files={media.documents}
          onAdd={addDocuments}
          onRemove={removeDoc}
          onView={viewFile}
          icon={<FileIcon className="h-4 w-4 text-blue-500" />}
        />

        <hr className="border-gray-100" />

        {/* ── Photo Gallery ──────────────────────────── */}
        <PhotoGallery
          photos={media.photos}
          onAdd={addPhotos}
          onRemove={removePhoto}
          onDirty={onDirty}
        />

        <hr className="border-gray-100" />

        {/* ── Video Upload ───────────────────────────── */}
        <VideoUploadSection
          videos={media.videos}
          onAdd={addVideos}
          onRemove={removeVideo}
        />

        <hr className="border-gray-100" />

        {/* ── YouTube URLs ───────────────────────────── */}
        <YouTubeUrlSection
          entries={media.youtubeUrls}
          onAdd={addYouTubeEntry}
          onUpdate={updateYouTubeEntry}
          onRemove={removeYouTubeEntry}
        />
      </div>

      {/* ── Photo Gallery Cropper ─────────────────────────── */}
      <ImageCropper
        open={photoCropOpen}
        onOpenChange={setPhotoCropOpen}
        imageSrc={photoCropSrc}
        onCropComplete={handlePhotoCropComplete}
        {...CROP_PRESETS.facilityImage}
      />
    </div>
  );
}
