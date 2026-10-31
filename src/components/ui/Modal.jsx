import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-shell/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} animate-fade-in`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-card-dark transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-steel" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
