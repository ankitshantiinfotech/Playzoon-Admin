import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Download, TrendingUp, DollarSign } from "lucide-react";
import { revenueData, providerRevenue } from "./mockData";
import { cn } from "@/lib/utils";
import { SafeChart } from "../SafeChart";

export function RevenueSection() {
  const [timeframe, setTimeframe] = useState<"Monthly" | "Weekly">("Monthly");

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Revenue Overview
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Total Revenue
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {totalRevenue.toLocaleString()} SAR
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">+12.5% vs last period</span>
          </div>
        </div>

        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setTimeframe("Monthly")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  timeframe === "Monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeframe("Weekly")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  timeframe === "Weekly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                Weekly
              </button>
            </div>
          </div>
          <div className="h-[300px] w-full overflow-hidden min-w-0">
            <SafeChart height={300}>
              <LineChart
                data={revenueData}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [
                    `${value.toLocaleString()} SAR`,
                    "Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#003B95"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#003B95",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, fill: "#003B95" }}
                />
              </LineChart>
            </SafeChart>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Provider Type Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:col-span-1 min-w-0 overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Revenue by Provider Type
          </h3>
          <div className="h-[300px] w-full overflow-hidden min-w-0">
            <SafeChart height={300}>
              <BarChart
                data={providerRevenue}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E5E7EB"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="type"
                  type="category"
                  width={80}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                  formatter={(value: number) => [
                    `${value.toLocaleString()} SAR`,
                    "Gross Revenue",
                  ]}
                />
                <Bar
                  dataKey="grossRevenue"
                  fill="#003B95"
                  radius={[0, 4, 4, 0]}
                  barSize={32}
                />
              </BarChart>
            </SafeChart>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Revenue Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Provider Type</th>
                  <th className="px-6 py-3 text-right">Gross Revenue</th>
                  <th className="px-6 py-3 text-right">Commission</th>
                  <th className="px-6 py-3 text-right">Tax (VAT)</th>
                  <th className="px-6 py-3 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {providerRevenue.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.grossRevenue.toLocaleString()} SAR
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {item.commission.toLocaleString()} SAR
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {item.tax.toLocaleString()} SAR
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      {item.netPayout.toLocaleString()} SAR
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-6 py-4 text-gray-900">Total</td>
                  <td className="px-6 py-4 text-right">
                    {providerRevenue
                      .reduce((a, b) => a + b.grossRevenue, 0)
                      .toLocaleString()}{" "}
                    SAR
                  </td>
                  <td className="px-6 py-4 text-right">
                    {providerRevenue
                      .reduce((a, b) => a + b.commission, 0)
                      .toLocaleString()}{" "}
                    SAR
                  </td>
                  <td className="px-6 py-4 text-right">
                    {providerRevenue
                      .reduce((a, b) => a + b.tax, 0)
                      .toLocaleString()}{" "}
                    SAR
                  </td>
                  <td className="px-6 py-4 text-right text-green-700">
                    {providerRevenue
                      .reduce((a, b) => a + b.netPayout, 0)
                      .toLocaleString()}{" "}
                    SAR
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
