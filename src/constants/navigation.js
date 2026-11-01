import { FiGrid, FiFileText, FiUsers, FiDatabase, FiDownload, FiSettings } from "react-icons/fi";

const createDashboardMenu = (basePath) => ({
  label: "Dashboard",
  path: `${basePath}/dashboard`,
  icon: FiGrid,
  children: [
    { label: "Dashboard Summary", path: `${basePath}/dashboard` },
    { label: "Dashboard Ticket", path: `${basePath}/dashboard/ticket` },
    { label: "Dashboard Project", path: `${basePath}/dashboard/project` },
    { label: "Dashboard Staff", path: `${basePath}/dashboard/staff` },
  ],
});

const createCustomExportMenu = (basePath) => ({
  label: "Export Custom",
  path: `${basePath}/export-custom`,
  icon: FiDownload,
});

export const navigationMenu = {
  administrator: [
    createDashboardMenu("/admin"),
    { label: "Manajemen Tiket", path: "/admin/tickets", icon: FiFileText },
    createCustomExportMenu("/admin"),
    { label: "Manajemen User", path: "/admin/users", icon: FiUsers },
    { label: "Master Data", path: "/admin/master", icon: FiDatabase },
    { label: "Pengaturan Aplikasi", path: "/admin/settings", icon: FiSettings },
  ],
  staff: [
    createDashboardMenu("/staff"),
    { label: "Manajemen Tiket", path: "/staff/tickets", icon: FiFileText },
    createCustomExportMenu("/staff"),
  ],
  user: [
    createDashboardMenu("/user"),
    { label: "Manajemen Tiket", path: "/user/tickets", icon: FiFileText },
  ],
  executive: [
    createDashboardMenu("/executive"),
    { label: "Manajemen Tiket", path: "/executive/tickets", icon: FiFileText },
    createCustomExportMenu("/executive"),
  ],
  engineer: [
    createDashboardMenu("/engineer"),
    { label: "Manajemen Tiket", path: "/engineer/tickets", icon: FiFileText },
  ],
};
