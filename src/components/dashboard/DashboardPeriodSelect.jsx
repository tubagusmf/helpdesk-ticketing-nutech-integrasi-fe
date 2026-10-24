const PERIOD_OPTIONS = [
  { value: "day", label: "Per Hari" },
  { value: "week", label: "Per Minggu" },
  { value: "month", label: "Per Bulan" },
  { value: "year", label: "Per Tahun" },
];

export default function DashboardPeriodSelect({
  value = "month",
  onChange,
}) {
  return (
    <select
      aria-label="Filter periode grafik"
      value={value}
      onChange={(event) =>
        onChange?.(event.target.value)
      }
      className="
        rounded-lg border border-gray-200
        bg-white px-2.5 py-1.5
        text-xs font-medium text-gray-600
        outline-none transition
        hover:border-gray-300
        focus:border-blue-500
        focus:ring-2 focus:ring-blue-100
      "
    >
      {PERIOD_OPTIONS.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}