import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const api = axios.create({ baseURL: BASE_URL });

export const getEquipment = () => api.get('/equipment');
export const getEquipmentById = (id) => api.get(`/equipment/${id}`);
export const createEquipment = (data) => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);
export const updateWarranty = (id, data) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`);

export const getRequests = () => api.get('/requests');
export const createRequest = (data) => api.post('/requests', data);
export const updateRequest = (id, data) => api.put(`/requests/${id}`, data);
export const deleteRequest = (id) => api.delete(`/requests/${id}`);

export const getOrders = () => api.get('/orders');
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const getInvoices = () => api.get('/invoices');
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data);

export const getEquipmentHistory = (equipment_no) =>
  api.get('/reports/equipment-history', equipment_no ? { params: { equipment_no } } : {});
export const getPMDueReport = () => api.get('/reports/pm-due');
export const getCallCategoryVisits = (params) => api.get('/reports/call-categories', { params });
export const getCallCategoryDetails = (category, params) =>
  api.get('/reports/call-categories/details', { params: { category, ...params } });

export const getMonthlyAmcVisits = (month, year) => 
  api.get('/amc/monthly-visits', { params: { month, year } });
