import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar
} from "recharts";
import { SafeChart } from "../SafeChart";

// Mock Data Generators — use index-based unique keys to avoid Recharts duplicate-key warnings
const generateDailyData = (days: number) => {
  const data = [];
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const idx = days - i;
    data.push({
      name: `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      idx,
      registrations: Math.floor(Math.random() * 50) + 10,
      bookings: Math.floor(Math.random() * 200) + 50,
      revenue: Math.floor(Math.random() * 5000) + 1000,
    });
  }
  return data;
};

const userTrendData = generateDailyData(30);
const bookingData = generateDailyData(30);
const revenueData = generateDailyData(30);

export function UserTrendChart() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full min-w-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registration Trend (30 Days)</h3>
      <SafeChart height={300}>
        <LineChart data={userTrendData}>
          <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} horizontalPoints={[]} />
          <XAxis 
            key="xaxis"
            dataKey="name" 
            tick={{ fontSize: 12, fill: "#6B7280" }} 
            axisLine={false} 
            tickLine={false} 
            minTickGap={30}
          />
          <YAxis 
            key="yaxis"
            tick={{ fontSize: 12, fill: "#6B7280" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            key="tooltip"
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
          <Line 
            key="line-registrations"
            type="monotone" 
            dataKey="registrations" 
            stroke="#3B82F6" 
            strokeWidth={3} 
            dot={false} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </SafeChart>
    </div>
  );
}

export function BookingVolumeChart() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full min-w-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Booking Volume (30 Days)</h3>
      <SafeChart height={300}>
        <BarChart data={bookingData}>
          <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} horizontalPoints={[]} />
          <XAxis 
            key="xaxis"
            dataKey="name" 
            tick={{ fontSize: 12, fill: "#6B7280" }} 
            axisLine={false} 
            tickLine={false}
            minTickGap={30}
          />
          <YAxis 
            key="yaxis"
            tick={{ fontSize: 12, fill: "#6B7280" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            key="tooltip"
            cursor={{ fill: "#F3F4F6" }}
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
          <Bar 
            key="bar-bookings"
            dataKey="bookings" 
            fill="#10B981" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </SafeChart>
    </div>
  );
}

export function RevenueChart() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full min-w-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Commission Revenue (30 Days)</h3>
      <SafeChart height={300}>
        <LineChart data={revenueData}>
          <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} horizontalPoints={[]} />
          <XAxis 
            key="xaxis"
            dataKey="name" 
            tick={{ fontSize: 12, fill: "#6B7280" }} 
            axisLine={false} 
            tickLine={false}
            minTickGap={30}
          />
          <YAxis 
            key="yaxis"
            tick={{ fontSize: 12, fill: "#6B7280" }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip 
            key="tooltip"
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            formatter={(value) => [`₹${value}`, "Commission"]}
          />
          <Line 
            key="line-revenue"
            type="monotone" 
            dataKey="revenue" 
            stroke="#8B5CF6" 
            strokeWidth={3} 
            dot={false} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </SafeChart>
    </div>
  );
}
