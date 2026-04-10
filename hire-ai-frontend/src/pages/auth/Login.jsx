import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dune-dark">
      <div className="bg-dune-stone p-8 rounded-lg border border-dune-tan shadow-2xl text-center">
        <h1 className="text-4xl font-cinzel text-dune-sand mb-8 uppercase tracking-widest">Identify Yourself</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => handleLogin('aspirant')}
            className="bg-dune-sky text-dune-dark px-6 py-3 rounded font-bold hover:opacity-80 transition cursor-pointer">
            I am an Aspirant
          </button>
          <button 
            onClick={() => handleLogin('recruiter')}
            className="bg-dune-spice text-dune-dark px-6 py-3 rounded font-bold hover:opacity-80 transition cursor-pointer">
            I am a Recruiter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;