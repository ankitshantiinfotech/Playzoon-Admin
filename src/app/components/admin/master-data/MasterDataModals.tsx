import { X, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { cn } from "../../../../lib/utils";
import { MasterDataEntity, MasterDataCategory } from "./types";

// Modal Component
function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-md" 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode; 
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 sm:p-0 backdrop-blur-sm">
      <div className={cn("relative w-full rounded-lg bg-white shadow-xl sm:my-8", maxWidth)}>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h3 className="text-lg font-medium text-[#111827]">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2"
          >
            <span className="sr-only">Close</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Add/Edit Modal
const entitySchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  status: z.enum(["active", "inactive"]),
});

type EntityFormValues = z.infer<typeof entitySchema>;

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EntityFormValues) => Promise<void>;
  initialData?: MasterDataEntity | null;
  category: MasterDataCategory;
}

export function AddEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  category 
}: AddEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<EntityFormValues>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      nameEn: "",
      nameAr: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        nameEn: initialData.nameEn,
        nameAr: initialData.nameAr,
        status: initialData.status,
      });
    } else {
      reset({
        nameEn: "",
        nameAr: "",
        status: "active",
      });
    }
  }, [initialData, reset, isOpen]);

  const onSubmit = async (data: EntityFormValues) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit ${category}` : `Add New ${category}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* English Name */}
          <div>
            <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700">
              Name (EN) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="nameEn"
                className={cn(
                  "block w-full rounded-md border shadow-sm focus:border-[#003B95] focus:ring-[#003B95] sm:text-sm px-3 py-2",
                  errors.nameEn ? "border-red-300" : "border-gray-300"
                )}
                placeholder="e.g. Football"
                {...register("nameEn")}
              />
              {errors.nameEn && (
                <p className="mt-1 text-sm text-red-600">{errors.nameEn.message}</p>
              )}
            </div>
          </div>

          {/* Arabic Name */}
          <div>
            <label htmlFor="nameAr" className="block text-sm font-medium text-gray-700 text-right font-arabic">
              <span className="text-red-500">*</span> (AR) الاسم
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="nameAr"
                dir="rtl"
                className={cn(
                  "block w-full rounded-md border shadow-sm focus:border-[#003B95] focus:ring-[#003B95] sm:text-sm px-3 py-2 font-arabic",
                  errors.nameAr ? "border-red-300" : "border-gray-300"
                )}
                placeholder="مثال: كرة القدم"
                {...register("nameAr")}
              />
              {errors.nameAr && (
                <p className="mt-1 text-sm text-red-600 text-right">{errors.nameAr.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Status</span>
            <span className="text-sm text-gray-500">
              {category} visibility in the platform
            </span>
          </div>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2",
                  field.value === "active" ? "bg-[#003B95]" : "bg-gray-200"
                )}
                role="switch"
                aria-checked={field.value === "active"}
                onClick={() => field.onChange(field.value === "active" ? "inactive" : "active")}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    field.value === "active" ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            )}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#003B95] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#002d73] focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Deactivation Warning Modal
interface DeactivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  item: MasterDataEntity | null;
  category: MasterDataCategory;
  impactCount: number;
}

export function DeactivationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  item, 
  category, 
  impactCount 
}: DeactivationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!item) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Deactivation"
    >
      <div className="space-y-4">
        <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Warning: Cascade Impact
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Deactivating <strong>{item.nameEn}</strong> will affect <strong>{impactCount}</strong> active entities related to this {category.toLowerCase()}.
                </p>
                <p className="mt-2">
                  Existing bookings will not be changed, but new entities cannot select this option.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirm}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {isProcessing ? "Deactivating..." : "Yes, Deactivate"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
