import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { SafeChart } from "../SafeChart";
import { Download, CreditCard, Clock, CheckCircle } from "lucide-react";
import { payoutStatus } from "./mockData";

const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

export function PayoutsSection() {
  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Payout Summary
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">
              Total Paid Out
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">1.2M SAR</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">All time</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">
              Pending Amount
            </p>
            <h3 className="text-3xl font-bold text-amber-600 mt-2">
              45,000 SAR
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full w-fit">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Processing</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">
              Avg. Processing Time
            </p>
            <h3 className="text-3xl font-bold text-blue-600 mt-2">1.5 Days</h3>
          </div>
          <div className="mt-4 text-sm text-gray-500">Within 24-48h target</div>
        </div>

        {/* Payout Status Pie */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center min-w-0 overflow-hidden">
          <h3 className="text-sm font-medium text-gray-900 mb-2 w-full text-left">
            Payout Status
          </h3>
          <div className="h-[150px] w-full overflow-hidden">
            <SafeChart height={150}>
              <PieChart>
                <Pie
                  data={payoutStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {payoutStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={20}
                  iconSize={8}
                  wrapperStyle={{ fontSize: "10px" }}
                />
              </PieChart>
            </SafeChart>
          </div>
        </div>
      </div>
    </div>
  );
}
