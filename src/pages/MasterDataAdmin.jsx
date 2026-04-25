import DashboardLayout from "../components/layout/DashboardLayout";
import ProjectTab from "../components/master/ProjectTab";
import LocationTab from "../components/master/LocationTab";
import PartTab from "../components/master/PartTab";
import AssetIDTab from "../components/master/AssetIDTab";
import CauseTab from "../components/master/CauseTab";
import SolutionTab from "../components/master/SolutionTab";
import { useState } from "react";

export default function MasterDataAdmin() {
  const menu = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Manajemen Tiket", path: "/admin/tickets" },
    { label: "Manajemen User", path: "/admin/users" },
    { label: "Master Data", path: "/admin/master" },
  ];

  const tabs = ["Project", "Location", "Part", "Asset ID", "Cause", "Solution"];
  const [activeTab, setActiveTab] = useState("Project");

  return (
    <DashboardLayout title="Master Data System" menu={menu}>
      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-semibold mb-6">Master Data</h2>

        {/* Tabs */}
        <div className="flex gap-6 border-b mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Project" && <ProjectTab />}
        {activeTab === "Location" && <LocationTab />}
        {activeTab === "Part" && <PartTab />}
        {activeTab === "Asset ID" && <AssetIDTab />}
        {activeTab === "Cause" && <CauseTab />}
        {activeTab === "Solution" && <SolutionTab />}
      </div>
    </DashboardLayout>
  );
}