import api from './api';
export const getTransfers = (params) => api.get('/transfers', { params });
export const createTransfer = (data) => api.post('/transfers', data);
export const validateTransfer = (id) => api.post(`/transfers/${id}/validate`);
export const cancelTransfer = (id) => api.post(`/transfers/${id}/cancel`);
export const getTransfer = (id) => api.get(`/transfers/${id}`);
export const updateTransfer = (id, data) => api.put(`/transfers/${id}`, data);
export const deleteTransfer = (id) => api.delete(`/transfers/${id}`);
