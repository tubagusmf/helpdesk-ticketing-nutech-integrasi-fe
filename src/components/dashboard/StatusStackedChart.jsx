import {ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from "recharts";
import DashboardSection from "./DashboardSection";
import { STATUS_CONFIG } from "../../utils/dashboard";

export default function StatusStackedChart({
  title,
  subtitle,
  data = [],
  labelKey,
  maxItems = 10,
}) {
  const chartData =
    data.slice(0, maxItems);

  const height = Math.max(
    300,
    chartData.length * 48,
  );

  const animationId = chartData
  .map((item) =>
    STATUS_CONFIG
      .map(
        (status) =>
          item[status.key] || 0,
      )
      .join("-"),
  )
  .join("|");

  return (
    <DashboardSection
      title={title}
      subtitle={subtitle}
    >
      {chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
          Belum ada data.
        </div>
      ) : (
        <div
          style={{
            height: `${height}px`,
          }}
          className="min-w-0"
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 5,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
              />

              <XAxis
                type="number"
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                }}
              />

              <YAxis
                type="category"
                dataKey={labelKey}
                width={110}
                tick={{
                  fontSize: 11,
                }}
              />

              <Tooltip />

              <Legend
                wrapperStyle={{
                  fontSize: 11,
                }}
              />

              {STATUS_CONFIG.map(
                (status, index) => (
                    <Bar
                    key={status.key}
                    dataKey={status.key}
                    stackId="status"
                    name={status.label}
                    fill={status.color}

                    isAnimationActive={true}
                    animationBegin={100 + index * 120}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                    animationId={animationId}

                    radius={
                        index === STATUS_CONFIG.length - 1
                        ? [0, 6, 6, 0]
                        : [0, 0, 0, 0]
                    }
                    />
                ),
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardSection>
  );
}