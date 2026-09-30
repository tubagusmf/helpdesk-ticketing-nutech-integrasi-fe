import TicketRow from "./TicketRow";
import { ROLE } from "../../constants/role";

export default function TicketTable({ tickets, role, userId }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        Tidak ada tiket
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* DESKTOP HEADER */}
      <div
        className="
          hidden
          md:grid
          grid-cols-6
          gap-4
          items-center
          px-1
          pb-3
          text-[11px]
          font-bold
          uppercase
          tracking-wide
          text-gray-400
          border-b
        "
      >
        <div>Nomor Tiket</div>
        <div>Prioritas</div>
        <div>Lokasi & Permasalahan</div>
        <div>Assign To</div>
        <div>{role === ROLE.ENGINEER ? "Status" : "Status & SLA"}</div>
        <div>Aksi</div>
      </div>

      <div className="space-y-3 md:space-y-0">
        {tickets.map((ticket) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            role={role}
            userId={userId}
          />
        ))}
      </div>
    </div>
  );
}
