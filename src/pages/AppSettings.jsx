import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiClock, FiImage, FiMessageCircle, FiSave, FiSettings, FiUpload } from "react-icons/fi";
import DashboardLayout from "../components/layout/DashboardLayout";

import {
  DEFAULT_APP_SETTINGS,
  getAdminAppSettings,
  getAppAssetURL,
  mergeAppSettings,
  normalizeAppSettings,
  updateAppSettings,
} from "../services/appSettingsService";

import { useAppSettings } from "../context/AppSettingsContext";

const DEFAULT_SETTINGS = {
  ...DEFAULT_APP_SETTINGS,
};

const PRIORITY_FIELDS = [
  {
    key: "priority_urgent_minutes",
    label: "URGENT",
    defaultValue: 15,
  },
  {
    key: "priority_high_minutes",
    label: "HIGH",
    defaultValue: 60,
  },
  {
    key: "priority_medium_minutes",
    label: "MEDIUM",
    defaultValue: 120,
  },
  {
    key: "priority_low_minutes",
    label: "LOW",
    defaultValue: 240,
  },
];

const MAX_SLA_MINUTES = 525600;

function formatDuration(value) {
  const minutes = Number(value);

  if (!Number.isInteger(minutes) || minutes < 1) {
    return "-";
  }

  if (minutes >= 1440 && minutes % 1440 === 0) {
    return `${minutes / 1440} hari`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes === 0) {
    return `${hours} jam`;
  }

  if (hours > 0) {
    return `${hours} jam ${remainingMinutes} menit`;
  }

  return `${minutes} menit`;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
  required = false,
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          w-full min-w-0 rounded-lg
          border border-gray-300 px-3 py-2.5
          text-sm outline-none transition
          focus:border-orange-400
          focus:ring-2 focus:ring-orange-100
        "
      />
    </label>
  );
}

function PriorityDurationField({
  label,
  value,
  onChange,
  defaultValue,
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-sm font-medium text-gray-700">
        SLA {label}
      </span>

      <div className="relative">
        <input
          type="number"
          min={1}
          max={MAX_SLA_MINUTES}
          step={1}
          required
          value={value ?? ""}
          onChange={(event) => {
            const rawValue = event.target.value;

            onChange(
              rawValue === "" ? "" : Number(rawValue),
            );
          }}
          className="
            w-full rounded-lg border
            border-gray-300 px-3 py-2.5
            pr-20 text-sm outline-none
            focus:border-orange-400
            focus:ring-2 focus:ring-orange-100
          "
        />

        <span
          className="
            pointer-events-none absolute
            inset-y-0 right-3 flex
            items-center text-sm text-gray-400
          "
        >
          menit
        </span>
      </div>

      <p className="text-xs text-gray-500">
        Preview:{" "}
        <span className="font-medium text-orange-700">
          {formatDuration(value)}
        </span>
      </p>
    </label>
  );
}

function useFilePreview(file, existingURL) {
  const [preview, setPreview] = useState(
    existingURL || "",
  );

  useEffect(() => {
    if (!file) {
      setPreview(existingURL || "");
      return undefined;
    }

    const objectURL = URL.createObjectURL(file);

    setPreview(objectURL);

    return () => {
      URL.revokeObjectURL(objectURL);
    };
  }, [file, existingURL]);

  return preview;
}

function ImageField({
  label,
  accept,
  file,
  currentURL,
  onChange,
  hint,
  maxSize,
}) {
  const preview = useFilePreview(
    file,
    getAppAssetURL(currentURL),
  );

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0] || null;

    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (selectedFile.size <= 0) {
      toast.error("File gambar kosong.");
      return;
    }

    if (selectedFile.size > maxSize) {
      toast.error(
        `Ukuran ${label} maksimal ${
          maxSize / (1024 * 1024)
        } MB.`,
      );
      return;
    }

    onChange(selectedFile);
  };

  return (
    <div className="min-w-0 rounded-xl border border-gray-200 p-4">
      <p className="mb-3 text-sm font-medium text-gray-700">
        {label}
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="
            flex h-24 w-32 shrink-0
            items-center justify-center overflow-hidden
            rounded-lg border border-dashed
            border-gray-300 bg-gray-50 p-2
          "
        >
          {preview ? (
            <img
              src={preview}
              alt={`Pratinjau ${label}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <FiImage
              size={28}
              className="text-gray-300"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <label
            className="
              inline-flex cursor-pointer items-center
              gap-2 rounded-lg border border-gray-300
              px-3 py-2 text-sm font-medium text-gray-700
              transition hover:bg-gray-50
            "
          >
            <FiUpload size={16} />
            Pilih Gambar

            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <p className="mt-2 break-words text-xs text-gray-500">
            {file?.name || hint}
          </p>

          {file && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="
                mt-2 text-xs font-medium
                text-red-600 hover:text-red-700
              "
            >
              Batalkan pilihan file
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppSettings() {
  const { refreshSettings } = useAppSettings();

  const [form, setForm] = useState(() => ({
    ...DEFAULT_SETTINGS,
  }));

  const [logoFile, setLogoFile] = useState(null);
  const [loginIconFile, setLoginIconFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(
    async ({ showToast = false } = {}) => {
      setLoading(true);

      try {
        const response =
          await getAdminAppSettings();

        setForm(
          normalizeAppSettings(response),
        );

        setLogoFile(null);
        setLoginIconFile(null);
        setFaviconFile(null);

        if (showToast) {
          toast.success(
            "Pengaturan berhasil dimuat ulang.",
          );
        }
      } catch (error) {
        console.error(
          "Gagal memuat pengaturan aplikasi:",
          error,
        );

        toast.error(
          error?.message ||
            "Gagal memuat pengaturan aplikasi.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateField = useCallback(
    (name, value) => {
      setForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    [],
  );

  const validatePrioritySettings = () => {
    for (const field of PRIORITY_FIELDS) {
      const value = Number(form[field.key]);

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > MAX_SLA_MINUTES
      ) {
        toast.error(
          `SLA ${field.label} harus berupa bilangan bulat antara 1 dan ${MAX_SLA_MINUTES} menit.`,
        );

        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || loading) {
      return;
    }

    const whatsappNumber = String(
      form.whatsapp_number || "",
    )
      .trim()
      .replace(/\D/g, "");

    if (!whatsappNumber) {
      toast.error(
        "Nomor WhatsApp wajib diisi dengan kode negara.",
      );
      return;
    }

    if (!String(form.whatsapp_display_number || "").trim()) {
      toast.error(
        "Nomor WhatsApp yang ditampilkan wajib diisi.",
      );
      return;
    }

    if (!String(form.whatsapp_message || "").trim()) {
      toast.error(
        "Template pesan WhatsApp wajib diisi.",
      );
      return;
    }

    if (!validatePrioritySettings()) {
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();

      const fields = [
        "app_name",
        "login_title",
        "tagline",
        "whatsapp_number",
        "whatsapp_display_number",
        "whatsapp_message",
        "primary_color",
        "sidebar_title",
        "footer_text",
        "app_version",
        "priority_urgent_minutes",
        "priority_high_minutes",
        "priority_medium_minutes",
        "priority_low_minutes",
      ];

      fields.forEach((key) => {
        const value =
          key === "whatsapp_number"
            ? whatsappNumber
            : form[key] ?? "";

        payload.append(key, String(value));
      });

      if (logoFile) {
        payload.append("logo", logoFile);
      }

      if (loginIconFile) {
        payload.append("login_icon", loginIconFile);
      }

      if (faviconFile) {
        payload.append("favicon", faviconFile);
      }

      const savedResponse =
        await updateAppSettings(payload);

      let nextSettings = mergeAppSettings(
        form,
        savedResponse,
      );

      try {
        const latestResponse =
          await getAdminAppSettings();

        nextSettings = mergeAppSettings(
          nextSettings,
          latestResponse,
        );
      } catch (refreshError) {
        console.warn(
          "Konfigurasi tersimpan, tetapi gagal mengambil ulang data:",
          refreshError,
        );
      }

      setForm(nextSettings);
      setLogoFile(null);
      setLoginIconFile(null);
      setFaviconFile(null);

      await refreshSettings();

      toast.success(
        "Pengaturan aplikasi berhasil disimpan.",
      );
    } catch (error) {
      console.error(
        "Gagal menyimpan pengaturan aplikasi:",
        error,
      );

      toast.error(
        error?.message ||
          "Gagal menyimpan pengaturan aplikasi.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Pengaturan Aplikasi">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-none space-y-5"
      >
        <div
          className="
            w-full rounded-2xl border
            border-gray-200 bg-white
            p-5 shadow-sm sm:p-6
          "
        >
          {/* HEADER */}

          <div className="mb-6 flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-orange-50 p-3 text-orange-600">
              <FiSettings size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-800">
                Pengaturan Aplikasi
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Kelola branding, informasi WhatsApp,
                SLA prioritas tiket, dan footer aplikasi.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Memuat pengaturan aplikasi...
            </div>
          ) : (
            <div className="space-y-7">
              {/* IDENTITAS DAN BRANDING */}

              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Identitas dan Branding
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Atur nama aplikasi, logo, ikon Login,
                    favicon, dan warna utama.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="Nama aplikasi"
                    value={form.app_name}
                    maxLength={100}
                    required
                    onChange={(value) =>
                      updateField("app_name", value)
                    }
                  />

                  <TextField
                    label="Judul halaman Login"
                    value={form.login_title}
                    maxLength={100}
                    required
                    onChange={(value) =>
                      updateField("login_title", value)
                    }
                  />

                  <TextField
                    label="Tagline"
                    value={form.tagline}
                    maxLength={200}
                    onChange={(value) =>
                      updateField("tagline", value)
                    }
                  />

                  <TextField
                    label="Nama pada Sidebar"
                    value={form.sidebar_title}
                    maxLength={100}
                    onChange={(value) =>
                      updateField("sidebar_title", value)
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <ImageField
                    label="Logo aplikasi / Sidebar"
                    accept="image/png,image/jpeg,image/webp"
                    file={logoFile}
                    currentURL={form.logo_url}
                    onChange={setLogoFile}
                    maxSize={5 * 1024 * 1024}
                    hint="PNG, JPG, atau WebP. Maksimal 5 MB."
                  />

                  <ImageField
                    label="Ikon pada halaman Login"
                    accept="image/png,image/jpeg,image/webp"
                    file={loginIconFile}
                    currentURL={form.login_icon_url}
                    onChange={setLoginIconFile}
                    maxSize={5 * 1024 * 1024}
                    hint="PNG, JPG, atau WebP. Maksimal 5 MB."
                  />
                </div>

                <ImageField
                  label="Favicon tab browser"
                  accept="image/png,image/jpeg,image/webp,image/x-icon,.ico"
                  file={faviconFile}
                  currentURL={form.favicon_url}
                  onChange={setFaviconFile}
                  maxSize={1024 * 1024}
                  hint="PNG, JPG, WebP, atau ICO. Maksimal 1 MB."
                />

                <label className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 p-4">
                  <span className="text-sm font-medium text-gray-700">
                    Warna utama aplikasi
                  </span>

                  <input
                    type="color"
                    value={
                      form.primary_color ||
                      DEFAULT_SETTINGS.primary_color
                    }
                    onChange={(event) =>
                      updateField(
                        "primary_color",
                        event.target.value,
                      )
                    }
                    className="
                      h-10 w-14 cursor-pointer
                      rounded border border-gray-200
                      bg-white p-1
                    "
                    aria-label="Pilih warna utama aplikasi"
                  />

                  <span className="font-mono text-sm text-gray-500">
                    {form.primary_color}
                  </span>
                </label>
              </section>

              <div className="border-t border-gray-100" />

              {/* PRIORITAS DAN SLA */}

              <section className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                    <FiClock size={20} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Prioritas dan SLA Ticket
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      Tentukan durasi SLA setiap prioritas
                      dalam menit. Durasi ini dipakai saat
                      tiket baru dibuat.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {PRIORITY_FIELDS.map((field) => (
                    <PriorityDurationField
                      key={field.key}
                      label={field.label}
                      value={form[field.key]}
                      defaultValue={field.defaultValue}
                      onChange={(value) =>
                        updateField(field.key, value)
                      }
                    />
                  ))}
                </div>

                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-orange-800">
                    Ringkasan SLA
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PRIORITY_FIELDS.map((field) => (
                      <div
                        key={field.key}
                        className="
                          flex items-center justify-between
                          gap-3 rounded-lg bg-white
                          px-3 py-2 text-sm
                        "
                      >
                        <span className="font-medium text-gray-700">
                          {field.label}
                        </span>

                        <span className="font-semibold text-orange-700">
                          {formatDuration(
                            form[field.key],
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-gray-500">
                  Perubahan durasi berlaku untuk tiket
                  baru. Tenggat tiket lama tidak diubah
                  otomatis karena waktu sla telah
                  tercatat di database.
                </p>
              </section>

              <div className="border-t border-gray-100" />

              {/* WHATSAPP */}

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <FiMessageCircle
                    className="text-green-600"
                    size={20}
                  />

                  <h3 className="font-semibold text-gray-800">
                    Teks Login dan WhatsApp
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="Nomor WhatsApp untuk tautan"
                    value={form.whatsapp_number}
                    type="tel"
                    maxLength={25}
                    required
                    placeholder="628xxxxxxxxxx (kode negara)"
                    onChange={(value) =>
                      updateField(
                        "whatsapp_number",
                        value.replace(/\D/g, ""),
                      )
                    }
                  />

                  <TextField
                    label="Nomor yang ditampilkan"
                    value={form.whatsapp_display_number}
                    maxLength={40}
                    required
                    onChange={(value) =>
                      updateField(
                        "whatsapp_display_number",
                        value,
                      )
                    }
                  />
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">
                    Template pesan WhatsApp
                  </span>

                  <textarea
                    value={form.whatsapp_message ?? ""}
                    onChange={(event) =>
                      updateField(
                        "whatsapp_message",
                        event.target.value,
                      )
                    }
                    rows={7}
                    maxLength={4000}
                    required
                    className="
                      w-full rounded-lg border
                      border-gray-300 px-3 py-2.5
                      text-sm outline-none
                      focus:border-orange-400
                      focus:ring-2 focus:ring-orange-100
                    "
                  />

                  <span className="text-xs text-gray-400">
                    Maksimal 4.000 karakter.
                  </span>
                </label>

                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  <p className="mb-1 font-medium">
                    Pratinjau nomor WhatsApp
                  </p>

                  <p className="break-all">
                    {form.whatsapp_display_number ||
                      form.whatsapp_number}
                  </p>
                </div>
              </section>

              <div className="border-t border-gray-100" />

              {/* FOOTER */}

              <section className="space-y-4">
                <h3 className="font-semibold text-gray-800">
                  Footer dan Versi Aplikasi
                </h3>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">
                    Teks footer
                  </span>

                  <textarea
                    value={form.footer_text ?? ""}
                    onChange={(event) =>
                      updateField(
                        "footer_text",
                        event.target.value,
                      )
                    }
                    rows={2}
                    className="
                      w-full rounded-lg border
                      border-gray-300 px-3 py-2.5
                      text-sm outline-none
                      focus:border-orange-400
                      focus:ring-2 focus:ring-orange-100
                    "
                  />
                </label>

                <TextField
                  label="Versi aplikasi"
                  value={form.app_version}
                  maxLength={30}
                  onChange={(value) =>
                    updateField("app_version", value)
                  }
                />
              </section>
            </div>
          )}

          {/* ACTIONS */}

          <div
            className="
              mt-7 flex flex-col-reverse gap-3
              border-t border-gray-100 pt-5
              sm:flex-row sm:justify-end
            "
          >
            <button
              type="button"
              disabled={saving || loading}
              onClick={() =>
                loadSettings({ showToast: true })
              }
              className="
                rounded-lg border border-gray-300
                px-4 py-2.5 text-sm font-medium
                text-gray-700 hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Muat Ulang
            </button>

            <button
              type="submit"
              disabled={saving || loading}
              className="
                inline-flex items-center
                justify-center gap-2 rounded-lg
                bg-orange-600 px-5 py-2.5
                text-sm font-semibold text-white
                shadow-sm transition hover:bg-orange-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <FiSave size={17} />

              {saving
                ? "Menyimpan..."
                : "Simpan Pengaturan"}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}