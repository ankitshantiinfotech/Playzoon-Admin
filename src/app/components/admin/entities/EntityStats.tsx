import { Building, ArrowUpRight, ArrowDownRight, CheckCircle, AlertTriangle, XCircle, ShieldAlert } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  change?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, trend, change, icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-bold text-gray-900">{value}</h3>
          {change && (
            <span className={`text-xs font-medium flex items-center ${
              trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"
            }`}>
              {trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : trend === "down" ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : null}
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function EntityStats() {
  // Mock combined stats
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <StatCard
        title="Total Entities"
        value="245"
        trend="up"
        change="+12%"
        icon={<Building className="w-5 h-5 text-blue-600" />}
        color="bg-blue-50"
      />
      <StatCard
        title="Active"
        value="189"
        trend="up"
        change="+8%"
        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        color="bg-green-50"
      />
      <StatCard
        title="Inactive"
        value="42"
        trend="down"
        change="-3%"
        icon={<XCircle className="w-5 h-5 text-gray-600" />}
        color="bg-gray-100"
      />
      <StatCard
        title="Pending Review"
        value="11"
        trend="neutral"
        change="Waitlist: 5"
        icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        color="bg-amber-50"
      />
      <StatCard
        title="Overridden"
        value="3"
        trend="neutral"
        change="Hidden"
        icon={<ShieldAlert className="w-5 h-5 text-red-600" />}
        color="bg-red-50"
      />
    </div>
  );
}
