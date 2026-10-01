import { jwtDecode } from "jwt-decode";
import { navigationMenu } from "../constants/navigation";

export const EMPTY_FILTERS = {
  project_id: "",
  part_id: "",
  start_date: "",
  end_date: "",
};

export const STATUS_CONFIG = [
  {
    key: "open",
    label: "Open",
    color: "#ef4444",
  },
  {
    key: "resolved",
    label: "Resolved",
    color: "#22c55e",
  },
  {
    key: "closed",
    label: "Closed",
    color: "#64748b",
  },
  {
    key: "onhold",
    label: "Onhold",
    color: "#3b82f6",
  },
];

export const PRIORITY_CONFIG = [
  {
    key: "URGENT",
    label: "URGENT",
    color: "#ef4444",
  },
  {
    key: "HIGH",
    label: "HIGH",
    color: "#f97316",
  },
  {
    key: "MEDIUM",
    label: "MEDIUM",
    color: "#3b82f6",
  },
  {
    key: "LOW",
    label: "LOW",
    color: "#10b981",
  },
];

const ROLE_MAP = {
  "1": "administrator",
  "2": "staff",
  "3": "user",
  "4": "executive",
  "5": "engineer",
};

export function getCurrentRole() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    return jwtDecode(token)?.role || null;
  } catch {
    return null;
  }
}

export function getRoleKey(role) {
  const value = String(role || "").trim();

  if (ROLE_MAP[value]) {
    return ROLE_MAP[value];
  }

  return value.toLowerCase();
}

export function getRoleMenu(role) {
  return navigationMenu[getRoleKey(role)] || [];
}

export function formatMonthLabel(value) {
  if (!value) {
    return "-";
  }

  const normalized = String(value).slice(0, 7);
  const [year, month] = normalized.split("-");

  if (!year || !month) {
    return value;
  }

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1,
  );

  return date.toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

export function formatHoursToHM(hours) {
  if (!hours || hours <= 0) {
    return "0j 0m";
  }

  const totalMinutes = Math.floor(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${h}j ${m}m`;
}

export function getStatusChartData(statusData = {}) {
  return STATUS_CONFIG.map((status) => ({
    name: status.label,
    key: status.key,
    value: statusData?.[status.key] || 0,
    color: status.color,
  }));
}

export function getStatusTotal(statusData = {}) {
  return STATUS_CONFIG.reduce(
    (total, status) =>
      total + (statusData?.[status.key] || 0),
    0,
  );
}