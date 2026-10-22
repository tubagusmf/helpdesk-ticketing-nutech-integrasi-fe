import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_APP_SETTINGS, getPublicAppSettings, getAppAssetURL } from "../services/appSettingsService";

const AppSettingsContext = createContext({
  settings: DEFAULT_APP_SETTINGS,
  loading: true,
  refreshSettings: async () => null,
  setSettings: () => {},
});

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    ...DEFAULT_APP_SETTINGS,
  });

  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const latestSettings = await getPublicAppSettings();

      setSettings({
        ...DEFAULT_APP_SETTINGS,
        ...latestSettings,
      });

      return latestSettings;
    } catch (error) {
      console.error(
        "Gagal memuat pengaturan aplikasi:",
        error,
      );

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const faviconURL = getAppAssetURL(settings.favicon_url);

    if (faviconURL) {
      let favicon = document.querySelector(
        'link[rel~="icon"]',
      );

      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }

      favicon.href = faviconURL;

      favicon.type = settings.favicon_url
        .toLowerCase()
        .split("?")[0]
        .endsWith(".ico")
        ? "image/x-icon"
        : "image/png";
    }

    document.title =
      settings.app_name || "Helpdesk Center";
  }, [
    settings.app_name,
    settings.favicon_url,
  ]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      refreshSettings,
      setSettings,
    }),
    [settings, loading, refreshSettings],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}