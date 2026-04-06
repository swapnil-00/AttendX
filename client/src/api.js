import axios from 'axios';
import { showToast } from './components/Toast';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Fix #8 — Global error handling: surface server/network errors to the user
api.interceptors.response.use(
  res => res,
  err => {
    const msg =
      err?.response?.data?.error ||
      (err?.response?.status === 409 ? err.response.data.error : null) ||
      (err?.message === 'Network Error' ? 'Cannot reach server — is it running?' : null) ||
      (err?.code === 'ECONNABORTED' ? 'Request timeout — server is taking too long' : null) ||
      'Something went wrong';
    showToast(msg, 'error');
    return Promise.reject(err);
  }
);

export const getPersons    = () => api.get('/api/persons').then(r => r.data);
export const addPerson     = (name) => api.post('/api/persons', { name }).then(r => r.data);
export const deletePerson  = (id) => api.delete(`/api/persons/${id}`).then(r => r.data);
export const getAttendance = (month) => api.get('/api/attendance', { params: { month } }).then(r => r.data);
export const upsertAttendance = (person_id, date, status) =>
  api.put('/api/attendance', { person_id, date, status }).then(r => r.data);
