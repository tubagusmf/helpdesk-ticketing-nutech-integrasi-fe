import { useEffect, useState } from "react";
import { getTicketHistories } from "../../services/ticketService";

export default function TicketHistoryModal({ ticket, onClose }) {
  const [histories, setHistories] = useState([]);

  useEffect(() => {
    fetchHistories();
  }, []);

  const fetchHistories = async () => {
    try {
      const res = await getTicketHistories(ticket.id);
  
      console.log("🔥 FULL RESPONSE:", res);
      console.log("🔥 HISTORY DATA:", res.data);
  
      setHistories(res.data || []);
    } catch (err) {
      console.error("❌ ERROR FETCH HISTORY:", err);
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
      default:
        return "ℹ️ Aktivitas";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              History Tiket #{ticket.ticket_code}
            </h2>
            <p className="text-sm text-gray-500">
              Status: {ticket.status}
            </p>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        {/* TIMELINE */}
        <div className="border rounded-xl p-4 bg-gray-50">
          <h3 className="text-sm font-semibold mb-4 text-gray-700">
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
                className="bg-white border rounded-lg p-3 text-sm"
              >
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{h.user_name || "-"}</span>
                  <span>{new Date(h.created_at).toLocaleString()}</span>
                </div>

                <div className="font-medium text-gray-700 mb-1">
                  {getLabel(h)} 
                  <span className="text-xs text-red-400 ml-2">
                    ({h.type || "NO_TYPE"})
                  </span>
                </div>

                {/* DETAIL */}
                {h.type === "STATUS_UPDATED" && (
                  <p>
                    Status: <b>{h.old_value}</b> →{" "}
                    <b>{h.new_value}</b>
                  </p>
                )}

                {h.type === "COMMENT" && (
                  <p>{h.message}</p>
                )}

                {h.type === "CREATED" && (
                  <p>Tiket berhasil dibuat</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}