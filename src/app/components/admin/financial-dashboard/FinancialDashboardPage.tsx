// ─── SCR-ADM-036: Financial Dashboard & Reporting ─────────────────────────────
// Dedicated financial overview with KPI cards, interactive charts (Revenue Trend,
// Commission by Provider Type, Booking Revenue by Type), date-range filtering,
// export capabilities, and a recent-transactions summary table.
// All monetary values in SAR. Timestamps in UTC.

import { useState, useMemo } from "react";
import { Link } from "react-router";
import { format, subDays, startOfMonth } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Receipt,
  Landmark,
  ArrowRight,
  CalendarIcon,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { toast } from "sonner";
import { SafeChart } from "../SafeChart";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSAR(value: number): string {
  return `SAR ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSARAbbrev(value: number): string {
  if (value >= 1_000_000) return `SAR ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `SAR ${(value / 1_000).toFixed(1)}K`;
  return formatSAR(value);
}

// ─── Mock data ────────────────────────────────────────────────────────────────

type DatePreset =
  | "today"
  | "this-week"
  | "this-month"
  | "this-quarter"
  | "this-year"
  | "all-time";

const KPI_DATA = {
  totalRevenue: { amount: 1_258_450.0, change: 12.5 },
  totalCommission: { amount: 188_767.5, change: 8.3 },
  totalTax: { amount: 66_069.63, change: 5.1 },
  totalPayouts: { amount: 945_337.5, change: -2.4 },
};

// Revenue trend (line chart data — last 12 months)
const REVENUE_TREND_DATA = [
  { month: "Apr 2025", revenue: 72000, commission: 10800, tax: 3780 },
  { month: "May 2025", revenue: 85000, commission: 12750, tax: 4463 },
  { month: "Jun 2025", revenue: 91000, commission: 13650, tax: 4778 },
  { month: "Jul 2025", revenue: 110000, commission: 16500, tax: 5775 },
  { month: "Aug 2025", revenue: 98000, commission: 14700, tax: 5145 },
  { month: "Sep 2025", revenue: 105000, commission: 15750, tax: 5513 },
  { month: "Oct 2025", revenue: 115000, commission: 17250, tax: 6038 },
  { month: "Nov 2025", revenue: 125000, commission: 18750, tax: 6563 },
  { month: "Dec 2025", revenue: 108000, commission: 16200, tax: 5670 },
  { month: "Jan 2026", revenue: 112000, commission: 16800, tax: 5880 },
  { month: "Feb 2026", revenue: 118450, commission: 17768, tax: 6219 },
  { month: "Mar 2026", revenue: 119000, commission: 17850, tax: 6248 },
];

// Commission by provider type (pie chart data)
const COMMISSION_BY_PROVIDER = [
  { name: "Facility Provider", amount: 94383.75, percentage: 50 },
  { name: "Training Provider", amount: 56630.25, percentage: 30 },
  { name: "Coach", amount: 37753.5, percentage: 20 },
];
const PIE_COLORS = ["#003B95", "#3B82F6", "#93C5FD"];

// Booking revenue by type (bar chart data)
const BOOKING_REVENUE_BY_TYPE = [
  { type: "Tournament", revenue: 320000, commission: 48000, tax: 16800 },
  { type: "Facility", revenue: 485000, commission: 72750, tax: 25463 },
  { type: "Training", revenue: 278450, commission: 41768, tax: 14618 },
  { type: "Coach", revenue: 175000, commission: 26250, tax: 9188 },
];

// Recent transactions
const RECENT_TRANSACTIONS = [
  {
    id: "TXN-10052",
    type: "Booking" as const,
    amount: 350.0,
    status: "Completed" as const,
    date: "2026-03-10T14:32:00Z",
  },
  {
    id: "TXN-10051",
    type: "Payout" as const,
    amount: 12500.0,
    status: "Processing" as const,
    date: "2026-03-10T12:15:00Z",
  },
  {
    id: "TXN-10050",
    type: "Refund" as const,
    amount: 200.0,
    status: "Completed" as const,
    date: "2026-03-10T10:45:00Z",
  },
  {
    id: "TXN-10049",
    type: "Booking" as const,
    amount: 500.0,
    status: "Completed" as const,
    date: "2026-03-09T18:00:00Z",
  },
  {
    id: "TXN-10048",
    type: "Booking" as const,
    amount: 180.0,
    status: "Completed" as const,
    date: "2026-03-09T15:30:00Z",
  },
  {
    id: "TXN-10047",
    type: "Payout" as const,
    amount: 8750.0,
    status: "Completed" as const,
    date: "2026-03-09T09:00:00Z",
  },
  {
    id: "TXN-10046",
    type: "Booking" as const,
    amount: 420.0,
    status: "Completed" as const,
    date: "2026-03-08T16:20:00Z",
  },
  {
    id: "TXN-10045",
    type: "Refund" as const,
    amount: 150.0,
    status: "Pending" as const,
    date: "2026-03-08T14:10:00Z",
  },
  {
    id: "TXN-10044",
    type: "Booking" as const,
    amount: 275.0,
    status: "Completed" as const,
    date: "2026-03-08T11:05:00Z",
  },
  {
    id: "TXN-10043",
    type: "Booking" as const,
    amount: 600.0,
    status: "Completed" as const,
    date: "2026-03-07T08:45:00Z",
  },
];

const TXN_TYPE_STYLES: Record<string, string> = {
  Booking: "bg-blue-100 text-blue-700 border-blue-200",
  Payout: "bg-amber-100 text-amber-700 border-amber-200",
  Refund: "bg-red-100 text-red-600 border-red-200",
};

const TXN_STATUS_STYLES: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Processing: "bg-blue-100 text-blue-700 border-blue-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Failed: "bg-red-100 text-red-600 border-red-200",
};

// ─── KPI Card Component ───────────────────────────────────────────────────────

function KPICard({
  label,
  amount,
  change,
  icon: Icon,
  iconBg,
  iconColor,
  clickable,
}: {
  label: string;
  amount: number;
  change: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  clickable?: boolean;
}) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const TrendIcon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;
  const trendColor = isPositive
    ? "text-emerald-600"
    : isNeutral
      ? "text-gray-500"
      : "text-red-600";
  const trendText = isPositive
    ? `+${change}%`
    : isNeutral
      ? "0.0%"
      : `${change}%`;
  const comparisonText = "vs last month";

  const content = (
    <div
      className={cn(
        "bg-white border rounded-xl p-5 flex items-start gap-4 transition-shadow",
        clickable && "hover:shadow-md cursor-pointer",
      )}
      role="region"
      aria-label={`${label}: ${formatSAR(amount)}. ${isPositive ? "Up" : isNeutral ? "No change" : "Down"} ${Math.abs(change)} percent compared to previous period.`}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-lg flex items-center justify-center shrink-0",
          iconBg,
        )}
      >
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#6B7280] font-medium">{label}</p>
        <p
          className="text-xl font-bold text-[#111827] mt-1 tabular-nums"
          title={formatSAR(amount)}
        >
          {formatSARAbbrev(amount)}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
          <span className={cn("text-xs font-medium", trendColor)}>
            {trendText}
          </span>
          <span className="text-xs text-[#9CA3AF]">{comparisonText}</span>
        </div>
      </div>
    </div>
  );

  if (clickable) {
    return <Link to="/payouts">{content}</Link>;
  }
  return content;
}

// ─── Custom Tooltip for charts ────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-[#111827] mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#6B7280]">{entry.name}:</span>
          <span className="font-medium text-[#111827]">
            {formatSAR(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { percentage: number };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-[#111827]">{entry.name}</p>
      <p className="text-[#6B7280]">
        {formatSAR(entry.value)} ({entry.payload.percentage}%)
      </p>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export function FinancialDashboardPage() {
  // Date range state
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    startOfMonth(new Date()),
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [activePreset, setActivePreset] = useState<DatePreset>("this-month");

  // Legend visibility toggles for the line chart
  const [lineVisibility, setLineVisibility] = useState({
    revenue: true,
    commission: true,
    tax: true,
  });

  const presets: { label: string; value: DatePreset }[] = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "this-week" },
    { label: "This Month", value: "this-month" },
    { label: "This Quarter", value: "this-quarter" },
    { label: "This Year", value: "this-year" },
    { label: "All Time", value: "all-time" },
  ];

  const handlePresetClick = (preset: DatePreset) => {
    setActivePreset(preset);
    const now = new Date();
    switch (preset) {
      case "today":
        setDateFrom(now);
        setDateTo(now);
        break;
      case "this-week":
        setDateFrom(subDays(now, now.getDay()));
        setDateTo(now);
        break;
      case "this-month":
        setDateFrom(startOfMonth(now));
        setDateTo(now);
        break;
      case "this-quarter": {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        setDateFrom(new Date(now.getFullYear(), qMonth, 1));
        setDateTo(now);
        break;
      }
      case "this-year":
        setDateFrom(new Date(now.getFullYear(), 0, 1));
        setDateTo(now);
        break;
      case "all-time":
        setDateFrom(undefined);
        setDateTo(undefined);
        break;
    }
  };

  const handleExport = (formatType: string) => {
    toast.success(
      "Financial report export started. Your file will download shortly.",
    );
  };

  const toggleLine = (key: keyof typeof lineVisibility) => {
    setLineVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Total commission for donut centre
  const totalCommission = COMMISSION_BY_PROVIDER.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <nav className="text-xs text-[#6B7280] mb-1">
          <span>Admin</span>
          <span className="mx-1.5">&gt;</span>
          <span>Reporting</span>
          <span className="mx-1.5">&gt;</span>
          <span className="text-[#111827] font-medium">
            Financial Dashboard
          </span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] flex items-center gap-2.5">
          <BarChart3 className="h-6 w-6 text-[#003B95]" />
          Financial Dashboard
        </h1>
      </div>

      {/* ── Date Range Filter Bar ────────────────────────────── */}
      <div
        className="bg-white border rounded-xl p-4 flex flex-wrap items-center gap-3"
        aria-label="Filter financial data by date range"
      >
        {/* Date range pickers */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 gap-2 text-sm min-w-[140px] justify-start",
                  !dateFrom && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => {
                  setDateFrom(d);
                  setActivePreset("" as DatePreset);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-[#9CA3AF]">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 gap-2 text-sm min-w-[140px] justify-start",
                  !dateTo && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => {
                  setDateTo(d);
                  setActivePreset("" as DatePreset);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Preset buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {presets.map((p) => (
            <Button
              key={p.value}
              variant="ghost"
              size="sm"
              aria-pressed={activePreset === p.value}
              onClick={() => handlePresetClick(p.value)}
              className={cn(
                "h-8 text-xs",
                activePreset === p.value
                  ? "bg-[#003B95] text-white hover:bg-[#002a6b] hover:text-white"
                  : "text-[#6B7280] hover:bg-gray-100",
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Export button */}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                aria-label="Export financial report"
              >
                <Download className="h-3.5 w-3.5" />
                Export Report
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xls")}>
                Export as XLS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────── */}
      <h2 className="sr-only">Revenue Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Total Revenue"
          amount={KPI_DATA.totalRevenue.amount}
          change={KPI_DATA.totalRevenue.change}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KPICard
          label="Total Commission Earned"
          amount={KPI_DATA.totalCommission.amount}
          change={KPI_DATA.totalCommission.change}
          icon={Receipt}
          iconBg="bg-blue-50"
          iconColor="text-[#003B95]"
        />
        <KPICard
          label="Total Tax Collected"
          amount={KPI_DATA.totalTax.amount}
          change={KPI_DATA.totalTax.change}
          icon={Landmark}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <KPICard
          label="Total Payouts Processed"
          amount={KPI_DATA.totalPayouts.amount}
          change={KPI_DATA.totalPayouts.change}
          icon={TrendingUp}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          clickable
        />
      </div>

      {/* ── Charts Row 1: Revenue Trend (65%) + Commission Pie (35%) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[65%_35%] gap-6">
        {/* Revenue Trend Line Chart */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#111827] mb-1">
            Revenue Trend
          </h2>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4">
            {[
              { key: "revenue" as const, label: "Revenue", color: "#003B95" },
              {
                key: "commission" as const,
                label: "Commission",
                color: "#3B82F6",
              },
              { key: "tax" as const, label: "Tax", color: "#F59E0B" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => toggleLine(item.key)}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-opacity",
                  lineVisibility[item.key] ? "opacity-100" : "opacity-40",
                )}
              >
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </button>
            ))}
          </div>
          <div
            role="img"
            aria-label="Revenue trend line chart showing revenue, commission, and tax over time for the selected period."
          >
            <SafeChart height={320}>
              <LineChart data={REVENUE_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={20}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                {lineVisibility.revenue && (
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#003B95"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                )}
                {lineVisibility.commission && (
                  <Line
                    type="monotone"
                    dataKey="commission"
                    name="Commission"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {lineVisibility.tax && (
                  <Line
                    type="monotone"
                    dataKey="tax"
                    name="Tax"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
              </LineChart>
            </SafeChart>
          </div>
        </div>

        {/* Commission by Provider Type Donut Chart */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#111827] mb-4">
            Commission by Provider Type
          </h2>
          <div
            role="img"
            aria-label={`Commission distribution by provider type. ${COMMISSION_BY_PROVIDER.map(
              (p) => `${p.name}: ${p.percentage}%`,
            ).join(", ")}.`}
          >
            <SafeChart height={260}>
              <PieChart>
                <Pie
                  data={COMMISSION_BY_PROVIDER}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  dataKey="amount"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {COMMISSION_BY_PROVIDER.map((entry, idx) => (
                    <Cell key={entry.name} fill={PIE_COLORS[idx]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<PieTooltip />} />
                {/* Centre label */}
                <text
                  x="50%"
                  y="46%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs"
                  fill="#6B7280"
                >
                  Total
                </text>
                <text
                  x="50%"
                  y="56%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-sm font-bold"
                  fill="#111827"
                >
                  {formatSARAbbrev(totalCommission)}
                </text>
              </PieChart>
            </SafeChart>
          </div>
          {/* Legend */}
          <div className="space-y-2 mt-3">
            {COMMISSION_BY_PROVIDER.map((entry, idx) => (
              <div
                key={entry.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: PIE_COLORS[idx] }}
                  />
                  <span className="text-[#374151]">{entry.name}</span>
                </div>
                <span className="text-[#6B7280] tabular-nums">
                  {formatSAR(entry.amount)} ({entry.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Booking Revenue by Type (full width) ── */}
      <div className="bg-white border rounded-xl p-5">
        <h2 className="text-base font-semibold text-[#111827] mb-1">
          Booking Revenue by Type
        </h2>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          {[
            { label: "Revenue", color: "#003B95" },
            { label: "Commission", color: "#3B82F6" },
            { label: "Tax", color: "#F59E0B" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
        <div
          role="img"
          aria-label="Booking revenue breakdown by type showing revenue, commission, and tax."
        >
          <SafeChart height={320}>
            <BarChart
              data={BOOKING_REVENUE_BY_TYPE}
              barGap={4}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <RechartsTooltip content={<ChartTooltip />} />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#003B95"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="commission"
                name="Commission"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="tax"
                name="Tax"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </SafeChart>
        </div>
      </div>

      {/* ── Recent Transactions Summary ──────────────────────── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">
            Recent Transactions
          </h2>
          <Link
            to="/payments"
            className="text-sm font-medium text-[#003B95] hover:underline flex items-center gap-1"
          >
            View All Transactions
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                  Transaction ID
                </TableHead>
                <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                  Type
                </TableHead>
                <TableHead className="text-xs text-[#6B7280] font-semibold px-4 text-right">
                  Amount (SAR)
                </TableHead>
                <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                  Status
                </TableHead>
                <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                  Date (UTC)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECENT_TRANSACTIONS.map((txn) => (
                <TableRow key={txn.id} className="hover:bg-gray-50/50">
                  <TableCell className="px-4">
                    <span className="text-sm font-medium text-[#003B95]">
                      {txn.id}
                    </span>
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge
                      className={cn(
                        "text-xs font-medium",
                        TXN_TYPE_STYLES[txn.type],
                      )}
                    >
                      {txn.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-sm text-[#111827] font-medium text-right tabular-nums">
                    {formatSAR(txn.amount)}
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge
                      className={cn(
                        "text-xs font-medium",
                        TXN_STATUS_STYLES[txn.status],
                      )}
                    >
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-xs text-[#6B7280] tabular-nums">
                    {format(new Date(txn.date), "dd MMM yyyy, HH:mm")} UTC
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
