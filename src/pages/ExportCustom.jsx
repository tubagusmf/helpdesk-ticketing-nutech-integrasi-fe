import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import toast from "react-hot-toast";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  FiArrowDown,
  FiArrowUp,
  FiCheck,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  exportCustomTickets,
  getProjects,
} from "../services/ticketService";

import { navigationMenu } from "../constants/navigation";

const COLUMN_GROUPS = [
  {
    key: "ticket-information",
    title: "Ticket Information",
    description:
      "Informasi utama ticket dan pihak terkait.",
    columns: [
      {
        key: "ticket_code",
        label: "Ticket Code",
      },
      {
        key: "project",
        label: "Project",
      },
      {
        key: "location",
        label: "Location",
      },
      {
        key: "part",
        label: "Part",
      },
      {
        key: "asset",
        label: "Asset",
      },
      {
        key: "reporter",
        label: "Reporter",
      },
      {
        key: "assigned_engineer",
        label: "Assigned Engineer",
      },
      {
        key: "staff_assigned",
        label: "Staff Assigned",
      },
    ],
  },

  {
    key: "ticket-detail",
    title: "Ticket Detail",
    description:
      "Detail dan kondisi ticket.",
    columns: [
      {
        key: "priority",
        label: "Priority",
      },
      {
        key: "status",
        label: "Status",
      },
      {
        key: "description",
        label: "Description",
      },
      {
        key: "onhold_notes",
        label: "Onhold Notes",
      },
      {
        key: "attachment",
        label: "Ticket Attachment",
      },
    ],
  },

  {
    key: "resolution",
    title: "Resolution",
    description:
      "Informasi penyelesaian ticket.",
    columns: [
      {
        key: "resolution_cause",
        label: "Resolution Cause",
      },
      {
        key: "resolution_solution",
        label: "Resolution Solution",
      },
      {
        key: "resolution_notes",
        label: "Resolution Notes",
      },
      {
        key: "resolution_completion_at",
        label:
          "Resolution Completion Time",
      },
      {
        key: "resolution_attachment",
        label: "Resolution Attachment",
      },
    ],
  },

  {
    key: "date-sla",
    title: "Date & SLA",
    description:
      "Informasi waktu dan response SLA.",
    columns: [
      {
        key: "created_at",
        label: "Created At",
      },
      {
        key: "updated_at",
        label: "Updated At",
      },
      {
        key: "due_at",
        label: "Due At",
      },
      {
        key: "resolved_at",
        label: "Resolved At",
      },
      {
        key: "staff_assigned_at",
        label: "Staff Assigned At",
      },
      {
        key: "staff_first_response_at",
        label:
          "Staff First Response At",
      },
      {
        key: "staff_response_time",
        label: "Staff Response Time",
      },
      {
        key: "engineer_resolution_at",
        label:
          "Engineer Resolution At",
      },
    ],
  },
];

const ALL_COLUMNS = COLUMN_GROUPS.flatMap(
  (group) => group.columns,
);

const DEFAULT_COLUMNS = [
  "ticket_code",
  "project",
  "location",
  "asset",
  "reporter",
  "assigned_engineer",
  "priority",
  "status",
  "created_at",
  "due_at",
  "resolved_at",
];

const EMPTY_FILTERS = {
  search: "",
  project_id: "",
  status: "",
  priority: "",
  start_date: "",
  end_date: "",
};

const getMenuByPath = (pathname) => {
  if (pathname.startsWith("/admin/")) {
    return navigationMenu.administrator;
  }

  if (pathname.startsWith("/staff/")) {
    return navigationMenu.staff;
  }

  if (pathname.startsWith("/executive/")) {
    return navigationMenu.executive;
  }

  return [];
};

const normalizeProjects = (result) => {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  return [];
};

function SortableColumnItem({
  column,
  index,
  totalItems,
  onMove,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.key,
  });

  const style = {
    transform:
      CSS.Transform.toString(transform),
    transition,
  };

  const isFirst = index === 0;

  const isLast =
    index === totalItems - 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group
        flex
        min-w-0
        items-center
        gap-2
        rounded-xl
        border
        bg-white
        p-2.5
        shadow-sm
        transition-all
        sm:p-3
        ${
          isDragging
            ? `
              relative
              z-50
              scale-[1.01]
              border-blue-400
              shadow-xl
              ring-2
              ring-blue-100
            `
            : `
              border-gray-200
              hover:shadow-md
            `
        }
      `}
    >

      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${column.label}`}
        title="Drag untuk mengubah urutan"
        className="
          flex
          h-9
          w-9
          shrink-0
          cursor-grab
          items-center
          justify-center
          rounded-lg
          bg-blue-600
          text-xs
          font-semibold
          text-white
          touch-none
          active:cursor-grabbing
          sm:h-10
          sm:w-10
        "
      >
        {index + 1}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-gray-800 sm:text-sm">
          {column.label}
        </p>

        <p className="mt-0.5 truncate text-[10px] text-gray-400 sm:text-xs">
          Column {index + 1}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          onMove(index, -1)
        }
        disabled={isFirst}
        aria-label={`Move ${column.label} up`}
        className="
          shrink-0
          rounded-lg
          border
          border-gray-200
          bg-white
          p-2
          text-gray-500
          transition
          hover:bg-gray-100
          disabled:cursor-not-allowed
          disabled:opacity-25
        "
      >
        <FiArrowUp size={14} />
      </button>

      <button
        type="button"
        onClick={() =>
          onMove(index, 1)
        }
        disabled={isLast}
        aria-label={`Move ${column.label} down`}
        className="
          shrink-0
          rounded-lg
          border
          border-gray-200
          bg-white
          p-2
          text-gray-500
          transition
          hover:bg-gray-100
          disabled:cursor-not-allowed
          disabled:opacity-25
        "
      >
        <FiArrowDown size={14} />
      </button>

      <button
        type="button"
        onClick={() =>
          onRemove(column.key)
        }
        aria-label={`Remove ${column.label}`}
        className="
          shrink-0
          rounded-lg
          border
          border-red-200
          bg-white
          p-2
          text-red-500
          transition
          hover:bg-red-50
        "
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  );
}

export default function ExportCustom() {
  const location = useLocation();
  const menu = useMemo(
    () =>
      getMenuByPath(
        location.pathname,
      ),
    [location.pathname],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),

    useSensor(KeyboardSensor, {
      coordinateGetter:
        sortableKeyboardCoordinates,
    }),
  );

  const [projects, setProjects] =
    useState([]);

  const [selectedColumns, setSelectedColumns] =
    useState(DEFAULT_COLUMNS);

  const [filters, setFilters] =
    useState({
      ...EMPTY_FILTERS,
    });

  const [loadingProjects, setLoadingProjects] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);

        const result =
          await getProjects();

        if (!mounted) {
          return;
        }

        setProjects(
          normalizeProjects(result),
        );
      } catch (error) {
        console.error(
          "Failed to fetch projects:",
          error,
        );

        if (mounted) {
          toast.error(
            "Gagal mengambil data project",
          );
        }
      } finally {
        if (mounted) {
          setLoadingProjects(false);
        }
      }
    };

    fetchProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const getColumnByKey =
    useCallback((key) => {
      return ALL_COLUMNS.find(
        (column) =>
          column.key === key,
      );
    }, []);

  const totalColumns =
    ALL_COLUMNS.length;

  const selectedColumnCount =
    selectedColumns.length;

  const selectedPercentage =
    totalColumns === 0
      ? 0
      : Math.round(
          (selectedColumnCount /
            totalColumns) *
            100,
        );

  const isColumnSelected =
    useCallback(
      (key) =>
        selectedColumns.includes(
          key,
        ),
      [selectedColumns],
    );

  const toggleColumn = useCallback(
    (columnKey) => {
      setSelectedColumns(
        (current) => {
          const exists =
            current.includes(
              columnKey,
            );

          if (exists) {
            return current.filter(
              (key) =>
                key !== columnKey,
            );
          }

          return [
            ...current,
            columnKey,
          ];
        },
      );
    },
    [],
  );

  const selectAllColumns =
    useCallback(() => {
      setSelectedColumns(
        ALL_COLUMNS.map(
          (column) =>
            column.key,
        ),
      );
    }, []);

  const clearAllColumns =
    useCallback(() => {
      setSelectedColumns([]);
    }, []);

  const removeColumn =
    useCallback((columnKey) => {
      setSelectedColumns(
        (current) =>
          current.filter(
            (key) =>
              key !== columnKey,
          ),
      );
    }, []);

  const moveColumn = useCallback(
    (
      index,
      direction,
    ) => {
      setSelectedColumns(
        (current) => {
          const targetIndex =
            index + direction;

          if (
            targetIndex < 0 ||
            targetIndex >=
              current.length
          ) {
            return current;
          }

          return arrayMove(
            current,
            index,
            targetIndex,
          );
        },
      );
    },
    [],
  );

  const handleDragEnd =
    useCallback(
      (event) => {
        const {
          active,
          over,
        } = event;

        if (!over) {
          return;
        }

        if (
          active.id ===
          over.id
        ) {
          return;
        }

        setSelectedColumns(
          (current) => {
            const oldIndex =
              current.indexOf(
                active.id,
              );

            const newIndex =
              current.indexOf(
                over.id,
              );

            if (
              oldIndex === -1 ||
              newIndex === -1
            ) {
              return current;
            }

            return arrayMove(
              current,
              oldIndex,
              newIndex,
            );
          },
        );
      },
      [],
    );

  const resetForm = useCallback(
    () => {
      setSelectedColumns(
        DEFAULT_COLUMNS,
      );

      setFilters({
        ...EMPTY_FILTERS,
      });
    },
    [],
  );

  const handleFilterChange =
    useCallback(
      (event) => {
        const {
          name,
          value,
        } = event.target;

        setFilters(
          (current) => ({
            ...current,
            [name]: value,
          }),
        );
      },
      [],
    );

  const handleExport =
    useCallback(
      async () => {
        if (
          selectedColumns.length ===
          0
        ) {
          toast.error(
            "Pilih minimal satu column untuk export",
          );

          return;
        }

        if (
          filters.start_date &&
          filters.end_date &&
          filters.start_date >
            filters.end_date
        ) {
          toast.error(
            "Start date tidak boleh lebih besar dari end date",
          );

          return;
        }

        try {
          setExporting(true);

          const payload = {
            columns:
              selectedColumns,

            search:
              filters.search.trim(),

            project_id:
              filters.project_id
                ? Number(
                    filters.project_id,
                  )
                : 0,

            status:
              filters.status,

            priority:
              filters.priority,

            start_date:
              filters.start_date,

            end_date:
              filters.end_date,
          };

          await exportCustomTickets(
            payload,
          );

          toast.success(
            "Custom ticket berhasil diexport",
          );
        } catch (error) {
          console.error(
            "Custom export error:",
            error,
          );

          toast.error(
            error?.message ||
              "Gagal export custom ticket",
          );
        } finally {
          setExporting(false);
        }
      },
      [
        selectedColumns,
        filters,
      ],
    );

  const selectedColumnObjects =
    useMemo(() => {
      return selectedColumns
        .map((key) =>
          getColumnByKey(key),
        )
        .filter(Boolean);
    }, [
      selectedColumns,
      getColumnByKey,
    ]);

  return (
    <DashboardLayout
      title="Export Custom"
      menu={menu}
    >
      <div className="space-y-6">

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex min-w-0 items-center gap-3">

              <div className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-blue-600
              ">
                <FiDownload
                  size={21}
                />
              </div>

              <div className="min-w-0">

                <h1 className="
                  truncate
                  text-xl
                  font-bold
                  text-gray-800
                  sm:text-2xl
                ">
                  Export Custom Ticket
                </h1>

                <p className="
                  mt-1
                  text-xs
                  text-gray-500
                  sm:text-sm
                ">
                  Pilih field, atur urutan,
                  dan tentukan filter data
                  sebelum export Excel.
                </p>

              </div>

            </div>

            <div className="flex flex-wrap items-center gap-2">

              <span className="
                rounded-full
                bg-gray-100
                px-3
                py-1.5
                text-xs
                font-semibold
                text-gray-600
              ">
                {totalColumns} Columns
              </span>

              <span className="
                rounded-full
                bg-blue-100
                px-3
                py-1.5
                text-xs
                font-semibold
                text-blue-700
              ">
                {selectedColumnCount} Selected
              </span>

            </div>

          </div>
        </section>

        <section className="
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-sm
        ">

          {/* HEADER */}

          <div className="
            border-b
            border-gray-200
            bg-gray-50
            px-4
            py-4
            sm:px-6
          ">

            <div className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-center
              lg:justify-between
            ">

              <div>

                <span className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-blue-600
                ">
                  Step 1
                </span>

                <h2 className="
                  mt-1
                  text-base
                  font-semibold
                  text-gray-800
                  sm:text-lg
                ">
                  Select Column to Export
                </h2>

                <p className="
                  mt-1
                  max-w-2xl
                  text-xs
                  text-gray-500
                  sm:text-sm
                ">
                  Centang field yang ingin
                  dimasukkan ke Excel.
                  Field tetap ditampilkan
                  walaupun sudah dipilih.
                </p>

              </div>

              {/* ACTION */}

              <div className="
                flex
                flex-wrap
                gap-2
              ">

                <button
                  type="button"
                  onClick={
                    selectAllColumns
                  }
                  disabled={
                    selectedColumnCount ===
                    totalColumns
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2
                    text-xs
                    font-medium
                    text-gray-700
                    transition
                    hover:bg-gray-100
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    sm:px-4
                    sm:text-sm
                  "
                >
                  <FiCheck
                    size={15}
                  />

                  Select All
                </button>

                <button
                  type="button"
                  onClick={
                    clearAllColumns
                  }
                  disabled={
                    selectedColumnCount ===
                    0
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-red-200
                    bg-white
                    px-3
                    py-2
                    text-xs
                    font-medium
                    text-red-600
                    transition
                    hover:bg-red-50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    sm:px-4
                    sm:text-sm
                  "
                >
                  <FiTrash2
                    size={15}
                  />

                  Clear All
                </button>

              </div>

            </div>
          </div>

          {/* BODY */}

          <div className="
            grid
            gap-6
            p-4
            sm:p-6
            xl:grid-cols-2
          ">

            <div className="min-w-0">

              <div className="
                mb-3
                flex
                items-center
                justify-between
              ">

                <div>

                  <h3 className="
                    text-sm
                    font-semibold
                    text-gray-800
                    sm:text-base
                  ">
                    Available Columns
                  </h3>

                  <p className="
                    mt-0.5
                    text-xs
                    text-gray-500
                  ">
                    Klik untuk pilih /
                    batalkan pilihan.
                  </p>

                </div>

                <span className="
                  rounded-full
                  bg-gray-100
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-gray-600
                ">
                  {totalColumns}
                </span>

              </div>

              <div className="space-y-4">

                {COLUMN_GROUPS.map(
                  (group) => (
                    <div
                      key={group.key}
                      className="
                        overflow-hidden
                        rounded-xl
                        border
                        border-gray-200
                      "
                    >

                      {/* GROUP HEADER */}

                      <div className="
                        border-b
                        border-gray-200
                        bg-gray-50
                        px-4
                        py-3
                      ">

                        <h4 className="
                          text-xs
                          font-semibold
                          uppercase
                          tracking-wide
                          text-gray-700
                          sm:text-sm
                        ">
                          {group.title}
                        </h4>

                        <p className="
                          mt-0.5
                          text-[11px]
                          text-gray-400
                          sm:text-xs
                        ">
                          {
                            group.description
                          }
                        </p>

                      </div>

                      {/* GROUP COLUMNS */}

                      <div className="
                        grid
                        gap-2
                        p-3
                        sm:grid-cols-2
                      ">

                        {group.columns.map(
                          (column) => {
                            const selected =
                              isColumnSelected(
                                column.key,
                              );

                            return (
                              <button
                                key={
                                  column.key
                                }
                                type="button"
                                onClick={() =>
                                  toggleColumn(
                                    column.key,
                                  )
                                }
                                aria-pressed={
                                  selected
                                }
                                className={`
                                  group
                                  flex
                                  min-w-0
                                  items-center
                                  gap-3
                                  rounded-lg
                                  border
                                  px-3
                                  py-2.5
                                  text-left
                                  transition-all
                                  duration-200
                                  ${
                                    selected
                                      ? `
                                        border-blue-400
                                        bg-blue-50
                                        shadow-sm
                                      `
                                      : `
                                        border-gray-200
                                        bg-white
                                        hover:border-blue-300
                                        hover:bg-blue-50/50
                                      `
                                  }
                                `}
                              >

                                {/* CHECKBOX */}

                                <span
                                  className={`
                                    flex
                                    h-5
                                    w-5
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-md
                                    border
                                    transition-all
                                    ${
                                      selected
                                        ? `
                                          border-blue-500
                                          bg-blue-500
                                          text-white
                                        `
                                        : `
                                          border-gray-300
                                          bg-white
                                          text-transparent
                                        `
                                    }
                                  `}
                                >
                                  <FiCheck
                                    size={12}
                                  />
                                </span>

                                {/* LABEL */}

                                <span
                                  className={`
                                    min-w-0
                                    flex-1
                                    truncate
                                    text-sm
                                    ${
                                      selected
                                        ? `
                                          font-semibold
                                          text-blue-700
                                        `
                                        : `
                                          text-gray-700
                                        `
                                    }
                                  `}
                                >
                                  {
                                    column.label
                                  }
                                </span>

                                {/* SELECTED BADGE */}

                                {selected && (
                                  <span className="
                                    shrink-0
                                    rounded-full
                                    bg-blue-100
                                    px-2
                                    py-0.5
                                    text-[10px]
                                    font-semibold
                                    text-blue-700
                                  ">
                                    Selected
                                  </span>
                                )}

                              </button>
                            );
                          },
                        )}

                      </div>
                    </div>
                  ),
                )}

              </div>
            </div>

            <div className="min-w-0">

              <div className="
                mb-3
                flex
                items-center
                justify-between
              ">

                <div>

                  <h3 className="
                    text-sm
                    font-semibold
                    text-gray-800
                    sm:text-base
                  ">
                    Selected Columns
                  </h3>

                  <p className="
                    mt-0.5
                    text-xs
                    text-gray-500
                  ">
                    Drag & drop untuk mengatur
                    urutan export Excel.
                  </p>

                </div>

                <span className="
                  rounded-full
                  bg-blue-100
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-blue-700
                ">
                  {selectedColumnCount}
                </span>

              </div>

              {/* PROGRESS */}

              <div className="
                mb-4
                rounded-xl
                border
                border-blue-100
                bg-blue-50
                p-3
              ">

                <div className="
                  flex
                  items-center
                  justify-between
                  text-xs
                ">

                  <span className="
                    font-medium
                    text-blue-800
                  ">
                    Column Selected
                  </span>

                  <span className="
                    font-semibold
                    text-blue-700
                  ">
                    {selectedColumnCount} /{" "}
                    {totalColumns}
                  </span>

                </div>

                <div className="
                  mt-2
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-blue-100
                ">
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-blue-500
                      transition-all
                      duration-300
                    "
                    style={{
                      width: `${selectedPercentage}%`,
                    }}
                  />
                </div>

              </div>

              {/* SORTABLE AREA */}

              <div className="
                min-h-[350px]
                rounded-xl
                border
                border-blue-100
                bg-blue-50/40
                p-3
              ">

                {selectedColumnObjects.length ===
                0 ? (
                  <div className="
                    flex
                    min-h-[320px]
                    items-center
                    justify-center
                    px-4
                    text-center
                  ">

                    <div>

                      <div className="
                        mx-auto
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-gray-400
                        shadow-sm
                      ">
                        <FiDownload
                          size={20}
                        />
                      </div>

                      <p className="
                        mt-3
                        text-sm
                        font-semibold
                        text-gray-700
                      ">
                        Belum ada column
                      </p>

                      <p className="
                        mt-1
                        text-xs
                        text-gray-500
                      ">
                        Pilih field dari daftar
                        Available Columns.
                      </p>

                    </div>

                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={
                      closestCenter
                    }
                    onDragEnd={
                      handleDragEnd
                    }
                  >
                    <SortableContext
                      items={
                        selectedColumns
                      }
                      strategy={
                        verticalListSortingStrategy
                      }
                    >
                      <div className="space-y-2">

                        {selectedColumnObjects.map(
                          (
                            column,
                            index,
                          ) => (
                            <SortableColumnItem
                              key={
                                column.key
                              }
                              column={
                                column
                              }
                              index={
                                index
                              }
                              totalItems={
                                selectedColumnObjects.length
                              }
                              onMove={
                                moveColumn
                              }
                              onRemove={
                                removeColumn
                              }
                            />
                          ),
                        )}

                      </div>
                    </SortableContext>
                  </DndContext>
                )}

              </div>

            </div>
          </div>
        </section>

        <section className="
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-sm
        ">

          {/* HEADER */}

          <div className="
            border-b
            border-gray-200
            bg-gray-50
            px-4
            py-4
            sm:px-6
          ">

            <div className="flex items-center gap-3">

              <div className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-orange-100
                text-orange-600
              ">
                <FiFilter
                  size={18}
                />
              </div>

              <div>

                <span className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-orange-600
                ">
                  Step 2
                </span>

                <h2 className="
                  mt-1
                  text-base
                  font-semibold
                  text-gray-800
                  sm:text-lg
                ">
                  Filter Options
                </h2>

                <p className="
                  mt-1
                  text-xs
                  text-gray-500
                  sm:text-sm
                ">
                  Filter data ticket yang akan
                  dimasukkan ke Excel.
                </p>

              </div>
            </div>
          </div>

          {/* FILTER BODY */}

          <div className="
            grid
            gap-5
            p-4
            sm:p-6
            md:grid-cols-2
            xl:grid-cols-3
          ">

            {/* SEARCH */}

            <div>
              <label
                htmlFor="search"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Search
              </label>

              <input
                id="search"
                type="text"
                name="search"
                value={
                  filters.search
                }
                onChange={
                  handleFilterChange
                }
                placeholder="Ticket code, project, reporter..."
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>

            {/* PROJECT */}

            <div>
              <label
                htmlFor="project_id"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Project
              </label>

              <select
                id="project_id"
                name="project_id"
                value={
                  filters.project_id
                }
                onChange={
                  handleFilterChange
                }
                disabled={
                  loadingProjects ||
                  exporting
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:cursor-not-allowed
                  disabled:bg-gray-100
                "
              >
                <option value="">
                  All Project
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {
                        project.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* STATUS */}

            <div>
              <label
                htmlFor="status"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                value={
                  filters.status
                }
                onChange={
                  handleFilterChange
                }
                disabled={
                  exporting
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:cursor-not-allowed
                  disabled:bg-gray-100
                "
              >
                <option value="">
                  All Status
                </option>

                <option value="OPEN">
                  OPEN
                </option>

                <option value="IN_PROGRESS">
                  IN PROGRESS
                </option>

                <option value="RESOLVED">
                  RESOLVED
                </option>

                <option value="CLOSED">
                  CLOSED
                </option>

                <option value="ONHOLD">
                  ON HOLD
                </option>
              </select>
            </div>

            {/* PRIORITY */}

            <div>
              <label
                htmlFor="priority"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Priority
              </label>

              <select
                id="priority"
                name="priority"
                value={
                  filters.priority
                }
                onChange={
                  handleFilterChange
                }
                disabled={
                  exporting
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:cursor-not-allowed
                  disabled:bg-gray-100
                "
              >
                <option value="">
                  All Priority
                </option>

                <option value="LOW">
                  LOW
                </option>

                <option value="MEDIUM">
                  MEDIUM
                </option>

                <option value="HIGH">
                  HIGH
                </option>

                <option value="URGENT">
                  URGENT
                </option>
              </select>
            </div>

            {/* START DATE */}

            <div>
              <label
                htmlFor="start_date"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Start Date
              </label>

              <input
                id="start_date"
                type="date"
                name="start_date"
                value={
                  filters.start_date
                }
                onChange={
                  handleFilterChange
                }
                disabled={
                  exporting
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:cursor-not-allowed
                  disabled:bg-gray-100
                "
              />
            </div>

            {/* END DATE */}

            <div>
              <label
                htmlFor="end_date"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                End Date
              </label>

              <input
                id="end_date"
                type="date"
                name="end_date"
                value={
                  filters.end_date
                }
                onChange={
                  handleFilterChange
                }
                disabled={
                  exporting
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:cursor-not-allowed
                  disabled:bg-gray-100
                "
              />
            </div>

          </div>
        </section>

        <section className="
          rounded-2xl
          border
          border-blue-100
          bg-blue-50
          p-4
          sm:p-5
        ">

          <div className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-start
            sm:justify-between
          ">

            <div>

              <p className="
                text-sm
                font-semibold
                text-blue-800
              ">
                Export Preview
              </p>

              <p className="
                mt-1
                text-xs
                text-blue-700
                sm:text-sm
              ">
                {selectedColumnCount} field
                akan dimasukkan ke Excel
                sesuai urutan Selected Columns.
              </p>

            </div>

            <div className="
              w-fit
              rounded-full
              bg-white
              px-3
              py-1.5
              text-xs
              font-semibold
              text-blue-700
              shadow-sm
            ">
              {selectedColumnCount} Columns
            </div>

          </div>

          {selectedColumnObjects.length >
            0 && (
            <div className="
              mt-4
              flex
              flex-wrap
              gap-2
            ">

              {selectedColumnObjects.map(
                (
                  column,
                  index,
                ) => (
                  <span
                    key={
                      column.key
                    }
                    className="
                      inline-flex
                      max-w-full
                      items-center
                      gap-1.5
                      rounded-full
                      bg-white
                      px-3
                      py-1.5
                      text-xs
                      font-medium
                      text-blue-700
                      shadow-sm
                    "
                  >
                    <span className="font-semibold">
                      {index + 1}.
                    </span>

                    <span className="truncate">
                      {
                        column.label
                      }
                    </span>
                  </span>
                ),
              )}

            </div>
          )}

        </section>

        <div className="
          flex
          flex-col-reverse
          gap-3
          sm:flex-row
          sm:justify-end
        ">

          {/* RESET */}

          <button
            type="button"
            onClick={
              resetForm
            }
            disabled={
              exporting
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-5
              py-3
              text-sm
              font-semibold
              text-gray-700
              transition
              hover:bg-gray-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <FiRefreshCw
              size={16}
            />

            Reset
          </button>

          {/* RUN REPORT */}

          <button
            type="button"
            onClick={
              handleExport
            }
            disabled={
              exporting ||
              selectedColumns.length ===
                0
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-emerald-600
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-emerald-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {exporting ? (
              <>
                <FiRefreshCw
                  size={16}
                  className="animate-spin"
                />

                Generating Excel...
              </>
            ) : (
              <>
                <FiDownload
                  size={16}
                />

                Run Report
              </>
            )}
          </button>

        </div>
      </div>
    </DashboardLayout>
  );
}