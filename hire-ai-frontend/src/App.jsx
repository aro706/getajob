import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AspirantDashboard from './pages/aspirant/Dashboard';
import ResultsDashboard from './pages/aspirant/ResultsDashboard';
import Roadmap from './pages/aspirant/Roadmap';
import RecruiterDashboard from './pages/recruiter/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Aspirant Routes */}
          <Route element={<ProtectedRoute allowedRoles={['aspirant']} />}>
            <Route path="/aspirant/dashboard" element={<AspirantDashboard />} />
            <Route path="/aspirant/results" element={<ResultsDashboard />} />
            <Route path="/aspirant/roadmap" element={<Roadmap />} />
          </Route>

          {/* Protected Recruiter Routes */}
          <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          </Route>

          {/* Fallback Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;