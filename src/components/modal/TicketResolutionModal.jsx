import { useState, useEffect, useRef } from "react";
import {
  createTicketResolution,
  getTicketResolution,
  reassignTicketToOnlineStaff,
} from "../../services/ticketService";

import Select from "react-select";
import useTicketSocket from "../../hooks/useTicketSocket";
import { ROLE } from "../../constants/role";
import {
  FiDownload,
  FiExternalLink,
  FiImage,
  FiSend,
  FiX,
} from "react-icons/fi";

const MAX_RESOLUTION_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const parseSlaDate = (value) => {
  if (!value) return null;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const normalized = String(value).trim().replace(" ", "T");
  const fallback = new Date(normalized);

  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const parseSlaCompletionDate = (value) => {
  if (!value) return null;

  const normalized = String(value)
    .trim()
    .replace(" ", "T");

  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(
    normalized,
  );

  if (hasTimezone) {
    const parsed = new Date(normalized);

    return Number.isNaN(parsed.getTime())
      ? null
      : parsed;
  }

  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?/,
  );

  if (match) {
    const [, year, month, day, hour, minute, second = "0"] =
      match;

    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    return Number.isNaN(parsed.getTime())
      ? null
      : parsed;
  }

  return parseSlaDate(value);
};

const formatSlaRemaining = (totalSeconds) => {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours} jam ${minutes} menit`;
  if (minutes > 0) return `${minutes} menit ${remainingSeconds} detik`;
  return `${remainingSeconds} detik`;
};

export default function TicketResolutionModal({ ticket, onClose, onSuccess, role }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [problemImageError, setProblemImageError] = useState(false);
  const fileInputRef = useRef(null);
  const [resolution, setResolution] = useState(null);
  const getNowLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const isUser = Number(role) === ROLE.USER;
  const isStaff = Number(role) === ROLE.STAFF;
  const [reassignJustification, setReassignJustification] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [showReassignForm, setShowReassignForm] = useState(false);
  const isLockedForAdmin = ["RESOLVED", "CLOSED", "CANCEL"].includes(ticket.status);
  const isReadOnly = isUser || isLockedForAdmin;
  const [slaNow, setSlaNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSlaNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const ticketStatus = String(ticket?.status || "").toUpperCase();

  const slaDueAt = parseSlaDate(
    ticket?.due_at ?? ticket?.DueAt,
  );

  const slaCompletionAt =
    parseSlaCompletionDate(
      resolution?.completion_time ||
        resolution?.completionTime,
    ) ||
    parseSlaDate(
      ticket?.resolved_at ?? ticket?.ResolvedAt,
    );

  let slaIndicator = null;

  if (slaDueAt) {
    if (
      ticketStatus === "OPEN" ||
      ticketStatus === "IN_PROGRESS"
    ) {
      const remainingSeconds =
        (slaDueAt.getTime() - slaNow.getTime()) / 1000;

      slaIndicator =
        remainingSeconds <= 0
          ? {
              label: "SLA Remaining:",
              value: "Overdue",
              overdue: true,
            }
          : {
              label: "SLA Remaining:",
              value: formatSlaRemaining(remainingSeconds),
              overdue: false,
            };
    } else if (
      ["RESOLVED", "CLOSED"].includes(ticketStatus)
    ) {
      if (!slaCompletionAt) {
        slaIndicator = {
          label: "SLA Status:",
          value: "-",
          overdue: false,
        };
      } else {
        const overdue =
          slaCompletionAt.getTime() > slaDueAt.getTime();

        slaIndicator = {
          label: "SLA Status:",
          value: overdue ? "Overdue" : "-",
          overdue,
        };
      }
    }
  }

  useEffect(() => {
    if (!preview || !preview.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    setProblemImageError(false);
  }, [ticket?.attachment_url, ticket?.attachment]);

  useEffect(() => {
    if (ticket?.id) {
      fetchResolution();
    }
  }, [ticket?.id]);

  const formatDatetimeLocal = (dateString) => {
    if (!dateString) return "";

    const value = String(dateString)
      .trim()
      .replace(" ", "T");

    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);

    if (hasTimezone) {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      const localDate = new Date(
        date.getTime() -
          date.getTimezoneOffset() * 60_000,
      );

      return localDate.toISOString().slice(0, 16);
    }

    const match = value.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
    );

    if (match) {
      const [, year, month, day, hour, minute] = match;

      return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const localDate = new Date(
      date.getTime() -
        date.getTimezoneOffset() * 60_000,
    );

    return localDate.toISOString().slice(0, 16);
  };

  const fetchResolution = async () => {
    try {
      const data = await getTicketResolution(ticket.id);

      if (!data) {
        setResolution(null);
        return;
      }

      setResolution(data);

      // Mendukung data resolusi lama (Cause/Solution relation)
      // dan data baru yang disimpan sebagai teks bebas.
      const causeText = String(
        data.custom_cause ||
          data.CustomCause ||
          data.cause?.name ||
          data.Cause?.name ||
          "",
      ).trim();

      const solutionText = String(
        data.custom_solution ||
          data.CustomSolution ||
          data.solution?.name ||
          data.Solution?.name ||
          "",
      ).trim();

      setForm((prev) => ({
        ...prev,
        cause: causeText,
        custom_solution: solutionText,
        notes: data.resolution_notes || "",
        resolution_time: formatDatetimeLocal(data.completion_time),
        status: "RESOLVED",
      }));
    } catch (err) {
      console.error("[TICKET RESOLUTION] Gagal mengambil resolusi:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setResolutionAttachment = (file) => {
    if (!file) return;

    if (!file.type || !file.type.startsWith("image/")) {
      alert("File yang diunggah harus berupa gambar.");
      return;
    }

    if (file.size > MAX_RESOLUTION_ATTACHMENT_SIZE) {
      alert("Ukuran foto penyelesaian maksimal 10 MB.");
      return;
    }

    setAttachment(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setResolutionAttachment(file);

    // Memungkinkan memilih file yang sama kembali setelah dihapus.
    e.target.value = "";
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );

    if (!imageItem) return;

    const pastedBlob = imageItem.getAsFile();
    if (!pastedBlob) return;

    e.preventDefault();

    const subtype = (pastedBlob.type.split("/")[1] || "png").toLowerCase();
    const extension = subtype === "jpeg" ? "jpg" : subtype;
    const pastedFile = new File(
      [pastedBlob],
      `resolution-${Date.now()}.${extension}`,
      { type: pastedBlob.type },
    );

    setResolutionAttachment(pastedFile);
  };

  const clearSelectedAttachment = () => {
    setAttachment(null);
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (isUser || isReadOnly || loading) {
      return;
    }

    const cause = String(form.cause || "").trim();
    const solution = String(form.custom_solution || "").trim();

    if (!cause) {
      alert("Penyebab wajib diisi.");
      return;
    }

    if (cause.length > 2000) {
      alert("Penyebab maksimal 2000 karakter.");
      return;
    }

    if (!solution) {
      alert("Solusi wajib diisi.");
      return;
    }

    if (solution.length > 2000) {
      alert("Solusi maksimal 2000 karakter.");
      return;
    }

    if (!form.resolution_time) {
      alert("Waktu penyelesaian wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("custom_cause", cause);
      formData.append("custom_solution", solution);
      formData.append("resolution_notes", form.notes || "");
      formData.append("completion_time", form.resolution_time);
      formData.append("status", "RESOLVED");

      if (attachment) {
        formData.append("attachment", attachment);
      }

      await createTicketResolution(ticket.id, formData);

      clearSelectedAttachment();
      await fetchResolution();

      alert("Ticket berhasil disimpan!");
      onSuccess();
    } catch (err) {
      console.error("[TICKET RESOLUTION] Gagal menyimpan:", err);
      alert(err.message || "Gagal menyimpan resolusi tiket.");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "RESOLVED", label: "RESOLVED" },
  ];

  const handleReassignToOnlineStaff = async () => {
    const justification = reassignJustification.trim();

    if (!justification) {
      alert("Justifikasi reassign wajib diisi.");
      return;
    }

    if (justification.length > 1000) {
      alert("Justifikasi maksimal 1000 karakter.");
      return;
    }

    if (
      !window.confirm(
        "Apakah Anda yakin ingin mengalihkan ticket ke Staff CCIT lain?",
      )
    ) {
      return;
    }

    try {
      setReassignLoading(true);

      const result = await reassignTicketToOnlineStaff(ticket.id, {
        justification,
      });

      const staffName =
        result?.staff_name ||
        result?.data?.staff_assigned_to_name ||
        "Staff online";

      alert(`Ticket berhasil dialihkan kepada ${staffName}.`);

      setReassignJustification("");

      onSuccess();
      onClose();
    } catch (err) {
      console.error("[REASSIGN] Gagal:", err);
      alert(err.message || "Gagal melakukan reassign ticket.");
    } finally {
      setReassignLoading(false);
    }
  };

  const resolveAttachmentUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    const rawUrl = value.trim();

    if (
      /^(https?:)?\/\//i.test(rawUrl) ||
      /^(data:|blob:)/i.test(rawUrl)
    ) {
      return rawUrl;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "";
    let apiOrigin = "";

    try {
      apiOrigin = new URL(apiUrl).origin;
    } catch {
      apiOrigin = apiUrl.replace(/\/v1\/?$/, "").replace(/\/+$/, "");
    }

    const path = rawUrl
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    return apiOrigin ? `${apiOrigin}/${path}` : `/${path}`;
  };

  const problemAttachmentUrl = resolveAttachmentUrl(
    ticket?.attachment_url ||
      ticket?.attachment ||
      ticket?.Attachment,
  );

  const resolutionAttachmentUrl = resolveAttachmentUrl(
    resolution?.attachment_url ||
      resolution?.attachment ||
      resolution?.AttachmentURL,
  );

  const getFileExtension = (url) => {
    try {
      const pathname = new URL(url, window.location.origin).pathname;
      const fileName = pathname.split("/").filter(Boolean).pop() || "";

      const extension = fileName.includes(".")
        ? fileName.split(".").pop()
        : "jpg";

      return /^[a-z0-9]{1,8}$/i.test(extension)
        ? extension.toLowerCase()
        : "jpg";
    } catch {
      return "jpg";
    }
  };

  const handleDownloadImage = async (
    url,
    label = "penyelesaian",
  ) => {
    try {
      const fullUrl = resolveAttachmentUrl(url);

      if (!fullUrl) {
        throw new Error("URL gambar tidak ditemukan.");
      }

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Gagal mengunduh gambar (${response.status}).`,
        );
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download =
        `ticket-${ticket.ticket_code}-${label}.` +
        getFileExtension(fullUrl);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error("[DOWNLOAD IMAGE] Gagal:", err);
      alert(err.message || "Gagal mengunduh gambar.");
    }
  };

  const [form, setForm] = useState({
    cause: "",
    custom_solution: "",
    resolution_time: getNowLocal(),
    notes: "",
    status: "RESOLVED",
  });

  useTicketSocket({
    onStatusUpdate: (data) => {
      if (data.id !== ticket.id) return;

      setForm((prev) => ({
        ...prev,
        status: data.status,
      }));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-lg sm:p-6">
        {/* HEADER */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Tiket #{ticket.ticket_code}
            </h2>

            {slaIndicator && (
              <p className="text-sm text-gray-500">
                {slaIndicator.label}{" "}
                <span
                  className={
                    slaIndicator.overdue
                      ? "font-medium text-red-500"
                      : "font-medium text-emerald-600"
                  }
                >
                  {slaIndicator.value}
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* INFORMASI MASALAH DAN PELAPOR */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* INFORMASI MASALAH */}
          <div className="min-w-0 rounded-xl border p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-600">
              INFORMASI MASALAH
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Project
                </label>

                <input
                  value={ticket.project_name || "-"}
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Lokasi
                  </label>

                  <input
                    value={ticket.location_name || "-"}
                    disabled
                    className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex min-w-0 flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Perangkat
                  </label>

                  <input
                    value={ticket.part_name || "-"}
                    disabled
                    className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  ID / No Perangkat
                </label>

                <input
                  value={ticket.asset_code || "-"}
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-3 py-2"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Deskripsi Permasalahan
                </label>

                <textarea
                  value={ticket.description || "-"}
                  disabled
                  rows={3}
                  className="w-full resize-y rounded-lg border bg-gray-100 px-3 py-2"
                />
              </div>

              {/* FOTO PERMASALAHAN */}
              <div className="flex min-w-0 flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Bukti Foto Masalah
                </label>

                {problemAttachmentUrl && !problemImageError ? (
                  <div className="mt-2 flex flex-col items-start gap-3">
                    <a
                      href={problemAttachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                      title="Buka foto masalah"
                    >
                      <img
                        src={problemAttachmentUrl}
                        alt="Bukti foto masalah"
                        onError={() => setProblemImageError(true)}
                        className="h-40 w-40 rounded-lg border border-gray-200 object-cover"
                      />
                    </a>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={problemAttachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        <FiExternalLink size={16} />
                        Buka Gambar
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadImage(
                            problemAttachmentUrl,
                            "masalah",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                      >
                        <FiDownload size={16} />
                        Unduh Gambar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 text-center">
                    <p className="text-xs text-gray-500">
                      {problemAttachmentUrl
                        ? "Gambar tidak dapat dimuat"
                        : "Tidak ada lampiran foto"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* INFORMASI PELAPOR */}
          <div className="min-w-0 rounded-xl border p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-600">
              User Pelapor
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Nama Pelapor
                </label>

                <input
                  value={ticket.reporter_name || "-"}
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-3 py-2"
                />
              </div>

              {/* STATUS */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>

                <Select
                  options={statusOptions}
                  placeholder="Pilih Status"
                  value={statusOptions[0]}
                  isDisabled={isReadOnly || loading}
                  isSearchable={false}
                  isClearable={false}
                  onChange={(selected) => {
                    if (selected?.value === "RESOLVED") {
                      setForm((prev) => ({
                        ...prev,
                        status: "RESOLVED",
                      }));
                    }
                  }}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Prioritas
                </label>

                <input
                  value={ticket.priority || "-"}
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-3 py-2"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Nama Staff
                </label>

                <input
                  value={
                    ticket.staff_assigned_to_name ||
                    ticket.assigned_to_name ||
                    "-"
                  }
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PENYELESAIAN */}
        <div className="mt-5 rounded-xl border border-green-100 bg-green-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-green-700">
            PENYELESAIAN
          </h3>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* PENYEBAB */}
            <div className="flex min-w-0 flex-col">
              <label
                htmlFor="resolution-cause"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                Penyebab
                <span className="ml-1 text-red-500">*</span>
              </label>

              <textarea
                id="resolution-cause"
                name="cause"
                value={form.cause || ""}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                rows={4}
                maxLength={2000}
                required
                placeholder="Tuliskan penyebab permasalahan..."
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <p className="mt-1 text-right text-xs text-gray-500">
                {(form.cause || "").length}/2000 karakter
              </p>
            </div>

            {/* SOLUSI */}
            <div className="flex min-w-0 flex-col">
              <label
                htmlFor="custom-solution"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                Solusi
                <span className="ml-1 text-red-500">*</span>
              </label>

              <textarea
                id="custom-solution"
                name="custom_solution"
                value={form.custom_solution || ""}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                rows={4}
                maxLength={2000}
                required
                placeholder="Tuliskan solusi penyelesaian masalah..."
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <p className="mt-1 text-right text-xs text-gray-500">
                {(form.custom_solution || "").length}/2000 karakter
              </p>
            </div>

            {/* WAKTU PENYELESAIAN */}
            <div className="flex min-w-0 flex-col lg:col-span-2">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Waktu Penyelesaian
              </label>

              <input
                type="datetime-local"
                name="resolution_time"
                value={form.resolution_time}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* UPLOAD FOTO PENYELESAIAN */}
            <div className="flex min-w-0 flex-col lg:col-span-2">
              <label
                htmlFor="resolution-attachment"
                className="mb-2 text-sm font-medium text-gray-700"
              >
                Upload Foto Penyelesaian
              </label>

              <div
                tabIndex={0}
                onPaste={handlePaste}
                className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-4 outline-none focus:ring-2 focus:ring-green-200"
              >
                <div className="flex items-start gap-3">
                  <FiImage
                    className="mt-0.5 shrink-0 text-gray-500"
                    size={20}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      Upload foto sesudah (opsional).
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Format gambar JPG, JPEG, atau PNG. Maksimal 10 MB.
                    </p>
                  </div>
                </div>

                {!isReadOnly && (
                  <input
                    ref={fileInputRef}
                    id="resolution-attachment"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="block w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                )}

                {/* PREVIEW FOTO BARU */}
                {preview && attachment && (
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <img
                      src={preview}
                      alt="Preview foto penyelesaian yang akan diunggah"
                      className="h-40 w-40 rounded-lg border border-gray-200 object-cover"
                    />

                    <div className="min-w-0">
                      <p className="max-w-xs break-all text-sm text-gray-700">
                        {attachment.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={clearSelectedAttachment}
                          disabled={loading}
                          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <FiX size={16} />
                          Hapus Pilihan
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FOTO PENYELESAIAN YANG SUDAH TERSIMPAN */}
            {resolutionAttachmentUrl && (
              <div className="flex min-w-0 flex-col lg:col-span-2">
                <label className="mb-2 text-sm font-medium text-gray-700">
                  Bukti Foto Penyelesaian
                </label>

                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start">
                  <a
                    href={resolutionAttachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka foto penyelesaian"
                  >
                    <img
                      src={resolutionAttachmentUrl}
                      alt="Bukti foto penyelesaian yang sudah tersimpan"
                      className="h-40 w-40 rounded-lg border border-gray-200 object-cover"
                    />
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadImage(
                        resolutionAttachmentUrl,
                        "penyelesaian",
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700"
                  >
                    <FiDownload size={16} />
                    Unduh Gambar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REASSIGN STAFF CCIT */}
        {isStaff && !isLockedForAdmin && (
          <div className="mt-5">
            {!showReassignForm ? (
              <button
                type="button"
                onClick={() => setShowReassignForm(true)}
                disabled={loading || reassignLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiSend size={18} />
                Alihkan Ticket ke Staff Lain
              </button>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-amber-800">
                  Justifikasi Reassign
                </h3>

                <p className="mb-3 text-sm text-gray-600">
                  Jelaskan alasan ticket perlu dialihkan. Sistem akan
                  memilih Staff lain yang sedang online secara otomatis.
                </p>

                <textarea
                  id="reassign-justification"
                  value={reassignJustification}
                  onChange={(e) =>
                    setReassignJustification(e.target.value)
                  }
                  maxLength={1000}
                  rows={3}
                  required
                  disabled={reassignLoading}
                  autoFocus
                  placeholder="Tuliskan justifikasi pengalihan ticket..."
                  className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-gray-100"
                />

                <div className="mt-1 text-right text-xs text-gray-500">
                  {reassignJustification.length}/1000 karakter
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReassignForm(false);
                      setReassignJustification("");
                    }}
                    disabled={reassignLoading}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={handleReassignToOnlineStaff}
                    disabled={
                      reassignLoading ||
                      loading ||
                      !reassignJustification.trim()
                    }
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {reassignLoading
                      ? "Mengalihkan..."
                      : "Reassign Staff"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isLockedForAdmin && (
          <p className="mt-4 text-right text-sm text-gray-500">
            Ticket sudah selesai, data tidak dapat diubah.
          </p>
        )}

        {/* FOOTER */}
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            Batal
          </button>

          {/* SIMPAN PERUBAHAN */}
          {!isUser && !isLockedForAdmin && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || reassignLoading}
              className={`rounded-lg px-4 py-2 text-white ${
                loading
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Memproses..." : "Simpan Perubahan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}