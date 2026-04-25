import { FiSearch, FiDownload, FiPlus, FiRotateCcw } from "react-icons/fi";
import { useState, useEffect } from "react";
import TicketModal from "../modal/TicketModal";
import { getProjects, getStaffs } from "../../services/ticketService";
import { exportTickets } from "../../services/ticketService";

export default function TicketFilter({ search, setSearch, filters, setFilters, tickets, role }) {

  const [openModal, setOpenModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [reporters, setReporters] = useState([]);

  useEffect(() => {
    loadFilterData();
  }, []);
  
  const loadFilterData = async () => {
    try {
      const projectRes = await getProjects();
      const staffRes = await getStaffs();
  
      setProjects(projectRes?.data || projectRes || []);
      setStaffs(staffRes?.data || staffRes || []);
      setReporters(staffRes?.data || staffRes || []);
    } catch (err) {
      console.error("Error load filter:", err);
    }
  };

  const reporterOptions = Array.from(
    new Map(
      (tickets || []).map((t) => [
        t.reporter_name,
        {
          id: t.reporter_id,
          name: t.reporter_name,
        },
      ])
    ).values()
  );

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleReset = () => {
    setFilters({
      project_id: "",
      assigned_to_id: "",
      reporter_id: "",
      priority: "",
      status: "",
      start_date: "",
      end_date: "",
    });
  };

  return (
    <>
      <div className="bg-gray-50 border rounded-xl p-4 mb-4">

        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Daftar Tiket Aduan
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">

          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Cari Nomor Tiket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border bg-white pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">

            <button
              onClick={() => exportTickets(filters)}
              className="p-2 border rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
            >
              <FiDownload size={16} />
            </button>

            {["USER", "ADMINISTRATOR"].includes(role) && (
            <button
              onClick={() => setOpenModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
            >
              <FiPlus size={16} />
              Buat Tiket
            </button>
          )}

          </div>
        </div>

        <div
          className={`grid gap-2 ${
            role === "ADMINISTRATOR"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-8"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6"
          }`}
        >
          <select
            name="project_id"
            value={filters.project_id}
            onChange={handleChange}
            className="border bg-white px-3 py-2 rounded-lg text-sm"
          >
            <option value="">Semua Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {role === "ADMINISTRATOR" && (
            <select
              name="assigned_to_id"
              value={filters.assigned_to_id}
              onChange={handleChange}
              className="border bg-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="">Semua Staff</option>
              {staffs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {role === "ADMINISTRATOR" && (
            <select name="reporter_id" value={filters.reporter_id} onChange={handleChange} className="border px-3 py-2 rounded-lg text-sm">
              <option value="">Semua Pelapor</option>
              {reporterOptions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}

          <select
            name="priority"
            value={filters.priority}
            onChange={handleChange}
            className="border bg-white px-3 py-2 rounded-lg text-sm"
          >
            <option value="">Semua Prioritas</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="border bg-white px-3 py-2 rounded-lg text-sm"
          >
            <option value="">Semua Status</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Tanggal Awal</label>
            <input type="date" name="start_date" value={filters.start_date} onChange={handleChange} className="border px-3 py-2 rounded-lg text-sm" />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Tanggal Akhir</label>
            <input type="date" name="end_date" value={filters.end_date} onChange={handleChange} className="border px-3 py-2 rounded-lg text-sm" />
          </div>

          <button onClick={handleReset} className="flex items-center justify-center gap-2 border px-3 py-2 rounded-lg text-sm bg-white hover:bg-gray-100">
            <FiRotateCcw size={14} />
            Reset Filter
          </button>

        </div>
      </div>

      {openModal && (
        <TicketModal
          onClose={() => setOpenModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </>
  );
}