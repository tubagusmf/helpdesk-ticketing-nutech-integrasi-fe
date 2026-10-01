import {ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip} from "recharts";
import { FiTrendingUp } from "react-icons/fi";
import DashboardSection from "./DashboardSection";
import { formatMonthLabel } from "../../utils/dashboard";

export default function TrendChartCard({
  data = [],
  title = "Tren Jumlah Insiden",
  subtitle = "Ticket berdasarkan bulan dibuat",
}) {
  const animationId = data
    .map((item) => `${item.date}-${item.total}`)
    .join("|");

  return (
    <DashboardSection
      title={title}
      subtitle={subtitle}
      icon={FiTrendingUp}
      action={
        <span
          className="
            inline-flex
            items-center
            rounded-lg
            border
            border-gray-200
            bg-gray-50
            px-2.5
            py-1.5
            text-xs
            font-medium
            text-gray-600
          "
        >
          Per Bulan
        </span>
      }
    >
      <div className="h-[260px] sm:h-[300px] lg:h-[320px] min-w-0">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            Belum ada data.
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient
                  id="incidentGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopOpacity={0.25}
                  />

                  <stop
                    offset="100%"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickFormatter={formatMonthLabel}
                tick={{
                  fontSize: 11,
                  fill: "#6b7280",
                }}
                interval="preserveStartEnd"
                minTickGap={20}
              />

              <YAxis
                allowDecimals={false}
                width={32}
                tick={{
                  fontSize: 11,
                  fill: "#6b7280",
                }}
              />

              <Tooltip
                labelFormatter={(value) =>
                  formatMonthLabel(value)
                }
                formatter={(value) => [
                  value,
                  "Jumlah Ticket",
                ]}
              />

              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#incidentGradient)"

                isAnimationActive={true}
                animationBegin={150}
                animationDuration={1400}
                animationEasing="ease-in-out"
                animationId={animationId}

                dot={{
                  r: 3.5,
                  fill: "#ffffff",
                  stroke: "#3b82f6",
                  strokeWidth: 2,
                }}

                activeDot={{
                  r: 6,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardSection>
  );
}