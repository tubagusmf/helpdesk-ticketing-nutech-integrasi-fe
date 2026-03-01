
import { useEffect, useState } from "react";
import API from "../services/api";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);

  const fetchTickets = async () => {
    const res = await API.get("/tickets");
    setTickets(res.data);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div>
      <h1 className="text-xl mb-4">Tickets</h1>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Title</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="p-2">{t.title}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
