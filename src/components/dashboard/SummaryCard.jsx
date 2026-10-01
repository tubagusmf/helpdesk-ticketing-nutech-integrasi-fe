import {FiActivity, FiAlertCircle, FiCheckCircle, FiFileText, FiPauseCircle} from "react-icons/fi";

const TONES = {
  blue: {
    icon: FiFileText,
    iconBg: "bg-blue-50 text-blue-600",
    value: "text-blue-600",
  },

  red: {
    icon: FiAlertCircle,
    iconBg: "bg-red-50 text-red-600",
    value: "text-red-600",
  },

  orange: {
    icon: FiPauseCircle,
    iconBg: "bg-orange-50 text-orange-600",
    value: "text-orange-600",
  },

  green: {
    icon: FiCheckCircle,
    iconBg: "bg-green-50 text-green-600",
    value: "text-green-600",
  },

  purple: {
    icon: FiActivity,
    iconBg: "bg-purple-50 text-purple-600",
    value: "text-purple-600",
  },
};

export default function SummaryCard({
  title,
  value,
  subtitle,
  tone = "blue",
  icon,
}) {
  const config = TONES[tone] || TONES.blue;
  const Icon = icon || config.icon;

  return (
    <div
      className="
        group
        bg-white
        border
        border-gray-200
        rounded-2xl
        p-4
        sm:p-5
        shadow-sm
        transition-all
        duration-300
        ease-out
        hover:-translate-y-1
        hover:shadow-lg
        min-w-0
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`
            w-10
            h-10
            shrink-0
            rounded-xl
            flex
            items-center
            justify-center
            ${config.iconBg}
          `}
        >
          <Icon size={20} />
        </div>

        <div className="text-right min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {title}
          </p>

          <p
            className={`
              text-2xl
              sm:text-3xl
              font-bold
              mt-1
              ${config.value}
            `}
          >
            {value}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 truncate">
        {subtitle}
      </p>
    </div>
  );
}