import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteAvatar = async () => {
  const { data } = await api.delete('/users/avatar');
  return data;
};

export const uploadUserAvatar = async (userId, file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.post(`/users/${userId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteUserAvatar = async (userId) => {
  const { data } = await api.delete(`/users/${userId}/avatar`);
  return data;
};

export const getUserAvatar = async (userId) => {
  const { data } = await api.get(`/users/${userId}/avatar`);
  return data;
};

export default api;
