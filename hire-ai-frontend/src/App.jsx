import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/auth/Login';
import AspirantDashboard from './pages/aspirant/Dashboard';
import ResultsDashboard from './pages/aspirant/ResultsDashboard';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import Signup from './pages/auth/Signup';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute allowedRoles={['aspirant']} />}>
            <Route path="/aspirant/dashboard" element={<AspirantDashboard />} />
            <Route path="/aspirant/results" element={<ResultsDashboard />} /> 
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          </Route>

          {/* Fallback correctly kicks unauthenticated traffic back to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;