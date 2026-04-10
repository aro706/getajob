import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dune-dark text-dune-sand font-cinzel text-2xl animate-pulse">
        Accessing Guild Records...
      </div>
    );
  }

  // Not logged in? Send to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role? Send to an unauthorized message (or back to their dashboard).
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dune-dark text-dune-spice font-montserrat">
        <h1 className="text-4xl font-cinzel mb-4">Access Denied</h1>
        <p>Your genetics do not permit access to this sector.</p>
      </div>
    );
  }

  // Authorized! Render the child routes.
  return <Outlet />;
};

export default ProtectedRoute;