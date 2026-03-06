import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('novabank_token');
    const savedUser = localStorage.getItem('novabank_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      api.get('/account/profile').then(res => {
        setUser(res.data.user);
        localStorage.setItem('novabank_user', JSON.stringify(res.data.user));
      }).catch(() => {
        localStorage.removeItem('novabank_token');
        localStorage.removeItem('novabank_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('novabank_token', res.data.token);
    localStorage.setItem('novabank_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('novabank_token', res.data.token);
    localStorage.setItem('novabank_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('novabank_token');
    localStorage.removeItem('novabank_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/account/profile');
      setUser(res.data.user);
      localStorage.setItem('novabank_user', JSON.stringify(res.data.user));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
