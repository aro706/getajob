import { createContext, useState, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// 1. Keep the context private to this file (Do not export it)
const AuthContext = createContext();

// 2. Export the hook directly from here (Vite allows Hooks + Components)
export const useAuth = () => useContext(AuthContext);

// 3. Export the Provider Component
export const AuthProvider = ({ children }) => {
  const { user: auth0User, isAuthenticated, isLoading, logout: auth0Logout, error } = useAuth0();
  
  const [role, setRole] = useState(() => localStorage.getItem('hire_ai_role'));

  const setAppRole = (selectedRole) => {
    localStorage.setItem('hire_ai_role', selectedRole);
    setRole(selectedRole);
  };

  const logout = () => {
    localStorage.removeItem('hire_ai_role');
    setRole(null);
    auth0Logout({ logoutParams: { returnTo: `${window.location.origin}/login` } });
  };

  return (
    <AuthContext.Provider value={{ 
      user: isAuthenticated ? { ...auth0User, role } : null, 
      isAuthenticated,
      setAppRole, 
      logout, 
      loading: isLoading,
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};