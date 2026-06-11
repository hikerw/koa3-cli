import http from '../http';

/** 获取当前文件存储配置，用于后管配置页回显本地或七牛云上传目标。 */
export function fetchStorageSetting() {
  return http.get('/system/storage');
}

/** 保存文件存储配置；启用七牛云时后端会校验必要密钥和空间信息。 */
export function saveStorageSetting(data) {
  return http.put('/system/storage', data);
}
