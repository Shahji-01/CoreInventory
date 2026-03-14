import api from './api';
export const getDeliveries = (params) => api.get('/deliveries', { params });
export const createDelivery = (data) => api.post('/deliveries', data);
export const validateDelivery = (id) => api.post(`/deliveries/${id}/validate`);
export const cancelDelivery = (id) => api.post(`/deliveries/${id}/cancel`);
export const getDelivery = (id) => api.get(`/deliveries/${id}`);
export const updateDelivery = (id, data) => api.put(`/deliveries/${id}`, data);
export const deleteDelivery = (id) => api.delete(`/deliveries/${id}`);
