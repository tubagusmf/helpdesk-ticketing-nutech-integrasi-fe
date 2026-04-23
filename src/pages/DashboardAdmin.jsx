import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";
import { useEffect, useState, useMemo } from "react";
import {
  getDashboardSummary,
  getStatusDistribution,
  getPriorityDistribution,
  getVolumePerProject,
} from "../services/dashboardService";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getProjects, getParts } from "../services/ticketService";

export default function DashboardAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const menu = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Manajemen Tiket", path: "/admin/tickets" },
    { label: "Manajemen User", path: "/admin/users" },
    { label: "Master Data", path: "/admin/master" },
  ];

  const [summary, setSummary] = useState({});
  const [statusData, setStatusData] = useState({});
  const [priorityData, setPriorityData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [parts, setParts] = useState([]);
  const [animateBar, setAnimateBar] = useState(false);

  const pieData = useMemo(() => [
    { name: "Open", value: statusData.open || 0 },
    { name: "In Progress", value: statusData.in_progress || 0 },
    { name: "Resolved", value: statusData.resolved || 0 },
    { name: "Closed", value: statusData.closed || 0 },
    { name: "Onhold", value: statusData.onhold || 0 },
  ], [statusData]);

  const [filters, setFilters] = useState({
    project_id: "",
    part_id: "",
    start_date: "",
    end_date: "",
  });
  
  const [appliedFilters, setAppliedFilters] = useState({
    project_id: "",
    part_id: "",
    start_date: "",
    end_date: "",
  });

  const COLORS = [
    "#ef4444", // Open
    "#f59e0b", // In Progress
    "#22c55e", // Resolved
    "#64748b", // Closed
    "#3b82f6", // Onhold
  ];

  useEffect(() => {
    fetchDashboard();
  }, [appliedFilters]);

  useEffect(() => {
    setAnimateBar(false);
  
    const timer = setTimeout(() => {
      setAnimateBar(true);
    }, 100);
  
    return () => clearTimeout(timer);
  }, [priorityData]);

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
        console.error(err);
      }
    };
  
    fetchParts();
  }, [filters.project_id]);
  
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
      setPriorityData(priorityRes);
      setVolumeData(volumeRes);
      setProjects(projectsRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mergedVolumeData = useMemo(() => {
    if (appliedFilters.project_id) {
      return volumeData;
    }
  
    return projects.map((project) => {
      const found = volumeData.find(
        (v) => v.project === project.name
      );
  
      return {
        project: project.name,
        total: found ? found.total : 0,
      };
    });
  }, [projects, volumeData, appliedFilters]);

  const formatHoursToHM = (hours) => {
    if (!hours) return "0j 0m";
  
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
  
    return `${h}j ${m}m`;
  };
  
  return (
    <DashboardLayout title="Executive Dashboard" menu={menu}>
      
      <div className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        {/* PROJECT */}
        <select
          className="border p-2 rounded"
          value={filters.project_id}
          onChange={(e) =>
            setFilters({ ...filters, project_id: e.target.value, part_id: "" })
          }
        >
          <option value="">Semua Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* PART */}
        <select
          className="border p-2 rounded"
          value={filters.part_id}
          onChange={(e) =>
            setFilters({ ...filters, part_id: e.target.value })
          }
        >
          <option value="">Semua Part</option>
          {parts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* START DATE */}
        <input
          type="date"
          className="border p-2 rounded"
          value={filters.start_date}
          onChange={(e) =>
            setFilters({ ...filters, start_date: e.target.value })
          }
        />

        {/* END DATE */}
        <input
          type="date"
          className="border p-2 rounded"
          value={filters.end_date}
          onChange={(e) =>
            setFilters({ ...filters, end_date: e.target.value })
          }
        />

        <button
          onClick={() => {
            setAppliedFilters({ ...filters });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Filter
        </button>

        <button
          onClick={() => {
            const reset = {
              project_id: "",
              part_id: "",
              start_date: "",
              end_date: "",
            };
            setFilters(reset);
            setAppliedFilters(reset);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Ticket"
          value={summary.total_ticket || 0}
          subtitle="Semua tiket"
          color="text-blue-600"
        />

        <SummaryCard
          title="SLA Breach (Open)"
          value={summary.sla_breach || 0}
          subtitle="Melewati batas waktu"
          color="text-red-600"
        />

        <SummaryCard
          title="Ticket Selesai"
          value={summary.ticket_selesai || 0}
          subtitle="Resolved + Closed"
          color="text-green-600"
        />

        <SummaryCard
          title="Rata-rata Solusi"
          value={formatHoursToHM(summary.avg_resolution_time)}
          subtitle="Waktu penanganan"
          color="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow min-h-[320px]">
          <h3 className="font-semibold mb-4">Status Distribusi</h3>

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
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>

            {/* LEGEND */}
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow min-h-[320px]">
          <h3 className="font-semibold mb-4">Berdasarkan Prioritas</h3>

          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {priorityData.map((item, index) => {
              const max = Math.max(...priorityData.map(p => p.total), 1);

              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.priority}</span>
                    <span>{item.total}</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: animateBar
                          ? `${(item.total / max) * 100}%`
                          : "0%",
                        backgroundColor:
                          item.priority === "URGENT"
                            ? "#ef4444"
                            : item.priority === "HIGH"
                            ? "#f97316"
                            : item.priority === "MEDIUM"
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
            <h3 className="font-semibold mb-4">Volume per Project</h3>
            <div className="flex items-center justify-center h-full text-gray-400">
              <BarChart
                width={260}
                height={200}
                data={mergedVolumeData}
                key={JSON.stringify(mergedVolumeData)} // 🔥 penting
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="project" tick={{ fontSize: 10 }} />
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
    </DashboardLayout>
  );
}