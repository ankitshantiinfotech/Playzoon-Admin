import { Trophy, Activity, Users, CheckCircle, XCircle, Layers } from "lucide-react";

interface StatsShape {
  total: number;
  active: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  full: number;
}

interface StatCardProps {
  title: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
}

function StatCard({ title, value, sub, icon, color, textColor }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-lg shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-none mb-1">{title}</p>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface TournamentStatsProps {
  stats: StatsShape;
}

export function TournamentStats({ stats }: TournamentStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard title="Total" value={stats.total} icon={<Trophy className="w-5 h-5 text-purple-600" />} color="bg-purple-50" textColor="text-gray-900" />
      <StatCard title="Active" value={stats.active} sub="accepting entries" icon={<Activity className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50" textColor="text-emerald-700" />
      <StatCard title="Full" value={stats.full} sub="max capacity" icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-50" textColor="text-blue-700" />
      <StatCard title="Confirmed" value={stats.confirmed} sub="facility locked" icon={<Layers className="w-5 h-5 text-indigo-600" />} color="bg-indigo-50" textColor="text-indigo-700" />
      <StatCard title="Completed" value={stats.completed} icon={<CheckCircle className="w-5 h-5 text-gray-600" />} color="bg-gray-100" textColor="text-gray-700" />
      <StatCard title="Cancelled" value={stats.cancelled} icon={<XCircle className="w-5 h-5 text-red-600" />} color="bg-red-50" textColor="text-red-700" />
    </div>
  );
}
