import { FiEdit, FiEye, FiMessageCircle, FiSend, FiClock } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TicketResolutionModal from "../modal/TicketResolutionModal";
import TicketCommentModal from "../modal/TicketCommentModal";
import TicketHistoryModal from "../modal/TicketHistoryModal";
import TicketReassignModal from "../modal/TicketReassignModal";
import TicketEngineerResolutionModal from "../modal/TicketEngineerResolutionModal";
import { markTicketCommentsAsRead, responseTicket } from "../../services/ticketService";
import { ROLE } from "../../constants/role";
import { toast } from "react-hot-toast";

export default function TicketRow({ ticket, role, userId }) {
    const [showResolution, setShowResolution] = useState(false);  
    const [showComment, setShowComment] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [showEngineerResolution, setShowEngineerResolution] = useState(false);
    const navigate = useNavigate();
    const RESPONSE_SLA_SECONDS = 3 * 60;

    const priorityColor = {
      LOW: "bg-gray-400",
      MEDIUM: "bg-blue-500",
      HIGH: "bg-orange-500",
      URGENT: "bg-red-600",
    };
  
    const statusColor = {
      OPEN: "bg-red-100 text-red-600",
      IN_PROGRESS: "bg-orange-100 text-orange-600",
      ONHOLD: "bg-blue-100 text-blue-600",
      RESOLVED: "bg-green-100 text-green-600",
      CLOSED: "bg-gray-200 text-gray-600",
    };

    const handleResponse = async () => {
      try {
        await responseTicket(ticket.id);

        toast.success("Ticket berhasil diresponse");
      } catch (error) {
        console.error(error);

        toast.error(
          error?.message ||
          "Gagal melakukan response ticket"
        );
      }
    };

    const handleOpenComment = async () => {
      try {
        await markTicketCommentsAsRead(ticket.id);
    
        ticket.unread_comment_count = 0;
    
      } catch (err) {
        console.error(err);
      }
    
      setShowComment(true);
    };

    const parseLocalDate = (dateString) => {
      const [date, time] = dateString.split("T");
      const [year, month, day] = date.split("-");
      const [hour, minute] = time.split(":");
    
      return new Date(
        year,
        month - 1,
        day,
        hour,
        minute
      );
    };

    const getSLA = (dueAt) => {
      const now = new Date();
      const due = parseLocalDate(dueAt);
    
      const diffMs = due - now;
    
      if (diffMs <= 0) return "OVERDUE";
    
      const minutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(minutes / 60);
    
      if (hours > 0) {
        return `${hours} jam ${minutes % 60} menit lagi`;
      }
    
      return `${minutes} menit lagi`;
    };

    const [now, setNow] = useState(new Date());

    useEffect(() => {
      const interval = setInterval(() => {
        setNow(new Date());
      }, 1000);
    
      return () => clearInterval(interval);
    }, []);

    const getResponseSLA = (ticket) => {
      if (
        !ticket.staff_assigned_at ||
        ticket.staff_first_response_at
      ) {
        return null;
      }

      const assignedAt = new Date(
        ticket.staff_assigned_at
      ).getTime();

      const elapsedSeconds = Math.floor(
        (now - assignedAt) / 1000
      );

      const remainingSeconds = RESPONSE_SLA_SECONDS - elapsedSeconds;

      if (remainingSeconds <= 0) {
        return {
          overdue: true,
          text: "⚠ Ticket belum diresponse",
        };
      }

      const minutes = Math.floor(
        remainingSeconds / 60
      );

      const seconds = remainingSeconds % 60;

      return {
        overdue: false,
        text: `⏱ ${minutes}:${String(
          seconds
        ).padStart(2, "0")}`,
      };
    };
  
    const overdue =
      parseLocalDate(ticket.due_at) < now &&
      ticket.status === "OPEN";
  
      return (
        <>
          <div className="grid grid-cols-6 py-4 border-b items-start text-sm">
      
            {/* TICKET INFO */}
            <div>
              <button
                type="button"
                onClick={() =>
                  navigate(`/tickets/${ticket.id}`)
                }
                className="font-semibold text-gray-900 cursor-pointer hover:text-orange-500 text-left"
                title="Lihat detail tiket"
              >
                {ticket.ticket_code}
              </button>

              <div className="text-gray-400 text-xs">
                {new Date(ticket.created_at).toLocaleString()}
              </div>

              <div className="text-blue-600 text-xs">
                {ticket.reporter_name}
              </div>
            </div>
      
            {/* PRIORITY */}
            <div>
              <span
                className={`text-white text-xs px-2 py-1 rounded ${priorityColor[ticket.priority]}`}
              >
                {ticket.priority}
              </span>
            </div>
      
            {/* LOKASI */}
            <div>
              <div className="font-semibold text-gray-800">
                {ticket.project_name}
              </div>
      
              <div className="text-gray-500 text-xs">
                {ticket.location_name} •{" "}
                <span className="text-blue-600">
                  ID: {ticket.asset_code}
                </span>
              </div>
      
              <div className="text-gray-600 text-xs mt-1">
                {ticket.description}
              </div>
            </div>
      
            {/* ASSIGN */}
            <div>
              {ticket.assigned_to_name || "-"}
            </div>
      
            {/* STATUS */}
            {/* STATUS / ENGINEER RESOLUTION */}
            <div>
              {role === ROLE.ENGINEER ? (
                ticket.engineer_status === "DONE" ? (
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600">
                    DONE
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs rounded-full bg-orange-100 text-orange-600">
                    PENDING
                  </span>
                )
              ) : (
                <>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${statusColor[ticket.status]}`}
                  >
                    {ticket.status}
                  </span>

                  {ticket.status === "OPEN" && (
                    <div
                      className={`text-xs mt-1 ${
                        overdue ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      {overdue
                        ? "⚠ Overdue"
                        : `⏳ ${getSLA(ticket.due_at)}`}
                    </div>
                  )}
                </>
              )}

              {role === ROLE.STAFF && (
                <>
                  {(() => {
                    const responseSLA = getResponseSLA(ticket);

                    if (!responseSLA) return null;

                    return (
                      <div
                        className={`text-xs mt-1 ${
                          responseSLA.overdue
                            ? "text-red-500 font-semibold"
                            : "text-blue-500"
                        }`}
                      >
                        {responseSLA.text}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
      
            {/* ACTION */}
            <div className="flex gap-3">

            {/* VIEW */}
            <button onClick={() => setShowHistory(true)} className="text-blue-600">
              <FiEye size={18} />
            </button>

            {/* COMMENT */}
            {role !== ROLE.EXECUTIVE && (
              <button
                onClick={handleOpenComment}
                className="text-green-600 relative"
                title="Comment"
              >
                <FiMessageCircle size={18} />

                {ticket.unread_comment_count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                    {ticket.unread_comment_count}
                  </span>
                )}
              </button>
            )}

            {/* RESOLUTION - ADMINISTRATOR & STAFF */}
            {[ROLE.ADMINISTRATOR, ROLE.STAFF].includes(role) && (
              <button
                onClick={() => setShowResolution(true)}
                className="text-orange-600"
                title="Resolution Ticket"
              >
                <FiEdit size={18} />
              </button>
            )}

            {/* RESPONSE TICKET BY STAFF */}
            {role === ROLE.STAFF &&
              ticket.staff_assigned_to_id &&
              Number(ticket.staff_assigned_to_id) === Number(userId) &&
              !ticket.staff_first_response_at && (
                <button
                  onClick={handleResponse}
                  className="text-blue-600 hover:text-blue-800"
                  title="Response Ticket"
                >
                  <FiClock size={18} />
                </button>
            )}

            {/* RESOLUTION - ENGINEER */}
            {role === ROLE.ENGINEER &&
            Number(ticket.assigned_to_id) === Number(userId) && (
              <button
                onClick={() =>
                  setShowEngineerResolution(true)
                }
                className="text-orange-600 hover:text-orange-800"
                title="Engineer Resolution"
              >
                <FiEdit size={18} />
              </button>
            )}

            {/* RESOLUTION - USER / REPORTER */}
            {role === ROLE.USER && ticket.status === "RESOLVED" && (
              <button
                onClick={() => setShowResolution(true)}
                className="text-orange-600"
                title="Resolution Ticket"
              >
                <FiEdit size={18} />
              </button>
            )}

            {[
              ROLE.ADMINISTRATOR,
              ROLE.STAFF,
              ROLE.EXECUTIVE,
            ].includes(role) && (
              <button
                type="button"
                onClick={() => setShowReassignModal(true)}
                className="text-purple-600 hover:text-purple-800"
                title="Reassign Ticket ke Engineer"
              >
                <FiSend size={16} />
              </button>
            )}

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
              onClose={() =>
                setShowEngineerResolution(false)
              }
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