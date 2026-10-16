import { useState, useEffect, useRef } from "react";
import {
  getCauses,
  getSolutions,
  updateTicketStatusOnly,
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

export default function TicketResolutionModal({
  ticket,
  onClose,
  onSuccess,
  role,
}) {
  const [loading, setLoading] = useState(false);
  const [causes, setCauses] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [selectedCause, setSelectedCause] = useState(null);
  const [selectedSolution, setSelectedSolution] = useState(null);

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

  const [form, setForm] = useState({
    cause: "",
    solution: "",
    resolution_time: getNowLocal(),
    notes: "",
    onhold_notes: "",
    status: ticket?.status || "OPEN",
  });

  const isUser = Number(role) === ROLE.USER;
  const isStaff = Number(role) === ROLE.STAFF;

  const [reassignJustification, setReassignJustification] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [showReassignForm, setShowReassignForm] = useState(false);

  const isLockedForAdmin = ["RESOLVED", "CLOSED"].includes(ticket.status);
  const isReadOnly = isUser || isLockedForAdmin;

  // Bersihkan URL preview lokal ketika preview diganti atau modal ditutup.
  useEffect(() => {
    if (!preview || !preview.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Reset status error gambar ketika lampiran tiket berubah.
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

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().slice(0, 16);
  };

  const fetchResolution = async () => {
    try {
      const partId = ticket.part_id || ticket.part?.id;
      let causeList = [];

      // Penyebab bergantung pada part, tetapi data resolusi tetap
      // perlu diambil meskipun part_id tidak tersedia.
      if (partId) {
        const causeRes = await getCauses(partId);
        causeList = causeRes.data || [];
      }

      setCauses(causeList);

      const res = await getTicketResolution(ticket.id);
      const data = res;

      if (!data) {
        setResolution(null);
        return;
      }

      setResolution(data);

      const foundCause = causeList.find(
        (cause) => String(cause.id) === String(data.cause_id),
      );

      if (foundCause) {
        const causeOption = {
          value: foundCause.id,
          label: foundCause.name,
        };

        setSelectedCause(causeOption);

        const solRes = await getSolutions(foundCause.id);
        const solList = solRes.data || [];

        setSolutions(solList);

        const foundSolution = solList.find(
          (solution) =>
            String(solution.id) === String(data.solution_id),
        );

        if (foundSolution) {
          setSelectedSolution({
            value: foundSolution.id,
            label: foundSolution.name,
          });
        } else {
          setSelectedSolution(null);
        }
      } else {
        setSelectedCause(null);
        setSelectedSolution(null);
        setSolutions([]);
      }

      setForm((prev) => ({
        ...prev,
        cause: data.cause_id || "",
        solution: data.solution_id || "",
        notes: data.resolution_notes || "",
        resolution_time: formatDatetimeLocal(data.completion_time),
        status: ticket.status,
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

  // Menangani pemilihan foto penyelesaian.
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setAttachment(null);
      setPreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("File yang diunggah harus berupa gambar.");

      e.target.value = "";
      setAttachment(null);
      setPreview(null);
      return;
    }

    setAttachment(file);
    setPreview(URL.createObjectURL(file));
  };

  // Menghapus foto yang dipilih sebelum disimpan.
  const clearSelectedAttachment = () => {
    setAttachment(null);
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (isUser || isReadOnly) {
      return;
    }

    if (form.status === "RESOLVED") {
      if (!form.cause || !form.solution) {
        alert("Penyebab dan solusi wajib diisi!");
        return;
      }

      if (!form.resolution_time) {
        alert("Waktu penyelesaian wajib diisi!");
        return;
      }
    }

    try {
      setLoading(true);

      // Update status ONHOLD tidak membutuhkan foto penyelesaian.
      if (form.status === "ONHOLD") {
        await updateTicketStatusOnly(ticket.id, {
          status: form.status,
          onhold_notes: form.onhold_notes,
        });

        alert("Ticket berhasil diubah menjadi ONHOLD!");

        onSuccess();
        onClose();
        return;
      }

      const formData = new FormData();

      formData.append("cause_id", form.cause);
      formData.append("solution_id", form.solution);
      formData.append("resolution_notes", form.notes);
      formData.append("completion_time", form.resolution_time);
      formData.append("status", form.status);

      // Nama field harus tetap sama dengan yang diterima backend.
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

  const causeOptions = causes.map((cause) => ({
    value: cause.id,
    label: cause.name,
  }));

  const solutionOptions = solutions.map((solution) => ({
    value: solution.id,
    label: solution.name,
  }));

  const statusOptions = [
    { value: "RESOLVED", label: "RESOLVED" },
    { value: "ONHOLD", label: "ONHOLD" },
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

  const handleCloseAsUser = async () => {
    if (!isUser || ticket.status !== "RESOLVED") {
      return;
    }

    try {
      setLoading(true);

      await updateTicketStatusOnly(ticket.id, {
        status: "CLOSED",
      });

      alert("Ticket berhasil diubah menjadi CLOSED!");

      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || "Gagal menutup ticket.");
    } finally {
      setLoading(false);
    }
  };

  // Samakan pembentukan URL gambar dengan TicketDetail.jsx.
  const resolveAttachmentUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    const rawUrl = value.trim();

    // URL absolut, protocol-relative, data URL, atau blob URL.
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
      // Fallback jika VITE_API_URL bukan URL absolut.
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

      // Jangan mencabut URL sebelum browser memulai proses unduhan.
      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error("[DOWNLOAD IMAGE] Gagal:", err);
      alert(err.message || "Gagal mengunduh gambar.");
    }
  };

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

            <p className="text-sm text-gray-500">
              SLA Remaining:{" "}
              <span className="text-red-500">Overdue</span>
            </p>
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
                  value={statusOptions.find(
                    (status) => status.value === form.status,
                  )}
                  isDisabled={isReadOnly || loading}
                  onChange={(selected) => {
                    if (!selected) return;

                    const newStatus = selected.value;

                    setForm((prev) => ({
                      ...prev,
                      status: newStatus,
                      ...(newStatus === "ONHOLD"
                        ? {
                            cause: "",
                            solution: "",
                            resolution_time: "",
                          }
                        : {}),
                    }));

                    if (newStatus === "ONHOLD") {
                      setSelectedCause(null);
                      setSelectedSolution(null);
                      setAttachment(null);
                      setPreview(null);

                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
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
            {form.status !== "ONHOLD" && (
              <>
                {/* PENYEBAB */}
                <div className="flex min-w-0 flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Penyebab
                  </label>

                  <Select
                    options={causeOptions}
                    value={selectedCause}
                    isDisabled={isReadOnly || loading}
                    onChange={async (selected) => {
                      setSelectedCause(selected);
                      setSelectedSolution(null);

                      setForm((prev) => ({
                        ...prev,
                        cause: selected?.value || "",
                        solution: "",
                      }));

                      if (!selected?.value) {
                        setSolutions([]);
                        return;
                      }

                      try {
                        const res = await getSolutions(selected.value);
                        setSolutions(res.data || []);
                      } catch (err) {
                        console.error(
                          "Gagal mengambil daftar solusi:",
                          err,
                        );
                        setSolutions([]);
                      }
                    }}
                    placeholder="Pilih atau ketik penyebab..."
                    isSearchable
                    className="w-full"
                    classNamePrefix="ticket-select"
                  />
                </div>

                {/* SOLUSI */}
                <div className="flex min-w-0 flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Solusi
                  </label>

                  <Select
                    options={solutionOptions}
                    value={selectedSolution}
                    isDisabled={isReadOnly || loading}
                    onChange={(selected) => {
                      setSelectedSolution(selected);

                      setForm((prev) => ({
                        ...prev,
                        solution: selected?.value || "",
                      }));
                    }}
                    placeholder="Pilih atau ketik solusi..."
                    isSearchable
                    className="w-full"
                    classNamePrefix="ticket-select"
                  />
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
              </>
            )}

            {/* CATATAN ONHOLD */}
            {form.status === "ONHOLD" && (
              <div className="flex min-w-0 flex-col lg:col-span-2">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Catatan ONHOLD
                </label>

                <textarea
                  name="onhold_notes"
                  value={
                    form.onhold_notes || ticket.onhold_notes || ""
                  }
                  onChange={handleChange}
                  disabled={isReadOnly || loading}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            )}

            {/* UPLOAD FOTO PENYELESAIAN */}
            {form.status !== "ONHOLD" && (
              <div className="flex min-w-0 flex-col lg:col-span-2">
                <label
                  htmlFor="resolution-attachment"
                  className="mb-2 text-sm font-medium text-gray-700"
                >
                  Upload Foto Penyelesaian
                </label>

                <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-4">
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
                        Format gambar JPG, JPEG, atau PNG.
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
            )}

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

          {/* USER MENUTUP TIKET */}
          {isUser && ticket.status === "RESOLVED" && (
            <button
              type="button"
              onClick={handleCloseAsUser}
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Close Ticket"}
            </button>
          )}

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
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}