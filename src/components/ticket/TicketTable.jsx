import TicketRow from "./TicketRow"

export default function TicketTable({ tickets, role }) {

    if (!tickets || tickets.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          Tidak ada tiket
        </div>
      );
    }
  
    return (
      <div className="mb-4">
        <div className="grid grid-cols-6 text-xs font-semibold text-gray-500 border-b pb-2">
          <div>NOMOR TIKET</div>
          <div>PRIORITAS</div>
          <div>LOKASI & MASALAH</div>
          <div>ASSIGN TO</div>
          <div>STATUS & SLA</div>
          <div>AKSI</div>
        </div>
  
        {tickets.map(ticket => (
          <TicketRow key={ticket.id} ticket={ticket} role={role} />
        ))}
      </div>
    );
  }