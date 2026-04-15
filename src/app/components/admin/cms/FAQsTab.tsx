import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  HelpCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "../../ui/sheet";
import { Switch } from "../../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Textarea } from "../../ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../ui/command";
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
import { useCmsStore } from "@/stores/cms.store";

interface FAQFormData {
  questionEN: string;
  answerEN: string;
  category: string;
  status: "Active" | "Inactive";
}

type SortField = "questionEN" | "category";
type SortDir = "asc" | "desc";
const PAGE_SIZES = [10, 20, 50, 100];
const FAQ_CATEGORIES = [
  "Booking & Payments",
  "Account & Profile",
  "Cancellations & Refunds",
  "Tournaments",
  "Training Programs",
  "Facilities",
  "General",
];

type FormErrors = {
  questionEN?: string;
  answerEN?: string;
  category?: string;
};

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

function statusToApi(value: "Active" | "Inactive") {
  return value === "Active" ? "active" : "inactive";
}

function statusFromApi(value: string): "Active" | "Inactive" {
  return value === "active" ? "Active" : "Inactive";
}

export function FAQsTab() {
  const {
    pages,
    faqs,
    loading,
    error,
    fetchPages,
    fetchPageById,
    createFAQ,
    updateFAQ,
    deleteFAQ,
  } = useCmsStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [sortField, setSortField] = useState<SortField>("questionEN");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQFormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; questionEN: string } | null>(null);

  useEffect(() => {
    fetchPages().catch(() => {
      toast.error("Failed to load FAQs.");
    });
  }, [fetchPages]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);

  const normalizedFaqs = useMemo(
    () =>
      faqs.map((faq) => ({
        id: faq.id,
        questionEN: faq.question_en,
        answerEN: faq.answer_en,
        category: faq.category || "General",
        status: statusFromApi(faq.status),
      })),
    [faqs],
  );

  const availableCategories = useMemo(() => {
    const categories = new Set(normalizedFaqs.map((item) => item.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [normalizedFaqs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return normalizedFaqs
      .filter((faq) => {
        if (q) {
          const matches = faq.questionEN.toLowerCase().includes(q) || faq.answerEN.toLowerCase().includes(q);
          if (!matches) return false;
        }
        if (categoryFilter !== "all" && faq.category !== categoryFilter) return false;
        if (statusFilter !== "all" && faq.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const cmp =
          sortField === "questionEN"
            ? a.questionEN.localeCompare(b.questionEN)
            : a.category.localeCompare(b.category);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [normalizedFaqs, search, categoryFilter, statusFilter, sortField, sortDir]);

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFaqs = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = totalRecords > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safePage * pageSize, totalRecords);
  const isFiltered = search.trim() !== "" || categoryFilter !== "all" || statusFilter !== "all";
  const faqPageId = useMemo(() => {
    const faqPage =
      pages.find((page) => (page.page_type || "").toLowerCase().includes("faq")) ||
      pages.find((page) => (page.page_type || "").toLowerCase().includes("help"));
    return faqPage?.id || null;
  }, [pages]);

  useEffect(() => {
    if (!faqPageId) return;
    fetchPageById(faqPageId).catch(() => {
      toast.error("Failed to load FAQ entries.");
    });
  }, [faqPageId, fetchPageById]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (
        let i = Math.max(2, safePage - 1);
        i <= Math.min(totalPages - 1, safePage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const validateForm = () => {
    if (!editingFaq) return false;
    const nextErrors: FormErrors = {};
    if (!editingFaq.questionEN.trim()) nextErrors.questionEN = "Question (English) is required.";
    if (!editingFaq.answerEN.trim()) nextErrors.answerEN = "Answer (English) is required.";
    if (!editingFaq.category.trim()) nextErrors.category = "Category is required.";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

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

  const saveFaq = async () => {
    if (!editingFaq || !validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        question_en: editingFaq.questionEN.trim(),
        answer_en: editingFaq.answerEN.trim(),
        category: editingFaq.category.trim(),
        status: statusToApi(editingFaq.status),
      };
      if (editingId) {
        await updateFAQ(editingId, payload);
        toast.success("FAQ updated successfully.");
      } else {
        if (!faqPageId) {
          toast.error("FAQ page not found. Please create/load a CMS FAQ page first.");
          return;
        }
        await createFAQ({
          ...payload,
          page_id: faqPageId,
        });
        toast.success("FAQ created successfully.");
      }
      setPanelOpen(false);
      setEditingFaq(null);
      setEditingId(null);
      setFormErrors({});
    } catch {
      toast.error("Unable to save FAQ.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFAQ(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("FAQ deleted successfully.");
    } catch {
      toast.error("Unable to delete FAQ.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          {normalizedFaqs.length} FAQ item{normalizedFaqs.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={openCreate} className="bg-[#003B95] hover:bg-[#002a6b] gap-2 h-10">
          <Plus className="h-4 w-4" />
          Create New FAQ
        </Button>
      </div>

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
          onValueChange={(value) => {
            setCategoryFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-48 h-10 text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as "all" | "Active" | "Inactive");
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-36 h-10 text-sm">
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
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className="text-xs text-[#003B95] hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading.faqs && normalizedFaqs.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#6B7280] border rounded-lg bg-white">
          Loading FAQs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg bg-white">
          <HelpCircle className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-[#111827]">No FAQs found</p>
          <p className="text-xs text-[#6B7280] mt-1">
            {normalizedFaqs.length === 0
              ? "No FAQ items have been created yet."
              : "No results match your current filters."}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="px-3">
                  <button
                    onClick={() => {
                      if (sortField === "questionEN") {
                        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
                      } else {
                        setSortField("questionEN");
                        setSortDir("asc");
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Question
                    {sortField !== "questionEN" ? (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    ) : sortDir === "asc" ? (
                      <ArrowUp className="w-3 h-3 text-[#003B95]" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-[#003B95]" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="px-3">
                  <button
                    onClick={() => {
                      if (sortField === "category") {
                        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
                      } else {
                        setSortField("category");
                        setSortDir("asc");
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Category
                    {sortField !== "category" ? (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    ) : sortDir === "asc" ? (
                      <ArrowUp className="w-3 h-3 text-[#003B95]" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-[#003B95]" />
                    )}
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
                  <>
                    <TableRow key={faq.id} className={cn("group", faq.status === "Inactive" && "opacity-60")}>
                      <TableCell className="px-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                          className="flex items-center gap-2 text-left"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-gray-400 shrink-0 transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                          <span className="text-sm text-[#111827]">{truncate(faq.questionEN, 80)}</span>
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
                            onClick={() => {
                              setEditingId(faq.id);
                              setEditingFaq({
                                questionEN: faq.questionEN,
                                answerEN: faq.answerEN,
                                category: faq.category,
                                status: faq.status,
                              });
                              setPanelOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-[#003B95]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget({ id: faq.id, questionEN: faq.questionEN })}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50" key={`${faq.id}-expanded`}>
                        <TableCell colSpan={4} className="px-6 py-4">
                          <p className="text-sm text-[#6B7280] leading-relaxed">{truncate(faq.answerEN, 300)}</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-gray-50/50 gap-3">
            <div className="flex items-center gap-3 text-xs text-[#6B7280]">
              <span>
                Showing {rangeStart.toLocaleString()}-{rangeEnd.toLocaleString()} of {totalRecords.toLocaleString()}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#9CA3AF]">Rows:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {getPageNumbers().map((pageNumber, index) =>
                pageNumber === "..." ? (
                  <span key={`dots-${index}`} className="px-1 text-xs text-gray-400">
                    ...
                  </span>
                ) : (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === safePage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber as number)}
                    className={cn(
                      "h-7 w-7 p-0 text-xs",
                      pageNumber === safePage && "bg-[#003B95] hover:bg-[#002a6b]",
                    )}
                  >
                    {pageNumber}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit FAQ" : "Create New FAQ"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Update the FAQ details below." : "Fill in the details to create a new FAQ entry."}
            </SheetDescription>
          </SheetHeader>
          {editingFaq && (
            <div className="space-y-5 px-4 py-4">
              <div className="space-y-2">
                <Label>Question (English) *</Label>
                <Input
                  value={editingFaq.questionEN}
                  onChange={(e) => {
                    setEditingFaq({ ...editingFaq, questionEN: e.target.value });
                    setFormErrors((prev) => ({ ...prev, questionEN: undefined }));
                  }}
                  className={cn(formErrors.questionEN && "border-red-400")}
                />
                {formErrors.questionEN && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.questionEN}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Answer (English) *</Label>
                <Textarea
                  value={editingFaq.answerEN}
                  onChange={(e) => {
                    setEditingFaq({ ...editingFaq, answerEN: e.target.value });
                    setFormErrors((prev) => ({ ...prev, answerEN: undefined }));
                  }}
                  rows={5}
                  className={cn(formErrors.answerEN && "border-red-400")}
                />
                {formErrors.answerEN && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.answerEN}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        !editingFaq.category && "text-muted-foreground",
                        formErrors.category && "border-red-400",
                      )}
                    >
                      {editingFaq.category || "Select category"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {FAQ_CATEGORIES.map((category) => (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={(selectedValue) => {
                                setEditingFaq({
                                  ...editingFaq,
                                  category: selectedValue,
                                });
                                setCategoryOpen(false);
                                setFormErrors((prev) => ({ ...prev, category: undefined }));
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  editingFaq.category === category ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formErrors.category && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.category}
                  </p>
                )}
              </div>
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
                  <span className="text-sm text-[#6B7280]">{editingFaq.status}</span>
                </div>
              </div>
            </div>
          )}
          <SheetFooter className="px-4 pb-4 flex gap-2">
            <Button variant="outline" onClick={() => setPanelOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={saveFaq}
              disabled={saving || loading.faqs}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete "{deleteTarget?.questionEN}"? This action cannot be undone.
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
    </div>
  );
}
