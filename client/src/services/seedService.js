import api from './api';
export const seedDemo = () => api.post('/seed/demo');
export const clearDemo = () => api.post('/seed/clear');
