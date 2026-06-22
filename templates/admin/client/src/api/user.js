import http from './http';

export function fetchUsers(params) {
  return http.get('/user', { params });
}

export function createUser(data) {
  return http.post('/user', data);
}

export function updateUser(id, data) {
  return http.put(`/user/${id}`, data);
}

export function deleteUser(id) {
  return http.delete(`/user/${id}`);
}
