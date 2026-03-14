import api from './api';
export const getReceipts = (params) => api.get('/receipts', { params });
export const createReceipt = (data) => api.post('/receipts', data);
export const validateReceipt = (id) => api.post(`/receipts/${id}/validate`);
export const cancelReceipt = (id) => api.post(`/receipts/${id}/cancel`);
export const getReceipt = (id) => api.get(`/receipts/${id}`);
export const updateReceipt = (id, data) => api.put(`/receipts/${id}`, data);
export const deleteReceipt = (id) => api.delete(`/receipts/${id}`);
