import { AlertTriangle, ChevronRight } from "lucide-react";

export function CascadePreview() {
  const cascadePoints = [
    "Profile and public listings will be hidden immediately.",
    "All active 'Player' accounts linked to this provider will be unlinked.",
    "Future bookings (starting after 48h) will be automatically cancelled.",
    "Pending payouts will be frozen until manual review.",
    "Staff/Coach accounts associated solely with this provider will be deactivated.",
    "API access keys will be revoked.",
    "Email notification will be sent to the provider and all affected staff."
  ];

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 mt-4">
      <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
        <AlertTriangle className="h-4 w-4" />
        <span>7-Point Deactivation Cascade</span>
      </div>
      <p className="text-xs text-amber-700 mb-3">
        The following actions will be executed sequentially:
      </p>
      <ul className="space-y-1.5">
        {cascadePoints.map((point, index) => (
          <li key={index} className="text-sm text-amber-900 flex items-start gap-2">
            <span className="bg-amber-200 text-amber-800 text-[10px] rounded-full h-4 w-4 flex items-center justify-center shrink-0 mt-0.5">
              {index + 1}
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
