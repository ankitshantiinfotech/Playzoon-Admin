import { useEffect, useState } from "react";
import { Image as ImageIcon, HelpCircle, FileText, Dumbbell, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { BannersTab } from "./BannersTab";
import { StaticPagesTab } from "./StaticPagesTab";
import { SportsTab } from "./SportsTab";
import { FAQsTab } from "./FAQsTab";

const CMS_TAB_STORAGE_KEY = "playzoon-admin-cms-active-tab";

export function CMSManagementPage() {
  const [activeTab, setActiveTab] = useState("static-pages");

  useEffect(() => {
    const savedTab = localStorage.getItem(CMS_TAB_STORAGE_KEY);
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(CMS_TAB_STORAGE_KEY, tab);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
          <span>Admin Portal</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 font-medium">CMS</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
          CMS Management
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Manage static pages, sports types, banners, and FAQs for the platform.
          Content is managed in one language with automatic translation for other languages.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
        <TabsList className="bg-white border shadow-sm h-10 p-1 rounded-xl">
          <TabsTrigger
            value="static-pages"
            className="gap-1.5 data-[state=active]:bg-[#003B95] data-[state=active]:text-white rounded-lg px-4"
          >
            <FileText className="h-4 w-4" />
            Static Pages
          </TabsTrigger>
          <TabsTrigger
            value="sports"
            className="gap-1.5 data-[state=active]:bg-[#003B95] data-[state=active]:text-white rounded-lg px-4"
          >
            <Dumbbell className="h-4 w-4" />
            Sports & Courts
          </TabsTrigger>
          <TabsTrigger
            value="banners"
            className="gap-1.5 data-[state=active]:bg-[#003B95] data-[state=active]:text-white rounded-lg px-4"
          >
            <ImageIcon className="h-4 w-4" />
            Banners
          </TabsTrigger>
          <TabsTrigger
            value="faqs"
            className="gap-1.5 data-[state=active]:bg-[#003B95] data-[state=active]:text-white rounded-lg px-4"
          >
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="static-pages">
          <StaticPagesTab />
        </TabsContent>

        <TabsContent value="sports">
          <SportsTab />
        </TabsContent>

        <TabsContent value="banners">
          <BannersTab />
        </TabsContent>

        <TabsContent value="faqs">
          <FAQsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
