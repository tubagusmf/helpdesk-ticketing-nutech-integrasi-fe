import {
  FiEdit,
  FiEye,
  FiMessageCircle,
  FiSend,
  FiClock,
  FiMapPin,
  FiUser,
  FiAlertCircle,
} from "react-icons/fi";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import TicketResolutionModal from "../modal/TicketResolutionModal";
import TicketCommentModal from "../modal/TicketCommentModal";
import TicketHistoryModal from "../modal/TicketHistoryModal";
import TicketReassignModal from "../modal/TicketReassignModal";
import TicketEngineerResolutionModal from "../modal/TicketEngineerResolutionModal";

import {
  markTicketCommentsAsRead,
  responseTicket,
} from "../../services/ticketService";

import { ROLE } from "../../constants/role";
import { toast } from "react-hot-toast";

export default function TicketRow({ ticket, role, userId }) {
  const [showResolution, setShowResolution] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showEngineerResolution, setShowEngineerResolution] = useState(false);

  const [now, setNow] = useState(new Date());

  const navigate = useNavigate();

  const RESPONSE_SLA_SECONDS = 3 * 60;

  const priorityColor = {
    LOW: "bg-gray-100 text-gray-600 ring-gray-200",
    MEDIUM: "bg-blue-50 text-blue-600 ring-blue-100",
    HIGH: "bg-orange-50 text-orange-600 ring-orange-100",
    URGENT: "bg-red-50 text-red-600 ring-red-100",
  };

  const statusColor = {
    OPEN: "bg-red-50 text-red-600 ring-red-100",
    IN_PROGRESS: "bg-orange-50 text-orange-600 ring-orange-100",
    ONHOLD: "bg-blue-50 text-blue-600 ring-blue-100",
    RESOLVED: "bg-green-50 text-green-600 ring-green-100",
    CLOSED: "bg-gray-100 text-gray-600 ring-gray-200",
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const parseLocalDate = (dateString) => {
    if (!dateString) {
      return null;
    }

    // Jika sudah berupa Date
    if (dateString instanceof Date) {
      return Number.isNaN(dateString.getTime()) ? null : dateString;
    }

    const value = String(dateString).trim();

    if (!value) {
      return null;
    }

    const isoDate = new Date(value);

    if (!Number.isNaN(isoDate.getTime())) {
      return isoDate;
    }

    const normalized = value.replace(" ", "T").slice(0, 19);

    const [datePart, timePart] = normalized.split("T");

    if (!datePart) {
      return null;
    }

    const [year, month, day] = datePart.split("-").map(Number);

    const [hour = 0, minute = 0, second = 0] = (timePart || "")
      .split(":")
      .map(Number);

    if (!year || !month || !day || [hour, minute, second].some(Number.isNaN)) {
      return null;
    }

    const localDate = new Date(year, month - 1, day, hour, minute, second);

    return Number.isNaN(localDate.getTime()) ? null : localDate;
  };

  const getSLA = (dueAt) => {
    const due = parseLocalDate(dueAt);

    if (!due) {
      return "-";
    }

    const diffMs = due.getTime() - now.getTime();

    if (diffMs <= 0) {
      return "Overdue";
    }

    const totalMinutes = Math.floor(diffMs / 60000);

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}j ${minutes}m lagi`;
    }

    return `${minutes}m lagi`;
  };

  const getResponseSLA = () => {
    if (!ticket.staff_assigned_at || ticket.staff_first_response_at) {
      return null;
    }

    const assignedAt = new Date(ticket.staff_assigned_at).getTime();

    if (Number.isNaN(assignedAt)) {
      return null;
    }

    const elapsedSeconds = Math.floor((now.getTime() - assignedAt) / 1000);

    const remainingSeconds = RESPONSE_SLA_SECONDS - elapsedSeconds;

    if (remainingSeconds <= 0) {
      return {
        overdue: true,
        text: "Ticket belum diresponse",
      };
    }

    const minutes = Math.floor(remainingSeconds / 60);

    const seconds = remainingSeconds % 60;

    return {
      overdue: false,
      text: `${minutes}:${String(seconds).padStart(2, "0")}`,
    };
  };

  const dueDate = parseLocalDate(ticket.due_at);

  const overdue =
    Boolean(dueDate) &&
    dueDate.getTime() < now.getTime() &&
    ticket.status === "OPEN";

  const hasUnreadEngineerResolution = Boolean(
    ticket.engineer_resolution_unread,
  );

  const handleResponse = async () => {
    try {
      await responseTicket(ticket.id);

      toast.success("Ticket berhasil diresponse");
    } catch (error) {
      console.error(error);

      toast.error(error?.message || "Gagal melakukan response ticket");
    }
  };

  const handleOpenComment = async () => {
    try {
      await markTicketCommentsAsRead(ticket.id);

      ticket.unread_comment_count = 0;
    } catch (error) {
      console.error(error);
    }

    setShowComment(true);
  };

  const ActionButton = ({ onClick, icon, color, title, badge }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        relative
        w-9
        h-9
        flex
        items-center
        justify-center
        rounded-lg
        transition
        ${color}
      `}
    >
      {icon}

      {badge}
    </button>
  );

  return (
    <>
      <div
        className="
          w-full
          min-w-0

          border-b
          md:border-b

          py-4
          md:py-5

          text-sm
        "
      >

        <div className="hidden md:grid md:grid-cols-6 gap-4 items-start">
          {/* TICKET */}
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/tickets/${ticket.id}`)}
              className="
                font-semibold
                text-gray-900
                text-left
                hover:text-orange-500
                break-words
              "
            >
              {ticket.ticket_code}
            </button>

            <div className="mt-1 text-xs text-gray-400">
              {ticket.created_at
                ? new Date(ticket.created_at).toLocaleString()
                : "-"}
            </div>

            <div className="mt-1 text-xs text-blue-600">
              {ticket.reporter_name || "-"}
            </div>
          </div>

          {/* PRIORITY */}
          <div>
            <span
              className={`
                inline-flex
                px-2
                py-1
                text-xs
                font-semibold
                rounded-md
                ring-1
                ring-inset
                ${priorityColor[ticket.priority] || priorityColor.LOW}
              `}
            >
              {ticket.priority || "-"}
            </span>
          </div>

          {/* LOCATION */}
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 break-words">
              {ticket.project_name || "-"}
            </div>

            <div className="mt-1 text-xs text-gray-500 break-words">
              {ticket.location_name || "-"}

              {" • "}

              <span className="text-blue-600">
                ID: {ticket.asset_code || "-"}
              </span>
            </div>

            <div className="mt-1 text-xs text-gray-600 break-words">
              {ticket.description || "-"}
            </div>
          </div>

          {/* ASSIGN */}
          <div className="min-w-0 break-words">
            {ticket.assigned_to_name || "-"}
          </div>

          {/* STATUS */}
          <div className="min-w-0">
            {role === ROLE.ENGINEER ? (
              <span
                className={`
                  inline-flex
                  px-3
                  py-1
                  text-xs
                  rounded-full
                  ${
                    ticket.engineer_status === "DONE"
                      ? "bg-green-100 text-green-600"
                      : "bg-orange-100 text-orange-600"
                  }
                `}
              >
                {ticket.engineer_status === "DONE" ? "DONE" : "PENDING"}
              </span>
            ) : (
              <>
                <span
                  className={`
                    inline-flex
                    px-3
                    py-1
                    text-xs
                    rounded-full
                    ring-1
                    ring-inset
                    ${statusColor[ticket.status] || "bg-gray-100 text-gray-600"}
                  `}
                >
                  {ticket.status || "-"}
                </span>

                {ticket.status === "OPEN" && (
                  <div
                    className={`
                      mt-1
                      text-xs
                      ${overdue ? "text-red-500 font-medium" : "text-gray-500"}
                    `}
                  >
                    {overdue ? "⚠ Overdue" : `⏳ ${getSLA(ticket.due_at)}`}
                  </div>
                )}

                {hasUnreadEngineerResolution && (
                  <div className="mt-2">
                    <span
                      className="
                        inline-flex
                        px-2
                        py-1
                        rounded-full
                        bg-purple-50
                        text-purple-700
                        ring-1
                        ring-purple-100
                        text-[10px]
                        font-semibold
                      "
                    >
                      🔔 Engineer Updated
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ACTION */}
          <div>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                onClick={() => setShowHistory(true)}
                icon={<FiEye size={17} />}
                color="text-blue-600 hover:bg-blue-50"
                title="Lihat history"
              />

              {role !== ROLE.EXECUTIVE && (
                <ActionButton
                  onClick={handleOpenComment}
                  icon={<FiMessageCircle size={17} />}
                  color="text-green-600 hover:bg-green-50"
                  title="Comment"
                  badge={
                    ticket.unread_comment_count > 0 ? (
                      <span
                        className="
                          absolute
                          -top-1
                          -right-1
                          min-w-[16px]
                          h-4
                          px-1
                          flex
                          items-center
                          justify-center
                          rounded-full
                          bg-red-500
                          text-white
                          text-[9px]
                        "
                      >
                        {ticket.unread_comment_count}
                      </span>
                    ) : null
                  }
                />
              )}

              {[ROLE.ADMINISTRATOR, ROLE.STAFF].includes(role) && (
                <ActionButton
                  onClick={() => setShowResolution(true)}
                  icon={<FiEdit size={17} />}
                  color="text-orange-600 hover:bg-orange-50"
                  title="Resolution Ticket"
                />
              )}

              {role === ROLE.STAFF &&
                ticket.staff_assigned_to_id &&
                Number(ticket.staff_assigned_to_id) === Number(userId) &&
                !ticket.staff_first_response_at && (
                  <ActionButton
                    onClick={handleResponse}
                    icon={<FiClock size={17} />}
                    color="text-blue-600 hover:bg-blue-50"
                    title="Response Ticket"
                  />
                )}

              {role === ROLE.ENGINEER &&
                Number(ticket.assigned_to_id) === Number(userId) && (
                  <ActionButton
                    onClick={() => setShowEngineerResolution(true)}
                    icon={<FiEdit size={17} />}
                    color="text-orange-600 hover:bg-orange-50"
                    title="Engineer Resolution"
                  />
                )}

              {role === ROLE.USER && ticket.status === "RESOLVED" && (
                <ActionButton
                  onClick={() => setShowResolution(true)}
                  icon={<FiEdit size={17} />}
                  color="text-orange-600 hover:bg-orange-50"
                  title="Resolution Ticket"
                />
              )}

              {[ROLE.ADMINISTRATOR, ROLE.STAFF, ROLE.EXECUTIVE].includes(
                role,
              ) &&
                !["RESOLVED", "CLOSED"].includes(
                  String(ticket.status || "").toUpperCase(),
                ) && (
                  <ActionButton
                    onClick={() => setShowReassignModal(true)}
                    icon={<FiSend size={17} />}
                    color="text-purple-600 hover:bg-purple-50"
                    title="Reassign"
                  />
                )}
            </div>
          </div>
        </div>

        {/* =====================================================
            MOBILE CARD
        ====================================================== */}

        <div
          className="
            md:hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
            overflow-hidden
          "
        >
          {/* CARD HEADER */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="
                    text-[15px]
                    font-bold
                    text-gray-900
                    text-left
                    break-all
                    hover:text-orange-500
                  "
                >
                  {ticket.ticket_code}
                </button>

                <div className="mt-1 text-xs text-gray-400">
                  {ticket.created_at
                    ? new Date(ticket.created_at).toLocaleString()
                    : "-"}
                </div>

                <div className="mt-1 text-xs text-blue-600">
                  {ticket.reporter_name || "-"}
                </div>
              </div>

              <span
                className={`
                  shrink-0
                  inline-flex
                  px-2.5
                  py-1
                  text-[10px]
                  font-bold
                  rounded-full
                  ring-1
                  ring-inset
                  ${priorityColor[ticket.priority] || priorityColor.LOW}
                `}
              >
                {ticket.priority || "-"}
              </span>
            </div>
          </div>

          {/* PROJECT / LOCATION */}
          <div className="px-4 py-4">
            <div className="flex items-start gap-2">
              <FiMapPin className="mt-0.5 text-orange-500 shrink-0" size={16} />

              <div className="min-w-0">
                <div className="font-semibold text-gray-800 break-words">
                  {ticket.project_name || "-"}
                </div>

                <div className="text-xs text-gray-500 mt-1 break-words">
                  {ticket.location_name || "-"}

                  {" • "}

                  <span className="text-blue-600">
                    ID: {ticket.asset_code || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div
              className="
                mt-3
                rounded-xl
                bg-gray-50
                border
                border-gray-100
                p-3
              "
            >
              <p className="text-[11px] font-semibold text-gray-400 uppercase">
                Permasalahan
              </p>

              <p className="mt-1 text-sm text-gray-700 leading-5 break-words">
                {ticket.description || "-"}
              </p>
            </div>
          </div>

          {/* ASSIGN + STATUS */}
          <div
            className="
              grid
              grid-cols-2
              border-t
              border-b
              border-gray-100
            "
          >
            {/* ASSIGN */}
            <div className="p-4 border-r border-gray-100">
              <p className="text-[10px] font-bold uppercase text-gray-400">
                Assign To
              </p>

              <div className="flex items-center gap-2 mt-2">
                <FiUser size={15} className="text-gray-400 shrink-0" />

                <span className="text-sm text-gray-700 break-words">
                  {ticket.assigned_to_name || "-"}
                </span>
              </div>
            </div>

            {/* STATUS */}
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase text-gray-400">
                {role === ROLE.ENGINEER ? "Status" : "Status & SLA"}
              </p>

              <div className="mt-2">
                {role === ROLE.ENGINEER ? (
                  <span
                    className={`
                      inline-flex
                      px-2.5
                      py-1
                      text-xs
                      rounded-full

                      ${
                        ticket.engineer_status === "DONE"
                          ? "bg-green-50 text-green-600"
                          : "bg-orange-50 text-orange-600"
                      }
                    `}
                  >
                    {ticket.engineer_status === "DONE" ? "DONE" : "PENDING"}
                  </span>
                ) : (
                  <>
                    <span
                      className={`
                        inline-flex
                        px-2.5
                        py-1
                        text-xs
                        rounded-full
                        ring-1
                        ring-inset

                        ${
                          statusColor[ticket.status] ||
                          "bg-gray-100 text-gray-600"
                        }
                      `}
                    >
                      {ticket.status || "-"}
                    </span>

                    {ticket.status === "OPEN" && (
                      <div
                        className={`
                          flex
                          items-center
                          gap-1
                          mt-1
                          text-xs

                          ${
                            overdue
                              ? "text-red-500 font-medium"
                              : "text-gray-500"
                          }
                        `}
                      >
                        {overdue ? (
                          <>
                            <FiAlertCircle size={13} />
                            Overdue
                          </>
                        ) : (
                          <>
                            <FiClock size={13} />
                            {getSLA(ticket.due_at)}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ENGINEER UPDATE */}
          {hasUnreadEngineerResolution && (
            <div className="px-4 pt-3">
              <div
                className="
                  rounded-lg
                  bg-purple-50
                  border
                  border-purple-100
                  px-3
                  py-2
                  text-xs
                  font-medium
                  text-purple-700
                "
              >
                🔔 Engineer memberikan update baru
              </div>
            </div>
          )}

          {/* STAFF RESPONSE SLA */}
          {role === ROLE.STAFF && (
            <>
              {(() => {
                const responseSLA = getResponseSLA();

                if (!responseSLA) {
                  return null;
                }

                return (
                  <div className="px-4 pt-3">
                    <div
                      className={`
                        rounded-lg
                        px-3
                        py-2
                        text-xs
                        ${
                          responseSLA.overdue
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600"
                        }
                      `}
                    >
                      {responseSLA.overdue
                        ? `⚠ ${responseSLA.text}`
                        : `⏱ Response SLA ${responseSLA.text}`}
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* ACTION BAR */}
          <div className="p-3 mt-2">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 p-1">
              {/* VIEW */}
              <ActionButton
                onClick={() => setShowHistory(true)}
                icon={<FiEye size={18} />}
                color="text-blue-600 hover:bg-white"
                title="Lihat history"
              />

              {/* COMMENT */}
              {role !== ROLE.EXECUTIVE ? (
                <ActionButton
                  onClick={handleOpenComment}
                  icon={<FiMessageCircle size={18} />}
                  color="text-green-600 hover:bg-white"
                  title="Comment"
                  badge={
                    ticket.unread_comment_count > 0 ? (
                      <span
                        className="
                          absolute
                          -top-1
                          -right-1
                          min-w-[16px]
                          h-4
                          px-1
                          flex
                          items-center
                          justify-center
                          rounded-full
                          bg-red-500
                          text-white
                          text-[9px]
                        "
                      >
                        {ticket.unread_comment_count}
                      </span>
                    ) : null
                  }
                />
              ) : (
                <div />
              )}

              {/* RESOLUTION */}
              {([ROLE.ADMINISTRATOR, ROLE.STAFF].includes(role) ||
                (role === ROLE.USER && ticket.status === "RESOLVED")) && (
                <ActionButton
                  onClick={() => setShowResolution(true)}
                  icon={<FiEdit size={18} />}
                  color="text-orange-600 hover:bg-white"
                  title="Resolution"
                />
              )}

              {/* ENGINEER RESOLUTION */}
              {role === ROLE.ENGINEER &&
                Number(ticket.assigned_to_id) === Number(userId) && (
                  <ActionButton
                    onClick={() => setShowEngineerResolution(true)}
                    icon={<FiEdit size={18} />}
                    color="text-orange-600 hover:bg-white"
                    title="Engineer Resolution"
                  />
                )}

              {/* RESPONSE */}
              {role === ROLE.STAFF &&
                ticket.staff_assigned_to_id &&
                Number(ticket.staff_assigned_to_id) === Number(userId) &&
                !ticket.staff_first_response_at && (
                  <ActionButton
                    onClick={handleResponse}
                    icon={<FiClock size={18} />}
                    color="text-blue-600 hover:bg-white"
                    title="Response"
                  />
                )}

              {/* REASSIGN */}
              {[ROLE.ADMINISTRATOR, ROLE.STAFF, ROLE.EXECUTIVE].includes(
                role,
              ) &&
                !["RESOLVED", "CLOSED"].includes(
                  String(ticket.status || "").toUpperCase(),
                ) && (
                  <ActionButton
                    onClick={() => setShowReassignModal(true)}
                    icon={<FiSend size={18} />}
                    color="text-purple-600 hover:bg-white"
                    title="Reassign"
                  />
                )}
            </div>
          </div>
        </div>
      </div>
      
      {showResolution && (
        <TicketResolutionModal
          ticket={ticket}
          role={role}
          onClose={() => setShowResolution(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {showEngineerResolution && (
        <TicketEngineerResolutionModal
          ticket={ticket}
          onClose={() => setShowEngineerResolution(false)}
          onSuccess={() => {
            setShowEngineerResolution(false);
            window.location.reload();
          }}
        />
      )}

      {showComment && (
        <TicketCommentModal
          ticket={ticket}
          onClose={() => setShowComment(false)}
        />
      )}

      {showHistory && (
        <TicketHistoryModal
          ticket={ticket}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showReassignModal && (
        <TicketReassignModal
          ticket={ticket}
          onClose={() => setShowReassignModal(false)}
          onSuccess={() => {
            setShowReassignModal(false);
          }}
        />
      )}
    </>
  );
}
