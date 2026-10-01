import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";
import DashboardFilter from "../components/dashboard/DashboardFilter";
import StatusDistributionCard from "../components/dashboard/StatusDistributionCard";
import TrendChartCard from "../components/dashboard/TrendChartCard";
import PriorityDistributionCard from "../components/dashboard/PriorityDistributionCard";
import TicketListCard from "../components/dashboard/TicketListCard";
import RankingCard from "../components/dashboard/RankingCard";

import { FiLayers } from "react-icons/fi";

import {
  getDashboardSummary,
  getStatusDistribution,
  getPriorityDistribution,
  getVolumePerProject,
  getDashboardProjects,
  getIncidentTrend,
  getOpenTickets,
  getOnHoldTickets,
} from "../services/dashboardService";

import useDashboardFilters from "../hooks/useDashboardFilters";

import {
  getCurrentRole,
  getRoleMenu,
} from "../utils/dashboard";

export default function DashboardTicket() {
  const role = useMemo(
    () => getCurrentRole(),
    [],
  );

  const menu = useMemo(
    () => getRoleMenu(role),
    [role],
  );

  const {
    filters,
    appliedFilters,
    projects,
    parts,
    handleFilterChange,
    handleFilter,
    handleReset,
  } = useDashboardFilters();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [summary, setSummary] =
    useState({});

  const [statusData, setStatusData] =
    useState({});

  const [priorityData, setPriorityData] =
    useState([]);

  const [volumeData, setVolumeData] =
    useState([]);

  const [trendData, setTrendData] =
    useState([]);

  const [openTickets, setOpenTickets] =
    useState([]);

  const [onholdTickets, setOnholdTickets] =
    useState([]);

  const fetchDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          summaryRes,
          statusRes,
          priorityRes,
          volumeRes,
          trendRes,
          openRes,
          onholdRes,
        ] = await Promise.all([
          getDashboardSummary(
            appliedFilters,
          ),
          getStatusDistribution(
            appliedFilters,
          ),
          getPriorityDistribution(
            appliedFilters,
          ),
          getVolumePerProject(
            appliedFilters,
          ),
          getIncidentTrend(
            appliedFilters,
          ),
          getOpenTickets(
            appliedFilters,
          ),
          getOnHoldTickets(
            appliedFilters,
          ),
        ]);

        setSummary(summaryRes || {});
        setStatusData(statusRes || {});
        setPriorityData(
          priorityRes || [],
        );
        setVolumeData(
          volumeRes || [],
        );
        setTrendData(
          trendRes || [],
        );
        setOpenTickets(
          openRes || [],
        );
        setOnholdTickets(
          onholdRes || [],
        );
      } catch (err) {
        console.error(err);

        setError(
          err?.message ||
            "Gagal mengambil data ticket.",
        );
      } finally {
        setLoading(false);
      }
    }, [appliedFilters]);

  useEffect(() => {
    if (role) {
      fetchDashboard();
    }
  }, [role, fetchDashboard]);

  return (
    <DashboardLayout
      title="Dashboard Ticket"
      menu={menu}
    >
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
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white border rounded-2xl p-10 text-center text-gray-400">
            Loading dashboard ticket...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Ticket"
                value={
                  summary.total_ticket ||
                  0
                }
                subtitle="Semua ticket"
                tone="blue"
              />

              <SummaryCard
                title="Ticket Open"
                value={
                  summary.ticket_open ||
                  0
                }
                subtitle="Masih open"
                tone="red"
              />

              <SummaryCard
                title="Ticket Onhold"
                value={
                  summary.ticket_onhold ||
                  0
                }
                subtitle="Sedang ditunda"
                tone="orange"
              />

              <SummaryCard
                title="Resolved & Closed"
                value={
                  (summary.ticket_resolved ||
                    0) +
                  (summary.ticket_closed ||
                    0)
                }
                subtitle="Ticket selesai"
                tone="green"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <StatusDistributionCard
                statusData={statusData}
              />

              <PriorityDistributionCard
                data={priorityData}
              />
            </div>

            <RankingCard
              title="Volume Ticket per Project"
              subtitle="Project dengan ticket terbanyak"
              icon={FiLayers}
              data={volumeData.slice(
                0,
                10,
              )}
              labelKey="project"
              tone="blue"
            />

            <TrendChartCard
              data={trendData}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <TicketListCard
                title="Ticket Open"
                subtitle="5 ticket terbaru yang masih open"
                total={
                  summary.ticket_open ||
                  0
                }
                data={openTickets}
                tone="red"
              />

              <TicketListCard
                title="Ticket Onhold"
                subtitle="5 ticket terbaru yang sedang ditunda"
                total={
                  summary.ticket_onhold ||
                  0
                }
                data={onholdTickets}
                tone="orange"
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}