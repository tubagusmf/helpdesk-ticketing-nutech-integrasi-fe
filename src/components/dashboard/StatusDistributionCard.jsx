import {PieChart, Pie, Cell, Tooltip, ResponsiveContainer} from "recharts";
import { FiPieChart } from "react-icons/fi";
import DashboardSection from "./DashboardSection";
import {getStatusChartData, getStatusTotal} from "../../utils/dashboard";

export default function StatusDistributionCard({
  statusData,
}) {
  const data =
    getStatusChartData(statusData);

  const total =
    getStatusTotal(statusData);

  const animationId = data
    .map(
      (item) =>
        `${item.key}-${item.value}`,
    )
    .join("|");

  return (
    <DashboardSection
      title="Status Distribusi"
      subtitle="Kondisi seluruh ticket"
      icon={FiPieChart}
    >
      <div
        key={animationId}
        className="
          grid
          grid-cols-1
          lg:grid-cols-[minmax(260px,1fr)_minmax(260px,1fr)]
          gap-6
          items-center
        "
      >
        <div className="relative w-full min-w-0">
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="78%"
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={3}

                  isAnimationActive={true}
                  animationBegin={100}
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                >
                  {data.map((item) => (
                    <Cell
                      key={item.key}
                      fill={item.color}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              flex
              items-center
              justify-center
              text-center
            "
          >
            <div
              className="
                dashboard-total-animation
              "
            >
              <p className="
                text-3xl
                sm:text-4xl
                font-bold
                text-gray-900
                leading-none
              ">
                {total}
              </p>

              <p className="
                text-[11px]
                sm:text-xs
                text-gray-400
                mt-2
              ">
                Total Ticket
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage =
              total > 0
                ? (
                    (item.value / total) *
                    100
                  ).toFixed(1)
                : "0.0";

            return (
              <div
                key={item.key}
                className="group"
              >
                {/* STATUS HEADER */}

                <div className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  mb-1.5
                ">
                  <div className="
                    flex
                    items-center
                    gap-2
                    min-w-0
                  ">
                    <span
                      className="
                        w-3
                        h-3
                        shrink-0
                        rounded-full
                      "
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                    />

                    <span className="
                      text-sm
                      text-gray-700
                      truncate
                    ">
                      {item.name}
                    </span>
                  </div>

                  <div className="
                    flex
                    items-center
                    gap-3
                    shrink-0
                  ">
                    <span className="
                      text-sm
                      font-semibold
                      text-gray-800
                    ">
                      {item.value}
                    </span>

                    <span className="
                      w-11
                      text-right
                      text-xs
                      text-gray-400
                    ">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* PROGRESS */}

                <div className="
                  h-2
                  bg-gray-100
                  rounded-full
                  overflow-hidden
                ">
                  <div
                    className="
                      h-full
                      rounded-full
                      dashboard-status-bar
                    "
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        item.color,
                        animationDelay:
                          `${index * 120}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* TOTAL */}

          <div className="
            pt-3
            mt-2
            border-t
            border-gray-100
            flex
            items-center
            justify-between
          ">
            <span className="
              text-sm
              font-semibold
              text-gray-700
            ">
              Total
            </span>

            <div className="flex items-center gap-3">
              <span className="
                text-sm
                font-bold
                text-gray-900
              ">
                {total}
              </span>

              <span className="
                w-11
                text-right
                text-xs
                font-medium
                text-gray-400
              ">
                100%
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardSection>
  );
}