import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
  status: "published" | "draft";
  lastUpdated: string;
  lastUpdatedBy: string;
  lastPublished: string | null;
  contentEn: string;
  contentAr: string;
  versions: PageVersion[];
  hasPendingTranslation?: boolean;
  pendingTranslationContent?: string;
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

// ─── Mock Data ──────────────────────────────────────────────

const INITIAL_PAGES: Record<string, StaticPage> = {
  terms: {
    id: "terms",
    title: "Terms & Conditions",
    status: "published",
    lastUpdated: "2025-11-20T14:00:00Z",
    lastUpdatedBy: "Ahmed Al-Rashid",
    lastPublished: "2025-11-20T14:00:00Z",
    contentEn: `<h1>Terms & Conditions</h1>
<p><em>Effective: November 20, 2025</em></p>
<p>By using the Playzoon platform, you agree to these Terms & Conditions. Please read them carefully before accessing our services.</p>
<h2>1. Registration</h2>
<p>Users must provide accurate personal information during registration. You are responsible for maintaining the confidentiality of your account credentials.</p>
<h2>2. Booking Policy</h2>
<p>All bookings made through the platform are subject to the provider's availability and cancellation terms. Playzoon acts as an intermediary between users and facility providers.</p>
<h2>3. Payment Terms</h2>
<p>Payments are processed securely through our payment gateway. All prices are displayed in <b>SAR (Saudi Riyal)</b> unless otherwise stated.</p>
<ul>
<li>Credit and debit cards are accepted</li>
<li>Wallet balance can be used for payments</li>
<li>Refunds follow provider-specific policies</li>
</ul>`,
    contentAr: `<h1>الشروط والأحكام</h1>
<p><em>ساري المفعول: 20 نوفمبر 2025</em></p>
<p>باستخدام منصة بلايزون، فإنك توافق على هذه الشروط والأحكام. يرجى قراءتها بعناية قبل الوصول إلى خدماتنا.</p>
<h2>1. التسجيل</h2>
<p>يجب على المستخدمين تقديم معلومات شخصية دقيقة أثناء التسجيل.</p>`,
    versions: [
      {
        id: "v3",
        versionNumber: 3,
        timestamp: "2025-11-20T14:00:00Z",
        status: "published",
        contentEn: "<h1>Terms & Conditions</h1><p>Current version content.</p>",
        contentAr: "<h1>الشروط والأحكام</h1><p>محتوى النسخة الحالية.</p>",
        author: "Ahmed Al-Rashid",
        charCount: 1245,
      },
      {
        id: "v2",
        versionNumber: 2,
        timestamp: "2025-10-15T09:30:00Z",
        status: "published",
        contentEn:
          "<h1>Terms & Conditions</h1><p>Updated booking policy section.</p>",
        contentAr: "<h1>الشروط والأحكام</h1><p>تم تحديث قسم سياسة الحجز.</p>",
        author: "Fatima Hassan",
        charCount: 980,
      },
      {
        id: "v1",
        versionNumber: 1,
        timestamp: "2025-06-01T10:00:00Z",
        status: "published",
        contentEn: "<h1>Terms & Conditions</h1><p>Initial version.</p>",
        contentAr: "<h1>الشروط والأحكام</h1><p>النسخة الأولى.</p>",
        author: "Admin",
        charCount: 450,
      },
    ],
    hasPendingTranslation: false,
  },
  privacy: {
    id: "privacy",
    title: "Privacy Policy",
    status: "published",
    lastUpdated: "2025-12-01T08:00:00Z",
    lastUpdatedBy: "Fatima Hassan",
    lastPublished: "2025-12-01T08:00:00Z",
    contentEn: `<h1>Privacy Policy</h1>
<p>At Playzoon, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
<h2>1. Information We Collect</h2>
<p>We collect information you provide directly, such as name, email, phone number, and payment details.</p>
<h2>2. How We Use Your Information</h2>
<p>Your information is used to facilitate bookings, process payments, and improve our services.</p>
<h2>3. Data Protection</h2>
<p>We implement industry-standard security measures to protect your data. Your information is encrypted in transit and at rest.</p>`,
    contentAr: `<h1>سياسة الخصوصية</h1>
<p>في بلايزون، نأخذ خصوصيتك على محمل الجد. توضح هذه السياسة كيفية جمع معلوماتك الشخصية واستخدامها وحمايتها.</p>`,
    versions: [
      {
        id: "pv1",
        versionNumber: 1,
        timestamp: "2025-12-01T08:00:00Z",
        status: "published",
        contentEn: "<h1>Privacy Policy</h1><p>Initial published version.</p>",
        contentAr: "<h1>سياسة الخصوصية</h1><p>النسخة الأولى.</p>",
        author: "Fatima Hassan",
        charCount: 890,
      },
    ],
  },
  about: {
    id: "about",
    title: "About Us",
    status: "published",
    lastUpdated: "2026-01-15T10:30:00Z",
    lastUpdatedBy: "Ahmed Al-Rashid",
    lastPublished: "2026-01-15T10:30:00Z",
    contentEn: `<h1>About Playzoon</h1>
<p>Playzoon is the region's leading sports booking platform, connecting players with top-tier sports facilities, coaches, and training programs.</p>
<h2>Our Mission</h2>
<p>To make sports accessible and easy to book for everyone in the region.</p>
<h2>Our Story</h2>
<p>Founded in 2024, Playzoon has grown to serve thousands of players and hundreds of providers across the Kingdom of Saudi Arabia and beyond.</p>
<h2>Our Values</h2>
<ul>
<li><b>Accessibility:</b> Making sports available to everyone</li>
<li><b>Quality:</b> Partnering with the best facilities</li>
<li><b>Innovation:</b> Using technology to enhance sports experiences</li>
</ul>`,
    contentAr: `<h1>عن بلايزون</h1>
<p>بلايزون هي المنصة الرائدة لحجز الرياضات في المنطقة، تربط اللاعبين بأفضل المنشآت الرياضية والمدربين وبرامج التدريب.</p>`,
    versions: [],
  },
  help: {
    id: "help",
    title: "Help Center",
    status: "draft",
    lastUpdated: "2026-02-10T09:00:00Z",
    lastUpdatedBy: "Sara Mohammed",
    lastPublished: null,
    contentEn: `<h1>Help Center</h1>
<p>Welcome to the Playzoon Help Center. Find answers to common questions and learn how to make the most of our platform.</p>
<h2>Getting Started</h2>
<p>Download the Playzoon app from the App Store or Google Play. Create an account using your email or phone number.</p>
<h2>Contact Support</h2>
<p>Need help? Reach out to our support team:</p>
<ul>
<li>Email: support@playzoon.com</li>
<li>Phone: +966 XX XXX XXXX</li>
<li>In-app chat: Available 9 AM - 9 PM</li>
</ul>`,
    contentAr: `<h1>مركز المساعدة</h1>
<p>مرحباً بك في مركز مساعدة بلايزون. اعثر على إجابات للأسئلة الشائعة.</p>`,
    versions: [],
  },
};

const INITIAL_SOCIAL_LINKS: SocialMediaLinks = {
  facebook: "https://facebook.com/playzoon",
  twitter: "https://x.com/playzoon",
  instagram: "https://instagram.com/playzoon",
  linkedin: "https://linkedin.com/company/playzoon",
  youtube: "https://youtube.com/@playzoon",
  tiktok: "https://tiktok.com/@playzoon",
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

const PAGE_TABS: { id: PageTab; label: string; icon: React.ElementType }[] = [
  { id: "terms", label: "Terms & Conditions", icon: FileText },
  { id: "privacy", label: "Privacy Policy", icon: Shield },
  { id: "about", label: "About Us", icon: Info },
  { id: "help", label: "Help Center", icon: HelpCircle },
  { id: "social", label: "Social Media", icon: Share2 },
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
  const [links, setLinks] = useState<SocialMediaLinks>(INITIAL_SOCIAL_LINKS);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SocialMediaLinks, string>>
  >({});
  const [saving, setSaving] = useState(false);

  const socialFields: {
    key: keyof SocialMediaLinks;
    label: string;
    icon: React.ElementType;
    placeholder: string;
  }[] = [
    {
      key: "facebook",
      label: "Facebook URL",
      icon: Facebook,
      placeholder: "https://facebook.com/...",
    },
    {
      key: "twitter",
      label: "Twitter / X URL",
      icon: Twitter,
      placeholder: "https://x.com/...",
    },
    {
      key: "instagram",
      label: "Instagram URL",
      icon: Instagram,
      placeholder: "https://instagram.com/...",
    },
    {
      key: "linkedin",
      label: "LinkedIn URL",
      icon: Linkedin,
      placeholder: "https://linkedin.com/...",
    },
    {
      key: "youtube",
      label: "YouTube URL",
      icon: Youtube,
      placeholder: "https://youtube.com/...",
    },
    {
      key: "tiktok",
      label: "TikTok URL",
      icon: ExternalLink,
      placeholder: "https://tiktok.com/...",
    },
  ];

  const validateUrl = (url: string): string | null => {
    if (!url.trim()) return null;
    if (!url.startsWith("https://"))
      return "Please enter a valid URL (starting with https://).";
    if (url.length > 500) return "URL cannot exceed 500 characters.";
    return null;
  };

  const handleSave = () => {
    const newErrors: Partial<Record<keyof SocialMediaLinks, string>> = {};
    let hasError = false;
    for (const field of socialFields) {
      const err = validateUrl(links[field.key]);
      if (err) {
        newErrors[field.key] = err;
        hasError = true;
      }
    }
    setErrors(newErrors);
    if (hasError) return;

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Social media links updated successfully.");
    }, 600);
  };

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div className="bg-white border rounded-lg p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            Social Media Links
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage your platform's social media presence. These links appear in
            the app footer and about pages.
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
                  className={cn(
                    "text-sm",
                    errors[field.key] &&
                      "border-red-400 focus-visible:ring-red-400",
                  )}
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
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#003B95] hover:bg-[#002a6b] gap-2"
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Links"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export function StaticPagesTab() {
  const [pages, setPages] = useState<Record<string, StaticPage>>(INITIAL_PAGES);
  const [activePageTab, setActivePageTab] = useState<PageTab>("terms");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] =
    useState<PageVersion | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isVersionPreview, setIsVersionPreview] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<PageVersion | null>(
    null,
  );
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // ── Fetch CMS pages from API (override mock data when available) ──
  useEffect(() => {
    (async () => {
      try {
        const { adminService } = await import("@/services/admin.service");
        const res = await adminService.listCmsPages({});
        const list = res?.pages || res?.data?.pages || [];
        if (Array.isArray(list) && list.length > 0) {
          const apiPages: Record<string, StaticPage> = {};
          list.forEach((p: Record<string, unknown>) => {
            const pageType = String(p.page_type || p.id || "").toLowerCase();
            const key = pageType.includes("term")
              ? "terms"
              : pageType.includes("priv")
                ? "privacy"
                : pageType.includes("about")
                  ? "about"
                  : pageType.includes("help")
                    ? "help"
                    : pageType;
            apiPages[key] = {
              id: String(p.id || key),
              title: String(p.title_en || p.title || key),
              status: String(p.status || "published") as StaticPage["status"],
              lastUpdated: String(
                p.last_updated_at || new Date().toISOString(),
              ),
              lastUpdatedBy: "Admin",
              lastPublished: String(p.last_updated_at || null),
              contentEn: String(p.content_en || ""),
              contentAr: String(p.content_ar || ""),
              versions: [],
            };
          });
          // Merge: API pages override mock, keep mock for pages not in API
          setPages((prev) => ({ ...prev, ...apiPages }));
        }
      } catch (err) {
        console.error("CMS API fetch failed, using fallback data:", err);
      }
    })();
  }, []);

  const currentPage = pages[activePageTab] || null;
  const isContentPage = activePageTab !== "social";

  // ─── Sync editor content back to state ─────────────────

  const syncEditorContent = useCallback(() => {
    if (!editorRef.current || !currentPage || isVersionPreview) return;
    const html = editorRef.current.innerHTML;
    setPages((curr) => {
      const page = curr[activePageTab];
      if (!page) return curr;
      return {
        ...curr,
        [activePageTab]: {
          ...page,
          contentEn: lang === "en" ? html : page.contentEn,
          contentAr: lang === "ar" ? html : page.contentAr,
        },
      };
    });
    setHasChanges(true);
  }, [lang, activePageTab, currentPage, isVersionPreview]);

  // ─── Update editor innerHTML when lang/page changes ────

  useEffect(() => {
    if (!editorRef.current || !currentPage || !isContentPage) return;
    if (isVersionPreview && previewVersion) {
      const content =
        lang === "en" ? previewVersion.contentEn : previewVersion.contentAr;
      editorRef.current.innerHTML = content;
      return;
    }
    const content =
      lang === "en" ? currentPage.contentEn : currentPage.contentAr;
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

  // ─── Exec command helper ───────────────────────────────

  const exec = (command: string, value?: string) => {
    if (isVersionPreview) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // ─── Validate content ─────────────────────────────────

  const validateContent = (): boolean => {
    syncEditorContent();
    const html = editorRef.current?.innerHTML || "";
    const text = stripHtml(html).trim();
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

  // ─── Save Logic ────────────────────────────────────────

  const saveVersion = (status: "published" | "draft") => {
    if (!currentPage) return;

    const html = editorRef.current?.innerHTML || "";
    const updatedContentEn = lang === "en" ? html : currentPage.contentEn;
    const updatedContentAr = lang === "ar" ? html : currentPage.contentAr;

    const now = new Date().toISOString();
    const maxVersion = Math.max(
      0,
      ...currentPage.versions.map((v) => v.versionNumber),
    );

    const newVersion: PageVersion = {
      id: `v${Date.now()}`,
      versionNumber: maxVersion + 1,
      timestamp: now,
      status,
      contentEn: updatedContentEn,
      contentAr: updatedContentAr,
      author: "Admin",
      charCount:
        stripHtml(updatedContentEn).length + stripHtml(updatedContentAr).length,
    };

    setPages((curr) => ({
      ...curr,
      [activePageTab]: {
        ...currentPage,
        contentEn: updatedContentEn,
        contentAr: updatedContentAr,
        status,
        lastUpdated: now,
        lastUpdatedBy: "Admin",
        lastPublished: status === "published" ? now : currentPage.lastPublished,
        versions: [newVersion, ...currentPage.versions].slice(0, 20),
      },
    }));

    setHasChanges(false);

    if (status === "published") {
      setPublishConfirmOpen(false);
      toast.success("Content published successfully.");
    } else {
      toast.success("Draft saved successfully.");
    }
  };

  const handleSaveDraft = () => {
    syncEditorContent();
    saveVersion("draft");
  };

  const handlePublish = () => {
    if (!validateContent()) return;
    setPublishConfirmOpen(true);
  };

  // ─── Version Preview / Restore ─────────────────────────

  const handleVersionPreview = (version: PageVersion) => {
    syncEditorContent();
    setIsVersionPreview(true);
    setPreviewVersion(version);
  };

  const handleBackToCurrent = () => {
    setIsVersionPreview(false);
    setPreviewVersion(null);
  };

  const handleRestore = (version: PageVersion) => {
    if (!currentPage) return;
    setPages((curr) => ({
      ...curr,
      [activePageTab]: {
        ...currentPage,
        contentEn: version.contentEn,
        contentAr: version.contentAr,
      },
    }));
    setIsVersionPreview(false);
    setPreviewVersion(null);
    setRestoreConfirmOpen(null);
    setHasChanges(true);
    toast.success("Version restored as draft. Review and publish when ready.");
  };

  // ─── Auto-Translate (T&C only, mock) ─────────────────

  const handleAutoTranslate = () => {
    if (activePageTab !== "terms" || !currentPage) return;
    toast.success(
      "Translation auto-generated. Pending admin review before publishing.",
    );
    setPages((curr) => ({
      ...curr,
      terms: {
        ...curr.terms,
        hasPendingTranslation: true,
        pendingTranslationContent:
          "<h1>الشروط والأحكام (ترجمة آلية)</h1><p>تم إنشاء هذه الترجمة تلقائياً بواسطة Google Translate. يرجى المراجعة قبل النشر.</p>",
      },
    }));
  };

  const handleApproveTranslation = () => {
    if (!currentPage) return;
    setPages((curr) => ({
      ...curr,
      terms: {
        ...curr.terms,
        contentAr: curr.terms.pendingTranslationContent || curr.terms.contentAr,
        hasPendingTranslation: false,
        pendingTranslationContent: undefined,
      },
    }));
    toast.success("Translation approved and published.");
  };

  const handleRejectTranslation = () => {
    setPages((curr) => ({
      ...curr,
      terms: {
        ...curr.terms,
        hasPendingTranslation: false,
        pendingTranslationContent: undefined,
      },
    }));
    toast.success("Pending translation discarded.");
  };

  // ─── Page tab switch ──────────────────────────────────

  const switchPageTab = (tab: PageTab) => {
    if (isVersionPreview) {
      handleBackToCurrent();
    }
    setActivePageTab(tab);
    setLang("en");
    setContentError(null);
    setHasChanges(false);
  };

  // ─── Render ───────────────────────────────────────────

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
      {isContentPage && currentPage && (
        <div className="bg-white border border-t-0 rounded-b-lg">
          {/* Page Header Row */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[#111827]">
                {currentPage.title}
              </h2>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs gap-1",
                  currentPage.status === "published"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200",
                )}
              >
                {currentPage.status === "published" ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Published
                  </>
                ) : (
                  <>
                    <Pencil className="h-3 w-3" />
                    Draft
                  </>
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#6B7280] flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Last updated by {currentPage.lastUpdatedBy} on{" "}
                {formatDate(currentPage.lastUpdated)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isVersionPreview}
                className="gap-1.5 h-8"
              >
                <Save className="h-3.5 w-3.5" />
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isVersionPreview}
                className="bg-[#003B95] hover:bg-[#002a6b] h-8 gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
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
                    onClick={() => {
                      syncEditorContent();
                      setLang("en");
                    }}
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
                    onClick={() => {
                      syncEditorContent();
                      setLang("ar");
                    }}
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
                    {activePageTab === "terms" &&
                      pages.terms?.hasPendingTranslation && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1.5 h-4">
                          Pending Review
                        </Badge>
                      )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {activePageTab === "terms" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAutoTranslate}
                      disabled={isVersionPreview}
                      className="gap-1.5 h-7 text-xs"
                    >
                      <Languages className="h-3.5 w-3.5" />
                      Auto-Translate
                    </Button>
                  )}
                </div>
              </div>

              {/* Version Preview Banner */}
              {isVersionPreview && previewVersion && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <span className="text-xs text-blue-700 font-medium">
                    Previewing version v{previewVersion.versionNumber} from{" "}
                    {formatDate(previewVersion.timestamp)} by{" "}
                    {previewVersion.author}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBackToCurrent}
                      className="h-7 text-xs"
                    >
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
              <div
                className={cn(
                  "border-b",
                  contentError && "ring-1 ring-red-400",
                )}
              >
                {/* Toolbar */}
                <div className="flex items-center gap-0.5 px-4 py-1.5 bg-gray-50 border-b flex-wrap">
                  <RteBtn
                    icon={Undo}
                    label="Undo"
                    onClick={() => exec("undo")}
                    disabled={isVersionPreview}
                  />
                  <RteBtn
                    icon={Redo}
                    label="Redo"
                    onClick={() => exec("redo")}
                    disabled={isVersionPreview}
                  />
                  <span className="w-px h-5 bg-gray-200 mx-1" />
                  <RteBtn
                    icon={Heading1}
                    label="Heading 1"
                    onClick={() => exec("formatBlock", "h1")}
                    disabled={isVersionPreview}
                  />
                  <RteBtn
                    icon={Heading2}
                    label="Heading 2"
                    onClick={() => exec("formatBlock", "h2")}
                    disabled={isVersionPreview}
                  />
                  <span className="w-px h-5 bg-gray-200 mx-1" />
                  <RteBtn
                    icon={Bold}
                    label="Bold"
                    onClick={() => exec("bold")}
                    disabled={isVersionPreview}
                  />
                  <RteBtn
                    icon={Italic}
                    label="Italic"
                    onClick={() => exec("italic")}
                    disabled={isVersionPreview}
                  />
                  <RteBtn
                    icon={Underline}
                    label="Underline"
                    onClick={() => exec("underline")}
                    disabled={isVersionPreview}
                  />
                  <span className="w-px h-5 bg-gray-200 mx-1" />
                  <RteBtn
                    icon={List}
                    label="Bullet List"
                    onClick={() => exec("insertUnorderedList")}
                    disabled={isVersionPreview}
                  />
                  <RteBtn
                    icon={ListOrdered}
                    label="Numbered List"
                    onClick={() => exec("insertOrderedList")}
                    disabled={isVersionPreview}
                  />
                  <span className="w-px h-5 bg-gray-200 mx-1" />
                  <RteBtn
                    icon={Indent}
                    label="Indent"
                    onClick={() => exec("indent")}
                    disabled={isVersionPreview}
                  />
                  <RteBtn
                    icon={Outdent}
                    label="Outdent"
                    onClick={() => exec("outdent")}
                    disabled={isVersionPreview}
                  />
                  <span className="w-px h-5 bg-gray-200 mx-1" />
                  <RteBtn
                    icon={AlignLeft}
                    label="Align Left"
                    onClick={() => exec("justifyLeft")}
                    disabled={isVersionPreview}
                  />
                  <RteBtn
                    icon={AlignCenter}
                    label="Align Center"
                    onClick={() => exec("justifyCenter")}
                    disabled={isVersionPreview}
                  />
                  <RteBtn
                    icon={AlignRight}
                    label="Align Right"
                    onClick={() => exec("justifyRight")}
                    disabled={isVersionPreview}
                  />
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
                    "min-h-[400px] p-5 outline-none prose prose-sm max-w-none",
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
                  onBlur={syncEditorContent}
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

              {/* Translation Review Section (T&C only) */}
              {activePageTab === "terms" &&
                pages.terms?.hasPendingTranslation && (
                  <div className="px-6 py-4 bg-amber-50/50 border-t border-amber-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-amber-600" />
                        <h3 className="text-sm font-medium text-amber-800">
                          Pending Translation Review
                        </h3>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                        Auto-translated
                      </Badge>
                    </div>
                    <div
                      className="border border-amber-200 rounded-lg bg-white p-4 prose prose-sm max-w-none mb-3 text-sm text-gray-700"
                      dir="rtl"
                      dangerouslySetInnerHTML={{
                        __html: pages.terms.pendingTranslationContent || "",
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleApproveTranslation}
                        className="bg-[#003B95] hover:bg-[#002a6b] h-8 gap-1.5 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Approve & Publish Translation
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLang("ar");
                          if (pages.terms.pendingTranslationContent) {
                            setPages((curr) => ({
                              ...curr,
                              terms: {
                                ...curr.terms,
                                contentAr:
                                  curr.terms.pendingTranslationContent ||
                                  curr.terms.contentAr,
                                hasPendingTranslation: false,
                                pendingTranslationContent: undefined,
                              },
                            }));
                          }
                          toast.success(
                            "Content loaded into editor for manual editing.",
                          );
                        }}
                        className="h-8 gap-1.5 text-xs"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit Before Publishing
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRejectTranslation}
                        className="h-8 gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Reject Translation
                      </Button>
                    </div>
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
                  {currentPage.versions.length === 0 ? (
                    <p className="text-xs text-[#6B7280] text-center py-8">
                      No published versions yet.
                    </p>
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
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 font-mono"
                          >
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
                        <div className="text-xs text-[#6B7280]">
                          {formatDate(version.timestamp)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#6B7280]">
                            by {version.author}
                          </span>
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
        </div>
      )}

      {/* ─── Publish Confirmation ───────────────────────── */}
      <AlertDialog
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish {currentPage?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately replace the current live content. Are you
              sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saveVersion("published")}
              className="bg-[#003B95] hover:bg-[#002a6b]"
            >
              Publish Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Restore Confirmation ───────────────────────── */}
      <AlertDialog
        open={!!restoreConfirmOpen}
        onOpenChange={(open) => !open && setRestoreConfirmOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version</AlertDialogTitle>
            <AlertDialogDescription>
              Restore version v{restoreConfirmOpen?.versionNumber} from{" "}
              {restoreConfirmOpen && formatDate(restoreConfirmOpen.timestamp)}?
              The current draft will be replaced with this version's content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                restoreConfirmOpen && handleRestore(restoreConfirmOpen)
              }
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
