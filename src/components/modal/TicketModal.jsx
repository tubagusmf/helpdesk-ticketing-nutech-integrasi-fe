import { useCallback, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Select from "react-select";
import toast from "react-hot-toast";
import { FiImage, FiUpload, FiX } from "react-icons/fi";
import { createTicket, getLocations, getParts, getAssets } from "../../services/ticketService";
import { getCurrentUser } from "../../services/userService";
import { useAppSettings } from "../../context/AppSettingsContext";
import { DEFAULT_APP_SETTINGS } from "../../services/appSettingsService";

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;

const EMPTY_FORM = {
  project_id: "",
  location_id: "",
  part_id: "",
  asset_id: "",
  priority: "URGENT",
  description: "",
};

const DEFAULT_PRIORITY_MINUTES = {
  URGENT: 15,
  HIGH: 60,
  MEDIUM: 120,
  LOW: 240,
};

function getValidColor(color) {
  return /^#[0-9a-fA-F]{6}$/.test(String(color || ""))
    ? color
    : "#EA580C";
}

function formatPriorityDuration(value, fallback) {
  const parsed = Number(value);

  const minutes =
    Number.isInteger(parsed) && parsed >= 1
      ? parsed
      : fallback;

  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} hari`;
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

function extractList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function extractUser(response) {
  let result = response;

  for (let depth = 0; depth < 4; depth += 1) {
    if (
      !result ||
      typeof result !== "object" ||
      Array.isArray(result)
    ) {
      break;
    }

    if (
      result.data &&
      typeof result.data === "object" &&
      !Array.isArray(result.data)
    ) {
      result = result.data;
      continue;
    }

    break;
  }

  return result || {};
}

function getCurrentUserFromToken() {
  try {
    const token = localStorage.getItem("token");

    return token ? jwtDecode(token) : null;
  } catch (error) {
    console.error("Gagal membaca token pengguna:", error);
    return null;
  }
}

function useAttachmentPreview(file) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }

    const objectURL = URL.createObjectURL(file);
    setPreview(objectURL);

    return () => {
      URL.revokeObjectURL(objectURL);
    };
  }, [file]);

  return preview;
}

export default function TicketModal({ onClose }) {
  const { settings } = useAppSettings();

  const currentUser = useMemo(
    () => getCurrentUserFromToken(),
    [],
  );

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
  }));

  const [projects, setProjects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [parts, setParts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const preview = useAttachmentPreview(attachment);

  const primaryColor = getValidColor(
    settings?.primary_color ||
      DEFAULT_APP_SETTINGS.primary_color,
  );

  const priorityOptions = useMemo(() => {
    const configuredSettings = {
      ...DEFAULT_APP_SETTINGS,
      ...(settings || {}),
    };

    return Object.entries(DEFAULT_PRIORITY_MINUTES).map(
      ([priority, fallbackMinutes]) => {
        const settingKey =
          `priority_${priority.toLowerCase()}_minutes`;

        const configuredMinutes = Number(
          configuredSettings[settingKey],
        );

        const minutes =
          Number.isInteger(configuredMinutes) &&
          configuredMinutes >= 1 &&
          configuredMinutes <= 525600
            ? configuredMinutes
            : fallbackMinutes;

        return {
          value: priority,
          label: `${priority} (${formatPriorityDuration(
            minutes,
            fallbackMinutes,
          )})`,
        };
      },
    );
  }, [
    settings?.priority_urgent_minutes,
    settings?.priority_high_minutes,
    settings?.priority_medium_minutes,
    settings?.priority_low_minutes,
  ]);

  const selectStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "42px",
        borderRadius: "8px",
        borderColor: state.isFocused
          ? primaryColor
          : "#D1D5DB",
        boxShadow: state.isFocused
          ? `0 0 0 1px ${primaryColor}`
          : "none",
        "&:hover": {
          borderColor: primaryColor,
        },
        fontSize: "14px",
      }),

      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? primaryColor
          : state.isFocused
            ? `${primaryColor}18`
            : "#FFFFFF",
        color: state.isSelected ? "#FFFFFF" : "#1F2937",
        cursor: "pointer",
        fontSize: "14px",
      }),

      menu: (base) => ({
        ...base,
        zIndex: 100,
      }),

      menuPortal: (base) => ({
        ...base,
        zIndex: 100,
      }),

      placeholder: (base) => ({
        ...base,
        color: "#9CA3AF",
      }),

      input: (base) => ({
        ...base,
        color: "#111827",
      }),
    }),
    [primaryColor],
  );

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: project.name,
      })),
    [projects],
  );

  const locationOptions = useMemo(
    () =>
      locations.map((location) => ({
        value: location.id,
        label: location.name,
      })),
    [locations],
  );

  const partOptions = useMemo(
    () =>
      parts.map((part) => ({
        value: part.id,
        label: part.name,
      })),
    [parts],
  );

  const assetOptions = useMemo(
    () =>
      assets.map((asset) => ({
        value: asset.id,
        label:
          asset.name ||
          asset.asset_code ||
          asset.code ||
          `Perangkat ${asset.id}`,
      })),
    [assets],
  );

  // ==========================================================
  // FETCH USER PROJECTS
  // ==========================================================

  useEffect(() => {
    let active = true;

    async function fetchProjects() {
      setLoadingProjects(true);

      try {
        const response = await getCurrentUser();
        const userData = extractUser(response);

        if (!active) {
          return;
        }

        setProjects(
          Array.isArray(userData?.projects)
            ? userData.projects
            : [],
        );
      } catch (error) {
        console.error("Gagal mengambil project:", error);

        if (active) {
          toast.error(
            error?.message || "Gagal mengambil data project.",
          );
        }
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    }

    fetchProjects();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================================
  // UPDATE FORM
  // ==========================================================

  const updateFormField = useCallback((name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const handleProjectChange = useCallback(
    async (selected) => {
      setSelectedProject(selected);
      setSelectedLocation(null);
      setSelectedPart(null);
      setSelectedAsset(null);

      setLocations([]);
      setParts([]);
      setAssets([]);

      setForm((current) => ({
        ...current,
        project_id: selected?.value ?? "",
        location_id: "",
        part_id: "",
        asset_id: "",
      }));

      if (!selected?.value) {
        return;
      }

      setLoadingLocations(true);
      setLoadingParts(true);

      try {
        const [locationResponse, partResponse] =
          await Promise.all([
            getLocations(selected.value),
            getParts(selected.value),
          ]);

        setLocations(extractList(locationResponse));
        setParts(extractList(partResponse));
      } catch (error) {
        console.error(
          "Gagal memuat lokasi atau perangkat:",
          error,
        );

        toast.error(
          error?.message ||
            "Gagal mengambil lokasi dan perangkat.",
        );
      } finally {
        setLoadingLocations(false);
        setLoadingParts(false);
      }
    },
    [],
  );

  const handleLocationChange = useCallback(
    (selected) => {
      setSelectedLocation(selected);
      setSelectedPart(null);
      setSelectedAsset(null);

      setAssets([]);

      setForm((current) => ({
        ...current,
        location_id: selected?.value ?? "",
        part_id: "",
        asset_id: "",
      }));
    },
    [],
  );

  const handlePartChange = useCallback(
    async (selected) => {
      setSelectedPart(selected);
      setSelectedAsset(null);
      setAssets([]);

      setForm((current) => ({
        ...current,
        part_id: selected?.value ?? "",
        asset_id: "",
      }));

      if (!selected?.value) {
        return;
      }

      setLoadingAssets(true);

      try {
        const response = await getAssets(selected.value);
        setAssets(extractList(response));
      } catch (error) {
        console.error("Gagal mengambil perangkat:", error);

        toast.error(
          error?.message || "Gagal mengambil data perangkat.",
        );
      } finally {
        setLoadingAssets(false);
      }
    },
    [],
  );

  const handleAssetChange = useCallback((selected) => {
    setSelectedAsset(selected);

    setForm((current) => ({
      ...current,
      asset_id: selected?.value ?? "",
    }));
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0] || null;

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Lampiran harus berupa file gambar.");
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error("Ukuran foto maksimal 2 MB.");
      return;
    }

    setAttachment(file);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (
      !form.project_id ||
      !form.location_id ||
      !form.part_id ||
      !form.asset_id
    ) {
      toast.error(
        "Project, lokasi, perangkat, dan ID perangkat wajib dipilih.",
      );
      return;
    }

    if (!form.description.trim()) {
      toast.error("Deskripsi permasalahan wajib diisi.");
      return;
    }

    const validPriority = priorityOptions.some(
      (option) => option.value === form.priority,
    );

    if (!validPriority) {
      toast.error("Silakan pilih prioritas tiket yang valid.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("project_id", String(form.project_id));
      formData.append("location_id", String(form.location_id));
      formData.append("part_id", String(form.part_id));
      formData.append("asset_id", String(form.asset_id));
      formData.append("priority", form.priority);
      formData.append("description", form.description.trim());

      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await createTicket(formData);

      if (response?.assigned) {
        toast.success("Tiket berhasil dibuat dan ditugaskan.");
      } else {
        toast.success(
          "Tiket berhasil dibuat. Sistem sedang mencari staff yang tersedia.",
        );
      }

      onClose();
    } catch (error) {
      console.error("Gagal membuat tiket:", error);

      toast.error(
        error?.message || "Gagal membuat tiket baru.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        overflow-y-auto bg-black/40 p-2
        sm:p-4
      "
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ticket-title"
        className="
          my-auto max-h-[96vh] w-full
          max-w-6xl overflow-y-auto
          rounded-xl bg-white p-4 shadow-xl
          sm:max-h-[90vh] sm:p-6
        "
      >
        <form onSubmit={handleSubmit}>
          {/* HEADER */}

          <div className="mb-5 flex items-center justify-between gap-3">
            <h2
              id="create-ticket-title"
              className="text-lg font-semibold text-gray-900 sm:text-xl"
            >
              Buat Tiket Baru
            </h2>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Tutup form tiket"
              className="
                rounded-lg p-2 text-gray-500
                transition hover:bg-gray-100
                hover:text-gray-800
                disabled:opacity-50
              "
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {/* INFORMASI PERMASALAHAN */}

            <section className="min-w-0 rounded-xl border border-gray-200 p-4">
              <h3 className="mb-4 text-sm font-semibold text-gray-600">
                INFORMASI PERMASALAHAN
              </h3>

              <div className="space-y-4">
                {/* PROJECT */}

                <div className="min-w-0">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Project
                  </label>

                  <Select
                    options={projectOptions}
                    value={selectedProject}
                    onChange={handleProjectChange}
                    placeholder="Pilih atau ketik project..."
                    isSearchable
                    isClearable
                    isLoading={loadingProjects}
                    isDisabled={loading || loadingProjects}
                    styles={selectStyles}
                    menuPortalTarget={
                      typeof document !== "undefined"
                        ? document.body
                        : undefined
                    }
                  />
                </div>

                {/* LOKASI DAN PERANGKAT */}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Lokasi
                    </label>

                    <Select
                      options={locationOptions}
                      value={selectedLocation}
                      onChange={handleLocationChange}
                      placeholder="Pilih lokasi..."
                      isSearchable
                      isClearable
                      isLoading={loadingLocations}
                      isDisabled={
                        loading ||
                        !selectedProject ||
                        loadingLocations
                      }
                      styles={selectStyles}
                      menuPortalTarget={
                        typeof document !== "undefined"
                          ? document.body
                          : undefined
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Perangkat
                    </label>

                    <Select
                      options={partOptions}
                      value={selectedPart}
                      onChange={handlePartChange}
                      placeholder="Pilih perangkat..."
                      isSearchable
                      isClearable
                      isLoading={loadingParts}
                      isDisabled={
                        loading ||
                        !selectedProject ||
                        loadingParts
                      }
                      styles={selectStyles}
                      menuPortalTarget={
                        typeof document !== "undefined"
                          ? document.body
                          : undefined
                      }
                    />
                  </div>
                </div>

                {/* ID / NO PERANGKAT */}

                <div className="min-w-0">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    ID / No Perangkat
                  </label>

                  <Select
                    options={assetOptions}
                    value={selectedAsset}
                    onChange={handleAssetChange}
                    placeholder="Pilih atau ketik ID perangkat..."
                    isSearchable
                    isClearable
                    isLoading={loadingAssets}
                    isDisabled={
                      loading ||
                      !selectedPart ||
                      loadingAssets
                    }
                    styles={selectStyles}
                    menuPortalTarget={
                      typeof document !== "undefined"
                        ? document.body
                        : undefined
                    }
                  />
                </div>

                {/* DESKRIPSI */}

                <div className="min-w-0">
                  <label
                    htmlFor="ticket-description"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Deskripsi Permasalahan
                  </label>

                  <textarea
                    id="ticket-description"
                    name="description"
                    value={form.description}
                    onChange={(event) =>
                      updateFormField(
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Masukkan deskripsi masalah..."
                    rows={4}
                    maxLength={10000}
                    required
                    disabled={loading}
                    className="
                      w-full rounded-lg border
                      border-gray-300 px-3 py-2.5
                      text-sm outline-none
                      focus:border-orange-400
                      focus:ring-2 focus:ring-orange-100
                      disabled:bg-gray-50
                    "
                  />
                </div>

                {/* ATTACHMENT */}

                <div className="min-w-0">
                  <label
                    htmlFor="ticket-attachment"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Bukti Foto Masalah (Opsional)
                  </label>

                  <label
                    htmlFor="ticket-attachment"
                    className="
                      flex cursor-pointer items-center
                      gap-3 rounded-lg border
                      border-gray-300 px-3 py-3
                      text-sm text-gray-600
                      transition hover:bg-gray-50
                    "
                  >
                    <FiUpload size={18} />

                    <span className="min-w-0 flex-1 break-words">
                      {attachment
                        ? attachment.name
                        : "Pilih gambar, maksimal 2 MB"}
                    </span>

                    <input
                      id="ticket-attachment"
                      type="file"
                      accept="image/*"
                      disabled={loading}
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>

                  {preview && (
                    <div className="mt-3 flex items-start gap-3">
                      <img
                        src={preview}
                        alt="Pratinjau bukti masalah"
                        className="
                          h-24 w-24 rounded-lg
                          border border-gray-200
                          object-cover
                        "
                      />

                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        disabled={loading}
                        className="
                          inline-flex items-center
                          gap-1 rounded-lg px-3 py-2
                          text-xs font-medium
                          text-red-600 hover:bg-red-50
                        "
                      >
                        <FiX size={14} />
                        Hapus gambar
                      </button>
                    </div>
                  )}

                  <p className="mt-1 text-xs text-gray-400">
                    Format gambar didukung oleh backend,
                    dengan ukuran maksimal 2 MB.
                  </p>
                </div>
              </div>
            </section>

            {/* ASSIGN TO USER */}

            <section className="min-w-0 rounded-xl border border-gray-200 p-4">
              <h3 className="mb-4 text-sm font-semibold text-gray-600">
                ASSIGN TO USER
              </h3>

              <div className="space-y-4">
                {/* PELAPOR */}

                <div>
                  <label
                    htmlFor="ticket-reporter"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Nama Pelapor
                  </label>

                  <input
                    id="ticket-reporter"
                    value={currentUser?.name || "-"}
                    disabled
                    readOnly
                    className="
                      w-full rounded-lg border
                      border-gray-200 bg-gray-100
                      px-3 py-2.5 text-sm text-gray-700
                    "
                  />
                </div>

                {/* STATUS */}

                <div>
                  <label
                    htmlFor="ticket-status"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>

                  <input
                    id="ticket-status"
                    value="OPEN"
                    disabled
                    readOnly
                    className="
                      w-full rounded-lg border
                      border-gray-200 bg-gray-100
                      px-3 py-2.5 text-sm text-gray-700
                    "
                  />
                </div>

                {/* PRIORITAS */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Prioritas
                  </label>

                  <Select
                    options={priorityOptions}
                    value={
                      priorityOptions.find(
                        (option) =>
                          option.value === form.priority,
                      ) || priorityOptions[0]
                    }
                    onChange={(selected) => {
                      if (selected) {
                        updateFormField(
                          "priority",
                          selected.value,
                        );
                      }
                    }}
                    isSearchable={false}
                    isDisabled={loading}
                    styles={selectStyles}
                    menuPortalTarget={
                      typeof document !== "undefined"
                        ? document.body
                        : undefined
                    }
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Durasi SLA mengikuti konfigurasi
                    Administrator dan berlaku pada tiket baru.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* FOOTER */}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                rounded-lg border border-gray-300
                px-5 py-2.5 text-sm font-medium
                text-gray-700 transition
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                loadingProjects ||
                loadingLocations ||
                loadingParts ||
                loadingAssets
              }
              className="
                rounded-lg px-5 py-2.5
                text-sm font-semibold text-white
                shadow-sm transition hover:brightness-95
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              style={{
                backgroundColor: primaryColor,
              }}
            >
              {loading ? "Menyimpan..." : "Buat Tiket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}