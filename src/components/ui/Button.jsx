export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const variants = {
    primary: 'bg-accent text-shell hover:bg-accent-hover shadow-sm shadow-accent/20',
    secondary: 'bg-white text-steel border border-gray-200 hover:bg-card-dark',
    danger: 'bg-danger text-white hover:bg-red-600',
    ghost: 'text-steel hover:bg-card-dark',
    outline: 'border border-accent text-accent hover:bg-accent/10',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
