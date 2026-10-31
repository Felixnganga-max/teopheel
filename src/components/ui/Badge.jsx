const variants = {
  success: 'bg-green-50 text-success border border-green-200',
  warning: 'bg-yellow-50 text-warning border border-yellow-200',
  danger: 'bg-red-50 text-danger border border-red-200',
  info: 'bg-blue-50 text-info border border-blue-200',
  default: 'bg-card-dark text-steel border border-gray-200',
  accent: 'bg-accent/10 text-accent border border-accent/20',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
