import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ci_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    // Globally unwrap standard { success: true, data } payloads
    if (res.data && res.data.success !== undefined && res.data.data !== undefined) {
      return res.data.data;
    }
    // Fallback for older endpoints or non-JSON responses
    return res.data;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ci_token');
      window.location.href = '/login';
    }
    // Extract standard error messages from { success: false, message: ... }
    if (err.response?.data?.message) {
      err.message = err.response.data.message;
    } else if (err.response?.data?.error) {
      err.message = err.response.data.error;
    }
    return Promise.reject(err);
  }
);

export default api;
