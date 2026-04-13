import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
  aspect?: number;
  outputWidth: number;
  outputHeight: number;
  circularMask?: boolean;
  quality?: number;
  title?: string;
}

export default function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspect = 1,
  outputWidth,
  outputHeight,
  circularMask = false,
  quality = 0.85,
  title = "Crop Image",
}: ImageCropperProps): ReactNode {
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset crop when image changes
  useEffect(() => {
    if (!open) {
      setCrop(undefined);
    }
  }, [open, imageSrc]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      imgRef.current = e.currentTarget;

      const initialCrop = centerCrop(
        makeAspectCrop(
          { unit: "%", width: 90 },
          aspect,
          width,
          height
        ),
        width,
        height
      );
      setCrop(initialCrop);
    },
    [aspect]
  );

  const handleApply = useCallback(() => {
    const image = imgRef.current;
    if (!image || !crop) return;

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Convert percentage crop to pixel values on the natural image
    const pixelCrop = {
      x: (crop.unit === "%" ? (crop.x / 100) * image.naturalWidth : crop.x * scaleX),
      y: (crop.unit === "%" ? (crop.y / 100) * image.naturalHeight : crop.y * scaleY),
      width: (crop.unit === "%" ? (crop.width / 100) * image.naturalWidth : crop.width * scaleX),
      height: (crop.unit === "%" ? (crop.height / 100) * image.naturalHeight : crop.height * scaleY),
    };

    if (circularMask) {
      // Apply circular clip
      ctx.beginPath();
      ctx.arc(
        outputWidth / 2,
        outputHeight / 2,
        Math.min(outputWidth, outputHeight) / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();
    }

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputWidth,
      outputHeight
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        onCropComplete(blob, previewUrl);
        onOpenChange(false);
      },
      "image/jpeg",
      quality
    );
  }, [crop, outputWidth, outputHeight, circularMask, quality, onCropComplete, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleCancel}
      />

      {/* Modal card */}
      <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="p-5 bg-neutral-50 flex items-center justify-center max-h-[60vh] overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={aspect}
            circularCrop={!!circularMask}
            className={circularMask ? "max-w-full" : ""}
          >
            <img
              src={imageSrc}
              alt="Image to crop"
              onLoad={onImageLoad}
              className="max-h-[50vh] max-w-full"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#003B95] hover:bg-[#002d73] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
