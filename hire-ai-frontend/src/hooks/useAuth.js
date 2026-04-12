import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  return useContext(AuthContext);
};
// Re-export the hook from AuthContext to maintain existing import paths across the app
export { useAuth } from '../contexts/AuthContext';