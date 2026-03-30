import { useState, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Dumbbell,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import { Skeleton } from "../../ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../../ui/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";

// ─── Types ──────────────────────────────────────────────────

interface Sport {
  id: string;
  nameEN: string;
  icon: string;
  status: "Active" | "Inactive";
  createdDate: string;
  updatedDate: string;
}

interface CourtType {
  id: string;
  nameEN: string;
  nameAR: string;
  description: string;
  associatedSportIds: string[];
  status: "Active" | "Inactive";
  sortOrder: number;
  createdDate: string;
  updatedDate: string;
}

type ActiveTab = "sports" | "court-types";
type StatusFilter = "all" | "Active" | "Inactive";
type SportSortField = "nameEN" | "createdDate" | "updatedDate";
type CourtSortField = "nameEN" | "nameAR" | "createdDate" | "updatedDate";

interface SportFormData {
  nameEN: string;
  icon: string;
  status: "Active" | "Inactive";
}

interface CourtFormData {
  nameEN: string;
  nameAR: string;
  description: string;
  associatedSportIds: string[];
  status: "Active" | "Inactive";
  sortOrder: number;
}

interface FormErrors {
  nameEN?: string;
  nameAR?: string;
  icon?: string;
  description?: string;
  associatedSports?: string;
  sortOrder?: string;
}

// ─── Mock Data ──────────────────────────────────────────────

const INITIAL_SPORTS: Sport[] = [
  {
    id: "SPT-001", nameEN: "Football", status: "Active",
    icon: "https://images.unsplash.com/photo-1760890518049-47b9822e1c89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2025-06-15T10:00:00Z", updatedDate: "2025-11-20T14:30:00Z",
  },
  {
    id: "SPT-002", nameEN: "Padel", status: "Active",
    icon: "https://images.unsplash.com/photo-1657704022321-105c8d9723ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2025-06-15T10:00:00Z", updatedDate: "2025-10-01T09:00:00Z",
  },
  {
    id: "SPT-003", nameEN: "Tennis", status: "Active",
    icon: "https://images.unsplash.com/photo-1591100463799-a9ef12226ba4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2025-06-20T14:00:00Z", updatedDate: "2025-12-05T11:00:00Z",
  },
  {
    id: "SPT-004", nameEN: "Basketball", status: "Active",
    icon: "https://images.unsplash.com/photo-1610359155992-81ad957de6ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2025-07-01T09:00:00Z", updatedDate: "2025-07-01T09:00:00Z",
  },
  {
    id: "SPT-005", nameEN: "Swimming", status: "Active",
    icon: "https://images.unsplash.com/photo-1707401252805-9019f342604b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2025-07-10T11:00:00Z", updatedDate: "2025-07-10T11:00:00Z",
  },
  {
    id: "SPT-006", nameEN: "Cricket", status: "Active",
    icon: "https://images.unsplash.com/photo-1630740451344-3ee2cdcfe070?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2025-08-05T10:00:00Z", updatedDate: "2025-08-05T10:00:00Z",
  },
  {
    id: "SPT-007", nameEN: "Badminton", status: "Active",
    icon: "https://images.unsplash.com/photo-1599391398131-cd12dfc6c24e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2025-09-12T14:00:00Z", updatedDate: "2025-09-12T14:00:00Z",
  },
  {
    id: "SPT-008", nameEN: "Volleyball", status: "Inactive",
    icon: "https://images.unsplash.com/photo-1765910226872-e8811bd45d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2025-10-01T09:30:00Z", updatedDate: "2026-01-15T08:00:00Z",
  },
  {
    id: "SPT-009", nameEN: "Boxing", status: "Active",
    icon: "https://images.unsplash.com/photo-1651707999601-cba87015439c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2025-11-20T08:00:00Z", updatedDate: "2025-11-20T08:00:00Z",
  },
  {
    id: "SPT-010", nameEN: "Yoga", status: "Inactive",
    icon: "https://images.unsplash.com/photo-1625865020971-581242d0ead6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2026-01-05T11:00:00Z", updatedDate: "2026-01-05T11:00:00Z",
  },
  {
    id: "SPT-011", nameEN: "Table Tennis", status: "Active",
    icon: "https://images.unsplash.com/photo-1591100463799-a9ef12226ba4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2026-02-01T10:00:00Z", updatedDate: "2026-02-01T10:00:00Z",
  },
  {
    id: "SPT-012", nameEN: "Squash", status: "Active",
    icon: "https://images.unsplash.com/photo-1599391398131-cd12dfc6c24e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=64&h=64",
    createdDate: "2026-02-10T14:00:00Z", updatedDate: "2026-02-10T14:00:00Z",
  },
];

const INITIAL_COURT_TYPES: CourtType[] = [
  {
    id: "CT-001", nameEN: "Football Field", nameAR: "\u0645\u0644\u0639\u0628 \u0643\u0631\u0629 \u0642\u062f\u0645", description: "Standard 11-a-side football field with natural or artificial grass.",
    associatedSportIds: ["SPT-001"], status: "Active", sortOrder: 1,
    createdDate: "2025-06-15T10:00:00Z", updatedDate: "2025-11-20T14:30:00Z",
  },
  {
    id: "CT-002", nameEN: "5-a-side Pitch", nameAR: "\u0645\u0644\u0639\u0628 \u062e\u0645\u0627\u0633\u064a", description: "Smaller enclosed pitch for 5-a-side football games.",
    associatedSportIds: ["SPT-001"], status: "Active", sortOrder: 2,
    createdDate: "2025-06-20T09:00:00Z", updatedDate: "2025-06-20T09:00:00Z",
  },
  {
    id: "CT-003", nameEN: "Padel Court", nameAR: "\u0645\u0644\u0639\u0628 \u0628\u0627\u062f\u0644", description: "Enclosed court with glass walls for padel games.",
    associatedSportIds: ["SPT-002"], status: "Active", sortOrder: 3,
    createdDate: "2025-07-01T10:00:00Z", updatedDate: "2025-10-01T09:00:00Z",
  },
  {
    id: "CT-004", nameEN: "Tennis Court", nameAR: "\u0645\u0644\u0639\u0628 \u062a\u0646\u0633", description: "Standard tennis court with hard, clay, or grass surface.",
    associatedSportIds: ["SPT-003"], status: "Active", sortOrder: 4,
    createdDate: "2025-07-10T14:00:00Z", updatedDate: "2025-12-05T11:00:00Z",
  },
  {
    id: "CT-005", nameEN: "Basketball Court", nameAR: "\u0645\u0644\u0639\u0628 \u0643\u0631\u0629 \u0633\u0644\u0629", description: "Indoor or outdoor basketball court.",
    associatedSportIds: ["SPT-004"], status: "Active", sortOrder: 5,
    createdDate: "2025-07-15T09:00:00Z", updatedDate: "2025-07-15T09:00:00Z",
  },
  {
    id: "CT-006", nameEN: "Swimming Pool", nameAR: "\u0645\u0633\u0628\u062d", description: "Olympic or recreational-size swimming pool.",
    associatedSportIds: ["SPT-005"], status: "Active", sortOrder: 6,
    createdDate: "2025-08-01T10:00:00Z", updatedDate: "2025-08-01T10:00:00Z",
  },
  {
    id: "CT-007", nameEN: "Cricket Ground", nameAR: "\u0645\u0644\u0639\u0628 \u0643\u0631\u064a\u0643\u062a", description: "Turf or artificial cricket ground with pitch.",
    associatedSportIds: ["SPT-006"], status: "Active", sortOrder: 7,
    createdDate: "2025-08-15T08:00:00Z", updatedDate: "2025-08-15T08:00:00Z",
  },
  {
    id: "CT-008", nameEN: "Badminton Court", nameAR: "\u0645\u0644\u0639\u0628 \u0631\u064a\u0634\u0629 \u0637\u0627\u0626\u0631\u0629", description: "Indoor court with net for badminton.",
    associatedSportIds: ["SPT-007"], status: "Active", sortOrder: 8,
    createdDate: "2025-09-01T11:00:00Z", updatedDate: "2025-09-01T11:00:00Z",
  },
  {
    id: "CT-009", nameEN: "Multi-Purpose Hall", nameAR: "\u0642\u0627\u0639\u0629 \u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645\u0627\u062a",
    description: "Versatile indoor hall suitable for multiple sports.",
    associatedSportIds: ["SPT-004", "SPT-007", "SPT-008"], status: "Active", sortOrder: 9,
    createdDate: "2025-09-15T10:00:00Z", updatedDate: "2025-11-10T16:00:00Z",
  },
  {
    id: "CT-010", nameEN: "Boxing Ring", nameAR: "\u062d\u0644\u0628\u0629 \u0645\u0644\u0627\u0643\u0645\u0629", description: "Standard boxing ring within a gym facility.",
    associatedSportIds: ["SPT-009"], status: "Active", sortOrder: 10,
    createdDate: "2025-10-01T09:00:00Z", updatedDate: "2025-10-01T09:00:00Z",
  },
  {
    id: "CT-011", nameEN: "Volleyball Court", nameAR: "\u0645\u0644\u0639\u0628 \u0643\u0631\u0629 \u0637\u0627\u0626\u0631\u0629", description: "Indoor or beach volleyball court.",
    associatedSportIds: ["SPT-008"], status: "Inactive", sortOrder: 11,
    createdDate: "2025-10-15T14:00:00Z", updatedDate: "2026-01-15T08:00:00Z",
  },
  {
    id: "CT-012", nameEN: "Squash Court", nameAR: "\u0645\u0644\u0639\u0628 \u0627\u0633\u0643\u0648\u0627\u0634", description: "Enclosed indoor squash court with glass back wall.",
    associatedSportIds: ["SPT-012"], status: "Active", sortOrder: 12,
    createdDate: "2026-02-10T14:00:00Z", updatedDate: "2026-02-10T14:00:00Z",
  },
  {
    id: "CT-013", nameEN: "Yoga Studio", nameAR: "\u0627\u0633\u062a\u0648\u062f\u064a\u0648 \u064a\u0648\u063a\u0627", description: "Climate-controlled studio for yoga and wellness classes.",
    associatedSportIds: ["SPT-010"], status: "Inactive", sortOrder: 13,
    createdDate: "2026-01-10T10:00:00Z", updatedDate: "2026-01-10T10:00:00Z",
  },
  {
    id: "CT-014", nameEN: "Table Tennis Hall", nameAR: "\u0642\u0627\u0639\u0629 \u062a\u0646\u0633 \u0627\u0644\u0637\u0627\u0648\u0644\u0629", description: "Indoor hall with professional table tennis tables.",
    associatedSportIds: ["SPT-011"], status: "Active", sortOrder: 14,
    createdDate: "2026-02-05T08:00:00Z", updatedDate: "2026-02-05T08:00:00Z",
  },
  {
    id: "CT-015", nameEN: "Futsal Court", nameAR: "\u0645\u0644\u0639\u0628 \u0643\u0631\u0629 \u0635\u0627\u0644\u0627\u062a", description: "Indoor or covered futsal court with hard surface.",
    associatedSportIds: ["SPT-001"], status: "Active", sortOrder: 15,
    createdDate: "2026-02-20T10:00:00Z", updatedDate: "2026-02-20T10:00:00Z",
  },
];

// ─── Sport Color Map (for court type badges) ────────────────

const SPORT_COLORS: Record<string, string> = {
  "SPT-001": "bg-green-50 text-green-700 border-green-200",
  "SPT-002": "bg-blue-50 text-blue-700 border-blue-200",
  "SPT-003": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "SPT-004": "bg-orange-50 text-orange-700 border-orange-200",
  "SPT-005": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "SPT-006": "bg-lime-50 text-lime-700 border-lime-200",
  "SPT-007": "bg-pink-50 text-pink-700 border-pink-200",
  "SPT-008": "bg-purple-50 text-purple-700 border-purple-200",
  "SPT-009": "bg-red-50 text-red-700 border-red-200",
  "SPT-010": "bg-teal-50 text-teal-700 border-teal-200",
  "SPT-011": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "SPT-012": "bg-amber-50 text-amber-700 border-amber-200",
};

// ─── Export Helper ──────────────────────────────────────────

function exportData(
  data: Array<Record<string, string>>,
  entityName: string,
  formatType: string
) {
  let content = "";
  let filename = `${entityName}_export_${new Date().toISOString().slice(0, 10)}`;
  let mimeType = "text/plain";

  switch (formatType) {
    case "CSV": {
      const headers = Object.keys(data[0] || {}).join(",");
      const body = data.map((r) => Object.values(r).join(",")).join("\n");
      content = headers + "\n" + body;
      filename += ".csv";
      mimeType = "text/csv";
      break;
    }
    case "TXT": {
      content = data
        .map((r) => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(" | "))
        .join("\n");
      filename += ".txt";
      break;
    }
    case "SQL": {
      const tableName = entityName.replace(/\s+/g, "_").toLowerCase();
      content = data
        .map(
          (r) =>
            `INSERT INTO ${tableName} (${Object.keys(r)
              .map((k) => k.replace(/\s+/g, "_").toLowerCase())
              .join(", ")}) VALUES (${Object.values(r)
              .map((v) => `'${v}'`)
              .join(", ")});`
        )
        .join("\n");
      filename += ".sql";
      break;
    }
    default: {
      // XLS and PDF: fallback to CSV
      toast.info(`${formatType} export would be server-side. CSV fallback provided.`);
      const headers = Object.keys(data[0] || {}).join(",");
      const body = data.map((r) => Object.values(r).join(",")).join("\n");
      content = headers + "\n" + body;
      filename += ".csv";
      mimeType = "text/csv";
    }
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Export complete.");
}

// ─── Component ──────────────────────────────────────────────

export function SportsTab() {
  const [sports, setSports] = useState<Sport[]>(INITIAL_SPORTS);
  const [courtTypes, setCourtTypes] = useState<CourtType[]>(INITIAL_COURT_TYPES);
  const [activeTab, setActiveTab] = useState<ActiveTab>("sports");

  // Common state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sportAssocFilter, setSportAssocFilter] = useState("all");
  const [exportOpen, setExportOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting
  const [sportSortField, setSportSortField] = useState<SportSortField>("nameEN");
  const [sportSortDir, setSportSortDir] = useState<"asc" | "desc">("asc");
  const [courtSortField, setCourtSortField] = useState<CourtSortField>("nameEN");
  const [courtSortDir, setCourtSortDir] = useState<"asc" | "desc">("asc");

  // Form
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sportForm, setSportForm] = useState<SportFormData | null>(null);
  const [courtForm, setCourtForm] = useState<CourtFormData | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete + Status toggle
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "sport" | "court" } | null>(null);
  const [statusToggleTarget, setStatusToggleTarget] = useState<{
    id: string;
    name: string;
    newStatus: "Active" | "Inactive";
    type: "sport" | "court";
  } | null>(null);

  // ─── Sport helpers ────────────────────────────────────────

  const getSportName = useCallback(
    (id: string) => sports.find((s) => s.id === id)?.nameEN || "Unknown",
    [sports]
  );

  const getSportStatus = useCallback(
    (id: string) => sports.find((s) => s.id === id)?.status || "Inactive",
    [sports]
  );

  const activeSports = useMemo(() => sports.filter((s) => s.status === "Active"), [sports]);

  // ─── Filtered Sports ──────────────────────────────────────

  const filteredSports = useMemo(() => {
    const q = search.toLowerCase();
    return sports
      .filter((s) => {
        if (q && !s.nameEN.toLowerCase().includes(q))
          return false;
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sportSortField) {
          case "nameEN":
            cmp = a.nameEN.localeCompare(b.nameEN);
            break;
          case "createdDate":
            cmp = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
            break;
          case "updatedDate":
            cmp = new Date(a.updatedDate).getTime() - new Date(b.updatedDate).getTime();
            break;
        }
        return sportSortDir === "asc" ? cmp : -cmp;
      });
  }, [sports, search, statusFilter, sportSortField, sportSortDir]);

  // ─── Filtered Court Types ─────────────────────────────────

  const filteredCourts = useMemo(() => {
    const q = search.toLowerCase();
    return courtTypes
      .filter((ct) => {
        if (q && !ct.nameEN.toLowerCase().includes(q) && !ct.nameAR.toLowerCase().includes(q))
          return false;
        if (statusFilter !== "all" && ct.status !== statusFilter) return false;
        if (sportAssocFilter !== "all" && !ct.associatedSportIds.includes(sportAssocFilter))
          return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (courtSortField) {
          case "nameEN":
            cmp = a.nameEN.localeCompare(b.nameEN);
            break;
          case "nameAR":
            cmp = a.nameAR.localeCompare(b.nameAR);
            break;
          case "createdDate":
            cmp = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
            break;
          case "updatedDate":
            cmp = new Date(a.updatedDate).getTime() - new Date(b.updatedDate).getTime();
            break;
        }
        return courtSortDir === "asc" ? cmp : -cmp;
      });
  }, [courtTypes, search, statusFilter, sportAssocFilter, courtSortField, courtSortDir]);

  // ─── Pagination ───────────────────────────────────────────

  const currentData = activeTab === "sports" ? filteredSports : filteredCourts;
  const totalPages = Math.max(1, Math.ceil(currentData.length / pageSize));
  const paginatedData = currentData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── Sorting Helpers ──────────────────────────────────────

  const toggleSportSort = (field: SportSortField) => {
    if (sportSortField === field) {
      setSportSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSportSortField(field);
      setSportSortDir("asc");
    }
  };

  const toggleCourtSort = (field: CourtSortField) => {
    if (courtSortField === field) {
      setCourtSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setCourtSortField(field);
      setCourtSortDir("asc");
    }
  };

  function SportSortIcon({ field }: { field: SportSortField }) {
    if (sportSortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sportSortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#003B95]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#003B95]" />
    );
  }

  function CourtSortIcon({ field }: { field: CourtSortField }) {
    if (courtSortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return courtSortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#003B95]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#003B95]" />
    );
  }

  // ─── Tab Switch ───────────────────────────────────────────

  const switchTab = (tab: ActiveTab) => {
    if (panelOpen) {
      setPanelOpen(false);
      setSportForm(null);
      setCourtForm(null);
      setEditingId(null);
    }
    setActiveTab(tab);
    setSearch("");
    setStatusFilter("all");
    setSportAssocFilter("all");
    setCurrentPage(1);
  };

  // ─── Form Handlers ────────────────────────────────────────

  const openCreateSport = () => {
    setSportForm({
      nameEN: "",
      icon: "",
      status: "Active",
    });
    setCourtForm(null);
    setEditingId(null);
    setFormErrors({});
    setPanelOpen(true);
  };

  const openEditSport = (sport: Sport) => {
    setSportForm({
      nameEN: sport.nameEN,
      icon: sport.icon,
      status: sport.status,
    });
    setCourtForm(null);
    setEditingId(sport.id);
    setFormErrors({});
    setPanelOpen(true);
  };

  const openCreateCourt = () => {
    const maxSort = Math.max(0, ...courtTypes.map((c) => c.sortOrder));
    setCourtForm({
      nameEN: "",
      nameAR: "",
      description: "",
      associatedSportIds: [],
      status: "Active",
      sortOrder: maxSort + 1,
    });
    setSportForm(null);
    setEditingId(null);
    setFormErrors({});
    setPanelOpen(true);
  };

  const openEditCourt = (court: CourtType) => {
    setCourtForm({
      nameEN: court.nameEN,
      nameAR: court.nameAR,
      description: court.description,
      associatedSportIds: [...court.associatedSportIds],
      status: court.status,
      sortOrder: court.sortOrder,
    });
    setSportForm(null);
    setEditingId(court.id);
    setFormErrors({});
    setPanelOpen(true);
  };

  // ─── Image Upload ─────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Upload JPEG, PNG, or SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (sportForm) {
        setSportForm({ ...sportForm, icon: ev.target?.result as string });
        setFormErrors((p) => ({ ...p, icon: undefined }));
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Validate + Save ─────────────────────────────────────

  const validateAndSave = () => {
    const errs: FormErrors = {};

    if (sportForm) {
      if (!sportForm.nameEN.trim()) {
        errs.nameEN = "Name (English) is required.";
      } else if (sportForm.nameEN.trim().length < 2) {
        errs.nameEN = "Name must be at least 2 characters.";
      } else if (sportForm.nameEN.length > 100) {
        errs.nameEN = "Name cannot exceed 100 characters.";
      } else if (
        sports.some(
          (s) => s.id !== editingId && s.nameEN.toLowerCase() === sportForm.nameEN.trim().toLowerCase()
        )
      ) {
        errs.nameEN = "A sport with this name already exists.";
      }

      if (!sportForm.icon && !editingId) {
        errs.icon = "Sport icon is required.";
      }
    }

    if (courtForm) {
      if (!courtForm.nameEN.trim()) {
        errs.nameEN = "Name (English) is required.";
      } else if (courtForm.nameEN.trim().length < 2) {
        errs.nameEN = "Name must be at least 2 characters.";
      } else if (courtForm.nameEN.length > 100) {
        errs.nameEN = "Name cannot exceed 100 characters.";
      } else if (
        courtTypes.some(
          (c) => c.id !== editingId && c.nameEN.toLowerCase() === courtForm.nameEN.trim().toLowerCase()
        )
      ) {
        errs.nameEN = "A court type with this name already exists.";
      }

      if (courtForm.nameAR.trim() && courtForm.nameAR.trim().length < 2) {
        errs.nameAR = "Arabic name must be at least 2 characters.";
      } else if (courtForm.nameAR.length > 100) {
        errs.nameAR = "Arabic name cannot exceed 100 characters.";
      }

      if (courtForm.description.length > 500) {
        errs.description = "Description cannot exceed 500 characters.";
      }

      if (courtForm.associatedSportIds.length === 0) {
        errs.associatedSports = "At least one sport must be associated.";
      }

      if (courtForm.sortOrder <= 0 || !Number.isInteger(courtForm.sortOrder)) {
        errs.sortOrder = "Sort order must be a positive whole number.";
      }
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    setSaving(true);
    setTimeout(() => {
      const now = new Date().toISOString();

      if (sportForm) {
        if (editingId) {
          setSports((prev) =>
            prev.map((s) =>
              s.id === editingId
                ? {
                    ...s,
                    nameEN: sportForm.nameEN.trim(),
                    icon: sportForm.icon || s.icon,
                    status: sportForm.status,
                    updatedDate: now,
                  }
                : s
            )
          );
          toast.success("Sport updated successfully.");
        } else {
          setSports((prev) => [
            ...prev,
            {
              id: `SPT-${Date.now()}`,
              nameEN: sportForm.nameEN.trim(),
              icon: sportForm.icon,
              status: sportForm.status,
              createdDate: now,
              updatedDate: now,
            },
          ]);
          toast.success("Sport created successfully.");
        }
      }

      if (courtForm) {
        if (editingId) {
          setCourtTypes((prev) =>
            prev.map((c) =>
              c.id === editingId
                ? {
                    ...c,
                    nameEN: courtForm.nameEN.trim(),
                    nameAR: courtForm.nameAR.trim(),
                    description: courtForm.description.trim(),
                    associatedSportIds: courtForm.associatedSportIds,
                    status: courtForm.status,
                    sortOrder: courtForm.sortOrder,
                    updatedDate: now,
                  }
                : c
            )
          );
          toast.success("Court type updated successfully.");
        } else {
          setCourtTypes((prev) => [
            ...prev,
            {
              id: `CT-${Date.now()}`,
              nameEN: courtForm.nameEN.trim(),
              nameAR: courtForm.nameAR.trim(),
              description: courtForm.description.trim(),
              associatedSportIds: courtForm.associatedSportIds,
              status: courtForm.status,
              sortOrder: courtForm.sortOrder,
              createdDate: now,
              updatedDate: now,
            },
          ]);
          toast.success("Court type created successfully.");
        }
      }

      setSaving(false);
      setPanelOpen(false);
      setSportForm(null);
      setCourtForm(null);
      setEditingId(null);
    }, 500);
  };

  // ─── Delete Handler ───────────────────────────────────────

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "sport") {
      // Check if sport is referenced by court types
      const referencedBy = courtTypes.filter((ct) => ct.associatedSportIds.includes(deleteTarget.id));
      if (referencedBy.length > 0) {
        toast.error(
          `Unable to delete '${deleteTarget.name}'. It is associated with court types: ${referencedBy.map((ct) => ct.nameEN).join(", ")}.`
        );
        setDeleteTarget(null);
        return;
      }
      setSports((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success("Sport deleted successfully.");
    } else {
      setCourtTypes((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Court type deleted successfully.");
    }
    setDeleteTarget(null);
  };

  // ─── Status Toggle ────────────────────────────────────────

  const confirmStatusToggle = () => {
    if (!statusToggleTarget) return;
    if (statusToggleTarget.type === "sport") {
      setSports((prev) =>
        prev.map((s) =>
          s.id === statusToggleTarget.id
            ? { ...s, status: statusToggleTarget.newStatus, updatedDate: new Date().toISOString() }
            : s
        )
      );
    } else {
      setCourtTypes((prev) =>
        prev.map((c) =>
          c.id === statusToggleTarget.id
            ? { ...c, status: statusToggleTarget.newStatus, updatedDate: new Date().toISOString() }
            : c
        )
      );
    }
    toast.success(`Status updated to ${statusToggleTarget.newStatus}.`);
    setStatusToggleTarget(null);
  };

  // ─── Export Handler ───────────────────────────────────────

  const handleExport = (formatType: string) => {
    if (activeTab === "sports") {
      const rows = filteredSports.map((s) => ({
        "Name EN": s.nameEN,
        Status: s.status,
        Created: format(new Date(s.createdDate), "yyyy-MM-dd"),
        Updated: format(new Date(s.updatedDate), "yyyy-MM-dd"),
      }));
      exportData(rows, "sports", formatType);
    } else {
      const rows = filteredCourts.map((ct) => ({
        "Name EN": ct.nameEN,
        "Name AR": ct.nameAR,
        "Associated Sports": ct.associatedSportIds.map(getSportName).join("; "),
        Status: ct.status,
        "Sort Order": String(ct.sortOrder),
        Created: format(new Date(ct.createdDate), "yyyy-MM-dd"),
        Updated: format(new Date(ct.updatedDate), "yyyy-MM-dd"),
      }));
      exportData(rows, "court_types", formatType);
    }
    setExportOpen(false);
  };

  // ─── Multi-select for associated sports ───────────────────

  const toggleSportSelection = (sportId: string) => {
    if (!courtForm) return;
    const current = courtForm.associatedSportIds;
    if (current.includes(sportId)) {
      setCourtForm({ ...courtForm, associatedSportIds: current.filter((id) => id !== sportId) });
    } else {
      setCourtForm({ ...courtForm, associatedSportIds: [...current, sportId] });
    }
    setFormErrors((p) => ({ ...p, associatedSports: undefined }));
  };

  // ─── Render ───────────────────────────────────────────────

  const entityLabel = activeTab === "sports" ? "Sport" : "Court Type";

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          Manage sport types and court types available across the platform.
        </p>
        <div className="flex items-center gap-2">
          {/* Export */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => setExportOpen(!exportOpen)}
              aria-label={`Export ${activeTab === "sports" ? "sports" : "court types"} data`}
            >
              <Download className="h-3.5 w-3.5" />
              Export
              <ChevronDown className="h-3 w-3" />
            </Button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 w-32">
                  {["CSV", "XLS", "PDF", "TXT", "SQL"].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Create New */}
          <Button
            onClick={activeTab === "sports" ? openCreateSport : openCreateCourt}
            className="bg-[#003B95] hover:bg-[#002a6b] gap-2 h-9"
          >
            <Plus className="h-4 w-4" />
            Create New {entityLabel}
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b">
        <div className="flex items-center gap-0" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "sports"}
            onClick={() => switchTab("sports")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors",
              activeTab === "sports"
                ? "border-[#003B95] text-[#003B95] font-medium"
                : "border-transparent text-[#6B7280] hover:text-[#111827] hover:border-gray-300"
            )}
          >
            Sports
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] h-5 min-w-[20px] justify-center",
                activeTab === "sports"
                  ? "bg-[#003B95]/10 text-[#003B95]"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {sports.length}
            </Badge>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "court-types"}
            onClick={() => switchTab("court-types")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors",
              activeTab === "court-types"
                ? "border-[#003B95] text-[#003B95] font-medium"
                : "border-transparent text-[#6B7280] hover:text-[#111827] hover:border-gray-300"
            )}
          >
            Court Types
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] h-5 min-w-[20px] justify-center",
                activeTab === "court-types"
                  ? "bg-[#003B95]/10 text-[#003B95]"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {courtTypes.length}
            </Badge>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name..."
            className="pl-8 h-9 text-sm"
            role="search"
            aria-label={`Search ${activeTab === "sports" ? "sports" : "court types"} by name`}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val as StatusFilter);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-36 h-9 text-sm" aria-label="Filter by status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {activeTab === "court-types" && (
          <Select
            value={sportAssocFilter}
            onValueChange={(val) => {
              setSportAssocFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-44 h-9 text-sm" aria-label="Filter by associated sport">
              <SelectValue placeholder="All Sports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {activeSports.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nameEN}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* DataTable */}
      {currentData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg bg-white">
          <Dumbbell className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-[#111827]">
            No {activeTab === "sports" ? "sports" : "court types"} found
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            {search || statusFilter !== "all" || sportAssocFilter !== "all"
              ? "No results match your search or filters."
              : `No ${activeTab === "sports" ? "sports" : "court types"} have been created yet.`}
          </p>
          {!search && statusFilter === "all" && sportAssocFilter === "all" && (
            <Button
              onClick={activeTab === "sports" ? openCreateSport : openCreateCourt}
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
            >
              <Plus className="h-3.5 w-3.5" /> Create New {entityLabel}
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          {activeTab === "sports" ? (
            /* ─── Sports Table ────────────────────────────────── */
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="px-3 w-16">Icon</TableHead>
                  <TableHead className="px-3">
                    <button
                      onClick={() => toggleSportSort("nameEN")}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Name <SportSortIcon field="nameEN" />
                    </button>
                  </TableHead>
                  <TableHead className="px-3 w-24">Status</TableHead>
                  <TableHead className="px-3">
                    <button
                      onClick={() => toggleSportSort("createdDate")}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Created <SportSortIcon field="createdDate" />
                    </button>
                  </TableHead>
                  <TableHead className="px-3">
                    <button
                      onClick={() => toggleSportSort("updatedDate")}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Updated <SportSortIcon field="updatedDate" />
                    </button>
                  </TableHead>
                  <TableHead className="px-3 text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(paginatedData as Sport[]).map((sport) => (
                  <TableRow
                    key={sport.id}
                    className={cn("group", sport.status === "Inactive" && "opacity-60")}
                  >
                    <TableCell className="px-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img
                          src={sport.icon}
                          alt={`${sport.nameEN} icon`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-3">
                      <span className="text-sm font-medium text-[#111827]">{sport.nameEN}</span>
                    </TableCell>
                    <TableCell className="px-3">
                      <Switch
                        checked={sport.status === "Active"}
                        onCheckedChange={() =>
                          setStatusToggleTarget({
                            id: sport.id,
                            name: sport.nameEN,
                            newStatus: sport.status === "Active" ? "Inactive" : "Active",
                            type: "sport",
                          })
                        }
                        className="data-[state=checked]:bg-emerald-500"
                        role="switch"
                        aria-checked={sport.status === "Active"}
                        aria-label={`Status for ${sport.nameEN}: ${sport.status}`}
                      />
                    </TableCell>
                    <TableCell className="px-3 text-xs text-[#6B7280]">
                      {format(new Date(sport.createdDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="px-3 text-xs text-[#6B7280]">
                      {format(new Date(sport.updatedDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="px-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditSport(sport)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-[#003B95]"
                          aria-label={`Edit ${sport.nameEN}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({ id: sport.id, name: sport.nameEN, type: "sport" })
                          }
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                          aria-label={`Delete ${sport.nameEN}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            /* ─── Court Types Table ──────────────────────────── */
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="px-3">
                    <button
                      onClick={() => toggleCourtSort("nameEN")}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Name EN <CourtSortIcon field="nameEN" />
                    </button>
                  </TableHead>
                  <TableHead className="px-3">
                    <button
                      onClick={() => toggleCourtSort("nameAR")}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Name AR <CourtSortIcon field="nameAR" />
                    </button>
                  </TableHead>
                  <TableHead className="px-3">Associated Sport(s)</TableHead>
                  <TableHead className="px-3 w-24">Status</TableHead>
                  <TableHead className="px-3">
                    <button
                      onClick={() => toggleCourtSort("createdDate")}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Created <CourtSortIcon field="createdDate" />
                    </button>
                  </TableHead>
                  <TableHead className="px-3">
                    <button
                      onClick={() => toggleCourtSort("updatedDate")}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Updated <CourtSortIcon field="updatedDate" />
                    </button>
                  </TableHead>
                  <TableHead className="px-3 text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(paginatedData as CourtType[]).map((court) => (
                  <TableRow
                    key={court.id}
                    className={cn("group", court.status === "Inactive" && "opacity-60")}
                  >
                    <TableCell className="px-3">
                      <span className="text-sm font-medium text-[#111827]">{court.nameEN}</span>
                    </TableCell>
                    <TableCell className="px-3">
                      <span className="text-sm text-[#6B7280]" dir="rtl" lang="ar">
                        {court.nameAR}
                      </span>
                    </TableCell>
                    <TableCell className="px-3">
                      <div
                        className="flex flex-wrap gap-1"
                        aria-label={`Associated sports: ${court.associatedSportIds.map(getSportName).join(", ")}`}
                      >
                        {court.associatedSportIds.map((sid) => {
                          const isInactive = getSportStatus(sid) === "Inactive";
                          return (
                            <Badge
                              key={sid}
                              variant="secondary"
                              className={cn(
                                "text-[10px]",
                                isInactive
                                  ? "bg-gray-100 text-gray-400 border-gray-200 line-through"
                                  : SPORT_COLORS[sid] || "bg-gray-100 text-gray-600 border-gray-200"
                              )}
                            >
                              {getSportName(sid)}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="px-3">
                      <Switch
                        checked={court.status === "Active"}
                        onCheckedChange={() =>
                          setStatusToggleTarget({
                            id: court.id,
                            name: court.nameEN,
                            newStatus: court.status === "Active" ? "Inactive" : "Active",
                            type: "court",
                          })
                        }
                        className="data-[state=checked]:bg-emerald-500"
                        role="switch"
                        aria-checked={court.status === "Active"}
                        aria-label={`Status for ${court.nameEN}: ${court.status}`}
                      />
                    </TableCell>
                    <TableCell className="px-3 text-xs text-[#6B7280]">
                      {format(new Date(court.createdDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="px-3 text-xs text-[#6B7280]">
                      {format(new Date(court.updatedDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="px-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditCourt(court)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-[#003B95]"
                          aria-label={`Edit ${court.nameEN}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({ id: court.id, name: court.nameEN, type: "court" })
                          }
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                          aria-label={`Delete ${court.nameEN}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <span>
                Showing {Math.min((currentPage - 1) * pageSize + 1, currentData.length)}-
                {Math.min(currentPage * pageSize, currentData.length)} of {currentData.length}
              </span>
              <span className="text-gray-300">|</span>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-1.5 py-0.5 text-xs bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                )
                .map((p, i, arr) => {
                  const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-xs text-gray-400">...</span>
                      )}
                      <Button
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(p)}
                        className={cn(
                          "h-7 w-7 p-0 text-xs",
                          currentPage === p && "bg-[#003B95] hover:bg-[#002a6b]"
                        )}
                      >
                        {p}
                      </Button>
                    </span>
                  );
                })}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Form Panel (Sheet) ──────────────────────────────── */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          side="right"
          className="w-[450px] sm:max-w-[450px] overflow-y-auto"
          aria-label={
            editingId
              ? `Edit ${sportForm ? "Sport" : "Court Type"}`
              : `Create New ${sportForm ? "Sport" : "Court Type"}`
          }
        >
          <SheetHeader>
            <SheetTitle>
              {editingId
                ? `Edit ${sportForm ? "Sport" : "Court Type"}`
                : `Create New ${sportForm ? "Sport" : "Court Type"}`}
            </SheetTitle>
            <SheetDescription>
              {editingId
                ? "Update the details below."
                : `Fill in the details to create a new ${sportForm ? "sport" : "court type"}.`}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 py-4">
            {/* ── Sport Form ─────────────────────────────────── */}
            {sportForm && (
              <>
                {/* Name EN */}
                <div className="space-y-2">
                  <Label htmlFor="sport-name-en">
                    Name (English) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sport-name-en"
                    value={sportForm.nameEN}
                    onChange={(e) => {
                      setSportForm({ ...sportForm, nameEN: e.target.value });
                      setFormErrors((p) => ({ ...p, nameEN: undefined }));
                    }}
                    placeholder="Enter sport name in English"
                    maxLength={100}
                    className={cn("text-sm", formErrors.nameEN && "border-red-400")}
                    aria-required="true"
                  />
                  <div className="flex items-center justify-between">
                    {formErrors.nameEN ? (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.nameEN}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] text-gray-400">{sportForm.nameEN.length}/100</span>
                  </div>
                </div>

                {/* Icon Upload */}
                <div className="space-y-2">
                  <Label>
                    Sport Icon {!editingId && <span className="text-red-500">*</span>}
                  </Label>
                  {sportForm.icon ? (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img
                          src={sportForm.icon}
                          alt="Sport icon preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-3 w-3" /> Change Icon
                        </Button>
                        <button
                          onClick={() => setSportForm({ ...sportForm, icon: "" })}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-[#003B95] hover:bg-blue-50/30 transition-colors",
                        formErrors.icon ? "border-red-400 bg-red-50/30" : "border-gray-300"
                      )}
                    >
                      <Upload className="h-6 w-6 text-gray-400 mb-1.5" />
                      <p className="text-xs text-gray-500">Click to upload icon</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG, or SVG (max 2MB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.svg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {formErrors.icon && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.icon}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-3 h-9">
                    <Switch
                      checked={sportForm.status === "Active"}
                      onCheckedChange={(v) =>
                        setSportForm({ ...sportForm, status: v ? "Active" : "Inactive" })
                      }
                      className="data-[state=checked]:bg-[#003B95]"
                    />
                    <span className="text-sm text-[#6B7280]">{sportForm.status}</span>
                  </div>
                </div>

                {sportForm.status === "Inactive" && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Inactive sports are hidden from platform dropdowns but remain in the admin
                    listing.
                  </p>
                )}
              </>
            )}

            {/* ── Court Type Form ────────────────────────────── */}
            {courtForm && (
              <>
                {/* Name EN */}
                <div className="space-y-2">
                  <Label htmlFor="court-name-en">
                    Name (English) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="court-name-en"
                    value={courtForm.nameEN}
                    onChange={(e) => {
                      setCourtForm({ ...courtForm, nameEN: e.target.value });
                      setFormErrors((p) => ({ ...p, nameEN: undefined }));
                    }}
                    placeholder="Enter court type name in English"
                    maxLength={100}
                    className={cn("text-sm", formErrors.nameEN && "border-red-400")}
                    aria-required="true"
                  />
                  <div className="flex items-center justify-between">
                    {formErrors.nameEN ? (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.nameEN}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] text-gray-400">{courtForm.nameEN.length}/100</span>
                  </div>
                </div>

                {/* Name AR */}
                <div className="space-y-2">
                  <Label htmlFor="court-name-ar">Name (Arabic)</Label>
                  <Input
                    id="court-name-ar"
                    value={courtForm.nameAR}
                    onChange={(e) => {
                      setCourtForm({ ...courtForm, nameAR: e.target.value });
                      setFormErrors((p) => ({ ...p, nameAR: undefined }));
                    }}
                    placeholder="Enter court type name in Arabic"
                    maxLength={100}
                    dir="rtl"
                    lang="ar"
                    className={cn("text-sm text-right", formErrors.nameAR && "border-red-400")}
                  />
                  <div className="flex items-center justify-between">
                    {formErrors.nameAR ? (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.nameAR}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] text-gray-400">{courtForm.nameAR.length}/100</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="court-desc">Description</Label>
                  <Textarea
                    id="court-desc"
                    value={courtForm.description}
                    onChange={(e) => {
                      setCourtForm({ ...courtForm, description: e.target.value });
                      setFormErrors((p) => ({ ...p, description: undefined }));
                    }}
                    placeholder="Enter description (optional)"
                    maxLength={500}
                    rows={3}
                    className={cn("text-sm", formErrors.description && "border-red-400")}
                  />
                  <div className="flex items-center justify-between">
                    {formErrors.description ? (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.description}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] text-gray-400">
                      {courtForm.description.length}/500
                    </span>
                  </div>
                </div>

                {/* Associated Sports (Multi-select) */}
                <div className="space-y-2">
                  <Label>
                    Associated Sport(s) <span className="text-red-500">*</span>
                  </Label>
                  {activeSports.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                      No active sports available. Create a sport first.
                    </p>
                  ) : (
                    <>
                      {/* Selected chips */}
                      {courtForm.associatedSportIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {courtForm.associatedSportIds.map((sid) => (
                            <Badge
                              key={sid}
                              variant="secondary"
                              className={cn(
                                "text-xs gap-1.5 pr-1",
                                SPORT_COLORS[sid] || "bg-gray-100 text-gray-600 border-gray-200"
                              )}
                            >
                              {getSportName(sid)}
                              <button
                                onClick={() => toggleSportSelection(sid)}
                                className="hover:bg-black/10 rounded-full p-0.5"
                                aria-label={`Remove ${getSportName(sid)}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* Dropdown checkboxes */}
                      <div className="border rounded-lg max-h-40 overflow-y-auto">
                        {activeSports.map((sport) => {
                          const isSelected = courtForm.associatedSportIds.includes(sport.id);
                          return (
                            <button
                              key={sport.id}
                              onClick={() => toggleSportSelection(sport.id)}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
                                isSelected && "bg-blue-50/50"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center",
                                  isSelected
                                    ? "bg-[#003B95] border-[#003B95]"
                                    : "border-gray-300"
                                )}
                              >
                                {isSelected && (
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className={cn(isSelected && "font-medium text-[#003B95]")}>
                                {sport.nameEN}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {formErrors.associatedSports && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.associatedSports}
                    </p>
                  )}
                </div>

                {/* Status + Sort Order */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-3 h-9">
                      <Switch
                        checked={courtForm.status === "Active"}
                        onCheckedChange={(v) =>
                          setCourtForm({ ...courtForm, status: v ? "Active" : "Inactive" })
                        }
                        className="data-[state=checked]:bg-[#003B95]"
                      />
                      <span className="text-sm text-[#6B7280]">{courtForm.status}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="court-sort">Sort Order</Label>
                    <Input
                      id="court-sort"
                      type="number"
                      min={1}
                      value={courtForm.sortOrder}
                      onChange={(e) => {
                        setCourtForm({ ...courtForm, sortOrder: parseInt(e.target.value) || 0 });
                        setFormErrors((p) => ({ ...p, sortOrder: undefined }));
                      }}
                      className={cn("text-sm", formErrors.sortOrder && "border-red-400")}
                    />
                    {formErrors.sortOrder && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.sortOrder}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <SheetFooter className="px-4 pb-4 flex gap-2">
            <Button variant="outline" onClick={() => setPanelOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={validateAndSave}
              disabled={saving}
              className="flex-1 bg-[#003B95] hover:bg-[#002a6b] gap-2"
            >
              {saving && (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {saving ? "Saving..." : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Delete Confirmation ───────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === "sport" ? "Sport" : "Court Type"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete &ldquo;{deleteTarget?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Status Toggle Confirmation ──────────────────────── */}
      <AlertDialog
        open={!!statusToggleTarget}
        onOpenChange={(open) => !open && setStatusToggleTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Status</AlertDialogTitle>
            <AlertDialogDescription>
              {statusToggleTarget?.newStatus === "Active" ? "Activate" : "Deactivate"} &ldquo;
              {statusToggleTarget?.name}&rdquo;?{" "}
              {statusToggleTarget?.newStatus === "Inactive"
                ? "Inactive items are hidden from dropdowns."
                : "Active items become available in dropdowns."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusToggle}
              className="bg-[#003B95] hover:bg-[#002a6b]"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
