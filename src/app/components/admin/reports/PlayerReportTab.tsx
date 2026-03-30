// ─── US-101 Player Report Tab ─────────────────────────────────────────────────
import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Users, TrendingUp, TrendingDown, UserCheck, UserX, Smartphone } from "lucide-react";
import { cn } from "../../ui/utils";
import { SafeChart } from "../SafeChart";
import { ReportFilters } from "./types";
import {
  PLAYER_KPIS, PLAYER_REGISTRATION_TREND, PLAYER_CHANNELS, PLAYER_CITIES,
} from "./mockData";

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
};

function TrendBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={cn("flex items-center gap-1 text-xs", up ? "text-emerald-600" : "text-red-500")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{value}{suffix} vs prev
    </span>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, trend, iconBg, iconColor,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  trend: number; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn("flex items-center justify-center h-10 w-10 rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <TrendBadge value={trend} />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl text-gray-900 mt-0.5 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface Props { filters: ReportFilters; }

export function PlayerReportTab({ filters }: Props) {
  const kpis = useMemo(() => PLAYER_KPIS[filters.preset] ?? PLAYER_KPIS["30d"], [filters.preset]);
  const trend = useMemo(() => PLAYER_REGISTRATION_TREND[filters.preset] ?? PLAYER_REGISTRATION_TREND["30d"], [filters.preset]);

  const totalChannel = PLAYER_CHANNELS.reduce((a, b) => a + b.count, 0);
  const maxCity = PLAYER_CITIES[0].count;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users} label="New Registrations"
          value={kpis.newRegistrations.toLocaleString()}
          trend={kpis.newRegTrend}
          iconBg="bg-blue-50" iconColor="text-[#003B95]"
        />
        <KpiCard
          icon={UserCheck} label="Active Players"
          value={kpis.activeTotal.toLocaleString()}
          sub="registered on platform"
          trend={kpis.activeTrend}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
        />
        <KpiCard
          icon={TrendingUp} label="Retention Rate"
          value={`${kpis.retentionRate}%`}
          sub="active in last 30 days"
          trend={kpis.retentionTrend}
          iconBg="bg-violet-50" iconColor="text-violet-600"
        />
        <KpiCard
          icon={UserX} label="Churn Rate"
          value={`${kpis.churnRate}%`}
          sub="inactive 60+ days"
          trend={kpis.churnTrend}
          iconBg="bg-red-50" iconColor="text-red-500"
        />
      </div>

      {/* Registration Trend + Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-900">New Player Registrations</p>
              <p className="text-xs text-gray-400">Daily / weekly trend for selected period</p>
            </div>
          </div>
          <div className="h-[260px]">
            <SafeChart height={260}>
              <LineChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Tooltip {...TOOLTIP_STYLE}
                  formatter={(v: number) => [v.toLocaleString(), "New Registrations"]} />
                <Line type="monotone" dataKey="value" stroke="#003B95" strokeWidth={2.5}
                  dot={false} activeDot={{ r: 5, fill: "#003B95" }} />
              </LineChart>
            </SafeChart>
          </div>
        </div>

        {/* Registration by channel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-900 mb-1">Registration by Channel</p>
          <p className="text-xs text-gray-400 mb-5">All-time distribution</p>
          <div className="space-y-3">
            {PLAYER_CHANNELS.map((ch) => (
              <div key={ch.channel}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{ch.channel}</span>
                  <span className="text-xs text-gray-900 tabular-nums">{ch.count.toLocaleString()} <span className="text-gray-400">({ch.pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${ch.pct}%`, backgroundColor: ch.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* City distribution + Retention card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top cities */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-900 mb-1">Player Registrations by City</p>
          <p className="text-xs text-gray-400 mb-5">Top 10 cities — all-time</p>
          <div className="h-[280px]">
            <SafeChart height={280}>
              <BarChart
                data={PLAYER_CITIES}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                <XAxis type="number" axisLine={false} tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v) => v.toLocaleString()} />
                <YAxis dataKey="city" type="category" width={88} axisLine={false} tickLine={false}
                  tick={{ fill: "#374151", fontSize: 11 }} />
                <Tooltip {...TOOLTIP_STYLE}
                  formatter={(v: number) => [v.toLocaleString(), "Players"]} />
                <Bar dataKey="count" fill="#003B95" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </SafeChart>
          </div>
        </div>

        {/* Retention + Churn visual */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-5">
          <p className="text-sm text-gray-900">Player Health Snapshot</p>

          {/* Retention donut */}
          <div className="flex flex-col items-center">
            <div className="relative h-[140px] w-[140px]">
              <SafeChart height={140}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Retained", value: kpis.retentionRate },
                      { name: "Churned", value: kpis.churnRate },
                      { name: "Other", value: 100 - kpis.retentionRate - kpis.churnRate },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={65}
                    paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                    <Cell fill="#F3F4F6" />
                  </Pie>
                </PieChart>
              </SafeChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl text-gray-900 tabular-nums">{kpis.retentionRate}%</span>
                <span className="text-[10px] text-gray-400">retained</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                Retained (active 30d)
              </div>
              <span className="text-xs text-emerald-600 tabular-nums">{kpis.retentionRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400 shrink-0" />
                Churned (60+ days idle)
              </div>
              <span className="text-xs text-red-500 tabular-nums">{kpis.churnRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-200 shrink-0" />
                Occasional
              </div>
              <span className="text-xs text-gray-400 tabular-nums">
                {(100 - kpis.retentionRate - kpis.churnRate).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#003B95]/5 rounded-lg p-3 text-center border border-[#003B95]/10">
            <p className="text-xs text-gray-400">Total Registered Players</p>
            <p className="text-xl text-[#003B95] tabular-nums mt-0.5">{kpis.activeTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}