import DashboardSection from "./DashboardSection";

export default function RankingCard({
  title,
  subtitle,
  icon: Icon,
  data = [],
  labelKey,
  tone = "blue",
}) {
  const barClass =
    tone === "orange"
      ? "bg-orange-500"
      : "bg-blue-500";

  const numberClass =
    tone === "orange"
      ? "bg-orange-50 text-orange-600"
      : "bg-blue-50 text-blue-600";

  const total =
    data.reduce(
      (sum, item) =>
        sum + (item.total || 0),
      0,
    ) || 1;

  const max = Math.max(
    ...data.map(
      (item) => item.total || 0,
    ),
    1,
  );

  return (
    <DashboardSection
      title={title}
      subtitle={subtitle}
      icon={Icon}
    >
      {data.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          Belum ada data.
        </div>
      ) : (
        <div className="space-y-4">
          {data.slice(0, 5).map(
            (item, index) => {
              const percentage = (
                ((item.total || 0) / total) *
                100
              ).toFixed(1);

              const width = (
                ((item.total || 0) / max) *
                100
              );

              return (
                <div
                  key={
                    item.project_id ||
                    item.location_id ||
                    index
                  }
                  className="flex gap-3"
                >
                  <div
                    className={`
                      w-7
                      h-7
                      shrink-0
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-xs
                      font-semibold
                      ${numberClass}
                    `}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3 mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {item[labelKey]}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-gray-800">
                          {item.total}
                        </span>

                        <span className="text-xs text-gray-400">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    <div
                    className="
                        h-2
                        bg-gray-100
                        rounded-full
                        overflow-hidden
                    "
                    >
                    <div
                        className={`
                        h-full
                        rounded-full
                        ${barClass}
                        `}
                        style={{
                        width: `${width}%`,
                        transition:
                            "width 1000ms cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                    />
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </DashboardSection>
  );
}