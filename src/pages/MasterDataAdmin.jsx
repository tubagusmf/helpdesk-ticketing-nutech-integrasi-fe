import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProjectTab from "../components/master/ProjectTab";
import LocationTab from "../components/master/LocationTab";
import PartTab from "../components/master/PartTab";
import AssetIDTab from "../components/master/AssetIDTab";
import PartCategoryTab from "../components/master/PartCategoryTab";
import ProblemTab from "../components/master/ProblemTab";
import CauseTab from "../components/master/CauseTab";
import SolutionTab from "../components/master/SolutionTab";
import { navigationMenu } from "../constants/navigation";

export default function MasterDataAdmin() {
  const menu = navigationMenu.administrator;

  const tabs = [
    "Project",
    "Location",
    "Part",
    "Part ID",
    "Kategori Part",
    "Permasalahan",
    "Cause",
    "Solution",
  ];

  const [activeTab, setActiveTab] = useState("Project");

  return (
    <DashboardLayout
      title="Master Data System"
      menu={menu}
    >
      <div
        className="
          w-full min-w-0
          rounded-xl border border-gray-100
          bg-white shadow-sm
          p-3 sm:p-4 md:p-6
        "
      >
        {/* HEADER */}

        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Master Data
          </h2>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Kelola data project, lokasi, perangkat,
            asset, kategori part, permasalahan,
            penyebab, dan solusi.
          </p>
        </div>

        {/* TABS */}

        <div className="relative mb-6 border-b border-gray-200">

          <div
            className="
              -mb-px flex gap-1
              overflow-x-auto overflow-y-hidden
              scrollbar-hide pb-px
            "
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  className={`
                    relative shrink-0
                    whitespace-nowrap
                    px-3 py-3
                    text-sm font-medium
                    transition-colors
                    sm:px-4
                    ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-800"
                    }
                  `}
                >
                  {tab}

                  {isActive && (
                    <span
                      className="
                        absolute bottom-0
                        left-0 right-0
                        h-0.5 rounded-full
                        bg-blue-600
                      "
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* MOBILE SCROLL INDICATOR */}

          <div
            className="
              pointer-events-none absolute
              right-0 top-0 bottom-0
              w-8
              bg-gradient-to-l
              from-white to-transparent
              md:hidden
            "
          />

        </div>

        {/* TAB CONTENT */}

        <div className="w-full min-w-0">

          {activeTab === "Project" && (
            <ProjectTab />
          )}

          {activeTab === "Location" && (
            <LocationTab />
          )}

          {activeTab === "Part" && (
            <PartTab />
          )}

          {activeTab === "Part ID" && (
            <AssetIDTab />
          )}

          {activeTab === "Kategori Part" && (
            <PartCategoryTab />
          )}

          {activeTab === "Permasalahan" && (
            <ProblemTab />
          )}

          {activeTab === "Cause" && (
            <CauseTab />
          )}

          {activeTab === "Solution" && (
            <SolutionTab />
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
