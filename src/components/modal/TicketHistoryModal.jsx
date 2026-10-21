import { useEffect, useState } from "react";
import { getTicketHistories, exportTicketHistory } from "../../services/ticketService";
import useTicketSocket from "../../hooks/useTicketSocket";
import { FiDownload } from "react-icons/fi";

export default function TicketHistoryModal({ ticket, onClose }) {
  const [histories, setHistories] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    fetchHistories();
  }, [ticket.id]);

  const fetchHistories = async () => {
    try {
      const res = await getTicketHistories(ticket.id);
      setHistories(res.data || []);
    } catch (err) {
      console.error("ERROR FETCH HISTORY:", err);
    }
  };

  const handleExportHistory = async () => {
    try {
      setExporting(true);
      setExportError("");

      await exportTicketHistory(
        ticket.id,
        ticket.ticket_code,
      );
    } catch (err) {
      console.error("ERROR EXPORT HISTORY:", err);

      setExportError(
        err.message || "Gagal mengunduh laporan history tiket.",
      );
    } finally {
      setExporting(false);
    }
  };

  const getLabel = (item) => {
    switch (item.type) {
      case "CREATED":
        return "🟢 Ticket dibuat";

      case "STATUS_UPDATED":
        return "🟡 Status diubah";

      case "COMMENT":
        return "💬 Komentar";

      case "ONHOLD_NOTE":
        return "📝 Catatan OnHold";

      case "REASSIGNED":
        return "🔄 Tiket dialihkan ke Engineer";

      case "STAFF_REASSIGNED":
        return "🔄 Ticket dialihkan ke Staff";

      case "STAFF_REASSIGNMENT_REASON":
        return "📝 Justifikasi reassign";

      case "RESOLUTION":
        return "✅ Solusi tiket";

      case "ENGINEER_RESOLUTION":
        return "🛠️ Solusi Tim Engineer";
      
      case "CANCELLATION_REASON":
        return "🛑 Justifikasi Pembatalan";

      case "TICKET_OVERDUE":
        return "⚠️ Ticket Overdue";

      case "STAFF_RESPONSE_OVERDUE":
        return "⏱️ Tiket belum direspons";

      case "STAFF_RESPONSE_LATE":
        return "🔴 Ticket telat direspons";

      default:
        return "ℹ️ Aktivitas";
    }
  };

  const SYSTEM_SLA_HISTORY_TYPES = new Set([
    "TICKET_OVERDUE",
    "STAFF_RESPONSE_OVERDUE",
    "STAFF_RESPONSE_LATE",
  ]);

  useTicketSocket({
    onTicketHistory: (data) => {
      if (Number(data.ticket_id) !== Number(ticket.id)) {
        return;
      }

      setHistories((prev) => {
        const exists = prev.some(
          (h) => Number(h.id) === Number(data.id),
        );

        if (exists) {
          return prev;
        }

        return [data, ...prev].sort((a, b) => {
          const timeDiff =
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime();

          return timeDiff || Number(b.id) - Number(a.id);
        });
      });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        {/* HEADER */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">
              History Tiket #{ticket.ticket_code}
            </h2>

            <p className="text-sm text-gray-500">
              Status: {ticket.status}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleExportHistory}
              disabled={exporting}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium
                text-white transition hover:bg-green-700
                disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? (
                <span className="text-xs">...</span>
              ) : (
                <FiDownload size={16} />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup riwayat tiket"
              className="h-fit rounded-md p-2 text-gray-500
                transition hover:bg-gray-100 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* EXPORT ERROR */}
        {exportError && (
          <p
            role="alert"
            className="mb-3 rounded-lg border border-red-200
              bg-red-50 p-3 text-sm text-red-700"
          >
            {exportError}
          </p>
        )}

        {/* TIMELINE */}
        <div className="rounded-xl border bg-gray-50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            RIWAYAT AKTIVITAS
          </h3>

          <div className="space-y-4">
            {histories.length === 0 && (
              <p className="text-sm text-gray-400">
                Belum ada riwayat
              </p>
            )}

            {histories.map((h) => (
              <div
                key={h.id}
                className="rounded-lg border bg-white p-3 text-sm"
              >
                {/* ACTOR AND TIMESTAMP */}
                <div className="mb-1 flex justify-between gap-3 text-xs text-gray-500">
                  <span>
                    {SYSTEM_SLA_HISTORY_TYPES.has(h.type)
                      ? "System"
                      : h.user_name || "-"}
                  </span>

                  <span className="shrink-0">
                    {new Date(h.created_at).toLocaleString("id-ID")}
                  </span>
                </div>

                {/* ACTIVITY LABEL */}
                <div className="mb-1 font-medium text-gray-700">
                  {getLabel(h)}

                  <span className="ml-2 text-xs text-red-400">
                    ({h.type || "NO_TYPE"})
                  </span>
                </div>

                {/* STATUS CHANGE */}
                {h.type === "STATUS_UPDATED" && (
                  <p className="text-gray-700">
                    Status: <b>{h.old_value || "-"}</b>
                    {" → "}
                    <b>{h.new_value || "-"}</b>
                  </p>
                )}

                {/* COMMENT */}
                {h.type === "COMMENT" && (
                  <p className="whitespace-pre-wrap text-gray-800">
                    {h.message || "-"}
                  </p>
                )}

                {/* TICKET CREATED */}
                {h.type === "CREATED" && (
                  <p className="text-gray-800">
                    Tiket berhasil dibuat
                  </p>
                )}

                {/* ONHOLD NOTE */}
                {h.type === "ONHOLD_NOTE" && (
                  <p className="whitespace-pre-wrap text-gray-800">
                    Catatan OnHold: {h.message || "-"}
                  </p>
                )}

                {/* ENGINEER REASSIGNMENT */}
                {h.type === "REASSIGNED" && (
                  <p className="text-gray-800">
                    Tiket dialihkan kepada Tim Engineer.
                  </p>
                )}

                {/* STAFF REASSIGNMENT */}
                {h.type === "STAFF_REASSIGNED" && (
                  <div className="mt-2 rounded-md bg-blue-50 p-3">
                    <p className="text-xs font-medium text-blue-700">
                      Perpindahan Ticket Penanggung Jawab Staff CCIT
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-md border bg-white px-3 py-1.5 font-medium text-gray-800">
                        {h.old_user_name || "-"}
                      </span>

                      <span className="font-semibold text-blue-600">
                        →
                      </span>

                      <span className="rounded-md border border-blue-200 bg-blue-100 px-3 py-1.5 font-medium text-blue-800">
                        {h.new_user_name || "-"}
                      </span>
                    </div>
                  </div>
                )}

                {/* STAFF REASSIGNMENT JUSTIFICATION */}
                {h.type === "STAFF_REASSIGNMENT_REASON" && (
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-amber-800">
                      Justifikasi Pengalihan Ticket
                    </p>

                    <p className="whitespace-pre-wrap break-words text-gray-800">
                      {h.message || h.new_value || "Justifikasi tidak tersedia"}
                    </p>
                  </div>
                )}

                {/* ENGINEER RESOLUTION */}
                {h.type === "ENGINEER_RESOLUTION" && (
                  <p className="mt-1 whitespace-pre-wrap text-gray-600">
                    {h.message || "-"}
                  </p>
                )}

                {/* CANCELLATION JUSTIFICATION */}
                {h.type === "CANCELLATION_REASON" && (
                  <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-red-800">
                      Alasan Pembatalan Tiket
                    </p>

                    <p className="whitespace-pre-wrap break-words text-gray-800">
                      {h.message ||
                        h.new_value ||
                        "Justifikasi pembatalan tidak tersedia"}
                    </p>
                  </div>
                )}

                {/* SLA HISTORY */}
                {SYSTEM_SLA_HISTORY_TYPES.has(h.type) && (
                  <div
                    className={`
                      mt-2 rounded-md border p-3
                      ${
                        h.type === "TICKET_OVERDUE"
                          ? "border-red-200 bg-red-50"
                          : h.type === "STAFF_RESPONSE_OVERDUE"
                            ? "border-amber-200 bg-amber-50"
                            : "border-orange-200 bg-orange-50"
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap break-words text-gray-800">
                      {h.message || h.new_value || "Informasi SLA tidak tersedia."}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
