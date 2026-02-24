import http from '../http';

export function fetchSystemUsers(params) {
  return http.get('/system/users', { params });
}

export function getSystemUser(id) {
  return http.get(`/system/users/${id}`);
}

export function createSystemUser(data) {
  return http.post('/system/users', data);
}

export function updateSystemUser(id, data) {
  return http.put(`/system/users/${id}`, data);
}

export function deleteSystemUser(id) {
  return http.delete(`/system/users/${id}`);
}
