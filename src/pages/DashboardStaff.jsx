import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";
import DashboardFilter from "../components/dashboard/DashboardFilter";
import StatusStackedChart from "../components/dashboard/StatusStackedChart";
import useDashboardFilters from "../hooks/useDashboardFilters";
import { getStaffSummary, getStaffReassignSummary, getStaffOfflineSummary } from "../services/dashboardService";
import { getCurrentRole, getRoleMenu } from "../utils/dashboard";
import { FiActivity, FiClock, FiRefreshCw, FiUsers } from "react-icons/fi";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

// function formatDuration(value) {
//   const totalSeconds = Math.max(
//     0,
//     Math.floor(Number(value) || 0),
//   );

//   const days = Math.floor(totalSeconds / 86400);
//   const hours = Math.floor((totalSeconds % 86400) / 3600);
//   const minutes = Math.floor((totalSeconds % 3600) / 60);
//   const seconds = totalSeconds % 60;

//   if (days > 0) {
//     return hours > 0
//       ? `${days} hari ${hours} jam`
//       : `${days} hari`;
//   }

//   if (hours > 0) {
//     return minutes > 0
//       ? `${hours} jam ${minutes} menit`
//       : `${hours} jam`;
//   }

//   if (minutes > 0) {
//     return seconds > 0
//       ? `${minutes} menit ${seconds} detik`
//       : `${minutes} menit`;
//   }

//   return `${seconds} detik`;
// }

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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

  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState("");
  const [staffData, setStaffData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("month");
  const [chartData, setChartData] = useState([]);
  const [chartError, setChartError] = useState("");
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [reassignData, setReassignData] = useState([]);
  const [offlineData, setOfflineData] = useState([]);

  const fetchDashboard = useCallback(async () => {
    setTicketLoading(true);
    setTicketError("");

    try {
      const result = await getStaffSummary(appliedFilters);

      setStaffData(
        Array.isArray(result) ? result : [],
      );
    } catch (error) {
      console.error(
        "Gagal mengambil dashboard Staff:",
        error,
      );

      setTicketError(
        error?.message ||
          "Gagal mengambil data dashboard Staff.",
      );

      setStaffData([]);
    } finally {
      setTicketLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    if (role) {
      fetchDashboard();
    }
  }, [role, fetchDashboard]);

  useEffect(() => {
    let cancelled = false;

    async function fetchChart() {
      setChartError("");

      try {
        const result = await getStaffSummary({
          ...appliedFilters,
          period: chartPeriod,
        });

        if (!cancelled) {
          setChartData(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        console.error("Gagal mengambil grafik ticket per Staff:", err);

        if (!cancelled) {
          setChartData([]);
          setChartError(
            err?.message || "Gagal mengambil data grafik Staff.",
          );
        }
      }
    }

    if (role) fetchChart();

    return () => {
      cancelled = true;
    };
  }, [role, appliedFilters, chartPeriod]);

  const fetchStaffActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError("");

    try {
      const [reassignResult, offlineResult] =
        await Promise.allSettled([
          getStaffReassignSummary(appliedFilters),
          getStaffOfflineSummary(appliedFilters),
        ]);

      const errors = [];

      /* REASSIGN DATA */

      if (reassignResult.status === "fulfilled") {
        setReassignData(
          Array.isArray(reassignResult.value)
            ? reassignResult.value
            : [],
        );
      } else {
        console.error(
          "Gagal mengambil statistik reassign:",
          reassignResult.reason,
        );

        setReassignData([]);

        errors.push(
          "Gagal mengambil statistik reassign ticket.",
        );
      }

      /* OFFLINE DATA */

      if (offlineResult.status === "fulfilled") {
        setOfflineData(
          Array.isArray(offlineResult.value)
            ? offlineResult.value
            : [],
        );
      } else {
        console.error(
          "Gagal mengambil statistik Offline:",
          offlineResult.reason,
        );

        setOfflineData([]);

        errors.push(
          "Gagal mengambil statistik Offline Staff.",
        );
      }

      setActivityError(errors.join(" "));
    } catch (error) {
      console.error(
        "Gagal mengambil aktivitas Staff:",
        error,
      );

      setActivityError(
        error?.message ||
          "Gagal mengambil aktivitas Staff CCIT.",
      );
    } finally {
      setActivityLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    if (role) {
      fetchStaffActivity();
    }
  }, [role, fetchStaffActivity]);

  const ticketSummary = useMemo(() => {
    return staffData.reduce(
      (summary, item) => {
        summary.total += Number(item.total || 0);
        summary.open += Number(item.open || 0);
        summary.onhold += Number(item.onhold || 0);

        summary.done +=
          Number(item.resolved || 0) +
          Number(item.closed || 0);

        return summary;
      },
      {
        total: 0,
        open: 0,
        onhold: 0,
        done: 0,
      },
    );
  }, [staffData]);

  const rankedReassignData = useMemo(() => {
    return [...reassignData].sort(
      (a, b) =>
        Number(b.reassign_count || 0) -
        Number(a.reassign_count || 0),
    );
  }, [reassignData]);

  const totalReassign = useMemo(() => {
    return reassignData.reduce(
      (total, item) =>
        total + Number(item.reassign_count || 0),
      0,
    );
  }, [reassignData]);

  const topReassignStaff = useMemo(() => {
    return rankedReassignData.find(
      (item) => Number(item.reassign_count || 0) > 0,
    );
  }, [rankedReassignData]);

  const offlineStaffCount = useMemo(() => {
    return offlineData.filter(
      (item) => item.is_online === false,
    ).length;
  }, [offlineData]);

  // const totalOfflineSeconds = useMemo(() => {
  //   return offlineData.reduce(
  //     (total, item) =>
  //       total +
  //       Number(item.total_duration_seconds || 0),
  //     0,
  //   );
  // }, [offlineData]);

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

        {ticketError && (
          <div
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <span>{ticketError}</span>

            <button
              type="button"
              onClick={fetchDashboard}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-red-200 bg-white px-3 py-2 font-medium hover:bg-red-100 sm:self-auto"
            >
              <FiRefreshCw size={15} />
              Coba Lagi
            </button>
          </div>
        )}

        {ticketLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-400">
            Memuat dashboard Staff...
          </div>
        ) : (
          <>
            {/* TICKET SUMMARY CARDS */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Total Ticket"
                value={formatNumber(ticketSummary.total)}
                subtitle="Ticket yang di assign ke Staff lain"
                tone="blue"
                icon={FiUsers}
              />

              <SummaryCard
                title="Ticket Open"
                value={formatNumber(ticketSummary.open)}
                subtitle="Masih membutuhkan penanganan"
                tone="red"
              />

              <SummaryCard
                title="Ticket Onhold"
                value={formatNumber(ticketSummary.onhold)}
                subtitle="Sedang ditunda"
                tone="orange"
              />

              <SummaryCard
                title="Resolved & Closed"
                value={formatNumber(ticketSummary.done)}
                subtitle="Ticket selesai"
                tone="green"
              />
            </div>

            {/* STATUS CHART */}

            {chartError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {chartError}
              </div>
            )}

            <StatusStackedChart
              title="Distribusi Ticket per Staff"
              subtitle="Jumlah dan status ticket setiap Staff"
              data={chartData}
              labelKey="staff_name"
              maxItems={10}
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
            />

            {/* ============================================
                DETAIL TICKET PER STAFF
            ============================================ */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <SectionHeader
                icon={FiUsers}
                title="Detail Ticket per Staff"
                subtitle="Data ticket berdasarkan assignment Staff"
                iconClass="bg-blue-50 text-blue-600"
              />

              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-sm">
                  <thead>
                    <tr className="border-y border-gray-200 bg-gray-50 text-gray-500">
                      <th className="px-5 py-3 text-left">
                        Staff
                      </th>

                      <th className="px-4 py-3 text-right">
                        Total
                      </th>

                      <th className="px-4 py-3 text-right">
                        Open
                      </th>

                      <th className="px-4 py-3 text-right">
                        Progress
                      </th>

                      <th className="px-4 py-3 text-right">
                        Onhold
                      </th>

                      <th className="px-4 py-3 text-right">
                        Resolved
                      </th>

                      <th className="px-5 py-3 text-right">
                        Closed
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {staffData.length === 0 ? (
                      <EmptyTable
                        colSpan={7}
                        message="Belum ada data Staff."
                      />
                    ) : (
                      staffData.map((item) => (
                        <tr
                          key={item.staff_id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 font-medium text-gray-800">
                            {item.staff_name}
                          </td>

                          <td className="px-4 py-4 text-right font-semibold">
                            {formatNumber(item.total)}
                          </td>

                          <td className="px-4 py-4 text-right text-red-600">
                            {formatNumber(item.open)}
                          </td>

                          <td className="px-4 py-4 text-right text-yellow-600">
                            {formatNumber(item.in_progress)}
                          </td>

                          <td className="px-4 py-4 text-right text-orange-600">
                            {formatNumber(item.onhold)}
                          </td>

                          <td className="px-4 py-4 text-right text-green-600">
                            {formatNumber(item.resolved)}
                          </td>

                          <td className="px-5 py-4 text-right text-gray-600">
                            {formatNumber(item.closed)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="space-y-3 p-4 md:hidden">
                {staffData.length === 0 ? (
                  <EmptyState message="Belum ada data Staff." />
                ) : (
                  staffData.map((item) => (
                    <div
                      key={item.staff_id}
                      className="rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <FiUsers size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-800">
                              {item.staff_name}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Total ticket: {formatNumber(item.total)}
                            </p>
                          </div>
                        </div>

                        <span className="text-xl font-bold text-blue-600">
                          {formatNumber(item.total)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Metric
                          label="Open"
                          value={item.open}
                          className="bg-red-50 text-red-600"
                        />

                        <Metric
                          label="Progress"
                          value={item.in_progress}
                          className="bg-yellow-50 text-yellow-600"
                        />

                        <Metric
                          label="Onhold"
                          value={item.onhold}
                          className="bg-orange-50 text-orange-600"
                        />

                        <Metric
                          label="Resolved"
                          value={item.resolved}
                          className="bg-green-50 text-green-600"
                        />

                        <Metric
                          label="Closed"
                          value={item.closed}
                          className="bg-gray-50 text-gray-600"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* ================================================
            ACTIVITY ERROR
        ================================================ */}

        {activityError && (
          <div
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <span>{activityError}</span>

            <button
              type="button"
              onClick={fetchStaffActivity}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-red-200 bg-white px-3 py-2 font-medium hover:bg-red-100 sm:self-auto"
            >
              <FiRefreshCw size={15} />
              Coba Lagi
            </button>
          </div>
        )}

        {/* ================================================
            ACTIVITY SUMMARY CARDS
        ================================================ */}

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Analitik Aktivitas Staff CCIT
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Ringkasan aktivitas reassign ticket dan status Offline.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ActivitySummaryCard
              title="Total Reassign"
              value={
                activityLoading
                  ? "..."
                  : formatNumber(totalReassign)
              }
              subtitle="Sesuai periode filter"
              icon={FiRefreshCw}
              tone="blue"
            />

            <ActivitySummaryCard
              title="Reassign Terbanyak"
              value={
                activityLoading
                  ? "Memuat..."
                  : topReassignStaff?.staff_name || "-"
              }
              subtitle={
                topReassignStaff
                  ? `${formatNumber(topReassignStaff.reassign_count)} kali reassign`
                  : "Belum ada aktivitas reassign"
              }
              icon={FiActivity}
              tone="indigo"
            />

            <ActivitySummaryCard
              title="Staff Offline"
              value={
                activityLoading
                  ? "..."
                  : formatNumber(offlineStaffCount)
              }
              subtitle="Status Offline saat ini"
              icon={FiUsers}
              tone="orange"
            />

            {/* <ActivitySummaryCard
              title="Total Durasi Offline"
              value={
                activityLoading
                  ? "Memuat..."
                  : formatDuration(totalOfflineSeconds)
              }
              subtitle="Akumulasi sesi sesuai periode"
              icon={FiClock}
              tone="green"
            /> */}
          </div>
        </div>

        {/* ================================================
            REASSIGN TICKET PER STAFF
        ================================================ */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader
            icon={FiRefreshCw}
            title="Reassign Ticket per Staff CCIT"
            subtitle="Staff dengan aktivitas reassign terbanyak"
            iconClass="bg-indigo-50 text-indigo-600"
          />

          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50 text-gray-500">
                  <th className="px-5 py-3 text-left">
                    Staff CCIT
                  </th>

                  <th className="px-4 py-3 text-right">
                    Jumlah Reassign
                  </th>

                  <th className="px-5 py-3 text-left">
                    Reassign Terakhir
                  </th>
                </tr>
              </thead>

              <tbody>
                {activityLoading ? (
                  <LoadingTable
                    colSpan={3}
                    message="Memuat statistik reassign..."
                  />
                ) : rankedReassignData.length === 0 ? (
                  <EmptyTable
                    colSpan={3}
                    message="Belum ada data reassign."
                  />
                ) : (
                  rankedReassignData.map((item, index) => (
                    <tr
                      key={item.staff_id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <RankBadge rank={index + 1} />

                          <span className="font-medium text-gray-800">
                            {item.staff_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-indigo-600">
                          {formatNumber(item.reassign_count)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDateTime(item.last_reassigned_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}

          <div className="space-y-3 p-4 md:hidden">
            {activityLoading ? (
              <EmptyState message="Memuat statistik reassign..." />
            ) : rankedReassignData.length === 0 ? (
              <EmptyState message="Belum ada data reassign." />
            ) : (
              rankedReassignData.map((item, index) => (
                <div
                  key={item.staff_id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-start gap-3">
                    <RankBadge rank={index + 1} />

                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-gray-800">
                        {item.staff_name}
                      </p>

                      <p className="mt-1 text-sm text-indigo-600">
                        {formatNumber(item.reassign_count)} kali reassign
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        Terakhir: {formatDateTime(item.last_reassigned_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ================================================
            OFFLINE ACTIVITY PER STAFF
        ================================================ */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader
            icon={FiClock}
            title="Aktivitas Status Staff CCIT"
            subtitle="Menampilkan status Offline/ Online setiap Staff"
            iconClass="bg-orange-50 text-orange-600"
          />

          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50 text-gray-500">
                  <th className="px-5 py-3 text-left">
                    Staff CCIT
                  </th>

                  <th className="px-4 py-3 text-left">
                    Code Name
                  </th>

                  <th className="px-4 py-3 text-left">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left">
                    Terakhir Aktif
                  </th>
                </tr>
              </thead>

              <tbody>
                {activityLoading ? (
                  <LoadingTable
                    colSpan={4}
                    message="Memuat status Staff CCIT..."
                  />
                ) : offlineData.length === 0 ? (
                  <EmptyTable
                    colSpan={4}
                    message="Belum ada data Staff CCIT."
                  />
                ) : (
                  offlineData.map((item) => (
                    <tr
                      key={item.staff_id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-medium text-gray-800">
                        {item.staff_name}
                      </td>

                      <td className="px-4 py-4 font-medium text-orange-600">
                        {item.code_name || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <OnlineBadge
                          isOnline={item.is_online}
                        />
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDateTime(item.last_seen)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="space-y-3 p-4 md:hidden">
            {activityLoading ? (
              <EmptyState message="Memuat status Staff CCIT..." />
            ) : offlineData.length === 0 ? (
              <EmptyState message="Belum ada data Staff CCIT." />
            ) : (
              offlineData.map((item) => (
                <div
                  key={item.staff_id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-gray-800">
                        {item.staff_name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Code Name
                      </p>

                      <p className="mt-1 font-medium text-orange-600">
                        {item.code_name || "-"}
                      </p>
                    </div>

                    <OnlineBadge
                      isOnline={item.is_online}
                    />
                  </div>

                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500">
                      Terakhir Aktif
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {formatDateTime(item.last_seen)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  iconClass = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="flex items-start gap-3 p-4 sm:p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <h3 className="font-semibold text-gray-800">
          {title}
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ActivitySummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "blue",
}) {
  const tones = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      value: "text-blue-600",
    },
    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      value: "text-indigo-600",
    },
    orange: {
      icon: "bg-orange-50 text-orange-600",
      value: "text-orange-600",
    },
    green: {
      icon: "bg-green-50 text-green-600",
      value: "text-green-600",
    },
  };

  const selectedTone = tones[tone] || tones.blue;

  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedTone.icon}`}
        >
          <Icon size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-bold ${selectedTone.value}`}
          >
            {value}
          </p>

          <p className="mt-2 break-words text-xs text-gray-400">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const highlighted = rank <= 3;

  return (
    <span
      className={
        highlighted
          ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600"
          : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500"
      }
    >
      {rank}
    </span>
  );
}

function OnlineBadge({ isOnline }) {
  return (
    <span
      className={
        isOnline
          ? "inline-flex whitespace-nowrap rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
          : "inline-flex whitespace-nowrap rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
      }
    >
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="py-8 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}

function EmptyTable({ colSpan, message }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-10 text-center text-gray-400"
      >
        {message}
      </td>
    </tr>
  );
}

function LoadingTable({ colSpan, message }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-10 text-center text-gray-400"
      >
        {message}
      </td>
    </tr>
  );
}

function Metric({
  label,
  value,
  className = "bg-gray-50 text-gray-700",
}) {
  return (
    <div className={`min-w-0 rounded-xl p-3 ${className}`}>
      <p className="text-xs opacity-80">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold">
        {value ?? 0}
      </p>
    </div>
  );
}