import {
  Users,
  Building2,
  GraduationCap,
  UserCheck,
  Trophy,
  Dumbbell,
} from "lucide-react";
import { Link } from "react-router";

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  linkTo: string;
}

function SummaryCard({ label, value, icon: Icon, iconBg, iconColor, linkTo }: SummaryCardProps) {
  return (
    <Link
      to={linkTo}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[#111827] group-hover:text-[#003B95] transition-colors">
          {value}
        </div>
        <p className="text-sm text-[#6B7280] mt-0.5">{label}</p>
      </div>
    </Link>
  );
}

export function KPIGrid() {
  // Mock data for the 6 summary count cards
  const summaryCards: SummaryCardProps[] = [
    {
      label: "Total Users",
      value: "12,847",
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      linkTo: "/players",
    },
    {
      label: "Facility Providers",
      value: "304",
      icon: Building2,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      linkTo: "/providers",
    },
    {
      label: "Training Providers",
      value: "850",
      icon: GraduationCap,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      linkTo: "/providers",
    },
    {
      label: "Coaches",
      value: "100",
      icon: UserCheck,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      linkTo: "/providers",
    },
    {
      label: "Games Created",
      value: "2,156",
      icon: Trophy,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      linkTo: "/tournaments",
    },
    {
      label: "Trainings Created",
      value: "1,432",
      icon: Dumbbell,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      linkTo: "/trainings",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {summaryCards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}
