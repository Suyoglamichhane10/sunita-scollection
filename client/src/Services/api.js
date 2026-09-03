import axios from 'axios';

const API_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || import.meta.env.API_URL || '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const is408 = error.response?.status === 408;
    const isNetwork = error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED';
    const retryCount = originalRequest?.__retryCount || 0;

    if ((is408 || isNetwork) && retryCount < 3) {
      originalRequest.__retryCount = retryCount + 1;

      const retryAfter = error.response?.headers?.['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (retryCount + 1);

      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(originalRequest);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
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
