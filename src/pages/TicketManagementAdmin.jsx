import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import TicketTable from "../components/ticket/TicketTable";
import TicketFilter from "../components/ticket/TicketFilter";
import { getTickets } from "../services/ticketService";
import { jwtDecode } from "jwt-decode";

export default function TicketManagementAdmin() {

  const menu = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Manajemen Tiket", path: "/admin/tickets" },
    { label: "Manajemen User", path: "/admin/users" },
    { label: "Master Data", path: "/admin/master" },
  ];

  const [tickets, setTickets] = useState([]);
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
  }, [filters, search, page]);

  const fetchTickets = async () => {
    const cleanFilters = Object.fromEntries(
      Object.entries({
        ...filters,
        search,
        page,
      }).filter(([_, v]) => v !== "")
    );
  
    const res = await getTickets(cleanFilters);
  
    setTickets(res.data || []);
    setTotalPage(res.total_page || 1);
  };

  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  return (
    <DashboardLayout title="Manajemen Tiket" menu={menu}>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Daftar Tiket Aduan
          </h2>

          <p className="text-gray-500 text-sm">
            Manajemen tiket helpdesk
          </p>
        </div>

        <TicketFilter
          search={search}
          setSearch={setSearch}
          filters={filters}
          setFilters={setFilters}
          tickets={tickets}
        />

        <TicketTable
          tickets={tickets}
          search={search}
          role={role}
        />
      </div>

      <div className="flex justify-center mt-6 gap-2">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="px-3 py-1">
          Page {page} of {totalPage}
        </span>

        <button
          disabled={page === totalPage}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </DashboardLayout>
  )
}