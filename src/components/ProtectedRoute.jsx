import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function OwnerOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'owner') return <Navigate to="/sales" replace />;
  return children;
}
