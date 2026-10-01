export default function DashboardFilter({filters, projects, parts, onChange, onFilter, onReset}) {
  
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <select
          value={filters.project_id}
          onChange={(e) =>
            onChange({
              project_id: e.target.value,
              part_id: "",
            })
          }
          className="
            w-full
            lg:col-span-3
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
          "
        >
          <option value="">
            Semua Project
          </option>

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>

        <select
          value={filters.part_id}
          onChange={(e) =>
            onChange({
              part_id: e.target.value,
            })
          }
          disabled={!filters.project_id}
          className="
            w-full
            lg:col-span-3
            min-w-0
            border
            border-gray-200
            rounded-xl
            px-3
            py-2.5
            text-sm
            bg-white
            disabled:bg-gray-50
            disabled:text-gray-400
            focus:outline-none
            focus:ring-2
            focus:ring-blue-100
          "
        >
          <option value="">
            Semua Part
          </option>

          {parts.map((part) => (
            <option
              key={part.id}
              value={part.id}
            >
              {part.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.start_date}
          onChange={(e) =>
            onChange({
              start_date: e.target.value,
            })
          }
          className="
            w-full
            lg:col-span-2
            min-w-0
            border
            border-gray-200
            rounded-xl
            px-3
            py-2.5
            text-sm
            focus:outline-none
            focus:ring-2
            focus:ring-blue-100
          "
        />

        <input
          type="date"
          value={filters.end_date}
          onChange={(e) =>
            onChange({
              end_date: e.target.value,
            })
          }
          className="
            w-full
            lg:col-span-2
            min-w-0
            border
            border-gray-200
            rounded-xl
            px-3
            py-2.5
            text-sm
            focus:outline-none
            focus:ring-2
            focus:ring-blue-100
          "
        />

        <button
          type="button"
          onClick={onFilter}
          className="
            lg:col-span-1
            w-full
            rounded-xl
            px-4
            py-2.5
            bg-blue-600
            hover:bg-blue-700
            text-white
            text-sm
            font-semibold
            transition
          "
        >
          Filter
        </button>

        <button
          type="button"
          onClick={onReset}
          className="
            lg:col-span-1
            w-full
            rounded-xl
            px-4
            py-2.5
            bg-orange-500
            hover:bg-orange-600
            text-white
            text-sm
            font-semibold
            transition
          "
        >
          Reset
        </button>
      </div>
    </div>
  );
}