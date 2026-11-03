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
    api.getProfile()
      .then(res => {
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('spendpilot_user', JSON.stringify(res.data));
        } else {
          setUser(null);
          localStorage.removeItem('spendpilot_user');
        }
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('spendpilot_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const loginUser = (tokenOrUser, maybeUser) => {
    // Auth token is securely handled via server-issued HttpOnly cookies.
    // Only non-sensitive user display metadata is kept in web storage.
    const userData = maybeUser || tokenOrUser;
    if (userData) {
      localStorage.setItem('spendpilot_user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logoutUser = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore network errors on logout
    }
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
