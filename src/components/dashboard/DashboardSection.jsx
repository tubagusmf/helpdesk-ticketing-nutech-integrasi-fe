export default function DashboardSection({title, subtitle, icon: Icon, action, children, className = ""}) {
    
  return (
    <section
      className={`
        bg-white
        border
        border-gray-200
        rounded-2xl
        shadow-sm
        overflow-hidden
        min-w-0
        ${className}
      `}
    >
      <div className="px-4 sm:px-5 pt-4 sm:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Icon size={18} />
              </div>
            )}

            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">
                {title}
              </h3>

              {subtitle && (
                <p className="text-xs text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}