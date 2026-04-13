import { FiEdit, FiEye, FiMessageCircle } from "react-icons/fi";
import { useState, useEffect } from "react";
import TicketResolutionModal from "../modal/TicketResolutionModal";
import TicketCommentModal from "../modal/TicketCommentModal";

export default function TicketRow({ ticket }) {

    const [showResolution, setShowResolution] = useState(false);  
    const [showComment, setShowComment] = useState(false);

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
      }, 60000);
    
      return () => clearInterval(interval);
    }, []);
  
    const overdue =
      parseLocalDate(ticket.due_at) < now &&
      ticket.status === "OPEN";
  
      return (
        <>
          <div className="grid grid-cols-6 py-4 border-b items-start text-sm">
      
            {/* TICKET INFO */}
            <div>
              <div className="font-semibold text-gray-800">
                {ticket.ticket_code}
              </div>
      
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
            <div>
              <span
                className={`px-3 py-1 text-xs rounded-full ${statusColor[ticket.status]}`}
              >
                {ticket.status}
              </span>
      
              {ticket.status === "OPEN" && (
                <div className={`text-xs mt-1 ${overdue ? "text-red-500" : "text-gray-500"}`}>
                  {overdue ? "⚠ Overdue" : `⏳ ${getSLA(ticket.due_at)}`}
                </div>
              )}
            </div>
      
            {/* ACTION */}
            <div className="flex gap-3">
              <button className="text-blue-600">
                <FiEye size={18} />
              </button>
      
              <button
                onClick={() => setShowResolution(true)}
                className="text-orange-600"
              >
                <FiEdit size={18} />
              </button>

              <button
                onClick={() => setShowComment(true)}
                className="text-green-600"
              >
                <FiMessageCircle size={18} />
              </button>
            </div>
      
          </div>
      
          {showResolution && (
            <TicketResolutionModal
              ticket={ticket}
              onClose={() => setShowResolution(false)}
              onSuccess={() => window.location.reload()}
            />
          )}

          {showComment && (
            <TicketCommentModal
              ticket={ticket}
              onClose={() => setShowComment(false)}
            />
          )}
        </>
      );
  }