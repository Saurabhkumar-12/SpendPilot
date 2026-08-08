import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spendpilot_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('spendpilot_token');
    if (token) {
      api.getProfile()
        .then(res => {
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('spendpilot_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          localStorage.removeItem('spendpilot_token');
          localStorage.removeItem('spendpilot_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('spendpilot_token', token);
    localStorage.setItem('spendpilot_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logoutUser = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore network errors on logout
    }
    localStorage.removeItem('spendpilot_token');
    localStorage.removeItem('spendpilot_user');
    setUser(null);
  };

  const updateUserState = (updated) => {
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem('spendpilot_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, updateUserState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
