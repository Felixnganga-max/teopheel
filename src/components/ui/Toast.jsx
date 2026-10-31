// frontend/src/components/ui/Toast.jsx
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  warning: 'bg-warning text-white',
  info: 'bg-info text-white',
};

export default function Toast() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map(({ id, type, message, persistent }) => {
        const Icon = icons[type] || Info;
        return (
          <div
            key={id}
            className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-xl shadow-lg transition-all animate-slide-in ${colors[type]}`}
          >
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{message}</p>
            {persistent && (
              <button
                onClick={() => dismissToast(id)}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}