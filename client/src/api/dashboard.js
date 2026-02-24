import http from './http';

export function fetchDashboardStats() {
  return http.get('/dashboard/stats');
}
