import { navigationMenu } from "./navigation";

export const dashboardConfig = {
  ADMINISTRATOR: {
    title: "Administrator Dashboard",
    menu: navigationMenu.administrator,
    summaryType: "administrator",
  },

  STAFF: {
    title: "Staff Dashboard",
    menu: navigationMenu.staff,
    summaryType: "staff",
  },

  USER: {
    title: "User Dashboard",
    menu: navigationMenu.user,
    summaryType: "user",
  },
};