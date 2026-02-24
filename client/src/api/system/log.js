import http from '../http';

export function fetchLogs(params) {
  return http.get('/system/logs', { params });
}
