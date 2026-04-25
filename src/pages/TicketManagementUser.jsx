import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import TicketTable from "../components/ticket/TicketTable";
import TicketModal from "../components/modal/TicketModal";
import TicketFilter from "../components/ticket/TicketFilter";
import { getTickets } from "../services/ticketService";
import { jwtDecode } from "jwt-decode";

export default function TicketManagementUser() {

  const menu = [
    { label: "Dashboard", path: "/user/dashboard" },
    { label: "Manajemen Tiket", path: "/user/tickets" },
  ];

  const [tickets, setTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    project_id: "",
    assigned_to_id: "",
    reporter_id: "",
    priority: "",
    status: "",
    start_date: "",
    end_date: "",
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const token = localStorage.getItem("token");
  const currentUser = token ? jwtDecode(token) : null;

  const role = currentUser?.role;

  useEffect(() => {
    fetchTickets();
  }, [page, filters, search]);

  const fetchTickets = async () => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries({
          ...filters,
          search,
          page,
          reporter_id: currentUser?.user_id,
        }).filter(([_, v]) => v !== "")
      );
  
      const res = await getTickets(cleanFilters);
  
      setTickets(res.data || []);
      setTotalPage(res.total_page || 1);
    } catch (err) {
      console.error("Fetch tickets error:", err);
    }
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
        </div>

        <TicketFilter
          search={search}
          setSearch={setSearch}
          filters={filters}
          setFilters={setFilters}
          tickets={tickets}
          role={role}
        />

        <TicketTable
          tickets={tickets}
          search={search}
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