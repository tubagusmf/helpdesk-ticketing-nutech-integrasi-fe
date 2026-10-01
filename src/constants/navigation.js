import {
  FiGrid,
  FiFileText,
  FiUsers,
  FiDatabase,
} from "react-icons/fi";

const createDashboardMenu = (basePath) => ({
  label: "Dashboard",
  path: `${basePath}/dashboard`,
  icon: FiGrid,
  children: [
    {
      label: "Dashboard Summary",
      path: `${basePath}/dashboard`,
    },
    {
      label: "Dashboard Ticket",
      path: `${basePath}/dashboard/ticket`,
    },
    {
      label: "Dashboard Project",
      path: `${basePath}/dashboard/project`,
    },
    {
      label: "Dashboard Staff",
      path: `${basePath}/dashboard/staff`,
    },
  ],
});

export const navigationMenu = {
  administrator: [
    createDashboardMenu("/admin"),

    {
      label: "Data Tiket",
      path: "/admin/tickets",
      icon: FiFileText,
    },

    {
      label: "Manajemen User",
      path: "/admin/users",
      icon: FiUsers,
    },

    {
      label: "Master Data",
      path: "/admin/master",
      icon: FiDatabase,
    },
  ],

  staff: [
    createDashboardMenu("/staff"),

    {
      label: "Data Tiket",
      path: "/staff/tickets",
      icon: FiFileText,
    },
  ],

  user: [
    createDashboardMenu("/user"),

    {
      label: "Data Tiket",
      path: "/user/tickets",
      icon: FiFileText,
    },
  ],

  executive: [
    createDashboardMenu("/executive"),

    {
      label: "Data Tiket",
      path: "/executive/tickets",
      icon: FiFileText,
    },
  ],

  engineer: [
    createDashboardMenu("/engineer"),

    {
      label: "Data Tiket",
      path: "/engineer/tickets",
      icon: FiFileText,
    },
  ],
};