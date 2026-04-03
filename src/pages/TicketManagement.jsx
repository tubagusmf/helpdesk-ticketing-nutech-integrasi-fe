import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import TicketTable from "../components/ticket/TicketTable";
import TicketFilter from "../components/ticket/TicketFilter";
import { getTickets } from "../services/ticketService";

export default function TicketManagement() {

  const menu = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Data Ticket", path: "/admin/tickets" },
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
  });
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  useEffect(() => {
    fetchTickets();
  }, [filters, search, page]);

  const fetchTickets = async () => {
    const res = await getTickets({
      ...filters,
      search,
      page,
    });
  
    console.log("PAGINATION:", res);
  
    setTickets(res.data || []);
    setTotalPage(res.total_page || 1);
  };

  const loadTickets = async () => {
    const res = await getTickets();
  
    console.log("API RESPONSE:", res);
  
    setTickets(res?.data || res || []);
  };

  useEffect(()=>{
    loadTickets()
  },[])

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