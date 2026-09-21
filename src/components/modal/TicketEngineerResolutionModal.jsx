import { useEffect, useState } from "react";
import {createEngineerTicketResolution, getTicketReassignment, getEngineerTicketResolution} from "../../services/ticketService";
import { FiDownload, FiExternalLink } from "react-icons/fi";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function TicketEngineerResolutionModal({ticket, onClose, onSuccess}) {
  const [solution, setSolution] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reassignment, setReassignment] = useState(null);
  const [engineerResolution, setEngineerResolution] = useState(null);
  const [loadingResolution, setLoadingResolution] = useState(false);
  const [loadingReassignment, setLoadingReassignment] = useState(false);

  useEffect(() => {
    if (!ticket?.id) {
      setReassignment(null);
      setEngineerResolution(null);
      setSolution("");
      setFiles([]);

      return;
    }

    const fetchModalData = async () => {
      setLoadingReassignment(true);
      setLoadingResolution(true);

      try {
        const [
          reassignmentResponse,
          engineerResolutionResponse
        ] = await Promise.allSettled([
          getTicketReassignment(ticket.id),
          getEngineerTicketResolution(ticket.id)
        ]);

        // DATA REASSIGNMENT
        if (
          reassignmentResponse.status === "fulfilled"
        ) {
          console.log(
            "REASSIGNMENT:",
            reassignmentResponse.value
          );

          setReassignment(
            reassignmentResponse.value ?? null
          );
        } else {
          console.error(
            "Failed to fetch reassignment:",
            reassignmentResponse.reason
          );

          setReassignment(null);
        }

        // DATA ENGINEER RESOLUTION
        if (
          engineerResolutionResponse.status ===
          "fulfilled"
        ) {
          console.log(
            "ENGINEER RESOLUTION:",
            engineerResolutionResponse.value
          );

          const resolution =
            engineerResolutionResponse.value ?? null;

          setEngineerResolution(resolution);

          setSolution(
            resolution?.solution || ""
          );

          setFiles([]);
        } else {
          console.error(
            "Failed to fetch engineer resolution:",
            engineerResolutionResponse.reason
          );

          setEngineerResolution(null);
          setSolution("");
          setFiles([]);
        }
      } finally {
        setLoadingReassignment(false);
        setLoadingResolution(false);
      }
    };

    fetchModalData();
  }, [ticket?.id]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(
      e.target.files || []
    );

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      if (file.size <= MAX_FILE_SIZE) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      alert(
        `File berikut melebihi ukuran maksimal 10MB:\n\n${invalidFiles
          .map((file) => file.name)
          .join("\n")}`
      );
    }

    setFiles((prevFiles) => [
      ...prevFiles,
      ...validFiles,
    ]);

    e.target.value = "";
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter(
        (_, index) => index !== indexToRemove
      )
    );
  };

  const formatFileSize = (size) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-600";

      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-600";

      case "RESOLVED":
        return "bg-green-100 text-green-600";

      case "CLOSED":
        return "bg-gray-100 text-gray-600";

      case "ONHOLD":
        return "bg-orange-100 text-orange-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-600";

      case "HIGH":
        return "bg-orange-100 text-orange-600";

      case "MEDIUM":
        return "bg-yellow-100 text-yellow-600";

      case "LOW":
        return "bg-green-100 text-green-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const downloadFile = async (file) => {
    try {
      const fileUrl =
        file.file_url || file.fileUrl;
  
      const fileName =
        file.file_name ||
        file.fileName ||
        "attachment";
  
      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Gagal mengunduh file");
      }
  
      const blob = await response.blob();
  
      const url = window.URL.createObjectURL(blob);
  
      const anchor = document.createElement("a");
  
      anchor.href = url;
      anchor.download = fileName;
  
      document.body.appendChild(anchor);
  
      anchor.click();
  
      anchor.remove();
  
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[DOWNLOAD] Error:", err);
  
      // fallback
      const fileUrl =
        file.file_url || file.fileUrl;
  
      window.open(
        fileUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!solution.trim()) {
      alert("Solution wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();

      formData.append(
        "solution",
        solution.trim()
      );

      files.forEach((file) => {
        formData.append(
          "attachments",
          file
        );
      });

      await createEngineerTicketResolution(
        ticket.id,
        formData
      );

      alert(
        "Resolution Engineer berhasil disimpan"
      );

      setSolution("");
      setFiles([]);

      onSuccess?.();
      onClose?.();

    } catch (error) {
      console.error(
        "Failed to create engineer resolution:",
        error
      );

      alert(
        error?.message ||
          "Gagal menyimpan resolution engineer"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-lg overflow-y-auto max-h-[90vh]">

        {/* HEADER */}
        <div className="flex justify-between items-start px-6 pt-5 pb-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Resolution Engineer
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Ticket #{ticket.ticket_code}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-800 text-lg disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6">

          {/* INFORMASI TICKET */}
          <div className="border rounded-xl p-4">

            <h3 className="text-sm font-semibold mb-4 text-gray-600">
              INFORMASI TICKET
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* PROJECT */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Project
                </label>

                <input
                  value={
                    ticket.project_name || "-"
                  }
                  disabled
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm"
                />
              </div>

              {/* LOKASI */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Lokasi
                </label>

                <input
                  value={
                    ticket.location_name || "-"
                  }
                  disabled
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm"
                />
              </div>

              {/* PERANGKAT */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Perangkat
                </label>

                <input
                  value={
                    ticket.part_name || "-"
                  }
                  disabled
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm"
                />
              </div>

              {/* ASSET */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  ID / No Perangkat
                </label>

                <input
                  value={
                    ticket.asset_code || "-"
                  }
                  disabled
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm"
                />
              </div>

              {/* REPORTER */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Nama Pelapor
                </label>

                <input
                  value={
                    ticket.reporter_name || "-"
                  }
                  disabled
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm"
                />
              </div>

              {/* ENGINEER */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Engineer
                </label>

                <input
                  value={
                    ticket.assigned_to_name ||
                    "-"
                  }
                  disabled
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm"
                />
              </div>

              {/* PRIORITY */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Prioritas
                </label>

                <div className="mt-1">
                  <span
                    className={`inline-flex px-3 py-2 rounded-lg text-xs font-semibold ${getPriorityClass(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority || "-"}
                  </span>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>

                <div className="mt-1">
                  <span
                    className={`inline-flex px-3 py-2 rounded-lg text-xs font-semibold ${getStatusClass(
                      ticket.status
                    )}`}
                  >
                    {ticket.status || "-"}
                  </span>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Deskripsi Permasalahan
                </label>

                <textarea
                  value={
                    ticket.description || "-"
                  }
                  disabled
                  rows={4}
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm resize-none"
                />
              </div>

            </div>
          </div>

          {/* PERMASALAHAN REASSIGN */}
          <div className="border rounded-xl p-4 mt-6">
            <h3 className="text-sm font-semibold mb-4 text-gray-600">
                PERMASALAHAN REASSIGN
            </h3>

            {loadingReassignment ? (
                <div className="text-sm text-gray-500">
                Memuat data permasalahan reassign...
                </div>
            ) : reassignment ? (
                <div className="space-y-4">

                {/* MESSAGE */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permasalahan dari Staf CCIT
                    </label>

                    <textarea
                    value={reassignment.message || "-"}
                    disabled
                    rows={5}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-700 resize-none"
                    />
                </div>

                {/* ATTACHMENTS */}
                {reassignment?.attachments?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Lampiran Dokumen
                    </label>

                    <div className="mt-2 space-y-2">
                      {reassignment.attachments.map((attachment, index) => {
                        const fileName =
                          attachment.file_name ||
                          attachment.fileName ||
                          "Lampiran";

                        const fileUrl =
                          attachment.file_url ||
                          attachment.fileUrl;

                        return (
                          <div
                            key={
                              attachment.id ||
                              `${fileName}-${index}`
                            }
                            className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 bg-gray-50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {fileName}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Buka */}
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                              >
                                <FiExternalLink size={14} />
                                Buka
                              </a>

                              {/* Unduh */}
                              <button
                                type="button"
                                onClick={() => downloadFile(attachment)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                              >
                                <FiDownload size={14} />
                                Unduh
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                </div>
            ) : (
                <div className="text-sm text-gray-500">
                Belum ada data permasalahan reassign.
                </div>
            )}
          </div>       

          {/* ENGINEER RESOLUTION */}
          <div className="border rounded-xl p-4 mt-6">

            <h3 className="text-sm font-semibold mb-4 text-gray-600">
              RESOLUTION ENGINEER
            </h3>

            {loadingResolution ? (
              <div className="text-sm text-gray-500">
                Memuat data resolution engineer...
              </div>
            ) : (
              <div className="space-y-4">

                {/* SOLUTION */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Solution
                  </label>

                  <textarea
                    value={solution}
                    onChange={(e) =>
                      setSolution(e.target.value)
                    }
                    disabled={
                      isSubmitting ||
                      Boolean(engineerResolution)
                    }
                    rows={6}
                    placeholder="Masukkan solusi atau tindakan yang dilakukan untuk menyelesaikan permasalahan..."
                    className={`w-full mt-1 border px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      engineerResolution
                        ? "bg-gray-100 text-gray-700"
                        : ""
                    }`}
                  />

                  {engineerResolution && (
                    <p className="text-xs text-gray-500 mt-1">
                      Resolution Engineer sudah disimpan.
                    </p>
                  )}
                </div>

                {/* ATTACHMENTS YANG SUDAH TERSIMPAN */}
                {engineerResolution?.attachments?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Lampiran Resolution
                    </label>

                    <div className="mt-2 space-y-2">
                      {engineerResolution.attachments.map(
                        (attachment, index) => {
                          const fileName =
                            attachment.file_name ||
                            attachment.fileName ||
                            "Lampiran";

                          const fileUrl =
                            attachment.file_url ||
                            attachment.fileUrl;

                          return (
                            <div
                              key={
                                attachment.id ||
                                `${fileName}-${index}`
                              }
                              className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 bg-gray-50"
                            >
                              {/* FILE NAME */}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                  {fileName}
                                </p>
                              </div>

                              {/* ACTION */}
                              <div className="flex items-center gap-2 shrink-0">

                                {/* BUKA */}
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                                >
                                  <FiExternalLink size={14} />
                                  Buka
                                </a>

                                {/* UNDUH */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadFile(attachment)
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                                >
                                  <FiDownload size={14} />
                                  Unduh
                                </button>

                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* FILE INPUT */}
                {!engineerResolution && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Lampiran
                    </label>

                    <p className="text-xs text-gray-500 mb-2">
                      Dapat memilih beberapa file.
                      Maksimal 10MB untuk setiap file.
                    </p>

                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                      className="block w-full text-sm border rounded-lg px-3 py-2"
                    />

                    {/* FILE LIST */}
                    {files.length > 0 && (
                      <div className="mt-3 space-y-2">

                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50"
                          >

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {file.name}
                              </p>

                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFile(index)
                              }
                              disabled={isSubmitting}
                              className="ml-3 text-red-500 hover:text-red-700 text-lg disabled:opacity-50"
                            >
                              ✕
                            </button>

                          </div>
                        ))}

                      </div>
                    )}
                  </div>
                )}

                {/* CREATED / UPDATED */}
                {engineerResolution && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">

                    <div>
                      <p className="text-xs text-gray-500">
                        Dibuat Resolusi
                      </p>

                      <p className="text-sm text-gray-700">
                        {new Date(
                          engineerResolution.created_at
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Batal
          </button>

          {!engineerResolution && !loadingResolution && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !solution.trim()
              }
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
            >
              {isSubmitting
                ? "Menyimpan..."
                : "Simpan Resolution"}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}