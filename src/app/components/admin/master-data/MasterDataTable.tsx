import { 
  Pencil, 
  Trash2, 
  Search, 
  ChevronDown, 
  Plus, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "../../../../lib/utils";
import { 
  MasterDataEntity, 
  MasterDataCategory, 
} from "./types";

interface MasterDataTableProps {
  data: MasterDataEntity[];
  category: MasterDataCategory;
  onEdit: (item: MasterDataEntity) => void;
  onToggleStatus: (item: MasterDataEntity) => void;
}

export function MasterDataTable({ 
  data, 
  category,
  onEdit, 
  onToggleStatus 
}: MasterDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: keyof MasterDataEntity; 
    direction: "asc" | "desc" 
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameAr.includes(searchTerm)
    );
  }, [data, searchTerm]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      // @ts-ignore
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      // @ts-ignore
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const requestSort = (key: keyof MasterDataEntity) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const StatusPill = ({ status }: { status: "active" | "inactive" }) => (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      status === "active" 
        ? "bg-green-100 text-green-800" 
        : "bg-gray-100 text-gray-800"
    )}>
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
      {/* Header Actions */}
      <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-[#111827] hidden sm:block">
          {category} List
        </h3>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#003B95] focus:border-[#003B95] sm:text-sm"
            placeholder={`Search ${category}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E7EB]">
          <thead className="bg-[#F9FAFB]">
            <tr>
              {["id", "nameEn", "nameAr", "status", "createdAt", "updatedAt"].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => requestSort(header as keyof MasterDataEntity)}
                >
                  <div className="flex items-center gap-1">
                    {header === "nameEn" ? "Name (EN)" : 
                     header === "nameAr" ? "Name (AR)" : 
                     header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1')}
                    <ChevronDown size={14} className={cn(
                      "transition-transform",
                      sortConfig?.key === header && sortConfig.direction === "desc" ? "rotate-180" : ""
                    )} />
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
                    {item.nameEn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-arabic" dir="rtl">
                    {item.nameAr}
                  </td>
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
                        onClick={() => onEdit(item)}
                        className="text-[#003B95] hover:text-[#002866] p-1 rounded hover:bg-[#EEF0FF] transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      
                      <button
                        onClick={() => onToggleStatus(item)}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:ring-offset-2",
                          item.status === "active" ? "bg-[#003B95]" : "bg-gray-200"
                        )}
                        role="switch"
                        aria-checked={item.status === "active"}
                        title={item.status === "active" ? "Deactivate" : "Activate"}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            item.status === "active" ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
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
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="font-medium">{sortedData.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              
              {/* Simple pagination logic for demo */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  aria-current={currentPage === i + 1 ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                    currentPage === i + 1
                      ? "z-10 bg-[#EEF0FF] border-[#003B95] text-[#003B95]"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
  );
}
