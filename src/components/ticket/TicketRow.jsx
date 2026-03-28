import { FiEdit, FiEye, FiTrash } from "react-icons/fi";

export default function TicketRow({ ticket }) {

    const priorityColor = {
      LOW: "bg-gray-400",
      MEDIUM: "bg-blue-500",
      HIGH: "bg-orange-500",
      URGENT: "bg-red-600",
    };
  
    const statusColor = {
      OPEN: "bg-red-100 text-red-600",
      RESOLVED: "bg-green-100 text-green-600",
      CLOSED: "bg-gray-200 text-gray-600",
    };
  
    const overdue =
      new Date(ticket.due_at) < new Date() &&
      ticket.status === "OPEN";
  
    return (
      <div className="grid grid-cols-5 py-4 border-b items-start text-sm">
  
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
  
        {/* LOKASI & MASALAH */}
  
        <div>
  
          <div className="font-semibold text-gray-800">
            {ticket.project_name}
          </div>
  
          <div className="text-gray-500 text-xs">
            {ticket.location_name}
            {" • "}
            <span className="text-blue-600">
              ID: {ticket.asset_code}
            </span>
          </div>
  
          <div className="text-gray-600 text-xs mt-1">
            {ticket.description}
          </div>
  
        </div>
  
        {/* STATUS */}
  
        <div>
  
          <span
            className={`px-3 py-1 text-xs rounded-full ${statusColor[ticket.status]}`}
          >
            {ticket.status}
          </span>
  
          {overdue && (
            <div className="text-red-500 text-xs mt-1">
              ⚠ Overdue
            </div>
          )}
        </div>
  
        {/* ACTION */}
  
        <div className="flex gap-3 text-sm">
          <button 
            onClick={() => onDetailClick(ticket)} 
            className="text-blue-600 rounded hover:bg-blue-100">
            <FiEye size={18} />
          </button>

          <button
            onClick={() => onEdit(ticket)}
            className="text-orange-600 rounded hover:bg-red-100">
            <FiEdit size={18} />
          </button>
  
          <button
            onClick={() => handleDeleteClick(ticket)}
            className="text-red-600 rounded hover:bg-red-100">
            <FiTrash size={18} />
          </button>
        </div>
      </div>
    );
  }