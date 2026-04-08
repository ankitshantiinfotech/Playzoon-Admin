import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { SafeChart } from "../SafeChart";
import { Download, Calendar, ArrowRight } from "lucide-react";
import { bookingStatus, bookingTypes, bookingFunnel } from "./mockData";

const COLORS = ["#003B95", "#00C49F", "#FFBB28", "#FF8042"];
const STATUS_COLORS = {
  Confirmed: "#10B981", // green-500
  Completed: "#3B82F6", // blue-500
  Cancelled: "#EF4444", // red-500
};

export function BookingsSection() {
  const totalBookings = bookingTypes.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Booking Analytics
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Bookings by Type Donut */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm col-span-1 lg:col-span-1 flex flex-col items-center min-w-0 overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4 self-start w-full">
            Bookings by Type
          </h3>
          <div className="h-[200px] w-full relative overflow-hidden min-w-0">
            <SafeChart height={200}>
              <PieChart>
                <Pie
                  data={bookingTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {bookingTypes.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </SafeChart>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">
                {totalBookings}
              </span>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        {/* Bookings by Status Bar */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm col-span-1 lg:col-span-2 min-w-0 overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bookings by Status
          </h3>
          <div className="h-[250px] w-full overflow-hidden min-w-0">
            <SafeChart height={250}>
              <BarChart
                data={bookingStatus}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E5E7EB"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="status"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="count" barSize={32} radius={[0, 4, 4, 0]}>
                  {bookingStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        STATUS_COLORS[
                          entry.status as keyof typeof STATUS_COLORS
                        ] || "#8884d8"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </SafeChart>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm col-span-1 lg:col-span-1 min-w-0 overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Conversion Funnel
          </h3>
          <div className="space-y-4 relative">
            {bookingFunnel.map((step, index) => {
              const prevCount =
                index > 0 ? bookingFunnel[index - 1].count : step.count;
              const percentage =
                index === 0
                  ? 100
                  : Math.round((step.count / bookingFunnel[0].count) * 100);
              const dropOff =
                index > 0
                  ? (((prevCount - step.count) / prevCount) * 100).toFixed(1)
                  : 0;

              return (
                <div key={step.step} className="relative">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {step.step}
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {step.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        opacity: 1 - index * 0.15,
                      }}
                    ></div>
                  </div>
                  {index > 0 && (
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                        <ArrowRight className="w-2 h-2 rotate-45" />
                        {dropOff}% drop-off
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
