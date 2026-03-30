import { useState, useRef } from "react";
import { Plus, ChevronDown, ChevronRight, Download, FileText, FileSpreadsheet, FileDown, Database } from "lucide-react";
import { MasterDataTable } from "./MasterDataTable";
import { AddEditModal, DeactivationModal } from "./MasterDataModals";
import { AdminLayout } from "../AdminLayout";
import { cn } from "../../../../lib/utils";
import { toast } from "sonner";
import {
  MasterDataEntity,
  MasterDataCategory,
  CATEGORIES
} from "./types";

// ─── Audit Trail Types & Mock Data ───────────────────────────────────────────

interface AuditEntry {
  id: string;
  dateTime: string;
  user: string;
  action: "Created" | "Updated" | "Deleted";
  item: string;
  details: string;
}

const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: "AUD-001",
    dateTime: "2026-03-19 14:32:05",
    user: "admin@playzoon.com",
    action: "Created",
    item: "Football (Sports)",
    details: "New sport created with name (EN): Football, name (AR): كرة القدم",
  },
  {
    id: "AUD-002",
    dateTime: "2026-03-18 11:15:42",
    user: "admin@playzoon.com",
    action: "Updated",
    item: "Indoor Court (Court Types)",
    details: "Name (EN): Indoor Arena → Indoor Court",
  },
  {
    id: "AUD-003",
    dateTime: "2026-03-17 09:48:20",
    user: "manager@playzoon.com",
    action: "Deleted",
    item: "Badminton (Sports)",
    details: "Sport deactivated and removed from active listings",
  },
  {
    id: "AUD-004",
    dateTime: "2026-03-16 16:22:10",
    user: "admin@playzoon.com",
    action: "Updated",
    item: "Main Station (Court Stations)",
    details: "Status: Active → Inactive",
  },
  {
    id: "AUD-005",
    dateTime: "2026-03-15 08:05:33",
    user: "manager@playzoon.com",
    action: "Created",
    item: "Synthetic Turf (Court Types)",
    details: "New court type created with name (EN): Synthetic Turf, name (AR): عشب صناعي",
  },
];

// ─── Export Formats ──────────────────────────────────────────────────────────

const EXPORT_FORMATS = [
  { label: "TXT", icon: FileText },
  { label: "XLS", icon: FileSpreadsheet },
  { label: "CSV", icon: FileDown },
  { label: "PDF", icon: FileText },
  { label: "SQL", icon: Database },
] as const;

// Mock Data Generator
const generateMockData = (category: MasterDataCategory): MasterDataEntity[] => {
  const count = 15;
  const data: MasterDataEntity[] = [];
  
  for (let i = 1; i <= count; i++) {
    const isEven = i % 2 === 0;
    let nameEn = `${category} ${i}`;
    let nameAr = `${category} (AR) ${i}`;
    
    // More realistic names
    if (category === "Sports") {
      const sports = ["Football", "Padel", "Tennis", "Basketball", "Swimming", "Volleyball"];
      nameEn = sports[(i-1) % sports.length] || `Sport ${i}`;
      nameAr = `رياضة ${i}`;
    } else if (category === "Court Types") {
      const courtTypes = ["Indoor Court", "Outdoor Court", "Grass Court", "Clay Court", "Hardcourt", "Synthetic Turf"];
      nameEn = courtTypes[(i-1) % courtTypes.length] || `Court Type ${i}`;
      nameAr = `نوع الملعب ${i}`;
    } else if (category === "Court Stations") {
      const stations = ["Main Station", "North Wing", "South Wing", "East Court", "West Court", "VIP Section"];
      nameEn = stations[(i-1) % stations.length] || `Station ${i}`;
      nameAr = `محطة ${i}`;
    }

    data.push({
      id: `${category.substring(0, 3).toUpperCase()}-${1000 + i}`,
      nameEn,
      nameAr,
      status: isEven ? "inactive" : "active",
      createdAt: "2023-01-15",
      updatedAt: "2023-06-20",
    });
  }
  return data;
};

export function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<MasterDataCategory>("Sports");
  const [data, setData] = useState<Record<MasterDataCategory, MasterDataEntity[]>>(() => {
    // Initialize mock data for all categories
    const initialData: any = {};
    CATEGORIES.forEach(cat => {
      initialData[cat] = generateMockData(cat);
    });
    return initialData;
  });

  // Filter & Export States
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  // Modal States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataEntity | null>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [itemToDeactivate, setItemToDeactivate] = useState<MasterDataEntity | null>(null);

  // Filtered data based on status
  const filteredByStatus = statusFilter === "all"
    ? data[activeTab]
    : data[activeTab].filter(item => item.status === statusFilter);

  // Export handler
  const handleExport = (format: string) => {
    toast.success(`Exported as ${format}`);
    setExportOpen(false);
  };

  // Actions
  const handleAdd = () => {
    setEditingItem(null);
    setIsAddEditOpen(true);
  };

  const handleEdit = (item: MasterDataEntity) => {
    setEditingItem(item);
    setIsAddEditOpen(true);
  };

  const handleToggleStatus = (item: MasterDataEntity) => {
    if (item.status === "active") {
      setItemToDeactivate(item);
      setIsDeactivateOpen(true);
    } else {
      // Activate immediately
      updateItemStatus(item.id, "active");
      toast.success(`${item.nameEn} activated successfully`);
    }
  };

  const updateItemStatus = (id: string, status: "active" | "inactive") => {
    setData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(item => 
        item.id === id ? { ...item, status, updatedAt: new Date().toISOString().split('T')[0] } : item
      )
    }));
  };

  const handleSave = async (formData: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    if (editingItem) {
      // Update
      setData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(item => 
          item.id === editingItem.id 
            ? { ...item, ...formData, updatedAt: new Date().toISOString().split('T')[0] } 
            : item
        )
      }));
      toast.success(`${activeTab} updated successfully`);
    } else {
      // Create
      const newItem: MasterDataEntity = {
        id: `${activeTab.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setData(prev => ({
        ...prev,
        [activeTab]: [newItem, ...prev[activeTab]]
      }));
      toast.success(`New ${activeTab} added successfully`);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!itemToDeactivate) return;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateItemStatus(itemToDeactivate.id, "inactive");
    toast.success(`${itemToDeactivate.nameEn} deactivated`);
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="text-sm font-medium text-gray-500 mb-1">
              <ol className="list-none p-0 inline-flex">
                <li className="flex items-center">
                  <a href="#" className="hover:text-gray-700">Admin</a>
                  <span className="mx-2">/</span>
                </li>
                <li className="flex items-center">
                  <span className="text-gray-900">Category Management</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Category Management
            </h1>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#003B95] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#002d73] focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 transition-colors w-full sm:w-auto"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add New {activeTab}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={cn(
                  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === category
                    ? "border-[#003B95] text-[#003B95]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
                aria-current={activeTab === category ? "page" : undefined}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>

        {/* Filter & Export Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="block w-40 rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 shadow-sm focus:border-[#003B95] focus:outline-none focus:ring-1 focus:ring-[#003B95]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className={cn("h-4 w-4 transition-transform", exportOpen && "rotate-180")} />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {EXPORT_FORMATS.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => handleExport(label)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-gray-400" />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <MasterDataTable
          category={activeTab}
          data={filteredByStatus}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />

        {/* ─── Audit Trail (Collapsible) ─────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
          <button
            onClick={() => setAuditOpen(!auditOpen)}
            className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-base font-semibold text-[#111827]">Audit Trail</h3>
            {auditOpen ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {auditOpen && (
            <div className="border-t border-[#E5E7EB]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E5E7EB]">
                  <thead className="bg-[#F9FAFB]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E5E7EB]">
                    {MOCK_AUDIT_ENTRIES.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.dateTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.user}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              entry.action === "Created" && "bg-green-100 text-green-800",
                              entry.action === "Updated" && "bg-blue-100 text-blue-800",
                              entry.action === "Deleted" && "bg-red-100 text-red-800"
                            )}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {entry.item}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={entry.details}>
                          {entry.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      {/* Modals */}
      <AddEditModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
        category={activeTab}
      />

      <DeactivationModal
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleDeactivateConfirm}
        item={itemToDeactivate}
        category={activeTab}
        impactCount={Math.floor(Math.random() * 50) + 5} // Mock impact count
      />
      </div>
  );
}
