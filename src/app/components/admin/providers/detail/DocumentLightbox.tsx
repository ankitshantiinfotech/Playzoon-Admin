import { useState, useEffect, useCallback } from "react";
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Download, RotateCw, FileText, FileSpreadsheet, File,
  Maximize2, Minimize2,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import type { ProviderDocument } from "./training-provider-detail-data";

// ─── Props ───────────────────────────────────────────────────

interface DocumentLightboxProps {
  documents: ProviderDocument[];
  activeIndex: number;
  open: boolean;
  onClose: () => void;
  onChangeIndex: (idx: number) => void;
}

// ─── File type icon ──────────────────────────────────────────

function FileIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "pdf": return <FileText className={cn("text-red-400", className)} />;
    case "xls": return <FileSpreadsheet className={cn("text-emerald-400", className)} />;
    case "doc": return <File className={cn("text-blue-400", className)} />;
    default:   return <File className={cn("text-gray-400", className)} />;
  }
}

// ═══════════════════════════════════════════════════════════════
// Document Lightbox
// ═══════════════════════════════════════════════════════════════

export function DocumentLightbox({
  documents,
  activeIndex,
  open,
  onClose,
  onChangeIndex,
}: DocumentLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const doc = documents[activeIndex];
  const total = documents.length;
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < total - 1;

  // Reset zoom/rotation on index change
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [activeIndex]);

  const goPrev = useCallback(() => {
    if (hasPrev) onChangeIndex(activeIndex - 1);
  }, [hasPrev, activeIndex, onChangeIndex]);

  const goNext = useCallback(() => {
    if (hasNext) onChangeIndex(activeIndex + 1);
  }, [hasNext, activeIndex, onChangeIndex]);

  // Keyboard controls
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "+":
        case "=":
          setZoom(z => Math.min(z + 0.25, 3));
          break;
        case "-":
          setZoom(z => Math.max(z - 0.25, 0.5));
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, goPrev, goNext, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open || !doc) return null;

  const isImage = doc.fileType === "image";
  const isPdf = doc.fileType === "pdf";
  const isDownloadOnly = doc.fileType === "doc" || doc.fileType === "xls";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Document viewer: ${doc.name}`}
    >
      {/* ── Top Bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <FileIcon type={doc.fileType} className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{doc.name}</p>
            <p className="text-xs text-white/50">
              {doc.size} &middot; {activeIndex + 1} of {total}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls (image only) */}
          {isImage && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-white/50 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setRotation(r => (r + 90) % 360)}
                aria-label="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => { setZoom(1); setRotation(0); }}
                aria-label="Reset view"
              >
                {zoom !== 1 || rotation !== 0
                  ? <Minimize2 className="h-4 w-4" />
                  : <Maximize2 className="h-4 w-4" />}
              </Button>
            </>
          )}

          {/* Download */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => window.open(doc.url, "_blank")}
            aria-label="Download document"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 ml-2"
            onClick={onClose}
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* ── Content Area ────────────────────────────── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Prev / Next Arrows */}
        {hasPrev && (
          <button
            className="absolute left-4 z-10 flex items-center justify-center h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-colors"
            onClick={goPrev}
            aria-label="Previous document"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {hasNext && (
          <button
            className="absolute right-4 z-10 flex items-center justify-center h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-colors"
            onClick={goNext}
            aria-label="Next document"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Image viewer */}
        {isImage && (
          <div className="flex items-center justify-center w-full h-full overflow-auto p-8">
            <img
              src={doc.url}
              alt={doc.name}
              className="max-w-none transition-transform duration-200 rounded-lg shadow-2xl"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxHeight: zoom === 1 ? "85vh" : undefined,
                maxWidth: zoom === 1 ? "85vw" : undefined,
              }}
              draggable={false}
            />
          </div>
        )}

        {/* PDF viewer (simulated) */}
        {isPdf && (
          <div className="flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="w-[600px] max-w-[90vw] h-[70vh] bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center overflow-hidden">
              {/* Mock PDF page */}
              <div className="flex-1 w-full flex flex-col items-center justify-center p-8 bg-white">
                <FileText className="h-16 w-16 text-red-400 mb-4" />
                <p className="text-lg text-gray-700">{doc.name}</p>
                <p className="text-sm text-gray-400 mt-1">{doc.size}</p>
                <div className="mt-6 w-full max-w-md space-y-3">
                  {/* Simulated PDF content lines */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3 bg-gray-200 rounded"
                      style={{ width: `${60 + Math.random() * 40}%` }}
                    />
                  ))}
                  <div className="h-6" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={`b-${i}`}
                      className="h-3 bg-gray-100 rounded"
                      style={{ width: `${50 + Math.random() * 50}%` }}
                    />
                  ))}
                </div>
              </div>
              {/* PDF bottom bar */}
              <div className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 border-t">
                <span className="text-xs text-gray-500">Page 1 of 3</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOC / XLS — Download prompt */}
        {isDownloadOnly && (
          <div className="flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 flex flex-col items-center">
              <FileIcon type={doc.fileType} className="h-16 w-16 mb-4" />
              <p className="text-lg text-white">{doc.name}</p>
              <p className="text-sm text-white/50 mt-1">{doc.size}</p>
              <p className="text-xs text-white/40 mt-3">
                This file type cannot be previewed in the browser.
              </p>
              <Button
                className="mt-6 bg-[#003B95] hover:bg-[#002d73] text-white"
                onClick={() => window.open(doc.url, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Thumbnails ────────────────────────── */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-black/60 border-t border-white/10 overflow-x-auto">
          {documents.map((d, i) => (
            <button
              key={d.id}
              onClick={() => onChangeIndex(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all shrink-0",
                i === activeIndex
                  ? "bg-[#003B95] text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80"
              )}
              aria-label={`View ${d.name}`}
              aria-current={i === activeIndex ? "true" : undefined}
            >
              <FileIcon type={d.fileType} className="h-3.5 w-3.5" />
              <span className="max-w-[120px] truncate">{d.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
