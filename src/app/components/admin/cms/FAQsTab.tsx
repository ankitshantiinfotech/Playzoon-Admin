import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  HelpCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
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

interface FAQItem {
  id: string;
  questionEN: string;
  answerEN: string;
  category: string;
  status: "Active" | "Inactive";
  createdDate: string;
  updatedDate: string;
}

interface FAQFormData {
  questionEN: string;
  answerEN: string;
  category: string;
  status: "Active" | "Inactive";
}

interface FormErrors {
  questionEN?: string;
  answerEN?: string;
  category?: string;
}

type SortField = "questionEN" | "category" | "createdDate" | "updatedDate";
type SortDir = "asc" | "desc";

// ─── Mock Data ──────────────────────────────────────────────

const CATEGORIES = [
  "Booking & Payments",
  "Account & Profile",
  "Cancellations & Refunds",
  "Tournaments",
  "Training Programs",
  "Facilities",
  "General",
];

const INITIAL_FAQS: FAQItem[] = [
  {
    id: "faq-001",
    questionEN: "How do I book a facility?",
    answerEN:
      "Browse available facilities, select a time slot, and complete the payment. You will receive a confirmation notification immediately after your booking is confirmed.",
    category: "Booking & Payments",
    status: "Active",
    createdDate: "2025-06-15T10:00:00Z",
    updatedDate: "2025-11-20T14:30:00Z",
  },
  {
    id: "faq-002",
    questionEN: "What payment methods are supported?",
    answerEN:
      "We accept credit/debit cards (Visa, Mastercard), Apple Pay, and wallet balance. Bank transfers are available for corporate accounts.",
    category: "Booking & Payments",
    status: "Active",
    createdDate: "2025-06-15T10:30:00Z",
    updatedDate: "2025-10-12T09:00:00Z",
  },
  {
    id: "faq-003",
    questionEN: "Can I split payment between wallet and card?",
    answerEN:
      "Yes! During checkout, you can choose to use your wallet balance partially and pay the remainder with a card.",
    category: "Booking & Payments",
    status: "Active",
    createdDate: "2025-07-01T08:00:00Z",
    updatedDate: "2025-07-01T08:00:00Z",
  },
  {
    id: "faq-004",
    questionEN: "How do I update my profile information?",
    answerEN:
      "Go to your Profile settings, tap Edit, and update your name, phone, or profile photo. Changes are saved instantly.",
    category: "Account & Profile",
    status: "Active",
    createdDate: "2025-06-20T14:00:00Z",
    updatedDate: "2025-12-05T11:00:00Z",
  },
  {
    id: "faq-005",
    questionEN: "How do I reset my password?",
    answerEN:
      "Tap 'Forgot Password' on the login screen, enter your email, and follow the reset link sent to your inbox.",
    category: "Account & Profile",
    status: "Active",
    createdDate: "2025-06-20T15:00:00Z",
    updatedDate: "2025-06-20T15:00:00Z",
  },
  {
    id: "faq-006",
    questionEN: "What is the cancellation policy?",
    answerEN:
      "Cancellation policies vary by provider type. Generally, cancelling before the cancellation window gets you a full or partial refund. Check the booking details for specific terms.",
    category: "Cancellations & Refunds",
    status: "Active",
    createdDate: "2025-07-10T09:00:00Z",
    updatedDate: "2025-11-15T16:00:00Z",
  },
  {
    id: "faq-007",
    questionEN: "How long does a refund take?",
    answerEN:
      "Wallet refunds are instant. Card refunds typically take 5-14 business days depending on your bank.",
    category: "Cancellations & Refunds",
    status: "Active",
    createdDate: "2025-07-10T09:30:00Z",
    updatedDate: "2025-07-10T09:30:00Z",
  },
  {
    id: "faq-008",
    questionEN: "How do I register for a tournament?",
    answerEN:
      "Browse the Tournaments section, select a tournament, and register your team or yourself. Entry fees are collected at registration.",
    category: "Tournaments",
    status: "Active",
    createdDate: "2025-08-05T10:00:00Z",
    updatedDate: "2025-08-05T10:00:00Z",
  },
  {
    id: "faq-009",
    questionEN: "Can I switch training coaches?",
    answerEN:
      "Yes, you can switch coaches by cancelling your current enrollment (subject to cancellation policy) and enrolling with a new coach.",
    category: "Training Programs",
    status: "Inactive",
    createdDate: "2025-09-01T11:00:00Z",
    updatedDate: "2026-01-10T08:00:00Z",
  },
  {
    id: "faq-010",
    questionEN: "How do I find facilities near me?",
    answerEN:
      "Enable location services on your device. The app will automatically show nearby facilities sorted by distance. You can also search by city or area name.",
    category: "Facilities",
    status: "Active",
    createdDate: "2025-09-15T13:00:00Z",
    updatedDate: "2025-09-15T13:00:00Z",
  },
  {
    id: "faq-011",
    questionEN: "Is Playzoon available in my city?",
    answerEN:
      "Playzoon is currently available in Riyadh, Jeddah, Dammam, and several other cities in Saudi Arabia. We are expanding to new cities regularly.",
    category: "General",
    status: "Active",
    createdDate: "2025-10-01T08:00:00Z",
    updatedDate: "2026-02-01T10:00:00Z",
  },
  {
    id: "faq-012",
    questionEN: "How do I contact customer support?",
    answerEN:
      "You can reach us via in-app chat (9 AM - 9 PM), email at support@playzoon.com, or call us at +966 XX XXX XXXX during business hours.",
    category: "General",
    status: "Active",
    createdDate: "2025-10-15T14:00:00Z",
    updatedDate: "2025-10-15T14:00:00Z",
  },
];

// ─── Helpers ────────────────────────────────────────────────

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

// ─── Component ──────────────────────────────────────────────

export function FAQsTab() {
  const [faqs, setFaqs] = useState<FAQItem[]>(INITIAL_FAQS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Active" | "Inactive"
  >("all");
  const [sortField, setSortField] = useState<SortField>("questionEN");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Form panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQFormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<FAQItem | null>(null);

  // ─── Derived Data ─────────────────────────────────────────

  const isFiltered =
    search.trim() !== "" || categoryFilter !== "all" || statusFilter !== "all";

  const availableCategories = useMemo(() => {
    const cats = new Set(faqs.map((f) => f.category));
    return Array.from(cats).sort();
  }, [faqs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return faqs
      .filter((faq) => {
        if (q) {
          const matchesQ =
            faq.questionEN.toLowerCase().includes(q) ||
            faq.answerEN.toLowerCase().includes(q);
          if (!matchesQ) return false;
        }
        if (categoryFilter !== "all" && faq.category !== categoryFilter)
          return false;
        if (statusFilter !== "all" && faq.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "questionEN":
            cmp = a.questionEN.localeCompare(b.questionEN);
            break;
          case "category":
            cmp = a.category.localeCompare(b.category);
            break;
          case "createdDate":
            cmp =
              new Date(a.createdDate).getTime() -
              new Date(b.createdDate).getTime();
            break;
          case "updatedDate":
            cmp =
              new Date(a.updatedDate).getTime() -
              new Date(b.updatedDate).getTime();
            break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [faqs, search, categoryFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedFaqs = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // ─── Sorting ──────────────────────────────────────────────

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#003B95]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#003B95]" />
    );
  }

  // ─── Form Handlers ────────────────────────────────────────

  const openCreate = () => {
    setEditingFaq({
      questionEN: "",
      answerEN: "",
      category: "",
      status: "Active",
    });
    setEditingId(null);
    setFormErrors({});
    setPanelOpen(true);
  };

  const openEdit = (faq: FAQItem) => {
    setEditingFaq({
      questionEN: faq.questionEN,
      answerEN: faq.answerEN,
      category: faq.category,
      status: faq.status,
    });
    setEditingId(faq.id);
    setFormErrors({});
    setPanelOpen(true);
  };

  const validateForm = (): boolean => {
    if (!editingFaq) return false;
    const errs: FormErrors = {};

    if (!editingFaq.questionEN.trim()) {
      errs.questionEN = "Question (English) is required.";
    } else if (editingFaq.questionEN.trim().length < 5) {
      errs.questionEN = "Question must be at least 5 characters.";
    } else if (editingFaq.questionEN.length > 500) {
      errs.questionEN = "Question cannot exceed 500 characters.";
    }

    if (!editingFaq.answerEN.trim()) {
      errs.answerEN = "Answer (English) is required.";
    } else if (editingFaq.answerEN.trim().length < 10) {
      errs.answerEN = "Answer must be at least 10 characters.";
    } else if (editingFaq.answerEN.length > 2000) {
      errs.answerEN = "Answer cannot exceed 2000 characters.";
    }

    if (!editingFaq.category.trim()) {
      errs.category = "Category is required.";
    } else if (editingFaq.category.trim().length < 2) {
      errs.category = "Category must be at least 2 characters.";
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fix the errors before saving.");
      return false;
    }
    return true;
  };

  const saveFaq = () => {
    if (!editingFaq || !validateForm()) return;
    setSaving(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      if (editingId) {
        // Edit mode
        setFaqs((prev) =>
          prev.map((f) =>
            f.id === editingId
              ? {
                  ...f,
                  questionEN: editingFaq.questionEN.trim(),
                  answerEN: editingFaq.answerEN.trim(),
                  category: editingFaq.category.trim(),
                  status: editingFaq.status,
                  updatedDate: now,
                }
              : f,
          ),
        );
        toast.success("FAQ updated successfully.");
      } else {
        // Create mode
        const newFaq: FAQItem = {
          id: `faq-${Date.now()}`,
          questionEN: editingFaq.questionEN.trim(),
          answerEN: editingFaq.answerEN.trim(),
          category: editingFaq.category.trim(),
          status: editingFaq.status,
          createdDate: now,
          updatedDate: now,
        };
        setFaqs((prev) => [...prev, newFaq]);
        toast.success("FAQ created successfully.");
      }
      setSaving(false);
      setPanelOpen(false);
      setEditingFaq(null);
      setEditingId(null);
    }, 500);
  };

  // ─── Delete ───────────────────────────────────────────────

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    toast.success("FAQ deleted successfully.");
    setDeleteTarget(null);
  };

  // ─── Clear Filters ────────────────────────────────────────

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6B7280]">
            {faqs.length} FAQ item{faqs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#003B95] hover:bg-[#002a6b] gap-2 h-10"
        >
          <Plus className="h-4 w-4" />
          Create New FAQ
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by question or answer..."
            className="pl-8 h-10 text-sm"
            role="search"
            aria-label="Search FAQs by question or answer"
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
          value={categoryFilter}
          onValueChange={(val) => {
            setCategoryFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger
            className="w-48 h-10 text-sm"
            aria-label="Filter by category"
          >
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val as "all" | "Active" | "Inactive");
            setCurrentPage(1);
          }}
        >
          <SelectTrigger
            className="w-36 h-10 text-sm"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {isFiltered && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#003B95] hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* DataTable */}
      {filtered.length === 0 && faqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg bg-white">
          <HelpCircle className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-[#111827]">No FAQs found</p>
          <p className="text-xs text-[#6B7280] mt-1">
            No FAQ items have been created yet.
          </p>
          <Button
            onClick={openCreate}
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
          >
            <Plus className="h-3.5 w-3.5" /> Create New FAQ
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg bg-white">
          <Search className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-[#111827]">No FAQs found</p>
          <p className="text-xs text-[#6B7280] mt-1">
            No results match your search or filters.
          </p>
          <button
            onClick={clearFilters}
            className="text-xs text-[#003B95] hover:underline mt-3"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="px-3">
                  <button
                    onClick={() => toggleSort("questionEN")}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Question <SortIcon field="questionEN" />
                  </button>
                </TableHead>
                <TableHead className="px-3">
                  <button
                    onClick={() => toggleSort("category")}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Category <SortIcon field="category" />
                  </button>
                </TableHead>
                <TableHead className="px-3 w-24">Status</TableHead>
                <TableHead className="px-3 text-right w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFaqs.map((faq) => {
                const isExpanded = expandedId === faq.id;
                return (
                  <FaqTableRow
                    key={faq.id}
                    faq={faq}
                    isExpanded={isExpanded}
                    onToggleExpand={() =>
                      setExpandedId(isExpanded ? null : faq.id)
                    }
                    onEdit={() => openEdit(faq)}
                    onDelete={() => setDeleteTarget(faq)}
                  />
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, filtered.length)} of{" "}
                {filtered.length}
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
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1,
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
                          currentPage === p &&
                            "bg-[#003B95] hover:bg-[#002a6b]",
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

      {/* ─── FAQ Form Panel (Sheet) ──────────────────────────── */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          side="right"
          className="w-[500px] sm:max-w-[500px] overflow-y-auto"
          aria-label={editingId ? "Edit FAQ" : "Create New FAQ"}
        >
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit FAQ" : "Create New FAQ"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Update the FAQ details below."
                : "Fill in the details to create a new FAQ entry."}
            </SheetDescription>
          </SheetHeader>

          {editingFaq && (
            <div className="space-y-5 px-4 py-4">
              {/* Question EN */}
              <div className="space-y-2">
                <Label htmlFor="faq-q-en">
                  Question (English) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="faq-q-en"
                  value={editingFaq.questionEN}
                  onChange={(e) => {
                    setEditingFaq({
                      ...editingFaq,
                      questionEN: e.target.value,
                    });
                    setFormErrors((p) => ({ ...p, questionEN: undefined }));
                  }}
                  placeholder="Enter question in English"
                  maxLength={500}
                  className={cn(
                    "text-sm",
                    formErrors.questionEN && "border-red-400",
                  )}
                  aria-required="true"
                />
                <div className="flex items-center justify-between">
                  {formErrors.questionEN ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.questionEN}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={cn(
                      "text-[10px]",
                      editingFaq.questionEN.length > 480
                        ? "text-red-500"
                        : editingFaq.questionEN.length > 400
                          ? "text-amber-500"
                          : "text-gray-400",
                    )}
                  >
                    {editingFaq.questionEN.length}/500
                  </span>
                </div>
              </div>

              {/* Answer EN */}
              <div className="space-y-2">
                <Label htmlFor="faq-a-en">
                  Answer (English) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="faq-a-en"
                  value={editingFaq.answerEN}
                  onChange={(e) => {
                    setEditingFaq({ ...editingFaq, answerEN: e.target.value });
                    setFormErrors((p) => ({ ...p, answerEN: undefined }));
                  }}
                  placeholder="Enter answer in English"
                  maxLength={2000}
                  rows={5}
                  className={cn(
                    "text-sm",
                    formErrors.answerEN && "border-red-400",
                  )}
                  aria-required="true"
                />
                <div className="flex items-center justify-between">
                  {formErrors.answerEN ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.answerEN}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={cn(
                      "text-[10px]",
                      editingFaq.answerEN.length > 1900
                        ? "text-red-500"
                        : editingFaq.answerEN.length > 1500
                          ? "text-amber-500"
                          : "text-gray-400",
                    )}
                  >
                    {editingFaq.answerEN.length}/2000
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="faq-category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="faq-category"
                    value={editingFaq.category}
                    onChange={(e) => {
                      setEditingFaq({
                        ...editingFaq,
                        category: e.target.value,
                      });
                      setFormErrors((p) => ({ ...p, category: undefined }));
                    }}
                    placeholder="Select or type a category"
                    maxLength={100}
                    list="faq-categories"
                    className={cn(
                      "text-sm",
                      formErrors.category && "border-red-400",
                    )}
                    aria-required="true"
                  />
                  <datalist id="faq-categories">
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div className="flex items-center justify-between">
                  {formErrors.category ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.category}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] text-gray-400">
                    {editingFaq.category.length}/100
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    checked={editingFaq.status === "Active"}
                    onCheckedChange={(checked) =>
                      setEditingFaq({
                        ...editingFaq,
                        status: checked ? "Active" : "Inactive",
                      })
                    }
                    className="data-[state=checked]:bg-[#003B95]"
                  />
                  <span className="text-sm text-[#6B7280]">
                    {editingFaq.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="px-4 pb-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPanelOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={saveFaq}
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
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete this FAQ? This action cannot be undone.
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

// ─── FAQ Table Row (with expandable content) ───────────────

function FaqTableRow({
  faq,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  faq: FAQItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <TableRow
        className={cn("group", faq.status === "Inactive" && "opacity-60")}
      >
        <TableCell className="px-3">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2 text-left group/expand"
            aria-expanded={isExpanded}
            aria-label="Expand FAQ details"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 shrink-0 transition-transform",
                isExpanded && "rotate-180",
              )}
            />
            <span className="text-sm text-[#111827] group-hover/expand:text-[#003B95] transition-colors">
              {truncate(faq.questionEN, 80)}
            </span>
          </button>
        </TableCell>
        <TableCell className="px-3">
          <Badge variant="outline" className="text-[10px] font-normal">
            {faq.category}
          </Badge>
        </TableCell>
        <TableCell className="px-3">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] gap-1",
              faq.status === "Active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-500 border-gray-200",
            )}
          >
            {faq.status === "Active" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {faq.status}
          </Badge>
        </TableCell>
        <TableCell className="px-3 text-right">
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-7 w-7 p-0 text-gray-400 hover:text-[#003B95]"
              aria-label={`Edit FAQ: ${faq.questionEN.slice(0, 40)}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
              aria-label={`Delete FAQ: ${faq.questionEN.slice(0, 40)}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Content */}
      {isExpanded && (
        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
          <TableCell colSpan={4} className="px-6 py-4">
            <div className="space-y-3 ml-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#6B7280] mb-1">
                  Answer
                </p>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {truncate(faq.answerEN, 300)}
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
