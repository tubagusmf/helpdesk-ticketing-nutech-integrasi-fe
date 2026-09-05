import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import TicketTable from "../components/ticket/TicketTable";
import TicketFilter from "../components/ticket/TicketFilter";
import TicketModal from "../components/modal/TicketModal";
import { getTickets } from "../services/ticketService";
import { jwtDecode } from "jwt-decode";
import { navigationMenu } from "../constants/navigation";
import useTicketSocket from "../hooks/useTicketSocket";
import { ROLE } from "../constants/role";

const EMPTY_FILTERS = {
  project_id: "",
  assigned_to_id: "",
  reporter_id: "",
  priority: "",
  status: "",
  start_date: "",
  end_date: "",
};

export default function TicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [limit, setLimit] = useState(10);

  const token = localStorage.getItem("token");
  const currentUser = token ? jwtDecode(token) : null;

  const userId = Number(currentUser?.user_id);

  const rawRole =
    currentUser?.role_id ??
    currentUser?.role;

  const role =
  typeof rawRole === "string"
    ? (
        rawRole === "ADMINISTRATOR"
          ? ROLE.ADMINISTRATOR
          : rawRole === "STAFF"
          ? ROLE.STAFF
          : rawRole === "USER"
          ? ROLE.USER
          : rawRole === "EXECUTIVE"
          ? ROLE.EXECUTIVE
          : Number(rawRole)
      )
    : Number(rawRole);

  const menu =
    role === 1
        ? navigationMenu.administrator
        : role === 2
        ? navigationMenu.staff
        : role === 3
        ? navigationMenu.user
         : navigationMenu.executive;

  const fetchTickets = useCallback(async () => {
    try {
      const roleFilters = {
        ...filters,
        search,
        page,
        limit,
      };

      if (role === 2) {
        roleFilters.assigned_to_id = userId;
      }

      if (role === 3) {
        roleFilters.reporter_id = userId;
      }

      const cleanFilters = Object.fromEntries(
        Object.entries(roleFilters).filter(
          ([_, value]) => value !== ""
        )
      );

      const res = await getTickets(cleanFilters);
      const data = res.data || [];

      if (role === 2) {
        data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      }

      setTickets(data);
      setTotalPage(res.total_page || 1);
    } catch (err) {
      console.error("[TICKET] Fetch error:", err);
    }
  }, [filters, search, page, limit, role, userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setPage(1);
  }, [filters, search, limit]);

  const handleRealtimeTicket = useCallback(
    (ticket) => {
      // STAFF
      if (role === 2) {
        if (Number(ticket.assigned_to_id) !== userId) {
          return;
        }
      }

      // USER
      if (role === 3) {
        if (Number(ticket.reporter_id) !== userId) {
          return;
        }
      }

      setTickets((prev) => {
        const exists = prev.some(
          (item) =>
            Number(item.id) === Number(ticket.id)
        );

        if (exists) {
          return prev
            .map((item) =>
              Number(item.id) === Number(ticket.id)
                ? {
                    ...item,
                    ...ticket,
                  }
                : item
            )
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .slice(0, limit);
        }

        return [ticket, ...prev].slice(0, limit);
      });
    },
    [role, userId]
  );

  useTicketSocket({
    onNewTicket: (ticket) => {
      console.log("[WS] NEW_TICKET:", ticket);

      if (role === 1) {
        handleRealtimeTicket(ticket);
        return;
      }

      handleRealtimeTicket(ticket);
    },

    onTicketUpdated: (ticket) => {
      console.log("[WS] TICKET_UPDATED:", ticket);

      handleRealtimeTicket(ticket);
    },

    onStatusUpdate: (ticket) => {
      console.log(
        "[WS] TICKET_STATUS_UPDATED:",
        ticket
      );

      setTickets((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(ticket.id)
            ? {
                ...item,
                ...ticket,
              }
            : item
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              {role === 2
                ? "Tiket Assigned ke Saya"
                : "Daftar Tiket Aduan"}
            </h2>

            <p className="text-gray-500 text-sm">
              Manajemen tiket helpdesk
            </p>
          </div>

          {(role === ROLE.ADMINISTRATOR || role === ROLE.USER) && (
            <button
                onClick={() => setShowModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
            >
                Buat Tiket
            </button>
         )}
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

      <div className="flex justify-between items-center mt-6">

        {/* Rows per page */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Rows per page:</span>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-300 rounded-md px-2 py-1
                      focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPage}
          </span>

          <button
            disabled={page === totalPage}
            onClick={() => setPage((prev) => prev + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

      </div>

      {showModal && (
        <TicketModal
          onClose={() => {
            setShowModal(false);
            fetchTickets();
          }}
        />
      )}
    </DashboardLayout>
  );
}