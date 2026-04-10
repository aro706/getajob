import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/auth/Login';
import AspirantDashboard from './pages/aspirant/Dashboard';
import ResultsDashboard from './pages/aspirant/ResultsDashboard'; // <-- 1. IMPORT ADDED
import RecruiterDashboard from './pages/recruiter/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Aspirant Routes */}
          <Route element={<ProtectedRoute allowedRoles={['aspirant']} />}>
            <Route path="/aspirant/dashboard" element={<AspirantDashboard />} />
            {/* 2. ROUTE ADDED HERE 👇 */}
            <Route path="/aspirant/results" element={<ResultsDashboard />} /> 
          </Route>

          {/* Protected Recruiter Routes */}
          <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          </Route>

          {/* Default Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;