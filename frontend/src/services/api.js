import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updatePassword: (data) => API.put('/auth/password', data),
};

// ─── User ────────────────────────────────────────────────────────────────────
export const userAPI = {
  updateProfile: (data) => API.put('/users/profile', data),
  getContacts: () => API.get('/users/contacts'),
  addContact: (data) => API.post('/users/contacts', data),
  updateContact: (id, data) => API.put(`/users/contacts/${id}`, data),
  deleteContact: (id) => API.delete(`/users/contacts/${id}`),
  updateLocation: (data) => API.post('/users/location', data),
  getLocationHistory: () => API.get('/users/location-history'),
};

// ─── SOS ─────────────────────────────────────────────────────────────────────
export const sosAPI = {
  trigger: (data) => API.post('/sos/trigger', data),
  getActive: () => API.get('/sos/active'),
  getHistory: (params) => API.get('/sos/history', { params }),
  getAlert: (id) => API.get(`/sos/${id}`),
  updateLocation: (id, data) => API.put(`/sos/${id}/location`, data),
  resolve: (id, data) => API.put(`/sos/${id}/resolve`, data),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  getRooms: () => API.get('/chat/rooms'),
  getMessages: (room, params) => API.get(`/chat/${room}`, { params }),
  sendMessage: (room, data) => API.post(`/chat/${room}`, data),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getUsers: (params) => API.get('/admin/users', { params }),
  toggleUser: (id) => API.put(`/admin/users/${id}/toggle`),
  getAlerts: (params) => API.get('/admin/alerts', { params }),
  resolveAlert: (id, data) => API.put(`/admin/alerts/${id}/resolve`, data),
};

export default API;
