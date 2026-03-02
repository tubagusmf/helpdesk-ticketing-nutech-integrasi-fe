import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";

export default function DashboardAdmin() {
  const menu = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Data Ticket", path: "/admin/tickets" },
    { label: "Manajemen User", path: "/admin/users" },
    { label: "Master Data", path: "/admin/master" },
  ];

  return (
    <DashboardLayout title="Executive Dashboard" menu={menu}>
      
      <div className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <select className="border p-2 rounded">
          <option>Semua Project</option>
        </select>

        <select className="border p-2 rounded">
          <option>Semua Part</option>
        </select>

        <input type="date" className="border p-2 rounded" />
        <input type="date" className="border p-2 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Ticket"
          value="12"
          subtitle="Semua tiket"
          color="text-blue-600"
        />
        <SummaryCard
          title="SLA Breach (Open)"
          value="7"
          subtitle="Melewati batas waktu"
          color="text-red-600"
        />
        <SummaryCard
          title="Ticket Selesai"
          value="5"
          subtitle="Resolved + Closed"
          color="text-green-600"
        />
        <SummaryCard
          title="Rata-rata Solusi"
          value="4103 Jam"
          subtitle="Waktu penanganan"
          color="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow h-64">
          <h3 className="font-semibold mb-4">Status Distribusi</h3>
          <div className="flex items-center justify-center h-full text-gray-400">
            Chart Donut Here
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow h-64">
          <h3 className="font-semibold mb-4">Berdasarkan Prioritas</h3>
          <div className="flex items-center justify-center h-full text-gray-400">
            Chart Bar Here
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow h-64">
          <h3 className="font-semibold mb-4">Volume per Project</h3>
          <div className="flex items-center justify-center h-full text-gray-400">
            Chart Column Here
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}