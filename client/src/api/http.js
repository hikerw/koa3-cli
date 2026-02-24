import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 10000
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (resp) => {
    const body = resp.data;
    // 后端统一包装为 { success, data, message }，成功时解包为 data
    if (body && body.success === true && 'data' in body) return body.data;
    return body;
  },
  (error) => {
    const message = error?.response?.data?.message || error.message || '请求失败';
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(new Error(message));
  }
);

export default instance;

