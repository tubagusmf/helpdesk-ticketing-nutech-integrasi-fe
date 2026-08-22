import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import TicketTable from "../components/ticket/TicketTable";
import TicketFilter from "../components/ticket/TicketFilter";
import { getTickets } from "../services/ticketService";
import { jwtDecode } from "jwt-decode";
import { navigationMenu } from "../constants/navigation";
import useTicketSocket from "../hooks/useTicketSocket";

export default function TicketManagementStaff() {
  const menu = navigationMenu.staff;
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
  }, [page, filters, search]);

  const sortTicketsByNewest = (tickets) => {
    return [...tickets].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      return dateB - dateA;
    });
  };

  const fetchTickets = async () => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries({
          ...filters,
          search,
          page,
          assigned_to_id: currentUser?.user_id,
        }).filter(([_, v]) => v !== "")
      );

      const res = await getTickets(cleanFilters);
      const data = res.data || [];

      setTickets(sortTicketsByNewest(data));
      setTotalPage(res.total_page || 1);
    } catch (err) {
      console.error("Fetch tickets error:", err);
    }
  };

  const handleRealtimeTicket = (ticket) => {
    if (
      Number(ticket.assigned_to_id) !==
      Number(currentUser?.user_id)
    ) {
      return;
    }

    setTickets((prev) => {
      const exists = prev.some(
        (t) => Number(t.id) === Number(ticket.id)
      );

      if (exists) {
        return sortTicketsByNewest(
          prev.map((t) =>
            Number(t.id) === Number(ticket.id)
              ? {
                  ...t,
                  ...ticket,
                }
              : t
          )
        );
      }

      return sortTicketsByNewest([
        ticket,
        ...prev,
      ]);
    });
  };

  useTicketSocket({
    onNewTicket: (ticket) => {
      console.log("[WS] NEW_TICKET:", ticket);
      handleRealtimeTicket(ticket);
    },

    onTicketUpdated: (ticket) => {
      console.log("[WS] TICKET_UPDATED:", ticket);
      handleRealtimeTicket(ticket);
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
  });

  return (
    <DashboardLayout title="Manajemen Tiket" menu={menu}>

      <div className="bg-white p-6 rounded-xl shadow">

        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              Tiket Assigned ke Saya
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

    </DashboardLayout>
  );
}