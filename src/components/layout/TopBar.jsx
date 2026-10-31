// frontend/src/components/layout/TopBar.jsx
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({ title, subtitle, onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-card-dark px-4 sm:px-8 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-card-dark transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5 text-steel" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight truncate">{title}</h2>
            {subtitle && <p className="text-steel text-sm mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
        
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs font-medium text-accent">{user?.title}</span>
          </div>
        </div>
      </div>
    </header>
  );
}