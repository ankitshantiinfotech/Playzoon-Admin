import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Download,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "../../../../lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SimpleMasterDataItem {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  /** Whether the item is associated and cannot be deleted */
  isAssociated?: boolean;
  /** Extra fields stored as key-value pairs */
  extraFields?: Record<string, string>;
}

export interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type?: "text" | "textarea";
}

export interface SimpleMasterDataPageConfig {
  /** Page title, e.g. "Relation Management" */
  title: string;
  /** Subtitle, e.g. "Manage relations for player dependants" */
  subtitle: string;
  /** Breadcrumb label */
  breadcrumbLabel: string;
  /** Singular entity name, e.g. "Relation" */
  entityName: string;
  /** The primary name field config */
  nameField: FieldConfig;
  /** Additional fields beyond the name */
  extraFields?: FieldConfig[];
  /** Message shown when trying to delete an associated item */
  associationWarning: string;
  /** ID prefix for auto-generated IDs, e.g. "REL" */
  idPrefix: string;
}

// ─── Status filter type ──────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "inactive";

// ─── Export format type ──────────────────────────────────────────────────────

type ExportFormat = "TXT" | "XLS" | "CSV" | "PDF" | "SQL";
const EXPORT_FORMATS: ExportFormat[] = ["TXT", "XLS", "CSV", "PDF", "SQL"];

// ─── Modal ───────────────────────────────────────────────────────────────────

function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
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
      <div
        className={cn(
          "relative w-full rounded-lg bg-white shadow-xl sm:my-8",
          maxWidth,
        )}
      >
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

// ─── Main Component ──────────────────────────────────────────────────────────

interface SimpleMasterDataPageProps {
  config: SimpleMasterDataPageConfig;
  initialData: SimpleMasterDataItem[];
}

export function SimpleMasterDataPage({
  config,
  initialData,
}: SimpleMasterDataPageProps) {
  const [data, setData] = useState<SimpleMasterDataItem[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const itemsPerPage = 10;

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SimpleMasterDataItem | null>(
    null,
  );
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [itemToDeactivate, setItemToDeactivate] =
    useState<SimpleMasterDataItem | null>(null);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SimpleMasterDataItem | null>(
    null,
  );

  // Export dropdown
  const [isExportOpen, setIsExportOpen] = useState(false);

  // ── Filtering ──────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      // Also search extra fields
      let matchesExtra = false;
      if (!matchesSearch && item.extraFields) {
        matchesExtra = Object.values(item.extraFields).some((v) =>
          v.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      return (matchesSearch || matchesExtra) && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  // ── Sorting ────────────────────────────────────────────────────────────

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      if (sortConfig.key === "name") {
        aVal = a.name;
        bVal = b.name;
      } else if (sortConfig.key === "status") {
        aVal = a.status;
        bVal = b.status;
      } else if (sortConfig.key === "createdAt") {
        aVal = a.createdAt;
        bVal = b.createdAt;
      } else if (sortConfig.key === "updatedAt") {
        aVal = a.updatedAt;
        bVal = b.updatedAt;
      } else if (sortConfig.key === "id") {
        aVal = a.id;
        bVal = b.id;
      } else {
        aVal = a.extraFields?.[sortConfig.key] ?? "";
        bVal = b.extraFields?.[sortConfig.key] ?? "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // ── Pagination ─────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // ── Actions ────────────────────────────────────────────────────────────

  const handleAdd = () => {
    setEditingItem(null);
    setIsAddEditOpen(true);
  };

  const handleEdit = (item: SimpleMasterDataItem) => {
    setEditingItem(item);
    setIsAddEditOpen(true);
  };

  const handleDelete = (item: SimpleMasterDataItem) => {
    if (item.isAssociated) {
      setItemToDelete(item);
      setIsDeleteWarningOpen(true);
    } else {
      setData((prev) => prev.filter((d) => d.id !== item.id));
      toast.success(`${item.name} deleted successfully`);
    }
  };

  const handleToggleStatus = (item: SimpleMasterDataItem) => {
    if (item.status === "active") {
      setItemToDeactivate(item);
      setIsDeactivateOpen(true);
    } else {
      setData((prev) =>
        prev.map((d) =>
          d.id === item.id
            ? {
                ...d,
                status: "active" as const,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : d,
        ),
      );
      toast.success(`${item.name} activated successfully`);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!itemToDeactivate) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
    setData((prev) =>
      prev.map((d) =>
        d.id === itemToDeactivate.id
          ? {
              ...d,
              status: "inactive" as const,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : d,
      ),
    );
    toast.success(`${itemToDeactivate.name} deactivated`);
  };

  const handleSave = async (formData: Record<string, string>) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const today = new Date().toISOString().split("T")[0];

    if (editingItem) {
      setData((prev) =>
        prev.map((d) =>
          d.id === editingItem.id
            ? {
                ...d,
                name: formData.name,
                status: (formData.status as "active" | "inactive") || d.status,
                updatedAt: today,
                extraFields: extractExtraFields(formData),
              }
            : d,
        ),
      );
      toast.success(`${config.entityName} updated successfully`);
    } else {
      const newItem: SimpleMasterDataItem = {
        id: `${config.idPrefix}-${Math.floor(Math.random() * 10000)}`,
        name: formData.name,
        status: (formData.status as "active" | "inactive") || "active",
        createdAt: today,
        updatedAt: today,
        isAssociated: false,
        extraFields: extractExtraFields(formData),
      };
      setData((prev) => [newItem, ...prev]);
      toast.success(`New ${config.entityName} added successfully`);
    }
  };

  const extractExtraFields = (
    formData: Record<string, string>,
  ): Record<string, string> | undefined => {
    if (!config.extraFields || config.extraFields.length === 0)
      return undefined;
    const extras: Record<string, string> = {};
    for (const field of config.extraFields) {
      if (formData[field.key] !== undefined) {
        extras[field.key] = formData[field.key];
      }
    }
    return Object.keys(extras).length > 0 ? extras : undefined;
  };

  const handleExport = (format: ExportFormat) => {
    toast.success(`Exported as ${format}`);
    setIsExportOpen(false);
  };

  // ── Build table columns ────────────────────────────────────────────────

  const extraFieldKeys = config.extraFields?.map((f) => f.key) ?? [];
  const extraFieldLabels = config.extraFields?.map((f) => f.label) ?? [];

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: config.nameField.label },
    ...extraFieldKeys.map((key, i) => ({ key, label: extraFieldLabels[i] })),
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
  ];

  // ── Status Pill ────────────────────────────────────────────────────────

  const StatusPill = ({ status }: { status: "active" | "inactive" }) => (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "active"
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800",
      )}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="text-sm font-medium text-gray-500 mb-1">
            <ol className="list-none p-0 inline-flex">
              <li className="flex items-center">
                <a href="#" className="hover:text-gray-700">
                  Admin
                </a>
                <span className="mx-2">/</span>
              </li>
              <li className="flex items-center">
                <span className="text-gray-900">{config.breadcrumbLabel}</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            {config.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 transition-colors"
            >
              <Download className="-ml-1 mr-2 h-4 w-4" />
              Export
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            {isExportOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsExportOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {EXPORT_FORMATS.map((format) => (
                      <button
                        key={format}
                        onClick={() => handleExport(format)}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#003B95] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#002d73] focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add {config.entityName}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter tabs */}
        <div className="inline-flex rounded-md shadow-sm">
          {(["all", "active", "inactive"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 text-sm font-medium border transition-colors",
                status === "all" && "rounded-l-md",
                status === "inactive" && "rounded-r-md",
                statusFilter === status
                  ? "bg-[#003B95] text-white border-[#003B95]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                status !== "all" && "-ml-px",
              )}
            >
              {status === "all"
                ? "All"
                : status === "active"
                  ? "Active"
                  : "Inactive"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#003B95] focus:border-[#003B95] sm:text-sm"
            placeholder={`Search ${config.entityName.toLowerCase()}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB]">
            <thead className="bg-[#F9FAFB]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => requestSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform",
                          sortConfig?.key === col.key &&
                            sortConfig.direction === "desc"
                            ? "rotate-180"
                            : "",
                        )}
                      />
                    </div>
                  </th>
                ))}
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E7EB]">
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F9FAFB] transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.name}
                    </td>
                    {extraFieldKeys.map((key) => (
                      <td
                        key={key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {item.extraFields?.[key] ?? "-"}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.updatedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-[#003B95] hover:text-[#002866] p-1 rounded hover:bg-[#EEF0FF] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={cn(
                            "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2",
                            item.status === "active"
                              ? "bg-[#003B95]"
                              : "bg-gray-200",
                          )}
                          role="switch"
                          aria-checked={item.status === "active"}
                          title={
                            item.status === "active" ? "Deactivate" : "Activate"
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              item.status === "active"
                                ? "translate-x-4"
                                : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No data found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {sortedData.length === 0
                    ? 0
                    : (currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, sortedData.length)}
                </span>{" "}
                of <span className="font-medium">{sortedData.length}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return pageNum;
                }).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                    className={cn(
                      "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                      currentPage === pageNum
                        ? "z-10 bg-[#EEF0FF] border-[#003B95] text-[#003B95]"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50",
                    )}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AddEditSimpleModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        config={config}
      />

      {/* Deactivation Modal */}
      <DeactivateSimpleModal
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleDeactivateConfirm}
        item={itemToDeactivate}
        entityName={config.entityName}
      />

      {/* Delete Warning Modal (for associated items) */}
      <DeleteWarningModal
        isOpen={isDeleteWarningOpen}
        onClose={() => setIsDeleteWarningOpen(false)}
        item={itemToDelete}
        warningMessage={config.associationWarning}
      />
    </div>
  );
}

// ─── Add/Edit Modal ──────────────────────────────────────────────────────────

function AddEditSimpleModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  config,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string>) => Promise<void>;
  editingItem: SimpleMasterDataItem | null;
  config: SimpleMasterDataPageConfig;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build zod schema dynamically
  const schemaShape: Record<string, z.ZodTypeAny> = {
    name: config.nameField.required
      ? z.string().min(1, `${config.nameField.label} is required`)
      : z.string(),
    status: z.enum(["active", "inactive"]),
  };

  if (config.extraFields) {
    for (const field of config.extraFields) {
      schemaShape[field.key] = field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string();
    }
  }

  const schema = z.object(schemaShape);

  const defaultValues: Record<string, string> = {
    name: "",
    status: "active",
  };
  if (config.extraFields) {
    for (const field of config.extraFields) {
      defaultValues[field.key] = "";
    }
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (editingItem) {
      const values: Record<string, string> = {
        name: editingItem.name,
        status: editingItem.status,
      };
      if (config.extraFields && editingItem.extraFields) {
        for (const field of config.extraFields) {
          values[field.key] = editingItem.extraFields[field.key] ?? "";
        }
      }
      reset(values);
    } else {
      reset(defaultValues);
    }
  }, [editingItem, reset, isOpen]);

  const onSubmit = async (data: Record<string, string>) => {
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
      title={
        editingItem
          ? `Edit ${config.entityName}`
          : `Add New ${config.entityName}`
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Primary name field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            {config.nameField.label}{" "}
            {config.nameField.required && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              className={cn(
                "block w-full rounded-md border shadow-sm focus:border-[#003B95] focus:ring-[#003B95] sm:text-sm px-3 py-2",
                errors.name ? "border-red-300" : "border-gray-300",
              )}
              placeholder={config.nameField.placeholder}
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name.message as string}
              </p>
            )}
          </div>
        </div>

        {/* Extra fields */}
        {config.extraFields?.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="block text-sm font-medium text-gray-700"
            >
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1">
              {field.type === "textarea" ? (
                <textarea
                  id={field.key}
                  rows={3}
                  className={cn(
                    "block w-full rounded-md border shadow-sm focus:border-[#003B95] focus:ring-[#003B95] sm:text-sm px-3 py-2",
                    errors[field.key] ? "border-red-300" : "border-gray-300",
                  )}
                  placeholder={field.placeholder}
                  {...register(field.key)}
                />
              ) : (
                <input
                  type="text"
                  id={field.key}
                  className={cn(
                    "block w-full rounded-md border shadow-sm focus:border-[#003B95] focus:ring-[#003B95] sm:text-sm px-3 py-2",
                    errors[field.key] ? "border-red-300" : "border-gray-300",
                  )}
                  placeholder={field.placeholder}
                  {...register(field.key)}
                />
              )}
              {errors[field.key] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[field.key]?.message as string}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Status Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Status</span>
            <span className="text-sm text-gray-500">
              {config.entityName} visibility in the platform
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
                  field.value === "active" ? "bg-[#003B95]" : "bg-gray-200",
                )}
                role="switch"
                aria-checked={field.value === "active"}
                onClick={() =>
                  field.onChange(
                    field.value === "active" ? "inactive" : "active",
                  )
                }
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    field.value === "active"
                      ? "translate-x-5"
                      : "translate-x-0",
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

// ─── Deactivation Modal ──────────────────────────────────────────────────────

function DeactivateSimpleModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  entityName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  item: SimpleMasterDataItem | null;
  entityName: string;
}) {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deactivation">
      <div className="space-y-4">
        <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle
                className="h-5 w-5 text-amber-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Warning: Deactivation
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Are you sure you want to deactivate{" "}
                  <strong>{item.name}</strong>? This {entityName.toLowerCase()}{" "}
                  will no longer be available for selection.
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

// ─── Delete Warning Modal (association check) ────────────────────────────────

function DeleteWarningModal({
  isOpen,
  onClose,
  item,
  warningMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: SimpleMasterDataItem | null;
  warningMessage: string;
}) {
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cannot Delete">
      <div className="space-y-4">
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
                Deletion Not Allowed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  <strong>{item.name}</strong> cannot be deleted.{" "}
                  {warningMessage}
                </p>
                <p className="mt-2">
                  You can deactivate it instead to hide it from new selections.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 sm:mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 sm:text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}
