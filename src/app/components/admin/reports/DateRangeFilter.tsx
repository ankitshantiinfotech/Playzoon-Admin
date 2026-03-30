import { useState } from "react";
import { Calendar as CalendarIcon, Download, Filter } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";

export type DateRangeOption = "Today" | "This Week" | "This Month" | "This Quarter" | "This Year" | "Custom";

interface DateRangeFilterProps {
  onRangeChange: (range: DateRangeOption, startDate: Date, endDate: Date) => void;
  onExport: () => void;
}

export function DateRangeFilter({ onRangeChange, onExport }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("This Month");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const handleRangeClick = (range: DateRangeOption) => {
    setSelectedRange(range);
    const today = new Date();
    let start = today;
    
    switch (range) {
      case "Today":
        start = today;
        break;
      case "This Week":
        start = startOfWeek(today);
        break;
      case "This Month":
        start = startOfMonth(today);
        break;
      case "This Quarter":
        start = startOfQuarter(today);
        break;
      case "This Year":
        start = startOfYear(today);
        break;
      default:
        start = today;
    }
    
    setStartDate(start);
    setEndDate(today);
    onRangeChange(range, start, today);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2 text-gray-500">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter Range:</span>
        </div>
        
        {(["Today", "This Week", "This Month", "This Quarter", "This Year"] as DateRangeOption[]).map((range) => (
          <button
            key={range}
            onClick={() => handleRangeClick(range)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              selectedRange === range
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            {range}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span>{format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}</span>
        </div>
        
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#003B95] text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors ml-auto md:ml-0"
        >
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>
    </div>
  );
}
