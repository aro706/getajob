import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Adjust path if necessary

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  // If there's no user, kick them to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user doesn't have the right one, kick them to login
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // Allow them through
  return <Outlet />;
};

export default ProtectedRoute;