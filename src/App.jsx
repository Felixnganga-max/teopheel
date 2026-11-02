// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import Toast from './components/ui/Toast';
import { Spinner } from './components/ui/Feedback';
import { OwnerOnly } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Messages from './pages/Messages';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Products from './pages/Products';
import MixBrands from './pages/MixBrands';
import Locations from './pages/Locations';

function ProtectedLayout() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-shell flex items-center justify-center"><Spinner label="Loading…" className="text-steel-light" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to={user.role === 'owner' ? '/dashboard' : '/sales'} replace />} />
        <Route path="dashboard" element={<OwnerOnly><Dashboard /></OwnerOnly>} />
        <Route path="sales" element={<Sales />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="messages" element={<Messages />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="customers" element={<Customers />} />
        <Route path="products" element={<OwnerOnly><Products /></OwnerOnly>} />
        <Route path="mix-brands" element={<OwnerOnly><MixBrands /></OwnerOnly>} />
        <Route path="locations" element={<OwnerOnly><Locations /></OwnerOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Toast />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
