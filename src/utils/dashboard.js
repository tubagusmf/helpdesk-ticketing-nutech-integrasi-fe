
import { jwtDecode } from "jwt-decode";
import { navigationMenu } from "../constants/navigation";
import { ROLE } from "../constants/role";
export const EMPTY_FILTERS = {
  project_id: "",
  part_id: "",
  start_date: "",
  end_date: "",
};

const ROLE_KEY_MAP = {
  [ROLE.ADMINISTRATOR]: "administrator",
  [ROLE.STAFF]: "staff",
  [ROLE.USER]: "user",
  [ROLE.EXECUTIVE]: "executive",
  [ROLE.ENGINEER]: "engineer",
};

const ROLE_NAME_MAP = {
  ADMINISTRATOR: ROLE.ADMINISTRATOR,
  ADMIN: ROLE.ADMINISTRATOR,

  STAFF: ROLE.STAFF,
  STAFF_CCIT: ROLE.STAFF,

  USER: ROLE.USER,
  USER_PELAPOR: ROLE.USER,

  EXECUTIVE: ROLE.EXECUTIVE,

  ENGINEER: ROLE.ENGINEER,
};

export const DASHBOARD_ACCESS_BY_ROLE = {
  [ROLE.ADMINISTRATOR]: [
    "summary",
    "ticket",
    "project",
    "staff",
  ],

  [ROLE.STAFF]: [
    "summary",
    "ticket",
    "project",
    "staff",
  ],

  [ROLE.USER]: [
    "summary",
  ],

  [ROLE.EXECUTIVE]: [
    "summary",
    "ticket",
    "project",
  ],

  [ROLE.ENGINEER]: [
    "summary",
  ],
};

// Prefix URL untuk setiap role.
export const DASHBOARD_BASE_BY_ROLE = {
  [ROLE.ADMINISTRATOR]: "/admin",
  [ROLE.STAFF]: "/staff",
  [ROLE.USER]: "/user",
  [ROLE.EXECUTIVE]: "/executive",
  [ROLE.ENGINEER]: "/engineer",
};

export function normalizeRole(rawRole) {
  if (
    rawRole === null ||
    rawRole === undefined ||
    rawRole === ""
  ) {
    return null;
  }

  const normalizedName = String(rawRole)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (
    Object.prototype.hasOwnProperty.call(
      ROLE_NAME_MAP,
      normalizedName,
    )
  ) {
    return ROLE_NAME_MAP[normalizedName];
  }

  const numericRole = Number(normalizedName);

  if (
    Number.isInteger(numericRole) &&
    Object.prototype.hasOwnProperty.call(
      ROLE_KEY_MAP,
      numericRole,
    )
  ) {
    return numericRole;
  }

  return null;
}

/**
 * Mengambil role akun dari JWT.
 *
 * Mendukung token yang memiliki role_id, role,
 * role_name, atau roleName.
 */
export function getCurrentRole() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const claims = jwtDecode(token);

    const rawRole =
      claims?.role_id ??
      claims?.roleId ??
      claims?.role ??
      claims?.role_name ??
      claims?.roleName;

    return normalizeRole(rawRole);
  } catch (error) {
    console.error(
      "Gagal membaca role dari JWT:",
      error,
    );

    return null;
  }
}

export function getRoleKey(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole !== null) {
    return ROLE_KEY_MAP[normalizedRole];
  }

  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getDashboardPageKey(item) {
  const label = String(
    item?.label ?? item?.title ?? "",
  )
    .trim()
    .toLowerCase();

  const path = String(
    item?.path ?? item?.to ?? "",
  )
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");

  if (
    /\/dashboard\/ticket$/.test(path) ||
    /\bdashboard\s+ticket\b/.test(label)
  ) {
    return "ticket";
  }

  if (
    /\/dashboard\/project$/.test(path) ||
    /\bdashboard\s+project\b/.test(label)
  ) {
    return "project";
  }

  if (
    /\/dashboard\/staff$/.test(path) ||
    /\bdashboard\s+staff\b/.test(label)
  ) {
    return "staff";
  }

  if (
    /\/dashboard$/.test(path) ||
    /\bdashboard\s+summary\b/.test(label) ||
    label === "summary"
  ) {
    return "summary";
  }

  return null;
}

function isDashboardGroup(item) {
  const children = Array.isArray(item?.children)
    ? item.children
    : [];

  if (children.length === 0) {
    return false;
  }

  const label = String(
    item?.label ?? item?.title ?? "",
  )
    .trim()
    .toLowerCase();

  return (
    label === "dashboard" ||
    children.some(
      (child) => getDashboardPageKey(child) !== null,
    )
  );
}

function filterMenuByRole(items, allowedPages) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item) => {
    const children = Array.isArray(item?.children)
      ? item.children
      : [];
    if (isDashboardGroup(item)) {
      const summaryOnly =
        allowedPages.length === 1 &&
        allowedPages[0] === "summary";

      if (summaryOnly) {
        const dashboardItem = { ...item };

        delete dashboardItem.children;

        return [dashboardItem];
      }

      const filteredChildren = children.filter(
        (child) => {
          const pageKey = getDashboardPageKey(child);

          return (
            pageKey !== null &&
            allowedPages.includes(pageKey)
          );
        },
      );

      if (filteredChildren.length === 0) {
        return [];
      }

      return [
        {
          ...item,
          children: filteredChildren,
        },
      ];
    }

    const pageKey = getDashboardPageKey(item);

    if (pageKey !== null) {
      return allowedPages.includes(pageKey)
        ? [item]
        : [];
    }

    if (children.length > 0) {
      return [
        {
          ...item,
          children: filterMenuByRole(
            children,
            allowedPages,
          ),
        },
      ];
    }

    return [item];
  });
}

export function getRoleMenu(role) {
  const roleID = normalizeRole(role);

  if (roleID === null) {
    return [];
  }

  const roleKey = getRoleKey(roleID);
  const originalMenu = navigationMenu[roleKey] || [];

  const allowedPages =
    DASHBOARD_ACCESS_BY_ROLE[roleID] || [];

  return filterMenuByRole(
    originalMenu,
    allowedPages,
  );
}

export function canAccessDashboard(
  role,
  pageKey,
) {
  const roleID = normalizeRole(role);

  if (roleID === null) {
    return false;
  }

  const allowedPages =
    DASHBOARD_ACCESS_BY_ROLE[roleID] || [];

  return allowedPages.includes(pageKey);
}

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

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

export function formatHoursToHM(hours) {
  const numericHours = Number(hours);

  if (
    !Number.isFinite(numericHours) ||
    numericHours <= 0
  ) {
    return "0j 0m";
  }

  const totalMinutes = Math.floor(
    numericHours * 60,
  );

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${h}j ${m}m`;
}

export function getStatusChartData(statusData = {}) {
  return STATUS_CONFIG.map((status) => ({
    name: status.label,
    key: status.key,
    value: Number(statusData?.[status.key]) || 0,
    color: status.color,
  }));
}

export function getStatusTotal(statusData = {}) {
  return STATUS_CONFIG.reduce(
    (total, status) =>
      total +
      (Number(statusData?.[status.key]) || 0),
    0,
  );
}
