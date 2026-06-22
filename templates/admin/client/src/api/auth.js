import http from './http';

export function login(data) {
  return http.post('/admin/login', data);
}
