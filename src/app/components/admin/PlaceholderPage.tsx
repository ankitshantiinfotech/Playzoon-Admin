import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mb-4">
        <Construction size={28} className="text-[#003B95]" />
      </div>
      <h2 className="text-xl text-[#111827]">{title}</h2>
      <p className="text-sm text-[#6B7280] mt-2 max-w-md">
        {description ?? "This page is under construction. Check back soon for updates."}
      </p>
    </div>
  );
}
