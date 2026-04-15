import { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the Context
export const AuthContext = createContext();

// 2. Export the custom hook so Login.jsx can use it!
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. The Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TEMPORARY BYPASS: Automatically mock a logged-in session for UI work
    const mockUser = {
      id: "123",
      name: "Test User",
      role: "aspirant"
    };
    
    // Comment out setUser(mockUser) later if you want to test the actual login screen!
    setUser(mockUser); 
    setLoading(false);
  }, []);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};