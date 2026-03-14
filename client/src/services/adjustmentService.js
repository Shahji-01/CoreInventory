import api from './api';
export const getAdjustments = (params) => api.get('/adjustments', { params });
export const createAdjustment = (data) => api.post('/adjustments', data);
export const validateAdjustment = (id) => api.post(`/adjustments/${id}/validate`);
