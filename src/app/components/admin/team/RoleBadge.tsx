import { Badge } from "../../ui/badge";

interface RoleBadgeProps {
  name: string;
  color?: string; // e.g. "blue", "green", "purple"
}

export function RoleBadge({ name, color = "gray" }: RoleBadgeProps) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200",
    green: "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200",
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-100/80 border-purple-200",
    orange: "bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200",
    red: "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200",
    gray: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200",
  };

  const className = colorMap[color] || colorMap.gray;

  return (
    <Badge variant="outline" className={`font-medium border ${className}`}>
      {name}
    </Badge>
  );
}
