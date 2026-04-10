import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate checking for a token on load
  useEffect(() => {
    const storedRole = localStorage.getItem('hire_ai_role');
    if (storedRole) {
      setUser({ role: storedRole, name: 'Test User' });
    }
    setLoading(false);
  }, []);

  const login = (role) => {
    localStorage.setItem('hire_ai_role', role);
    setUser({ role, name: 'Test User' });
  };

  const logout = () => {
    localStorage.removeItem('hire_ai_role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};