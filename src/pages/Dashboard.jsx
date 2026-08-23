import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";
import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { dashboardConfig } from "../constants/dashboard";

import {
  getDashboardSummary,
  getStatusDistribution,
  getPriorityDistribution,
  getVolumePerProject,
} from "../services/dashboardService";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { getProjects, getParts } from "../services/ticketService";

const EMPTY_FILTERS = {
  project_id: "",
  part_id: "",
  start_date: "",
  end_date: "",
};

const COLORS = [
  "#ef4444", // Open
  "#f59e0b", // In Progress
  "#22c55e", // Resolved
  "#64748b", // Closed
  "#3b82f6", // Onhold
];

export default function Dashboard() {
  // =========================================================
  // AUTH / ROLE
  // =========================================================

  const token = localStorage.getItem("token");

  const currentUser = useMemo(() => {
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("Invalid token:", error);
      return null;
    }
  }, [token]);

  const role = currentUser?.role;
  const config = dashboardConfig[role];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({});
  const [statusData, setStatusData] = useState({});
  const [priorityData, setPriorityData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);

  const [projects, setProjects] = useState([]);
  const [parts, setParts] = useState([]);

  const [animateBar, setAnimateBar] = useState(false);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState(EMPTY_FILTERS);

  const pieData = useMemo(
    () => [
      {
        name: "Open",
        value: statusData.open || 0,
      },
      {
        name: "In Progress",
        value: statusData.in_progress || 0,
      },
      {
        name: "Resolved",
        value: statusData.resolved || 0,
      },
      {
        name: "Closed",
        value: statusData.closed || 0,
      },
      {
        name: "Onhold",
        value: statusData.onhold || 0,
      },
    ],
    [statusData]
  );

  const mergedVolumeData = useMemo(() => {
    if (appliedFilters.project_id) {
      return volumeData;
    }

    return projects.map((project) => {
      const found = volumeData.find(
        (item) => item.project === project.name
      );

      return {
        project: project.name,
        total: found ? found.total : 0,
      };
    });
  }, [
    projects,
    volumeData,
    appliedFilters.project_id,
  ]);

  useEffect(() => {
    if (!role) return;

    fetchDashboard();
  }, [appliedFilters, role]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      setStatusData({});
      setPriorityData([]);
      setVolumeData([]);

      const [
        summaryRes,
        statusRes,
        priorityRes,
        volumeRes,
        projectsRes,
      ] = await Promise.all([
        getDashboardSummary(appliedFilters),
        getStatusDistribution(appliedFilters),
        getPriorityDistribution(appliedFilters),
        getVolumePerProject(appliedFilters),
        getProjects(),
      ]);

      setSummary(summaryRes);
      setStatusData(statusRes);
      setPriorityData(priorityRes || []);
      setVolumeData(volumeRes || []);
      setProjects(projectsRes.data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!filters.project_id) {
      setParts([]);
      return;
    }

    const fetchParts = async () => {
      try {
        const res = await getParts(filters.project_id);

        setParts(res.data || []);
      } catch (err) {
        console.error("Get parts error:", err);
        setParts([]);
      }
    };

    fetchParts();
  }, [filters.project_id]);

  useEffect(() => {
    setAnimateBar(false);

    const timer = setTimeout(() => {
      setAnimateBar(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [priorityData]);

  const formatHoursToHM = (hours) => {
    if (!hours) {
      return "0j 0m";
    }

    const totalMinutes = Math.floor(hours * 60);

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    return `${h}j ${m}m`;
  };

  const handleFilter = () => {
    setAppliedFilters({
      ...filters,
    });
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const summaryConfig = {
    ADMINISTRATOR: [
      {
        title: "Total Ticket",
        value: summary.total_ticket || 0,
        subtitle: "Semua tiket",
        color: "text-blue-600",
      },

      {
        title: "SLA Breach (Open)",
        value: summary.sla_breach || 0,
        subtitle: "Melewati batas waktu",
        color: "text-red-600",
      },

      {
        title: "Ticket Selesai",
        value: summary.ticket_selesai || 0,
        subtitle: "Resolved + Closed",
        color: "text-green-600",
      },

      {
        title: "Rata-rata Solusi",
        value: formatHoursToHM(
          summary.avg_resolution_time
        ),
        subtitle: "Waktu penanganan",
        color: "text-purple-600",
      },
    ],

    STAFF: [
      {
        title: "Assigned Ticket",
        value: summary.total_ticket || 0,
        color: "text-blue-600",
      },

      {
        title: "Open",
        value: statusData.open || 0,
        color: "text-red-600",
      },

      {
        title: "In Progress",
        value: statusData.in_progress || 0,
        color: "text-yellow-600",
      },

      {
        title: "Resolved",
        value:
          (statusData.resolved || 0) +
          (statusData.closed || 0),
        color: "text-green-600",
      },
    ],

    USER: [
      {
        title: "Assigned Ticket",
        value: summary.total_ticket || 0,
        color: "text-blue-600",
      },

      {
        title: "Open",
        value: statusData.open || 0,
        color: "text-red-600",
      },

      {
        title: "In Progress",
        value: statusData.in_progress || 0,
        color: "text-yellow-600",
      },

      {
        title: "Resolved",
        value:
          (statusData.resolved || 0) +
          (statusData.closed || 0),
        color: "text-green-600",
      },
    ],
  };

  if (!config) {
    return (
      <div className="p-6 text-red-600">
        Role user tidak dikenali.
      </div>
    );
  }

  return (
    <DashboardLayout
      title={config.title}
      menu={config.menu}
    >

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        {/* PROJECT */}

        <select
          className="border p-2 rounded"
          value={filters.project_id}
          onChange={(e) =>
            setFilters({
              ...filters,
              project_id: e.target.value,
              part_id: "",
            })
          }
        >
          <option value="">Semua Project</option>

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>

        {/* PART */}

        <select
          className="border p-2 rounded"
          value={filters.part_id}
          onChange={(e) =>
            setFilters({
              ...filters,
              part_id: e.target.value,
            })
          }
        >
          <option value="">Semua Part</option>

          {parts.map((part) => (
            <option
              key={part.id}
              value={part.id}
            >
              {part.name}
            </option>
          ))}
        </select>

        {/* START DATE */}

        <input
          type="date"
          className="border p-2 rounded"
          value={filters.start_date}
          onChange={(e) =>
            setFilters({
              ...filters,
              start_date: e.target.value,
            })
          }
        />

        {/* END DATE */}

        <input
          type="date"
          className="border p-2 rounded"
          value={filters.end_date}
          onChange={(e) =>
            setFilters({
              ...filters,
              end_date: e.target.value,
            })
          }
        />

        {/* FILTER */}

        <button
          onClick={handleFilter}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Filter
        </button>

        {/* RESET */}

        <button
          onClick={handleReset}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow p-6 mb-6 text-center text-gray-500">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {summaryConfig[role]?.map(
              (item, index) => (
                <SummaryCard
                  key={index}
                  title={item.title}
                  value={item.value}
                  subtitle={item.subtitle}
                  color={item.color}
                />
              )
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow min-h-[320px]">
              <h3 className="font-semibold mb-4">
                Status Distribusi
              </h3>

              <div className="flex flex-col items-center">
                <PieChart
                  width={200}
                  height={200}
                  key={JSON.stringify(pieData)}
                >
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[
                            index % COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>

                <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs">
                  {pieData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[
                              index % COLORS.length
                            ],
                        }}
                      />

                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow min-h-[320px]">
              <h3 className="font-semibold mb-4">
                Berdasarkan Prioritas
              </h3>

              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {priorityData.map((item, index) => {
                  const max = Math.max(
                    ...priorityData.map(
                      (priority) => priority.total
                    ),
                    1
                  );

                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">
                          {item.priority}
                        </span>

                        <span>{item.total}</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: animateBar
                              ? `${
                                  (item.total / max) *
                                  100
                                }%`
                              : "0%",

                            backgroundColor:
                              item.priority ===
                              "URGENT"
                                ? "#ef4444"
                                : item.priority ===
                                  "HIGH"
                                ? "#f97316"
                                : item.priority ===
                                  "MEDIUM"
                                ? "#3b82f6"
                                : "#10b981",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow min-h-[320px]">
              <h3 className="font-semibold mb-4">
                Volume per Project
              </h3>

              <div className="flex items-center justify-center h-full text-gray-400">
                <BarChart
                  width={260}
                  height={200}
                  data={mergedVolumeData}
                  key={JSON.stringify(
                    mergedVolumeData
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="project"
                    tick={{ fontSize: 10 }}
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="total"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}