import { useState, useEffect } from "react";
import { getCauses, getSolutions, updateTicketStatusOnly, createTicketResolution, getTicketResolution  } from "../../services/ticketService";
import Select from "react-select";

export default function TicketResolutionModal({ ticket, onClose, onSuccess, role }) {

  const [loading, setLoading] = useState(false);
  const [causes, setCauses] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [selectedCause, setSelectedCause] = useState(null);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resolution, setResolution] = useState(null);
  const isLocked = ["RESOLVED", "CLOSED"].includes(ticket.status);  
  const normalizedRole = role?.toLowerCase();

  const isUser = normalizedRole === "user";
  const isLockedForAdmin = ["RESOLVED", "CLOSED"].includes(ticket.status);

  const isReadOnly = isUser || isLockedForAdmin;

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
    status: "RESOLVED",
  });

  useEffect(() => {
    if (ticket?.attachment_url) {
      setPreview(ticket.attachment_url);
    }
  }, [ticket]);

  useEffect(() => {
    if (ticket?.id) {
      fetchResolution();
    }
  }, [ticket]);
  
  const fetchResolution = async () => {
    try {
      const res = await getTicketResolution(ticket.id);
      if (!res) return;
  
      const data = res;
      setResolution(data);
  
      const partId = ticket.part_id || ticket.part?.id;
  
      if (!partId) {
        console.warn("PART ID NULL");
        return;
      }
  
      const causeRes = await getCauses(partId);  
      const causeList = causeRes.data || [];
      setCauses(causeList);
  
      const foundCause = causeList.find(
        (c) => String(c.id) === String(data.cause_id)
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
          (s) => String(s.id) === String(data.solution_id)
        );
  
        if (foundSolution) {
          setSelectedSolution({
            value: foundSolution.id,
            label: foundSolution.name,
          });
        }
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
      console.error(err);
    }
  };

  const [attachment, setAttachment] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleSubmit = async () => {
    try {
      if (form.status === "RESOLVED") {
        if (!form.cause || !form.solution) {
          alert("Cause dan Solution wajib diisi!");
          return;
        }
      }
  
      setLoading(true);

      if (form.status === "ONHOLD") {
        await updateTicketStatusOnly(ticket.id, {
          status: form.status,
          onhold_notes: form.onhold_notes,
        });
  
        alert("Ticket berhasil di ONHOLD!");
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
  
      if (attachment) {
        formData.append("attachment", attachment);
      }
  
      await createTicketResolution(ticket.id, formData);
  
      alert("Ticket berhasil di resolve!");
      onSuccess();
      onClose();
  
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const causeOptions = causes.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  
  const solutionOptions = solutions.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const statusOptions = [
    { value: "RESOLVED", label: "RESOLVED" },
    { value: "ONHOLD", label: "ONHOLD" },
  ];

  const handleCloseAsUser = async () => {
    try {
      setLoading(true);
  
      await updateTicketStatusOnly(ticket.id, {
        status: "CLOSED",
      });
  
      alert("Ticket berhasil di CLOSED!");
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDatetimeLocal = (isoString) => {
    if (!isoString) return getNowLocal();
  
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  
    return date.toISOString().slice(0, 16);
  };

  const getFileExtension = (url) => {
    const parts = url.split(".");
    return parts.length > 1 ? parts.pop().split("?")[0] : "jpg";
  };
  
  const handleDownloadImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const ext = getFileExtension(url);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `ticket-${ticket.ticket_code}.${ext}`;
  
      link.click();
  
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download gagal:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white w-full max-w-5xl rounded-xl shadow-lg p-6 overflow-y-auto max-h-[90vh]">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              Tiket #{ticket.ticket_code}
            </h2>
            <p className="text-sm text-gray-500">
              SLA Remaining: <span className="text-red-500">Overdue</span>
            </p>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT */}
          <div className="border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-600">
              INFORMASI MASALAH
            </h3>

            <div className="space-y-3">

              {/* PROJECT */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Project</label>
                <input
                  value={ticket.project_name}
                  disabled
                  className="w-full border px-3 py-2 rounded-lg bg-gray-100"
                />
              </div>

              {/* LOCATION & PART */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Lokasi</label>
                  <input
                    value={ticket.location_name}
                    disabled
                    className="w-full border px-3 py-2 rounded-lg bg-gray-100"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Perangkat</label>
                  <input
                    value={ticket.part_name}
                    disabled
                    className="w-full border px-3 py-2 rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              {/* ASSET */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  ID / No Perangkat
                </label>
                <input
                  value={ticket.asset_code}
                  disabled
                  className="w-full border px-3 py-2 rounded-lg bg-gray-100"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Deskripsi Permasalahan
                </label>
                <textarea
                  value={ticket.description}
                  disabled
                  className="w-full border px-3 py-2 rounded-lg bg-gray-100"
                />
              </div>

              {/* ATTACHMENT PROBLEM */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Bukti Foto Masalah
                </label>
                {ticket.attachment_url ? (
                  <img
                    src={
                      ticket.attachment_url?.startsWith("http")
                        ? ticket.attachment_url
                        : `http://localhost:3000/${ticket.attachment_url}`
                    }
                    alt="problem"
                    onError={(e) => {
                      e.target.src = "/no-image.png";
                    }}
                    className="mt-2 w-40 h-40 object-cover rounded-lg border"
                  />
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Tidak ada lampiran
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT */}
          <div className="border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-600">
              User Pelapor
            </h3>

            <div className="space-y-3">

              {/* REPORTER */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Nama Pelapor
                </label>
                <input
                  value={ticket.reporter_name}
                  disabled
                  className="w-full border px-3 py-2 rounded-lg bg-gray-100"
                />
              </div>

              {/* STATUS (EDITABLE) */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <Select
                  options={statusOptions}
                  value={statusOptions.find(s => s.value === form.status)}
                  isDisabled={isReadOnly}
                  onChange={(selected) => {
                    const newStatus = selected.value;
                  
                    setForm({
                      ...form,
                      status: newStatus,
                      ...(newStatus === "ONHOLD" && {
                        cause: "",
                        solution: "",
                        resolution_time: "",
                      }),
                    });
                  
                    if (newStatus === "ONHOLD") {
                      setSelectedCause(null);
                      setSelectedSolution(null);
                      setPreview(null);
                    }
                  }}
                />
              </div>

              {/* PRIORITY */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Prioritas
                </label>
                <input
                  value={ticket.priority}
                  disabled
                  className="w-full border px-3 py-2 rounded-lg bg-gray-100"
                />
              </div>

              {/* STAFF */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Nama Staff
                </label>
                <input
                  value={ticket.assigned_to_name}
                  disabled
                  className="w-full border px-3 py-2 rounded-lg bg-gray-100"
                />
              </div>

            </div>
          </div>

        </div>

        {/* RESOLUTION */}
        <div className="border rounded-xl p-4 mt-6 bg-green-50">
          <h3 className="text-sm font-semibold mb-3 text-green-700">
            PENYELESAIAN
          </h3>

          <div className="grid grid-cols-2 gap-4">

          {form.status !== "ONHOLD" && (
            <>

            {/* CAUSE */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-700">
                Penyebab
              </label>
              <Select
                options={causeOptions}
                value={selectedCause}
                isDisabled={isReadOnly}
                onChange={async (selected) => {
                  setSelectedCause(selected);
                  setSelectedSolution(null);

                  setForm({
                    ...form,
                    cause: selected?.value || "",
                    solution: "",
                  });

                  const res = await getSolutions(selected.value);
                  setSolutions(res.data || []);
                }}
                placeholder="Pilih atau ketik penyebab..."
                isSearchable
              />
            </div>

            {/* SOLUTION */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-700">
                Solusi
              </label>
              <Select
                options={solutionOptions}
                value={selectedSolution}
                onChange={(selected) => {
                  setSelectedSolution(selected);

                  setForm({
                    ...form,
                    solution: selected?.value || "",
                  });
                }}
                placeholder="Pilih atau ketik solusi..."
                isSearchable
                isDisabled={isReadOnly}
              />
            </div>

            {/* RESOLUTION TIME */}
            <div className="flex flex-col col-span-2">
              <label className="text-sm font-medium mb-1 text-gray-700">
                Waktu Penyelesaian
              </label>
              <input
                type="datetime-local"
                name="resolution_time"
                value={form.resolution_time}
                onChange={handleChange}
                className="border px-3 py-2 rounded-lg"
                disabled={isReadOnly}
              />
            </div>

            </>
          )}
          
            {form.status === "ONHOLD" && (
              <div className="flex flex-col col-span-2">
                <label className="text-sm font-medium mb-1 text-gray-700">
                  Catatan ONHOLD
                </label>
                <textarea
                  name="onhold_notes"
                  value={form.onhold_notes || ""}
                  onChange={handleChange}
                  className="border px-3 py-2 rounded-lg"
                />
              </div>
            )}

            {/* UPLOAD */}
            {form.status !== "ONHOLD" && !isLocked && (
              <div className="flex flex-col col-span-2">
                <label className="text-sm font-medium mb-1 text-gray-700">
                  Bukti Foto Penyelesaian (Opsional)
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleFileChange(e);

                    const file = e.target.files[0];
                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      setPreview(previewUrl);
                    }
                  }}
                  className="border px-3 py-2 rounded-lg"
                />

                {preview && (
                  <img
                    src={preview}
                    alt="preview"
                    className="mt-3 w-40 h-40 object-cover rounded-lg border"
                  />
                )}
              </div>
            )}

            {resolution?.attachment_url && (
              <div className="flex flex-col col-span-2">
                <label className="text-sm font-medium mb-2 text-gray-700">
                  Bukti Foto Penyelesaian
                </label>

                <div className="flex items-start gap-4">
                  <img
                    src={
                      resolution.attachment_url.startsWith("http")
                        ? resolution.attachment_url
                        : `http://localhost:3000/${resolution.attachment_url}`
                    }
                    alt="resolution"
                    className="w-40 h-40 object-cover rounded-lg border"
                  />

                  <button
                    onClick={() =>
                      handleDownloadImage(resolution.attachment_url)
                    }
                    className="h-fit px-3 py-2 bg-orange-600 text-white rounded-lg text-sm"
                  >
                    Unduh Gambar
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {isLockedForAdmin && (
          <p className="text-sm text-gray-500 mt-4 text-right">
            Ticket sudah selesai, data tidak dapat diubah
          </p>
        )}

        {/* FOOTER */}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Batal
          </button>

          {/* USER CLOSE TICKET */}
          {isUser && ticket.status === "RESOLVED" && (
            <button
              onClick={handleCloseAsUser}
              className="px-4 py-2 rounded-lg bg-green-600 text-white"
            >
              Close Ticket
            </button>
          )}

          {/* ADMIN SAVE TICKET */}
          {!isUser && !isLockedForAdmin && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white ${
                loading ? "bg-gray-400" : "bg-blue-600"
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