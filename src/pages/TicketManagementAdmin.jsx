import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import TicketTable from "../components/ticket/TicketTable";
import TicketFilter from "../components/ticket/TicketFilter";
import { getTickets } from "../services/ticketService";
import { jwtDecode } from "jwt-decode";
import { navigationMenu } from "../constants/navigation";
import useTicketSocket from "../hooks/useTicketSocket";

export default function TicketManagementAdmin() {
  const menu = navigationMenu.administrator;
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

  const fetchTickets = useCallback(async () => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries({
          ...filters,
          search,
          page,
        }).filter(([_, value]) => value !== "")
      );

      const res = await getTickets(cleanFilters);

      setTickets(res.data || []);
      setTotalPage(res.total_page || 1);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  }, [filters, search, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  useTicketSocket({
    onNewTicket: (newTicket) => {
      console.log("[WS] NEW_TICKET:", newTicket);

      setTickets((prev) => {
        const exists = prev.some(
          (ticket) => ticket.id === newTicket.id
        );

        if (exists) {
          return prev;
        }

        return [newTicket, ...prev];
      });
    },

    onTicketUpdated: (updatedTicket) => {
      console.log("[WS] TICKET_UPDATED:", updatedTicket);

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === updatedTicket.id
            ? updatedTicket
            : ticket
        )
      );
    },

    onStatusUpdate: (updatedTicket) => {
      console.log(
        "[WS] TICKET_STATUS_UPDATED:",
        updatedTicket
      );
    
      setTickets((prev) =>
        prev.map((ticket) =>
          Number(ticket.id) === Number(updatedTicket.id)
            ? {
                ...ticket,
                ...updatedTicket,
              }
            : ticket
        )
      );
    },

    onNewComment: (data) => {
      console.log("[WS] NEW_COMMENT:", data);
    },

    onNotification: (data) => {
      console.log("[WS] NEW_NOTIFICATION:", data);
    },

    onTicketHistory: (data) => {
      console.log("[WS] TICKET_HISTORY:", data);
    },
  });

  return (
    <DashboardLayout
      title="Manajemen Tiket"
      menu={menu}
    >
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
          role={role}
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
  );
}