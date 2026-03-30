import { Users, UserCheck, UserX } from "lucide-react";
import { AdminStats } from "./types";

interface AdminStatsProps {
  stats: AdminStats;
}

export function AdminStatsDisplay({ stats }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Total Admins</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-full">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Active Admins</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-full">
          <UserCheck className="w-6 h-6 text-green-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Inactive Admins</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inactive}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-full">
          <UserX className="w-6 h-6 text-red-600" />
        </div>
      </div>
    </div>
  );
}
