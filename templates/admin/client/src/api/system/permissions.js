import http from '../http';

export function fetchPermissions(params) {
  return http.get('/system/permissions', { params });
}

export function fetchPermissionTree() {
  return http.get('/system/permissions/tree');
}

export function getPermission(id) {
  return http.get(`/system/permissions/${id}`);
}

export function createPermission(data) {
  return http.post('/system/permissions', data);
}

export function updatePermission(id, data) {
  return http.put(`/system/permissions/${id}`, data);
}

export function deletePermission(id) {
  return http.delete(`/system/permissions/${id}`);
}
