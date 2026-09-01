import api from './api';

export const getSlides = async () => {
  const { data } = await api.get('/slides');
  return data.slides || [];
};

export const getAdminSlides = async () => {
  const { data } = await api.get('/slides/admin?includeInactive=true');
  return data.slides || [];
};

export const getSlide = async (id) => {
  const { data } = await api.get(`/slides/${id}`);
  return data.slide;
};

export const createSlide = async (formData) => {
  const { data } = await api.post('/slides', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateSlide = async (id, formData) => {
  const { data } = await api.put(`/slides/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteSlide = async (id) => {
  const { data } = await api.delete(`/slides/${id}`);
  return data;
};

export const reorderSlides = async (ordered) => {
  const { data } = await api.put('/slides/reorder', { ordered });
  return data;
};
