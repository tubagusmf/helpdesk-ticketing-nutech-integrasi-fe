import { FiSearch, FiDownload, FiPlus, FiRotateCcw } from "react-icons/fi";

export default function TicketFilter({ search, setSearch }) {
  return (
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
            placeholder="Cari tiket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border bg-white pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">

          <button className="p-2 border rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
            <FiDownload size={16} />
          </button>

          <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
            <FiPlus size={16} />
            Buat Tiket
          </button>

        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">

        <select className="border bg-white px-3 py-2 rounded-lg text-sm">
          <option>Semua Project</option>
        </select>

        <select className="border bg-white px-3 py-2 rounded-lg text-sm">
          <option>Semua Teknisi</option>
        </select>

        <select className="border bg-white px-3 py-2 rounded-lg text-sm">
          <option>Semua Pelapor</option>
        </select>

        <select className="border bg-white px-3 py-2 rounded-lg text-sm">
          <option>Semua Prioritas</option>
        </select>

        <select className="border bg-white px-3 py-2 rounded-lg text-sm">
          <option>Semua Status</option>
        </select>

        <button className="flex items-center justify-center gap-2 border px-3 py-2 rounded-lg text-sm bg-white hover:bg-gray-100">
          <FiRotateCcw size={14} />
          Reset Filter
        </button>

      </div>
    </div>
  );
}