import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  Pencil,
  Save,
  Globe,
  Clock,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Undo,
  Redo,
  CheckCircle2,
  History,
  RotateCcw,
  Languages,
  Shield,
  Info,
  HelpCircle,
  Share2,
  Indent,
  Outdent,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
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
import { ScrollArea } from "../../ui/scroll-area";
import { adminService } from "@/services/admin.service";
// ─── Types ──────────────────────────────────────────────────

interface PageVersion {
  id: string;
  versionNumber: number;
  timestamp: string;
  status: "published" | "draft";
  contentEn: string;
  contentAr: string;
  author: string;
  charCount: number;
}

interface StaticPage {
  id: string;
  title: string;
  status: "active" | "inactive";
  lastUpdated: string;
  lastUpdatedBy: string;
  lastPublished: string | null;
  contentEn: string;
  contentAr: string;
  versions: PageVersion[];
}

interface SocialMediaLinks {
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
}

type PageTab = "terms" | "privacy" | "about" | "help" | "social";
type ApiEnvelope = {
  data?: unknown;
  pages?: unknown[];
  versions?: unknown[];
  [key: string]: unknown;
};

// ─── Helpers ────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripHtml(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

/** Map an API page_type string → our local tab key */
function resolveTabKey(raw: string): string {
  const v = raw.toLowerCase();
  if (v.includes("term")) return "terms";
  if (v.includes("priv")) return "privacy";
  if (v.includes("about")) return "about";
  if (v.includes("help")) return "help";
  return v;
}

/** Normalise a raw API page object into our StaticPage shape */
function normaliseApiPage(p: Record<string, unknown>): StaticPage {
  const rawStatus = String(p.status ?? "inactive").toLowerCase();
  return {
    id: String(p.id ?? ""),
    title: String(p.title_en ?? p.title ?? ""),
    status: (rawStatus === "active" ? "active" : "inactive"),
    lastUpdated: String(p.updated_at ?? p.last_updated_at ?? new Date().toISOString()),
    lastUpdatedBy: String(p.updated_by ?? p.last_updated_by ?? "Admin"),
    lastPublished: p.published_at ? String(p.published_at) : null,
    contentEn: String(p.content_en ?? ""),
    contentAr: String(p.content_ar ?? ""),
    versions: [],
  };
}

/** Normalise a raw API version object into our PageVersion shape */
function normaliseApiVersion(v: Record<string, unknown>): PageVersion {
  return {
    id: String(v.id ?? ""),
    versionNumber: Number(v.version_number ?? v.versionNumber ?? 0),
    timestamp: String(v.created_at ?? v.timestamp ?? new Date().toISOString()),
    status: (String(v.status ?? "draft") as PageVersion["status"]),
    contentEn: String(v.content_en ?? ""),
    contentAr: String(v.content_ar ?? ""),
    author: String(v.created_by ?? v.author ?? "Admin"),
    charCount: Number(v.char_count ?? v.charCount ?? 0),
  };
}

function extractList(payload: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  }
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as ApiEnvelope;

  for (const key of keys) {
    const direct = obj[key];
    if (Array.isArray(direct)) {
      return direct.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
    }
  }
  if (Array.isArray(obj.data)) {
    return obj.data.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  }
  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as ApiEnvelope;
    for (const key of keys) {
      const nestedValue = nested[key];
      if (Array.isArray(nestedValue)) {
        return nestedValue.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
      }
    }
    if (Array.isArray(nested.data)) {
      return nested.data.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
    }
  }
  return [];
}

function extractObject(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const obj = payload as ApiEnvelope;
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    const nested = obj.data as ApiEnvelope;
    if (nested.data && typeof nested.data === "object" && !Array.isArray(nested.data)) {
      return nested.data as Record<string, unknown>;
    }
    return nested as Record<string, unknown>;
  }
  return obj as Record<string, unknown>;
}

const PAGE_TABS: { id: PageTab; label: string; icon: React.ElementType }[] = [
  { id: "terms",   label: "Terms & Conditions", icon: FileText },
  { id: "privacy", label: "Privacy Policy",      icon: Shield   },
  { id: "about",   label: "About Us",            icon: Info     },
  { id: "help",    label: "Help Center",         icon: HelpCircle },
  { id: "social",  label: "Social Media",        icon: Share2   },
];

// ─── Rich Text Toolbar Button ───────────────────────────────

function RteBtn({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded hover:bg-gray-200 transition-colors",
        active ? "bg-gray-200 text-[#003B95]" : "text-gray-500",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// ─── Social Media Form ──────────────────────────────────────

function SocialMediaForm() {
  const [links, setLinks] = useState<SocialMediaLinks>({
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SocialMediaLinks, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const socialFields: {
    key: keyof SocialMediaLinks;
    label: string;
    icon: React.ElementType;
    placeholder: string;
  }[] = [
    { key: "facebook",  label: "Facebook URL",  icon: Facebook,    placeholder: "https://facebook.com/..."  },
    { key: "twitter",   label: "Twitter / X URL",icon: Twitter,     placeholder: "https://x.com/..."         },
    { key: "instagram", label: "Instagram URL",  icon: Instagram,   placeholder: "https://instagram.com/..." },
    { key: "linkedin",  label: "LinkedIn URL",   icon: Linkedin,    placeholder: "https://linkedin.com/..."  },
    { key: "youtube",   label: "YouTube URL",    icon: Youtube,     placeholder: "https://youtube.com/..."   },
    { key: "tiktok",    label: "TikTok URL",     icon: ExternalLink,placeholder: "https://tiktok.com/..."    },
  ];

  // Load links from API
  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.getSocialLinks();
        const data = extractObject(res);
        setLinks({
          facebook:  String(data.facebook  ?? ""),
          twitter:   String(data.twitter   ?? ""),
          instagram: String(data.instagram ?? ""),
          linkedin:  String(data.linkedin  ?? ""),
          youtube:   String(data.youtube   ?? ""),
          tiktok:    String(data.tiktok    ?? ""),
        });
      } catch {
        toast.error("Failed to load social media links.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validateUrl = (url: string): string | null => {
    if (!url.trim()) return null;
    if (!url.startsWith("https://")) return "URL must start with https://";
    if (url.length > 500) return "URL cannot exceed 500 characters.";
    return null;
  };

  const handleSave = async () => {
    const newErrors: Partial<Record<keyof SocialMediaLinks, string>> = {};
    let hasError = false;
    for (const field of socialFields) {
      const err = validateUrl(links[field.key]);
      if (err) { newErrors[field.key] = err; hasError = true; }
    }
    setErrors(newErrors);
    if (hasError) return;

    setSaving(true);
    try {
      await adminService.updateSocialLinks({ ...links });
      toast.success("Social media links updated successfully.");
    } catch {
      toast.error("Failed to save social media links.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#003B95]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div className="bg-white border rounded-lg p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">Social Media Links</h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage your platform's social media presence. These links appear in the app footer and about pages.
          </p>
        </div>

        <div className="space-y-4">
          {socialFields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-sm text-[#111827] flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#6B7280]" />
                  {field.label}
                </Label>
                <Input
                  value={links[field.key]}
                  onChange={(e) => {
                    setLinks({ ...links, [field.key]: e.target.value });
                    setErrors({ ...errors, [field.key]: undefined });
                  }}
                  placeholder={field.placeholder}
                  className={cn("text-sm", errors[field.key] && "border-red-400 focus-visible:ring-red-400")}
                />
                {errors[field.key] && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors[field.key]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-[#003B95] hover:bg-[#002a6b] gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Links"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function StaticPagesTab() {
  const [pages, setPages] = useState<Record<string, StaticPage>>({});
  const [pagesLoading, setPagesLoading] = useState(true);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [activePageTab, setActivePageTab] = useState<PageTab>("terms");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState<PageVersion | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isVersionPreview, setIsVersionPreview] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<PageVersion | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const isContentPage = activePageTab !== "social";
  const currentPage = pages[activePageTab] ?? null;

  // ── Load all CMS pages from API ───────────────────────────

  useEffect(() => {
    (async () => {
      setPagesLoading(true);
      try {
        const res = await adminService.getPages();
        const list = extractList(res, ["pages"]);

        if (Array.isArray(list) && list.length > 0) {
          const mapped: Record<string, StaticPage> = {};
          list.forEach((p) => {
            const raw = p as Record<string, unknown>;
            const key = resolveTabKey(String(raw.page_type ?? raw.id ?? ""));
            mapped[key] = normaliseApiPage(raw);
          });
          setPages(mapped);
        }
      } catch {
        toast.error("Failed to load CMS pages.");
      } finally {
        setPagesLoading(false);
      }
    })();
  }, []);

  // ── Load versions whenever the active page changes ─────────

  useEffect(() => {
    if (!isContentPage || !currentPage?.id) return;

    (async () => {
      setVersionsLoading(true);
      try {
        const res = await adminService.getCmsVersions(currentPage.id);
        const list = extractList(res, ["versions"]);

        setPages((prev) => ({
          ...prev,
          [activePageTab]: {
            ...prev[activePageTab],
            versions: Array.isArray(list) ? list.map(normaliseApiVersion) : [],
          },
        }));
      } catch {
        // Silently fail — versions panel just stays empty
      } finally {
        setVersionsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageTab, currentPage?.id]);

  // ── Sync editor → state ────────────────────────────────────

  const syncEditor = useCallback(() => {
    if (!editorRef.current || !currentPage || isVersionPreview) return;
    const html = editorRef.current.innerHTML;
    setPages((prev) => {
      const page = prev[activePageTab];
      if (!page) return prev;
      return {
        ...prev,
        [activePageTab]: {
          ...page,
          contentEn: lang === "en" ? html : page.contentEn,
          contentAr: lang === "ar" ? html : page.contentAr,
        },
      };
    });
    setHasChanges(true);
  }, [lang, activePageTab, currentPage, isVersionPreview]);

  // ── Populate editor when lang/page changes ─────────────────

  useEffect(() => {
    if (!editorRef.current || !currentPage || !isContentPage) return;

    const content = isVersionPreview && previewVersion
      ? (lang === "en" ? previewVersion.contentEn : previewVersion.contentAr)
      : (lang === "en" ? currentPage.contentEn : currentPage.contentAr);

    if (editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [
    lang,
    activePageTab,
    currentPage?.contentEn,
    currentPage?.contentAr,
    isVersionPreview,
    previewVersion,
    isContentPage,
  ]);

  // ── RTE exec helper ────────────────────────────────────────

  const exec = (command: string, value?: string) => {
    if (isVersionPreview) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // ── Validate ───────────────────────────────────────────────

  const validateContent = (): boolean => {
    syncEditor();
    const text = stripHtml(editorRef.current?.innerHTML || "").trim();
    if (!text) {
      setContentError(
        lang === "en"
          ? "English content is required for publishing."
          : "Arabic content is required for publishing.",
      );
      return false;
    }
    setContentError(null);
    return true;
  };

  // ── Save Draft ─────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!currentPage?.id) return;
    syncEditor();

    const html = editorRef.current?.innerHTML || "";
    const contentEn = lang === "en" ? html : currentPage.contentEn;
    const contentAr = lang === "ar" ? html : currentPage.contentAr;

    setIsSaving(true);
    try {
      await adminService.updateCmsPage(currentPage.id, {
        content_en: contentEn,
        content_ar: contentAr,
        content_en_status: "draft",
        content_ar_status: "draft",
      });

      const now = new Date().toISOString();
      setPages((prev) => ({
        ...prev,
        [activePageTab]: { ...prev[activePageTab], contentEn, contentAr, lastUpdated: now },
      }));
      setHasChanges(false);
      toast.success("Draft saved successfully.");
    } catch {
      toast.error("Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => {
    if (!validateContent()) return;
    setPublishConfirmOpen(true);
  };

  const confirmPublish = async () => {
    if (!currentPage?.id) return;
    syncEditor();

    const html = editorRef.current?.innerHTML || "";
    const contentEn = lang === "en" ? html : currentPage.contentEn;
    const contentAr = lang === "ar" ? html : currentPage.contentAr;

    setIsPublishing(true);
    try {
      // Backend route is PATCH /admin/cms/pages/:id (no /publish endpoint)
      await adminService.updateCmsPage(currentPage.id, {
        content_en: contentEn,
        content_ar: contentAr,
        status: "active",
        content_en_status: "published",
        content_ar_status: "published",
      });

      const now = new Date().toISOString();
      setPages((prev) => ({
        ...prev,
        [activePageTab]: {
          ...prev[activePageTab],
          contentEn,
          contentAr,
          status: "active",
          lastUpdated: now,
          lastPublished: now,
        },
      }));
      setHasChanges(false);
      setPublishConfirmOpen(false);
      toast.success("Content published successfully.");
    } catch {
      toast.error("Failed to publish content.");
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Version Preview / Restore ──────────────────────────────

  const handleVersionPreview = (version: PageVersion) => {
    syncEditor();
    setIsVersionPreview(true);
    setPreviewVersion(version);
  };

  const handleBackToCurrent = () => {
    setIsVersionPreview(false);
    setPreviewVersion(null);
  };

  const handleRestore = async (version: PageVersion) => {
    if (!currentPage?.id || !version?.id) return;
    try {
      await adminService.restoreCmsVersion(currentPage.id, version.id);

      setPages((prev) => ({
        ...prev,
        [activePageTab]: {
          ...prev[activePageTab],
          contentEn: version.contentEn,
          contentAr: version.contentAr,
        },
      }));
      setIsVersionPreview(false);
      setPreviewVersion(null);
      setRestoreConfirmOpen(null);
      setHasChanges(true);
      toast.success("Version restored as draft. Review and publish when ready.");
    } catch {
      toast.error("Failed to restore version.");
    }
  };

  // ── Tab switch ─────────────────────────────────────────────

  const switchPageTab = (tab: PageTab) => {
    if (isVersionPreview) handleBackToCurrent();
    setActivePageTab(tab);
    setLang("en");
    setContentError(null);
    setHasChanges(false);
  };

  // ── Loading screen ─────────────────────────────────────────

  if (pagesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#003B95]" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-0">
      {/* Page Selector Tab Bar */}
      <div className="border-b bg-white rounded-t-lg">
        <div className="flex items-center gap-0 overflow-x-auto">
          {PAGE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePageTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchPageTab(tab.id)}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors",
                  isActive
                    ? "border-[#003B95] text-[#003B95] font-medium"
                    : "border-transparent text-[#6B7280] hover:text-[#111827] hover:border-gray-300",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Social Media Tab */}
      {!isContentPage && (
        <div className="bg-white border border-t-0 rounded-b-lg p-6">
          <SocialMediaForm />
        </div>
      )}

      {/* Content Pages */}
      {isContentPage && (
        <div className="bg-white border border-t-0 rounded-b-lg">
          {!currentPage ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
              <AlertCircle className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm">No content found for this page.</p>
            </div>
          ) : (
            <>
              {/* Page Header Row */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#111827]">{currentPage.title}</h2>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs gap-1",
                      currentPage.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200",
                    )}
                  >
                    {currentPage.status === "active" ? (
                      <><CheckCircle2 className="h-3 w-3" />Published</>
                    ) : (
                      <><Pencil className="h-3 w-3" />Draft</>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6B7280] flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Last updated by {currentPage.lastUpdatedBy} on {formatDate(currentPage.lastUpdated)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={isVersionPreview || isSaving}
                    className="gap-1.5 h-8"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isSaving ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublish}
                    disabled={isVersionPreview || isPublishing}
                    className="bg-[#003B95] hover:bg-[#002a6b] h-8 gap-1.5"
                  >
                    {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Publish
                  </Button>
                </div>
              </div>

              <div className="flex">
                {/* Editor Area */}
                <div className="flex-1 min-w-0">
                  {/* Language Tab Bar */}
                  <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50/50">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={() => { syncEditor(); setLang("en"); }}
                        role="tab"
                        aria-selected={lang === "en"}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5",
                          lang === "en"
                            ? "bg-white text-[#003B95] shadow-sm font-medium"
                            : "text-[#6B7280] hover:text-[#111827]",
                        )}
                      >
                        <Globe className="h-3 w-3" />
                        English (EN)
                      </button>
                      <button
                        onClick={() => { syncEditor(); setLang("ar"); }}
                        role="tab"
                        aria-selected={lang === "ar"}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5",
                          lang === "ar"
                            ? "bg-white text-[#003B95] shadow-sm font-medium"
                            : "text-[#6B7280] hover:text-[#111827]",
                        )}
                      >
                        <Globe className="h-3 w-3" />
                        Arabic (AR)
                      </button>
                    </div>
                    {hasChanges && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Unsaved changes
                      </p>
                    )}
                  </div>

                  {/* Version Preview Banner */}
                  {isVersionPreview && previewVersion && (
                    <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                      <span className="text-xs text-blue-700 font-medium">
                        Previewing v{previewVersion.versionNumber} — {formatDate(previewVersion.timestamp)} by {previewVersion.author}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleBackToCurrent} className="h-7 text-xs">
                          Back to Current
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setRestoreConfirmOpen(previewVersion)}
                          className="h-7 text-xs bg-[#003B95] hover:bg-[#002a6b]"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore This Version
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Rich Text Editor */}
                  <div className={cn("border-b", contentError && "ring-1 ring-red-400")}>
                    {/* Toolbar */}
                    <div className="flex items-center gap-0.5 px-4 py-1.5 bg-gray-50 border-b flex-wrap">
                      <RteBtn icon={Undo}         label="Undo"          onClick={() => exec("undo")}                 disabled={isVersionPreview} />
                      <RteBtn icon={Redo}         label="Redo"          onClick={() => exec("redo")}                 disabled={isVersionPreview} />
                      <span className="w-px h-5 bg-gray-200 mx-1" />
                      <RteBtn icon={Heading1}     label="Heading 1"     onClick={() => exec("formatBlock", "h1")}    disabled={isVersionPreview} />
                      <RteBtn icon={Heading2}     label="Heading 2"     onClick={() => exec("formatBlock", "h2")}    disabled={isVersionPreview} />
                      <span className="w-px h-5 bg-gray-200 mx-1" />
                      <RteBtn icon={Bold}         label="Bold"          onClick={() => exec("bold")}                 disabled={isVersionPreview} />
                      <RteBtn icon={Italic}       label="Italic"        onClick={() => exec("italic")}               disabled={isVersionPreview} />
                      <RteBtn icon={Underline}    label="Underline"     onClick={() => exec("underline")}            disabled={isVersionPreview} />
                      <span className="w-px h-5 bg-gray-200 mx-1" />
                      <RteBtn icon={List}         label="Bullet List"   onClick={() => exec("insertUnorderedList")}  disabled={isVersionPreview} />
                      <RteBtn icon={ListOrdered}  label="Numbered List" onClick={() => exec("insertOrderedList")}   disabled={isVersionPreview} />
                      <span className="w-px h-5 bg-gray-200 mx-1" />
                      <RteBtn icon={Indent}       label="Indent"        onClick={() => exec("indent")}               disabled={isVersionPreview} />
                      <RteBtn icon={Outdent}      label="Outdent"       onClick={() => exec("outdent")}              disabled={isVersionPreview} />
                      <span className="w-px h-5 bg-gray-200 mx-1" />
                      <RteBtn icon={AlignLeft}    label="Align Left"    onClick={() => exec("justifyLeft")}          disabled={isVersionPreview} />
                      <RteBtn icon={AlignCenter}  label="Align Center"  onClick={() => exec("justifyCenter")}        disabled={isVersionPreview} />
                      <RteBtn icon={AlignRight}   label="Align Right"   onClick={() => exec("justifyRight")}         disabled={isVersionPreview} />
                    </div>

                    {/* Editable Area */}
                    <div
                      ref={editorRef}
                      contentEditable={!isVersionPreview}
                      suppressContentEditableWarning
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      role="textbox"
                      aria-multiline="true"
                      aria-label={`${currentPage.title} content in ${lang === "en" ? "English" : "Arabic"}`}
                      className={cn(
                        "min-h-[420px] p-5 outline-none prose prose-sm max-w-none",
                        "focus:ring-0",
                        "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4",
                        "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3",
                        "[&_p]:mb-2 [&_p]:leading-relaxed",
                        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3",
                        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3",
                        "[&_li]:mb-1",
                        "[&_a]:text-[#003B95] [&_a]:underline",
                        "[&_strong]:font-semibold",
                        "[&_em]:italic",
                        lang === "ar" && "text-right font-[system-ui]",
                        isVersionPreview && "bg-gray-50 cursor-default",
                      )}
                      onInput={() => setHasChanges(true)}
                      onBlur={syncEditor}
                    />
                  </div>

                  {contentError && (
                    <div className="px-6 py-2">
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {contentError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Version History Panel */}
                <div className="w-[280px] border-l bg-gray-50/50 shrink-0">
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Version History
                    </h3>
                  </div>
                  <ScrollArea className="h-[calc(100%-52px)]">
                    <div className="p-3 space-y-2">
                      {versionsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-[#003B95]" />
                        </div>
                      ) : currentPage.versions.length === 0 ? (
                        <p className="text-xs text-[#6B7280] text-center py-8">No versions yet.</p>
                      ) : (
                        currentPage.versions.map((version) => (
                          <div
                            key={version.id}
                            onClick={() => handleVersionPreview(version)}
                            className={cn(
                              "border rounded-lg p-3 space-y-2 cursor-pointer transition-colors",
                              isVersionPreview && previewVersion?.id === version.id
                                ? "border-[#003B95] bg-blue-50/50"
                                : "border-gray-200 bg-white hover:border-gray-300",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-[10px] h-5 font-mono">
                                v{version.versionNumber}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[9px] h-4",
                                  version.status === "published"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700",
                                )}
                              >
                                {version.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-[#6B7280]">{formatDate(version.timestamp)}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#6B7280]">by {version.author}</span>
                              <span className="text-[10px] text-[#6B7280]">
                                {version.charCount.toLocaleString()} chars
                              </span>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full h-7 text-xs gap-1.5 mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRestoreConfirmOpen(version);
                              }}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Restore
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Publish Confirmation ───────────────────────── */}
      <AlertDialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish {currentPage?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately replace the current live content. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublish}
              disabled={isPublishing}
              className="bg-[#003B95] hover:bg-[#002a6b]"
            >
              {isPublishing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing...</>
              ) : (
                "Publish Now"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Restore Confirmation ───────────────────────── */}
      <AlertDialog open={!!restoreConfirmOpen} onOpenChange={(open) => !open && setRestoreConfirmOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version</AlertDialogTitle>
            <AlertDialogDescription>
              Restore version v{restoreConfirmOpen?.versionNumber} from{" "}
              {restoreConfirmOpen && formatDate(restoreConfirmOpen.timestamp)}?
              The current draft will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreConfirmOpen && handleRestore(restoreConfirmOpen)}
              className="bg-[#003B95] hover:bg-[#002a6b]"
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}