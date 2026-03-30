import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Upload,
  ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Badge } from "../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
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

// ─── Types ──────────────────────────────────────────────────

export interface Banner {
  id: string;
  image: string;
  titleEn: string;
  linkUrl: string;
  buttonText: string;
  buttonUrl: string;
  active: boolean;
  sortOrder: number;
}

// ─── Mock Data ──────────────────────────────────────────────

const INITIAL_BANNERS: Banner[] = [
  {
    id: "b1",
    image:
      "https://images.unsplash.com/photo-1768842407056-6c64fe629c2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBmYWNpbGl0eSUyMGJhc2tldGJhbGwlMjBjb3VydCUyMGluZG9vcnxlbnwxfHx8fDE3NzE0MDIyNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    titleEn: "Book Your Court Now",
    linkUrl: "/browse/basketball",
    buttonText: "Book Now",
    buttonUrl: "/browse/basketball",
    active: true,
    sortOrder: 1,
  },
  {
    id: "b2",
    image:
      "https://images.unsplash.com/photo-1767731053668-c370c651bc91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NjZXIlMjBmb290YmFsbCUyMHRyYWluaW5nJTIwb3V0ZG9vciUyMGZpZWxkfGVufDF8fHx8MTc3MTQwMjI3Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    titleEn: "Football Training Special",
    linkUrl: "/promotions/football",
    buttonText: "Learn More",
    buttonUrl: "/promotions/football",
    active: true,
    sortOrder: 2,
  },
  {
    id: "b3",
    image:
      "https://images.unsplash.com/photo-1761049862641-16616dea7b32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2ltbWluZyUyMHBvb2wlMjByZWNyZWF0aW9uJTIwY2VudGVyfGVufDF8fHx8MTc3MTQwMjI3Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    titleEn: "Summer Swimming Deals",
    linkUrl: "/browse/swimming",
    buttonText: "View Deals",
    buttonUrl: "/browse/swimming",
    active: false,
    sortOrder: 3,
  },
  {
    id: "b4",
    image:
      "https://images.unsplash.com/photo-1761927055615-f59ae714385b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZW5uaXMlMjBjb3VydCUyMHNwb3J0JTIwc3VtbWVyfGVufDF8fHx8MTc3MTQwMjI3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    titleEn: "Tennis Lessons Available",
    linkUrl: "/browse/tennis",
    buttonText: "Sign Up",
    buttonUrl: "/browse/tennis",
    active: true,
    sortOrder: 4,
  },
  {
    id: "b5",
    image:
      "https://images.unsplash.com/photo-1761971975769-97e598bf526b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZ3ltJTIwd29ya291dCUyMG1vZGVybnxlbnwxfHx8fDE3NzEzMDQ1MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    titleEn: "Join Our Fitness Programs",
    linkUrl: "/trainings/fitness",
    buttonText: "Join Now",
    buttonUrl: "/trainings/fitness",
    active: true,
    sortOrder: 5,
  },
];

// ─── Defaults ───────────────────────────────────────────────

const EMPTY_BANNER: Omit<Banner, "id" | "sortOrder"> = {
  image: "",
  titleEn: "",
  linkUrl: "",
  buttonText: "",
  buttonUrl: "",
  active: true,
};

interface FormErrors {
  image?: string;
  titleEn?: string;
}

// ─── Component ──────────────────────────────────────────────

export function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  // ─── Modal open/close ──────────────────────────────────

  const openNew = () => {
    const maxSort = Math.max(0, ...banners.map((b) => b.sortOrder));
    setEditingBanner({
      ...EMPTY_BANNER,
      id: `b${Date.now()}`,
      sortOrder: maxSort + 1,
    });
    setIsNew(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner({ ...banner });
    setIsNew(false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setFormErrors({});
  };

  // ─── Form changes ─────────────────────────────────────

  const updateField = <K extends keyof Banner>(key: K, value: Banner[K]) => {
    if (!editingBanner) return;
    setEditingBanner({ ...editingBanner, [key]: value });
    if (key === "image" || key === "titleEn") {
      setFormErrors((p) => ({ ...p, [key]: undefined }));
    }
  };

  // ─── Image upload ─────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG or WebP images are supported");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateField("image", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Validate + Save ─────────────────────────────────

  const validateAndSave = () => {
    if (!editingBanner) return;
    const errs: FormErrors = {};
    if (!editingBanner.image) errs.image = "Please upload a banner image";
    if (!editingBanner.titleEn.trim()) errs.titleEn = "Title (EN) is required";
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    if (isNew) {
      setBanners((p) => [...p, editingBanner]);
    } else {
      setBanners((p) => p.map((b) => (b.id === editingBanner.id ? editingBanner : b)));
    }
    toast.success(isNew ? "Banner created" : "Banner updated");
    closeModal();
  };

  // ─── Delete ───────────────────────────────────��───────

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setBanners((p) => p.filter((b) => b.id !== deleteTarget.id));
    toast.success("Banner deleted");
    setDeleteTarget(null);
    closeModal();
  };

  // ─── Toggle status ────────────────────────────────────

  const toggleStatus = (id: string) => {
    setBanners((p) =>
      p.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  // ─── Drag & Drop sort ─────────────────────────────────

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setBanners(reordered.map((b, i) => ({ ...b, sortOrder: i + 1 })));
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {banners.length} banner{banners.length !== 1 && "s"} &middot;{" "}
            {banners.filter((b) => b.active).length} active
          </p>
        </div>
        <Button onClick={openNew} className="bg-[#003B95] hover:bg-[#002a6b] gap-2">
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((banner, idx) => (
          <div
            key={banner.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => {
              setDragIdx(null);
              setDragOverIdx(null);
            }}
            className={cn(
              "group relative rounded-lg border bg-white overflow-hidden transition-all cursor-pointer",
              dragOverIdx === idx && dragIdx !== idx && "ring-2 ring-[#003B95]",
              dragIdx === idx && "opacity-50",
              !banner.active && "opacity-70"
            )}
            onClick={() => openEdit(banner)}
          >
            {/* Image */}
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
              <img
                src={banner.image}
                alt={banner.titleEn}
                className="w-full h-full object-cover"
              />
              {/* Title Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                <p className="text-white text-sm truncate">{banner.titleEn}</p>
              </div>
              {/* Sort badge */}
              <div className="absolute top-2 left-2">
                <Badge
                  variant="secondary"
                  className="bg-black/50 text-white border-0 text-[10px] backdrop-blur-sm"
                >
                  #{banner.sortOrder}
                </Badge>
              </div>
              {/* Button text badge */}
              {banner.buttonText && (
                <div className="absolute top-2 right-2">
                  <Badge
                    variant="secondary"
                    className="bg-white/90 text-gray-700 border-0 text-[10px]"
                  >
                    {banner.buttonText}
                  </Badge>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <div
                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 text-gray-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-4 w-4" />
                </div>
                <span className="text-xs text-gray-500 truncate max-w-[140px]">
                  {banner.titleEn}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(banner);
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-[#003B95]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={banner.active}
                    onCheckedChange={() => toggleStatus(banner.id)}
                    className="data-[state=checked]:bg-[#003B95]"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No banners yet</p>
          <Button onClick={openNew} variant="outline" className="mt-3 gap-2" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Add First Banner
          </Button>
        </div>
      )}

      {/* ─── Add/Edit Modal ─────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Add Banner" : "Edit Banner"}</DialogTitle>
            <DialogDescription>
              {isNew
                ? "Create a new homepage carousel banner."
                : "Update banner details."}
            </DialogDescription>
          </DialogHeader>

          {editingBanner && (
            <div className="space-y-5 py-2">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>
                  Banner Image <span className="text-red-500">*</span>
                </Label>
                {editingBanner.image ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-gray-50">
                    <img
                      src={editingBanner.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => updateField("image", "")}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-[#003B95] hover:bg-blue-50/30 transition-colors",
                      formErrors.image ? "border-red-400 bg-red-50/30" : "border-gray-300"
                    )}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">
                      16:9 ratio &middot; JPEG, PNG, WebP
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {formErrors.image && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.image}
                  </p>
                )}
              </div>

              {/* Title EN */}
              <div className="space-y-2">
                <Label>
                  Title (EN) <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={editingBanner.titleEn}
                  onChange={(e) => updateField("titleEn", e.target.value)}
                  placeholder="e.g. Book Your Court Now"
                  className={cn(formErrors.titleEn && "border-red-400")}
                />
                {formErrors.titleEn && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.titleEn}
                  </p>
                )}
              </div>

              {/* Link URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-gray-400" />
                  Link URL
                </Label>
                <Input
                  value={editingBanner.linkUrl}
                  onChange={(e) => updateField("linkUrl", e.target.value)}
                  placeholder="/browse/category or https://..."
                />
              </div>

              {/* Button Text */}
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={editingBanner.buttonText}
                  onChange={(e) => updateField("buttonText", e.target.value)}
                  placeholder='e.g. "Book Now", "Learn More"'
                />
              </div>

              {/* Button URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                  Button URL
                </Label>
                <Input
                  value={editingBanner.buttonUrl}
                  onChange={(e) => updateField("buttonUrl", e.target.value)}
                  placeholder="/promotions/summer or https://..."
                />
              </div>

              {/* Status + Sort */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-3 h-9">
                    <Switch
                      checked={editingBanner.active}
                      onCheckedChange={(v) => updateField("active", v)}
                      className="data-[state=checked]:bg-[#003B95]"
                    />
                    <span className="text-sm text-gray-600">
                      {editingBanner.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingBanner.sortOrder}
                    onChange={(e) =>
                      updateField("sortOrder", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <div>
              {!isNew && (
                <button
                  onClick={() => {
                    setDeleteTarget(editingBanner);
                  }}
                  className="text-sm text-red-500 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Banner
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={validateAndSave}
                className="bg-[#003B95] hover:bg-[#002a6b]"
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The banner will be permanently
              removed from the carousel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
