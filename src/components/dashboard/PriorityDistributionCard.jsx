import DashboardSection from "./DashboardSection";
import { PRIORITY_CONFIG } from "../../utils/dashboard";

export default function PriorityDistributionCard({
  data = [],
}) {
  const normalized =
    PRIORITY_CONFIG.map(
      (priority) => ({
        ...priority,
        total:
          data.find(
            (item) =>
              item.priority ===
              priority.key,
          )?.total || 0,
      }),
    );

  const max = Math.max(
    ...normalized.map(
      (item) => item.total,
    ),
    1,
  );

  return (
    <DashboardSection
      title="Distribusi Prioritas"
      subtitle="Jumlah ticket berdasarkan prioritas"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {normalized.map((item) => (
          <div
            key={item.key}
            className="border border-gray-100 rounded-xl p-4 bg-gray-50/60"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-gray-700">
                {item.label}
              </span>

              <span className="text-sm font-bold text-gray-800">
                {item.total}
              </span>
            </div>

            <div className="h-2 bg-white rounded-full overflow-hidden mt-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(item.total / max) * 100}%`,
                  backgroundColor:
                    item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}