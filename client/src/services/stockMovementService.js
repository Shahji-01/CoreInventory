import api from './api';
export const getStockMovements = (params) => api.get('/stock-movements', { params });
