export default function Field({ label, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-steel-light mt-1">{hint}</p>}
    </div>
  );
}
