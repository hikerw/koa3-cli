import http from '../http';

export function fetchRoles(params) {
  return http.get('/system/roles', { params });
}

export function fetchRolesAll() {
  return http.get('/system/roles/all');
}

export function getRole(id) {
  return http.get(`/system/roles/${id}`);
}

export function createRole(data) {
  return http.post('/system/roles', data);
}

export function updateRole(id, data) {
  return http.put(`/system/roles/${id}`, data);
}

export function deleteRole(id) {
  return http.delete(`/system/roles/${id}`);
}
