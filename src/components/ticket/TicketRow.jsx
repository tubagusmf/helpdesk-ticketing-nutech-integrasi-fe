import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiClock,
  FiEdit,
  FiEye,
  FiMapPin,
  FiMessageCircle,
  FiSend,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

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

const RESPONSE_SLA_SECONDS = 3 * 60;

const PRIORITY_COLOR = {
  LOW: "bg-gray-100 text-gray-600 ring-gray-200",
  MEDIUM: "bg-blue-50 text-blue-600 ring-blue-100",
  HIGH: "bg-orange-50 text-orange-600 ring-orange-100",
  URGENT: "bg-red-50 text-red-600 ring-red-100",
};

const STATUS_COLOR = {
  OPEN: "bg-red-50 text-red-600 ring-red-100",
  IN_PROGRESS: "bg-orange-50 text-orange-600 ring-orange-100",
  ONHOLD: "bg-blue-50 text-blue-600 ring-blue-100",
  RESOLVED: "bg-green-50 text-green-600 ring-green-100",
  CLOSED: "bg-gray-100 text-gray-600 ring-gray-200",
};

const normalizeStatus = (status) =>
  String(status || "").toUpperCase();

const getPriorityClass = (priority) =>
  PRIORITY_COLOR[normalizeStatus(priority)] || PRIORITY_COLOR.LOW;

const getStatusClass = (status) =>
  STATUS_COLOR[normalizeStatus(status)] ||
  "bg-gray-100 text-gray-600 ring-gray-200";

const parseLocalDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime())
      ? null
      : dateValue;
  }

  const value = String(dateValue).trim();

  if (!value) {
    return null;
  }

  // Try normal ISO / browser date parsing first.
  const parsedDate = new Date(value);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  // Fallback for "YYYY-MM-DD HH:mm:ss" without timezone.
  const normalized = value
    .replace(" ", "T")
    .slice(0, 19);

  const [datePart, timePart] = normalized.split("T");

  if (!datePart) {
    return null;
  }

  const [year, month, day] = datePart
    .split("-")
    .map(Number);

  const [hour = 0, minute = 0, second = 0] = (
    timePart || ""
  )
    .split(":")
    .map(Number);

  if (
    !year ||
    !month ||
    !day ||
    [hour, minute, second].some(Number.isNaN)
  ) {
    return null;
  }

  const localDate = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
  );

  return Number.isNaN(localDate.getTime())
    ? null
    : localDate;
};

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString();
};

const ActionButton = ({
  onClick,
  icon,
  color,
  title,
  badge = null,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
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

function StatusBadge({ status }) {
  return (
    <span
      className={`
        inline-flex
        px-3
        py-1
        text-xs
        rounded-full
        ring-1
        ring-inset
        ${getStatusClass(status)}
      `}
    >
      {status || "-"}
    </span>
  );
}

function EngineerStatusBadge({ status }) {
  const isDone = normalizeStatus(status) === "DONE";

  return (
    <span
      className={`
        inline-flex
        px-3
        py-1
        text-xs
        rounded-full
        ${
          isDone
            ? "bg-green-100 text-green-600"
            : "bg-orange-100 text-orange-600"
        }
      `}
    >
      {isDone ? "DONE" : "PENDING"}
    </span>
  );
}

function ResponseSlaBadge({
  responseSla,
  mobile = false,
}) {
  if (!responseSla) {
    return null;
  }

  if (mobile) {
    return (
      <div className="px-4 pt-3">
        <div
          className={`
            rounded-lg
            px-3
            py-2
            text-xs
            ${
              responseSla.overdue
                ? "bg-red-50 text-red-600"
                : "bg-blue-50 text-blue-600"
            }
          `}
        >
          {responseSla.overdue
            ? `⚠ ${responseSla.text}`
            : `⏱ Response SLA ${responseSla.text}`}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        mt-1
        text-xs
        ${
          responseSla.overdue
            ? "text-red-500 font-medium"
            : "text-blue-600"
        }
      `}
    >
      {responseSla.overdue
        ? `⚠ ${responseSla.text}`
        : `⏱ Response ${responseSla.text}`}
    </div>
  );
}

function TicketSla({
  ticket,
  now,
  mobile = false,
}) {
  const status = normalizeStatus(ticket.status);

  if (status !== "OPEN") {
    return null;
  }

  const dueDate = parseLocalDate(ticket.due_at);

  const isOverdue =
    Boolean(dueDate) &&
    dueDate.getTime() < now.getTime();

  const diffMs = dueDate
    ? dueDate.getTime() - now.getTime()
    : 0;

  if (!dueDate) {
    return (
      <div
        className={`
          flex
          items-center
          gap-1
          ${mobile ? "mt-1" : "mt-1"}
          text-xs
          text-gray-500
        `}
      >
        <FiClock size={13} />
        -
      </div>
    );
  }

  const totalMinutes = Math.max(
    0,
    Math.floor(diffMs / 60000),
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const text = isOverdue
    ? "Overdue"
    : hours > 0
      ? `${hours}j ${minutes}m lagi`
      : `${minutes}m lagi`;

  return (
    <div
      className={`
        flex
        items-center
        gap-1
        ${mobile ? "mt-1" : "mt-1"}
        text-xs
        ${
          isOverdue
            ? "text-red-500 font-medium"
            : "text-gray-500"
        }
      `}
    >
      {isOverdue ? (
        <FiAlertCircle size={13} />
      ) : (
        <FiClock size={13} />
      )}
      {text}
    </div>
  );
}

export default function TicketRow({
  ticket,
  role,
  userId,
}) {
  const navigate = useNavigate();

  const [showResolution, setShowResolution] =
    useState(false);
  const [showComment, setShowComment] =
    useState(false);
  const [showHistory, setShowHistory] =
    useState(false);
  const [showReassignModal, setShowReassignModal] =
    useState(false);
  const [showEngineerResolution, setShowEngineerResolution] =
    useState(false);

  const [now, setNow] = useState(
    () => new Date(),
  );

  const [responded, setResponded] = useState(
    Boolean(ticket.staff_first_response_at),
  );

  const [unreadCommentCount, setUnreadCommentCount] = useState(
    Number(ticket.unread_comment_count) || 0,
  );

  /* =======================================================
     REAL-TIME CLOCK
  ======================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     SYNC RESPONSE STATE WITH TICKET PROP
  ======================================================= */

  useEffect(() => {
    setResponded(Boolean(ticket.staff_first_response_at));
  }, [ticket.staff_first_response_at]);

  useEffect(() => {
    setUnreadCommentCount(
      Number(ticket.unread_comment_count) || 0,
    );
  }, [ticket.unread_comment_count]);

  const status = normalizeStatus(ticket.status);

  const isStaff = role === ROLE.STAFF;

  const isAssignedToCurrentStaff =
    Boolean(ticket.staff_assigned_to_id) &&
    Number(ticket.staff_assigned_to_id) ===
      Number(userId);

  const canRespond =
    isStaff &&
    isAssignedToCurrentStaff &&
    !responded;

  const hasUnreadEngineerResolution =
    Boolean(ticket.engineer_resolution_unread);

  const canShowResponseSla =
    canRespond && status === "OPEN";

  const responseSla = useMemo(() => {
    if (!canShowResponseSla) {
      return null;
    }

    if (!ticket.staff_assigned_at) {
      return null;
    }

    const assignedAt = new Date(
      ticket.staff_assigned_at,
    ).getTime();

    if (Number.isNaN(assignedAt)) {
      return null;
    }

    const elapsedSeconds = Math.floor(
      (now.getTime() - assignedAt) / 1000,
    );

    const remainingSeconds =
      RESPONSE_SLA_SECONDS - elapsedSeconds;

    if (remainingSeconds <= 0) {
      return {
        overdue: true,
        text: "Ticket belum diresponse",
      };
    }

    const minutes = Math.floor(
      remainingSeconds / 60,
    );

    const seconds =
      remainingSeconds % 60;

    return {
      overdue: false,
      text: `${minutes}:${String(seconds).padStart(
        2,
        "0",
      )}`,
    };
  }, [
    canShowResponseSla,
    ticket.staff_assigned_at,
    now,
  ]);

  /* =======================================================
     TICKET STATUS / SLA
  ======================================================= */

  const ticketOverdue = useMemo(() => {
    if (status !== "OPEN") {
      return false;
    }

    const dueDate = parseLocalDate(
      ticket.due_at,
    );

    return Boolean(dueDate) &&
      dueDate.getTime() < now.getTime();
  }, [
    status,
    ticket.due_at,
    now,
  ]);

  const handleTicketClick = () => {
    navigate(`/tickets/${ticket.id}`);
  };

  const handleResponse = async () => {
    if (!canRespond) {
      return;
    }

    try {
      await responseTicket(ticket.id);

      setResponded(true);

      toast.success(
        "Ticket berhasil diresponse",
      );
    } catch (error) {
      console.error(
        "Response ticket error:",
        error,
      );

      toast.error(
        error?.message ||
          "Gagal melakukan response ticket",
      );
    }
  };

  const handleOpenComment = async () => {
    try {
      await markTicketCommentsAsRead(
        ticket.id,
      );
    } catch (error) {
      console.error(
        "Mark comment as read error:",
        error,
      );
    } finally {
      // Preserve current behavior used by the existing table.
      setUnreadCommentCount(0);
      setShowComment(true);
    }
  };

  const openResolution = () => {
    setShowResolution(true);
  };

  const openHistory = () => {
    setShowHistory(true);
  };

  const openEngineerResolution = () => {
    setShowEngineerResolution(true);
  };

  const openReassign = () => {
    setShowReassignModal(true);
  };

  const handleResolutionSuccess = () => {
    window.location.reload();
  };

  const handleEngineerResolutionSuccess = () => {
    setShowEngineerResolution(false);
    window.location.reload();
  };

  const handleReassignSuccess = () => {
    setShowReassignModal(false);
  };

  const renderCommentBadge = () => {
    if (!(unreadCommentCount > 0)) {
      return null;
    }

    return (
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
        {unreadCommentCount}
      </span>
    );
  };

  const canOpenResolution =
    role === ROLE.ADMINISTRATOR ||
    role === ROLE.STAFF ||
    (role === ROLE.USER && status === "RESOLVED");

  const canEngineerResolve =
    role === ROLE.ENGINEER &&
    Number(ticket.assigned_to_id) === Number(userId);

  const canReassign =
    [
      ROLE.ADMINISTRATOR,
      ROLE.STAFF,
      ROLE.EXECUTIVE,
    ].includes(role) &&
    !["RESOLVED", "CLOSED"].includes(
      status,
    );

  /* =======================================================
     RENDER
  ======================================================= */

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
        {/* =================================================
            DESKTOP
        ================================================== */}

        <div className="hidden md:grid md:grid-cols-6 gap-4 items-start">
          {/* TICKET */}
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleTicketClick}
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
              {formatDateTime(ticket.created_at)}
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
                ${getPriorityClass(ticket.priority)}
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
              <EngineerStatusBadge
                status={ticket.engineer_status}
              />
            ) : (
              <>
                <StatusBadge
                  status={ticket.status}
                />

                {status === "OPEN" && (
                  <div>
                    <div
                      className={`
                        mt-1
                        text-xs
                        ${
                          ticketOverdue
                            ? "text-red-500 font-medium"
                            : "text-gray-500"
                        }
                      `}
                    >
                      {ticketOverdue
                        ? "⚠ Overdue"
                        : `⏳ ${getSLAText(
                            ticket.due_at,
                            now,
                          )}`}
                    </div>

                    <ResponseSlaBadge
                      responseSla={responseSla}
                    />
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
                onClick={openHistory}
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
                  badge={renderCommentBadge()}
                />
              )}

              {[ROLE.ADMINISTRATOR, ROLE.STAFF].includes(role) && (
                <ActionButton
                  onClick={openResolution}
                  icon={<FiEdit size={17} />}
                  color="text-orange-600 hover:bg-orange-50"
                  title="Resolution Ticket"
                />
              )}

              {canRespond && (
                <ActionButton
                  onClick={handleResponse}
                  icon={<FiClock size={17} />}
                  color="text-blue-600 hover:bg-blue-50"
                  title="Response Ticket"
                />
              )}

              {canEngineerResolve && (
                <ActionButton
                  onClick={openEngineerResolution}
                  icon={<FiEdit size={17} />}
                  color="text-orange-600 hover:bg-orange-50"
                  title="Engineer Resolution"
                />
              )}

              {role === ROLE.USER &&
                status === "RESOLVED" && (
                  <ActionButton
                    onClick={openResolution}
                    icon={<FiEdit size={17} />}
                    color="text-orange-600 hover:bg-orange-50"
                    title="Resolution Ticket"
                  />
                )}

              {canReassign && (
                <ActionButton
                  onClick={openReassign}
                  icon={<FiSend size={17} />}
                  color="text-purple-600 hover:bg-purple-50"
                  title="Reassign"
                />
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            MOBILE CARD
        ================================================== */}

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
                  onClick={handleTicketClick}
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
                  {formatDateTime(ticket.created_at)}
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
                  ${getPriorityClass(ticket.priority)}
                `}
              >
                {ticket.priority || "-"}
              </span>
            </div>
          </div>

          {/* PROJECT / LOCATION */}
          <div className="px-4 py-4">
            <div className="flex items-start gap-2">
              <FiMapPin
                className="mt-0.5 text-orange-500 shrink-0"
                size={16}
              />

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
                <FiUser
                  size={15}
                  className="text-gray-400 shrink-0"
                />

                <span className="text-sm text-gray-700 break-words">
                  {ticket.assigned_to_name || "-"}
                </span>
              </div>
            </div>

            {/* STATUS */}
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase text-gray-400">
                {role === ROLE.ENGINEER
                  ? "Status"
                  : "Status & SLA"}
              </p>

              <div className="mt-2">
                {role === ROLE.ENGINEER ? (
                  <EngineerStatusBadge
                    status={ticket.engineer_status}
                  />
                ) : (
                  <>
                    <StatusBadge
                      status={ticket.status}
                    />

                    <TicketSla
                      ticket={ticket}
                      now={now}
                      mobile
                    />
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
          <ResponseSlaBadge
            responseSla={responseSla}
            mobile
          />

          {/* ACTION BAR */}
          <div className="p-3 mt-2">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 p-1">
              {/* VIEW */}
              <ActionButton
                onClick={openHistory}
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
                  badge={renderCommentBadge()}
                />
              ) : (
                <div />
              )}

              {/* RESOLUTION */}
              {canOpenResolution && (
                <ActionButton
                  onClick={openResolution}
                  icon={<FiEdit size={18} />}
                  color="text-orange-600 hover:bg-white"
                  title="Resolution"
                />
              )}

              {/* ENGINEER RESOLUTION */}
              {canEngineerResolve && (
                <ActionButton
                  onClick={openEngineerResolution}
                  icon={<FiEdit size={18} />}
                  color="text-orange-600 hover:bg-white"
                  title="Engineer Resolution"
                />
              )}

              {/* RESPONSE */}
              {canRespond && (
                <ActionButton
                  onClick={handleResponse}
                  icon={<FiClock size={18} />}
                  color="text-blue-600 hover:bg-white"
                  title="Response"
                />
              )}

              {/* REASSIGN */}
              {canReassign && (
                <ActionButton
                  onClick={openReassign}
                  icon={<FiSend size={18} />}
                  color="text-purple-600 hover:bg-white"
                  title="Reassign"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MODALS
      ====================================================== */}

      {showResolution && (
        <TicketResolutionModal
          ticket={ticket}
          role={role}
          onClose={() =>
            setShowResolution(false)
          }
          onSuccess={handleResolutionSuccess}
        />
      )}

      {showEngineerResolution && (
        <TicketEngineerResolutionModal
          ticket={ticket}
          onClose={() =>
            setShowEngineerResolution(false)
          }
          onSuccess={
            handleEngineerResolutionSuccess
          }
        />
      )}

      {showComment && (
        <TicketCommentModal
          ticket={ticket}
          onClose={() =>
            setShowComment(false)
          }
        />
      )}

      {showHistory && (
        <TicketHistoryModal
          ticket={ticket}
          onClose={() =>
            setShowHistory(false)
          }
        />
      )}

      {showReassignModal && (
        <TicketReassignModal
          ticket={ticket}
          onClose={() =>
            setShowReassignModal(false)
          }
          onSuccess={handleReassignSuccess}
        />
      )}
    </>
  );
}

/* =========================================================
   TICKET SLA HELPERS
========================================================= */

function getSLAText(dueAt, now) {
  const due = parseLocalDate(dueAt);

  if (!due) {
    return "-";
  }

  const diffMs =
    due.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Overdue";
  }

  const totalMinutes = Math.floor(
    diffMs / 60000,
  );

  const hours = Math.floor(
    totalMinutes / 60,
  );

  const minutes =
    totalMinutes % 60;

  if (hours > 0) {
    return `${hours}j ${minutes}m lagi`;
  }

  return `${minutes}m lagi`;
}
