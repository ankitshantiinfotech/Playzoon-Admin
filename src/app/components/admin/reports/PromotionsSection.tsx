import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { SafeChart } from "../SafeChart";
import { Download, TrendingUp, RefreshCcw } from "lucide-react";
import { promotionTypes, refreshActivity } from "./mockData";

const COLORS = ["#F59E0B", "#3B82F6", "#8B5CF6"]; // Amber, Blue, Purple

export function PromotionsSection() {
  const totalPromotionRevenue = promotionTypes.reduce(
    (acc, curr) => acc + curr.revenue,
    0,
  );

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Promotions & Refresh
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Promotion Revenue Pie */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center min-w-0 overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4 self-start">
            Promotion Revenue
          </h3>
          <div className="h-[200px] w-full relative overflow-hidden">
            <SafeChart height={200}>
              <PieChart>
                <Pie
                  data={promotionTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                >
                  {promotionTypes.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()} SAR`}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </SafeChart>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-xl font-bold text-gray-900">
                {totalPromotionRevenue.toLocaleString()}
              </span>
              <p className="text-[10px] text-gray-500 uppercase">SAR Revenue</p>
            </div>
          </div>
        </div>

        {/* Active Stats */}
        <div className="flex flex-col gap-6 lg:col-span-1 min-w-0">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
            <div className="bg-amber-50 p-3 rounded-full mb-3">
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900">145</h3>
            <p className="text-sm text-gray-500 mt-1 uppercase tracking-wide font-medium">
              Active Promotions
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
            <div className="bg-blue-50 p-3 rounded-full mb-3">
              <RefreshCcw className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900">1,240</h3>
            <p className="text-sm text-gray-500 mt-1 uppercase tracking-wide font-medium">
              Total Refreshes (Week)
            </p>
          </div>
        </div>

        {/* Refresh Activity Line Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:col-span-1 min-w-0 overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Refresh Activity Trend
          </h3>
          <div className="h-[200px] w-full overflow-hidden">
            <SafeChart height={200}>
              <LineChart data={refreshActivity}>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#3B82F6",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                />
              </LineChart>
            </SafeChart>
          </div>
        </div>
      </div>
    </div>
  );
}
