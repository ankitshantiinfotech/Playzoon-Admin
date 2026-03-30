// ─── US-101 Payment Report Tab ────────────────────────────────────────────────
import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { CreditCard, CheckCircle, XCircle, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../ui/utils";
import { SafeChart } from "../SafeChart";
import { ReportFilters } from "./types";
import {
  PAYMENT_KPIS, PAYMENT_REVENUE_TREND, PAYMENT_METHODS, PAYMENT_FAILURE_REASONS, REFUND_TREND,
} from "./mockData";

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
};

const fmtAED = (v: number) =>
  v >= 1_000_000
    ? `AED ${(v / 1_000_000).toFixed(2)}M`
    : v >= 1_000
    ? `AED ${(v / 1_000).toFixed(1)}K`
    : `AED ${v.toLocaleString()}`;

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={cn("flex items-center gap-1 text-xs", up ? "text-emerald-600" : "text-red-500")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{value}% vs prev
    </span>
  );
}

interface KpiProps {
  icon: React.ElementType; label: string; primary: string; secondary?: string;
  trend?: number; iconBg: string; iconColor: string; valueColor?: string;
}

function KpiCard({ icon: Icon, label, primary, secondary, trend, iconBg, iconColor, valueColor }: KpiProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn("flex items-center justify-center h-10 w-10 rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        {trend != null && <TrendBadge value={trend} />}
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={cn("text-2xl mt-0.5 tabular-nums", valueColor ?? "text-gray-900")}>{primary}</p>
        {secondary && <p className="text-xs text-gray-500 mt-0.5">{secondary}</p>}
      </div>
    </div>
  );
}

interface Props { filters: ReportFilters; }

export function PaymentReportTab({ filters }: Props) {
  const kpis = useMemo(() => PAYMENT_KPIS[filters.preset] ?? PAYMENT_KPIS["30d"], [filters.preset]);
  const revenueTrend = useMemo(() => PAYMENT_REVENUE_TREND[filters.preset] ?? PAYMENT_REVENUE_TREND["30d"], [filters.preset]);
  const refundTrend  = useMemo(() => REFUND_TREND[filters.preset] ?? REFUND_TREND["30d"], [filters.preset]);
  const maxFailure   = Math.max(...PAYMENT_FAILURE_REASONS.map((r) => r.count));

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={CreditCard} label="Gross Revenue"
          primary={fmtAED(kpis.grossRevenue)}
          secondary={`${kpis.successfulCount.toLocaleString()} transactions`}
          trend={kpis.revenueTrend}
          iconBg="bg-blue-50" iconColor="text-[#003B95]"
        />
        <KpiCard
          icon={CheckCircle} label="Successful Payments"
          primary={kpis.successfulCount.toLocaleString()}
          secondary={fmtAED(kpis.successfulAmount)}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          valueColor="text-emerald-600"
        />
        <KpiCard
          icon={XCircle} label="Failed Payments"
          primary={kpis.failedCount.toLocaleString()}
          secondary={fmtAED(kpis.failedAmount)}
          iconBg="bg-red-50" iconColor="text-red-500"
          valueColor="text-red-500"
        />
        <KpiCard
          icon={RotateCcw} label="Refunds Issued"
          primary={kpis.refundsCount.toLocaleString()}
          secondary={fmtAED(kpis.refundsAmount)}
          iconBg="bg-amber-50" iconColor="text-amber-600"
          valueColor="text-amber-600"
        />
      </div>

      {/* Revenue trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="mb-4">
          <p className="text-sm text-gray-900">Gross Revenue Trend</p>
          <p className="text-xs text-gray-400">AED — collected from players for the selected period</p>
        </div>
        <div className="h-[240px]">
          <SafeChart height={240}>
            <LineChart data={revenueTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#003B95" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#003B95" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="label" axisLine={false} tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [fmtAED(v), "Revenue"]} />
              <Line type="monotone" dataKey="value" stroke="#003B95" strokeWidth={2.5}
                dot={false} activeDot={{ r: 5, fill: "#003B95" }} />
            </LineChart>
          </SafeChart>
        </div>
      </div>

      {/* Payment method + Failure reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment method distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-900 mb-4">Payment Method Distribution</p>
          <div className="flex gap-6 items-start">
            {/* Donut */}
            <div className="relative h-[180px] w-[180px] shrink-0">
              <SafeChart height={180}>
                <PieChart>
                  <Pie
                    data={PAYMENT_METHODS}
                    cx="50%" cy="50%"
                    innerRadius={56} outerRadius={78}
                    paddingAngle={3} dataKey="pct"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <Cell key={m.method} fill={m.color} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE}
                    formatter={(v: number, name: string) => [`${v}%`, name]} />
                </PieChart>
              </SafeChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-gray-400">Total</span>
                <span className="text-lg text-gray-900 tabular-nums">{kpis.successfulCount.toLocaleString()}</span>
              </div>
            </div>
            {/* Method rows */}
            <div className="flex-1 space-y-3">
              {PAYMENT_METHODS.map((m) => (
                <div key={m.method}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                      <span className="text-xs text-gray-600">{m.shortLabel}</span>
                    </div>
                    <span className="text-xs text-gray-900 tabular-nums">{m.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-gray-400">{m.count.toLocaleString()} txns</span>
                    <span className="text-[10px] text-gray-400">{fmtAED(m.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Failure reasons */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-900 mb-1">Failed Payment Reasons</p>
          <p className="text-xs text-gray-400 mb-5">
            {kpis.failedCount} failed transactions ({fmtAED(kpis.failedAmount)})
          </p>
          <div className="space-y-4">
            {PAYMENT_FAILURE_REASONS.map((r) => (
              <div key={r.reason}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-700">{r.reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-500 tabular-nums">{r.count}</span>
                    <span className="text-[10px] text-gray-400">({r.pct}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-300 rounded-full"
                    style={{ width: `${(r.count / maxFailure) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Success vs Failure summary */}
          <div className="mt-5 pt-5 border-t grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
              <p className="text-xs text-gray-500 mb-1">Success Rate</p>
              <p className="text-lg text-emerald-600 tabular-nums">
                {((kpis.successfulCount / (kpis.successfulCount + kpis.failedCount)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
              <p className="text-xs text-gray-500 mb-1">Failure Rate</p>
              <p className="text-lg text-red-500 tabular-nums">
                {((kpis.failedCount / (kpis.successfulCount + kpis.failedCount)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Refund trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-900">Refunds Issued Over Time</p>
            <p className="text-xs text-gray-400">AED refunded to players — {kpis.refundsCount} total refunds</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 text-center">
            <p className="text-[10px] text-gray-400">Total Refunded</p>
            <p className="text-sm text-amber-600 tabular-nums">{fmtAED(kpis.refundsAmount)}</p>
          </div>
        </div>
        <div className="h-[200px]">
          <SafeChart height={200}>
            <BarChart data={refundTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="label" axisLine={false} tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [fmtAED(v), "Refunds"]} />
              <Bar dataKey="value" fill="#F59E0B" radius={[3, 3, 0, 0]} barSize={14} />
            </BarChart>
          </SafeChart>
        </div>
      </div>
    </div>
  );
}