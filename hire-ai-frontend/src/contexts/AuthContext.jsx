import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const { 
    user: auth0User, 
    isAuthenticated, 
    isLoading: isAuth0Loading, 
    loginWithRedirect, 
    logout: auth0Logout 
  } = useAuth0();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated && auth0User) {
        // Check if this was a fresh signup attempt
        const isSignupIntent = localStorage.getItem('auth0_signup_intent') === 'true';

        setUser({
          id: auth0User.sub,
          name: auth0User.name,
          email: auth0User.email,
          picture: auth0User.picture,
          role: isSignupIntent ? null : 'aspirant', // If signup, role is null until selected
          needsRole: isSignupIntent, // Triggers the modal
          source: 'auth0'
        });
        setLoading(false);
        return;
      }

      // Manual JWT fallback
      const storedUser = localStorage.getItem('hireai_user');
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } 
        catch (error) { localStorage.removeItem('hireai_user'); }
      }
      setLoading(false);
    };

    if (!isAuth0Loading) checkSession();
  }, [isAuthenticated, auth0User, isAuth0Loading]);

  // --- FORCE DIRECT GOOGLE LOGIN ---
  const loginWithGoogle = (options = {}) => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2', // Bypasses Auth0 login screen
        ...options
      }
    });
  };

  // --- MANUAL AUTH METHODS ---
  const manualLogin = async (email, password) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');

    const userData = { ...data.user, source: 'manual' };
    localStorage.setItem('hireai_user', JSON.stringify(userData));
    localStorage.setItem('hireai_token', data.token);
    setUser(userData);
    return userData;
  };

  const manualSignup = async (formData) => {
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Signup failed');

    const userData = { ...data.user, source: 'manual' };
    localStorage.setItem('hireai_user', JSON.stringify(userData));
    localStorage.setItem('hireai_token', data.token);
    setUser(userData);
    return userData;
  };

  // --- UNIVERSAL LOGOUT ---
  const logout = () => {
    localStorage.removeItem('hireai_user');
    localStorage.removeItem('hireai_token');
    localStorage.removeItem('auth0_signup_intent');
    
    if (user?.source === 'auth0' || isAuthenticated) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    } else {
      setUser(null);
      window.location.href = '/login'; 
    }
  };

  // --- ROLE SELECTION LOGIC ---
  const completeAuth0Signup = (selectedRole) => {
    localStorage.removeItem('auth0_signup_intent');
    setUser(prev => ({ ...prev, role: selectedRole, needsRole: false }));
    // Future: Here you could make a fetch() call to save the Auth0 user to your custom MongoDB!
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, isAuthenticated: isAuthenticated || !!user, 
      loginWithGoogle, manualLogin, manualSignup, logout 
    }}>
      {!loading && (
        <>
          {children}
          
          {/* THE ROLE SELECTION INTERCEPTOR MODAL */}
          {user?.needsRole && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-200">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Complete your profile</h2>
                <p className="text-gray-500 mt-2 mb-8">How are you planning to use HireAI?</p>
                
                <div className="space-y-3">
                  <button onClick={() => completeAuth0Signup('aspirant')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors">
                    I am a Job Seeker
                  </button>
                  <button onClick={() => completeAuth0Signup('recruiter')} className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors">
                    I am a Recruiter
                  </button>
                </div>
                
                <button onClick={logout} className="mt-6 text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
                  Cancel and Sign Out
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AuthContext.Provider>
  );
};