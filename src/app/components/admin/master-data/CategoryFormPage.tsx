import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "../../../../lib/utils";
import ImageCropper from "../../ImageCropper";
import { CROP_PRESETS } from "../../../../lib/cropPresets";
import { MasterDataEntity, MasterDataCategory } from "./types";
import { adminService } from "../../../../services/admin.service";

// ---------------------------------------------------------------------------
// Mock data (mirrors MasterDataPage generator so edit mode can resolve an id)
// ---------------------------------------------------------------------------
const buildMockLookup = (): Record<string, MasterDataEntity> => {
  const lookup: Record<string, MasterDataEntity> = {};
  const categories: MasterDataCategory[] = [
    "Sports",
    "Court Types",
    "Court Stations",
  ];

  categories.forEach((category) => {
    for (let i = 1; i <= 15; i++) {
      const isEven = i % 2 === 0;
      let nameEn = `${category} ${i}`;
      let nameAr = `${category} (AR) ${i}`;

      if (category === "Sports") {
        const sports = [
          "Football",
          "Padel",
          "Tennis",
          "Basketball",
          "Swimming",
          "Volleyball",
        ];
        nameEn = sports[(i - 1) % sports.length] || `Sport ${i}`;
        nameAr = `\u0631\u064A\u0627\u0636\u0629 ${i}`;
      } else if (category === "Court Types") {
        const courtTypes = [
          "Indoor Court",
          "Outdoor Court",
          "Grass Court",
          "Clay Court",
          "Hardcourt",
          "Synthetic Turf",
        ];
        nameEn = courtTypes[(i - 1) % courtTypes.length] || `Court Type ${i}`;
        nameAr = `\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0639\u0628 ${i}`;
      } else if (category === "Court Stations") {
        const stations = [
          "Main Station",
          "North Wing",
          "South Wing",
          "East Court",
          "West Court",
          "VIP Section",
        ];
        nameEn = stations[(i - 1) % stations.length] || `Station ${i}`;
        nameAr = `\u0645\u062D\u0637\u0629 ${i}`;
      }

      const id = `${category.substring(0, 3).toUpperCase()}-${1000 + i}`;
      lookup[id] = {
        id,
        nameEn,
        nameAr,
        status: isEven ? "inactive" : "active",
        createdAt: "2023-01-15",
        updatedAt: "2023-06-20",
        sortOrder: i,
        ...(category === "Sports" ? { icon: "" } : {}),
        ...(category === "Court Types" || category === "Court Stations"
          ? { description: `Sample description for ${nameEn}` }
          : {}),
      };
    }
  });

  return lookup;
};

const MOCK_LOOKUP = buildMockLookup();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const categorySlugToLabel = (slug: string): MasterDataCategory => {
  const map: Record<string, MasterDataCategory> = {
    sports: "Sports",
    "court-types": "Court Types",
    "court-stations": "Court Stations",
  };
  return map[slug] || ("Sports" as MasterDataCategory);
};

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_ICON_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_ICON_TYPES = ["image/jpeg", "image/png"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CategoryFormPage() {
  const { category: categorySlug, id } = useParams<{
    category: string;
    id: string;
  }>();
  const navigate = useNavigate();

  const categoryLabel = categorySlugToLabel(categorySlug || "");
  const isEditMode = Boolean(id);

  // ---- Form state ----------------------------------------------------------
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [sortOrder, setSortOrder] = useState<string>("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  // Metadata (edit mode)
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** User removed icon or replaced file — controls PATCH icon_url null vs omit. */
  const [iconRemoved, setIconRemoved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image cropper state ─────────────────────────────────
  const [cropRawSrc, setCropRawSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  // ---- Derived booleans ----------------------------------------------------
  const isSports = categoryLabel === "Sports";
  const showDescription =
    categoryLabel === "Court Types" || categoryLabel === "Court Stations";

  // ---- Load existing entity in edit mode -----------------------------------
  useEffect(() => {
    if (!isEditMode || !id) return;

    if (isSports) {
      let cancelled = false;
      setLoadError(null);
      (async () => {
        try {
          const res = await adminService.getMasterDataItem("sports", id);
          const row = (res as { data?: Record<string, unknown> })?.data ?? res;
          if (cancelled || !row || typeof row !== "object") return;
          setNameEn(String(row.name_en ?? row.name ?? ""));
          setStatus(row.status === "inactive" ? "inactive" : "active");
          const iu = row.icon_url ? String(row.icon_url) : null;
          setIconPreview(iu);
          setIconFile(null);
          setIconRemoved(false);
          const cr = row.created_at;
          const up = row.updated_at;
          setCreatedAt(
            cr ? String(cr).split("T")[0] : null,
          );
          setUpdatedAt(
            up ? String(up).split("T")[0] : null,
          );
        } catch {
          if (!cancelled) {
            setLoadError("Failed to load sport.");
            toast.error("Failed to load sport.");
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    const entity = MOCK_LOOKUP[id];
    if (entity) {
      setNameEn(entity.nameEn);
      setNameAr(entity.nameAr);
      setStatus(entity.status);
      setSortOrder(entity.sortOrder != null ? String(entity.sortOrder) : "");
      setDescription(entity.description || "");
      setCreatedAt(entity.createdAt);
      setUpdatedAt(entity.updatedAt);
      if (entity.icon) {
        setIconPreview(entity.icon);
      }
    }
  }, [isEditMode, id, isSports]);

  useEffect(() => {
    if (!isSports || isEditMode) return;
    setNameEn("");
    setNameAr("");
    setDescription("");
    setStatus("active");
    setSortOrder("");
    setIconFile(null);
    setIconPreview(null);
    setIconRemoved(false);
    setCreatedAt(null);
    setUpdatedAt(null);
    setErrors({});
    setLoadError(null);
  }, [isSports, isEditMode, categorySlug]);

  // ---- Validation ----------------------------------------------------------
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nameEn.trim()) {
      newErrors.nameEn = "Name (English) is required.";
    } else if (nameEn.length > MAX_NAME_LENGTH) {
      newErrors.nameEn = `Maximum ${MAX_NAME_LENGTH} characters allowed.`;
    }

    if (!isSports) {
      if (!nameAr.trim()) {
        newErrors.nameAr = "Name (Arabic) is required.";
      } else if (nameAr.length > MAX_NAME_LENGTH) {
        newErrors.nameAr = `Maximum ${MAX_NAME_LENGTH} characters allowed.`;
      }
    }

    if (isSports && iconFile) {
      if (iconFile.size > MAX_ICON_SIZE_BYTES) {
        newErrors.icon = "Icon file must be 2 MB or less.";
      }
      if (!ACCEPTED_ICON_TYPES.includes(iconFile.type)) {
        newErrors.icon = "Only JPEG and PNG files are accepted.";
      }
    }

    if (showDescription && description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Maximum ${MAX_DESCRIPTION_LENGTH} characters allowed.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---- Handlers ------------------------------------------------------------
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > MAX_ICON_SIZE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        icon: "Icon file must be 2 MB or less.",
      }));
      return;
    }
    if (!ACCEPTED_ICON_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        icon: "Only JPEG and PNG files are accepted.",
      }));
      return;
    }

    setErrors((prev) => {
      const { icon, ...rest } = prev;
      return rest;
    });

    const reader = new FileReader();
    reader.onload = () => {
      setCropRawSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleIconCropComplete = (blob: Blob, previewUrl: string) => {
    const croppedFile = new File([blob], "icon-cropped.jpg", {
      type: "image/jpeg",
    });
    setIconFile(croppedFile);
    setIconPreview(previewUrl);
    setIconRemoved(false);
  };

  const removeIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setIconRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (isSports) {
        const body: Record<string, unknown> = {
          name: nameEn.trim(),
          status,
        };
        if (iconFile) {
          const upRes = await adminService.uploadSportIcon(iconFile);
          const uploaded = (upRes as { data?: { url?: string } })?.data ?? upRes;
          const url = (uploaded as { url?: string })?.url;
          if (!url) throw new Error("NO_ICON_URL");
          body.icon_url = url;
        } else if (iconRemoved && isEditMode) {
          body.icon_url = null;
        }

        if (isEditMode && id) {
          await adminService.patchMasterDataItem("sports", id, body);
        } else {
          await adminService.createMasterDataItem("sports", body);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      toast.success(
        isEditMode
          ? `${categoryLabel} updated successfully`
          : `New ${categoryLabel} created successfully`,
      );
      navigate("/master-data");
    } catch (err) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        msg ||
          (isSports ? "Could not save sport. Check image size and format." : "Save failed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isSports && id) {
        await adminService.deleteMasterDataItem("sports", id);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setShowDeleteModal(false);
      toast.success(`${categoryLabel} deleted successfully`);
      navigate("/master-data");
    } catch (err) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(msg || "Could not delete this item.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate("/master-data");
  };

  // ---- Render --------------------------------------------------------------
  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Breadcrumb */}
      <nav className="text-sm font-medium text-gray-500 mb-1">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <a href="#" className="hover:text-gray-700">
              Admin
            </a>
            <span className="mx-2">/</span>
          </li>
          <li className="flex items-center">
            <a
              href="#"
              className="hover:text-gray-700"
              onClick={(e) => {
                e.preventDefault();
                navigate("/master-data");
              }}
            >
              Category Management
            </a>
            <span className="mx-2">/</span>
          </li>
          <li className="flex items-center">
            <span className="hover:text-gray-700">{categoryLabel}</span>
            <span className="mx-2">/</span>
          </li>
          <li className="flex items-center">
            <span className="text-gray-900">{isEditMode ? "Edit" : "New"}</span>
          </li>
        </ol>
      </nav>

      {loadError && (
        <div className="max-w-[720px] mx-auto rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Back to Category Management"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
          {isEditMode ? `Edit ${categoryLabel}` : `New ${categoryLabel}`}
        </h1>
      </div>

      {/* Form card */}
      <div className="max-w-[720px] mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            {/* Name (English) / Sport name */}
            <div>
              <label
                htmlFor="nameEn"
                className="block text-sm font-medium text-[#111827]"
              >
                {isSports ? (
                  <>
                    Sport Name <span className="text-red-500">*</span>
                  </>
                ) : (
                  <>
                    Name (English) <span className="text-red-500">*</span>
                  </>
                )}
              </label>
              <div className="mt-1">
                <input
                  id="nameEn"
                  type="text"
                  maxLength={MAX_NAME_LENGTH}
                  value={nameEn}
                  onChange={(e) => {
                    setNameEn(e.target.value);
                    if (errors.nameEn)
                      setErrors((prev) => {
                        const { nameEn, ...rest } = prev;
                        return rest;
                      });
                  }}
                  placeholder="e.g. Football"
                  className={cn(
                    "block w-full rounded-md border shadow-sm focus:border-[#003B95] focus:ring-[#003B95] sm:text-sm px-3 py-2",
                    errors.nameEn ? "border-red-300" : "border-gray-300",
                  )}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.nameEn ? (
                    <p className="text-sm text-red-600">{errors.nameEn}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-[#6B7280]">
                    {nameEn.length}/{MAX_NAME_LENGTH}
                  </span>
                </div>
              </div>
            </div>

            {/* Name (Arabic) — not used for Sports */}
            {!isSports && (
              <div>
                <label
                  htmlFor="nameAr"
                  className="block text-sm font-medium text-[#111827] text-right"
                >
                  <span className="text-red-500">*</span> (AR) الاسم
                </label>
                <div className="mt-1">
                  <input
                    id="nameAr"
                    type="text"
                    dir="rtl"
                    maxLength={MAX_NAME_LENGTH}
                    value={nameAr}
                    onChange={(e) => {
                      setNameAr(e.target.value);
                      if (errors.nameAr)
                        setErrors((prev) => {
                          const { nameAr, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="\u0645\u062B\u0627\u0644: \u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645"
                    className={cn(
                      "block w-full rounded-md border shadow-sm focus:border-[#003B95] focus:ring-[#003B95] sm:text-sm px-3 py-2 font-arabic",
                      errors.nameAr ? "border-red-300" : "border-gray-300",
                    )}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    {errors.nameAr ? (
                      <p className="text-sm text-red-600 text-right">
                        {errors.nameAr}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-[#6B7280]">
                      {nameAr.length}/{MAX_NAME_LENGTH}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Icon Upload (Sports only) */}
            {isSports && (
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">
                  Icon
                </label>
                <p className="text-xs text-[#6B7280] mb-2">
                  Accepted formats: JPEG, PNG. Max size: 2 MB.
                </p>

                {iconPreview ? (
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={iconPreview}
                        alt="Icon preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeIcon}
                      className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-0.5 hover:bg-red-600 transition-colors shadow-sm"
                      title="Remove icon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-[#6B7280] mb-2" />
                    <span className="text-sm font-medium text-[#003B95]">
                      Click to upload
                    </span>
                    <span className="text-xs text-[#6B7280] mt-1">
                      JPEG, PNG up to 2 MB
                    </span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleIconChange}
                  className="hidden"
                />

                {errors.icon && (
                  <p className="mt-1 text-sm text-red-600">{errors.icon}</p>
                )}
              </div>
            )}

            {/* Description (Court Types & Court Stations only) */}
            {showDescription && (
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[#111827]"
                >
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={4}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description)
                        setErrors((prev) => {
                          const { description, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder={`Describe this ${categoryLabel.toLowerCase()}...`}
                    className={cn(
                      "block w-full rounded-md border shadow-sm focus:border-[#003B95] focus:ring-[#003B95] sm:text-sm px-3 py-2 resize-none",
                      errors.description ? "border-red-300" : "border-gray-300",
                    )}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    {errors.description ? (
                      <p className="text-sm text-red-600">
                        {errors.description}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-[#6B7280]">
                      {description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#111827]">
                  Status
                </span>
                <span className="text-sm text-[#6B7280]">
                  {status === "active"
                    ? "This item is visible on the platform."
                    : "This item is hidden from the platform."}
                </span>
              </div>
              <button
                type="button"
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2",
                  status === "active" ? "bg-[#003B95]" : "bg-gray-200",
                )}
                role="switch"
                aria-checked={status === "active"}
                onClick={() =>
                  setStatus((prev) =>
                    prev === "active" ? "inactive" : "active",
                  )
                }
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    status === "active" ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>

            {/* Sort Order — not used for Sports */}
            {!isSports && (
              <div>
                <label
                  htmlFor="sortOrder"
                  className="block text-sm font-medium text-[#111827]"
                >
                  Sort Order
                </label>
                <p className="text-xs text-[#6B7280] mb-1">
                  Optional. Auto-assigned if left empty.
                </p>
                <input
                  id="sortOrder"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="e.g. 1"
                  className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-[#003B95] focus:ring-[#003B95] sm:text-sm px-3 py-2"
                />
              </div>
            )}

            {/* Edit-mode metadata */}
            {isEditMode && (createdAt || updatedAt) && (
              <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
                  Record Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {createdAt && (
                    <div>
                      <span className="block text-xs text-[#6B7280]">
                        Created Date
                      </span>
                      <span className="text-sm text-[#111827]">
                        {format(new Date(createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                  {updatedAt && (
                    <div>
                      <span className="block text-xs text-[#6B7280]">
                        Updated Date
                      </span>
                      <span className="text-sm text-[#111827]">
                        {format(new Date(updatedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Delete (edit only) */}
            <div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <Trash2 className="-ml-0.5 mr-2 h-4 w-4" />
                  Delete
                </button>
              )}
            </div>

            {/* Right: Cancel + Save */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isSaving || (isSports && isEditMode && Boolean(loadError))
                }
                onClick={handleSave}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#003B95] px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#002d73] focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Cropper (for sport icons) ─────────────────── */}
      <ImageCropper
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropRawSrc}
        onCropComplete={handleIconCropComplete}
        {...CROP_PRESETS.profilePhoto}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 sm:p-0 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
              <h3 className="text-lg font-medium text-[#111827]">
                Confirm Deletion
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle
                      className="h-5 w-5 text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      This action cannot be undone
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Are you sure you want to permanently delete{" "}
                        <strong>{nameEn || "this item"}</strong>? All associated
                        data will be removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-row-reverse gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
