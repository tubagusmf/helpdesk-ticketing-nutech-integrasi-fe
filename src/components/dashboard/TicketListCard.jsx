import { Link } from "react-router-dom";
import DashboardSection from "./DashboardSection";

export default function TicketListCard({
  title,
  subtitle,
  total,
  data = [],
  tone = "red",
}) {
  const badgeClass =
    tone === "orange"
      ? "bg-orange-50 text-orange-600"
      : "bg-red-50 text-red-600";

  return (
    <DashboardSection
      title={title}
      subtitle={subtitle}
      action={
        <span
          className={`
            px-2.5
            py-1
            rounded-full
            text-xs
            font-semibold
            ${badgeClass}
          `}
        >
          {total}
        </span>
      }
    >
      {data.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          Tidak ada ticket.
        </div>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 5).map(
            (ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="
                  block
                  border
                  border-gray-100
                  rounded-xl
                  p-3
                  sm:p-4
                  hover:bg-gray-50
                  hover:border-gray-200
                  transition
                  min-w-0
                "
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {ticket.ticket_code}
                    </p>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                      {ticket.title}
                    </p>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      <span className="text-xs text-gray-400">
                        {ticket.project ||
                          "-"}
                      </span>

                      <span className="text-xs text-gray-400">
                        {ticket.location ||
                          "-"}
                      </span>
                    </div>
                  </div>

                  <span
                    className="
                      shrink-0
                      text-[10px]
                      sm:text-xs
                      font-semibold
                      px-2
                      py-1
                      rounded-full
                      bg-gray-100
                      text-gray-600
                    "
                  >
                    {ticket.priority}
                  </span>
                </div>
              </Link>
            ),
          )}
        </div>
      )}
    </DashboardSection>
  );
}