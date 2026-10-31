import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from './Button';

export default function Pager({ page, limit, total = 0, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-steel-light">
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ArrowLeft className="w-3.5 h-3.5" /> Prev
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
