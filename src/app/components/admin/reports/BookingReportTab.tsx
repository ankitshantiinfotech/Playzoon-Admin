// ─── US-101 Booking Report Tab ────────────────────────────────────────────────
import { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Calendar, TrendingUp, TrendingDown, Building2, GraduationCap, Users, Trophy } from "lucide-react";
import { cn } from "../../ui/utils";
import { SafeChart } from "../SafeChart";
import { ReportFilters, BookingTypeMetric } from "./types";
import {
  BOOKING_KPIS, BOOKING_STACKED_TREND, BOOKING_TYPES_METRICS, TOP_PROVIDERS, TOP_BOOKING_CITIES,
} from "./mockData";

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  Facility: Building2, Training: GraduationCap, Coach: Users, Tournament: Trophy,
};

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
  icon: Icon, label, value, sub, trend, iconBg, iconColor, neutral,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  trend: number; iconBg: string; iconColor: string; neutral?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn("flex items-center justify-center h-10 w-10 rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        {!neutral && <TrendBadge value={trend} />}
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

export function BookingReportTab({ filters }: Props) {
  const kpis = useMemo(() => BOOKING_KPIS[filters.preset] ?? BOOKING_KPIS["30d"], [filters.preset]);
  const stackedTrend = useMemo(() => BOOKING_STACKED_TREND[filters.preset] ?? BOOKING_STACKED_TREND["30d"], [filters.preset]);

  const totalByType = BOOKING_TYPES_METRICS.reduce((a, b) => a + b.count, 0);
  const maxCancel = Math.max(...BOOKING_TYPES_METRICS.map((t) => t.cancellationRate));

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Calendar} label="Total Bookings"
          value={kpis.totalBookings.toLocaleString()}
          trend={kpis.bookingsTrend}
          iconBg="bg-blue-50" iconColor="text-[#003B95]"
        />
        <KpiCard
          icon={TrendingDown} label="Cancellation Rate"
          value={`${kpis.cancellationRate}%`}
          sub="of all bookings"
          trend={kpis.cancellationTrend}
          iconBg="bg-red-50" iconColor="text-red-500"
        />
        <KpiCard
          icon={TrendingUp} label="Avg Booking Value"
          value={`AED ${kpis.avgBookingValue}`}
          sub="per booking"
          trend={kpis.avgValueTrend}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
        />
        <KpiCard
          icon={Building2} label="Top Booking Type"
          value={kpis.topType}
          sub="by volume"
          trend={0}
          neutral
          iconBg="bg-amber-50" iconColor="text-amber-600"
        />
      </div>

      {/* Stacked area trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-900">Booking Volume Trend</p>
            <p className="text-xs text-gray-400">Broken down by booking type</p>
          </div>
        </div>
        <div className="h-[260px]">
          <SafeChart height={260}>
            <AreaChart data={stackedTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                {[
                  { key: "facility",   color: "#003B95" },
                  { key: "training",   color: "#7C3AED" },
                  { key: "coach",      color: "#D97706" },
                  { key: "tournament", color: "#DC2626" },
                ].map(({ key, color }) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="label" axisLine={false} tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE}
                formatter={(v: number, name: string) => [v.toLocaleString(), name.charAt(0).toUpperCase() + name.slice(1)]} />
              <Legend formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="facility"   stroke="#003B95" fill="url(#grad-facility)"   strokeWidth={2} />
              <Area type="monotone" dataKey="training"   stroke="#7C3AED" fill="url(#grad-training)"   strokeWidth={2} />
              <Area type="monotone" dataKey="coach"      stroke="#D97706" fill="url(#grad-coach)"      strokeWidth={2} />
              <Area type="monotone" dataKey="tournament" stroke="#DC2626" fill="url(#grad-tournament)" strokeWidth={2} />
            </AreaChart>
          </SafeChart>
        </div>
      </div>

      {/* By-type breakdown + Cancellation rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by type donut + table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-900 mb-4">Bookings by Type</p>
          <div className="flex gap-6 items-center">
            {/* Donut */}
            <div className="relative h-[160px] w-[160px] shrink-0">
              <SafeChart height={160}>
                <PieChart>
                  <Pie
                    data={BOOKING_TYPES_METRICS}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={72}
                    paddingAngle={3} dataKey="count"
                  >
                    {BOOKING_TYPES_METRICS.map((t) => (
                      <Cell key={t.type} fill={t.color} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE}
                    formatter={(v: number, name: string) => [v.toLocaleString(), name]} />
                </PieChart>
              </SafeChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg text-gray-900">{totalByType.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400">total</span>
              </div>
            </div>
            {/* Legend rows */}
            <div className="flex-1 space-y-3">
              {BOOKING_TYPES_METRICS.map((t) => {
                const Icon = TYPE_ICONS[t.type];
                const pct = Math.round((t.count / totalByType) * 100);
                return (
                  <div key={t.type} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-600 flex-1">{t.type}</span>
                    <span className="text-xs text-gray-900 tabular-nums">{t.count.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cancellation rates + Avg Value */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-900 mb-4">Cancellation Rate &amp; Avg Booking Value</p>
          <div className="space-y-4">
            {BOOKING_TYPES_METRICS.map((t) => (
              <div key={t.type} className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <p className="text-xs text-gray-600">{t.type}</p>
                </div>
                {/* Cancellation bar */}
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                    <span>Cancel rate</span>
                    <span className="tabular-nums text-red-500">{t.cancellationRate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-300"
                      style={{ width: `${(t.cancellationRate / maxCancel) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Avg value */}
                <div className="w-24 text-right shrink-0">
                  <p className="text-xs text-gray-900 tabular-nums">AED {t.avgValue}</p>
                  <p className="text-[10px] text-gray-400">avg value</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Providers + Top Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Providers */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-900">Top Providers by Bookings</p>
            <p className="text-xs text-gray-400">Ranked by volume in selected period</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Bookings</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {TOP_PROVIDERS.map((p) => {
                  const cfg = BOOKING_TYPES_METRICS.find((t) => t.type === p.type);
                  return (
                    <tr key={p.rank} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-xs text-gray-400">{p.rank}</td>
                      <td className="px-5 py-3 text-xs text-gray-900">{p.name}</td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full border"
                          style={{ color: cfg?.color, backgroundColor: cfg?.color + "15", borderColor: cfg?.color + "30" }}
                        >
                          {p.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-900 tabular-nums">{p.bookings.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-xs text-emerald-600 tabular-nums">AED {p.revenue.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-900">Top Cities by Bookings</p>
            <p className="text-xs text-gray-400">Geographic booking distribution</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Country</th>
                  <th className="px-5 py-3 text-right">Bookings</th>
                  <th className="px-5 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {TOP_BOOKING_CITIES.map((c) => (
                  <tr key={c.rank} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-xs text-gray-400">{c.rank}</td>
                    <td className="px-5 py-3 text-xs text-gray-900">{c.city}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{c.country.toUpperCase()}</td>
                    <td className="px-5 py-3 text-right text-xs text-gray-900 tabular-nums">{c.bookings.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#003B95] rounded-full" style={{ width: `${c.pct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400 tabular-nums w-8 text-right">{c.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}