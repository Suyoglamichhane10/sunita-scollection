import api from './api';

export const getDeliveryDetails = async (orderId) => {
  const { data } = await api.get(`/delivery/${orderId}`);
  return data;
};

export const assignDeliveryPerson = async (orderId, deliveryPersonId) => {
  const { data } = await api.post(`/delivery/${orderId}/assign`, { deliveryPersonId });
  return data;
};

export const updateDeliveryStatus = async (orderId, status, note = '') => {
  const { data } = await api.put(`/delivery/${orderId}/status`, { status, note });
  return data;
};

export const updateLocation = async (orderId, lat, lng) => {
  const { data } = await api.post('/delivery/location', { orderId, lat, lng });
  return data;
};

export const getActiveDeliveries = async () => {
  const { data } = await api.get('/delivery/active');
  return data;
};

export const getNearbyDeliveryPersons = async (lat, lng, radius = 5) => {
  const { data } = await api.get(`/delivery/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  return data;
};

export const trackDelivery = async (orderId) => {
  const { data } = await api.get(`/delivery/tracking/${orderId}`);
  return data;
};

export const getDeliveryHistory = async (orderId) => {
  const { data } = await api.get(`/delivery/history/${orderId}`);
  return data;
};

export const updateEstimatedTime = async (orderId, estimatedDeliveryTime) => {
  const { data } = await api.put(`/delivery/${orderId}/estimated-time`, { estimatedDeliveryTime });
  return data;
};

export const getDeliveryStats = async () => {
  const { data } = await api.get('/delivery/stats');
  return data;
};

export const createDelivery = async (orderId) => {
  const { data } = await api.post('/delivery', { orderId });
  return data;
};

export const deleteDelivery = async (orderId) => {
  const { data } = await api.delete(`/delivery/${orderId}`);
  return data;
};

export default {
  getDeliveryDetails,
  assignDeliveryPerson,
  updateDeliveryStatus,
  updateLocation,
  getActiveDeliveries,
  getNearbyDeliveryPersons,
  trackDelivery,
  getDeliveryHistory,
  updateEstimatedTime,
  getDeliveryStats,
  createDelivery,
  deleteDelivery,
};
