import { Badge } from "../../../ui/badge";

export type ProviderType = "FP" | "TP" | "FC";

interface TypeBadgeProps {
  type: ProviderType;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  let variant: "default" | "secondary" | "outline" = "outline";
  let colorClass = "";

  switch (type) {
    case "FP":
      // Freelance Provider - Purple/Indigo
      colorClass = "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200";
      break;
    case "TP":
      // Team Provider (Academy?) - Orange
      colorClass = "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200";
      break;
    case "FC":
      // Facility Center (Club) - Blue
      colorClass = "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
      break;
  }

  return (
    <Badge variant={variant} className={`${colorClass} ${className || ""}`}>
      {type}
    </Badge>
  );
}
