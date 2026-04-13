import TicketRow from "./TicketRow"

export default function TicketTable({tickets}){

    return(
        <div className="mb-4">
            <div className="grid grid-cols-6 text-xs font-semibold text-gray-500 border-b pb-2">
                <div className="col-span-1">NOMOR TIKET</div>
                <div className="col-span-1">PRIORITAS</div>
                <div className="col-span-1">LOKASI & MASALAH</div>
                <div className="col-span-1">ASSIGN TO</div>
                <div className="col-span-1">STATUS & SLA</div>
                <div className="col-span-1">AKSI</div>
            </div>

            {Array.isArray(tickets) && tickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
            ))}
        </div>
    );
}