import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiAlertTriangle,
  FiClock,
  FiLayers,
  FiMapPin,
} from "react-icons/fi";

import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";
import DashboardFilter from "../components/dashboard/DashboardFilter";
import StatusDistributionCard from "../components/dashboard/StatusDistributionCard";
import TrendChartCard from "../components/dashboard/TrendChartCard";
import RankingCard from "../components/dashboard/RankingCard";

import {
  getDashboardSummary,
  getStatusDistribution,
  getTopProjects,
  getTopLocations,
  getIncidentTrend,
} from "../services/dashboardService";
import useDashboardFilters from "../hooks/useDashboardFilters";
import {
  getCurrentRole,
  getRoleMenu,
  formatHoursToHM,
} from "../utils/dashboard";

export default function Dashboard() {
  const role = useMemo(() => getCurrentRole(), []);
  const menu = useMemo(() => getRoleMenu(role), [role]);

  const {
    filters,
    appliedFilters,
    projects,
    parts,
    handleFilterChange,
    handleFilter,
    handleReset,
  } = useDashboardFilters();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({});
  const [statusData, setStatusData] = useState({});
  const [topProjects, setTopProjects] = useState([]);
  const [topLocations, setTopLocations] = useState([]);
  const [incidentTrend, setIncidentTrend] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState("month");
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryRes, statusRes, projectRes, locationRes] =
        await Promise.all([
          getDashboardSummary(appliedFilters),
          getStatusDistribution(appliedFilters),
          getTopProjects(appliedFilters),
          getTopLocations(appliedFilters),
        ]);

      setSummary(summaryRes || {});
      setStatusData(statusRes || {});
      setTopProjects(Array.isArray(projectRes) ? projectRes : []);
      setTopLocations(Array.isArray(locationRes) ? locationRes : []);
    } catch (err) {
      console.error("Gagal mengambil data dashboard:", err);
      setError(err?.message || "Gagal mengambil data dashboard.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    if (role) fetchDashboard();
  }, [role, fetchDashboard]);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrend() {
      setTrendLoading(true);
      setTrendError("");

      try {
        const result = await getIncidentTrend({
          ...appliedFilters,
          period: trendPeriod,
        });

        if (!cancelled) {
          setIncidentTrend(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        console.error("Gagal mengambil tren insiden:", err);

        if (!cancelled) {
          setTrendError(err?.message || "Gagal mengambil tren insiden.");
          setIncidentTrend([]);
        }
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    }

    if (role) fetchTrend();

    return () => {
      cancelled = true;
    };
  }, [role, appliedFilters, trendPeriod]);

  if (!role) {
    return <div className="p-6 text-red-600">Session user tidak ditemukan.</div>;
  }

  return (
    <DashboardLayout title="Dashboard Summary" menu={menu}>
      <div className="space-y-5 sm:space-y-6">
        <DashboardFilter
          filters={filters}
          projects={projects}
          parts={parts}
          onChange={handleFilterChange}
          onFilter={handleFilter}
          onReset={handleReset}
        />

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-400">
            Memuat dashboard...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                title="Total Ticket"
                value={summary.total_ticket || 0}
                subtitle="Semua ticket"
                tone="blue"
              />
              <SummaryCard
                title="Ticket Open"
                value={summary.ticket_open || 0}
                subtitle="Masih membutuhkan penanganan"
                tone="red"
              />
              <SummaryCard
                title="Ticket Onhold"
                value={summary.ticket_onhold || 0}
                subtitle="Ticket yang sedang ditunda"
                tone="orange"
              />
              <SummaryCard
                title="Resolved & Closed"
                value={(summary.ticket_resolved || 0) + (summary.ticket_closed || 0)}
                subtitle="Ticket selesai"
                tone="green"
              />
              <SummaryCard
                title="Ticket Cancel"
                value={summary.ticket_cancel || 0}
                subtitle="Ticket dibatalkan"
                tone="red"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SecondaryMetricCard
                icon={FiAlertTriangle}
                iconClass="bg-red-50 text-red-600"
                title="SLA Breach"
                value={summary.sla_breach || 0}
                description="Open melewati SLA"
              />
              <SecondaryMetricCard
                icon={FiClock}
                iconClass="bg-purple-50 text-purple-600"
                title="Rata-rata Resolusi"
                value={formatHoursToHM(summary.avg_resolution_time)}
                description="Waktu penanganan"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <StatusDistributionCard statusData={statusData} />
              <div className="min-w-0 space-y-2">
                {trendError && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {trendError}
                  </div>
                )}
                {trendLoading && (
                  <p className="px-1 text-xs text-gray-400">Memuat tren insiden...</p>
                )}
                <TrendChartCard
                  data={incidentTrend}
                  period={trendPeriod}
                  onPeriodChange={setTrendPeriod}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <RankingCard
                title="Project Ticket Terbanyak"
                subtitle="5 project dengan ticket terbanyak"
                icon={FiLayers}
                data={topProjects}
                labelKey="project"
                tone="blue"
              />
              <RankingCard
                title="Lokasi Ticket Terbanyak"
                subtitle="5 lokasi dengan ticket terbanyak"
                icon={FiMapPin}
                data={topLocations}
                labelKey="location"
                tone="orange"
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function SecondaryMetricCard({
  icon: Icon,
  iconClass,
  title,
  value,
  description,
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={19} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400">{title}</p>
          <p className="mt-1 break-words text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
      <span className="text-right text-xs text-gray-400">{description}</span>
    </div>
  );
}
