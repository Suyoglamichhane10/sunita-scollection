import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../Services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const requestIdRef = useRef(0);

  // Set api default header
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      return data.user;
    } catch (error) {
      console.error('Failed to load user:', error);
      if (error.response?.status === 401) {
        logout();
      }
      return null;
    }
  };

  // Load user on mount or when token changes
  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const currentRequestId = ++requestIdRef.current;

      if (!token) {
        if (active) setUser(null);
        if (active) setLoading(false);
        return;
      }

      if (active) setLoading(true);
      const freshUser = await fetchCurrentUser();

      // Only apply the response if no newer request has been started
      if (active && currentRequestId === requestIdRef.current) {
        setUser(freshUser);
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [token]);

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const establishSession = async (newToken) => {
    localStorage.setItem('token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    const newRequestId = ++requestIdRef.current;
    setToken(newToken);

    const freshUser = await fetchCurrentUser();

    if (newRequestId === requestIdRef.current) {
      setUser(freshUser);
    }

    return freshUser;
  };

  const clearSession = () => {
    ++requestIdRef.current;
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      const freshUser = await establishSession(data.token);
      toast.success('Welcome back!', { id: 'welcome' });
      return { success: true, user: freshUser };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const loginWithToken = async (newToken) => {
    try {
      const freshUser = await establishSession(newToken);
      toast.success('Welcome back!', { id: 'welcome' });
      return { success: true, user: freshUser };
    } catch (error) {
      clearSession();
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const googleLogin = async (newToken) => {
    return loginWithToken(newToken);
  };

  const clearGuestStorage = () => {
    ['guest_cart', 'cart', 'chat_history', 'rememberedEmail'].forEach((key) =>
      localStorage.removeItem(key)
    );
  };

  const logout = () => {
    clearSession();
    clearGuestStorage();
    setLoading(false);
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    const freshUser = await fetchCurrentUser();
    if (freshUser) setUser(freshUser);
    return freshUser;
  };

  const updateUser = (partialUser) => {
    setUser((prev) => (prev ? { ...prev, ...partialUser } : null));
  };

  const deleteAccount = async () => {
    clearSession();
    clearGuestStorage();
  };

  const value = {
    user,
    setUser,
    loading,
    token,
    register,
    login,
    logout,
    refreshUser,
    loginWithToken,
    googleLogin,
    updateUser,
    deleteAccount,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDeliveryPerson: user?.isDeliveryPerson,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};