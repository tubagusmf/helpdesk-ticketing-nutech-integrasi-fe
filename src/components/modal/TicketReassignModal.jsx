import { useEffect, useState } from "react";
import Select from "react-select";
import { getEngineers, reassignTicket } from "../../services/ticketService";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function TicketReassignModal({
  ticket,
  engineerId,
  onClose,
}) {
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState(null);

  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingEngineers, setLoadingEngineers] = useState(false);

  useEffect(() => {
    if (!ticket?.project_id) {
      setEngineers([]);
      return;
    }

    fetchEngineers(ticket.project_id);
  }, [ticket?.project_id]);

  useEffect(() => {
    if (!engineerId || engineers.length === 0) {
      return;
    }

    const engineer = engineers.find(
      (user) => Number(user.id) === Number(engineerId)
    );

    if (engineer) {
      setSelectedEngineer({
        value: engineer.id,
        label: engineer.name,
      });
    }
  }, [engineerId, engineers]);

  const fetchEngineers = async (projectId) => {
    try {
      setLoadingEngineers(true);

      const res = await getEngineers(projectId);

      const engineers = res.data || [];

      setEngineers(engineers);
    } catch (error) {
      console.error("Failed to fetch engineers:", error);
      setEngineers([]);
    } finally {
      setLoadingEngineers(false);
    }
  };

  const engineerOptions = engineers.map((engineer) => ({
    value: engineer.id,
    label: engineer.name,
  }));

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEngineer) {
      alert("Silakan pilih engineer terlebih dahulu");
      return;
    }

    if (!message.trim()) {
      alert("Permasalahan wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();

      formData.append(
        "to_user_id",
        selectedEngineer.value
      );

      formData.append(
        "message",
        message.trim()
      );

      files.forEach((file) => {
        formData.append(
          "attachments",
          file
        );
      });

      await reassignTicket(
        ticket.id,
        formData
      );

      alert(
        "Ticket berhasil di-reassign"
      );

      setMessage("");
      setFiles([]);
      setSelectedEngineer(null);

      onClose?.();
    } catch (error) {
      console.error(
        "Failed to reassign ticket:",
        error
      );

      alert(
        error?.message ||
          "Gagal melakukan reassign ticket"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (size) => {
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

  if (!ticket) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-lg overflow-y-auto max-h-[90vh]">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex justify-between items-start px-6 pt-5 pb-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Reassign Ticket
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Ticket #{ticket.ticket_code}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-800 text-lg"
          >
            ✕
          </button>
        </div>

        {/* =====================================================
            CONTENT
        ====================================================== */}

        <div className="p-6">

          <div className="border rounded-xl p-4">

            <h3 className="text-sm font-semibold mb-4 text-gray-600">
              INFORMASI PERMASALAHAN
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* PROJECT */}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Project
                </label>

                <input
                  value={ticket.project_name || "-"}
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
                  value={ticket.location_name || "-"}
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
                  value={ticket.part_name || "-"}
                  disabled
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm"
                />
              </div>

              {/* ID / NO PERANGKAT */}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  ID / No Perangkat
                </label>

                <input
                  value={ticket.asset_code || "-"}
                  disabled
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm"
                />
              </div>

              {/* PELAPOR */}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Nama Pelapor
                </label>

                <input
                  value={ticket.reporter_name || "-"}
                  disabled
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm"
                />
              </div>

              {/* ASSIGNED TO */}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Engineer Saat Ini
                </label>

                <input
                  value={
                    ticket.assigned_to_name || "Belum ada"
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

              {/* DESKRIPSI */}

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Deskripsi Permasalahan
                </label>

                <textarea
                  value={
                    ticket.description || "-"
                  }
                  disabled
                  rows={3}
                  className="w-full mt-1 border px-3 py-2 rounded-lg bg-gray-100 text-sm resize-none"
                />
              </div>

            </div>
          </div>

          {/* ===================================================
              REASSIGN FORM
          ==================================================== */}

          <div className="border rounded-xl p-4 mt-6">

            <h3 className="text-sm font-semibold mb-4 text-gray-600">
              REASSIGN TICKET
            </h3>

            <div className="space-y-4">

              {/* ENGINEER */}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Pilih Tim Engineer
                </label>

                <div className="mt-1">
                  <Select
                    options={engineerOptions}
                    value={selectedEngineer}
                    onChange={setSelectedEngineer}
                    placeholder="Pilih / ketik nama Tim Engineer..."
                    isSearchable
                    isClearable
                    isDisabled={
                      isSubmitting ||
                      loadingEngineers
                    }
                    isLoading={loadingEngineers}
                    noOptionsMessage={() =>
                      "Engineer tidak ditemukan"
                    }
                  />
                </div>
              </div>

              {/* MESSAGE */}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Permasalahan Reassign
                </label>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  disabled={isSubmitting}
                  rows={4}
                  placeholder="Masukkan permasalahan atau keterangan reassign..."
                  className="w-full mt-1 border px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ATTACHMENT */}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Bukti / Lampiran
                </label>

                <p className="text-xs text-gray-500 mb-2">
                  Dapat memilih beberapa file. Maksimal
                  10MB untuk setiap file.
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
                          className="ml-3 text-red-500 hover:text-red-700 text-lg"
                        >
                          ✕
                        </button>

                      </div>
                    ))}

                  </div>
                )}

              </div>

            </div>
          </div>

        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting
              ? "Memproses..."
              : "Reassign Ticket"}
          </button>

        </div>

      </div>
    </div>
  );
}