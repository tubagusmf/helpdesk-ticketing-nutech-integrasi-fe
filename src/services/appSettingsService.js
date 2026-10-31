const configuredURL = String(
  import.meta.env.VITE_API_URL || "",
)
  .trim()
  .replace(/\/+$/, "");

const API_ORIGIN = configuredURL.replace(/\/v1$/i, "");
const BASE_URL = `${API_ORIGIN}/v1/app-settings`;

export const DEFAULT_APP_SETTINGS = {
  app_name: "Helpdesk Center",
  login_title: "Helpdesk Center",
  tagline: "Professional Ticketing System",

  logo_url: "",
  login_icon_url: "",
  favicon_url: "",

  whatsapp_number: "6281119521124",
  whatsapp_display_number: "081119521124",

  whatsapp_message: `Halo Admin,

Mohon untuk mendaftar akun Helpdesk dengan mengisi data berikut:

Nama Lengkap:
Email:
Project:

Terima kasih.`,

  primary_color: "#EA580C",
  sidebar_title: "Helpdesk Center",
  footer_text: "© 2026 Helpdesk CCIT Nutech Integrasi",
  app_version: "Version 1.0.0",

  priority_urgent_minutes: 15,
  priority_high_minutes: 60,
  priority_medium_minutes: 120,
  priority_low_minutes: 240,
  login_session_minutes: 600,
  staff_response_sla_minutes: 3,
};

const PRIORITY_DEFAULTS = {
  priority_urgent_minutes: 15,
  priority_high_minutes: 60,
  priority_medium_minutes: 120,
  priority_low_minutes: 240,
};

const MAX_PRIORITY_MINUTES = 525600;

const FIELD_ALIASES = {
  app_name: [
    "app_name",
    "appName",
    "AppName",
  ],

  login_title: [
    "login_title",
    "loginTitle",
    "LoginTitle",
  ],

  tagline: [
    "tagline",
    "Tagline",
  ],

  logo_url: [
    "logo_url",
    "logoUrl",
    "LogoURL",
  ],

  login_icon_url: [
    "login_icon_url",
    "loginIconUrl",
    "LoginIconURL",
  ],

  favicon_url: [
    "favicon_url",
    "faviconUrl",
    "FaviconURL",
  ],

  whatsapp_number: [
    "whatsapp_number",
    "whatsappNumber",
    "WhatsAppNumber",
    "WhatsappNumber",
  ],

  whatsapp_display_number: [
    "whatsapp_display_number",
    "whatsappDisplayNumber",
    "WhatsAppDisplayNumber",
  ],

  whatsapp_message: [
    "whatsapp_message",
    "whatsappMessage",
    "WhatsAppMessage",
  ],

  primary_color: [
    "primary_color",
    "primaryColor",
    "PrimaryColor",
  ],

  sidebar_title: [
    "sidebar_title",
    "sidebarTitle",
    "SidebarTitle",
  ],

  footer_text: [
    "footer_text",
    "footerText",
    "FooterText",
  ],

  app_version: [
    "app_version",
    "appVersion",
    "AppVersion",
  ],

  priority_urgent_minutes: [
    "priority_urgent_minutes",
    "priorityUrgentMinutes",
    "PriorityUrgentMinutes",
  ],

  priority_high_minutes: [
    "priority_high_minutes",
    "priorityHighMinutes",
    "PriorityHighMinutes",
  ],

  priority_medium_minutes: [
    "priority_medium_minutes",
    "priorityMediumMinutes",
    "PriorityMediumMinutes",
  ],

  priority_low_minutes: [
    "priority_low_minutes",
    "priorityLowMinutes",
    "PriorityLowMinutes",
  ],

  login_session_minutes: [
    "login_session_minutes",
    "loginSessionMinutes",
  ],

  staff_response_sla_minutes: [
    "staff_response_sla_minutes",
    "staffResponseSlaMinutes",
  ],
};

const FALLBACK_WHEN_EMPTY = new Set([
  "app_name",
  "login_title",
  "tagline",
  "sidebar_title",
  "footer_text",
  "app_version",
  "whatsapp_number",
  "whatsapp_display_number",
  "whatsapp_message",
]);

const PRESERVE_WHEN_EMPTY = new Set([
  "logo_url",
  "login_icon_url",
  "favicon_url",
  "whatsapp_number",
  "whatsapp_display_number",
  "whatsapp_message",
]);

export function unwrapAppSettingsResponse(response) {
  let value = response;

  for (let depth = 0; depth < 5; depth += 1) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      break;
    }

    if (
      value.data &&
      typeof value.data === "object" &&
      !Array.isArray(value.data)
    ) {
      value = value.data;
      continue;
    }

    if (
      value.settings &&
      typeof value.settings === "object" &&
      !Array.isArray(value.settings)
    ) {
      value = value.settings;
      continue;
    }

    break;
  }

  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
}

export function normalizeAppSettings(response) {
  const source = unwrapAppSettingsResponse(response);

  const result = {
    ...DEFAULT_APP_SETTINGS,
  };

  for (const [field, aliases] of Object.entries(
    FIELD_ALIASES,
  )) {
    for (const alias of aliases) {
      if (
        Object.prototype.hasOwnProperty.call(
          source,
          alias,
        ) &&
        source[alias] !== null &&
        source[alias] !== undefined
      ) {
        result[field] = source[alias];
        break;
      }
    }
  }
  
  for (const field of FALLBACK_WHEN_EMPTY) {
    if (!String(result[field] ?? "").trim()) {
      result[field] = DEFAULT_APP_SETTINGS[field];
    } else {
      result[field] = String(result[field]);
    }
  }

  result.whatsapp_number = String(
    result.whatsapp_number || "",
  )
    .trim()
    .replace(/\D/g, "");

  if (!result.whatsapp_number) {
    result.whatsapp_number =
      DEFAULT_APP_SETTINGS.whatsapp_number;
  }

  result.whatsapp_display_number = String(
    result.whatsapp_display_number || "",
  ).trim();

  if (!result.whatsapp_display_number) {
    result.whatsapp_display_number =
      DEFAULT_APP_SETTINGS.whatsapp_display_number;
  }

  result.whatsapp_message =
    String(result.whatsapp_message || "").trim() ||
    DEFAULT_APP_SETTINGS.whatsapp_message;

  result.primary_color =
    /^#[0-9A-Fa-f]{6}$/.test(
      String(result.primary_color || ""),
    )
      ? result.primary_color
      : DEFAULT_APP_SETTINGS.primary_color;

  for (const [field, defaultValue] of Object.entries(
    PRIORITY_DEFAULTS,
  )) {
    const minutes = Number(result[field]);

    result[field] =
      Number.isInteger(minutes) &&
      minutes >= 1 &&
      minutes <= MAX_PRIORITY_MINUTES
        ? minutes
        : defaultValue;
  }

  const systemDurationDefaults = {
    login_session_minutes: 600,
    staff_response_sla_minutes: 3,
  };

  for (const [field, defaultValue] of Object.entries(
    systemDurationDefaults,
  )) {
    const minutes = Number(result[field]);

    const minValue =
      field === "login_session_minutes" ? 5 : 1;

    const maxValue =
      field === "login_session_minutes" ? 43200 : 525600;

    result[field] =
      Number.isInteger(minutes) &&
      minutes >= minValue &&
      minutes <= maxValue
        ? minutes
        : defaultValue;
  }

  for (const field of [
    "logo_url",
    "login_icon_url",
    "favicon_url",
  ]) {
    result[field] = String(result[field] || "").trim();
  }

  return result;
}

export function mergeAppSettings(current, response) {
  const source = unwrapAppSettingsResponse(response);

  const merged = {
    ...DEFAULT_APP_SETTINGS,
    ...(current || {}),
  };

  for (const [field, aliases] of Object.entries(
    FIELD_ALIASES,
  )) {
    for (const alias of aliases) {
      if (
        !Object.prototype.hasOwnProperty.call(
          source,
          alias,
        )
      ) {
        continue;
      }

      const rawValue = source[alias];

      if (
        rawValue === null ||
        rawValue === undefined
      ) {
        break;
      }

      const empty = String(rawValue).trim() === "";
      if (
        empty &&
        PRESERVE_WHEN_EMPTY.has(field)
      ) {
        break;
      }

      merged[field] = rawValue;
      break;
    }
  }

  return normalizeAppSettings(merged);
}

function getAuthHeaders() {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("token")
      : "";

  return {
    Authorization: `Bearer ${token || ""}`,
  };
}

async function requestSettings(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });

  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(
      body?.message ||
        `Gagal memproses pengaturan aplikasi (${response.status}).`,
    );
  }

  return body;
}

export async function getPublicAppSettings() {
  const response = await requestSettings(
    `${BASE_URL}/public`,
  );

  return normalizeAppSettings(response);
}

export async function getAdminAppSettings() {
  const response = await requestSettings(
    BASE_URL,
    {
      headers: getAuthHeaders(),
    },
  );

  return normalizeAppSettings(response);
}

export async function updateAppSettings(formData) {
  if (!(formData instanceof FormData)) {
    throw new Error(
      "Data pengaturan harus dikirim menggunakan FormData.",
    );
  }

  return requestSettings(BASE_URL, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: formData,
  });
}

export function getAppAssetURL(assetPath) {
  if (!assetPath) {
    return "";
  }

  const path = String(assetPath).trim();

  if (
    /^https?:\/\//i.test(path) ||
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith("//")
  ) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, "");

  return `${API_ORIGIN}/${normalizedPath}`;
}