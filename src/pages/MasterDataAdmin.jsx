import { useState } from "react";

import DashboardLayout from "../components/layout/DashboardLayout";

import ProjectTab from "../components/master/ProjectTab";
import LocationTab from "../components/master/LocationTab";
import PartTab from "../components/master/PartTab";
import AssetIDTab from "../components/master/AssetIDTab";
import CauseTab from "../components/master/CauseTab";
import SolutionTab from "../components/master/SolutionTab";

import { navigationMenu } from "../constants/navigation";

export default function MasterDataAdmin() {
  const menu = navigationMenu.administrator;

  const tabs = ["Project", "Location", "Part", "Part ID", "Cause", "Solution"];

  const [activeTab, setActiveTab] = useState("Project");

  return (
    <DashboardLayout title="Master Data System" menu={menu}>
      <div
        className="
          w-full
          min-w-0
          bg-white
          rounded-xl
          shadow-sm
          border
          border-gray-100
          p-3
          sm:p-4
          md:p-6
        "
      >
        <div className="mb-5">
          <h2
            className="
              text-xl
              sm:text-2xl
              font-semibold
              text-gray-900
            "
          >
            Master Data
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Kelola data project, lokasi, perangkat, asset, penyebab, dan solusi.
          </p>
        </div>

        <div
          className="
            relative
            mb-6
            border-b
            border-gray-200
          "
        >
          <div
            className="
              flex
              gap-1
              overflow-x-auto
              overflow-y-hidden
              scrollbar-hide
              -mb-px
              pb-px
            "
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`
                    relative
                    shrink-0
                    px-3
                    sm:px-4
                    py-3
                    text-sm
                    font-medium
                    whitespace-nowrap
                    transition-colors

                    ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-800"
                    }
                  `}
                >
                  {tab}

                  {/* ACTIVE INDICATOR */}
                  {isActive && (
                    <span
                      className="
                        absolute
                        left-0
                        right-0
                        bottom-0
                        h-0.5
                        bg-blue-600
                        rounded-full
                      "
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="
              pointer-events-none
              absolute
              top-0
              right-0
              bottom-0
              w-8
              bg-gradient-to-l
              from-white
              to-transparent
              md:hidden
            "
          />
        </div>

        <div className="w-full min-w-0">
          {activeTab === "Project" && <ProjectTab />}

          {activeTab === "Location" && <LocationTab />}

          {activeTab === "Part" && <PartTab />}

          {activeTab === "Part ID" && <AssetIDTab />}

          {activeTab === "Cause" && <CauseTab />}

          {activeTab === "Solution" && <SolutionTab />}
        </div>
      </div>
    </DashboardLayout>
  );
}
