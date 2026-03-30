import { useState } from "react";
import { AdminTrainingPage } from "../trainings/AdminTrainingPage";
import { AdminFacilityPage } from "../facilities/AdminFacilityPage";
import { EntityStats } from "./EntityStats";
import { Building, Dumbbell } from "lucide-react";

type Tab = "facilities" | "trainings";

export function EntityManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("facilities");

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Entity Management</h1>
        <p className="text-gray-500 mt-1">Unified management for all platform facilities and training programs.</p>
      </div>

      {/* Quick Stats Bar */}
      <EntityStats />

      {/* Large Tab Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        <button
          onClick={() => setActiveTab("facilities")}
          className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-5 group ${
            activeTab === "facilities"
              ? "bg-[#003B95] border-[#003B95] text-white shadow-md transform scale-[1.01]"
              : "bg-white border-[#003B95] text-gray-600 hover:shadow-sm"
          }`}
        >
          <div className={`p-4 rounded-lg ${activeTab === "facilities" ? "bg-white/10" : "bg-blue-50 group-hover:bg-blue-100"}`}>
            <Building className={`w-8 h-8 ${activeTab === "facilities" ? "text-white" : "text-[#003B95]"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-lg font-bold ${activeTab === "facilities" ? "text-white" : "text-gray-900"}`}>Facilities</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeTab === "facilities" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
              }`}>156 total</span>
            </div>
            <p className={`text-sm ${activeTab === "facilities" ? "text-blue-100" : "text-gray-500"}`}>
              Manage sports facilities, courts, and physical locations.
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("trainings")}
          className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-5 group ${
            activeTab === "trainings"
              ? "bg-[#003B95] border-[#003B95] text-white shadow-md transform scale-[1.01]"
              : "bg-white border-[#003B95] text-gray-600 hover:shadow-sm"
          }`}
        >
          <div className={`p-4 rounded-lg ${activeTab === "trainings" ? "bg-white/10" : "bg-blue-50 group-hover:bg-blue-100"}`}>
            <Dumbbell className={`w-8 h-8 ${activeTab === "trainings" ? "text-white" : "text-[#003B95]"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-lg font-bold ${activeTab === "trainings" ? "text-white" : "text-gray-900"}`}>Trainings</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeTab === "trainings" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
              }`}>89 total</span>
            </div>
            <p className={`text-sm ${activeTab === "trainings" ? "text-blue-100" : "text-gray-500"}`}>
              Manage training programs, coaching sessions, and classes.
            </p>
          </div>
        </button>
      </div>

      {/* Dynamic Content Loader */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
        {activeTab === "facilities" ? (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-gray-400" />
              Facilities Management
            </h2>
            <AdminFacilityPage />
          </div>
        ) : (
          <div className="animate-fade-in">
             <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-gray-400" />
              Trainings Management
            </h2>
            <AdminTrainingPage hideHeader={true} />
          </div>
        )}
      </div>
    </div>
  );
}
