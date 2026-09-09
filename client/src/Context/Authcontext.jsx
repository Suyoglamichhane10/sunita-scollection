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

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      const newToken = data.token;
      const newRequestId = ++requestIdRef.current;

      setToken(newToken);
      localStorage.setItem('token', newToken);

      const freshUser = await fetchCurrentUser();

      if (newRequestId === requestIdRef.current) {
        setUser(freshUser);
      }

      toast.success('Welcome back!');
      return { success: true, user: freshUser };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const loginWithRoleCheck = async (credentials, expectedRole) => {
    const result = await login(credentials);
    if (result.success && result.user) {
      const role = result.user.role || 'customer';
      if (expectedRole && role !== expectedRole) {
        toast.error('Invalid credentials');
        return { success: false, error: 'Invalid credentials' };
      }
    }
    return result;
  };

  const loginWithToken = async (token) => {
    try {
      console.log('🔵 loginWithToken called with token:', token ? 'Present' : 'Missing');

      // Store token in localStorage
      localStorage.setItem('token', token);
      console.log('✅ Token stored in localStorage');

      // Update api default header (also handled by request interceptor, but set explicitly)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✅ Authorization header set on api');

      // Update state
      setToken(token);
      console.log('✅ Token state updated');

      // Fetch user data
      console.log('🔄 Fetching user data...');
      const freshUser = await fetchCurrentUser();
      console.log('✅ User data received:', freshUser);

      // Update user state
      setUser(freshUser);
      console.log('✅ User state updated');

      toast.success('Welcome! You are now logged in.');
      return { success: true, user: freshUser };
    } catch (error) {
      console.error('❌ loginWithToken error:', error.response?.data || error.message);

      // Clean up on error
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);

      toast.error('Failed to authenticate. Please try again.');
      return { success: false, error: error.response?.data?.message || error.message };
    }
  };

  const googleLogin = async (token) => {
    return loginWithToken(token);
  };

  const logout = () => {
    ++requestIdRef.current;
    setUser(null);
    setToken(null);
    setLoading(false);
    localStorage.removeItem('token');
    localStorage.removeItem('guest_cart');
    localStorage.removeItem('cart');
    localStorage.removeItem('chat_history');
    localStorage.removeItem('rememberedEmail');
    delete api.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    const freshUser = await fetchCurrentUser();
    if (freshUser) setUser(freshUser);
    return freshUser;
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
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDeliveryPerson: user?.isDeliveryPerson,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};