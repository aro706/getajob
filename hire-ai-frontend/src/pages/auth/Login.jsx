import { useAuth } from '../../hooks/useAuth';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Users, Terminal } from 'lucide-react';

const Login = () => {
  const { setAppRole, isAuthenticated, user } = useAuth();
  const { loginWithRedirect, isLoading } = useAuth0();
  const navigate = useNavigate();

  // Automatically route the user once Auth0 returns them to the app
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(`/${user.role}/dashboard`);
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (role) => {
    // 1. Save the role intention
    setAppRole(role);
    // 2. Fire Auth0's Universal Login
    await loginWithRedirect({
      appState: { targetUrl: `/${role}/dashboard` }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-950 text-sky-400 font-mono text-sm tracking-widest uppercase">
        Initializing Authentication Protocol...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-950 relative overflow-hidden font-sans">
      
      {/* Background AI Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-sky-500/10 blur-[120px] pointer-events-none rounded-full -translate-y-1/2"></div>
      
      <div className="bg-blue-900/50 backdrop-blur-xl p-10 rounded-2xl border border-blue-800 shadow-2xl text-center relative z-10 max-w-lg w-full mx-4">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-950 border border-blue-800 rounded-2xl flex items-center justify-center shadow-inner">
            <Cpu className="text-sky-400 w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Copilot Access</h1>
        <p className="text-blue-300 text-sm mb-10 font-mono">Select your operational domain.</p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => handleLogin('aspirant')}
            className="group flex items-center justify-between bg-blue-950/50 border border-blue-800 text-blue-100 px-6 py-4 rounded-xl font-medium hover:bg-sky-500/10 hover:border-sky-500/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Terminal className="text-blue-400 group-hover:text-sky-400 transition-colors" size={20} />
              <span>Authenticate as Aspirant</span>
            </div>
            <span className="text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </button>
          
          <button 
            onClick={() => handleLogin('recruiter')}
            className="group flex items-center justify-between bg-blue-950/50 border border-blue-800 text-blue-100 px-6 py-4 rounded-xl font-medium hover:bg-sky-500/10 hover:border-sky-500/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Users className="text-blue-400 group-hover:text-sky-400 transition-colors" size={20} />
              <span>Authenticate as Recruiter</span>
            </div>
            <span className="text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;