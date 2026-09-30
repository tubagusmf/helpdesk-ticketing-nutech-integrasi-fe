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

  const rawRole = currentUser?.role_id ?? currentUser?.role;

  const role =
    typeof rawRole === "string"
      ? rawRole === "ADMINISTRATOR"
        ? ROLE.ADMINISTRATOR
        : rawRole === "STAFF"
          ? ROLE.STAFF
          : rawRole === "USER"
            ? ROLE.USER
            : rawRole === "EXECUTIVE"
              ? ROLE.EXECUTIVE
              : rawRole === "ENGINEER"
                ? ROLE.ENGINEER
                : Number(rawRole)
      : Number(rawRole);

  const menu =
    role === ROLE.ADMINISTRATOR
      ? navigationMenu.administrator
      : role === ROLE.STAFF
        ? navigationMenu.staff
        : role === ROLE.USER
          ? navigationMenu.user
          : role === ROLE.EXECUTIVE
            ? navigationMenu.executive
            : role === ROLE.ENGINEER
              ? navigationMenu.engineer
              : [];

  const fetchTickets = useCallback(async () => {
    try {
      const roleFilters = {
        ...filters,
        search,
        page,
        limit,
      };

      if (role === ROLE.USER) {
        roleFilters.reporter_id = userId;
      }

      const cleanFilters = Object.fromEntries(
        Object.entries(roleFilters).filter(([_, value]) => value !== ""),
      );

      const res = await getTickets(cleanFilters);
      const data = res.data || [];

      if (role === ROLE.STAFF) {
        data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
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
      if (role === ROLE.STAFF || role === ROLE.ENGINEER) {
        if (Number(ticket.assigned_to_id) !== userId) {
          return;
        }
      }

      if (role === ROLE.USER) {
        if (Number(ticket.reporter_id) !== userId) {
          return;
        }
      }

      setTickets((prev) => {
        const exists = prev.some(
          (item) => Number(item.id) === Number(ticket.id),
        );

        if (exists) {
          return prev
            .map((item) =>
              Number(item.id) === Number(ticket.id)
                ? {
                    ...item,
                    ...ticket,
                  }
                : item,
            )
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .slice(0, limit);
        }

        return [ticket, ...prev].slice(0, limit);
      });
    },
    [role, userId, limit],
  );

  const handleEngineerResolutionRealtime = useCallback((data) => {
    console.log("[WS] Engineer Resolution Realtime:", data);

    const ticketId = Number(data?.ticket_id ?? data?.id ?? data?.ticket?.id);

    if (!ticketId) {
      console.warn("[WS] Engineer Resolution tidak memiliki ticket_id:", data);
      return;
    }

    setTickets((prev) =>
      prev.map((item) =>
        Number(item.id) === ticketId
          ? {
              ...item,
              engineer_resolution_unread: true,

              ...(data?.engineer_resolution_at && {
                engineer_resolution_at: data.engineer_resolution_at,
              }),

              ...(data?.created_at && {
                engineer_resolution_at: data.created_at,
              }),
            }
          : item,
      ),
    );
  }, []);

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
      console.log("[WS] TICKET_STATUS_UPDATED:", ticket);

      setTickets((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(ticket.id)
            ? {
                ...item,
                ...ticket,
              }
            : item,
        ),
      );
    },

    onEngineerResolution: (ticket) => {
      console.log("[WS] TICKET_ENGINEER_RESOLUTION:", ticket);

      handleEngineerResolutionRealtime(ticket);
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
    <DashboardLayout title="Manajemen Tiket" menu={menu}>
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow w-full min-w-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              {role === ROLE.STAFF
                ? "Tiket Assigned ke Saya"
                : role === ROLE.ENGINEER
                  ? "Tiket Reassignment Saya"
                  : "Daftar Tiket Aduan"}
            </h2>

            <p className="text-gray-500 text-sm">Manajemen tiket helpdesk</p>
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
          userId={userId}
        />
      </div>

      <div className="flex flex-col items-center gap-3 mt-6 w-full">
        {/* Rows per page */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <span>Rows per page:</span>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="
              border
              border-gray-300
              bg-white
              rounded-md
              px-2
              py-1.5
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-orange-400
            "
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="
              px-3
              py-1.5
              border
              border-gray-300
              rounded-md
              text-sm
              bg-white
              hover:bg-gray-50
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition
            "
          >
            Prev
          </button>

          <span
            className="
              px-3
              py-1.5
              text-sm
              text-gray-600
              whitespace-nowrap
            "
          >
            Page {page} of {totalPage}
          </span>

          <button
            type="button"
            disabled={page === totalPage}
            onClick={() => setPage((prev) => prev + 1)}
            className="
              px-3
              py-1.5
              border
              border-gray-300
              rounded-md
              text-sm
              bg-white
              hover:bg-gray-50
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition
            "
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
