export default function StatCard({ title, value, subtitle, icon: Icon, trend, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-fade-in ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-steel text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-steel-light text-xs mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend.positive ? 'text-success' : 'text-danger'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-accent" />
          </div>
        )}
      </div>
    </div>
  );
}
