import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe as getMeApi } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('ci_token');
    if (token) {
      getMeApi()
        .then(res => setUser(res))
        .catch(() => localStorage.removeItem('ci_token'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (creds) => {
    const res = await loginApi(creds);
    localStorage.setItem('ci_token', res.token);
    setUser(res.user);
    navigate('/dashboard');
    return res;
  };

  const register = async (data) => {
    const res = await registerApi(data);
    localStorage.setItem('ci_token', res.token);
    setUser(res.user);
    navigate('/dashboard');
    return res;
  };

  const logout = () => {
    localStorage.removeItem('ci_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
