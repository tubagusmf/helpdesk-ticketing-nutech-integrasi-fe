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
  whatsapp_message:
    "Halo Admin,\n\n" +
    "Mohon untuk mendaftar akun Helpdesk " +
    "dengan mengisi data berikut:\n\n" +
    "Nama Lengkap:\n" +
    "Email:\n" +
    "Project:\n\n" +
    "Terima kasih.",

  primary_color: "#EA580C",
  sidebar_title: "Helpdesk Center",
  footer_text: "© 2026 Helpdesk CCIT Nutech Integrasi",
  app_version: "Version 1.0.0",
};

const FIELD_ALIASES = {
  app_name: ["app_name", "appName", "AppName"],
  login_title: ["login_title", "loginTitle", "LoginTitle"],
  tagline: ["tagline", "Tagline"],

  logo_url: ["logo_url", "logoUrl", "LogoURL"],
  login_icon_url: [
    "login_icon_url",
    "loginIconUrl",
    "LoginIconURL",
  ],
  favicon_url: ["favicon_url", "faviconUrl", "FaviconURL"],

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
  footer_text: ["footer_text", "footerText", "FooterText"],
  app_version: ["app_version", "appVersion", "AppVersion"],
};

export function unwrapAppSettingsResponse(response) {
  let value = response;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
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

  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export function normalizeAppSettings(response) {
  const source = unwrapAppSettingsResponse(response);

  const result = {
    ...DEFAULT_APP_SETTINGS,
  };

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (
        Object.prototype.hasOwnProperty.call(source, alias) &&
        source[alias] !== null &&
        source[alias] !== undefined
      ) {
        result[field] = String(source[alias]);
        break;
      }
    }
  }

  result.whatsapp_number =
    String(result.whatsapp_number || "").trim().replace(/\D/g, "") ||
    DEFAULT_APP_SETTINGS.whatsapp_number;

  result.whatsapp_display_number =
    String(result.whatsapp_display_number || "").trim() ||
    DEFAULT_APP_SETTINGS.whatsapp_display_number;

  result.whatsapp_message =
    String(result.whatsapp_message || "").trim() ||
    DEFAULT_APP_SETTINGS.whatsapp_message;

  result.primary_color =
    /^#[0-9A-Fa-f]{6}$/.test(result.primary_color)
      ? result.primary_color
      : DEFAULT_APP_SETTINGS.primary_color;

  return result;
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
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
      body?.message || "Gagal memproses pengaturan aplikasi.",
    );
  }

  return unwrapAppSettingsResponse(body);
}

export async function getPublicAppSettings() {
  const data = await requestSettings(`${BASE_URL}/public`);
  return normalizeAppSettings(data);
}

export async function getAdminAppSettings() {
  const data = await requestSettings(BASE_URL, {
    headers: getAuthHeaders(),
  });

  return normalizeAppSettings(data);
}

export async function updateAppSettings(formData) {
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

  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  return `${API_ORIGIN}/${path.replace(/^\/+/, "")}`;
}