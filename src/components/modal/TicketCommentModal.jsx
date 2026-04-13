import { useState, useEffect, useRef } from "react";
import { createTicketComment, getTicketComments } from "../../services/ticketService";

export default function TicketCommentModal({ ticket, onClose }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const isClosed = ticket.status === "CLOSED";

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const fetchComments = async () => {
    try {
      const res = await getTicketComments(ticket.id);
      setComments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return alert("Komentar tidak boleh kosong");

    try {
      setLoading(true);

      await createTicketComment(ticket.id, {
        message,
      });

      setMessage("");
      fetchComments();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              Komentar Tiket #{ticket.ticket_code}
            </h2>
            <p className="text-sm text-gray-500">
              Status: {ticket.status}
            </p>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="border rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-600">
            INFORMASI MASALAH
          </h3>

          <div className="space-y-2 text-sm">
            <p><b>Project:</b> {ticket.project_name}</p>
            <p><b>Lokasi:</b> {ticket.location_name}</p>
            <p><b>Perangkat:</b> {ticket.part_name}</p>
            <p><b>Deskripsi:</b> {ticket.description}</p>
          </div>
        </div>

        <div className="border rounded-xl p-4 bg-gray-50">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">
            KOMENTAR
          </h3>

          {/* LIST */}
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {comments.length === 0 && (
              <p className="text-sm text-gray-400">Belum ada komentar</p>
            )}

            {comments.map((c) => (
              <div
                key={c.id}
                className="bg-white border rounded-lg p-3 text-sm"
              >
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{c.user_name}</span>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p>{c.message}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="flex flex-col gap-2">
            <textarea
              placeholder={
                isClosed
                  ? "Ticket sudah CLOSED, tidak bisa komentar"
                  : "Tulis komentar..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isClosed}
              className="border px-3 py-2 rounded-lg"
            />

            <button
              onClick={handleSubmit}
              disabled={loading || isClosed}
              className={`px-4 py-2 rounded-lg text-white ${
                isClosed
                  ? "bg-gray-400"
                  : loading
                  ? "bg-gray-400"
                  : "bg-blue-600"
              }`}
            >
              {loading ? "Mengirim..." : "Kirim Komentar"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}