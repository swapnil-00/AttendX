import axios from 'axios';
import { showToast } from './components/Toast';

// In production (Vercel), set VITE_API_URL to your backend URL (e.g. Railway/Render).
// In development, leave unset — Vite proxy handles /api → localhost:3001.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Global error handling — surface server/network errors as toasts
api.interceptors.response.use(
  res => res,
  err => {
    const serverMsg = err?.response?.data?.error;
    const msg =
      serverMsg ||
      (err?.message === 'Network Error' ? 'Cannot reach server — is it running?' : null) ||
      'Something went wrong';
    showToast(msg, 'error');
    return Promise.reject(err);
  }
);

export const getPersons       = () => api.get('/api/persons').then(r => r.data);
export const addPerson        = (name) => api.post('/api/persons', { name }).then(r => r.data);
export const deletePerson     = (id) => api.delete(`/api/persons/${id}`).then(r => r.data);
export const getAttendance    = (month) => api.get('/api/attendance', { params: { month } }).then(r => r.data);
export const upsertAttendance = (person_id, date, status) =>
  api.put('/api/attendance', { person_id, date, status }).then(r => r.data);
