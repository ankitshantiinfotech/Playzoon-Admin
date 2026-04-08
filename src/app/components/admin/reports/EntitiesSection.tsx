import {
  Download,
  LayoutGrid,
  Award,
  ShieldCheck,
  Dumbbell,
  Star,
  AlertTriangle,
} from "lucide-react";
import { entityStats, topBookings, topRevenue } from "./mockData";

export function EntitiesSection() {
  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-600" />
          Entity Performance
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">
              Facilities
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {entityStats.facilities.active + entityStats.facilities.inactive}
            </h3>
            <div className="mt-2 flex gap-3 text-xs">
              <span className="text-green-600 font-medium">
                {entityStats.facilities.active} Active
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">
                {entityStats.facilities.inactive} Inactive
              </span>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <LayoutGrid className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">
              Trainings
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {entityStats.trainings.active + entityStats.trainings.inactive}
            </h3>
            <div className="mt-2 flex gap-3 text-xs">
              <span className="text-green-600 font-medium">
                {entityStats.trainings.active} Active
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">
                {entityStats.trainings.inactive} Inactive
              </span>
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
            <Dumbbell className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">
              Coaches
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {entityStats.coaches.verified + entityStats.coaches.unverified}
            </h3>
            <div className="mt-2 flex gap-3 text-xs">
              <span className="text-green-600 font-medium">
                {entityStats.coaches.verified} Verified
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-amber-500">
                {entityStats.coaches.unverified} Pending
              </span>
            </div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Bookings Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Top Entities by Bookings
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-10">#</th>
                <th className="px-6 py-3">Entity Name</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3 text-right">Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topBookings.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.provider}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">
                    {item.metric}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Revenue Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              Top Entities by Revenue
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-10">#</th>
                <th className="px-6 py-3">Entity Name</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topRevenue.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.provider}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    {item.metric.toLocaleString()} SAR
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
