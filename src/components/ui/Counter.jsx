import { Minus, Plus } from 'lucide-react';

// Big thumb-sized − / + with a number that can also be typed. Used where staff count cylinders.
export default function Counter({ value, onChange, label, min = 0, max = 5000, tone = 'accent' }) {
  const n = Number(value) || 0;
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const ring = tone === 'green' ? 'focus-within:border-[#2A8F6E]' : 'focus-within:border-accent';
  return (
    <div className="flex flex-col items-stretch gap-1">
      {label && <span className="text-xs font-medium text-steel text-center">{label}</span>}
      <div className={`flex items-center rounded-xl border border-gray-200 bg-white ${ring} overflow-hidden`}>
        <button type="button" aria-label={`Less ${label || ''}`} disabled={n <= min} onClick={() => onChange(clamp(n - 1))}
          className="w-12 h-12 flex items-center justify-center text-steel hover:bg-card-dark active:bg-card-dark disabled:opacity-30 cursor-pointer shrink-0">
          <Minus className="w-5 h-5" />
        </button>
        <input
          type="number" inputMode="numeric" min={min} max={max} value={n === 0 ? '' : n} placeholder="0"
          onChange={(e) => onChange(clamp(Math.floor(Number(e.target.value) || 0)))}
          className="w-full min-w-0 h-12 text-center text-lg font-semibold text-gray-900 tabular-nums bg-transparent outline-none placeholder:text-gray-300"
        />
        <button type="button" aria-label={`More ${label || ''}`} disabled={n >= max} onClick={() => onChange(clamp(n + 1))}
          className="w-12 h-12 flex items-center justify-center text-accent hover:bg-accent/10 active:bg-accent/10 disabled:opacity-30 cursor-pointer shrink-0">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
