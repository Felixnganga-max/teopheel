// frontend/src/components/layout/Layout.jsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const TITLES = {
  dashboard: 'Dashboard',
  sales: 'New Sale',
  orders: 'Orders',
  messages: 'Messages',
  inventory: 'Inventory',
  invoices: 'Invoices',
  customers: 'Customers',
  products: 'Gas Brands',
  locations: 'Locations',
};

export default function Layout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { pathname } = useLocation(); // title now updates on navigation

  const closeDrawer = () => setIsDrawerOpen(false);
  const [section, sub] = pathname.split('/').filter(Boolean);
  const title = section === 'orders' && sub ? 'Order details' : TITLES[section] || 'Dashboard';

  return (
    <div className="min-h-screen bg-card">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {isDrawerOpen && <div className="fixed inset-0 bg-shell/60 backdrop-blur-sm z-40 lg:hidden" onClick={closeDrawer} />}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-shell z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={closeDrawer} />
      </div>

      <main className="lg:ml-64 min-h-screen">
        <TopBar title={title} onMenuClick={() => setIsDrawerOpen(true)} />
        <Outlet />
      </main>
    </div>
  );
}
