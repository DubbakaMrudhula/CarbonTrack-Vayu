import React, { createContext, useState, useEffect } from 'react';
import authService from '../api/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rehydrate authentication state on mount
    const savedToken = localStorage.getItem('vayu_token');
    const savedUser = localStorage.getItem('vayu_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('vayu_token');
        localStorage.removeItem('vayu_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('vayu_token', data.token);
    localStorage.setItem('vayu_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('vayu_token', data.token);
    localStorage.setItem('vayu_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vayu_token');
    localStorage.removeItem('vayu_user');
  };

  const updateUserSummary = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('vayu_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUserSummary
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

