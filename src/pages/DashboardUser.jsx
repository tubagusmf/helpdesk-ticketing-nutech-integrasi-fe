import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";
import { useEffect, useState, useMemo } from "react";
import {
  getDashboardSummary,
  getStatusDistribution,
  getPriorityDistribution,
  getVolumePerProject,
} from "../services/dashboardService";

import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

import { getProjects, getParts } from "../services/ticketService";

export default function DashboardUser() {

  const menu = [
    { label: "Dashboard", path: "/user/dashboard" },
    { label: "Manajemen Tiket", path: "/user/tickets" },
  ];

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [statusData, setStatusData] = useState({});
  const [priorityData, setPriorityData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);

  const [projects, setProjects] = useState([]);
  const [parts, setParts] = useState([]);
  const [animateBar, setAnimateBar] = useState(false);

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
    "#ef4444",
    "#f59e0b",
    "#22c55e",
    "#64748b",
    "#3b82f6",
  ];

  const pieData = useMemo(() => [
    { name: "Open", value: statusData.open || 0 },
    { name: "In Progress", value: statusData.in_progress || 0 },
    { name: "Resolved", value: statusData.resolved || 0 },
    { name: "Closed", value: statusData.closed || 0 },
    { name: "Onhold", value: statusData.onhold || 0 },
  ], [statusData]);

  const mergedVolumeData = useMemo(() => {
    if (appliedFilters.project_id) return volumeData;

    return projects.map((project) => {
      const found = volumeData.find(v => v.project === project.name);
      return {
        project: project.name,
        total: found ? found.total : 0,
      };
    });
  }, [projects, volumeData, appliedFilters]);

  useEffect(() => {
    getProjects()
      .then(res => setProjects(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!filters.project_id) {
      setParts([]);
      return;
    }

    getParts(filters.project_id)
      .then(res => setParts(res.data || []))
      .catch(console.error);
  }, [filters.project_id]);

  useEffect(() => {
    fetchDashboard();
  }, [appliedFilters]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [
        summaryRes,
        statusRes,
        priorityRes,
        volumeRes,
      ] = await Promise.all([
        getDashboardSummary(appliedFilters),
        getStatusDistribution(appliedFilters),
        getPriorityDistribution(appliedFilters),
        getVolumePerProject(appliedFilters),
      ]);

      setSummary(summaryRes);
      setStatusData(statusRes);
      setPriorityData(priorityRes);
      setVolumeData(volumeRes);

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAnimateBar(false);
    const t = setTimeout(() => setAnimateBar(true), 100);
    return () => clearTimeout(t);
  }, [priorityData]);

  const formatHoursToHM = (hours) => {
    if (!hours) return "0j 0m";
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}j ${m}m`;
  };

  return (
    <DashboardLayout title="User Dashboard" menu={menu}>

      <div className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        <select
          className="border p-2 rounded"
          value={filters.project_id}
          onChange={(e) =>
            setFilters({ ...filters, project_id: e.target.value, part_id: "" })
          }
        >
          <option value="">Semua Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={filters.part_id}
          onChange={(e) =>
            setFilters({ ...filters, part_id: e.target.value })
          }
        >
          <option value="">Semua Part</option>
          {parts.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <input type="date" className="border p-2 rounded"
          value={filters.start_date}
          onChange={(e) =>
            setFilters({ ...filters, start_date: e.target.value })
          }
        />

        <input type="date" className="border p-2 rounded"
          value={filters.end_date}
          onChange={(e) =>
            setFilters({ ...filters, end_date: e.target.value })
          }
        />

        <button
          onClick={() => setAppliedFilters({ ...filters })}
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
        <SummaryCard title="Assigned Ticket" color="text-blue-600" value={summary.total_ticket || 0} />
        <SummaryCard title="Open" color="text-red-600" value={statusData.open || 0} />
        <SummaryCard title="In Progress" color="text-yellow-600" value={statusData.in_progress || 0} />
        <SummaryCard title="Resolved" color="text-green-600"
          value={(statusData.resolved || 0) + (statusData.closed || 0)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow min-h-[320px]">
          <h3 className="font-semibold mb-4">Status Distribusi</h3>

          <div className="flex flex-col items-center">
            <PieChart width={200} height={200}>
              <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>

            <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
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
            {priorityData.map((item, i) => {
              const max = Math.max(...priorityData.map(p => p.total), 1);

              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.priority}</span>
                    <span>{item.total}</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
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

          <BarChart width={260} height={200} data={mergedVolumeData}>
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
            />
          </BarChart>
        </div>

      </div>
    </DashboardLayout>
  );
}