
import { useEffect, useState } from "react";
import { getTicketHistories } from "../../services/ticketService";
import useTicketSocket from "../../hooks/useTicketSocket";

export default function TicketHistoryModal({ ticket, onClose }) {
  const [histories, setHistories] = useState([]);

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

      default:
        return "ℹ️ Aktivitas";
    }
  };

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
        <div className="mb-4 flex justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              History Tiket #{ticket.ticket_code}
            </h2>

            <p className="text-sm text-gray-500">
              Status: {ticket.status}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup riwayat tiket"
            className="h-fit text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

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
                  <span>{h.user_name || "-"}</span>

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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
