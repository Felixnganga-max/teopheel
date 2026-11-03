export default function StatCard({ title, value, subtitle, icon: Icon, trend, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-fade-in ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-steel text-xs sm:text-sm font-medium">{title}</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1.5 sm:mt-2 tracking-tight tabular-nums">{value}</p>
          {subtitle && <p className="text-steel-light text-xs mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend.positive ? 'text-success' : 'text-danger'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="hidden sm:flex w-11 h-11 rounded-xl bg-accent/10 items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-accent" />
          </div>
        )}
      </div>
    </div>
  );
}
