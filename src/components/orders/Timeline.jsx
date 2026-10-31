import { formatTime, TIMELINE_DOT } from '../../lib/format';

export default function Timeline({ events }) {
  return (
    <ol className="relative border-l border-gray-200 ml-2 space-y-4">
      {events.map((e, i) => (
        <li key={i} className="ml-5">
          <span className={`absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ${TIMELINE_DOT[e.type] || 'bg-steel-light'}`} />
          <p className="text-sm font-medium text-gray-800">{e.title}</p>
          {e.detail && <p className="text-xs text-steel">{e.detail}</p>}
          <p className="text-xs text-steel-light">{formatTime(e.at)}</p>
        </li>
      ))}
    </ol>
  );
}
