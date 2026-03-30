import { Badge } from "../../../ui/badge";

type PlayerStatus = "Active" | "Inactive" | "Locked";

interface StatusPillProps {
  status: PlayerStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  
  switch (status) {
    case "Active":
      variant = "default"; // Usually green/primary
      break;
    case "Inactive":
      variant = "secondary"; // Usually gray
      break;
    case "Locked":
      variant = "destructive"; // Usually red
      break;
  }

  // Override colors if needed to match specific design requirements beyond the default variants
  const className = status === "Active" 
    ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" 
    : status === "Inactive" 
    ? "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
    : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
}
