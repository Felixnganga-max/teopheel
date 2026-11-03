import { useEffect } from 'react';
import { X } from 'lucide-react';

// Bottom sheet on phones (thumb reach, Save button always visible), centered dialog on larger screens.
// The body scrolls, the header stays put, and `footer` stays pinned at the bottom.
export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // stop the page scrolling behind the sheet
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-shell/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white w-full ${sizes[size]} max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl animate-fade-in`}>
        <div className="sm:hidden mx-auto mt-2.5 h-1 w-10 rounded-full bg-gray-200 shrink-0" />
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 -mr-2 rounded-lg hover:bg-card-dark transition-colors cursor-pointer">
            <X className="w-5 h-5 text-steel" />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto overscroll-contain flex-1">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-gray-100 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
