import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import TicketTable from "../components/ticket/TicketTable";
import TicketModal from "../components/modal/TicketModal";
import { getTickets } from "../services/ticketService";
import { jwtDecode } from "jwt-decode";

export default function TicketManagementUser() {

  const menu = [
    { label: "Dashboard", path: "/user/dashboard" },
    { label: "Tiket Saya", path: "/user/tickets" },
  ];

  const [tickets, setTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const token = localStorage.getItem("token");
  const currentUser = token ? jwtDecode(token) : null;

  const role = currentUser?.role; // atau role_name tergantung payload

  useEffect(() => {
    fetchTickets();
  }, [page]);

  const fetchTickets = async () => {
    const res = await getTickets({
      reporter_id: currentUser?.user_id,
      page,
    });

    setTickets(res.data || []);
    setTotalPage(res.total_page || 1);
  };

  return (
    <DashboardLayout title="Tiket Manajemen" menu={menu}>

      <div className="bg-white p-6 rounded-xl shadow">

        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              Daftar Tiket Aduan
            </h2>
            <p className="text-gray-500 text-sm">
              Manajemen tiket helpdesk
            </p>
          </div>

          {/* BUTTON BUAT TIKET */}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            + Buat Tiket
          </button>
        </div>

        <TicketTable
          tickets={tickets}
          role={role}
        />

      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-6 gap-2">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded"
        >
          Prev
        </button>

        <span className="px-3 py-1">
          Page {page} of {totalPage}
        </span>

        <button
          disabled={page === totalPage}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded"
        >
          Next
        </button>

      </div>

      {/* MODAL */}
      {showModal && (
        <TicketModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchTickets}
        />
      )}

    </DashboardLayout>
  );
}