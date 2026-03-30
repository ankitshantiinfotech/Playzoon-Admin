// ─── US-101 Earnings Report Tab ───────────────────────────────────────────────
import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Banknote, Building2, GraduationCap, Users, Trophy, TrendingUp, TrendingDown, CircleDollarSign, Clock } from "lucide-react";
import { cn } from "../../ui/utils";
import { SafeChart } from "../SafeChart";
import { ReportFilters } from "./types";
import {
  EARNINGS_KPIS, COMMISSION_TREND, COMMISSION_BY_TYPE, PAYOUT_STATUS_BREAKDOWN,
} from "./mockData";

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  Facility: Building2, Training: GraduationCap, Coach: Users, Tournament: Trophy,
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

function KpiCard({
  icon: Icon, label, value, sub, trend, iconBg, iconColor, valueColor,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  trend?: number; iconBg: string; iconColor: string; valueColor?: string;
}) {
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
        <p className={cn("text-2xl mt-0.5 tabular-nums", valueColor ?? "text-gray-900")}>{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface Props { filters: ReportFilters; }

export function EarningsReportTab({ filters }: Props) {
  const kpis = useMemo(() => EARNINGS_KPIS[filters.preset] ?? EARNINGS_KPIS["30d"], [filters.preset]);
  const commTrend = useMemo(() => COMMISSION_TREND[filters.preset] ?? COMMISSION_TREND["30d"], [filters.preset]);

  const totalCommission = COMMISSION_BY_TYPE.reduce((a, b) => a + b.commission, 0);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={CircleDollarSign} label="Total Commission"
          value={fmtAED(kpis.totalCommission)}
          sub="Platform earnings (gross)"
          trend={kpis.commissionTrend}
          iconBg="bg-blue-50" iconColor="text-[#003B95]"
          valueColor="text-[#003B95]"
        />
        <KpiCard
          icon={Banknote} label="Payout Disbursed"
          value={fmtAED(kpis.payoutDisbursed)}
          sub="Paid to providers"
          trend={kpis.payoutTrend}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          valueColor="text-emerald-600"
        />
        <KpiCard
          icon={Clock} label="Payout Pending"
          value={fmtAED(kpis.payoutPending)}
          sub="Awaiting processing"
          iconBg="bg-amber-50" iconColor="text-amber-600"
          valueColor="text-amber-600"
        />
        <KpiCard
          icon={TrendingUp} label="Net Platform Earnings"
          value={fmtAED(kpis.netEarnings)}
          sub="Commission − operating costs"
          iconBg="bg-violet-50" iconColor="text-violet-600"
          valueColor="text-violet-600"
        />
      </div>

      {/* Commission trend + Net earnings breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commission trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <p className="text-sm text-gray-900">Platform Commission Trend</p>
            <p className="text-xs text-gray-400">AED earned as platform commission per data point</p>
          </div>
          <div className="h-[240px]">
            <SafeChart height={240}>
              <LineChart data={commTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="grad-comm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [fmtAED(v), "Commission"]} />
                <Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2.5}
                  dot={false} activeDot={{ r: 5, fill: "#7C3AED" }} />
              </LineChart>
            </SafeChart>
          </div>
        </div>

        {/* Net earnings breakdown card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
          <p className="text-sm text-gray-900">Net Earnings Breakdown</p>

          {/* Gross commission */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Gross Commission</span>
              <span className="text-xs text-gray-900 tabular-nums">{fmtAED(kpis.totalCommission)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Operating Costs</span>
              <span className="text-xs text-red-500 tabular-nums">
                − {fmtAED(kpis.totalCommission - kpis.netEarnings)}
              </span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-xs text-gray-700">Net Earnings</span>
              <span className="text-sm text-violet-600 tabular-nums">{fmtAED(kpis.netEarnings)}</span>
            </div>
          </div>

          {/* Margin visual */}
          <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 mb-1">Net Margin</p>
            <p className="text-2xl text-violet-700 tabular-nums">
              {((kpis.netEarnings / kpis.totalCommission) * 100).toFixed(1)}%
            </p>
            <div className="mt-2 h-1.5 bg-violet-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${(kpis.netEarnings / kpis.totalCommission) * 100}%` }}
              />
            </div>
          </div>

          {/* Payout summary */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Provider Payouts</span>
              <span className="text-xs text-emerald-600 tabular-nums">{fmtAED(kpis.payoutDisbursed)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Pending Payouts</span>
              <span className="text-xs text-amber-600 tabular-nums">{fmtAED(kpis.payoutPending)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Commission by service type + Payout status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission by type — bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-900 mb-1">Commission by Service Type</p>
          <p className="text-xs text-gray-400 mb-5">AED earned per booking type with effective commission rate</p>
          <div className="h-[240px]">
            <SafeChart height={240}>
              <BarChart
                data={COMMISSION_BY_TYPE}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="type" axisLine={false} tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number, name: string) => [
                    name === "commission" ? fmtAED(v) : fmtAED(v),
                    name === "commission" ? "Commission" : "Gross Revenue",
                  ]}
                />
                <Legend formatter={(v) => v === "commission" ? "Commission" : "Gross Revenue"} iconType="circle" iconSize={8} />
                <Bar dataKey="grossRevenue" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="commission" radius={[4, 4, 0, 0]} barSize={28}>
                  {COMMISSION_BY_TYPE.map((t) => <Cell key={t.type} fill={t.color} />)}
                </Bar>
              </BarChart>
            </SafeChart>
          </div>

          {/* Rate table */}
          <div className="mt-4 space-y-2 border-t pt-4">
            {COMMISSION_BY_TYPE.map((t) => {
              const Icon = TYPE_ICONS[t.type] ?? Building2;
              return (
                <div key={t.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <Icon className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">{t.type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-400">{t.rate}% rate</span>
                    <span className="text-gray-900 tabular-nums">{fmtAED(t.commission)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payout status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-900 mb-1">Payout Status Breakdown</p>
          <p className="text-xs text-gray-400 mb-5">Distribution of provider payout statuses</p>

          {/* Donut */}
          <div className="flex gap-6 items-center mb-6">
            <div className="relative h-[180px] w-[180px] shrink-0">
              <SafeChart height={180}>
                <PieChart>
                  <Pie
                    data={PAYOUT_STATUS_BREAKDOWN}
                    cx="50%" cy="50%"
                    innerRadius={56} outerRadius={78}
                    paddingAngle={3} dataKey="amount"
                    startAngle={90} endAngle={-270}
                  >
                    {PAYOUT_STATUS_BREAKDOWN.map((s) => (
                      <Cell key={s.status} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE}
                    formatter={(v: number) => [fmtAED(v), "Amount"]} />
                </PieChart>
              </SafeChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-gray-400">Total</span>
                <span className="text-sm text-gray-900">{fmtAED(kpis.payoutDisbursed + kpis.payoutPending)}</span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {PAYOUT_STATUS_BREAKDOWN.map((s) => (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-600">{s.status}</span>
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: s.color }}>{s.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 text-right">{fmtAED(s.amount)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Commission summary across types */}
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs text-gray-500 mb-2">All-time Commission by Type</p>
            <div className="h-8 rounded-lg overflow-hidden flex">
              {COMMISSION_BY_TYPE.map((t, i) => {
                const pct = Math.round((t.commission / totalCommission) * 100);
                return (
                  <div
                    key={t.type}
                    className="h-full flex items-center justify-center text-[10px] text-white transition-all"
                    style={{ width: `${pct}%`, backgroundColor: t.color }}
                    title={`${t.type}: ${pct}%`}
                  >
                    {pct > 8 ? `${pct}%` : ""}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {COMMISSION_BY_TYPE.map((t) => (
                <div key={t.type} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.type}: {fmtAED(t.commission)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}