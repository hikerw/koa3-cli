import http from '../http';

export function fetchMaterials(params) {
  return http.get('/materials', { params });
}

export function getMaterial(id) {
  return http.get(`/materials/${id}`);
}

/** multipart：file 为 File 对象；materialId 有值时为替换该素材文件 */
export function checkMaterialHash({ md5, size }) {
  return http.post('/materials/check-hash', { md5, size });
}

/** 秒传：仅当 check-hash hit 或确认库中已有相同文件时使用 */
export function instantMaterial({ md5, size, name, description, tags, materialId, groupId }) {
  return http.post('/materials/instant', {
    md5,
    size,
    name,
    description,
    tags,
    materialId,
    groupId
  });
}

export function uploadMaterial({ file, name, description, tags, materialId, groupId }) {
  const fd = new FormData();
  fd.append('file', file);
  if (name != null && String(name).trim() !== '') fd.append('name', String(name).trim());
  if (description != null && String(description).trim() !== '') fd.append('description', String(description).trim());
  if (tags && tags.length) fd.append('tags', JSON.stringify(tags));
  if (materialId) fd.append('materialId', materialId);
  if (groupId) fd.append('groupId', groupId);
  return http.post('/materials/upload', fd, { timeout: 300000 });
}

export function bulkDeleteMaterials(ids) {
  return http.post('/materials/bulk-delete', { ids });
}

export function bulkSetMaterialsGroup(ids, groupId) {
  return http.post('/materials/bulk-group', { ids, groupId });
}

export function createMaterial(data) {
  return http.post('/materials', data);
}

export function updateMaterial(id, data) {
  return http.put(`/materials/${id}`, data);
}

export function deleteMaterial(id) {
  return http.delete(`/materials/${id}`);
}
