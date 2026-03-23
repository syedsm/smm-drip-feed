// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Panels ───────────────────────────────────────────────────────────────────
export const getPanels = () => api.get('/panels').then(r => r.data);
export const getPanel = (id) => api.get(`/panels/${id}`).then(r => r.data);
export const createPanel = (data) => api.post('/panels', data).then(r => r.data);
export const updatePanel = (id, data) => api.put(`/panels/${id}`, data).then(r => r.data);
export const deletePanel = (id) => api.delete(`/panels/${id}`).then(r => r.data);

// ─── Templates ────────────────────────────────────────────────────────────────
export const getTemplates = () => api.get('/templates').then(r => r.data);
export const getTemplate = (id) => api.get(`/templates/${id}`).then(r => r.data);
export const createTemplate = (data) => api.post('/templates', data).then(r => r.data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data).then(r => r.data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`).then(r => r.data);

// ─── Orders ───────────────────────────────────────────────────────────────────
export const getOrders = (params) => api.get('/orders', { params }).then(r => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then(r => r.data);
export const createOrder = (data) => api.post('/orders', data).then(r => r.data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`).then(r => r.data);
export const getOrderReport = (id) => api.get(`/orders/${id}/report`).then(r => r.data);

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getStats = () => api.get('/stats').then(r => r.data);

// ─── Health ───────────────────────────────────────────────────────────────────
export const healthCheck = () => api.get('/health').then(r => r.data);

export default api;
