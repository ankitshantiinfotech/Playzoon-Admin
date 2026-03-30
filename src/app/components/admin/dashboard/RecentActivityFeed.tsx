import { 
  UserPlus, 
  CalendarCheck, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const activities = [
  {
    id: 1,
    type: "new_user",
    message: "New user registered: Arjun Mehta",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    icon: UserPlus,
    color: "text-blue-600 bg-blue-100",
  },
  {
    id: 2,
    type: "booking_confirmed",
    message: "Booking confirmed for Central Sports Arena",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    icon: CheckCircle2,
    color: "text-green-600 bg-green-100",
  },
  {
    id: 3,
    type: "payout_request",
    message: "New payout request from Coach Ravi Kumar (₹5,000)",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    icon: DollarSign,
    color: "text-amber-600 bg-amber-100",
  },
  {
    id: 4,
    type: "booking_cancelled",
    message: "Booking cancelled by user Neha Patel",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    icon: XCircle,
    color: "text-red-600 bg-red-100",
  },
  {
    id: 5,
    type: "new_provider",
    message: "New facility provider application: City Gym",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    icon: AlertCircle,
    color: "text-purple-600 bg-purple-100",
  },
  {
    id: 6,
    type: "new_booking",
    message: "New booking request for Coach Sunita Das",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    icon: CalendarCheck,
    color: "text-indigo-600 bg-indigo-100",
  },
  {
    id: 7,
    type: "new_user",
    message: "New user registered: Vikram Singh",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    icon: UserPlus,
    color: "text-blue-600 bg-blue-100",
  },
  {
    id: 8,
    type: "booking_completed",
    message: "Booking completed at Green Turf Stadium",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    icon: CheckCircle2,
    color: "text-green-600 bg-green-100",
  },
  {
    id: 9,
    type: "payout_processed",
    message: "Payout processed for Facility Provider XYZ",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    icon: DollarSign,
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    id: 10,
    type: "system_alert",
    message: "Daily backup completed successfully",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    icon: Clock,
    color: "text-gray-600 bg-gray-100",
  },
];

export function RecentActivityFeed() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</button>
      </div>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
            <div className={`p-2 rounded-full flex-shrink-0 ${activity.color}`}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
