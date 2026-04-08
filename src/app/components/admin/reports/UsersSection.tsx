import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { SafeChart } from "../SafeChart";
import { Download, Users, TrendingUp } from "lucide-react";
import { userGrowth, userRoles } from "./mockData";

export function UsersSection() {
  const totalUsers = userRoles.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          User Analytics
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Growth Line Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm col-span-1 lg:col-span-2 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">User Growth</h3>
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span className="font-medium">+8% vs last month</span>
            </div>
          </div>
          <div className="h-[250px] w-full overflow-hidden min-w-0">
            <SafeChart height={250}>
              <LineChart data={userGrowth}>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [
                    `${value} New Users`,
                    "Signups",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="signups"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#8B5CF6",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, fill: "#8B5CF6" }}
                />
              </LineChart>
            </SafeChart>
          </div>
        </div>

        {/* User Roles Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm col-span-1 lg:col-span-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Users by Role
          </h3>
          <div className="h-[250px] w-full flex flex-col justify-center gap-4">
            {userRoles.map((role, index) => {
              const percentage = Math.round((role.count / totalUsers) * 100);
              const colors = [
                "bg-blue-600",
                "bg-green-500",
                "bg-purple-500",
                "bg-amber-500",
              ];

              return (
                <div key={role.role} className="w-full">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      {role.role}
                    </span>
                    <span className="text-gray-500">
                      {role.count.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
