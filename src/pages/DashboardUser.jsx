import DashboardLayout from "../components/layout/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";

export default function DashboardUser() {
  const menu = [
    { label: "Dashboard", path: "/user/dashboard" },
    { label: "Data Ticket", path: "/user/tickets" },
  ];

  return (
    <DashboardLayout title="User Dashboard" menu={menu}>
      <div className="grid grid-cols-2 gap-6">
        <SummaryCard
          title="Ticket Saya"
          value="4"
          subtitle="Total tiket dibuat"
          color="text-blue-600"
        />
        <SummaryCard
          title="Open Ticket"
          value="2"
          subtitle="Sedang diproses"
          color="text-yellow-600"
        />
      </div>
    </DashboardLayout>
  );
}