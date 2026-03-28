import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import TicketTable from "../components/ticket/TicketTable";
import TicketFilter from "../components/ticket/TicketFilter";
import { getTickets } from "../services/ticketService";

export default function TicketManagement() {

  const menu = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Data Ticket", path: "/admin/tickets" },
    { label: "Manajemen User", path: "/admin/users" },
    { label: "Master Data", path: "/admin/master" },
  ];

  const [tickets,setTickets] = useState([])
  const [search,setSearch] = useState("")

  const loadTickets = async () => {
    const res = await getTickets();
  
    console.log("API RESPONSE:", res);
    console.log("tickets type:", typeof res);
    console.log("tickets value:", res);
  
    setTickets(res || []);
  };

  useEffect(()=>{
    loadTickets()
  },[])

  return (
    <DashboardLayout title="Manajemen Tiket" menu={menu}>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Daftar Tiket Aduan
          </h2>

          <p className="text-gray-500 text-sm">
            Manajemen tiket helpdesk
          </p>
        </div>

        <TicketFilter
          search={search}
          setSearch={setSearch}
        />

        <TicketTable
          tickets={tickets}
          search={search}
        />
      </div>

    </DashboardLayout>
  )
}