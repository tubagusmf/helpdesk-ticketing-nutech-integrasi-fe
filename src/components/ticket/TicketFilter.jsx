import {
  FiSearch,
  FiDownload,
  FiPlus,
  FiRotateCcw,
  FiSliders,
  FiChevronDown,
} from "react-icons/fi";

import { useEffect, useMemo, useState } from "react";

import TicketModal from "../modal/TicketModal";

import {
  getProjects,
  getStaffs,
  exportTickets,
} from "../../services/ticketService";

import { ROLE } from "../../constants/role";

const EMPTY_FILTERS = {
  project_id: "",
  assigned_to_id: "",
  reporter_id: "",
  priority: "",
  status: "",
  start_date: "",
  end_date: "",
};

export default function TicketFilter({
  search,
  setSearch,
  filters,
  setFilters,
  tickets,
  role,
}) {
  const [openModal, setOpenModal] = useState(false);

  const [projects, setProjects] = useState([]);
  const [staffs, setStaffs] = useState([]);

  const [showFilters, setShowFilters] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  // =========================================================
  // LOAD FILTER DATA
  // =========================================================

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [projectRes, staffRes] = await Promise.all([
        getProjects(),
        getStaffs(),
      ]);

      setProjects(projectRes?.data || projectRes || []);

      setStaffs(staffRes?.data || staffRes || []);
    } catch (error) {
      console.error("Error load filter:", error);
    }
  };

  const reporterOptions = useMemo(() => {
    return Array.from(
      new Map(
        (tickets || [])
          .filter((ticket) => ticket.reporter_id && ticket.reporter_name)
          .map((ticket) => [
            ticket.reporter_id,
            {
              id: ticket.reporter_id,
              name: ticket.reporter_name,
            },
          ]),
      ).values(),
    );
  }, [tickets]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters || {}).filter(Boolean).length;
  }, [filters]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFilters({
      ...EMPTY_FILTERS,
    });

    setShowFilters(false);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      await exportTickets({
        ...filters,
        search,
      });
    } catch (error) {
      console.error("Export ticket error:", error);

      alert(error?.message || "Gagal export ticket");
    } finally {
      setIsExporting(false);
    }
  };

  const selectClassName = `
    w-full
    h-10
    border
    border-gray-200
    bg-white
    px-3
    rounded-xl
    text-sm
    text-gray-700
    focus:outline-none
    focus:ring-2
    focus:ring-blue-100
    focus:border-blue-400
    transition
  `;

  const dateInputClassName = `
    w-full
    h-10
    border
    border-gray-200
    bg-white
    px-3
    rounded-xl
    text-sm
    text-gray-700
    focus:outline-none
    focus:ring-2
    focus:ring-blue-100
    focus:border-blue-400
    transition
  `;

  return (
    <>
      <div
        className="
          mb-5
          rounded-2xl
          border
          border-gray-200
          bg-gray-50
          p-3
          sm:p-4
        "
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-800">
              Filter Tiket
            </h2>

            <p className="hidden sm:block text-xs text-gray-500 mt-0.5">
              Cari dan filter tiket berdasarkan kebutuhan
            </p>
          </div>

          {/* MOBILE FILTER BUTTON */}
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="
              md:hidden
              shrink-0
              h-9
              px-3
              rounded-xl
              border
              border-gray-200
              bg-white
              text-gray-700
              text-xs
              font-medium
              flex
              items-center
              gap-2
              hover:bg-gray-50
              transition
            "
          >
            <FiSliders size={14} />

            <span>Filter</span>

            {activeFilterCount > 0 && (
              <span
                className="
                  min-w-5
                  h-5
                  px-1
                  rounded-full
                  bg-orange-500
                  text-white
                  text-[10px]
                  font-bold
                  flex
                  items-center
                  justify-center
                "
              >
                {activeFilterCount}
              </span>
            )}

            <FiChevronDown
              size={13}
              className={`
                transition-transform
                ${showFilters ? "rotate-180" : ""}
              `}
            />
          </button>
        </div>

        <div
          className="
            flex
            flex-col
            sm:flex-row
            gap-2
          "
        >
          {/* SEARCH */}
          <div className="relative flex-1 min-w-0">
            <FiSearch
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
              size={16}
            />

            <input
              type="text"
              placeholder="Cari nomor tiket..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="
                w-full
                h-10
                border
                border-gray-200
                bg-white
                pl-9
                pr-3
                rounded-xl
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-blue-100
                focus:border-blue-400
                transition
              "
            />
          </div>

          {/* ACTION BUTTONS */}
          <div
            className="
              flex
              gap-2
              shrink-0
            "
          >
            {/* EXPORT */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              title="Export ticket"
              className="
                h-10
                w-10
                shrink-0
                flex
                items-center
                justify-center
                rounded-xl
                border
                border-green-200
                bg-green-50
                text-green-600
                hover:bg-green-100
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition
              "
            >
              <FiDownload size={16} />
            </button>

            {/* CREATE TICKET */}
            {[ROLE.USER, ROLE.ADMINISTRATOR].includes(role) && (
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                className="
                  h-10
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-3
                  sm:px-4
                  rounded-xl
                  bg-blue-600
                  text-white
                  text-xs
                  sm:text-sm
                  font-medium
                  hover:bg-blue-700
                  transition
                  whitespace-nowrap
                "
              >
                <FiPlus size={16} />

                <span>Buat Tiket</span>
              </button>
            )}
          </div>
        </div>

        <div
          className={`
            ${showFilters ? "block" : "hidden"}
            md:block
            mt-3
            pt-3
            border-t
            border-gray-200
          `}
        >
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-6
              gap-3
            "
          >
            {/* PROJECT */}
            <div className="min-w-0">
              <label className="block mb-1 text-[11px] font-semibold uppercase text-gray-400">
                Project
              </label>

              <select
                name="project_id"
                value={filters.project_id}
                onChange={handleChange}
                className={selectClassName}
              >
                <option value="">Semua Project</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PRIORITY */}
            <div className="min-w-0">
              <label className="block mb-1 text-[11px] font-semibold uppercase text-gray-400">
                Prioritas
              </label>

              <select
                name="priority"
                value={filters.priority}
                onChange={handleChange}
                className={selectClassName}
              >
                <option value="">Semua Prioritas</option>

                <option value="LOW">LOW</option>

                <option value="MEDIUM">MEDIUM</option>

                <option value="HIGH">HIGH</option>

                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* STATUS */}
            <div className="min-w-0">
              <label className="block mb-1 text-[11px] font-semibold uppercase text-gray-400">
                Status
              </label>

              <select
                name="status"
                value={filters.status}
                onChange={handleChange}
                className={selectClassName}
              >
                <option value="">Semua Status</option>

                {role === ROLE.ENGINEER ? (
                  <>
                    <option value="PENDING">PENDING</option>

                    <option value="DONE">DONE</option>
                  </>
                ) : (
                  <>
                    <option value="OPEN">OPEN</option>

                    <option value="ONHOLD">ONHOLD</option>

                    <option value="RESOLVED">RESOLVED</option>

                    <option value="CLOSED">CLOSED</option>
                  </>
                )}
              </select>
            </div>

            {/* START DATE */}
            <div className="min-w-0">
              <label className="block mb-1 text-[11px] font-semibold uppercase text-gray-400">
                Tanggal Awal
              </label>

              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleChange}
                className={dateInputClassName}
              />
            </div>

            {/* END DATE */}
            <div className="min-w-0">
              <label className="block mb-1 text-[11px] font-semibold uppercase text-gray-400">
                Tanggal Akhir
              </label>

              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleChange}
                className={dateInputClassName}
              />
            </div>

            {/* RESET */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleReset}
                className="
                  w-full
                  h-10
                  flex
                  items-center
                  justify-center
                  gap-2
                  border
                  border-gray-200
                  bg-white
                  text-gray-600
                  rounded-xl
                  text-sm
                  hover:bg-gray-100
                  transition
                "
              >
                <FiRotateCcw size={14} />
                Reset Filter
              </button>
            </div>
          </div>

          {/* DESKTOP ACTIVE FILTER INFO */}
          {activeFilterCount > 0 && (
            <div className="hidden md:flex items-center gap-2 mt-3 text-xs text-gray-500">
              <span>{activeFilterCount} filter aktif</span>

              <button
                type="button"
                onClick={handleReset}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Bersihkan semua
              </button>
            </div>
          )}
        </div>
      </div>
      {openModal && <TicketModal onClose={() => setOpenModal(false)} />}
    </>
  );
}
