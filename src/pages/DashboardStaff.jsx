import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";

export default function DashboardStaff() {
  const menu = [
    { label: "Dashboard", path: "/staff/dashboard" },
    { label: "Manajemen Tiket", path: "/staff/tickets" },
  ];

  return (
    <DashboardLayout title="Staff Dashboard" menu={menu}>
      <div className="grid grid-cols-3 gap-6">
        <SummaryCard
          title="Assigned Ticket"
          value="8"
          subtitle="Tiket ditugaskan"
          color="text-blue-600"
        />
        <SummaryCard
          title="Open Ticket"
          value="3"
          subtitle="Belum selesai"
          color="text-yellow-600"
        />
        <SummaryCard
          title="Resolved"
          value="5"
          subtitle="Sudah selesai"
          color="text-green-600"
        />
      </div>
    </DashboardLayout>
  );
}