import {
    FiGrid,
    FiFileText,
    FiUsers,
    FiDatabase,
  } from "react-icons/fi";
  
  export const navigationMenu = {
    administrator: [
      {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: FiGrid,
      },
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
      {
        label: "Dashboard",
        path: "/staff/dashboard",
        icon: FiGrid,
      },
      {
        label: "Data Tiket",
        path: "/staff/tickets",
        icon: FiFileText,
      },
    ],
  
    user: [
      {
        label: "Dashboard",
        path: "/user/dashboard",
        icon: FiGrid,
      },
      {
        label: "Data Tiket",
        path: "/user/tickets",
        icon: FiFileText,
      },
    ],
  };