import { Loader2, AlertCircle } from 'lucide-react';
import Button from './Button';

export function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-16 text-steel ${className}`}>
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertCircle className="w-10 h-10 text-danger/70" />
      <p className="text-sm text-steel">{error.message || 'Something went wrong'}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="text-center py-16 text-steel">
      {Icon && <Icon className="w-12 h-12 mx-auto mb-3 opacity-30" />}
      <p>{message}</p>
    </div>
  );
}
