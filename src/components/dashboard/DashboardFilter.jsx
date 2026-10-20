
export default function DashboardFilter({ filters, projects, parts, onChange, onFilter, onReset }) {
  const fieldClassName = `
    w-full
    min-w-0
    border
    border-gray-200
    rounded-xl
    px-3
    py-2.5
    text-sm
    bg-white
    focus:outline-none
    focus:ring-2
    focus:ring-blue-100
  `;

  const buttonClassName = `
    w-full
    2xl:w-auto
    2xl:min-w-[80px]
    whitespace-nowrap
    rounded-xl
    px-3
    sm:px-4
    py-2.5
    text-white
    text-sm
    font-semibold
    transition
    focus:outline-none
    focus:ring-2
  `;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-sm">
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]
          gap-3
          items-center
        "
      >
        {/* PROJECT */}
        <select
          value={filters.project_id}
          onChange={(e) =>
            onChange({
              project_id: e.target.value,
              part_id: "",
            })
          }
          className={fieldClassName}
        >
          <option value="">Semua Project</option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        {/* PART */}
        <select
          value={filters.part_id}
          onChange={(e) =>
            onChange({
              part_id: e.target.value,
            })
          }
          disabled={!filters.project_id}
          className={`
            ${fieldClassName}
            disabled:bg-gray-50
            disabled:text-gray-400
          `}
        >
          <option value="">Semua Part</option>

          {parts.map((part) => (
            <option key={part.id} value={part.id}>
              {part.name}
            </option>
          ))}
        </select>

        {/* START DATE */}
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) =>
            onChange({
              start_date: e.target.value,
            })
          }
          className={fieldClassName}
        />

        {/* END DATE */}
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) =>
            onChange({
              end_date: e.target.value,
            })
          }
          className={fieldClassName}
        />

        {/* FILTER BUTTON */}
        <button
          type="button"
          onClick={onFilter}
          className={`
            ${buttonClassName}
            bg-blue-600
            hover:bg-blue-700
            focus:ring-blue-200
          `}
        >
          Filter
        </button>

        {/* RESET BUTTON */}
        <button
          type="button"
          onClick={onReset}
          className={`
            ${buttonClassName}
            bg-orange-500
            hover:bg-orange-600
            focus:ring-orange-200
          `}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
