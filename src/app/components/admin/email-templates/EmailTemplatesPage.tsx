// ─── SCR-ADM-045: Email Templates Management ────────────────────────────────
// Manage email templates for system-triggered transactional emails.
// List view: searchable/filterable table of all pre-seeded templates.
// Editor view: WYSIWYG (simulated) + preview + test send + variable insert.
// Dual language (EN / AR) with RTL support for Arabic content.

import { useState, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Mail,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Pencil,
  ArrowLeft,
  Save,
  Send,
  Eye,
  Code,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Image,
  Minus,
  Undo2,
  Redo2,
  Monitor,
  Smartphone,
  ChevronDown,
  Check,
  AlertTriangle,
  Loader2,
  Copy,
  Variable,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Card, CardContent } from "../../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../../ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import type {
  EmailTemplate,
  TemplateCategory,
  TemplateStatus,
  DynamicVariable,
} from "./types";
import {
  MOCK_EMAIL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  CATEGORY_COLORS,
} from "./types";

// ─── Constants ──────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 10;

type ViewMode = "list" | "editor";
type LanguageTab = "EN" | "AR";
type PreviewWidth = "desktop" | "mobile";

// ─── Helper: Replace variables with sample data ─────────────────────────────

function replaceVariables(text: string, variables: DynamicVariable[]): string {
  let result = text;
  for (const v of variables) {
    result = result.replace(
      new RegExp(`\\{\\{${v.name}\\}\\}`, "g"),
      v.sampleValue,
    );
  }
  // Handle any remaining unmatched variables
  result = result.replace(/\{\{(\w+)\}\}/g, "[{{$1}}]");
  return result;
}

// ─── Category Badge ─────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: TemplateCategory }) {
  const colors = CATEGORY_COLORS[category];
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium",
        colors.bg,
        colors.text,
        colors.border,
      )}
    >
      {category}
    </Badge>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TemplateStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium",
        status === "Active"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-gray-50 text-gray-500 border-gray-200",
      )}
    >
      {status}
    </Badge>
  );
}

// ─── Language Status Indicators ─────────────────────────────────────────────

function LanguageIndicators({
  hasEN,
  hasAR,
}: {
  hasEN: boolean;
  hasAR: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1"
        aria-label={`English template: ${hasEN ? "available" : "missing"}`}
      >
        <span className="text-xs font-medium text-gray-500">EN</span>
        {hasEN ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
      <div
        className="flex items-center gap-1"
        aria-label={`Arabic template: ${hasAR ? "available" : "missing"}`}
      >
        <span className="text-xs font-medium text-gray-500">AR</span>
        {hasAR ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
    </div>
  );
}

// ─── Skeleton Loader ────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <TableCell key={j}>
              <div
                className="h-4 bg-gray-200 rounded animate-pulse"
                style={{ width: `${50 + Math.random() * 50}%` }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Toolbar Button ─────────────────────────────────────────────────────────

function ToolbarBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "p-1.5 rounded-md hover:bg-gray-100 transition-colors",
            active && "bg-[#003B95]/10 text-[#003B95]",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export function EmailTemplatesPage() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [templates, setTemplates] =
    useState<EmailTemplate[]>(MOCK_EMAIL_TEMPLATES);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );

  // List view state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<"eventType" | "lastModified">(
    "lastModified",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading] = useState(false);

  // Editor view state
  const [activeTab, setActiveTab] = useState<LanguageTab>("EN");
  const [subjectEN, setSubjectEN] = useState("");
  const [subjectAR, setSubjectAR] = useState("");
  const [bodyEN, setBodyEN] = useState("");
  const [bodyAR, setBodyAR] = useState("");
  const [isSourceView, setIsSourceView] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [hasUnsavedEN, setHasUnsavedEN] = useState(false);
  const [hasUnsavedAR, setHasUnsavedAR] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [testSendOpen, setTestSendOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onDiscard?: () => void;
    confirmLabel?: string;
    discardLabel?: string;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // ─── Filtered & Sorted Templates ────────────────────────────────────────────

  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.eventType.toLowerCase().includes(q) ||
          t.subjectEN.toLowerCase().includes(q),
      );
    }

    // Category filter
    if (categoryFilter !== "All") {
      result = result.filter((t) => t.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === "eventType") {
        return sortDir === "asc"
          ? a.eventType.localeCompare(b.eventType)
          : b.eventType.localeCompare(a.eventType);
      }
      return sortDir === "asc"
        ? new Date(a.lastModified).getTime() -
            new Date(b.lastModified).getTime()
        : new Date(b.lastModified).getTime() -
            new Date(a.lastModified).getTime();
    });

    return result;
  }, [templates, search, categoryFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / ROWS_PER_PAGE),
  );
  const pagedTemplates = filteredTemplates.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSort = useCallback((field: "eventType" | "lastModified") => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDir("asc");
      return field;
    });
  }, []);

  const openEditor = useCallback((template: EmailTemplate) => {
    setEditingTemplate(template);
    setSubjectEN(template.subjectEN);
    setSubjectAR(template.subjectAR);
    setBodyEN(template.bodyEN);
    setBodyAR(template.bodyAR);
    setActiveTab("EN");
    setIsSourceView(false);
    setPreviewWidth("desktop");
    setHasUnsavedEN(false);
    setHasUnsavedAR(false);
    setTestEmail("");
    setVariablesOpen(false);
    setTestSendOpen(false);
    setViewMode("editor");
  }, []);

  const handleBackToList = useCallback(() => {
    if (hasUnsavedEN || hasUnsavedAR) {
      setConfirmDialog({
        open: true,
        title: "Unsaved Changes",
        description: "You have unsaved changes. Discard and leave?",
        confirmLabel: "Discard",
        onConfirm: () => {
          setViewMode("list");
          setEditingTemplate(null);
          setConfirmDialog((p) => ({ ...p, open: false }));
        },
      });
    } else {
      setViewMode("list");
      setEditingTemplate(null);
    }
  }, [hasUnsavedEN, hasUnsavedAR]);

  const handleSubjectChange = useCallback(
    (value: string) => {
      if (activeTab === "EN") {
        setSubjectEN(value);
        setHasUnsavedEN(true);
      } else {
        setSubjectAR(value);
        setHasUnsavedAR(true);
      }
    },
    [activeTab],
  );

  const handleBodyChange = useCallback(
    (value: string) => {
      if (activeTab === "EN") {
        setBodyEN(value);
        setHasUnsavedEN(true);
      } else {
        setBodyAR(value);
        setHasUnsavedAR(true);
      }
    },
    [activeTab],
  );

  const handleSave = useCallback(() => {
    if (!editingTemplate) return;

    const currentSubject = activeTab === "EN" ? subjectEN : subjectAR;
    const currentBody = activeTab === "EN" ? bodyEN : bodyAR;

    if (!currentSubject.trim()) {
      toast.error("Email subject is required.");
      return;
    }
    if (currentSubject.length > 200) {
      toast.error("Subject must not exceed 200 characters.");
      return;
    }
    if (!currentBody.trim()) {
      toast.error("Email body content is required.");
      return;
    }
    if (currentBody.length > 50000) {
      toast.error("Email body exceeds maximum length.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.id !== editingTemplate.id) return t;
          return {
            ...t,
            subjectEN,
            subjectAR,
            bodyEN,
            bodyAR,
            hasEN: !!bodyEN.trim(),
            hasAR: !!bodyAR.trim(),
            lastModified: new Date().toISOString(),
            modifiedBy: "Current Admin",
          };
        }),
      );
      if (activeTab === "EN") setHasUnsavedEN(false);
      else setHasUnsavedAR(false);
      setIsSaving(false);
      toast.success(
        activeTab === "EN"
          ? "English template saved successfully."
          : "Arabic template saved successfully.",
      );
    }, 800);
  }, [editingTemplate, activeTab, subjectEN, subjectAR, bodyEN, bodyAR]);

  const handleSendTest = useCallback(() => {
    if (!testEmail.trim()) {
      toast.error("Please enter a test email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      toast.success(`Test email sent to ${testEmail}. Check your inbox.`);
    }, 1200);
  }, [testEmail]);

  const handleTabSwitch = useCallback(
    (newTab: LanguageTab) => {
      const hasUnsaved = activeTab === "EN" ? hasUnsavedEN : hasUnsavedAR;
      if (hasUnsaved) {
        setConfirmDialog({
          open: true,
          title: "Unsaved Changes",
          description: `You have unsaved changes in the ${activeTab} tab. Save before switching?`,
          confirmLabel: "Save",
          discardLabel: "Discard",
          onConfirm: () => {
            handleSave();
            setActiveTab(newTab);
            setConfirmDialog((p) => ({ ...p, open: false }));
          },
          onDiscard: () => {
            if (editingTemplate) {
              if (activeTab === "EN") {
                setSubjectEN(editingTemplate.subjectEN);
                setBodyEN(editingTemplate.bodyEN);
                setHasUnsavedEN(false);
              } else {
                setSubjectAR(editingTemplate.subjectAR);
                setBodyAR(editingTemplate.bodyAR);
                setHasUnsavedAR(false);
              }
            }
            setActiveTab(newTab);
            setConfirmDialog((p) => ({ ...p, open: false }));
          },
        });
      } else {
        setActiveTab(newTab);
      }
    },
    [activeTab, hasUnsavedEN, hasUnsavedAR, editingTemplate, handleSave],
  );

  const handleInsertVariable = useCallback(
    (varName: string) => {
      const insertion = `{{${varName}}}`;
      if (activeTab === "EN") {
        setBodyEN((prev) => prev + insertion);
        setHasUnsavedEN(true);
      } else {
        setBodyAR((prev) => prev + insertion);
        setHasUnsavedAR(true);
      }
    },
    [activeTab],
  );

  // ─── Preview HTML ─────────────────────────────────────────────────────────

  const previewHtml = useMemo(() => {
    if (!editingTemplate) return "";
    const body = activeTab === "EN" ? bodyEN : bodyAR;
    const subject = activeTab === "EN" ? subjectEN : subjectAR;
    if (!body.trim()) return "";

    const replaced = replaceVariables(body, editingTemplate.variables);
    const dir = activeTab === "AR" ? "rtl" : "ltr";
    return `
      <div style="font-family: Arial, sans-serif; direction: ${dir}; padding: 24px; color: #111827;">
        <div style="max-width: 100%; margin: 0 auto;">
          <div style="background: #003B95; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
            <strong style="font-size: 14px;">${replaceVariables(subject, editingTemplate.variables)}</strong>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            ${replaced}
          </div>
          <div style="text-align: center; padding: 16px; color: #6B7280; font-size: 12px;">
            <p>&copy; 2026 Playzoon. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;
  }, [editingTemplate, activeTab, bodyEN, bodyAR, subjectEN, subjectAR]);

  // Current editor values
  const currentSubject = activeTab === "EN" ? subjectEN : subjectAR;
  const currentBody = activeTab === "EN" ? bodyEN : bodyAR;
  const currentHasUnsaved = activeTab === "EN" ? hasUnsavedEN : hasUnsavedAR;
  const anyUnsaved = hasUnsavedEN || hasUnsavedAR;

  // Char count
  const bodyCharCount = currentBody.length;
  const bodyCharWarning = bodyCharCount > 45000;
  const bodyCharError = bodyCharCount > 50000;

  // ═════════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═════════════════════════════════════════════════════════════════════════════

  if (viewMode === "list") {
    return (
      <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
            <span>Admin Portal</span>
            <ChevronRight className="w-3 h-3" />
            <span>CMS &amp; Notifications</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">Email Templates</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Email Templates
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage email templates for system-triggered transactional emails.
            Edit content in English and Arabic with dynamic variable support.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by event name or subject..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10 bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] h-10 bg-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {TEMPLATE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[130px] h-10 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Templates Table */}
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead
                    className="cursor-pointer hover:text-[#003B95] select-none"
                    onClick={() => handleSort("eventType")}
                  >
                    <div className="flex items-center gap-1">
                      Event Type
                      {sortField === "eventType" && (
                        <span className="text-[10px]">
                          {sortDir === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject Line (EN)</TableHead>
                  <TableHead>Language Status</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-[#003B95] select-none"
                    onClick={() => handleSort("lastModified")}
                  >
                    <div className="flex items-center gap-1">
                      Last Modified
                      {sortField === "lastModified" && (
                        <span className="text-[10px]">
                          {sortDir === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Modified By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : pagedTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Mail className="h-10 w-10" />
                        <p className="text-sm font-medium text-gray-500">
                          No templates match your search.
                        </p>
                        <p className="text-xs">
                          Try adjusting your search or filter criteria.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedTemplates.map((template, idx) => (
                    <TableRow
                      key={template.id}
                      className={cn(
                        "cursor-pointer hover:bg-blue-50/40 transition-colors",
                        idx % 2 === 1 && "bg-gray-50/30",
                      )}
                      onClick={() => openEditor(template)}
                    >
                      <TableCell className="font-medium text-[#111827] text-sm">
                        {template.eventType}
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={template.category} />
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <span className="text-sm text-gray-600 truncate block">
                          {template.subjectEN}
                        </span>
                      </TableCell>
                      <TableCell>
                        <LanguageIndicators
                          hasEN={template.hasEN}
                          hasAR={template.hasAR}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {format(
                          parseISO(template.lastModified),
                          "MMM d, yyyy HH:mm",
                        )}{" "}
                        UTC
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {template.modifiedBy}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={template.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditor(template);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-gray-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit template</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredTemplates.length > ROWS_PER_PAGE && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-500">
              Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}
              {"\u2013"}
              {Math.min(
                currentPage * ROWS_PER_PAGE,
                filteredTemplates.length,
              )}{" "}
              of {filteredTemplates.length} templates
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 text-xs",
                    currentPage === i + 1 && "bg-[#003B95] text-white",
                  )}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // EDITOR VIEW
  // ═════════════════════════════════════════════════════════════════════════════

  if (!editingTemplate) return null;

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
            <button
              type="button"
              onClick={handleBackToList}
              className="hover:text-[#003B95] transition-colors"
            >
              Email Templates
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">
              Edit: {editingTemplate.eventType}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Edit: {editingTemplate.eventType}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <CategoryBadge category={editingTemplate.category} />
            <StatusBadge status={editingTemplate.status} />
            {anyUnsaved && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]"
              >
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="gap-1.5 text-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestSendOpen((v) => !v)}
            className="gap-1.5"
          >
            <Send className="h-4 w-4" />
            Send Test
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !currentHasUnsaved}
            className="gap-1.5 bg-[#003B95] hover:bg-[#002d73]"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Template
          </Button>
        </div>
      </div>

      {/* Language Tabs */}
      <div
        className="flex items-center gap-0 border-b border-gray-200"
        role="tablist"
      >
        <button
          role="tab"
          aria-selected={activeTab === "EN"}
          onClick={() => handleTabSwitch("EN")}
          className={cn(
            "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors relative",
            activeTab === "EN"
              ? "border-[#003B95] text-[#003B95]"
              : "border-transparent text-gray-500 hover:text-gray-700",
          )}
        >
          English (EN)
          {hasUnsavedEN && (
            <span className="absolute top-2 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "AR"}
          onClick={() => handleTabSwitch("AR")}
          className={cn(
            "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors relative",
            activeTab === "AR"
              ? "border-[#003B95] text-[#003B95]"
              : "border-transparent text-gray-500 hover:text-gray-700",
          )}
        >
          Arabic (AR)
          {hasUnsavedAR && (
            <span className="absolute top-2 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* Subject Line */}
      <div className="space-y-1.5">
        <Label
          htmlFor="email-subject"
          className="text-sm font-medium text-[#111827]"
        >
          Email Subject
        </Label>
        <div className="relative">
          <Input
            id="email-subject"
            placeholder="Enter email subject line"
            value={currentSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            maxLength={200}
            dir={activeTab === "AR" ? "rtl" : "ltr"}
            className="h-10 bg-white pr-16"
            aria-required="true"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
            {currentSubject.length}/200
          </span>
        </div>
      </div>

      {/* Two Column Layout: Editor + Preview */}
      <div className="grid grid-cols-[55%_45%] gap-5">
        {/* Left: Editor */}
        <div className="space-y-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#111827]">Email Body</h2>
            <div className="flex items-center gap-2">
              {/* Variable Insert */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                  >
                    <Variable className="h-3.5 w-3.5" />
                    Insert Variable
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-72 max-h-64 overflow-auto"
                  align="end"
                >
                  <DropdownMenuLabel className="text-xs text-gray-500">
                    Available Variables
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {editingTemplate.variables.map((v) => (
                    <DropdownMenuItem
                      key={v.name}
                      onClick={() => handleInsertVariable(v.name)}
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <span className="font-mono text-xs text-[#003B95]">
                        {`{{${v.name}}}`}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {v.description}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Source/Visual Toggle */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => setIsSourceView((v) => !v)}
                aria-pressed={isSourceView}
              >
                {isSourceView ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Visual Editor
                  </>
                ) : (
                  <>
                    <Code className="h-3.5 w-3.5" />
                    HTML Source
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Toolbar (shown in visual mode) */}
          {!isSourceView && (
            <div className="flex items-center gap-0.5 p-1.5 bg-white border border-b-0 rounded-t-lg flex-wrap">
              <ToolbarBtn icon={Bold} label="Bold" />
              <ToolbarBtn icon={Italic} label="Italic" />
              <ToolbarBtn icon={Underline} label="Underline" />
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <ToolbarBtn icon={List} label="Bullet list" />
              <ToolbarBtn icon={ListOrdered} label="Numbered list" />
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <ToolbarBtn icon={Heading1} label="Heading 1" />
              <ToolbarBtn icon={Heading2} label="Heading 2" />
              <ToolbarBtn icon={Heading3} label="Heading 3" />
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <ToolbarBtn icon={Link2} label="Insert link" />
              <ToolbarBtn icon={Image} label="Insert image (URL)" />
              <ToolbarBtn icon={Minus} label="Horizontal rule" />
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <ToolbarBtn icon={Undo2} label="Undo" />
              <ToolbarBtn icon={Redo2} label="Redo" />
            </div>
          )}

          {/* Editor Area */}
          <Textarea
            value={currentBody}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder="Compose your email template here..."
            dir={activeTab === "AR" ? "rtl" : "ltr"}
            className={cn(
              "min-h-[400px] bg-white resize-y",
              isSourceView
                ? "font-mono text-xs rounded-lg"
                : "rounded-t-none rounded-b-lg",
              "focus:ring-[#003B95] focus:border-[#003B95]",
            )}
            aria-label="Email body editor"
            aria-multiline="true"
          />

          {/* Char count */}
          <div className="flex items-center justify-end gap-2 mt-1">
            <span
              className={cn(
                "text-[11px]",
                bodyCharError
                  ? "text-red-600 font-medium"
                  : bodyCharWarning
                    ? "text-amber-600"
                    : "text-gray-400",
              )}
            >
              {bodyCharCount.toLocaleString()} / 50,000 characters
            </span>
          </div>
        </div>

        {/* Right: Preview Panel */}
        <div className="space-y-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#111827]">Preview</h2>
            <div
              className="flex items-center bg-white border rounded-lg p-0.5"
              role="radiogroup"
              aria-label="Preview width"
            >
              <button
                type="button"
                role="radio"
                aria-checked={previewWidth === "desktop"}
                onClick={() => setPreviewWidth("desktop")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  previewWidth === "desktop"
                    ? "bg-[#003B95] text-white"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
                Desktop
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={previewWidth === "mobile"}
                onClick={() => setPreviewWidth("mobile")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  previewWidth === "mobile"
                    ? "bg-[#003B95] text-white"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </button>
            </div>
          </div>

          <div
            className="border rounded-lg bg-gray-100 p-4 min-h-[460px] overflow-auto"
            role="region"
            aria-label="Email preview"
            aria-live="polite"
          >
            {previewHtml ? (
              <div
                className="mx-auto bg-white rounded shadow-sm overflow-hidden"
                style={{
                  maxWidth: previewWidth === "desktop" ? 600 : 320,
                  transition: "max-width 300ms ease",
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  className="text-sm"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
                <Eye className="h-8 w-8 mb-2" />
                <p className="text-sm">Start composing to see a preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Variables Reference */}
      <Collapsible open={variablesOpen} onOpenChange={setVariablesOpen}>
        <Card className="border shadow-sm">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-between w-full p-4 hover:bg-gray-50/60 transition-colors"
              aria-expanded={variablesOpen}
            >
              <div className="flex items-center gap-2">
                <Variable className="h-4 w-4 text-[#003B95]" />
                <h2 className="text-sm font-semibold text-[#111827]">
                  Dynamic Variables Reference
                </h2>
                <Badge variant="outline" className="text-[10px]">
                  {editingTemplate.variables.length} variables
                </Badge>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-500 transition-transform",
                  variablesOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4">
              <div className="grid grid-cols-2 gap-2" role="list">
                {editingTemplate.variables.map((v) => (
                  <div
                    key={v.name}
                    role="listitem"
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <code className="text-xs font-mono text-[#003B95] bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                      {`{{${v.name}}}`}
                    </code>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700">{v.description}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Sample: {v.sampleValue}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleInsertVariable(v.name)}
                          className="shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-[#003B95]"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Insert into editor</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Test Send Section */}
      <Collapsible open={testSendOpen} onOpenChange={setTestSendOpen}>
        <Card className="border shadow-sm">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-between w-full p-4 hover:bg-gray-50/60 transition-colors"
              aria-expanded={testSendOpen}
            >
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-[#003B95]" />
                <h2 className="text-sm font-semibold text-[#111827]">
                  Send Test Email
                </h2>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-500 transition-transform",
                  testSendOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4">
              <div
                className="flex items-end gap-3"
                aria-label="Send test email"
              >
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="test-email" className="text-sm text-gray-600">
                    Test Email Address
                  </Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="Enter email to receive test"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="h-10 bg-white max-w-md"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testEmail.trim()}
                  className="gap-1.5 h-10"
                  aria-label="Send test email"
                >
                  {isSendingTest ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Test Email
                </Button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Sends the current {activeTab === "EN" ? "English" : "Arabic"}{" "}
                template with sample data to the specified email address.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog((p) => ({ ...p, open: false }));
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDialog((p) => ({ ...p, open: false }))}
            >
              Cancel
            </Button>
            {confirmDialog.onDiscard && (
              <Button
                variant="outline"
                size="sm"
                onClick={confirmDialog.onDiscard}
              >
                {confirmDialog.discardLabel || "Discard"}
              </Button>
            )}
            <Button
              size="sm"
              className="bg-[#003B95] hover:bg-[#002d73]"
              onClick={confirmDialog.onConfirm}
            >
              {confirmDialog.confirmLabel || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
