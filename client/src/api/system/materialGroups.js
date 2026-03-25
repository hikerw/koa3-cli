import http from '../http';

export function fetchMaterialGroups() {
  return http.get('/material-groups');
}

export function createMaterialGroup(data) {
  return http.post('/material-groups', data);
}

export function updateMaterialGroup(id, data) {
  return http.put(`/material-groups/${id}`, data);
}

export function deleteMaterialGroup(id) {
  return http.delete(`/material-groups/${id}`);
}
