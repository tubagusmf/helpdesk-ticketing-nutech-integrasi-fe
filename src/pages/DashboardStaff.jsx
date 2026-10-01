import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";
import DashboardFilter from "../components/dashboard/DashboardFilter";
import StatusStackedChart from "../components/dashboard/StatusStackedChart";

import useDashboardFilters from "../hooks/useDashboardFilters";

import {
  getStaffSummary,
} from "../services/dashboardService";

import {
  getCurrentRole,
  getRoleMenu,
} from "../utils/dashboard";

import {
  FiUsers,
} from "react-icons/fi";

export default function DashboardStaff() {
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

  const [data, setData] =
    useState([]);

  const fetchDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getStaffSummary(
            appliedFilters,
          );

        setData(result || []);
      } catch (err) {
        console.error(err);

        setError(
          err?.message ||
            "Gagal mengambil summary Staff.",
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

  const summary = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        acc.total += item.total || 0;
        acc.open += item.open || 0;
        acc.onhold += item.onhold || 0;
        acc.done +=
          (item.resolved || 0) +
          (item.closed || 0);

        return acc;
      },
      {
        total: 0,
        open: 0,
        onhold: 0,
        done: 0,
      },
    );
  }, [data]);

  return (
    <DashboardLayout
      title="Dashboard Staff"
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
            Loading dashboard staff...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Ticket"
                value={summary.total}
                subtitle="Ticket ter-assign ke Staff"
                tone="blue"
                icon={FiUsers}
              />

              <SummaryCard
                title="Ticket Open"
                value={summary.open}
                subtitle="Masih membutuhkan penanganan"
                tone="red"
              />

              <SummaryCard
                title="Ticket Onhold"
                value={summary.onhold}
                subtitle="Sedang ditunda"
                tone="orange"
              />

              <SummaryCard
                title="Resolved & Closed"
                value={summary.done}
                subtitle="Ticket selesai"
                tone="green"
              />
            </div>

            <StatusStackedChart
              title="Distribusi Ticket per Staff"
              subtitle="Jumlah dan status ticket setiap Staff"
              data={data}
              labelKey="staff_name"
              maxItems={10}
            />

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FiUsers size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Detail Ticket per Staff
                    </h3>

                    <p className="text-xs text-gray-400 mt-1">
                      Data ticket berdasarkan assignment Staff
                    </p>
                  </div>
                </div>
              </div>

              {/* DESKTOP */}

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[850px]">
                  <thead>
                    <tr className="border-t border-b bg-gray-50 text-gray-500">
                      <th className="text-left px-5 py-3">
                        Staff
                      </th>

                      <th className="text-right px-4 py-3">
                        Total
                      </th>

                      <th className="text-right px-4 py-3">
                        Open
                      </th>

                      <th className="text-right px-4 py-3">
                        Progress
                      </th>

                      <th className="text-right px-4 py-3">
                        Onhold
                      </th>

                      <th className="text-right px-4 py-3">
                        Resolved
                      </th>

                      <th className="text-right px-5 py-3">
                        Closed
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-10 text-gray-400"
                        >
                          Belum ada data Staff.
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr
                          key={item.staff_id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 font-medium">
                            {item.staff_name}
                          </td>

                          <td className="text-right px-4 font-semibold">
                            {item.total}
                          </td>

                          <td className="text-right px-4 text-red-600">
                            {item.open}
                          </td>

                          <td className="text-right px-4 text-yellow-600">
                            {item.in_progress}
                          </td>

                          <td className="text-right px-4 text-orange-600">
                            {item.onhold}
                          </td>

                          <td className="text-right px-4 text-green-600">
                            {item.resolved}
                          </td>

                          <td className="text-right px-5 text-gray-600">
                            {item.closed}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="md:hidden p-4 space-y-3">
                {data.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    Belum ada data Staff.
                  </div>
                ) : (
                  data.map((item) => (
                    <div
                      key={item.staff_id}
                      className="border border-gray-100 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FiUsers size={16} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {item.staff_name}
                            </p>

                            <p className="text-xs text-gray-400">
                              Total ticket:{" "}
                              {item.total}
                            </p>
                          </div>
                        </div>

                        <span className="text-lg font-bold text-blue-600">
                          {item.total}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <Metric
                          label="Open"
                          value={item.open}
                          className="text-red-600 bg-red-50"
                        />

                        <Metric
                          label="Progress"
                          value={
                            item.in_progress
                          }
                          className="text-yellow-600 bg-yellow-50"
                        />

                        <Metric
                          label="Onhold"
                          value={
                            item.onhold
                          }
                          className="text-orange-600 bg-orange-50"
                        />

                        <Metric
                          label="Resolved"
                          value={
                            item.resolved
                          }
                          className="text-green-600 bg-green-50"
                        />

                        <Metric
                          label="Closed"
                          value={
                            item.closed
                          }
                          className="text-gray-600 bg-gray-50"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function Metric({
  label,
  value,
  className,
}) {
  return (
    <div
      className={`
        rounded-xl
        p-3
        ${className}
      `}
    >
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="text-lg font-bold mt-1">
        {value || 0}
      </p>
    </div>
  );
}